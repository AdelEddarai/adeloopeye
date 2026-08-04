import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { analyzeGeopoliticalRelationships } from '@/server/lib/geopolitical-analyzer';
import { fetchCyberThreats } from '@/server/lib/api-clients/cyber-threat-client';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { fetchDatalasticVesselsSnapshot } from '@/server/lib/api-clients/datalastic-maritime-client';
import { adsbfiClient } from '@/server/lib/api-clients/adsbfi-client';
import { transformFlightsToMapFeatures, transformNewsToHeatPoints, transformNewsToCriticalEvents } from '@/server/lib/live-data-transformer';

import type { MaritimeLane, MaritimeVessel } from '@/data/map-data';
import { WORLD_BASELINE } from '@/data/world-baseline';
import { gatherCrisisDeskData, disasterToTarget, disasterToHeat } from '@/server/lib/crisis-desk';

// ─── Known conflict actor positions ──────────────────────

const ACTOR_POSITIONS: Record<string, [number, number]> = {
  iran: [51.3890, 35.6892],
  israel: [34.7818, 32.0853],
  gaza: [34.2804, 31.4167],
  yemen: [44.2067, 15.5527],
  lebanon: [35.4955, 33.8886],
  syria: [36.2765, 33.5138],
  iraq: [44.3661, 33.3152],
  turkey: [32.8597, 39.9334],
  egypt: [31.2357, 30.0444],
  saudi_arabia: [46.6753, 24.7136],
  russia: [37.6173, 55.7558],
  ukraine: [30.5234, 50.4501],
  us: [-77.0369, 38.9072],
  qatar: [51.5310, 25.2854],
  uae: [55.2708, 25.2048],
  bahrain: [50.5577, 26.0667],
  morocco: [-6.8498, 31.6295],
  western_sahara: [-13.0, 24.0],
};

// ─── Helpers ──────────────────────────────────────────────

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function detectActors(content: string): string[] {
  const actors: string[] = [];
  const lower = content.toLowerCase();
  if (/iran|iranian|tehran|irgc/.test(lower)) actors.push('iran');
  if (/israel|idf|tel aviv|jerusalem/.test(lower)) actors.push('israel');
  if (/gaza|hamas/.test(lower)) actors.push('gaza');
  if (/yemen|houthi|ansar allah/.test(lower)) actors.push('yemen');
  if (/lebanon|hezbollah/.test(lower)) actors.push('lebanon');
  if (/syria|damascus/.test(lower)) actors.push('syria');
  if (/iraq|baghdad/.test(lower)) actors.push('iraq');
  if (/russia|moscow|putin/.test(lower)) actors.push('russia');
  if (/ukraine|kyiv/.test(lower)) actors.push('ukraine');
  if (/us |america|washington|penta|centcom/.test(lower)) actors.push('us');
  if (/qatar|doha/.test(lower)) actors.push('qatar');
  if (/uae|abu dhabi|dubai/.test(lower)) actors.push('uae');
  if (/morocco|rabat|casablanca|marrakech/.test(lower)) actors.push('morocco');
  if (/western sahara|polisario/.test(lower)) actors.push('western_sahara');
  return actors;
}

function detectTargets(content: string): string[] {
  const targets: string[] = [];
  const lower = content.toLowerCase();
  if (/airstrike|air strike|bombard/.test(lower)) targets.push('airstrike');
  if (/missile|ballistic|cruise/.test(lower)) targets.push('missile');
  if (/drone|uav|unmanned/.test(lower)) targets.push('drone');
  if (/naval|ship|vessel|maritime/.test(lower)) targets.push('naval');
  if (/cyber|hack|breach|ransomware/.test(lower)) targets.push('cyber');
  if (/sanction|tariff|embargo/.test(lower)) targets.push('economic');
  if (/tanker|oil|energy|petroleum/.test(lower)) targets.push('energy');
  if (/refinery|port|harbor/.test(lower)) targets.push('infrastructure');
  return targets;
}

function jitterCoord(coord: [number, number], offset: number): [number, number] {
  return [coord[0] + (Math.random() - 0.5) * offset, coord[1] + (Math.random() - 0.5) * offset];
}

