'use client';

import { useState } from 'react';
import {
  Map, Satellite, Mountain, Layers, Eye, EyeOff,
  ChevronDown, ChevronUp, Maximize, List, Globe2, Network,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  const [activeTab, setActiveTab] = useState<'base' | 'data' | 'terrain'>('base');

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="bg-zinc-950/90 border-zinc-800 text-zinc-400 hover:text-blue-400 font-mono text-[10px] h-8 px-3 rounded-sm shadow-xl"
      >
        <Settings2 size={14} className="mr-2" />
        MAP CONTROLS
      </Button>
    );
  }

  return (
    <Card className="w-[280px] bg-zinc-950/95 backdrop-blur-md border-zinc-800 rounded-sm shadow-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/50">
        <span className="text-[10px] font-bold text-zinc-400 tracking-widest font-mono flex items-center gap-1.5">
          <Globe2 size={12} className="text-blue-400" />
          MAP CONFIGURATION
        </span>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)} className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-200">
          <ChevronDown size={14} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-800/80 p-1 bg-zinc-900/20">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('base')}
          className={`h-7 px-0 text-[9px] font-mono rounded-xs ${activeTab === 'base' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Map size={10} className="mr-1.5" /> BASE
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('data')}
          className={`h-7 px-0 text-[9px] font-mono rounded-xs ${activeTab === 'data' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Layers size={10} className="mr-1.5" /> LAYERS
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('terrain')}
          className={`h-7 px-0 text-[9px] font-mono rounded-xs ${activeTab === 'terrain' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Mountain size={10} className="mr-1.5" /> TERRAIN
        </Button>
      </div>

      <div className="p-3 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {activeTab === 'base' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Style</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => onStyleChange('dark')}
                  className={`h-8 font-mono text-[10px] rounded-sm ${mapStyle === 'dark' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <Map size={12} className="mr-2" /> DARK
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onStyleChange('satellite')}
                  className={`h-8 font-mono text-[10px] rounded-sm ${mapStyle === 'satellite' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  <Satellite size={12} className="mr-2" /> SATELLITE
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Labels</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => onShowAllLabelsChange(false)}
                  className={`h-8 font-mono text-[10px] rounded-sm ${!showAllLabels ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  SMART
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onShowAllLabelsChange(true)}
                  className={`h-8 font-mono text-[10px] rounded-sm ${showAllLabels ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                >
                  ALL LABELS
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Scope</Label>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-1 rounded-sm hover:bg-zinc-900">
                  <span className="text-[10px] font-mono text-zinc-300 uppercase">world</span>
                  <Switch
                    checked={scope.world}
                    onCheckedChange={() => onScopeChange({ world: !scope.world })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between p-1 rounded-sm hover:bg-zinc-900">
                  <span className="text-[10px] font-mono text-zinc-300 uppercase">morocco</span>
                  <Switch
                    checked={scope.morocco}
                    onCheckedChange={() => onScopeChange({ morocco: !scope.morocco })}
                    className="scale-75"
                  />
                </div>
                <p className="text-[9px] text-zinc-500 font-mono leading-tight pt-1">
                  Enable both for fused OSINT. Disable one for performance focus.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Intel Layers</Label>
              <div className="space-y-1">
                {(['flights', 'maritime', 'routes', 'weather', 'fires', 'infrastructure'] as const).map(layer => (
                  <div key={layer} className="flex items-center justify-between p-1 rounded-sm hover:bg-zinc-900">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">{layer}</span>
                    <Switch checked={dataLayers[layer]} onCheckedChange={() => onDataLayerToggle(layer)} className="scale-75" />
                  </div>
                ))}
              </div>
              {scope.world && (
                <p className="text-[8px] text-zinc-600 font-mono leading-tight">
                  Maritime: OpenSky flights stay separate. Live ship AIS uses optional env DATALASTIC_API_KEY; trade lanes always load from map data.
                </p>
              )}
            </div>

            {scope.morocco && moroccoLayerToggles && onMoroccoLayerToggle && (
              <div className="space-y-2">
                <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Morocco Layers</Label>
                <div className="space-y-1">
                  {(['events', 'routes', 'weather', 'fires', 'infrastructure', 'connections'] as const).map(layer => (
                    <div key={layer} className="flex items-center justify-between p-1 rounded-sm hover:bg-zinc-900">
                      <span className="text-[10px] font-mono text-zinc-300 uppercase">{layer}</span>
                      <Switch
                        checked={moroccoLayerToggles[layer]}
                        onCheckedChange={() => onMoroccoLayerToggle(layer)}
                        className="scale-75"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Overlays</Label>
              <div className="space-y-1">
                {(['timeline', 'filters', 'legend', 'events', 'cyberThreats'] as const).map(key => (
                  <div key={key} className="flex items-center justify-between p-1 rounded-sm hover:bg-zinc-900">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Switch checked={visibility[key]} onCheckedChange={() => onVisibilityToggle(key)} className="scale-75" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terrain' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <Label className="text-[10px] text-zinc-300 font-mono tracking-wider flex items-center">
                <Mountain size={12} className="mr-2 text-zinc-400" />
                ENABLE 3D TERRAIN
              </Label>
              <Switch checked={showTerrain} onCheckedChange={onTerrainToggle} />
            </div>

            {showTerrain && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Exaggeration</Label>
                    <span className="text-[9px] font-mono text-blue-400">{terrainExaggeration.toFixed(1)}x</span>
                  </div>
                  <Slider value={[terrainExaggeration]} onValueChange={([v]) => onTerrainExaggerationChange(v)} min={0.5} max={3.0} step={0.1} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Hillshade</Label>
                    <span className="text-[9px] font-mono text-blue-400">{Math.round(hillshadeIntensity * 100)}%</span>
                  </div>
                  <Slider value={[hillshadeIntensity]} onValueChange={([v]) => onHillshadeIntensityChange(v)} min={0} max={1} step={0.1} />
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between p-1">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">3D BUILDINGS</span>
                    <Switch checked={show3DBuildings} onCheckedChange={onShow3DBuildingsChange} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between p-1">
                    <span className="text-[10px] font-mono text-zinc-300 uppercase">ROAD NETWORK</span>
                    <Switch checked={showRoads} onCheckedChange={onShowRoadsChange} className="scale-75" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
