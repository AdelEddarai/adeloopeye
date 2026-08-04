import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { analyzeMoroccoIntelligence } from '@/server/lib/morocco-intelligence-analyzer';
import { telegramIntelligenceAnalyzer } from '@/server/lib/telegram-intelligence-analyzer';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { fetchMoroccanRSSNews, convertRSSToNewsArticle } from '@/server/lib/api-clients/rss-client';
import { fetchAllMoroccoLocalData } from '@/server/lib/api-clients/morocco-local-data';
import { fetchMoroccoRoutes } from '@/server/lib/api-clients/morocco-routes-client';
import { usgsEarthquakeClient } from '@/server/lib/api-clients/usgs-earthquake-client';
import { eonetClient } from '@/server/lib/api-clients/eonet-client';
import { fetchMoroccoLogistics, type LogisticsEntry } from '@/server/lib/api-clients/morocco-logistics';
import { fetchMoroccoConflicts, type ConflictEntry } from '@/server/lib/api-clients/morocco-conflicts';
import { getMoroccoConflictArticles, type GDELTArticle } from '@/server/lib/api-clients/gdelt-client';
import type { MoroccoWeather, MoroccoCommodity } from '@/server/lib/api-clients/morocco-local-data';
import type { MoroccoRoute } from '@/server/lib/api-clients/morocco-routes-client';
import { withDeadline, rejectedResults } from '@/server/lib/route-deadline';

