'use client';

import { Crosshair, Swords, TrendingUp, TrendingDown, ExternalLink, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ConflictEntry } from '@/server/lib/api-clients/morocco-conflicts';

type ConflictsPanelProps = {
  conflicts?: ConflictEntry[];
};

const STATUS_COLOR: Record<string, string> = {
  ESCALATING: '#ef4444',
  ACTIVE: '#f59e0b',
  DORMANT: '#60a5fa',
  RESOLVED: '#10b981',
};

export function ConflictsPanel({ conflicts = [] }: ConflictsPanelProps) {
  const active = conflicts.filter(c => c.status === 'ESCALATING' || c.status === 'ACTIVE');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Swords className="w-3.5 h-3.5 text-red-400" />
        <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Regional Conflicts · {conflicts.length} flashpoints</span>
        {active.length > 0 && (
          <Badge variant="outline" className="text-[8px] bg-red-500/10 border-red-500/40 text-red-400 animate-pulse">
            ⚠ {active.length} ACTIVE
          </Badge>
        )}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {conflicts.map(c => {
          const color = STATUS_COLOR[c.status] || '#71717a';
          return (
            <Card key={c.id} className={`bg-zinc-900/40 border-zinc-800 ${c.status === 'ESCALATING' ? 'ring-1 ring-red-500/40' : ''}`}>
              <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Crosshair className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <div className="min-w-0">
                    <CardTitle className="text-[10px] font-bold text-zinc-200 truncate">{c.name}</CardTitle>
                    <span className="text-[7px] text-zinc-600 mono uppercase tracking-wider">{c.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] shrink-0"
                  style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
                >
                  {c.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <p className="text-[9px] text-zinc-500 leading-relaxed">{c.description}</p>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[8px] text-zinc-600 mono uppercase tracking-wider shrink-0">Intensity</span>
                  <div className="flex-1 h-2 bg-zinc-950/60 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{ width: `${c.intensity}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[10px] font-bold mono" style={{ color }}>{c.intensity}</span>
                  {c.status === 'ESCALATING' ? (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  ) : c.status === 'RESOLVED' ? (
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {c.flashpoints.slice(0, 4).map(fp => (
                    <span key={fp} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/60 text-zinc-400 mono">
                      {fp}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1 mt-1.5">
                  {c.countries.map(country => (
                    <span key={country} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800/40 text-zinc-500 mono">
                      {country}
                    </span>
                  ))}
                </div>

                {(c.reports?.length ?? 0) > 0 && (
                  <div className="mt-2 border-t border-zinc-800/80 pt-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                      <span className="text-[8px] font-bold tracking-widest text-zinc-500 uppercase">Live reports</span>
                      <span className="text-[8px] mono text-zinc-600">({c.reports.length})</span>
                    </div>
                    <ul className="space-y-1">
                      {c.reports.slice(0, 4).map((r, i) => (
                        <li key={`${r.url}-${i}`}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-1.5 text-[8px] text-zinc-400 hover:text-white leading-snug"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 mt-0.5 opacity-60" />
                            <span className="min-w-0">
                              <span className="line-clamp-2">{r.title}</span>
                              <span className="text-[7px] mono text-zinc-600">— {r.source}</span>
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {conflicts.length === 0 && (
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-6 text-center text-[10px] text-zinc-600 font-mono">NO CONFLICT DATA</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
