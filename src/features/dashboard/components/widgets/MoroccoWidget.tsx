'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, MapPin, TrendingUp, ExternalLink, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { api } from '@/shared/lib/query/client';

import type { MoroccoData } from '@/server/lib/api-clients/morocco-client';

export function MoroccoWidget() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['morocco-data'],
    queryFn: () => api.get<MoroccoData>('/live/morocco'),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--t4)] text-sm mono">Loading Morocco data...</div>
      </div>
    );
  }

  const { news, keyLocations, economicIndicators, securityAlerts } = data;
  const criticalAlerts = securityAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-1)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--bd)] shrink-0 bg-[var(--bg-2)]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--blue)] font-bold text-sm mono">🇲🇦 MOROCCO INTEL</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-auto px-2 py-1 text-[var(--t4)] hover:text-[var(--t2)] text-xs mono"
        >
          {isFetching ? '⟳' : '↻'} REFRESH
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Security Alerts */}
          {criticalAlerts.length > 0 && (
            <Card className="bg-[var(--danger)]/10 border-[var(--danger)]/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-[var(--danger)]" />
                  <span className="text-[var(--danger)] font-bold mono">
                    {criticalAlerts.length} SECURITY ALERT{criticalAlerts.length > 1 ? 'S' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {criticalAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="p-2 rounded bg-[var(--bg-1)]/50 border border-[var(--bd)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30 text-[9px]">
                        {alert.type}
                      </Badge>
                      <span className="text-[var(--t4)] text-[10px]">•</span>
                      <span className="text-[var(--t3)] text-[10px]">{alert.location}</span>
                    </div>
                    <p className="text-[var(--t2)] text-[11px] leading-tight">{alert.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Economic Indicators */}
          <Card className="bg-[var(--bg-2)] border-[var(--bd)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
                <span className="text-[var(--t2)] font-bold mono">ECONOMIC INDICATORS</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--bd)]">
                  <div className="text-[var(--t4)] text-[10px] mono mb-1">GDP GROWTH</div>
                  <div className="text-[var(--success)] font-bold text-lg mono">{economicIndicators.gdpGrowth}%</div>
                </div>
                <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--bd)]">
                  <div className="text-[var(--t4)] text-[10px] mono mb-1">INFLATION</div>
                  <div className="text-[var(--warning)] font-bold text-lg mono">{economicIndicators.inflation}%</div>
                </div>
                <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--bd)]">
                  <div className="text-[var(--t4)] text-[10px] mono mb-1">UNEMPLOYMENT</div>
                  <div className="text-[var(--t3)] font-bold text-lg mono">{economicIndicators.unemployment}%</div>
                </div>
                <div className="p-2 rounded bg-[var(--bg-1)] border border-[var(--bd)]">
                  <div className="text-[var(--t4)] text-[10px] mono mb-1">TRADE BALANCE</div>
                  <div className="text-[var(--danger)] font-bold text-lg mono">{economicIndicators.tradeBalance}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Locations */}
          <Card className="bg-[var(--bg-2)] border-[var(--bd)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[var(--blue)]" />
                <span className="text-[var(--t2)] font-bold mono">KEY LOCATIONS ({keyLocations.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {keyLocations.slice(0, 5).map(loc => (
                <div key={loc.id} className="flex items-center justify-between p-2 rounded bg-[var(--bg-1)] border border-[var(--bd)] hover:bg-[var(--bg-3)] transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      loc.status === 'ACTIVE' ? 'bg-[var(--success)]' : 
                      loc.status === 'ALERT' ? 'bg-[var(--warning)]' : 'bg-[var(--t4)]'
                    }`} />
                    <span className="text-[var(--t2)] text-xs truncate">{loc.name}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">{loc.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Latest News - Beautiful UI */}
          <Card className="bg-[var(--bg-2)] border-[var(--bd)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="text-[var(--t2)] font-bold mono">📰 LATEST NEWS</span>
                <Badge variant="outline" className="text-[9px]">{news.length} articles</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {news.map(article => (
                <Card
                  key={article.id}
                  className="bg-[var(--bg-1)] border-[var(--bd)] hover:border-[var(--blue)]/30 transition-all group"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] shrink-0 ${
                          article.category === 'SECURITY' ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30' :
                          article.category === 'POLITICS' ? 'bg-[var(--blue)]/10 text-[var(--blue)] border-[var(--blue)]/30' :
                          article.category === 'ECONOMY' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30' :
                          article.category === 'TECH' ? 'bg-[var(--cyber)]/10 text-[var(--cyber)] border-[var(--cyber)]/30' :
                          'bg-[var(--t4)]/10 text-[var(--t4)] border-[var(--bd)]'
                        }`}
                      >
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--t4)] mono">
                        <Clock className="w-3 h-3" />
                        {article.source}
                      </div>
                    </div>
                    
                    <h3 className="text-[var(--t1)] text-xs font-semibold leading-tight mb-2 group-hover:text-[var(--blue)] transition-colors">
                      {article.title}
                    </h3>
                    
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[var(--blue)] hover:text-[var(--blue-l)] transition-colors"
                    >
                      <span className="mono font-semibold">READ MORE</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