// Netlify/serverless functions kill slow invocations (default 10s, max 26s).
// The heavy external fetching below MUST complete well inside that window,
// otherwise the platform returns a 502 and the dashboard/map show nothing.
//
// Phase 1 (news/RSS/Telegram), Phase 2 (live sensors) and the GDELT real-time
// conflict stream run CONCURRENTLY, so total wall-clock time is bounded by the
// slowest stream (~8s worst case), well under the ~10s serverless limit. The
// budgets below are generous enough that the reliable keyless sources (USGS,
// EONET, Open-Meteo) almost never hit them.
const PHASE1_BUDGET_MS = 6000; // RSS + news APIs + Telegram
const PHASE2_BUDGET_MS = 3500; // Weather + fires + routes + quakes + disasters
const GDELT_BUDGET_MS = 8000; // GDELT real-time conflict coverage (latency varies)
const TOTAL_BUDGET_MS = 9500; // Safety net — should never fire (streams run concurrently)

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
    earthquakes: [],
    disasters: [],
    logistics: [],
    conflicts: [],
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
        totalEarthquakes: 0,
        significantEarthquakes: 0,
        activeDisasters: 0,
        logisticsCrisis: 0,
        activeConflicts: 0,
        eventsByType: {},
        sources: { rss: 0, api: 0, telegram: 0, earthquakes: 0, eonet: 0, gdelt: 0, total: 0 },
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
  if (payload.events.length > 0 || payload.weather.length > 0 || payload.earthquakes.length > 0) {
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

  // ---- Phase 1: News + Telegram (slow, best-effort, requires external feeds) ----
  const newsPhase = withDeadline(
    Promise.allSettled([
      // Strategy 1: Fetch from Moroccan RSS feeds (primary source)
      (async () => {
        console.log('[Morocco Intel] 📰 Strategy 1: Fetching from Moroccan RSS feeds...');
        const articles = await fetchMoroccanRSSNews(4000); // 4s timeout
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
    () => rejectedResults(3)
  );

  // ---- Phase 2: Live sensors + weather + routes — runs CONCURRENTLY with news.
  // These sources are keyless, reliable and fast, so even if every news feed
  // fails the dashboard still renders with real data. ----
  const sensorPhase = withDeadline(
    Promise.allSettled([
      (async () => {
        console.log('[Morocco Intel] 🌍 Strategy 3: Fetching local data sources...');
        return await fetchAllMoroccoLocalData([]);
      })(),
      (async () => {
        console.log('[Morocco Intel] 🛣️  Strategy 5: Building route network...');
        return await fetchMoroccoRoutes([]);
      })(),
      (async () => {
        console.log('[Morocco Intel] 🌍 Strategy 6: Fetching USGS earthquakes...');
        return await usgsEarthquakeClient.getMoroccoEarthquakes();
      })(),
      (async () => {
        console.log('[Morocco Intel] 🌪️  Strategy 7: Fetching NASA EONET disasters...');
        return await eonetClient.getMoroccoDisasters();
      })(),
    ]),
    PHASE2_BUDGET_MS,
    () => rejectedResults(4)
  );

  // ---- GDELT real-time conflict stream — its own concurrent stream because its
  // latency is variable (2s-12s). Best-effort: when it lands in time we get a
  // live regional-security feed; when it doesn't, conflicts fall back to news. ----
  const gdeltPhase = withDeadline(
    Promise.allSettled([
      (async () => {
        console.log('[Morocco Intel] 📡 Strategy 8: Fetching GDELT real-time conflict coverage...');
        return await getMoroccoConflictArticles(GDELT_BUDGET_MS);
      })(),
    ]),
    GDELT_BUDGET_MS,
    () => rejectedResults(1)
  );

  const [newsResults, sensorResults, gdeltRaw] = await Promise.all([newsPhase, sensorPhase, gdeltPhase]);

  const [rssResult, apiResult, telegramResult] = newsResults;
  const [localDataFinal, routesFinal, earthquakesFinal, disastersFinal] = sensorResults;
  const [gdeltFinal] = gdeltRaw;

  const rssConverted = rssResult?.status === 'fulfilled' ? rssResult.value : [];
  const apiArticles = apiResult?.status === 'fulfilled' ? apiResult.value : [];
  const telegramData = telegramResult?.status === 'fulfilled' ? telegramResult.value : { events: [], channels: { monitored: 0, active: 0 } };

  // Combine all sources
  const allArticles = [...rssConverted, ...apiArticles];

  // Remove duplicates by URL
  const uniqueArticles = Array.from(
    new Map(allArticles.map(article => [article.url, article])).values()
  );

  console.log(`[Morocco Intel] 📊 Combined total: ${uniqueArticles.length} unique articles (${rssConverted.length} from RSS, ${apiArticles.length} from APIs)`);

  const localData = localDataFinal?.status === 'fulfilled' ? localDataFinal.value : { weather: [], traffic: [], commodities: [], fires: [] };
  const earthquakes = earthquakesFinal?.status === 'fulfilled' ? earthquakesFinal.value : [];
  const disasters = disastersFinal?.status === 'fulfilled' ? disastersFinal.value : [];
  const gdeltArticles = gdeltFinal?.status === 'fulfilled' ? gdeltFinal.value : [];

  // Route network is pure local compute (~ms): re-run with news articles so
  // any traffic/closure/weather incidents reported in the feeds are attached.
  const routes = await fetchMoroccoRoutes(uniqueArticles);

  // Logistics + regional conflicts are driven by live coverage. Conflicts now
  // combine the current news feed with GDELT's real-time (15-min refresh)
  // global coverage so flashpoint intensity/status reacts to breaking events.
  const logistics = fetchMoroccoLogistics(uniqueArticles);
  const conflictSources = [...uniqueArticles, ...gdeltArticles];
  const conflicts = fetchMoroccoConflicts(conflictSources);

  // Analyze intelligence from articles
  console.log('[Morocco Intel] 🔍 Analyzing intelligence from articles...');
  const intelligence = analyzeMoroccoIntelligence(uniqueArticles);

  // Merge Telegram events with analyzed events
  const baseEvents = [...intelligence.events, ...telegramData.events];
  const allConnections = [...intelligence.connections];
  const allInfrastructure = [...intelligence.infrastructure];

  // Guarantee the dashboard always has events. News/Telegram feeds can be slow or
  // down (and the free keyless APIs below are far more reliable), so whenever news
  // produces nothing we fall back to generating events from live sensor data
  // (USGS quakes, NASA EONET disasters) plus satellite-detected fires.
  const sensorEvents = [
    ...buildEarthquakeEvents(earthquakes),
    ...buildDisasterEvents(disasters),
  ];
  const fireEvents = baseEvents.length > 0 ? [] : buildFireEvents(localData.fires);
  const conflictEvents = buildConflictEvents(gdeltArticles, conflicts);

  // Guaranteed event volume. News/Telegram/GDELT can be down, and there may be
  // no active quakes/disasters — but the live local layers (weather, markets,
  // routes, logistics, conflicts) ALWAYS exist. Surface them as real events so
  // the dashboard/map is never sparse. IDs are STABLE so the alert system
  // doesn't re-ring them on every 60s poll.
  const derivedEvents = buildDerivedEvents(
    localData.weather,
    localData.commodities,
    routes,
    logistics,
    conflicts,
    conflictEvents.length === 0
  );

  const allEvents = Array.from(
    new Map(
      [...baseEvents, ...conflictEvents, ...derivedEvents, ...sensorEvents, ...fireEvents]
        .filter(Boolean)
        .map(e => [e.id, e])
    ).values()
  );

  console.log(`[Morocco Intel] ✅ Analysis complete:`);
  console.log(`[Morocco Intel]   - Events: ${allEvents.length} (${intelligence.events.length} from news, ${telegramData.events.length} from Telegram, ${conflictEvents.length} from GDELT conflicts, ${derivedEvents.length} from live local layers, ${sensorEvents.length} from sensors, ${fireEvents.length} from fires)`);
  console.log(`[Morocco Intel]   - Connections: ${allConnections.length}`);
  console.log(`[Morocco Intel]   - Infrastructure: ${allInfrastructure.length}`);
  console.log(`[Morocco Intel]   - Weather: ${localData.weather.length} cities`);
  console.log(`[Morocco Intel]   - Traffic: ${localData.traffic.length} incidents`);
  console.log(`[Morocco Intel]   - Commodities: ${localData.commodities.length} items`);
  console.log(`[Morocco Intel]   - Fires: ${localData.fires.length} active`);
  console.log(`[Morocco Intel]   - Routes: ${routes.length} major routes`);
  console.log(`[Morocco Intel]   - Logistics: ${logistics.length} nodes (${logistics.filter(l => l.crisis).length} in crisis)`);
  console.log(`[Morocco Intel]   - Conflicts: ${conflicts.length} (${conflicts.filter(c => c.status === 'ESCALATING' || c.status === 'ACTIVE').length} active)`);
  console.log(`[Morocco Intel]   - GDELT: ${gdeltArticles.length} real-time articles feeding conflicts`);
  console.log(`[Morocco Intel]   - Earthquakes: ${earthquakes.length} (${earthquakes.filter(q => q.magnitude >= 4).length} >= M4.0)`);
  console.log(`[Morocco Intel]   - Disasters: ${disasters.length} active`);
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
    earthquakes: earthquakes || [],
    disasters: disasters || [],
    logistics: logistics || [],
    conflicts: conflicts || [],
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
      totalEarthquakes: earthquakes?.length || 0,
      significantEarthquakes: earthquakes?.filter(q => q.magnitude >= 4).length || 0,
      activeDisasters: disasters?.filter(d => !d.closed).length || 0,
      logisticsCrisis: logistics?.filter(l => l.crisis || l.status === 'CLOSED' || l.status === 'DISRUPTED').length || 0,
      activeConflicts: conflicts?.filter(c => c.status === 'ESCALATING' || c.status === 'ACTIVE').length || 0,
      eventsByType,
      sources: {
        rss: rssConverted.length,
        api: apiArticles.length,
        telegram: telegramData.events.length,
        earthquakes: earthquakes.length,
        eonet: disasters.length,
        gdelt: gdeltArticles.length,
        total: uniqueArticles.length + telegramData.events.length + gdeltArticles.length,
      },
    },
    timestamp: new Date().toISOString(),
  };
}

// Build dashboard events from live sensor data (used as a fallback so the map/KPI
// dashboard always has meaningful intelligence even when news/RSS/Telegram fail).
function buildEarthquakeEvents(earthquakes: any[]): any[] {
  const events: any[] = [];
  for (const q of earthquakes) {
    if (!q || q.magnitude < 3) continue;
    events.push({
      id: `sensor-eq-${q.id}`,
      type: 'EARTHQUAKE',
      title: `M${q.magnitude.toFixed(1)} earthquake near ${q.location}`,
      description: `${q.place} — depth ${q.depthKm.toFixed(1)} km${q.tsunami ? '. Tsunami alert issued.' : ''}`,
      location: q.location,
      position: q.position,
      severity: q.severity,
      timestamp: q.timestamp,
      source: 'USGS',
      impact: q.magnitude >= 5 ? 'Major structural damage possible' : 'Seismic activity detected',
      status: 'ONGOING',
    });
  }
  return events;
}

function buildDisasterEvents(disasters: any[]): any[] {
  const events: any[] = [];
  for (const d of disasters) {
    if (!d || d.closed) continue;
    events.push({
      id: `sensor-disaster-${d.id}`,
      type: 'NATURAL_DISASTER',
      title: d.title,
      description: d.description || `${d.category} reported in the region`,
      location: d.category || 'Morocco region',
      position: d.position,
      severity: 'HIGH',
      timestamp: d.timestamp,
      source: 'NASA EONET',
      impact: 'Ongoing natural disaster monitoring',
      status: 'ONGOING',
    });
  }
  return events;
}

function buildFireEvents(fires: any[]): any[] {
  const events: any[] = [];
  for (const f of (fires || []).slice(0, 30)) {
    if (!f) continue;
    events.push({
      id: `sensor-fire-${f.id || `${f.position[0]},${f.position[1]}`}`,
      type: 'FIRE',
      title: `Wildfire near ${f.location}`,
      description: `${f.description || 'Active fire detected by satellite'}.`,
      location: f.location,
      position: f.position,
      severity: f.severity || (f.confidence > 80 ? 'HIGH' : 'MEDIUM'),
      timestamp: f.timestamp,
      source: 'FIRMS',
      impact: 'Risk to life and property',
      status: 'ONGOING',
    });
  }
  return events;
}

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

// Surface the always-available live local layers (weather, markets, routes,
// logistics, conflicts) as real events so the dashboard/map is never sparse.
// Every id is STABLE across polls — the alert hook seeds them silently on the
// first batch and skips them afterwards, so no notification spam.
function buildDerivedEvents(
  weather: MoroccoWeather[],
  commodities: MoroccoCommodity[],
  routes: MoroccoRoute[],
  logistics: LogisticsEntry[],
  conflicts: ConflictEntry[],
  includeConflictStatus: boolean
): any[] {
  const events: any[] = [];
  const now = new Date().toISOString();

  // 1. Active weather alerts (HEAT / WIND / STORM) from live Open-Meteo data
  for (const w of weather || []) {
    if (!w?.alert) continue;
    events.push({
      id: `weather-${w.city}-${w.alert.type}`,
      type: 'WEATHER',
      title: `${w.alert.type} warning in ${w.city}`,
      description: `${w.alert.description}. Current: ${w.temperature}°C, wind ${w.windSpeed} km/h, ${w.condition}.`,
      location: w.city,
      position: w.position,
      severity: w.alert.severity,
      timestamp: now,
      source: 'Open-Meteo',
      impact: 'May disrupt daily activities and agriculture',
      status: 'ONGOING',
    });
  }

  // 2. Notable current conditions (storms / heavy rain / snow) without an alert flag
  for (const w of weather || []) {
    if (!w || w.alert) continue;
    const notable = ['Thunderstorm', 'Rain', 'Snow'].includes(w.condition);
    if (!notable) continue;
    events.push({
      id: `wx-${w.city}-${w.condition.toLowerCase()}`,
      type: 'WEATHER',
      title: `${w.condition} in ${w.city}`,
      description: `${w.condition} conditions — ${w.description}. ${w.temperature}°C, wind ${w.windSpeed} km/h.`,
      location: w.city,
      position: w.position,
      severity: 'MEDIUM',
      timestamp: now,
      source: 'Open-Meteo',
      impact: 'May cause travel delays and local disruptions',
      status: 'MONITORING',
    });
  }

  // 3. Live commodity / market activity
  for (const c of commodities || []) {
    if (!c) continue;
    const move = Math.abs(c.change || 0);
    events.push({
      id: `commodity-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type: 'ECONOMIC',
      title: `${c.name} ${(c.change || 0) >= 0 ? 'up' : 'down'} ${Math.abs(c.change || 0)}%`,
      description: `${c.name} trading at ${c.price} ${c.unit} on the ${c.market} market.`,
      location: c.market,
      position: [-7.5898, 33.5731], // Casablanca financial center
      severity: move > 5 ? 'HIGH' : move > 2 ? 'MEDIUM' : 'LOW',
      timestamp: c.timestamp || now,
      source: 'Morocco Markets',
      impact: 'Market movement affecting trade and supply',
      status: 'MONITORING',
    });
  }

  // 4. Route disruptions / closures / incidents
  for (const r of routes || []) {
    if (!r) continue;
    const hasIncidents = (r.incidents?.length ?? 0) > 0;
    const closed = r.status === 'CLOSED' || r.status === 'DISRUPTED';
    if (!hasIncidents && !closed) continue;

    const worstIncident = [...(r.incidents || [])].sort(
      (a, b) => ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as any)[b.severity] - ({ CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as any)[a.severity]
    )[0];

    events.push({
      id: `route-${r.id}`,
      type: 'TRANSPORT',
      title: `${r.status.replace(/_/g, ' ')} — ${r.name}`,
      description: hasIncidents
        ? (r.incidents[0]?.description || r.description)
        : r.description,
      location: worstIncident?.location || r.name,
      position: worstIncident?.position || r.path?.[0] || [-6.8498, 33.9716],
      severity: worstIncident?.severity || (r.status === 'CLOSED' ? 'HIGH' : 'MEDIUM'),
      timestamp: now,
      source: 'Route Network',
      impact: 'May cause delays and disruptions',
      status: r.status === 'CLOSED' ? 'ONGOING' : 'MONITORING',
    });
  }

  // 5. Logistics crisis nodes (closed / disrupted / under pressure)
  for (const l of logistics || []) {
    if (!l) continue;
    const isCrisis = l.crisis || l.status === 'CLOSED' || l.status === 'DISRUPTED';
    if (!isCrisis) continue;
    events.push({
      id: `logistics-${l.id}`,
      type: 'INFRASTRUCTURE',
      title: `${l.status.replace(/_/g, ' ')} — ${l.name}`,
      description: l.description,
      location: l.name,
      position: l.position,
      severity: l.status === 'CLOSED' ? 'HIGH' : l.crisis ? 'MEDIUM' : 'LOW',
      timestamp: now,
      source: 'Logistics Network',
      impact: 'Affects transportation and logistics',
      status: 'ONGOING',
    });
  }

  // 6. Active / escalating conflicts (only when GDELT produced no per-article
  //    conflict events, so we don't double-stack conflict markers on the map)
  if (includeConflictStatus) {
    for (const c of conflicts || []) {
      if (!c) continue;
      if (c.status !== 'ESCALATING' && c.status !== 'ACTIVE') continue;
      events.push({
        id: `conflict-status-${c.id}`,
        type: 'CONFLICT',
        title: `${c.name} — ${c.status} (intensity ${c.intensity})`,
        description: c.description,
        location: c.name,
        position: c.position,
        severity: c.status === 'ESCALATING' ? 'HIGH' : 'MEDIUM',
        timestamp: now,
        source: 'Regional Monitor',
        impact: 'Regional security monitoring',
        status: c.status === 'ESCALATING' ? 'ONGOING' : 'MONITORING',
      });
    }
  }

  return events;
}

function matchConflict(title: string, conflicts: ConflictEntry[]): ConflictEntry | undefined {
  const lower = title.toLowerCase();
  return conflicts.find(
    c =>
      c.flashpoints.some(fp => lower.includes(fp.toLowerCase())) ||
      c.countries.some(cc => lower.includes(cc.toLowerCase())) ||
      c.name
        .toLowerCase()
        .split(/\W+/)
        .some(w => w.length > 4 && lower.includes(w))
  );
}

// Convert GDELT's real-time coverage into CONFLICT events so breaking regional
// security news lands on the map and in the alert stream immediately.
function buildConflictEvents(gdeltArticles: GDELTArticle[], conflicts: ConflictEntry[]): any[] {
  const events: any[] = [];
  for (const a of gdeltArticles.slice(0, 25)) {
    if (!a?.title) continue;
    const conflict = matchConflict(a.title, conflicts);
    const sev: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
      conflict && conflict.intensity >= 60 ? 'HIGH' : 'MEDIUM';
    events.push({
      id: `gdelt-conflict-${stableHash(a.url)}`,
      type: 'CONFLICT',
      title: a.title,
      description: `${conflict?.name || 'Regional security'}: breaking report from ${a.source}`,
      location: conflict?.name || 'Morocco region',
      position: conflict?.position || [-10.0, 28.0],
      severity: sev,
      timestamp: a.date,
      source: `GDELT / ${a.source}`,
      impact: conflict && conflict.intensity >= 60 ? 'Regional security escalation' : 'Regional security monitoring',
      status: conflict?.status === 'ESCALATING' ? 'ONGOING' : 'MONITORING',
    });
  }
  return events;
}
