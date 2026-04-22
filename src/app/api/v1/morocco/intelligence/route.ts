import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { analyzeMoroccoIntelligence } from '@/server/lib/morocco-intelligence-analyzer';
import { telegramIntelligenceAnalyzer } from '@/server/lib/telegram-intelligence-analyzer';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { fetchMoroccanRSSNews, convertRSSToNewsArticle } from '@/server/lib/api-clients/rss-client';
import { fetchAllMoroccoLocalData } from '@/server/lib/api-clients/morocco-local-data';
import { fetchMoroccoRoutes } from '@/server/lib/api-clients/morocco-routes-client';

export async function GET(req: NextRequest) {
  try {
    console.log('[Morocco Intel] ========================================');
    console.log('[Morocco Intel] Fetching comprehensive Morocco intelligence...');
    console.log('[Morocco Intel] ========================================');
    
    // Strategy 1: Fetch from Moroccan RSS feeds (primary source)
    console.log('[Morocco Intel] 📰 Strategy 1: Fetching from Moroccan RSS feeds...');
    const rssArticles = await fetchMoroccanRSSNews(20000); // 20 second timeout for RSS feeds
    const rssConverted = rssArticles.map(convertRSSToNewsArticle);
    
    // Strategy 2: Fetch from news APIs with multiple queries
    console.log('[Morocco Intel] 🌐 Strategy 2: Fetching from news APIs...');
    const searchQueries = [
      'Morocco',
      'Moroccan',
      'Rabat OR Casablanca OR Marrakech',
      'Morocco economy OR Morocco business',
      'Morocco tourism OR Morocco investment',
    ];
    
    const apiArticles: any[] = [];
    
    for (const query of searchQueries) {
      try {
        const articles = await multiNewsClient.searchNews(query, 20, 'en');
        apiArticles.push(...articles);
        console.log(`[Morocco Intel]   ✓ API query "${query}" returned ${articles.length} articles`);
      } catch (err) {
        console.error(`[Morocco Intel]   ✗ API query failed:`, err);
      }
    }
    
    // Combine all sources
    const allArticles = [...rssConverted, ...apiArticles];
    
    // Remove duplicates by URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.url, article])).values()
    );
    
    console.log(`[Morocco Intel] 📊 Combined total: ${uniqueArticles.length} unique articles (${rssConverted.length} from RSS, ${apiArticles.length} from APIs)`);
    
    // Strategy 3: Fetch local data (weather, traffic, commodities, fires)
    console.log('[Morocco Intel] 🌍 Strategy 3: Fetching local data sources...');
    const localData = await fetchAllMoroccoLocalData(uniqueArticles);
    
    // Strategy 4: Fetch real-time Telegram intelligence
    console.log('[Morocco Intel] 📱 Strategy 4: Fetching Telegram intelligence...');
    const telegramData = await telegramIntelligenceAnalyzer.collectMoroccoIntelligence();
    
    // Strategy 5: Fetch routes and logistics
    console.log('[Morocco Intel] 🛣️  Strategy 5: Analyzing routes and logistics...');
    const routes = await fetchMoroccoRoutes(uniqueArticles);
    
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
    
    // Log sample events for debugging
    if (allEvents.length > 0) {
      console.log('[Morocco Intel] 📝 Sample events:', allEvents.slice(0, 3).map(e => ({
        type: e.type,
        location: e.location,
        title: e.title.substring(0, 60) + '...',
        source: (e as any).source || 'News',
        hasImage: !!e.image,
      })));
    } else {
      console.warn('[Morocco Intel] ⚠️  No events detected! Showing sample articles:');
      console.log('[Morocco Intel] Sample articles:', uniqueArticles.slice(0, 3).map(a => ({
        title: a.title?.substring(0, 60),
        hasImage: !!(a as any).urlToImage,
      })));
    }
    
    console.log('[Morocco Intel] ========================================');
    
    return ok(
      {
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
      },
      { 
        headers: { 
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // 5 min cache, 10 min stale
        } 
      }
    );
  } catch (error) {
    console.error('[Morocco Intel] ❌ Critical error:', error);
    
    // Return empty data on error
    return ok(
      {
        events: [],
        connections: [],
        infrastructure: [],
        weather: [],
        traffic: [],
        commodities: [],
        fires: [],
        weatherAlerts: [],
        summary: {
          totalEvents: 0,
          criticalEvents: 0,
          activeConnections: 0,
          operationalInfrastructure: 0,
          activeFires: 0,
          weatherAlerts: 0,
          trafficIncidents: 0,
          eventsByType: {},
          sources: { rss: 0, api: 0, total: 0 },
        },
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch Morocco intelligence',
      },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
