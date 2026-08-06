'use client';

import { useMemo } from 'react';
import { RadioTower, Bot, Globe2, Newspaper, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiveDisinformation } from '@/shared/hooks/use-live-disinformation';

function countryName(code: string, nodes: { code: string; name: string }[]): string {
  return nodes.find((n) => n.code === code)?.name ?? code;
}

export function DisinfoMiniPanel() {
  const { data, isLoading, isError } = useLiveDisinformation('MA');

  const topArcs = useMemo(() => {
    if (!data) return [];
    return data.edges
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);
  }, [data]);

  const campaignArcs = useMemo(() => {
    if (!data) return [];
    return data.edges.filter((e) => e.kind === 'CAMPAIGN');
  }, [data]);

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="p-3 pb-1 border-b border-zinc-800/50">
          <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            Disinformation Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto my-4" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader className="p-3 pb-1 border-b border-zinc-800/50">
          <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            Disinformation Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-[10px] text-zinc-500 mono">Sources unreachable — retrying automatically.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800">
      <CardHeader className="p-3 pb-1 border-b border-zinc-800/50">
        <CardTitle className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          <RadioTower className="w-3 h-3 text-amber-500" />
          Disinformation Radar — Focus: {data.focus.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex items-center justify-between px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-sm">
            <span className="flex items-center gap-1 text-[9px] text-zinc-400"><Newspaper className="w-2.5 h-2.5 text-amber-400" /> CAMPAIGNS</span>
            <span className="text-[11px] font-bold text-amber-400 mono">{data.stats.campaigns}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-sm">
            <span className="flex items-center gap-1 text-[9px] text-zinc-400"><Bot className="w-2.5 h-2.5 text-sky-400" /> BOT SOURCES</span>
            <span className="text-[11px] font-bold text-sky-400 mono">{data.stats.botSources}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-sm">
            <span className="flex items-center gap-1 text-[9px] text-zinc-400"><Globe2 className="w-2.5 h-2.5 text-sky-400" /> BOT COUNTRIES</span>
            <span className="text-[11px] font-bold text-sky-400 mono">{data.stats.botCountries}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-800/40 border border-zinc-700/50 rounded-sm">
            <span className="flex items-center gap-1 text-[9px] text-zinc-400"><Newspaper className="w-2.5 h-2.5 text-zinc-400" /> INTEL ARTICLES</span>
            <span className="text-[11px] font-bold text-zinc-200 mono">{data.stats.articleCount}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
            {campaignArcs.length > 0 ? 'Reported campaign arcs' : 'Observed bot arcs'}
          </div>
          {topArcs.map((edge) => {
            const isCampaign = edge.kind === 'CAMPAIGN';
            const color = isCampaign ? '#f59e0b' : '#38bdf8';
            return (
              <div
                key={edge.id}
                className="flex items-center justify-between px-2 py-1 rounded-sm border"
                style={{ borderColor: `${color}30`, background: `${color}0d` }}
              >
                <span className="text-[10px] text-zinc-300 mono truncate">
                  {countryName(edge.source, data.nodes)}
                  <span style={{ color }}> → </span>
                  {countryName(edge.target, data.nodes)}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isCampaign && edge.sources[0] && (
                    <a
                      href={edge.sources[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={edge.sources[0].title}
                      style={{ color }}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <span className="text-[9px] mono" style={{ color }}>
                    {isCampaign ? 'CAMPAIGN' : 'BOT'}
                  </span>
                  <span className="text-[9px] text-zinc-500 mono">{edge.weight}</span>
                </div>
              </div>
            );
          })}
          {topArcs.length === 0 && (
            <p className="text-[10px] text-zinc-500 mono">No arcs detected in this window.</p>
          )}
        </div>

        <a
          href="/dashboard/disinfo"
          className="block text-center text-[9px] font-bold mono uppercase tracking-widest text-amber-400/80 hover:text-amber-300 py-1 border border-amber-500/20 rounded-sm bg-amber-500/5"
        >
          Open full Disinformation Radar →
        </a>
      </CardContent>
    </Card>
  );
}
