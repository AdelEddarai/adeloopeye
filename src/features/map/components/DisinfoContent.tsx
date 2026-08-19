'use client';

import { 
  ShieldAlert, Radio, ExternalLink, Globe2, 
  Terminal, Target, Zap, AlertTriangle, Layers, 
  Cpu, FileText, CheckCircle2, Lock 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DisinfoDetailPayload } from './types';

export function DisinfoContent({ data }: { data: DisinfoDetailPayload }) {
  const { 
    edge, sourceNode, targetNode, campaignName, 
    threatActor, confidenceScore, disarmTactics, 
    targetedSectors, narrativeObjective, botnetVolume, sources 
  } = data;

  const isCampaign = edge.kind === 'CAMPAIGN';
  const sourceName = sourceNode?.name || edge.source;
  const targetName = targetNode?.name || edge.target;

  return (
    <div className="space-y-3.5 font-mono text-zinc-200">
      {/* ── Top Classification Header ── */}
      <div className="p-2.5 rounded bg-zinc-900/80 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
            <Lock size={10} /> CLASSIFIED // THREAT INTEL // CIB
          </span>
          <Badge variant="outline" className="text-[7.5px] px-1.5 py-0 font-bold bg-red-500/10 border-red-500/40 text-red-400">
            SEV-1 CRITICAL
          </Badge>
        </div>
        <h3 className="text-xs font-bold text-zinc-100 tracking-wide leading-tight">
          {campaignName}
        </h3>
        <div className="flex items-center gap-2 text-[8px] text-zinc-400 pt-0.5">
          <span>THREAT ACTOR: <strong className="text-amber-300">{threatActor}</strong></span>
          <span>•</span>
          <span>CONFIDENCE: <strong className="text-emerald-400">{confidenceScore}%</strong></span>
        </div>
      </div>

      {/* ── Vector Direction HUD Strip ── */}
      <div className="p-2.5 rounded bg-zinc-950/80 border border-zinc-800 space-y-2">
        <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">
          ATTACK VECTOR & NODE ATTRIBUTION
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="p-2 rounded bg-zinc-900 border border-amber-500/30 flex-1 min-w-0">
            <span className="text-[7.5px] text-zinc-500 block uppercase">ORIGIN / HUB</span>
            <span className="text-[10px] font-bold text-amber-300 truncate block">
              [{edge.source}] {sourceName}
            </span>
            <span className="text-[7.5px] text-zinc-400 block mt-0.5">
              BOTNET VOL: {botnetVolume} IPs
            </span>
          </div>

          <div className="flex flex-col items-center shrink-0">
            <span className="text-[8px] font-bold text-cyan-400 animate-pulse">➔ ➔ ➔</span>
            <span className="text-[7px] text-zinc-500">{edge.weight} WT</span>
          </div>

          <div className="p-2 rounded bg-zinc-900 border border-cyan-500/30 flex-1 min-w-0 text-right">
            <span className="text-[7.5px] text-zinc-500 block uppercase">TARGET THEATER</span>
            <span className="text-[10px] font-bold text-cyan-300 truncate block">
              [{edge.target}] {targetName}
            </span>
            <span className="text-[7.5px] text-zinc-400 block mt-0.5">
              GOV / DEFENSE
            </span>
          </div>
        </div>
      </div>

      {/* ── Narrative Objective & Description ── */}
      <div className="space-y-1">
        <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">
          NARRATIVE INJECTION OBJECTIVE
        </span>
        <p className="text-[9.5px] text-zinc-300 leading-relaxed p-2 rounded bg-zinc-900/40 border border-zinc-800/80">
          {narrativeObjective}
        </p>
      </div>

      {/* ── DISARM / MITRE ATLAS Tactics ── */}
      <div className="space-y-1.5">
        <span className="text-[8.5px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
          <Terminal size={10} className="text-cyan-400" />
          DISARM FRAMEWORK TACTICS (TTPs)
        </span>
        <div className="flex flex-wrap gap-1">
          {disarmTactics.map((tactic, idx) => (
            <Badge 
              key={idx} 
              variant="outline" 
              className="text-[8px] font-mono px-1.5 py-0.5 bg-zinc-900 border-zinc-700 text-zinc-300"
            >
              {tactic}
            </Badge>
          ))}
        </div>
      </div>

      {/* ── Targeted Sectors ── */}
      <div className="space-y-1.5">
        <span className="text-[8.5px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
          <Target size={10} className="text-red-400" />
          TARGETED STRATEGIC SECTORS
        </span>
        <div className="grid grid-cols-1 gap-1">
          {targetedSectors.map((sector, idx) => (
            <div 
              key={idx} 
              className="text-[8.5px] p-1.5 rounded bg-zinc-900/50 border border-zinc-800/70 text-zinc-300 flex items-center gap-1.5"
            >
              <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
              <span>{sector}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Evidence & Threat Intelligence Disclosures ── */}
      {sources && sources.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[8.5px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <FileText size={10} className="text-amber-400" />
            VERIFIED EVIDENCE & DISCLOSURES ({sources.length})
          </span>
          <div className="space-y-1">
            {sources.map((src, idx) => (
              <a
                key={idx}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-left transition-all no-underline group"
              >
                <div className="flex items-center justify-between text-[7.5px] text-zinc-500 mb-0.5">
                  <span className="font-bold text-amber-400/90">{src.domain}</span>
                  <ExternalLink size={9} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-[8.5px] text-zinc-300 line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                  {src.title}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
