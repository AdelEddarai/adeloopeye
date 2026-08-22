'use client';

import React from 'react';
import {
  ShieldAlert,
  Plane,
  Anchor,
  Flame,
  Building2,
  Activity,
  Mountain,
  Globe2,
  Sparkles,
  Layers,
  MapPin,
  Compass,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import type { OverlayVisibility } from '@/features/map/components/MapVisibilityMenu';

type IntelDataLayers = {
  flights: boolean;
  routes: boolean;
  weather: boolean;
  fires: boolean;
  infrastructure: boolean;
  maritime: boolean;
  disinfo?: boolean;
  cyberThreats?: boolean;
};

type Props = {
  dataLayers: IntelDataLayers;
  onDataLayerToggle: (layer: keyof IntelDataLayers) => void;
  visibility: OverlayVisibility;
  onVisibilityToggle: (key: keyof OverlayVisibility) => void;
  scope: { world: boolean; morocco: boolean };
  onScopeChange: (next: { world?: boolean; morocco?: boolean }) => void;
  moroccoLayerToggles?: {
    events: boolean;
    routes: boolean;
    weather: boolean;
    fires: boolean;
    infrastructure: boolean;
    connections: boolean;
  };
  onMoroccoLayerToggle?: (layer: 'events' | 'routes' | 'weather' | 'fires' | 'infrastructure' | 'connections') => void;
  showAllLabels: boolean;
  onShowAllLabelsChange: (show: boolean) => void;
  showTerrain: boolean;
  onTerrainToggle: () => void;
  terrainExaggeration: number;
  onTerrainExaggerationChange: (v: number) => void;
  show3DBuildings: boolean;
  onShow3DBuildingsChange: (v: boolean) => void;
  showRoads: boolean;
  onShowRoadsChange: (v: boolean) => void;
};

export function MobileLayersTab({
  dataLayers,
  onDataLayerToggle,
  visibility,
  onVisibilityToggle,
  scope,
  onScopeChange,
  moroccoLayerToggles,
  onMoroccoLayerToggle,
  showAllLabels,
  onShowAllLabelsChange,
  showTerrain,
  onTerrainToggle,
  terrainExaggeration,
  onTerrainExaggerationChange,
  show3DBuildings,
  onShow3DBuildingsChange,
  showRoads,
  onShowRoadsChange,
}: Props) {
  const telemetryLayers = [
    {
      key: 'disinfo',
      name: 'Disinfo & Bots',
      desc: 'CIB campaigns & influence vectors',
      icon: ShieldAlert,
      color: 'text-amber-400',
      activeColor: 'border-amber-500/60 bg-amber-950/20 text-amber-300',
      isOverlay: true,
      active: !!visibility.disinfo,
    },
    {
      key: 'cyberThreats',
      name: 'Cyber Beacons',
      desc: 'DDoS, Malware & Intrusion alerts',
      icon: Sparkles,
      color: 'text-red-400',
      activeColor: 'border-red-500/60 bg-red-950/20 text-red-300',
      isOverlay: true,
      active: !!visibility.cyberThreats,
    },
    {
      key: 'flights',
      name: 'ADS-B Flights',
      desc: 'Live military & commercial aircraft',
      icon: Plane,
      color: 'text-purple-400',
      activeColor: 'border-purple-500/60 bg-purple-950/20 text-purple-300',
      isOverlay: false,
      active: !!dataLayers.flights,
    },
    {
      key: 'maritime',
      name: 'AIS Maritime',
      desc: 'Vessels, warships & choke routes',
      icon: Anchor,
      color: 'text-cyan-400',
      activeColor: 'border-cyan-500/60 bg-cyan-950/20 text-cyan-300',
      isOverlay: false,
      active: !!dataLayers.maritime,
    },
    {
      key: 'fires',
      name: 'Thermal Fires',
      desc: 'NASA FIRMS & thermal hotspots',
      icon: Flame,
      color: 'text-orange-400',
      activeColor: 'border-orange-500/60 bg-orange-950/20 text-orange-300',
      isOverlay: false,
      active: !!dataLayers.fires,
    },
    {
      key: 'infrastructure',
      name: 'Energy Grid',
      desc: 'Strategic power plants & hubs',
      icon: Building2,
      color: 'text-emerald-400',
      activeColor: 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300',
      isOverlay: false,
      active: !!dataLayers.infrastructure,
    },
    {
      key: 'routes',
      name: 'Civil Vectors',
      desc: 'Major logistics & transit lines',
      icon: Activity,
      color: 'text-blue-400',
      activeColor: 'border-blue-500/60 bg-blue-950/20 text-blue-300',
      isOverlay: false,
      active: !!dataLayers.routes,
    },
  ];

  return (
    <div className="space-y-4 pb-12 font-mono text-xs">
      {/* ── Regional Scope Filter Pills ── */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>OPERATIONAL THEATRE</span>
          <span className="text-[9px] text-cyan-400">GEOPOLITICAL SCOPE</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onScopeChange({ world: !scope.world })}
            className={`flex items-center justify-between p-2.5 rounded-sm border transition-all ${
              scope.world
                ? 'bg-zinc-900 border-cyan-500/70 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe2 size={14} className={scope.world ? 'text-cyan-400' : 'text-zinc-600'} />
              <span className="font-bold">GLOBAL THEATRE</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${scope.world ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-700'}`} />
          </button>

          <button
            onClick={() => onScopeChange({ morocco: !scope.morocco })}
            className={`flex items-center justify-between p-2.5 rounded-sm border transition-all ${
              scope.morocco
                ? 'bg-zinc-900 border-cyan-500/70 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">🇲🇦</span>
              <span className="font-bold">MOROCCO OSINT</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${scope.morocco ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-700'}`} />
          </button>
        </div>
      </div>

      {/* ── Real-Time Telemetry Layer Grid ── */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>LIVE TELEMETRY FEEDS</span>
          <span className="text-[9px] text-zinc-500">TAP TO TOGGLE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {telemetryLayers.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (item.isOverlay) {
                    onVisibilityToggle(item.key as keyof OverlayVisibility);
                  } else {
                    onDataLayerToggle(item.key as keyof IntelDataLayers);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-all active:scale-[0.98] ${
                  item.active
                    ? item.activeColor
                    : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-sm bg-zinc-900/90 border border-zinc-800 ${item.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-zinc-200 tracking-tight">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{item.desc}</div>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition-colors ${
                      item.active ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {item.active && <span className="text-[9px] font-black leading-none">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3D Terrain & Shading Engine ── */}
      <div className="p-3 rounded-sm bg-zinc-900/40 border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain size={15} className="text-cyan-400" />
            <div>
              <div className="font-bold text-zinc-200 uppercase tracking-wide text-[11px]">3D TERRAIN & RELIEF</div>
              <div className="text-[9px] text-zinc-500">MapLibre dynamic hillshade elevation</div>
            </div>
          </div>
          <Switch checked={showTerrain} onCheckedChange={onTerrainToggle} className="scale-90" />
        </div>

        {showTerrain && (
          <div className="space-y-2.5 pt-2 border-t border-zinc-800/60">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <span>ELEVATION EXAGGERATION</span>
                <span className="text-cyan-300 font-bold">{terrainExaggeration.toFixed(1)}x</span>
              </div>
              <Slider
                value={[terrainExaggeration]}
                onValueChange={([v]) => onTerrainExaggerationChange(v)}
                min={0.5}
                max={3.0}
                step={0.1}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onShow3DBuildingsChange(!show3DBuildings)}
                className={`p-2 rounded-xs border text-[10px] font-bold text-center transition-colors ${
                  show3DBuildings
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                3D BUILDINGS {show3DBuildings ? '●' : '○'}
              </button>

              <button
                onClick={() => onShowRoadsChange(!showRoads)}
                className={`p-2 rounded-xs border text-[10px] font-bold text-center transition-colors ${
                  showRoads
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                HIGHWAYS {showRoads ? '●' : '○'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Label Density Settings ── */}
      <div className="p-3 rounded-sm bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between">
        <div>
          <div className="font-bold text-zinc-200 uppercase tracking-wide text-[11px]">LABEL DENSITY</div>
          <div className="text-[9px] text-zinc-500">
            {showAllLabels ? 'Showing all airport & city callouts' : 'Smart filtering based on zoom'}
          </div>
        </div>
        <button
          onClick={() => onShowAllLabelsChange(!showAllLabels)}
          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-cyan-300 active:scale-95 transition-all"
        >
          {showAllLabels ? 'MAX DENSE' : 'SMART FILTER'}
        </button>
      </div>
    </div>
  );
}
