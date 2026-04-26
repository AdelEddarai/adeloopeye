'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDown, ArrowUp, RefreshCw, TrendingUp, DollarSign, Zap, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useMarketData } from '@/features/economics/queries';
import { useIsLandscapePhone } from '@/shared/hooks/use-is-landscape-phone';
import { useLandscapeScrollEmitter } from '@/shared/hooks/use-landscape-scroll-emitter';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

function Sparkline({ data, isPositive }: { data: {time: number, close: number}[], isPositive: boolean }) {
  if (!data || data.length === 0) return <div className="w-16 h-6 bg-[var(--bg-3)] rounded opacity-50 ml-auto" />;
  
  const values = data.map(d => d.close).filter(v => typeof v === 'number');
  if (values.length < 2) return <div className="w-16 h-6 bg-[var(--bg-3)] rounded opacity-50 ml-auto" />;
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const pts = values.map((val, i) => {
    const x = (i / (values.length - 1)) * 60;
    const y = 22 - ((val - min) / range) * 20; // Leave 2px top/bottom padding
    return `${x},${y}`;
  }).join(' ');
  
  const fillPts = `0,24 ${pts} 60,24`;
  const color = isPositive ? '#10b981' : '#ef4444';
  
  return (
    <svg width="60" height="24" className="overflow-visible ml-auto">
      <defs>
        <linearGradient id={`spark-grad-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#spark-grad-${isPositive})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CategoryKey =
  | 'all'
  | 'energy'
  | 'commodities'
  | 'indices'
  | 'fx'
  | 'economy'
  | 'morocco-finance'
  | 'morocco-market'
  | 'tech'
  | 'defense';

const TICKER_NAMES: Record<string, string> = {
  'CL=F': 'WTI Crude Oil',
  'BZ=F': 'Brent Crude',
  'NG=F': 'Natural Gas',
  'RB=F': 'Gasoline',
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'PL=F': 'Platinum',
  'HG=F': 'Copper',
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
  '^DJI': 'Dow Jones',
  '^VIX': 'VIX',
  'DX-Y.NYB': 'US Dollar Index',
  'EURUSD=X': 'EUR/USD',
  'JPY=X': 'USD/JPY',
  'AAPL': 'Apple',
  'MSFT': 'Microsoft',
  'GOOGL': 'Google',
  'AMZN': 'Amazon',
  'META': 'Meta',
  'NVDA': 'NVIDIA',
  'TSLA': 'Tesla',
  'LMT': 'Lockheed Martin',
  'BA': 'Boeing',
  'RTX': 'Raytheon',
  'NOC': 'Northrop Grumman',
  'CRM': 'Salesforce',
  'ORCL': 'Oracle',
  'SAP': 'SAP',
  'ADBE': 'Adobe',
  // Sovereign and economy proxies
  '^TNX': 'US 10Y Treasury Yield',
  '^IRX': 'US 13W Treasury Bill',
  'EURMAD=X': 'EUR/MAD',
  'USDMAD=X': 'USD/MAD',
  // Morocco market tickers (Yahoo naming)
  'IAM.CS': 'Maroc Telecom',
  'ATW.CS': 'Attijariwafa Bank',
  'BOA.CS': 'Bank of Africa Morocco',
  'MNG.CS': 'Managem',
  'LHM.CS': 'LafargeHolcim Maroc',
  'CSR.CS': 'Cosumar',
  'IAM.CAS': 'Maroc Telecom (CAS)',
  'ATW.CAS': 'Attijariwafa Bank (CAS)',
  'BOA.CAS': 'Bank of Africa (CAS)',
  'MNG.CAS': 'Managem (CAS)',
  'LHM.CAS': 'LafargeHolcim (CAS)',
  'CSR.CAS': 'Cosumar (CAS)',
  MOR: 'VanEck Morocco ETF',
};

const CATEGORIES = {
  all: [
    'CL=F', 'BZ=F', 'NG=F', 'RB=F', 'GC=F', 'SI=F', 'PL=F', 'HG=F',
    '^GSPC', '^IXIC', '^DJI', '^VIX', 'DX-Y.NYB', 'EURUSD=X', 'JPY=X', 'USDMAD=X', 'EURMAD=X',
    '^TNX', '^IRX', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'LMT', 'BA', 'RTX', 'NOC',
    'IAM.CS', 'ATW.CS', 'BOA.CS', 'MNG.CS', 'LHM.CS', 'CSR.CS',
    'IAM.CAS', 'ATW.CAS', 'BOA.CAS', 'MNG.CAS', 'LHM.CAS', 'CSR.CAS', 'MOR',
  ],
  energy: ['CL=F', 'BZ=F', 'NG=F', 'RB=F'],
  commodities: ['GC=F', 'SI=F', 'PL=F', 'HG=F', 'CL=F', 'BZ=F', 'NG=F'],
  indices: ['^GSPC', '^IXIC', '^DJI', '^VIX'],
  fx: ['DX-Y.NYB', 'EURUSD=X', 'JPY=X', 'USDMAD=X', 'EURMAD=X'],
  economy: ['^TNX', '^IRX', '^VIX', 'DX-Y.NYB', 'CL=F', 'GC=F'],
  'morocco-finance': ['USDMAD=X', 'EURMAD=X', 'MOR', 'ATW.CS', 'ATW.CAS', 'BOA.CS', 'BOA.CAS', 'IAM.CS', 'IAM.CAS'],
  'morocco-market': ['IAM.CS', 'ATW.CS', 'BOA.CS', 'MNG.CS', 'LHM.CS', 'CSR.CS', 'IAM.CAS', 'ATW.CAS', 'BOA.CAS', 'MNG.CAS', 'LHM.CAS', 'CSR.CAS', 'MOR'],
  tech: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'],
  defense: ['LMT', 'BA', 'RTX', 'NOC'],
};

type MarketsContentProps = {
  isWidget?: boolean;
};

export function MarketsContent({ isWidget = false }: MarketsContentProps) {
  const isLandscapePhone = useIsLandscapePhone();
  const onLandscapeScroll = useLandscapeScrollEmitter(isLandscapePhone);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSeconds, setRefreshSeconds] = useState<5 | 10>(5);
  
  const tickers = CATEGORIES[activeCategory];
  const { data, isLoading, isFetching, refetch } = useMarketData(tickers, { key: '1d', interval: '5m' });
  const previousPricesRef = useRef<Record<string, number>>({});
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [changedTickers, setChangedTickers] = useState<Record<string, 'up' | 'down'>>({});

  // Auto-refresh cadence set to 5s/10s for readable live updates
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, refreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshSeconds, refetch]);

  const results = data?.results || [];
  const availableResults = results.filter(result => !(result.price === 0 && result.previousClose === 0 && result.chart.length === 0));
  const unavailableResults = results.filter(result => result.price === 0 && result.previousClose === 0 && result.chart.length === 0);
  const lastUpdate = new Date().toLocaleTimeString();

  useEffect(() => {
    if (results.length === 0) return;

    const nextChanges: Record<string, 'up' | 'down'> = {};
    const nextPrices: Record<string, number> = {};

    for (const result of results) {
      const prevPrice = previousPricesRef.current[result.ticker];
      nextPrices[result.ticker] = result.price;
      if (prevPrice == null || prevPrice === result.price) continue;
      nextChanges[result.ticker] = result.price > prevPrice ? 'up' : 'down';
    }

    previousPricesRef.current = nextPrices;
    setChangedTickers(nextChanges);

    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setChangedTickers({}), 900);
  }, [results]);

  useEffect(
    () => () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    },
    [],
  );

  return (
    <div
      className={`flex flex-col w-full h-full min-h-0 bg-[var(--bg-1)] ${isLandscapePhone ? 'overflow-y-auto' : ''}`}
      onScroll={isLandscapePhone ? onLandscapeScroll : undefined}
    >
      {/* Header */}
      {!isWidget && (
      <div className={`flex items-center justify-between py-2 border-b border-[var(--bd)] bg-[var(--bg-app)] shrink-0 ${isLandscapePhone ? 'safe-px' : 'px-5'}`}>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/data"
            className="mono text-[length:var(--text-label)] text-[var(--t4)] hover:text-[var(--t2)] no-underline transition-colors"
          >
            ← DATA
          </Link>
          <div className="w-px h-4 bg-[var(--bd)]" />
          <span className="mono text-[length:var(--text-label)] font-bold text-[var(--t1)] tracking-wider">LIVE MARKETS</span>
          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[9px] px-1.5 py-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
            LIVE
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-auto px-2 py-1 text-[length:var(--text-caption)] mono ${
              autoRefresh ? 'text-emerald-400' : 'text-[var(--t4)]'
            }`}
          >
            {autoRefresh ? 'AUTO-REFRESH ON' : 'AUTO-REFRESH OFF'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshSeconds(prev => (prev === 5 ? 10 : 5))}
            className="h-auto px-2 py-1 text-[length:var(--text-caption)] mono text-[var(--t4)] hover:text-[var(--t2)]"
          >
            {refreshSeconds}s
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 h-auto px-2 py-1 text-[length:var(--text-caption)] mono text-[var(--t4)] hover:text-[var(--t2)]"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            REFRESH
          </Button>

          <span className="mono text-[length:var(--text-caption)] text-[var(--t4)]">
            {lastUpdate}
          </span>
        </div>
      </div>
      )}

      {/* Category Tabs */}
      <div className={`border-b border-[var(--bd)] bg-[var(--bg-2)] shrink-0 ${isLandscapePhone ? 'safe-px' : 'px-5'} py-2`}>
        <div className="flex gap-2 overflow-x-auto">
          {Object.keys(CATEGORIES).map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(cat as CategoryKey)}
              className={`h-auto px-3 py-1.5 text-[length:var(--text-caption)] mono font-bold tracking-wider shrink-0 ${
                activeCategory === cat
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-[var(--t4)] hover:text-[var(--t2)]'
              }`}
            >
              {cat === 'energy' && <Zap className="w-3 h-3 mr-1" />}
              {cat === 'commodities' && <Shield className="w-3 h-3 mr-1" />}
              {cat === 'indices' && <TrendingUp className="w-3 h-3 mr-1" />}
              {cat === 'fx' && <DollarSign className="w-3 h-3 mr-1" />}
              {cat === 'all' && <TrendingUp className="w-3 h-3 mr-1" />}
              {cat.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={isLandscapePhone ? 'p-3 safe-px' : 'flex-1 overflow-y-auto p-4'}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--t3)] mono">Loading market data...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Charts Grid - Auto Fit based on Container Width */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {availableResults.slice(0, 4).map((result) => (
                <MarketChart key={result.ticker} data={result} />
              ))}
            </div>

            {/* Table */}
            <Card className="bg-[var(--bg-2)] border-[var(--bd)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[var(--t2)]">
                  {activeCategory.toUpperCase()} — All Instruments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded border border-[var(--bd-s)] bg-[var(--bg-1)]">
                  <table className="w-full market-table">
                    <thead className="sticky top-0 z-10 bg-[var(--bg-2)]/95 backdrop-blur-sm">
                      <tr className="border-b border-[var(--bd)]">
                        <th className="text-left py-2 px-2 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono">LIVE</th>
                        <th className="text-left py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono">SYMBOL</th>
                        {!isWidget && <th className="text-left py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono hidden sm:table-cell">NAME</th>}
                        <th className="text-right py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono">CHART</th>
                        <th className="text-right py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono">PRICE</th>
                        {!isWidget && <th className="text-right py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono hidden sm:table-cell">CHANGE</th>}
                        <th className="text-right py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono">CHANGE %</th>
                        {!isWidget && <th className="text-right py-2 px-3 text-[length:var(--text-caption)] font-bold text-[var(--t4)] mono hidden md:table-cell">PREV CLOSE</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {availableResults.map((result, index) => {
                        const isPositive = result.changePct >= 0;
                        const changeState = changedTickers[result.ticker];
                        const flashClass = changeState === 'up' ? 'market-flash-up' : changeState === 'down' ? 'market-flash-down' : '';
                        const latestPoint = result.chart?.at(-1);
                        const lastPointTime = latestPoint?.time ? new Date(latestPoint.time * 1000).toLocaleTimeString() : '--:--:--';
                        return (
                          <tr key={result.ticker} className={`border-b border-[var(--bd-s)] hover:bg-[var(--bg-3)] transition-colors ${flashClass}`}>
                            <td className="py-2 px-2">
                              <div className={`h-1.5 w-1.5 rounded-full ${changeState ? 'animate-pulse' : ''} ${isPositive ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                            </td>
                            <td className="py-2 px-3 mono text-[length:var(--text-body-sm)] font-bold text-[var(--t2)]">{result.ticker}</td>
                            
                            {!isWidget && (
                              <td className="py-2 px-3 text-[length:var(--text-body-sm)] text-[var(--t3)] hidden sm:table-cell">
                                <div className="truncate max-w-[120px]">{TICKER_NAMES[result.ticker] || result.ticker}</div>
                              </td>
                            )}

                            <td className={`py-2 px-3 text-right ${flashClass}`}>
                              <Sparkline data={result.chart} isPositive={isPositive} />
                            </td>

                            <td className={`py-2 px-3 text-right mono text-[length:var(--text-body-sm)] font-semibold text-[var(--t1)] ${flashClass}`}>
                              <div>
                                {result.currency === 'USD' ? '$' : ''}
                                {result.price.toFixed(2)}
                                {result.currency === 'MAD' ? ' MAD' : ''}
                              </div>
                              {!isWidget && <div className="text-[9px] text-[var(--t4)]">tick {lastPointTime}</div>}
                            </td>

                            {!isWidget && (
                              <td className={`py-2 px-3 text-right mono text-[length:var(--text-body-sm)] font-semibold hidden sm:table-cell ${flashClass} ${
                                isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                              }`}>
                                {isPositive ? '+' : ''}{result.change.toFixed(2)}
                              </td>
                            )}

                            <td className={`py-2 px-3 text-right ${flashClass}`}>
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                <span className="mono text-[length:var(--text-caption)] font-bold">
                                  {Math.abs(result.changePct).toFixed(2)}%
                                </span>
                              </div>
                            </td>

                            {!isWidget && (
                              <td className={`py-2 px-3 text-right mono text-[length:var(--text-body-sm)] text-[var(--t4)] hidden md:table-cell ${flashClass}`}>
                                {result.previousClose.toFixed(2)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {unavailableResults.length > 0 && (
                  <div className="mt-2 rounded border border-[var(--warning-bd)] bg-[var(--warning-dim)] px-3 py-2">
                    <p className="mono text-[length:var(--text-caption)] text-[var(--warning)]">
                      {unavailableResults.length} symbols unavailable from current live feed provider.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketChart({ data }: { data: any }) {
  const isPositive = data.changePct >= 0;
  
  // FIX: When markets are closed, all 300+ data points might be exactly the same value.
  // ECharts 'scale: true' disappears/crashes when max === min.
  // We manually compute the domain and pad it if it's perfectly flat.
  const values = data.chart?.map((p: any) => p.close) || [];
  
  let minVal: number | undefined = undefined;
  let maxVal: number | undefined = undefined;
  
  if (values.length > 0) {
    minVal = Math.min(...values, ...data.chart.map((p: any) => p.low));
    maxVal = Math.max(...values, ...data.chart.map((p: any) => p.high));
    if (minVal === maxVal) {
      minVal = minVal * 0.99;
      maxVal = maxVal * 1.01;
    }
  }
  
  const option = {
    backgroundColor: 'transparent',
    grid: { left: '1%', right: '1%', bottom: '0%', top: '15%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      borderColor: isPositive ? '#10b981' : '#ef4444',
      textStyle: { color: '#e4e4e7', fontSize: 10 },
      formatter: (params: any) => {
        const point = params[0];
        const [time, open, close, low, high] = point.data;
        return `
          <div style="font-weight:bold; margin-bottom:4px; border-bottom: 1px solid #3f3f46; padding-bottom: 4px;">
            ${new Date(time).toLocaleTimeString()}
          </div>
          <div style="display:grid; grid-template-columns: auto auto; gap: 4px 12px;">
            <span style="color:#a1a1aa">Open</span> <span style="font-family:monospace; text-align:right">${open.toFixed(2)}</span>
            <span style="color:#a1a1aa">High</span> <span style="font-family:monospace; text-align:right; color:#10b981">${high.toFixed(2)}</span>
            <span style="color:#a1a1aa">Low</span> <span style="font-family:monospace; text-align:right; color:#ef4444">${low.toFixed(2)}</span>
            <span style="color:#a1a1aa">Close</span> <span style="font-family:monospace; text-align:right; color:${close >= open ? '#10b981' : '#ef4444'}">${close.toFixed(2)}</span>
          </div>
        `;
      }
    },
    xAxis: {
      type: 'category',
      data: data.chart.map((p: any) => p.time * 1000),
      axisLine: { show: false },
      axisLabel: { show: false }, // Hide time labels to keep it clean like before
      axisTick: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: minVal,
      max: maxVal,
      axisLine: { show: false },
      axisLabel: { 
        color: '#71717a', 
        fontSize: 9,
        formatter: (val: number) => {
          if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
          if (val < 10) return val.toFixed(2);
          return val.toFixed(1);
        }
      },
      splitLine: { lineStyle: { color: '#27272a', type: 'dashed' } },
      scale: true
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      },
      {
        show: false, // hidden scrollbar
        type: 'slider',
        xAxisIndex: [0],
        bottom: 0
      }
    ],
    series: [
      {
        type: 'candlestick',
        data: data.chart.map((point: any) => [
          point.open,
          point.close,
          point.low,
          point.high
        ]),
        itemStyle: {
          color: '#10b981',      // Bullish candle fill
          color0: '#ef4444',     // Bearish candle fill
          borderColor: '#10b981',// Bullish border/wick
          borderColor0: '#ef4444'// Bearish border/wick
        }
      }
    ]
  };

  return (
    <Card className="bg-[var(--bg-2)] border-[var(--bd)] min-w-0 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-[var(--t1)]">
              {TICKER_NAMES[data.ticker] || data.ticker}
            </CardTitle>
            <p className="text-[length:var(--text-caption)] text-[var(--t4)] mono mt-0.5">{data.ticker}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold mono text-[var(--t1)]">
              {data.currency !== 'USD' && data.currency !== 'MAD' ? data.currency + ' ' : ''}
              {data.currency === 'USD' ? '$' : ''}
              {data.price.toFixed(2)}
              {data.currency === 'MAD' ? ' MAD' : ''}
            </div>
            <div className={`flex items-center gap-1 justify-end ${
              isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            }`}>
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span className="mono text-xs font-semibold">
                {isPositive ? '+' : ''}{data.change.toFixed(2)} ({Math.abs(data.changePct).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ReactECharts option={option} style={{ height: '140px' }} opts={{ renderer: 'svg' }} />
      </CardContent>
    </Card>
  );
}
