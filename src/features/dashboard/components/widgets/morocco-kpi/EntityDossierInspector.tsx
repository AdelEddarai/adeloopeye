'use client';

import React from 'react';
import {
  Shield,
  MapPin,
  ExternalLink,
  Target,
  Globe,
  Radio,
  Server,
  Crosshair,
  Lock,
  Flame,
  X,
  Share2,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DOMAIN_CONFIG,
  type IntelligenceEntity,
  type IntelligenceEdge,
} from '@/features/dashboard/lib/entity-intelligence-graph';

type EntityDossierInspectorProps = {
  entity: IntelligenceEntity | null;
  edges: IntelligenceEdge[];
  allEntities: IntelligenceEntity[];
  onClose: () => void;
  onSelectEntity: (entityId: string) => void;
  onLocateOnMap: (entity: IntelligenceEntity) => void;
};

export function EntityDossierInspector({
  entity,
  edges,
  allEntities,
  onClose,
  onSelectEntity,
  onLocateOnMap,
}: EntityDossierInspectorProps) {
  if (!entity) return null;

  const domainMeta = DOMAIN_CONFIG[entity.domain] || DOMAIN_CONFIG.ACTOR;

  // Find all connected edges
  const connectedEdges = edges.filter(
    (e) => e.source === entity.id || e.target === entity.id
  );

  // Map to connected entities
  const connectedEntities = connectedEdges
    .map((edge) => {
      const isSource = edge.source === entity.id;
      const targetId = isSource ? edge.target : edge.source;
      const targetEntity = allEntities.find((e) => e.id === targetId);
      return {
        edge,
        entity: targetEntity,
        relationLabel: edge.label || edge.relation,
        isOutgoing: isSource,
      };
    })
    .filter((item) => item.entity !== undefined);

  return (
    <Card className="h-full bg-zinc-950/95 border-zinc-800 text-zinc-100 flex flex-col shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* ── HEADER ── */}
      <CardHeader className="p-3 pb-2.5 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{domainMeta.icon}</span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0"
                  style={{
                    backgroundColor: `${domainMeta.color}15`,
                    borderColor: `${domainMeta.color}50`,
                    color: domainMeta.color,
                  }}
                >
                  {domainMeta.label}
                </Badge>

                <Badge
                  variant="outline"
                  className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0 ${
                    entity.riskLevel === 'CRITICAL'
                      ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
                      : entity.riskLevel === 'HIGH'
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                        : entity.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}
                >
                  {entity.riskLevel} RISK
                </Badge>

                {entity.country && (
                  <Badge variant="outline" className="text-[8px] font-mono bg-zinc-900 border-zinc-800 text-zinc-300">
                    {entity.countryFlag && <span className="mr-1">{entity.countryFlag}</span>}
                    {entity.country}
                  </Badge>
                )}
              </div>

              <h3 className="text-xs font-bold text-zinc-100 mt-1 leading-snug font-sans tracking-wide">
                {entity.name}
              </h3>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-sm"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* ── SCROLLABLE CONTENT BODY ── */}
      <CardContent className="p-3 space-y-3.5 flex-1 overflow-y-auto font-sans text-xs">
        {/* 1. Map Teleportation CTA */}
        {entity.coordinates && (
          <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce" />
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 block">
                  GEO-TELEMETRY ANCHOR
                </span>
                <span className="text-[9px] font-mono text-zinc-400 block">
                  {entity.locationName || 'Geographic Coordinates'} · [
                  {entity.coordinates[0].toFixed(3)}, {entity.coordinates[1].toFixed(3)}]
                </span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => onLocateOnMap(entity)}
              className="h-7 px-2.5 text-[9px] font-mono font-bold tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white rounded shadow"
            >
              <Target className="w-3 h-3 mr-1" />
              LOCATE ON MAP
            </Button>
          </div>
        )}

        {/* 2. Attribution Confidence & Summary */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" />
              ATTRIBUTION CONFIDENCE
            </span>
            <span className="font-bold text-cyan-300">
              {entity.attributionConfidence || 85}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${entity.attributionConfidence || 85}%` }}
            />
          </div>
        </div>

        {/* 3. Summary Dossier */}
        <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800 text-[11px] leading-relaxed text-zinc-300">
          <p>{entity.summary}</p>

          {entity.aliases && entity.aliases.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase">
                Known Aliases:
              </span>
              {entity.aliases.map((alias) => (
                <span
                  key={alias}
                  className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono text-zinc-300 border border-zinc-700"
                >
                  {alias}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4. DISARM & MITRE Framework Tactics */}
        {((entity.disarmTactics && entity.disarmTactics.length > 0) ||
          (entity.mitreTactics && entity.mitreTactics.length > 0)) && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Terminal className="w-3 h-3 text-pink-400" />
              MITRE ATT&CK & DISARM TACTICS
            </span>
            <div className="flex flex-wrap gap-1">
              {entity.disarmTactics?.map((tactic) => (
                <Badge
                  key={tactic}
                  variant="outline"
                  className="text-[9px] font-mono bg-pink-950/30 border-pink-500/30 text-pink-300 px-1.5 py-0.5"
                >
                  🎯 {tactic}
                </Badge>
              ))}
              {entity.mitreTactics?.map((tactic) => (
                <Badge
                  key={tactic}
                  variant="outline"
                  className="text-[9px] font-mono bg-purple-950/30 border-purple-500/30 text-purple-300 px-1.5 py-0.5"
                >
                  🛡️ {tactic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 5. Technical Indicators */}
        {entity.technicalIndicators && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Server className="w-3 h-3 text-amber-400" />
              IOC TECHNICAL INDICATORS
            </span>
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1 font-mono text-[10px]">
              {entity.technicalIndicators.ips?.map((ip) => (
                <div key={ip} className="flex items-center justify-between text-amber-300">
                  <span className="text-zinc-500">IP VECTOR:</span>
                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{ip}</span>
                </div>
              ))}
              {entity.technicalIndicators.asns?.map((asn) => (
                <div key={asn} className="flex items-center justify-between text-purple-300">
                  <span className="text-zinc-500">ASN ROUTING:</span>
                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{asn}</span>
                </div>
              ))}
              {entity.technicalIndicators.telegramChannels?.map((tg) => (
                <div key={tg} className="flex items-center justify-between text-cyan-300">
                  <span className="text-zinc-500">TELEGRAM CELL:</span>
                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{tg}</span>
                </div>
              ))}
              {entity.technicalIndicators.cryptoWallets?.map((wallet) => (
                <div key={wallet} className="flex items-center justify-between text-yellow-400">
                  <span className="text-zinc-500">CRYPTO NODE:</span>
                  <span className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-[9px] truncate max-w-[170px]">
                    {wallet}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Connected Graph Relations (1-hop) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Share2 className="w-3 h-3 text-emerald-400" />
              DIRECT LINKED ENTITIES ({connectedEntities.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
            {connectedEntities.map(({ edge, entity: targetEntity, relationLabel, isOutgoing }) => {
              if (!targetEntity) return null;
              const targetDomain = DOMAIN_CONFIG[targetEntity.domain];

              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectEntity(targetEntity.id)}
                  className="w-full text-left p-2 rounded bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-2 group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs">{targetDomain?.icon || '🔹'}</span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-zinc-200 block truncate group-hover:text-cyan-300">
                        {targetEntity.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 block truncate">
                        {isOutgoing ? '➔' : '⬅'} {relationLabel}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[8px] font-mono shrink-0 px-1 py-0"
                    style={{
                      borderColor: `${targetDomain?.color}40`,
                      color: targetDomain?.color,
                    }}
                  >
                    {targetEntity.domain}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* ── FOOTER ACTIONS ── */}
      <div className="p-2.5 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between shrink-0">
        <span className="text-[9px] font-mono text-zinc-500">
          NODE ID: {entity.id}
        </span>

        {entity.coordinates && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLocateOnMap(entity)}
            className="h-6 px-2 text-[9px] font-mono font-bold text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40"
          >
            <MapPin className="w-2.5 h-2.5 mr-1" />
            FLY MAP
          </Button>
        )}
      </div>
    </Card>
  );
}
