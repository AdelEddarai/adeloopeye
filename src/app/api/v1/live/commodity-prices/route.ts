import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { fetchCommodityPrices } from '@/server/lib/api-clients/commodity-prices-client';

/**
 * Live Commodity Prices API
 * Returns real-time commodity prices (Oil, Gas, Gold, Silver, Copper)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Commodity Prices API] Fetching prices...');
    const commodities = await fetchCommodityPrices();
    console.log(`[Commodity Prices API] Fetched ${commodities.length} commodities`);

    return ok(
      { commodities, timestamp: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('[Commodity Prices API] Error:', error);
    // Return empty array on error - the client will use simulated data
    return ok(
      { commodities: [], timestamp: new Date().toISOString() },
      {
        headers: { 'Cache-Control': 'public, max-age=30' },
      }
    );
  }
}
