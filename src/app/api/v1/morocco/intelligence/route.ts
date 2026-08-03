import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { analyzeMoroccoIntelligence } from '@/server/lib/morocco-intelligence-analyzer';
import { telegramIntelligenceAnalyzer } from '@/server/lib/telegram-intelligence-analyzer';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { fetchMoroccanRSSNews, convertRSSToNewsArticle } from '@/server/lib/api-clients/rss-client';
import { fetchAllMoroccoLocalData } from '@/server/lib/api-clients/morocco-local-data';
import { fetchMoroccoRoutes } from '@/server/lib/api-clients/morocco-routes-client';
import { withDeadline } from '@/server/lib/route-deadline';

// Netlify/serverless functions kill slow invocations (default 10s, max 26s).
// The heavy external fetching below MUST complete well inside that window,
// otherwise the platform returns a 502 and the dashboard/map show nothing.
// These budgets keep the whole route under ~8s of wall-clock time.
const PHASE1_BUDGET_MS = 5000; // RSS + news APIs + Telegram
const PHASE2_BUDGET_MS = 3000; // Weather + fires + routes
const TOTAL_BUDGET_MS = 8500; // Absolute ceiling including analysis

// In-memory cache: the client polls every 60s, so serving fresh cache is instant
// and only the cold/expired call pays the external-API cost.
const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: any; fetchedAt: number }>();

function emptyPayload(error?: string) {
  return {
    events: [],
    connections: [],
    infrastructure: [],
    weather: [],
    traffic: [],
    commodities: [],
    fires: [],
    routes: [],
    weatherAlerts: [],
    summary: {
      totalEvents: 0,
      criticalEvents: 0,
      activeConnections: 0,
      operationalInfrastructure: 0,
      activeFires: 0,
      weatherAlerts: 0,
      trafficIncidents: 0,
      totalRoutes: 0,
      disruptedRoutes: 0,
      eventsByType: {},
      sources: { rss: 0, api: 0, telegram: 0, total: 0 },
    },
    timestamp: new Date().toISOString(),
    error,
  };
}

export const dynamic = 'force-dynamic'; // Always run dynamically (don't cache)

