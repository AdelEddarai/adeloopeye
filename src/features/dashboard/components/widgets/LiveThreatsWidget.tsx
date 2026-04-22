'use client';

import { AlertTriangle, Loader2, RefreshCw, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLiveThreats } from '@/shared/hooks/use-live-threats';

export function LiveThreatsWidget() {
  const { data, isLoading, error, refetch, isFetching } = useLiveThreats(50, 90);

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
        <p className="font-semibold">Failed to load threat data</p>
        <p className="text-sm text-[var(--t3)] mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  // Get top countries by threat count
  const topCountries = Object.entries(data?.byCountry || {})
    .map(([code, ips]) => ({ code, count: ips.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--bd-s)]">
        <Shield size={12} className="text-[var(--danger)]" />
        <span className="mono text-[10px] text-[var(--t4)]">
          {data?.count || 0} threats • {data?.confidence}% confidence
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

      <div className="flex-1 overflow-y-auto p-2.5">
        {/* Country summary */}
        <div className="mb-3">
          <h3 className="label mb-2">TOP THREAT SOURCES</h3>
          <div className="space-y-1">
            {topCountries.map(({ code, count }) => (
              <div key={code} className="flex items-center gap-2">
                <span className="mono text-xs text-[var(--t2)] w-8">{code}</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-3)] rounded overflow-hidden">
                  <div
                    className="h-full bg-[var(--danger)]"
                    style={{ width: `${(count / (data?.count || 1)) * 100}%` }}
                  />
                </div>
                <span className="mono text-[10px] text-[var(--t4)] w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* IP list */}
        <div>
          <h3 className="label mb-2">RECENT THREATS</h3>
          <div className="space-y-1.5">
            {data?.blacklist.slice(0, 20).map((ip) => (
              <div
                key={ip.ipAddress}
                className="p-2 rounded bg-[var(--bg-2)] border border-[var(--bd)]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="mono text-xs text-[var(--t1)] font-semibold">
                    {ip.ipAddress}
                  </span>
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={10} className="text-[var(--danger)]" />
                    <span className="mono text-[9px] text-[var(--danger)]">
                      {ip.abuseConfidenceScore}%
                    </span>
                  </div>
                </div>
                <div className="text-[9px] text-[var(--t3)]">
                  <span>{ip.countryCode}</span>
                  {ip.isp && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="line-clamp-1">{ip.isp}</span>
                    </>
                  )}
                </div>
                <div className="text-[9px] text-[var(--t4)] mt-0.5">
                  {ip.totalReports} reports • Last: {new Date(ip.lastReportedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
