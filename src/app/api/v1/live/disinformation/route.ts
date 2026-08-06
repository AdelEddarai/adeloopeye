import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { fetchDisinformationIntel } from '@/server/lib/api-clients/disinformation-client';

/**
 * Live Disinformation / Bot Network Intelligence API
 * Free, keyless sources: GDELT (reported campaigns) + botnet blocklists + IP geolocation.
 *
 * Query params:
 * - focus: ISO country code the radar monitors (default: MA)
 */
export async function GET(req: NextRequest) {
  try {
    const focus = (req.nextUrl.searchParams.get('focus') || 'MA').toUpperCase();

    console.log(`[Disinformation API] Fetching intel for focus=${focus}...`);
    const data = await fetchDisinformationIntel(focus);

    console.log(
      `[Disinformation API] ${data.stats.campaigns} campaigns, ${data.stats.botCountries} bot countries, ${data.stats.articleCount} articles`
    );

    return ok(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Disinformation API] Error:', error);

    return ok(
      {
        focus: { code: 'MA', name: 'Morocco', lat: 31.79, lon: -7.09 },
        edges: [],
        nodes: [],
        articles: [],
        stats: { campaigns: 0, botSources: 0, botCountries: 0, articleCount: 0 },
        sources: [],
        timestamp: new Date().toISOString(),
      },
      {
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}