export async function GET(req: NextRequest) {
  const cacheKey = 'morocco-intelligence';

  // Serve fresh cache instantly
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return ok(cached.data, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
  }

  const payload = await withDeadline(collect(), TOTAL_BUDGET_MS, () => emptyPayload('Timeout'));

  // Never cache empty results (so a transient failure recovers on the next poll)
  if (payload.events.length > 0 || payload.weather.length > 0) {
    cache.set(cacheKey, { data: payload, fetchedAt: Date.now() });
  }

  return ok(payload, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}

async function collect() {
  console.log('[Morocco Intel] ========================================');
  console.log('[Morocco Intel] Fetching comprehensive Morocco intelligence...');
  console.log('[Morocco Intel] ========================================');

  const [rssResult, apiResult, telegramResult] = await withDeadline(
    Promise.allSettled([
      // Strategy 1: Fetch from Moroccan RSS feeds (primary source)
      (async () => {
        console.log('[Morocco Intel] 📰 Strategy 1: Fetching from Moroccan RSS feeds...');
        const articles = await fetchMoroccanRSSNews(4000); // 4s timeout, was 8s
        return articles.map(convertRSSToNewsArticle);
      })(),

      // Strategy 2: Fetch from news APIs with multiple queries
      (async () => {
        console.log('[Morocco Intel] 🌐 Strategy 2: Fetching from news APIs...');
        const searchQueries = [
          'Morocco',
          'Rabat OR Casablanca OR Marrakech',
          'Morocco earthquake OR flood OR storm OR wildfire',
          'Morocco economy OR security OR military',
          'Western Sahara OR Sahrawi',
        ];

        const apiArticles: any[] = [];

        const queryResults = await Promise.allSettled(
          searchQueries.map(query => multiNewsClient.searchNews(query, 15, 'en'))
        );

        queryResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            apiArticles.push(...result.value);
            console.log(`[Morocco Intel]   ✓ API query "${searchQueries[index]}" returned ${result.value.length} articles`);
          } else {
            console.error(`[Morocco Intel]   ✗ API query "${searchQueries[index]}" failed:`, result.reason);
          }
        });

        return apiArticles;
      })(),

      // Strategy 4: Fetch real-time Telegram intelligence
      (async () => {
        console.log('[Morocco Intel] 📱 Strategy 4: Fetching Telegram intelligence...');
        return await telegramIntelligenceAnalyzer.collectMoroccoIntelligence();
      })(),
    ]),
    PHASE1_BUDGET_MS,
    () => [{ status: 'rejected', reason: 'timeout' } as PromiseSettledResult<any>] as any
  );

  const rssConverted = rssResult.status === 'fulfilled' ? rssResult.value : [];
  const apiArticles = apiResult.status === 'fulfilled' ? apiResult.value : [];
  const telegramData = telegramResult.status === 'fulfilled' ? telegramResult.value : { events: [], channels: { monitored: 0, active: 0 } };

  // Combine all sources
  const allArticles = [...rssConverted, ...apiArticles];

  // Remove duplicates by URL
  const uniqueArticles = Array.from(
    new Map(allArticles.map(article => [article.url, article])).values()
  );

  console.log(`[Morocco Intel] 📊 Combined total: ${uniqueArticles.length} unique articles (${rssConverted.length} from RSS, ${apiArticles.length} from APIs)`);

  // Now fetch local data and routes with the articles (bounded)
  const [localDataFinal, routesFinal] = await withDeadline(
    Promise.allSettled([
      (async () => {
        console.log('[Morocco Intel] 🌍 Strategy 3: Fetching local data sources...');
        return await fetchAllMoroccoLocalData(uniqueArticles);
      })(),
      (async () => {
        console.log('[Morocco Intel] 🛣️  Strategy 5: Analyzing routes and logistics...');
        return await fetchMoroccoRoutes(uniqueArticles);
      })(),
    ]),
    PHASE2_BUDGET_MS,
    () => [{ status: 'rejected', reason: 'timeout' } as PromiseSettledResult<any>] as any
  );

  const localData = localDataFinal.status === 'fulfilled' ? localDataFinal.value : { weather: [], traffic: [], commodities: [], fires: [] };
  const routes = routesFinal.status === 'fulfilled' ? routesFinal.value : [];

  // Analyze intelligence from articles
  console.log('[Morocco Intel] 🔍 Analyzing intelligence from articles...');
  const intelligence = analyzeMoroccoIntelligence(uniqueArticles);

  // Merge Telegram events with analyzed events
  const allEvents = [...intelligence.events, ...telegramData.events];
  const allConnections = [...intelligence.connections];
  const allInfrastructure = [...intelligence.infrastructure];

  console.log(`[Morocco Intel] ✅ Analysis complete:`);
  console.log(`[Morocco Intel]   - Events: ${allEvents.length} (${intelligence.events.length} from news, ${telegramData.events.length} from Telegram)`);
  console.log(`[Morocco Intel]   - Connections: ${allConnections.length}`);
  console.log(`[Morocco Intel]   - Infrastructure: ${allInfrastructure.length}`);
  console.log(`[Morocco Intel]   - Weather: ${localData.weather.length} cities`);
  console.log(`[Morocco Intel]   - Traffic: ${localData.traffic.length} incidents`);
  console.log(`[Morocco Intel]   - Commodities: ${localData.commodities.length} items`);
  console.log(`[Morocco Intel]   - Fires: ${localData.fires.length} active`);
  console.log(`[Morocco Intel]   - Routes: ${routes.length} major routes`);
  console.log(`[Morocco Intel]   - Telegram: ${telegramData.channels.monitored} channels monitored`);

  // Group events by type for summary
  const eventsByType = allEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('[Morocco Intel] 📈 Events by type:', eventsByType);

  return {
    events: allEvents || [],
    connections: allConnections || [],
    infrastructure: allInfrastructure || [],
    weather: localData.weather || [],
    traffic: localData.traffic || [],
    commodities: localData.commodities || [],
    fires: localData.fires || [],
    routes: routes || [],
    weatherAlerts: [],
    summary: {
      totalEvents: allEvents?.length || 0,
      criticalEvents: allEvents?.filter(e => e.severity === 'CRITICAL').length || 0,
      activeConnections: allConnections?.filter(c => c.status === 'ACTIVE').length || 0,
      operationalInfrastructure: allInfrastructure?.filter(i => i.status === 'OPERATIONAL').length || 0,
      activeFires: localData.fires?.filter(f => f.status === 'ACTIVE').length || 0,
      weatherAlerts: localData.weather?.filter(w => w.alert).length || 0,
      trafficIncidents: localData.traffic?.length || 0,
      totalRoutes: routes?.length || 0,
      disruptedRoutes: routes?.filter(r => r.status === 'DISRUPTED' || r.status === 'CLOSED').length || 0,
      eventsByType,
      sources: {
        rss: rssConverted.length,
        api: apiArticles.length,
        telegram: telegramData.events.length,
        total: uniqueArticles.length + telegramData.events.length,
      },
    },
    timestamp: new Date().toISOString(),
  };
}
