'use client';

import { useMemo } from 'react';
import { Radio, AlertTriangle, Waves, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MoroccoEarthquake } from '@/server/lib/api-clients/usgs-earthquake-client';

function magColor(mag: number): string {
  if (mag >= 5) return '#ef4444';
  if (mag >= 4) return '#f97316';
  if (mag >= 3) return '#eab308';
  return '#4ade80';
}

function magBg(mag: number): string {
  if (mag >= 5) return 'rgba(239,68,68,0.15)';
  if (mag >= 4) return 'rgba(249,115,22,0.15)';
  if (mag >= 3) return 'rgba(234,179,8,0.15)';
  return 'rgba(74,222,128,0.15)';
}

type EarthquakePanelProps = {
  quakes?: MoroccoEarthquake[];
};

export function EarthquakePanel({ quakes = [] }: EarthquakePanelProps) {
  const sorted = useMemo(
    () => [...quakes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [quakes]
  );
  const byMagnitude = useMemo(() => [...quakes].sort((a, b) => b.magnitude - a.magnitude), [quakes]);

  const latest = sorted[0];
  const strongest = byMagnitude[0];
  const significant = quakes.filter(q => q.magnitude >= 4).length;
  const max = strongest?.magnitude ?? 0;

  // Distribution by magnitude buckets
  const buckets = [
    { label: 'M5.0+', count: quakes.filter(q => q.magnitude >= 5).length, color: '#ef4444' },
    { label: 'M4.0-4.9', count: quakes.filter(q => q.magnitude >= 4 && q.magnitude < 5).length, color: '#f97316' },
    { label: 'M3.0-3.9', count: quakes.filter(q => q.magnitude >= 3 && q.magnitude < 4).length, color: '#eab308' },
    { label: 'M2.0-2.9', count: quakes.filter(q => q.magnitude >= 2 && q.magnitude < 3).length, color: '#4ade80' },
  ];
  const maxBucket = Math.max(1, ...buckets.map(b => b.count));

  const summary = [
    { label: 'Latest Quake', value: latest ? `M${latest.magnitude.toFixed(1)}` : '--', sub: latest?.location || '--', icon: Timer, color: 'text-cyan-400' },
    { label: 'Max Mag (24h)', value: max ? `M${max.toFixed(1)}` : '--', sub: strongest?.location || '--', icon: Radio, color: 'text-red-400' },
    { label: 'Significant M4+', value: String(significant), sub: 'quakes ≥ M4.0', icon: AlertTriangle, color: 'text-orange-400' },
    { label: 'Total (24h)', value: String(quakes.length), sub: 'in Morocco region', icon: Waves, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {summary.map(s => (
          <Card key={s.label} className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold font-mono">{s.label}</span>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
              <p className="text-lg font-bold mono text-white leading-none">{s.value}</p>
              <p className="text-[9px] text-zinc-500 truncate mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {/* Magnitude distribution */}
        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Magnitude Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {buckets.map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-[9px] font-bold mono w-14 text-zinc-400">{b.label}</span>
                <div className="flex-1 h-3 bg-zinc-950/60 rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{ width: `${(b.count / maxBucket) * 100}%`, backgroundColor: b.color, opacity: 0.85 }}
                  />
                </div>
                <span className="text-[10px] font-bold mono text-zinc-200 w-5 text-right tabular-nums">{b.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent quakes */}
        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Recent Seismic Events <span className="text-red-400 animate-pulse ml-1">●</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {sorted.slice(0, 12).map(q => (
                <div key={q.id} className="flex items-center gap-2 p-2 rounded bg-zinc-950/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                  <span
                    className="text-[11px] font-bold mono px-1.5 py-0.5 rounded text-white shrink-0"
                    style={{ backgroundColor: magBg(q.magnitude), color: magColor(q.magnitude), border: `1px solid ${magColor(q.magnitude)}40` }}
                  >
                    M{q.magnitude.toFixed(1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-300 truncate">{q.location || q.place}</p>
                    <p className="text-[8px] text-zinc-600 mono">
                      {q.depthKm?.toFixed(1) ?? '?'} km deep · {new Date(q.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {q.tsunami && (
                    <Badge variant="outline" className="text-[8px] bg-red-500/10 border-red-500/40 text-red-400 shrink-0">TSUN</Badge>
                  )}
                </div>
              ))}
              {sorted.length === 0 && (
                <div className="text-center py-6 text-[10px] text-zinc-600 font-mono">NO SEISMIC EVENTS DETECTED IN LAST 24H</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