function generateStrikeArcs(articles: any[]) {
  const arcs = [];
  let idx = 0;
  for (const article of articles) {
    const content = `${article.title} ${article.description}`.toLowerCase();
    if (!/airstrike|air strike|strike|bombard|missile|drone/.test(content)) continue;
    const actors = detectActors(content);
    const targets = detectTargets(content);
    if (actors.length === 0 || targets.length === 0) continue;
    const actor = actors[0];
    const from = ACTOR_POSITIONS[actor];
    if (!from) continue;
    // Pick a target location based on mentioned regions
    let to: [number, number];
    if (/gaza|palestine/.test(content)) to = ACTOR_POSITIONS.gaza;
    else if (/iran|tehran/.test(content)) to = ACTOR_POSITIONS.iran;
    else if (/israel|tel aviv/.test(content)) to = ACTOR_POSITIONS.israel;
    else if (/yemen|houthi/.test(content)) to = ACTOR_POSITIONS.yemen;
    else if (/lebanon|beirut/.test(content)) to = ACTOR_POSITIONS.lebanon;
    else if (/syria|damascus/.test(content)) to = ACTOR_POSITIONS.syria;
    else if (/iraq|baghdad/.test(content)) to = ACTOR_POSITIONS.iraq;
    else if (/morocco|western sahara/.test(content)) to = ACTOR_POSITIONS.morocco;
    else to = jitterCoord(from, 2.0);
    if (!to) continue;
    const severity = /airstrike|bombard|missile/.test(content) ? 'CRITICAL' : 'HIGH';
    arcs.push({
      id: `strike-${idx++}`,
      sourceEventId: null,
      actor,
      priority: severity === 'CRITICAL' ? 'P1' : 'P2',
      category: 'KINETIC',
      type: 'AIRSTRIKE',
      status: 'COMPLETE',
      timestamp: article.publishedAt || new Date().toISOString(),
      from,
      to,
      label: article.title.slice(0, 60),
      severity,
      url: article.url || null,
      source: article.source || null,
    });
  }
  return arcs;
}

function generateMissileTracks(articles: any[]) {
  const tracks = [];
  let idx = 0;
  for (const article of articles) {
    const content = `${article.title} ${article.description}`.toLowerCase();
    if (!/missile|ballistic|cruise|drone|uav/.test(content)) continue;
    const actors = detectActors(content);
    if (actors.length === 0) continue;
    const actor = actors[0];
    const from = ACTOR_POSITIONS[actor];
    if (!from) continue;
    let to: [number, number];
    if (/gaza|palestine/.test(content)) to = ACTOR_POSITIONS.gaza;
    else if (/iran|tehran/.test(content)) to = ACTOR_POSITIONS.iran;
    else if (/israel|tel aviv/.test(content)) to = ACTOR_POSITIONS.israel;
    else if (/yemen|houthi/.test(content)) to = ACTOR_POSITIONS.yemen;
    else if (/lebanon|beirut/.test(content)) to = ACTOR_POSITIONS.lebanon;
    else if (/syria|damascus/.test(content)) to = ACTOR_POSITIONS.syria;
    else if (/iraq|baghdad/.test(content)) to = ACTOR_POSITIONS.iraq;
    else if (/morocco/.test(content)) to = ACTOR_POSITIONS.morocco;
    else to = jitterCoord(from, 3.0);
    if (!to) continue;
    const type = /ballistic/.test(content) ? 'BALLISTIC' : /cruise/.test(content) ? 'CRUISE' : 'DRONE';
    const severity = /ballistic|cruise/.test(content) ? 'CRITICAL' : 'HIGH';
    tracks.push({
      id: `missile-${idx++}`,
      sourceEventId: null,
      actor,
      priority: severity === 'CRITICAL' ? 'P1' : 'P2',
      category: 'KINETIC',
      type: type as any,
      status: /intercept/.test(content) ? 'INTERCEPTED' : 'IMPACTED',
      timestamp: article.publishedAt || new Date().toISOString(),
      from,
      to,
      label: article.title.slice(0, 60),
      severity,
      url: article.url || null,
      source: article.source || null,
    });
  }
  return tracks;
}

