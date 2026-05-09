import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';

import type { MarketResult } from '@/types/domain';

type CacheEntry = { data: unknown; ts: number };
const cache = new Map<string, CacheEntry>();
const FRESH_TTL = 2 * 1000;
const STALE_TTL = 5 * 1000;
const refetching = new Set<string>();

type YFChartResult = {
  meta: {
    symbol: string; currency: string; regularMarketPrice: number;
    previousClose: number; chartPreviousClose?: number;
  };
  timestamp: number[];
  indicators: { quote: { open?: (number | null)[]; close?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[] }[] };
};

async function fetchTicker(ticker: string, range: string, interval: string): Promise<MarketResult> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const result: YFChartResult = json.chart?.result?.[0];
    if (!result) throw new Error('No chart data');

    const closes = result.indicators.quote[0].close ?? [];
    const opens = result.indicators.quote[0].open ?? [];
    const highs = result.indicators.quote[0].high ?? [];
    const lows = result.indicators.quote[0].low ?? [];
    const timestamps = result.timestamp ?? [];
    const chart: { time: number; open: number; close: number; low: number; high: number }[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (c != null && !isNaN(c)) {
        chart.push({
          time: timestamps[i],
          open: opens[i] ?? c,
          close: c,
          low: lows[i] ?? c,
          high: highs[i] ?? c
        });
      }
    }

    const price = result.meta.regularMarketPrice ?? (chart.length > 0 ? chart[chart.length - 1].close : 0);
    const prevClose = result.meta.chartPreviousClose ?? result.meta.previousClose ?? price;
    let change = price - prevClose;
    let changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return { ticker, price, previousClose: prevClose, change, changePct, currency: result.meta.currency ?? 'USD', chart };
  } catch (err) {
    return { 
        ticker, 
        price: 0, 
        previousClose: 0, 
        change: 0, 
        changePct: 0, 
        currency: ticker.includes('MAD') || ticker.includes('.CS') || ticker.includes('.CAS') ? 'MAD' : 'USD', 
        chart: [], 
        error: err instanceof Error ? err.message : String(err) 
    };
  }
}

async function getCached(ticker: string, range: string, interval: string): Promise<MarketResult> {
  const key = `${ticker}:${range}:${interval}:v3`;
  const cached = cache.get(key);
  const now = Date.now();

  if (cached) {
    const age = now - cached.ts;
    if (age < FRESH_TTL) return cached.data as MarketResult;
    if (age < STALE_TTL) {
      if (!refetching.has(key)) {
        refetching.add(key);
        fetchTicker(ticker, range, interval)
          .then(r => { if (!r.error) cache.set(key, { data: r, ts: Date.now() }); })
          .finally(() => refetching.delete(key));
      }
      return cached.data as MarketResult;
    }
  }

  const result = await fetchTicker(ticker, range, interval);
  if (!result.error) cache.set(key, { data: result, ts: now });
  return result;
}

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get('tickers')?.split(',').map(s => s.trim()) ?? [];
  const range = req.nextUrl.searchParams.get('range') ?? '5d';
  const interval = req.nextUrl.searchParams.get('interval') ?? '15m';

  if (tickers.length === 0) {
    return err('BAD_REQUEST', 'Provide ?tickers=BZ=F,GC=F');
  }

  // Fetch up to 50 tickers at once (increased from 20 to support the full 'all' category)
  const results = await Promise.all(tickers.slice(0, 50).map(t => getCached(t, range, interval)));

  return ok(
    { results },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  );
}
