'use client';

import type { ReactNode } from 'react';
import { Ship, Plane, Train, MapPin, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LogisticsEntry } from '@/server/lib/api-clients/morocco-logistics';

type LogisticsPanelProps = {
  logistics?: LogisticsEntry[];
};

const CATEGORY_META: Record<LogisticsEntry['category'], { label: string; icon: ReactNode }> = {
  PORT: { label: 'PORT', icon: <Ship className="w-3.5 h-3.5 text-sky-400" /> },
  AIRPORT: { label: 'AIRPORT', icon: <Plane className="w-3.5 h-3.5 text-indigo-400" /> },
  RAIL: { label: 'RAIL', icon: <Train className="w-3.5 h-3.5 text-emerald-400" /> },
  BORDER_CROSSING: { label: 'BORDER', icon: <MapPin className="w-3.5 h-3.5 text-amber-400" /> },
  TRADE_CORRIDOR: { label: 'CORRIDOR', icon: <Package className="w-3.5 h-3.5 text-violet-400" /> },
};

const STATUS_COLOR: Record<string, string> = {
  OPERATIONAL: '#10b981',
  DISRUPTED: '#f59e0b',
  CLOSED: '#ef4444',
  UNDER_CONSTRUCTION: '#60a5fa',
};

export function LogisticsPanel({ logistics = [] }: LogisticsPanelProps) {
  const crisis = logistics.filter(l => l.crisis || l.status === 'CLOSED' || l.status === 'DISRUPTED');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Logistics Network · {logistics.length} nodes</span>
        {crisis.length > 0 && (
          <Badge variant="outline" className="text-[8px] bg-red-500/10 border-red-500/40 text-red-400 animate-pulse">
            🚨 {crisis.length} CRISIS
          </Badge>
        )}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {logistics.map(l => {
          const meta = CATEGORY_META[l.category];
          return (
            <Card key={l.id} className={`bg-zinc-900/40 border-zinc-800 ${l.crisis ? 'ring-1 ring-red-500/30' : ''}`}>
              <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2 min-w-0">
                  {meta.icon}
                  <div className="min-w-0">
                    <CardTitle className="text-[10px] font-bold text-zinc-200 truncate">{l.name}</CardTitle>
                    <span className="text-[7px] text-zinc-600 mono uppercase tracking-wider">{meta.label}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px] shrink-0"
                  style={{ backgroundColor: `${STATUS_COLOR[l.status] || '#71717a'}15`, borderColor: `${STATUS_COLOR[l.status] || '#71717a'}40`, color: STATUS_COLOR[l.status] || '#71717a' }}
                >
                  {l.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <p className="text-[9px] text-zinc-500 leading-relaxed">{l.description}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[8px] text-zinc-600 mono">
                  <span className="text-cyan-500/80 font-bold">CAPACITY</span>
                  <span>{l.capacity}</span>
                  <span className="ml-auto px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/60" style={{ color: STATUS_COLOR[l.condition] || '#60a5fa' }}>
                    {l.condition}
                  </span>
                </div>

                {l.incidents.length > 0 && (
                  <div className="space-y-1 mt-2 border-t border-red-500/15 pt-1.5">
                    {l.incidents.map((inc, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-red-300/80 leading-tight line-clamp-1">{inc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {logistics.length === 0 && (
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-6 text-center text-[10px] text-zinc-600 font-mono">NO LOGISTICS DATA</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
