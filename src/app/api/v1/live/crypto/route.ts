import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { fetchCryptoPrices } from '@/server/lib/api-clients/crypto-client';

/**
 * GET /api/v1/live/crypto
 * Real-time cryptocurrency prices from CoinGecko (FREE, no auth required)
 * 
 * Query params:
 * - symbols: comma-separated crypto symbols (default: BTC,ETH,USDT,BNB,XRP)
 */
export async function GET(req: NextRequest) {
  try {
    const symbolsParam = req.nextUrl.searchParams.get('symbols');
    const symbols = symbolsParam
      ? symbolsParam.split(',').map(s => s.trim().toUpperCase())
      : ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE'];

    console.log('[Crypto API] Fetching prices for:', symbols);
    const quotes = await fetchCryptoPrices(symbols);
    console.log(`[Crypto API] Fetched ${quotes.length} quotes`);

    // Calculate total market cap
    const totalMarketCap = quotes.reduce((sum, q) => sum + (q.marketCap || 0), 0);

    // Sort by market cap
    quotes.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

    return ok(
      {
        quotes,
        totalMarketCap,
        count: quotes.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('[Crypto API] Error:', error);
    return err(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch crypto data',
      500
    );
  }
}
