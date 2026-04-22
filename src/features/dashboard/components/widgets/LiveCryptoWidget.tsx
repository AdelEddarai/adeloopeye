'use client';

import { ArrowDown, ArrowUp, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLiveCrypto } from '@/shared/hooks/use-live-crypto';

export function LiveCryptoWidget() {
  const { data, isLoading, error, refetch, isFetching } = useLiveCrypto();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-[var(--t4)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-[var(--danger)]">
        <p className="font-semibold">Failed to load crypto data</p>
        <p className="text-sm text-[var(--t3)] mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(2)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(0)}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--bd-s)]">
        <span className="mono text-[10px] text-[var(--t4)]">
          Total: {formatMarketCap(data?.totalMarketCap || 0)}
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
        {data?.quotes.map((quote) => {
          const isPositive = quote.changePercent24h >= 0;
          return (
            <div
              key={quote.symbol}
              className="p-2.5 rounded bg-[var(--bg-2)] border border-[var(--bd)]"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono text-sm text-[var(--t1)] font-semibold">
                      {quote.symbol}
                    </span>
                    <span className="text-[9px] text-[var(--t4)]">
                      {quote.name}
                    </span>
                  </div>
                  <div className="mono text-xs text-[var(--t2)] mt-0.5">
                    {formatPrice(quote.price)}
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${
                  isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                }`}>
                  {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  <span className="mono text-xs font-semibold">
                    {Math.abs(quote.changePercent24h).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 text-[9px]">
                <div>
                  <span className="text-[var(--t4)]">24h Vol:</span>
                  <span className="text-[var(--t2)] ml-1 mono">
                    {formatMarketCap(quote.volume24h)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--t4)]">MCap:</span>
                  <span className="text-[var(--t2)] ml-1 mono">
                    {formatMarketCap(quote.marketCap)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
