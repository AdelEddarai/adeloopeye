'use client';

import { ArrowDown, ArrowUp, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useMarketData } from '@/features/economics/queries';

const WIDGET_TICKERS = [
  'CL=F',    // WTI Crude Oil
  'BZ=F',    // Brent Crude
  'NG=F',    // Natural Gas
  'GC=F',    // Gold
  'SI=F',    // Silver
  'HG=F',    // Copper
];

export function CommodityPricesWidget() {
  const { data, isLoading, isFetching, refetch } = useMarketData(
    WIDGET_TICKERS,
    { key: '1d', interval: '5m' }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  const results = data?.results || [];
  const energyCommodities = results.filter((_, i) => i < 3); // First 3 are energy
  const metalsCommodities = results.filter((_, i) => i >= 3); // Rest are metals

  const formatPrice = (price: number) => {
    if (price >= 1000) return `${(price / 1000).toFixed(2)}K`;
    if (price >= 1) return `${price.toFixed(2)}`;
    return `${price.toFixed(4)}`;
  };

  const getName = (ticker: string) => {
    const names: Record<string, string> = {
      'CL=F': 'WTI Crude',
      'BZ=F': 'Brent Crude',
      'NG=F': 'Natural Gas',
      'GC=F': 'Gold',
      'SI=F': 'Silver',
      'HG=F': 'Copper',
    };
    return names[ticker] || ticker;
  };

  const getUnit = (ticker: string) => {
    const units: Record<string, string> = {
      'CL=F': 'per barrel',
      'BZ=F': 'per barrel',
      'NG=F': 'per MMBtu',
      'GC=F': 'per oz',
      'SI=F': 'per oz',
      'HG=F': 'per lb',
    };
    return units[ticker] || '';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--bd-s)]">
        <span className="mono text-[10px] text-[var(--t4)]">
          COMMODITIES (LIVE)
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {/* Energy Section */}
        {energyCommodities.length > 0 && (
          <>
            <div className="mono text-[9px] text-[var(--t4)] px-1 mb-1">ENERGY</div>
            {energyCommodities.map((commodity) => {
              const isPositive = commodity.changePct >= 0;
              return (
                <div
                  key={commodity.ticker}
                  className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--bd)]"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-sm text-[var(--t1)] font-semibold">
                          {getName(commodity.ticker)}
                        </span>
                      </div>
                      <div className="mono text-xs text-[var(--t2)] mt-0.5">
                        {formatPrice(commodity.price)}
                      </div>
                      <div className="text-[9px] text-[var(--t4)] mt-0.5">
                        {getUnit(commodity.ticker)}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}>
                      {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      <span className="mono text-xs font-semibold">
                        {Math.abs(commodity.changePct).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px]">
                    <span className="text-[var(--t4)]">24h Change:</span>
                    <span className={`ml-1 mono ${
                      isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}>
                      {isPositive ? '+' : ''}{commodity.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Metals Section */}
        {metalsCommodities.length > 0 && (
          <>
            <div className="mono text-[9px] text-[var(--t4)] px-1 mb-1 mt-3">METALS</div>
            {metalsCommodities.map((commodity) => {
              const isPositive = commodity.changePct >= 0;
              return (
                <div
                  key={commodity.ticker}
                  className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--bd)]"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-sm text-[var(--t1)] font-semibold">
                          {getName(commodity.ticker)}
                        </span>
                      </div>
                      <div className="mono text-xs text-[var(--t2)] mt-0.5">
                        {formatPrice(commodity.price)}
                      </div>
                      <div className="text-[9px] text-[var(--t4)] mt-0.5">
                        {getUnit(commodity.ticker)}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}>
                      {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      <span className="mono text-xs font-semibold">
                        {Math.abs(commodity.changePct).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px]">
                    <span className="text-[var(--t4)]">24h Change:</span>
                    <span className={`ml-1 mono ${
                      isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                    }`}>
                      {isPositive ? '+' : ''}{commodity.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
