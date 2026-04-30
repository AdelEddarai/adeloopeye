import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { analyzeGeopoliticalRelationships } from '@/server/lib/geopolitical-analyzer';
import { fetchCyberThreats } from '@/server/lib/api-clients/cyber-threat-client';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { WORLD_MARITIME_LANES } from '@/data/world-maritime-lanes';
import { GLOBAL_SHIPPING_ROUTES } from '@/data/global-shipping-routes';
import { fetchDatalasticVesselsSnapshot } from '@/server/lib/api-clients/datalastic-maritime-client';
import { adsbfiClient } from '@/server/lib/api-clients/adsbfi-client';
import { transformFlightsToMapFeatures, transformNewsToHeatPoints, transformNewsToCriticalEvents } from '@/server/lib/live-data-transformer';
import { MIDDLE_EAST_CHOKEPOINTS, MIDDLE_EAST_CONFLICT_ZONES } from '@/data/middle-east-chokepoints';
import { MIDDLE_EAST_INFRASTRUCTURE } from '@/data/middle-east-infrastructure';
import { MIDDLE_EAST_TRADE_ROUTES } from '@/data/middle-east-trade-routes';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Consume params
  
  try {
    console.log('[Map Data] Fetching data from multiple sources...');
    
    // Fetch REAL data from multiple sources with individual error handling
    const [articles, flights, cyberThreats, vesselsSnap] = await Promise.allSettled([
      multiNewsClient.searchNews('iran OR israel OR syria OR iraq OR ukraine OR russia OR china OR trade OR energy OR alliance attack OR strike OR fire OR explosion OR sanctions OR deal', 100, 'en')
        .catch(err => {
          console.error('[Map Data] News API failed:', err.message);
          return [];
        }),
      adsbfiClient.getFlightsByLocation(33, 44, 250)
        .catch(err => {
          console.error('[Map Data] OpenSky failed:', err.message);
          return [];
        }),
      fetchCyberThreats()
        .catch(err => {
          console.error('[Map Data] Cyber threats failed:', err.message);
          return [];
        }),
      fetchDatalasticVesselsSnapshot().catch(err => {
        console.error('[Map Data] Maritime AIS failed:', err instanceof Error ? err.message : err);
        return [];
      }),
    ]);

    const articlesData = articles.status === 'fulfilled' ? articles.value : [];
    const flightsData = flights.status === 'fulfilled' ? flights.value : [];
    const cyberThreatsData = cyberThreats.status === 'fulfilled' ? cyberThreats.value : [];
    const vesselsData = vesselsSnap.status === 'fulfilled' ? vesselsSnap.value : [];

    console.log(`[Map Data] Got ${articlesData.length} articles, ${flightsData.length} flights, ${cyberThreatsData.length} threats, ${vesselsData.length} vessels (AIS)`);

    // Transform adsb.fi aircraft to OpenSkyFlight format
    const transformedFlights = flightsData.map(ac => adsbfiClient.parseAircraft(ac));
    
    // Filter only airborne flights
    const airborneFlights = transformedFlights.filter(f => !f.on_ground && f.latitude !== null && f.longitude !== null);

    // Transform into map features
    const heatPoints = transformNewsToHeatPoints(articlesData);
    const flightAssets = transformFlightsToMapFeatures(airborneFlights);
    const criticalEvents = transformNewsToCriticalEvents(articlesData);
    const geopoliticalRelationships = analyzeGeopoliticalRelationships(articlesData);

    console.log(`[Map Data] Analyzed ${geopoliticalRelationships.length} geopolitical relationships`);
    
    // Group by type for logging
    const byType = geopoliticalRelationships.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('[Map Data] Relationships by type:', byType);
    
    // DEBUG: Log sample relationships
    if (geopoliticalRelationships.length > 0) {
      console.log('[Map Data] Sample relationships:', geopoliticalRelationships.slice(0, 3));
    } else {
      console.warn('[Map Data] No relationships detected! Check news articles:');
      console.log('[Map Data] Articles sample:', articlesData.slice(0, 2).map(a => a.title));
    }

    // Actor metadata for map coloring
    const actorMeta = {
      us: { label: 'US', cssVar: '--us', rgb: [45, 114, 210], affiliation: 'FRIENDLY', group: 'allied' },
      iran: { label: 'Iran', cssVar: '--iran', rgb: [231, 106, 110], affiliation: 'HOSTILE', group: 'adversary' },
      israel: { label: 'Israel', cssVar: '--israel', rgb: [76, 144, 240], affiliation: 'FRIENDLY', group: 'allied' },
      russia: { label: 'Russia', cssVar: '--russia', rgb: [200, 80, 80], affiliation: 'HOSTILE', group: 'adversary' },
      china: { label: 'China', cssVar: '--china', rgb: [220, 100, 100], affiliation: 'NEUTRAL', group: 'neutral' },
      unknown: { label: 'Unknown', cssVar: '--t3', rgb: [143, 153, 168], affiliation: 'NEUTRAL', group: 'neutral' },
    };

    // Major cities for weather
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
      { id: 'rabat', name: 'Rabat', country: 'Morocco', position: [-6.8498, 33.9716], type: 'CAPITAL' },
      { id: 'casablanca', name: 'Casablanca', country: 'Morocco', position: [-7.5898, 33.5731], type: 'MAJOR_CITY' },
    ] as const;

    console.log(`[Map Data] Returning ${airborneFlights.length} flights, ${cyberThreatsData.length} threats, ${criticalEvents.length} events, ${geopoliticalRelationships.length} relationships, ${cities.length} cities`);

    // TEMPORARY: Add hardcoded test relationships to ensure lines show up
    const testRelationships = [
      {
        id: 'test-iran-israel-1',
        sourceCountry: 'Iran',
        targetCountry: 'Israel',
        sourcePosition: [51.3890, 35.6892] as [number, number],
        targetPosition: [35.2137, 31.7683] as [number, number],
        intensity: 9,
        type: 'MILITARY_CONFLICT' as const,
        description: 'TEST: Iran-Israel military tensions',
        timestamp: new Date().toISOString(),
        articles: [],
        bidirectional: false,
      },
      {
        id: 'test-us-china-trade',
        sourceCountry: 'United States',
        targetCountry: 'China',
        sourcePosition: [-77.0369, 38.9072] as [number, number],
        targetPosition: [116.4074, 39.9042] as [number, number],
        intensity: 7,
        type: 'TRADE_ROUTE' as const,
        description: 'TEST: US-China trade relationship',
        timestamp: new Date().toISOString(),
        articles: [],
        bidirectional: true,
      },
      {
        id: 'test-russia-ukraine',
        sourceCountry: 'Russia',
        targetCountry: 'Ukraine',
        sourcePosition: [37.6173, 55.7558] as [number, number],
        targetPosition: [30.5234, 50.4501] as [number, number],
        intensity: 10,
        type: 'MILITARY_CONFLICT' as const,
        description: 'TEST: Russia-Ukraine conflict',
        timestamp: new Date().toISOString(),
        articles: [],
        bidirectional: false,
      },
      {
        id: 'test-nato-alliance',
        sourceCountry: 'United States',
        targetCountry: 'UK',
        sourcePosition: [-77.0369, 38.9072] as [number, number],
        targetPosition: [-0.1278, 51.5074] as [number, number],
        intensity: 8,
        type: 'ALLIANCE' as const,
        description: 'TEST: US-UK NATO alliance',
        timestamp: new Date().toISOString(),
        articles: [],
        bidirectional: true,
      },
      {
        id: 'test-russia-europe-energy',
        sourceCountry: 'Russia',
        targetCountry: 'Germany',
        sourcePosition: [37.6173, 55.7558] as [number, number],
        targetPosition: [13.4050, 52.5200] as [number, number],
        intensity: 6,
        type: 'ENERGY_DEPENDENCY' as const,
        description: 'TEST: Russia-Europe gas pipeline',
        timestamp: new Date().toISOString(),
        articles: [],
        bidirectional: false,
      },
    ];

    // Combine real and test relationships
    const allRelationships = [...geopoliticalRelationships, ...testRelationships];
    console.log(`[Map Data] Total relationships (including ${testRelationships.length} test): ${allRelationships.length}`);

    // Add Middle East pre-defined trade routes and relationships
    const middleEastRelationships = MIDDLE_EAST_TRADE_ROUTES.map((route, idx) => ({
      ...route,
      id: `me-trade-${idx}`,
      timestamp: new Date().toISOString(),
      articles: [],
    }));
    
    const combinedRelationships = [...allRelationships, ...middleEastRelationships];
    console.log(`[Map Data] Total with Middle East routes: ${combinedRelationships.length}`);

    // Add Middle East infrastructure as targets
    const infrastructureTargets = MIDDLE_EAST_INFRASTRUCTURE.map((infra, idx) => ({
      ...infra,
      id: `me-infra-${idx}`,
      actor: 'NEUTRAL' as const,
      priority: 'P2' as const,
      category: 'INSTALLATION' as const,
      sourceEventId: null,
    }));

    // Add Middle East chokepoints and conflict zones as threat zones
    const chokepoints = MIDDLE_EAST_CHOKEPOINTS.map((zone, idx) => {
      // Assign appropriate actor based on zone location/name
      let actor: 'IRAN' | 'IRGC' | 'HOUTHI' | 'US' = 'IRAN';
      
      if (zone.name.includes('Hormuz') || zone.name.includes('Persian Gulf')) {
        actor = 'IRGC'; // IRGC controls Persian Gulf and Hormuz
      } else if (zone.name.includes('Houthi') || zone.name.includes('Red Sea') || zone.name.includes('Bab-el-Mandeb')) {
        actor = 'HOUTHI'; // Houthis control Red Sea threats
      } else if (zone.name.includes('Aden')) {
        actor = 'HOUTHI'; // Piracy/Houthi area
      } else if (zone.name.includes('Suez')) {
        actor = 'IRAN'; // Generic threat actor
      }
      
      return {
        ...zone,
        id: `me-chokepoint-${idx}`,
        actor,
        priority: 'P1' as const,
        category: 'ZONE' as const,
        sourceEventId: null,
      };
    });

    const conflictZones = MIDDLE_EAST_CONFLICT_ZONES.map((zone, idx) => {
      // Assign appropriate actor based on conflict zone
      let actor: 'HOUTHI' | 'IRAN' | 'HEZBOLLAH' | 'PMF' = 'IRAN';
      
      if (zone.name.includes('Yemen') || zone.name.includes('Houthi')) {
        actor = 'HOUTHI';
      } else if (zone.name.includes('Lebanon') || zone.name.includes('Hezbollah')) {
        actor = 'HEZBOLLAH';
      } else if (zone.name.includes('Iraq') || zone.name.includes('PMF')) {
        actor = 'PMF';
      } else if (zone.name.includes('Syria') || zone.name.includes('Gaza')) {
        actor = 'IRAN'; // Iranian-backed forces
      }
      
      return {
        ...zone,
        id: `me-conflict-${idx}`,
        actor,
        priority: 'P1' as const,
        category: 'ZONE' as const,
        sourceEventId: null,
      };
    });

    const allThreatZones = [...chokepoints, ...conflictZones];
    const allTargets = [...criticalEvents, ...infrastructureTargets];

    console.log(`[Map Data] Added ${middleEastRelationships.length} ME trade routes, ${infrastructureTargets.length} infrastructure, ${allThreatZones.length} zones`);

    // Combine all maritime lanes (Middle East + Global routes)
    const allMaritimeLanes = [...WORLD_MARITIME_LANES, ...GLOBAL_SHIPPING_ROUTES];
    console.log(`[Map Data] Total maritime lanes: ${allMaritimeLanes.length} (${WORLD_MARITIME_LANES.length} Middle East + ${GLOBAL_SHIPPING_ROUTES.length} global)`);

    return ok(
      {
        strikeArcs: [],
        missileTracks: [],
        targets: allTargets,
        assets: flightAssets,
        threatZones: allThreatZones,
        heatPoints,
        cyberThreats: cyberThreatsData,
        conflictRelationships: combinedRelationships,
        cities,
        actorMeta,
        maritimeLanes: allMaritimeLanes,
        vessels: vesselsData,
      },
      { headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=30' } }
    );
  } catch (error) {
    console.error('[Map Data] Critical error:', error);
    // Return empty map on error but don't crash
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
        maritimeLanes: [...WORLD_MARITIME_LANES, ...GLOBAL_SHIPPING_ROUTES],
        vessels: [],
      },
      { headers: { 'Cache-Control': 'public, max-age=5' } }
    );
  }
}
