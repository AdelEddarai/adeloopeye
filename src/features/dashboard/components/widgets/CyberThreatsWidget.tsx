'use client';

import { Shield, AlertTriangle, Zap, ExternalLink } from 'lucide-react';

import { useLiveCyberThreats } from '@/shared/hooks/use-live-cyber-threats';

export function CyberThreatsWidget() {
  const { data, isLoading, error, lastUpdate } = useLiveCyberThreats();

  console.log('[CyberThreatsWidget] Render state:', {
    isLoading,
    hasError: !!error,
    hasData: !!data,
    threatsCount: data?.threats?.length || 0,
    stats: data?.stats,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)] animate-pulse">LOADING THREATS...</span>
      </div>
    );
  }

  if (error) {
    console.error('[CyberThreatsWidget] Error:', error);
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--danger)]">THREAT FEED UNAVAILABLE</span>
      </div>
    );
  }

  if (!data) {
    console.warn('[CyberThreatsWidget] No data received');
    return (
      <div className="h-full flex items-center justify-center">
        <span className="mono text-[length:var(--text-label)] text-[var(--t4)]">NO DATA</span>
      </div>
    );
  }

  const threats = data.threats || [];
  const stats = data.stats || { total: 0, ddos: 0, malware: 0, intrusion: 0, phishing: 0, ransomware: 0 };
  const sources = data.sources || [];

  console.log('[CyberThreatsWidget] Rendering with:', { threatsCount: threats.length, stats });

  return (
    <div className="h-full overflow-y-auto">
      {/* Stats header */}
      <div className="px-4 py-3 border-b border-[var(--bd)] bg-[var(--bg-2)]">
        <div className="flex items-center justify-between mb-2">
          <span className="mono text-[length:var(--text-tiny)] text-[var(--t4)] tracking-[0.10em]">ACTIVE THREATS</span>
          <span className="mono text-lg font-bold text-[var(--danger)] leading-none">{stats.total}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)] mb-0.5">DDoS</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--danger)]">{stats.ddos}</div>
          </div>
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)] mb-0.5">MALWARE</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--warning)]">{stats.malware}</div>
          </div>
          <div className="px-2 py-1.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm">
            <div className="mono text-[length:var(--text-tiny)] text-[var(--t4)] mb-0.5">INTRUSION</div>
            <div className="mono text-[length:var(--text-body)] font-bold text-[var(--info)]">{stats.intrusion}</div>
          </div>
        </div>
        
        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-[var(--bd-s)]">
            <div className="mono text-[length:var(--text-micro)] text-[var(--t4)] mb-1">SOURCES:</div>
            <div className="flex flex-wrap gap-1">
              {sources.map((source: any, idx: number) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--bg-1)] border border-[var(--bd)] rounded-sm hover:border-[var(--bd-hover)] transition-colors no-underline"
                >
                  <span className="mono text-[length:var(--text-micro)] text-[var(--info)]">{source.name}</span>
                  <ExternalLink size={8} className="text-[var(--t4)]" />
                </a>
              ))}
            </div>
          </div>
        )}
        
        {lastUpdate && (
          <div className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-2">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Threat list */}
      <div>
        {threats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Shield size={32} className="text-[var(--success)] mb-2" />
            <span className="mono text-[length:var(--text-label)] text-[var(--success)]">NO ACTIVE THREATS</span>
            <span className="mono text-[length:var(--text-micro)] text-[var(--t4)] mt-1">All systems secure</span>
          </div>
        ) : (
          threats.map((threat, i) => {
            const severityColor = 
              threat.severity === 'CRITICAL' ? 'var(--danger)' :
              threat.severity === 'HIGH' ? 'var(--warning)' :
              'var(--info)';
            
            const Icon = 
              threat.type === 'DDOS' ? Zap :
              threat.type === 'MALWARE' ? AlertTriangle :
              Shield;

            return (
              <div
                key={threat.id}
                className="flex gap-3 items-start px-4 py-3 hover:bg-[var(--bg-3)] transition-colors"
                style={{ 
                  borderBottom: i < threats.length - 1 ? '1px solid var(--bd-s)' : 'none',
                  borderLeft: `3px solid ${severityColor}`,
                }}
              >
                <Icon size={16} className="mt-0.5 shrink-0" style={{ color: severityColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="mono text-[length:var(--text-body-sm)] font-bold text-[var(--t1)]">
                      {threat.type}
                    </span>
                    <span 
                      className="mono text-[length:var(--text-micro)] px-1.5 py-0.5 rounded-sm font-bold"
                      style={{ 
                        background: `color-mix(in srgb, ${severityColor} 14%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${severityColor} 35%, transparent)`,
                        color: severityColor,
                      }}
                    >
                      {threat.severity}
                    </span>
                  </div>
                  <p className="text-[length:var(--text-label)] text-[var(--t2)] leading-snug mb-1">
                    {threat.target}
                  </p>
                  <div className="flex items-center gap-3 text-[length:var(--text-tiny)] text-[var(--t4)]">
                    <span className="mono">SRC: {threat.source}</span>
                    <span className="mono">•</span>
                    <span className="mono">{threat.location}</span>
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
