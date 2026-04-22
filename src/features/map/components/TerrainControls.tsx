'use client';

import { useState } from 'react';
import { Mountain, Layers, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Props = {
  terrainExaggeration: number;
  hillshadeIntensity: number;
  showRoads: boolean;
  show3DBuildings: boolean;
  onTerrainExaggerationChange: (value: number) => void;
  onHillshadeIntensityChange: (value: number) => void;
  onShowRoadsChange: (value: boolean) => void;
  onShow3DBuildingsChange: (value: boolean) => void;
};

export function TerrainControls({
  terrainExaggeration,
  hillshadeIntensity,
  showRoads,
  show3DBuildings,
  onTerrainExaggerationChange,
  onHillshadeIntensityChange,
  onShowRoadsChange,
  onShow3DBuildingsChange,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-3 bg-[var(--bg-panel)]/95 backdrop-blur-sm border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Terrain Controls
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-3">
          {/* Terrain Exaggeration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[var(--text-secondary)]">
                Elevation
              </Label>
              <span className="text-xs font-mono text-[var(--text-primary)]">
                {terrainExaggeration.toFixed(1)}x
              </span>
            </div>
            <Slider
              value={[terrainExaggeration]}
              onValueChange={([value]) => onTerrainExaggerationChange(value)}
              min={0.5}
              max={3.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Hillshade Intensity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-[var(--text-secondary)]">
                Hillshade
              </Label>
              <span className="text-xs font-mono text-[var(--text-primary)]">
                {Math.round(hillshadeIntensity * 100)}%
              </span>
            </div>
            <Slider
              value={[hillshadeIntensity]}
              onValueChange={([value]) => onHillshadeIntensityChange(value)}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Road Layer Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-[var(--text-secondary)]">
              Road Network
            </Label>
            <Switch
              checked={showRoads}
              onCheckedChange={onShowRoadsChange}
            />
          </div>

          {/* 3D Buildings Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-[var(--text-secondary)]">
              3D Buildings
            </Label>
            <Switch
              checked={show3DBuildings}
              onCheckedChange={onShow3DBuildingsChange}
            />
          </div>

          {/* Info */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
              NASA-level terrain visualization with real elevation data. 
              Adjust settings for optimal intelligence analysis.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
