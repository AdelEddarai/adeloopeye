'use client';

import { Activity } from 'lucide-react';

type SourceFreshnessProps = {
  sources?: {
    rss: number;
    api: number;
    telegram: number;
    earthquakes: number;
    eonet: number;
    gdelt: number;
    total: number;
  };
  timestamp?: string;
};

const SOURCES = [
  { key: 'rss', label: 'RSS Feeds', dot: 'bg-blue-400' },
  { key: 'api', label: 'News APIs', dot: 'bg-emerald-400' },
  { key: 'telegram', label: 'Telegram OSINT', dot: 'bg-fuchsia-400' },
  { key: 'gdelt', label: 'GDELT Global', dot: 'bg-orange-400' },
  { key: 'earthquakes', label: 'USGS Seismic', dot: 'bg-red-500' },
  { key: 'eonet', label: 'NASA EONET', dot: 'bg-rose-500' },
] as const;

export function SourceFreshness({ sources, timestamp }: SourceFreshnessProps) {
  const lastSync = timestamp ? new Date(timestamp).toLocaleTimeString() : '--';

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Source Freshness</span>
        <span className="ml-auto text-[9px] text-emerald-400 mono animate-pulse">● LIVE</span>
      </div>

      <div className="space-y-1">
        {SOURCES.map(src => {
          const count = sources?.[src.key] ?? 0;
          const hasData = count > 0;
          return (
            <div key={src.key} className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-950/50 border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full ${src.dot} ${hasData ? '' : 'opacity-30'}`} />
              <span className="text-[10px] text-zinc-400 flex-1 truncate">{src.label}</span>
              {hasData && (
                <span className="text-[9px] text-zinc-500 mono">live</span>
              )}
              <span className="text-[10px] font-bold mono text-zinc-200 tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[8px] text-zinc-600 font-mono tracking-widest uppercase">Telemetry Sync</span>
        <span className="text-[9px] text-cyan-300 font-mono tabular-nums">{lastSync}</span>
      </div>
    </div>
  );
}
