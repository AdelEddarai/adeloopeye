'use client';

import { useState } from 'react';
import { Map, Satellite, Mountain, Plane, Route, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

type MapStyleType = 'dark' | 'satellite' | 'terrain';

type DataLayerToggles = {
  flights: boolean;
  routes: boolean;
  weather: boolean;
  fires: boolean;
  infrastructure: boolean;
};

type Props = {
  mapStyle: 'dark' | 'satellite';
  showTerrain: boolean;
  dataLayers: DataLayerToggles;
  onStyleChange: (style: 'dark' | 'satellite') => void;
  onTerrainToggle: () => void;
  onDataLayerToggle: (layer: keyof DataLayerToggles) => void;
  defaultExpanded?: boolean;
};

export function MapStylePanel({
  mapStyle,
  showTerrain,
  dataLayers,
  onStyleChange,
  onTerrainToggle,
  onDataLayerToggle,
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const styleButtons: { key: MapStyleType; label: string; icon: React.ReactNode }[] = [
    { key: 'dark', label: 'DARK', icon: <Map size={12} /> },
    { key: 'satellite', label: 'SAT', icon: <Satellite size={12} /> },
    { key: 'terrain', label: 'TERRAIN', icon: <Mountain size={12} /> },
  ];

  const dataLayerButtons: { key: keyof DataLayerToggles; label: string; icon: React.ReactNode }[] = [
    { key: 'flights', label: 'FLIGHTS', icon: <Plane size={12} /> },
    { key: 'routes', label: 'ROUTES', icon: <Route size={12} /> },
  ];

  const currentStyle: MapStyleType = showTerrain ? 'terrain' : mapStyle;

  return (
    <div className="flex flex-col items-end gap-1 min-w-0" style={{ maxWidth: '100%' }}>
      {/* Collapsed: single icon button */}
      {!expanded && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setExpanded(true)}
          className="mono rounded-sm px-1.5 py-0 h-7 w-7"
          style={{
            background: 'rgba(28,33,39,0.95)',
            border: '1px solid var(--bd)',
            color: 'var(--t3)',
          }}
          title="Map controls"
        >
          <Map size={12} strokeWidth={2} />
        </Button>
      )}

      {/* Expanded: full control bar */}
      {expanded && (
        <div
          className="flex items-center gap-0.5 flex-wrap rounded-sm"
          style={{
            background: 'rgba(28,33,39,0.95)',
            border: '1px solid var(--bd)',
            padding: '4px 6px',
            maxWidth: 'min(100%, 520px)',
            minWidth: 0,
          }}
        >
          {/* Map Style Buttons */}
          {styleButtons.map((btn) => {
            const isActive = currentStyle === btn.key;
            return (
              <Button
                key={btn.key}
                variant="ghost"
                size="xs"
                onClick={() => {
                  if (btn.key === 'terrain') {
                    if (!showTerrain) {
                      onStyleChange('satellite');
                      onTerrainToggle();
                    }
                  } else {
                    if (showTerrain) onTerrainToggle();
                    onStyleChange(btn.key);
                  }
                }}
                className="mono rounded-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider flex items-center gap-1"
                style={{
                  border: `1px solid ${isActive ? 'var(--blue)' : 'var(--bd)'}`,
                  background: isActive ? 'var(--blue-dim)' : 'var(--bg-1)',
                  color: isActive ? 'var(--blue-l)' : 'var(--t4)',
                }}
              >
                {btn.icon}
                {btn.label}
              </Button>
            );
          })}

          <div className="w-px h-3.5 bg-[var(--bd)] mx-0.5 flex-shrink-0" />

          {/* Data Layer Buttons */}
          {dataLayerButtons.map((btn) => {
            const isActive = dataLayers[btn.key];
            return (
              <Button
                key={btn.key}
                variant="ghost"
                size="xs"
                onClick={() => onDataLayerToggle(btn.key)}
                className="mono rounded-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider flex items-center gap-1"
                style={{
                  border: `1px solid ${isActive ? 'var(--success)' : 'var(--bd)'}`,
                  background: isActive ? 'rgba(34,197,94,0.15)' : 'var(--bg-1)',
                  color: isActive ? 'var(--success)' : 'var(--t4)',
                }}
              >
                {btn.icon}
                {btn.label}
              </Button>
            );
          })}

          <div className="w-px h-3.5 bg-[var(--bd)] mx-0.5 flex-shrink-0" />

          <Button
            variant="ghost"
            size="xs"
            onClick={() => setExpanded(false)}
            className="mono rounded-sm px-1.5 py-0 h-5 text-[length:var(--text-tiny)] font-bold tracking-wider"
            style={{
              border: '1px solid var(--bd)',
              background: 'var(--bg-1)',
              color: 'var(--t4)',
            }}
            title="Close controls"
          >
            CLOSE
          </Button>
        </div>
      )}
    </div>
  );
}
