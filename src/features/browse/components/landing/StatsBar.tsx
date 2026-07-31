'use client';

import { useMoroccoIntelligence } from '@/shared/hooks/use-morocco-intelligence';

export function StatsBar() {
  const { data, isLoading } = useMoroccoIntelligence(true);

  // Real-time stats from Morocco intelligence
  const stats = [
    { 
      label: 'Active Events', 
      value: isLoading ? '...' : `${data?.summary.totalEvents || 0}` 
    },
    { 
      label: 'Cities Tracked', 
      value: '70+' 
    },
    { 
      label: 'News Sources', 
      value: `${(data?.summary.sources.total || 0)}+` 
    },
    { 
      label: 'Critical Events', 
      value: isLoading ? '...' : `${data?.summary.criticalEvents || 0}` 
    },
  ];

  return (
    <section className="px-5 py-8 max-w-3xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-[var(--bd)] p-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="mono text-lg font-bold text-[var(--t1)]">
              {stat.value}
            </p>
            <p className="label mt-1 text-[var(--t2)]">{stat.label}</p>
          </div>
        ))}
      </div>
      {data && (
        <div className="text-center mt-3">
          <p className="text-[10px] text-[var(--t3)] mono">
            Live data • Updated {new Date(data.timestamp).toLocaleTimeString()} • 
            RSS: {data.summary.sources.rss} • API: {data.summary.sources.api}
          </p>
        </div>
      )}
    </section>
  );
}
