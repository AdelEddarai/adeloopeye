import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { analyzeGeopoliticalRelationships } from '@/server/lib/geopolitical-analyzer';
import { fetchCyberThreats } from '@/server/lib/api-clients/cyber-threat-client';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { fetchDatalasticVesselsSnapshot } from '@/server/lib/api-clients/datalastic-maritime-client';
import { adsbfiClient } from '@/server/lib/api-clients/adsbfi-client';
import { transformFlightsToMapFeatures, transformNewsToHeatPoints, transformNewsToCriticalEvents } from '@/server/lib/live-data-transformer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Consume params
  
  try {
    console.log('[Map Data] Fetching data from multiple real-time sources...');
    
    // Fetch REAL data from multiple sources with individual error handling
    const [articles, cyberThreats, vesselsSnap] = await Promise.allSettled([
      multiNewsClient.searchNews('iran OR israel OR syria OR iraq OR ukraine OR russia OR china OR trade OR energy OR alliance attack OR strike OR fire OR explosion OR sanctions OR deal', 100, 'en')
        .catch(err => {
          console.error('[Map Data] News API failed:', err.message);
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
    const cyberThreatsData = cyberThreats.status === 'fulfilled' ? cyberThreats.value : [];
    const vesselsData = vesselsSnap.status === 'fulfilled' ? vesselsSnap.value : [];

    console.log(`[Map Data] Got ${articlesData.length} articles, ${cyberThreatsData.length} threats, ${vesselsData.length} vessels (AIS)`);

    // Transform into map features
    const heatPoints = transformNewsToHeatPoints(articlesData);
    const criticalEvents = transformNewsToCriticalEvents(articlesData);
    const geopoliticalRelationships = analyzeGeopoliticalRelationships(articlesData);

    console.log(`[Map Data] Analyzed ${geopoliticalRelationships.length} real geopolitical relationships`);

    // Actor metadata for map coloring
    const actorMeta = {
      us: { label: 'US', cssVar: '--us', rgb: [45, 114, 210], affiliation: 'FRIENDLY', group: 'allied' },
      iran: { label: 'Iran', cssVar: '--iran', rgb: [231, 106, 110], affiliation: 'HOSTILE', group: 'adversary' },
      israel: { label: 'Israel', cssVar: '--israel', rgb: [76, 144, 240], affiliation: 'FRIENDLY', group: 'allied' },
      russia: { label: 'Russia', cssVar: '--russia', rgb: [200, 80, 80], affiliation: 'HOSTILE', group: 'adversary' },
      china: { label: 'China', cssVar: '--china', rgb: [220, 100, 100], affiliation: 'NEUTRAL', group: 'neutral' },
      unknown: { label: 'Unknown', cssVar: '--t3', rgb: [143, 153, 168], affiliation: 'NEUTRAL', group: 'neutral' },
    };

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
    ] as const;

    console.log(`[Map Data] Returning ${cyberThreatsData.length} threats, ${criticalEvents.length} events, ${geopoliticalRelationships.length} relationships, ${cities.length} cities`);

    return ok(
      {
        strikeArcs: [],
        missileTracks: [],
        targets: criticalEvents,
        assets: [],
        threatZones: [],
        heatPoints,
        cyberThreats: cyberThreatsData,
        conflictRelationships: geopoliticalRelationships,
        cities,
        actorMeta,
        maritimeLanes: [],
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
        maritimeLanes: [],
        vessels: [],
      },
      { headers: { 'Cache-Control': 'public, max-age=5' } }
    );
  }
}
