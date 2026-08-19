'use client';

import { useMemo } from 'react';
import { Anchor, Zap, Shield, Flame, Radio, MapPin, ExternalLink, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type StrategicHub = {
  id: string;
  name: string;
  category: 'MARITIME_PORT' | 'ENERGY_COMPLEX' | 'CHOKEPOINT' | 'MILITARY_AIRBASE' | 'INDUSTRIAL_HUB';
  location: string;
  coordinates: [number, number];
  status: 'OPERATIONAL' | 'HEIGHTENED_ALERT' | 'CONGESTION' | 'SURVEILLANCE';
  capacityPct: number;
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  telemetry: string;
};

const STRATEGIC_HUBS_DATA: StrategicHub[] = [
  {
    id: 'hub-tanger-med',
    name: 'Tanger-Med Port Complex',
    category: 'MARITIME_PORT',
    location: 'Strait of Gibraltar',
    coordinates: [-5.5, 35.89],
    status: 'OPERATIONAL',
    capacityPct: 92,
    threatLevel: 'NOMINAL',
    telemetry: '9.2M TEU throughput · TC4 Automated Quay',
  },
  {
    id: 'hub-gibraltar-patrol',
    name: 'Strait of Gibraltar Maritime Chokepoint',
    category: 'CHOKEPOINT',
    location: 'Northern Maritime Sector',
    coordinates: [-5.6, 35.95],
    status: 'SURVEILLANCE',
    capacityPct: 88,
    threatLevel: 'ELEVATED',
    telemetry: 'FREMM Mohammed VI & SIGMA Patrol active',
  },
  {
    id: 'hub-noor-ouarzazate',
    name: 'Noor Ouarzazate Solar Complex',
    category: 'ENERGY_COMPLEX',
    location: 'Drâa-Tafilalet',
    coordinates: [-6.86, 30.99],
    status: 'OPERATIONAL',
    capacityPct: 96,
    threatLevel: 'NOMINAL',
    telemetry: '580 MW Peak Capacity · Grid Frequency 50.02Hz',
  },
  {
    id: 'hub-jorf-lasfar',
    name: 'Jorf Lasfar Phosphate & Energy Terminal',
    category: 'INDUSTRIAL_HUB',
    location: 'El Jadida',
    coordinates: [-8.63, 33.12],
    status: 'OPERATIONAL',
    capacityPct: 84,
    threatLevel: 'NOMINAL',
    telemetry: 'OCP Fertilizer Hub · Aframax Terminal',
  },
  {
    id: 'hub-nador-west-med',
    name: 'Nador West Med Strategic Complex',
    category: 'MARITIME_PORT',
    location: 'Betoya Bay / Oriental',
    coordinates: [-3.05, 35.25],
    status: 'HEIGHTENED_ALERT',
    capacityPct: 78,
    threatLevel: 'ELEVATED',
    telemetry: 'Hydrocarbon Bunkering & Container Transshipment',
  },
  {
    id: 'hub-ben-guerir',
    name: 'Ben Guerir Air Base (BA 6)',
    category: 'MILITARY_AIRBASE',
    location: 'Rehamna',
    coordinates: [-7.91, 32.21],
    status: 'OPERATIONAL',
    capacityPct: 95,
    threatLevel: 'NOMINAL',
    telemetry: 'F-16V Block 72 Viper Squadron Readiness',
  },
];

type StrategicHubsMatrixProps = {
  onNavigateLocation?: (location: string) => void;
};

export function StrategicHubsMatrix({ onNavigateLocation }: StrategicHubsMatrixProps) {
  const getCategoryIcon = (cat: StrategicHub['category']) => {
    switch (cat) {
      case 'MARITIME_PORT': return <Anchor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ENERGY_COMPLEX': return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'CHOKEPOINT': return <Radio className="w-3.5 h-3.5 text-blue-400" />;
      case 'MILITARY_AIRBASE': return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getThreatBadge = (level: StrategicHub['threatLevel']) => {
    switch (level) {
      case 'CRITICAL':
        return <Badge variant="outline" className="text-[8px] font-mono bg-red-500/15 border-red-500/40 text-red-400">CRITICAL</Badge>;
      case 'ELEVATED':
        return <Badge variant="outline" className="text-[8px] font-mono bg-amber-500/15 border-amber-500/40 text-amber-400">ELEVATED</Badge>;
      default:
        return <Badge variant="outline" className="text-[8px] font-mono bg-emerald-500/15 border-emerald-500/40 text-emerald-400">NOMINAL</Badge>;
    }
  };

  return (
    <Card className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md relative overflow-hidden shadow-lg">
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-700/80 pointer-events-none" />

      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between border-b border-zinc-900">
        <CardTitle className="text-[10px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase font-mono tracking-widest">
          <Anchor className="w-3.5 h-3.5 text-cyan-400" />
          Strategic Assets & Chokepoint Readiness Matrix
          <Badge variant="outline" className="ml-1.5 text-[8px] bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-mono">
            FOUNDRY ASSET TELEMETRY
          </Badge>
        </CardTitle>
        <span className="text-[8px] font-mono text-zinc-500">6 CRITICAL HUBS MONITORED</span>
      </CardHeader>

      <CardContent className="p-2.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {STRATEGIC_HUBS_DATA.map((hub) => (
            <div
              key={hub.id}
              className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="p-1 rounded bg-zinc-950 border border-zinc-800 shrink-0">
                      {getCategoryIcon(hub.category)}
                    </div>
                    <span className="text-[10px] font-bold font-mono text-zinc-200 truncate group-hover:text-cyan-300 transition-colors">
                      {hub.name}
                    </span>
                  </div>
                  {getThreatBadge(hub.threatLevel)}
                </div>

                <p className="text-[9px] font-mono text-zinc-400 line-clamp-1 mb-2">
                  {hub.telemetry}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <div className="flex-1 h-1 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${hub.capacityPct}%` }}
                    />
                  </div>
                  <span className="text-[8px] font-mono text-zinc-400 shrink-0 font-bold">
                    {hub.capacityPct}%
                  </span>
                </div>

                {onNavigateLocation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateLocation(hub.location)}
                    className="h-5 px-1.5 text-[8px] font-mono text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 rounded-sm"
                  >
                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                    MAP
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
