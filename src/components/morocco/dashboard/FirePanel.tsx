'use client';

import { useMemo } from 'react';
import { Flame, AlertTriangle, Gauge, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MoroccoFire } from '@/server/lib/api-clients/morocco-local-data';

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#4ade80',
};

type FirePanelProps = {
  fires?: MoroccoFire[];
};

export function FirePanel({ fires = [] }: FirePanelProps) {
  const sorted = useMemo(() => [...fires].sort((a, b) => (b.brightness || 0) - (a.brightness || 0)), [fires]);
  const critical = fires.filter(f => f.severity === 'CRITICAL').length;
  const high = fires.filter(f => f.severity === 'HIGH').length;
  const avgBrightness = fires.length
    ? Math.round(fires.reduce((s, f) => s + (f.brightness || 0), 0) / fires.length)
    : 0;

  // By region (nearest city)
  const byRegion = useMemo(() => {
    const map = new Map<string, number>();
    fires.forEach(f => {
      const loc = f.location || 'Morocco';
      map.set(loc, (map.get(loc) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [fires]);
  const maxRegion = Math.max(1, ...byRegion.map(r => r[1]));

  const summary = [
    { label: 'Active Fires', value: String(fires.length), sub: 'NASA FIRMS hotspots', icon: Flame, color: 'text-orange-400' },
    { label: 'Critical', value: String(critical), sub: 'brightness > 400K', icon: AlertTriangle, color: 'text-red-400' },
    { label: 'High Risk', value: String(high), sub: 'elevated severity', icon: Gauge, color: 'text-amber-400' },
    { label: 'Avg Brightness', value: avgBrightness ? `${avgBrightness}K` : '--', sub: 'thermal band 4', icon: Gauge, color: 'text-yellow-400' },
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
              <p className="text-[9px] text-zinc-500 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {/* Fires by region */}
        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              Fires by Region <span className="text-orange-400 animate-pulse ml-1">●</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {byRegion.map(([region, count]) => (
              <div key={region} className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
                <span className="text-[9px] font-mono w-24 text-zinc-400 truncate">{region}</span>
                <div className="flex-1 h-3 bg-zinc-950/60 rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{ width: `${(count / maxRegion) * 100}%`, backgroundColor: '#f97316', opacity: 0.85 }}
                  />
                </div>
                <span className="text-[10px] font-bold mono text-zinc-200 w-5 text-right tabular-nums">{count}</span>
              </div>
            ))}
            {byRegion.length === 0 && (
              <div className="text-center py-6 text-[10px] text-zinc-600 font-mono">NO ACTIVE FIRES DETECTED</div>
            )}
          </CardContent>
        </Card>

        {/* Fire list */}
        <Card className="bg-zinc-900/40 border-zinc-800">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Thermal Hotspots</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
              {sorted.slice(0, 12).map((f, idx) => (
                <div key={f.id || idx} className="flex items-center gap-2 p-2 rounded bg-zinc-950/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                  <Flame className="w-3.5 h-3.5 shrink-0" style={{ color: SEVERITY_COLOR[f.severity] || '#f97316' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-zinc-300 truncate">{f.location || 'Morocco'}</p>
                      <Badge
                        variant="outline"
                        className="text-[8px] shrink-0"
                        style={{ backgroundColor: `${SEVERITY_COLOR[f.severity] || '#f97316'}15`, borderColor: `${SEVERITY_COLOR[f.severity] || '#f97316'}40`, color: SEVERITY_COLOR[f.severity] || '#f97316' }}
                      >
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="text-[8px] text-zinc-600 mono">
                      {f.brightness ? `${Math.round(f.brightness)}K` : '--'} · {f.confidence ? `${Math.round(f.confidence)}%` : '--'} confidence · {new Date(f.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {sorted.length === 0 && (
                <div className="text-center py-6 text-[10px] text-zinc-600 font-mono">NO THERMAL SIGNATURES IN MOROCCO</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
