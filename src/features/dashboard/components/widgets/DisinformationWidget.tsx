'use client';

import { ExternalLink, RadioTower, Bot } from 'lucide-react';

import Link from 'next/link';

import { useLiveDisinformation } from '@/shared/hooks/use-live-disinformation';

export function DisinformationWidget() {
  const { data, isLoading, error, lastUpdate } = useLiveDisinformation('MA');

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)] animate-pulse">
          LOADING DISINFO RADAR...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--danger)]">
          DISINFO RADAR UNAVAILABLE
        </span>
      </div>
    );
  }

  const stats = data.stats;
  const campaignEdges = data.edges.filter(e => e.kind === 'CAMPAIGN');
  const botEdges = data.edges.filter(e => e.kind === 'BOT_TRAFFIC');

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <div className="flex items-center justify-between mb-2">
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-[0.10em]">
            DISINFO RADAR · FOCUS {data.focus.code}
          </span>
          <Link
            href="/dashboard/disinfo"
            className="mono text-[length:var(--text-micro)] text-[var(--info)] hover:text-[var(--blue-l)] no-underline"
          >
            FULL PAGE →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">CAMPAIGNS</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--warning)]">
              {stats.campaigns}
            </div>
          </div>
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">BOT IPs</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--info)]">
              {stats.botSources}
            </div>
          </div>
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">COUNTRIES</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--blue)]">
              {stats.botCountries}
            </div>
          </div>
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)]">ARTICLES</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--t1)]">
              {stats.articleCount}
            </div>
          </div>
        </div>
        {lastUpdate && (
          <div className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-2">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div>
        {campaignEdges.length === 0 && botEdges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <RadioTower size={32} className="text-[var(--success)] mb-2" />
            <span className="mono text-[length:var(--text-label)] text-[var(--success)]">
              NO ACTIVE DISINFO CAMPAIGNS
            </span>
            <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-1">
              No reported campaigns or bot sources in current window
            </span>
          </div>
        ) : (
          [...campaignEdges, ...botEdges]
            .slice(0, 8)
            .map((edge, i) => {
              const src = data.nodes.find(n => n.code === edge.source);
              const tgt = data.nodes.find(n => n.code === edge.target);
              const isCampaign = edge.kind === 'CAMPAIGN';
              const color = isCampaign ? 'var(--warning)' : 'var(--info)';
              const Icon = isCampaign ? RadioTower : Bot;
              const label = isCampaign ? 'CAMPAIGN' : `BOT (${edge.subKind ?? 'BOTNET'})`;
              return (
                <div
                  key={edge.id}
                  className="flex gap-3 items-start px-4 py-3 hover:bg-[var(--bg-3)] transition-colors"
                  style={{
                    borderBottom: i < 7 ? '1px solid var(--bd-s)' : 'none',
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)]">
                        {src?.name ?? edge.source} → {tgt?.name ?? edge.target}
                      </span>
                      {isCampaign && edge.sources[0] && (
                        <a
                          href={edge.sources[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--t4)] hover:text-[var(--info)]"
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[length:var(--text-tiny)] text-[var(--t4)]">
                      <span className="mono" style={{ color }}>
                        {label}
                      </span>
                      <span className="mono">weight: {edge.weight}</span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
