import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { fetchMoroccoData } from '@/server/lib/api-clients/morocco-client';

export async function GET(_req: NextRequest) {
  try {
    const data = await fetchMoroccoData();
    
    return ok(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache
      },
    });
  } catch (error) {
    console.error('Morocco API error:', error);
    return ok(
      {
        news: [],
        keyLocations: [],
        economicIndicators: { gdpGrowth: 0, inflation: 0, unemployment: 0, tradeBalance: 'N/A' },
        securityAlerts: [],
      },
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