function generateThreatZones(articles: any[]) {
  const zones = [];
  const zoneRegions = new Map<string, { coords: [number, number][]; color: [number, number, number, number]; name: string }>();

  for (const article of articles) {
    const content = `${article.title} ${article.description}`.toLowerCase();
    const actors = detectActors(content);
    for (const actor of actors) {
      const pos = ACTOR_POSITIONS[actor];
      if (!pos) continue;
      const existing = zoneRegions.get(actor);
      const jitter = jitterCoord(pos, 1.5);
      if (existing) {
        existing.coords.push(jitter);
      } else {
        let color: [number, number, number, number];
        if (actor === 'iran' || actor === 'yemen' || actor === 'gaza') color = [231, 106, 110, 0.2];
        else if (actor === 'israel' || actor === 'us') color = [76, 144, 240, 0.15];
        else if (actor === 'russia' || actor === 'ukraine') color = [200, 80, 80, 0.2];
        else if (actor === 'morocco' || actor === 'western_sahara') color = [236, 154, 60, 0.2];
        else color = [143, 153, 168, 0.1];
        zoneRegions.set(actor, { coords: [pos, jitter], color, name: actor });
      }
    }
  }

  let idx = 0;
  for (const [actor, data] of zoneRegions) {
    // Create a rough polygon by adding offset points
    const center = data.coords[0];
    const offsets = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5], [-0.3, 0.3], [-0.5, 0], [-0.5, -0.3], [0, -0.3]];
    const polygon = offsets.map(([dx, dy]) => [center[0] + dx, center[1] + dy] as [number, number]);
    zones.push({
      id: `threatzone-${idx++}`,
      sourceEventId: null,
      actor,
      priority: 'P2',
      category: 'ZONE',
      type: 'CONFLICT_AREA' as any,
      timestamp: new Date().toISOString(),
      name: `${actor} conflict zone`,
      coordinates: polygon,
      color: data.color,
    });
  }
  return zones;
}

function generateAssets(articles: any[]) {
  const assets = [];
  let idx = 0;
  for (const article of articles) {
    const content = `${article.title} ${article.description}`.toLowerCase();
    if (!/military|base|installation|carrier|aircraft|naval|battery|silo/.test(content)) continue;
    const actors = detectActors(content);
    for (const actor of actors) {
      const pos = ACTOR_POSITIONS[actor];
      if (!pos) continue;
      const type = /carrier/.test(content) ? 'CARRIER' : /aircraft/.test(content) ? 'AIRCRAFT' : /naval|ship/.test(content) ? 'NAVAL_BASE' : 'ARMY_BASE';
      assets.push({
        id: `asset-${idx++}`,
        sourceEventId: null,
        actor,
        priority: 'P2',
        category: 'INSTALLATION',
        type: type as any,
        status: 'ACTIVE',
        timestamp: article.publishedAt || new Date().toISOString(),
        name: `${actor} ${type.replace('_', ' ')}`,
        position: jitterCoord(pos, 0.3),
        description: article.title.slice(0, 120),
        url: article.url || null,
        source: article.source || null,
      });
    }
  }
  return assets;
}

function generateMaritimeLanes(vessels: MaritimeVessel[], base: MaritimeLane[]): MaritimeLane[] {
  if (vessels.length === 0) return base;
  const laneGroups = new Map<string, [number, number][]>();
  for (const lane of base) {
    laneGroups.set(lane.id, [...lane.path]);
  }
  for (const vessel of vessels.slice(0, 50)) {
    let nearestLane = base[0];
    let minDist = Infinity;
    for (const lane of base) {
      for (const point of lane.path) {
        const dist = Math.hypot(vessel.position[0] - point[0], vessel.position[1] - point[1]);
        if (dist < minDist) { minDist = dist; nearestLane = lane; }
      }
    }
    if (minDist < 5) {
      const pts = laneGroups.get(nearestLane.id);
      if (pts) pts.push(vessel.position);
    }
  }
  return base.map(lane => ({
    ...lane,
    path: laneGroups.get(lane.id) || lane.path,
  }));
}

