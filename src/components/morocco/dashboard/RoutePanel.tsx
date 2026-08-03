'use client';

import { GitMerge, AlertTriangle, ShieldAlert, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MoroccoRoute } from '@/server/lib/api-clients/morocco-routes-client';

type RoutePanelProps = {
  routes?: MoroccoRoute[];
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: '#10b981',
  DISRUPTED: '#f59e0b',
  CLOSED: '#ef4444',
  CONSTRUCTION: '#60a5fa',
};

const CONDITION_COLOR: Record<string, string> = {
  EXCELLENT: '#10b981',
  GOOD: '#60a5fa',
  FAIR: '#f59e0b',
  POOR: '#f97316',
};

export function RoutePanel({ routes = [] }: RoutePanelProps) {
  const disrupted = routes.filter(r => r.status === 'DISRUPTED' || r.status === 'CLOSED');
  const totalIncidents = routes.reduce((s, r) => s + (r.incidents?.length || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <GitMerge className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-500 uppercase">Major corridors · {routes.length} routes</span>
        {disrupted.length > 0 && (
          <Badge variant="outline" className="text-[8px] bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse">
            ⚠ {disrupted.length} DISRUPTED
          </Badge>
        )}
        <Badge variant="outline" className="text-[8px] bg-zinc-800/50 border-zinc-700 text-zinc-400">
          {totalIncidents} incidents
        </Badge>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {routes.map(r => {
          const severity = r.riskScore >= 70 ? 'CRITICAL' : r.riskScore >= 40 ? 'HIGH' : r.riskScore >= 15 ? 'MEDIUM' : 'LOW';
          return (
            <Card key={r.id} className="bg-zinc-900/40 border-zinc-800">
              <CardHeader className="p-3 pb-2 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Route className="w-3.5 h-3.5 text-emerald-400" />
                  <CardTitle className="text-[10px] font-bold text-zinc-200">{r.name}</CardTitle>
                  <span className="text-[8px] text-zinc-600 mono">{r.id}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[8px]"
                  style={{ backgroundColor: `${STATUS_COLOR[r.status] || '#71717a'}15`, borderColor: `${STATUS_COLOR[r.status] || '#71717a'}40`, color: STATUS_COLOR[r.status] || '#71717a' }}
                >
                  {r.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <p className="text-[9px] text-zinc-500 mono mb-2">{r.description} · {r.length} km{r.tollCost ? ` · ${r.tollCost} MAD` : ''}</p>

                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-3 h-3 text-zinc-500" />
                  <span className="text-[9px] text-zinc-500">Risk Score</span>
                  <div className="flex-1 h-2 bg-zinc-950/60 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{ width: `${r.riskScore}%`, backgroundColor: CONDITION_COLOR[r.condition] || '#60a5fa' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold mono" style={{ color: CONDITION_COLOR[r.condition] || '#60a5fa' }}>
                    {r.riskScore}
                  </span>
                  <span className="text-[8px] text-zinc-600 mono">{severity}</span>
                </div>

                {r.incidents && r.incidents.length > 0 && (
                  <div className="space-y-1 mt-1.5 border-t border-white/5 pt-1.5">
                    {r.incidents.slice(0, 3).map((inc, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-zinc-400 leading-tight line-clamp-1">{inc.description}</p>
                          <p className="text-[7px] text-zinc-600 mono uppercase">{inc.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {routes.length === 0 && (
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardContent className="p-6 text-center text-[10px] text-zinc-600 font-mono">NO ROUTE DATA</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
