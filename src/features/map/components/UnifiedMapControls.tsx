'use client';

import { useState } from 'react';
import {
  Map, Satellite, Mountain, Layers, Eye, EyeOff,
  ChevronDown, ChevronUp, Globe2, Plane, Anchor,
  Flame, ShieldAlert, Building2, Activity, Settings2,
  Sliders, Compass, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import type { OverlayVisibility } from '@/features/map/components/MapVisibilityMenu';

type IntelDataLayers = {
  flights: boolean;
  routes: boolean;
  weather: boolean;
  fires: boolean;
  infrastructure: boolean;
  maritime: boolean;
};

type UnifiedControlsProps = {
  // Base Map
  mapStyle: 'dark' | 'satellite';
  onStyleChange: (style: 'dark' | 'satellite') => void;
  showAllLabels: boolean;
  onShowAllLabelsChange: (show: boolean) => void;

  // Data Layers
  dataLayers: IntelDataLayers;
  onDataLayerToggle: (layer: keyof IntelDataLayers) => void;

  // Scope
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

  // Overlays
  visibility: OverlayVisibility;
  onVisibilityToggle: (key: keyof OverlayVisibility) => void;

  // Terrain
  showTerrain: boolean;
  onTerrainToggle: () => void;
  terrainExaggeration: number;
  hillshadeIntensity: number;
  showRoads: boolean;
  show3DBuildings: boolean;
  onTerrainExaggerationChange: (v: number) => void;
  onHillshadeIntensityChange: (v: number) => void;
  onShowRoadsChange: (v: boolean) => void;
  onShow3DBuildingsChange: (v: boolean) => void;
};

export function UnifiedMapControls({
  mapStyle, onStyleChange,
  showAllLabels, onShowAllLabelsChange,
  dataLayers, onDataLayerToggle,
  scope, onScopeChange,
  moroccoLayerToggles, onMoroccoLayerToggle,
  visibility, onVisibilityToggle,
  showTerrain, onTerrainToggle,
  terrainExaggeration, onTerrainExaggerationChange,
  hillshadeIntensity, onHillshadeIntensityChange,
  showRoads, onShowRoadsChange,
  show3DBuildings, onShow3DBuildingsChange,
}: UnifiedControlsProps) {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'base' | 'layers' | 'terrain'>('layers');

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="bg-zinc-950/90 hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-cyan-300 font-mono text-[10px] h-8 px-3 rounded-sm shadow-2xl backdrop-blur-xl border transition-all"
      >
        <Settings2 size={13} className="mr-1.5 text-cyan-400" />
        MAP HUD
      </Button>
    );
  }

  const activeLayersCount = Object.values(dataLayers).filter(Boolean).length;

  return (
    <Card className="w-[300px] bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/90 rounded-sm shadow-2xl overflow-hidden relative group">
      {/* Tactical corner reticles */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-zinc-700/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-zinc-700/80 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900 bg-zinc-900/60">
        <span className="text-[10px] font-bold text-zinc-200 tracking-wider font-mono flex items-center gap-1.5 uppercase">
          <Globe2 size={13} className="text-cyan-400 animate-spin-slow" />
          MAP CONFIGURATION // HUD
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
          className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-200 rounded-sm"
        >
          <ChevronUp size={13} />
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-900 p-1 bg-zinc-950/60 gap-1">
        <button
          onClick={() => setActiveTab('base')}
          className={`h-7 text-[9px] font-mono font-bold uppercase rounded-sm flex items-center justify-center gap-1 transition-all ${
            activeTab === 'base'
              ? 'bg-zinc-800 text-cyan-300 border border-zinc-700/80 shadow-inner'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Map size={11} /> BASE
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`h-7 text-[9px] font-mono font-bold uppercase rounded-sm flex items-center justify-center gap-1 transition-all ${
            activeTab === 'layers'
              ? 'bg-zinc-800 text-cyan-300 border border-zinc-700/80 shadow-inner'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Layers size={11} /> LAYERS ({activeLayersCount})
        </button>
        <button
          onClick={() => setActiveTab('terrain')}
          className={`h-7 text-[9px] font-mono font-bold uppercase rounded-sm flex items-center justify-center gap-1 transition-all ${
            activeTab === 'terrain'
              ? 'bg-zinc-800 text-cyan-300 border border-zinc-700/80 shadow-inner'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Mountain size={11} /> 3D TERRAIN
        </button>
      </div>

      {/* Content Body */}
      <div className="p-3 space-y-3.5 max-h-[65vh] overflow-y-auto custom-scrollbar font-mono">
        {/* TAB 1: BASE MAP */}
        {activeTab === 'base' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-widest font-bold">
                TILESET & SHADING
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStyleChange('dark')}
                  className={`h-8 font-mono text-[10px] font-bold rounded-sm border transition-all ${
                    mapStyle === 'dark'
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Map size={12} className="mr-1.5 text-cyan-400" /> TACTICAL DARK
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStyleChange('satellite')}
                  className={`h-8 font-mono text-[10px] font-bold rounded-sm border transition-all ${
                    mapStyle === 'satellite'
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Satellite size={12} className="mr-1.5 text-amber-400" /> SATELLITE
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-widest font-bold">
                LABEL DENSITY
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowAllLabelsChange(false)}
                  className={`h-7 font-mono text-[9px] font-bold rounded-sm border ${
                    !showAllLabels
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  SMART FILTER
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowAllLabelsChange(true)}
                  className={`h-7 font-mono text-[9px] font-bold rounded-sm border ${
                    showAllLabels
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100 shadow'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  ALL LABELS
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATA LAYERS */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            {/* Scope selectors */}
            <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-300 uppercase font-bold flex items-center gap-1">
                  <Globe2 size={11} className="text-blue-400" /> WORLD INTEL
                </span>
                <Switch
                  checked={scope.world}
                  onCheckedChange={() => onScopeChange({ world: !scope.world })}
                  className="scale-75"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-300 uppercase font-bold flex items-center gap-1">
                  🇲🇦 MOROCCO OSINT
                </span>
                <Switch
                  checked={scope.morocco}
                  onCheckedChange={() => onScopeChange({ morocco: !scope.morocco })}
                  className="scale-75"
                />
              </div>
            </div>

            {/* Strategic live feeds */}
            <div className="space-y-1.5">
              <Label className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-widest font-bold">
                REAL-TIME TELEMETRY LAYERS
              </Label>
              <div className="space-y-1">
                {[
                  { key: 'flights', label: 'ADS-B LIVE FLIGHTS', icon: Plane, color: 'text-purple-400' },
                  { key: 'maritime', label: 'AIS MARITIME & LANES', icon: Anchor, color: 'text-cyan-400' },
                  { key: 'fires', label: 'THERMAL & WILDFIRES', icon: Flame, color: 'text-amber-400' },
                  { key: 'infrastructure', label: 'STRATEGIC GRID & HUBS', icon: Building2, color: 'text-emerald-400' },
                  { key: 'routes', label: 'CIVIL TRANSIT VECTORS', icon: Activity, color: 'text-blue-400' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-1.5 rounded bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/80 transition-colors"
                  >
                    <span className="text-[9px] font-mono text-zinc-200 uppercase font-medium flex items-center gap-1.5">
                      <Icon size={11} className={color} /> {label}
                    </span>
                    <Switch
                      checked={dataLayers[key as keyof IntelDataLayers]}
                      onCheckedChange={() => onDataLayerToggle(key as keyof IntelDataLayers)}
                      className="scale-75"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Overlays */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-widest font-bold">
                HUD OVERLAYS
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { key: 'zones', label: 'THREAT ZONES' },
                  { key: 'disinfo', label: 'DISINFO & BOTS' },
                  { key: 'cyberThreats', label: 'CYBER ATTACKS' },
                  { key: 'timeline', label: 'TIMELINE TRACK' },
                  { key: 'legend', label: 'INTEL LEGEND' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => onVisibilityToggle(key as keyof OverlayVisibility)}
                    className={`p-1.5 text-[8px] font-mono font-bold uppercase rounded border text-left transition-all ${
                      visibility[key as keyof OverlayVisibility]
                        ? 'bg-zinc-900 border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 3D TERRAIN */}
        {activeTab === 'terrain' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800">
              <Label className="text-[9px] text-zinc-200 font-mono tracking-wider font-bold flex items-center gap-1.5">
                <Mountain size={12} className="text-amber-400" />
                3D TERRAIN ENGINE
              </Label>
              <Switch checked={showTerrain} onCheckedChange={onTerrainToggle} className="scale-75" />
            </div>

            {showTerrain && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-zinc-400">ELEVATION EXAGGERATION</span>
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

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-zinc-400">HILLSHADE INTENSITY</span>
                    <span className="text-cyan-300 font-bold">{Math.round(hillshadeIntensity * 100)}%</span>
                  </div>
                  <Slider
                    value={[hillshadeIntensity]}
                    onValueChange={([v]) => onHillshadeIntensityChange(v)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>

                <div className="space-y-1 pt-1.5 border-t border-zinc-900">
                  <div className="flex items-center justify-between p-1 rounded hover:bg-zinc-900/40">
                    <span className="text-[9px] font-mono text-zinc-300 uppercase">3D EXTRUDED BUILDINGS</span>
                    <Switch checked={show3DBuildings} onCheckedChange={onShow3DBuildingsChange} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between p-1 rounded hover:bg-zinc-900/40">
                    <span className="text-[9px] font-mono text-zinc-300 uppercase">ROAD & HIGHWAY VECTORS</span>
                    <Switch checked={showRoads} onCheckedChange={onShowRoadsChange} className="scale-75" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