function generateLogisticsCrisisIndicators(articles: any[]) {
  const crises = [];
  let idx = 0;
  for (const article of articles) {
    const content = `${article.title} ${article.description}`.toLowerCase();
    if (!/(?:logistics|supply\s+chain|shipping|trade|port|freight|bottleneck|chokepoint|disruption|closure|blockage|crisis|sanction|tariff|embargo|price\s+(?:surge|hike|increase)|inflation|food\s+crisis|fuel\s+crisis|energy\s+crisis)/.test(content)) continue;
    const actors = detectActors(content);
    const targets = detectTargets(content);
    for (const actor of actors) {
      const pos = ACTOR_POSITIONS[actor];
      if (!pos) continue;
      crises.push({
        id: `logistics-${idx++}`,
        actor,
        position: pos,
        type: targets.includes('energy') ? 'ENERGY_CRISIS' : targets.includes('infrastructure') ? 'INFRASTRUCTURE_CRISIS' : targets.includes('economic') ? 'ECONOMIC_CRISIS' : 'LOGISTICS_CRISIS',
        severity: targets.includes('energy') || targets.includes('infrastructure') ? 'CRITICAL' : 'HIGH',
        description: article.title.slice(0, 120),
        timestamp: article.publishedAt || new Date().toISOString(),
        url: article.url || null,
        source: article.source || null,
      });
    }
  }
  return crises;
}

function generateInvestmentFlows(articles: any[]) {
  const flows = [];
  let idx = 0;
  for (const article of articles) {
    const content = `${article.title} ${article.description}`.toLowerCase();
    if (!/(?:investment|invest|trade\s+deal|economic\s+deal|infrastructure\s+deal|loan|aid|grant|financial\s+package|FDI|foreign\s+investment|trade\s+agreement|free\s+trade|partnership|cooperation|agreement\s+(?:signed|reached|new))/i.test(content)) continue;
    const actors = detectActors(content);
    for (const actor of actors) {
      const pos = ACTOR_POSITIONS[actor];
      if (!pos) continue;
      flows.push({
        id: `investment-${idx++}`,
        actor,
        position: pos,
        type: /loan|aid|grant|financial/.test(content) ? 'AID' : /infrastructure/.test(content) ? 'INFRASTRUCTURE' : /trade\s+deal|trade\s+agreement|free\s+trade/.test(content) ? 'TRADE_DEAL' : 'INVESTMENT',
        description: article.title.slice(0, 120),
        timestamp: article.publishedAt || new Date().toISOString(),
        url: article.url || null,
        source: article.source || null,
      });
    }
  }
  return flows;
}

// ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;

  try {
    console.log('[Map Data] Fetching data from multiple real-time sources...');

    const NEWS_QUERY = '(iran OR israel OR gaza OR ukraine OR russia OR china OR taiwan OR syria OR yemen) (attack OR strike OR missile OR drone OR war OR ceasefire OR sanction OR trade OR energy OR conflict)';

    const [articles, cyberThreats, vesselsSnap, flightsSnap, crisisDesk] = await Promise.allSettled([
      multiNewsClient.searchNews(NEWS_QUERY, 100, 'en'),
      fetchCyberThreats(),
      fetchDatalasticVesselsSnapshot().catch(err => { console.error('[Map Data] Maritime AIS failed:', err instanceof Error ? err.message : err); return []; }),
      adsbfiClient.getGlobalFlights().catch(err => { console.error('[Map Data] ADSB flights failed:', err instanceof Error ? err.message : err); return []; }),
      gatherCrisisDeskData().catch(err => { console.error('[Map Data] Crisis desk failed:', err instanceof Error ? err.message : err); return { disasters: [], unrestHeat: [], travelAdvisoryZones: [] }; }),
    ]);

    const articlesData = articles.status === 'fulfilled' ? articles.value : [];
    const cyberThreatsData = cyberThreats.status === 'fulfilled' ? cyberThreats.value : [];
    const vesselsData = vesselsSnap.status === 'fulfilled' ? vesselsSnap.value : [];
    const flightsData = flightsSnap.status === 'fulfilled' ? flightsSnap.value : [];
    const crisisData = crisisDesk.status === 'fulfilled' ? crisisDesk.value : { disasters: [], unrestHeat: [], travelAdvisoryZones: [] };

    console.log(`[Map Data] Got ${articlesData.length} articles, ${cyberThreatsData.length} threats, ${vesselsData.length} vessels, ${flightsData.length} flights, ${crisisData.disasters.length} disasters, ${crisisData.unrestHeat.length} unrest areas, ${crisisData.travelAdvisoryZones.length} advisory zones`);

    // Always-on world baseline (seeded) + live newswire data merged on top.
    const baseline = WORLD_BASELINE;
    const crisisTargets = crisisData.disasters.map(disasterToTarget);
    const crisisHeat = crisisData.disasters.map(disasterToHeat);
    const heatPoints = dedupeById([...baseline.heatPoints, ...crisisHeat, ...crisisData.unrestHeat, ...transformNewsToHeatPoints(articlesData)]);
    const criticalEvents = dedupeById([...baseline.targets, ...transformNewsToCriticalEvents(articlesData), ...crisisTargets]);
    const geopoliticalRelationships = dedupeById([...baseline.conflictRelationships, ...analyzeGeopoliticalRelationships(articlesData)]);

    // Generate Palantir-like OSINT features from real data
    const strikeArcs = dedupeById([...baseline.strikeArcs, ...generateStrikeArcs(articlesData)]);
    const missileTracks = dedupeById([...baseline.missileTracks, ...generateMissileTracks(articlesData)]);
    const threatZones = dedupeById([...baseline.threatZones, ...crisisData.travelAdvisoryZones, ...generateThreatZones(articlesData)]);
    const assets = dedupeById([...baseline.assets, ...generateAssets(articlesData)]);
    const maritimeLanes = generateMaritimeLanes(vesselsData, baseline.maritimeLanes);
    const logisticsCrises = generateLogisticsCrisisIndicators(articlesData);
    const investmentFlows = generateInvestmentFlows(articlesData);

    // Actor metadata for map coloring (live cores override the baseline)
    const actorMeta = {
      us: { label: 'US', cssVar: '--us', rgb: [45, 114, 210], affiliation: 'FRIENDLY', group: 'allied' },
      iran: { label: 'Iran', cssVar: '--iran', rgb: [231, 106, 110], affiliation: 'HOSTILE', group: 'adversary' },
      israel: { label: 'Israel', cssVar: '--israel', rgb: [76, 144, 240], affiliation: 'FRIENDLY', group: 'allied' },
      russia: { label: 'Russia', cssVar: '--russia', rgb: [200, 80, 80], affiliation: 'HOSTILE', group: 'adversary' },
      china: { label: 'China', cssVar: '--china', rgb: [220, 100, 100], affiliation: 'NEUTRAL', group: 'neutral' },
      gaza: { label: 'Gaza', cssVar: '--danger', rgb: [220, 80, 80], affiliation: 'HOSTILE', group: 'adversary' },
      yemen: { label: 'Yemen', cssVar: '--warning', rgb: [236, 154, 60], affiliation: 'HOSTILE', group: 'adversary' },
      lebanon: { label: 'Lebanon', cssVar: '--danger', rgb: [180, 40, 40], affiliation: 'HOSTILE', group: 'adversary' },
      syria: { label: 'Syria', cssVar: '--danger', rgb: [200, 60, 60], affiliation: 'HOSTILE', group: 'adversary' },
      iraq: { label: 'Iraq', cssVar: '--warning', rgb: [210, 140, 40], affiliation: 'HOSTILE', group: 'adversary' },
      morocco: { label: 'Morocco', cssVar: '--morocco', rgb: [255, 180, 50], affiliation: 'NEUTRAL', group: 'neutral' },
      western_sahara: { label: 'W. Sahara', cssVar: '--t3', rgb: [180, 160, 120], affiliation: 'NEUTRAL', group: 'neutral' },
      unknown: { label: 'Unknown', cssVar: '--t3', rgb: [143, 153, 168], affiliation: 'NEUTRAL', group: 'neutral' },
    };

    // Baseline fills the whole globe; live core actors override their colours.
    const resolvedActorMeta = { ...baseline.actorMeta, ...actorMeta };

    // Major cities (reference coordinates for the map backdrop)
    const cities = [
      { id: 'tehran', name: 'Tehran', country: 'Iran', position: [51.3890, 35.6892], type: 'CAPITAL' },
      { id: 'tel-aviv', name: 'Tel Aviv', country: 'Israel', position: [34.7818, 32.0853], type: 'CAPITAL' },
      { id: 'damascus', name: 'Damascus', country: 'Syria', position: [36.2765, 33.5138], type: 'CAPITAL' },
      { id: 'baghdad', name: 'Baghdad', country: 'Iraq', position: [44.3661, 33.3152], type: 'CAPITAL' },
      { id: 'beirut', name: 'Beirut', country: 'Lebanon', position: [35.4955, 33.8886], type: 'CAPITAL' },
      { id: 'ankara', name: 'Ankara', country: 'Turkey', position: [32.8597, 39.9334], type: 'CAPITAL' },
      { id: 'cairo', name: 'Cairo', country: 'Egypt', position: [31.2357, 30.0444], type: 'CAPITAL' },
      { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', position: [46.6753, 24.7136], type: 'CAPITAL' },
      { id: 'moscow', name: 'Moscow', country: 'Russia', position: [37.6173, 55.7558], type: 'CAPITAL' },
      { id: 'kyiv', name: 'Kyiv', country: 'Ukraine', position: [30.5234, 50.4501], type: 'CAPITAL' },
      { id: 'rabat', name: 'Rabat', country: 'Morocco', position: [-6.8498, 31.6295], type: 'CAPITAL' },
      { id: 'casablanca', name: 'Casablanca', country: 'Morocco', position: [-7.5898, 33.5731], type: 'CITY' },
      { id: 'laayoune', name: 'Laayoune', country: 'W. Sahara', position: [-13.2033, 27.1536], type: 'CITY' },
      { id: 'gaza-city', name: 'Gaza City', country: 'Palestine', position: [34.2804, 31.4167], type: 'CITY' },
      { id: 'sanaa', name: 'Sanaa', country: 'Yemen', position: [44.2067, 15.5527], type: 'CAPITAL' },
      { id: 'hodeidah', name: 'Hodeidah', country: 'Yemen', position: [42.9617, 14.7983], type: 'CITY' },
      { id: 'dubai', name: 'Dubai', country: 'UAE', position: [55.2708, 25.2048], type: 'CITY' },
      { id: 'doha', name: 'Doha', country: 'Qatar', position: [51.5310, 25.2854], type: 'CITY' },
      { id: 'manama', name: 'Manama', country: 'Bahrain', position: [50.5577, 26.0667], type: 'CITY' },
      { id: 'muscat', name: 'Muscat', country: 'Oman', position: [59.9, 23.6], type: 'CITY' },
    ] as const;

    console.log(`[Map Data] Returning ${strikeArcs.length} strike arcs, ${missileTracks.length} missile tracks, ${threatZones.length} threat zones, ${assets.length} assets, ${maritimeLanes.length} maritime lanes, ${logisticsCrises.length} logistics crises, ${investmentFlows.length} investment flows, ${cyberThreatsData.length} cyber threats, ${criticalEvents.length} targets, ${geopoliticalRelationships.length} relationships, ${cities.length} cities`);

    return ok(
      {
        strikeArcs,
        missileTracks,
        targets: criticalEvents,
        assets,
        threatZones,
        heatPoints,
        cyberThreats: cyberThreatsData,
        conflictRelationships: geopoliticalRelationships,
        cities,
        actorMeta: resolvedActorMeta,
        maritimeLanes,
        vessels: vesselsData,
        flights: flightsData,
        logisticsCrises,
        investmentFlows,
      },
      { headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=30' } }
    );
  } catch (error) {
    console.error('[Map Data] Critical error:', error);
    return ok(
      {
        strikeArcs: [],
        missileTracks: [],
        targets: [],
        assets: [],
        threatZones: [],
        heatPoints: [],
        cyberThreats: [],
        conflictRelationships: [],
        cities: [],
        actorMeta: {},
        maritimeLanes: [],
        vessels: [],
        flights: [],
        logisticsCrises: [],
        investmentFlows: [],
      },
      { headers: { 'Cache-Control': 'public, max-age=5' } }
    );
  }
}
