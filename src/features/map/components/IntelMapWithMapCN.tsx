'use client';

import { useState, useCallback, useEffect } from 'react';
import { Map, useMap } from '@/components/ui/map';
import { Button } from '@/components/ui/button';
import { Mountain, RotateCcw, Compass } from 'lucide-react';
import { useMapData } from '@/features/map/queries';
import { MAP_STYLE_SAT } from './map-styles';

/**
 * 3D Map Controls Component
 * Integrated directly into the map
 */
function MapControls() {
  const { map, isLoaded } = useMap();
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMove = () => {
      setPitch(Math.round(map.getPitch()));
      setBearing(Math.round(map.getBearing()));
    };

    handleMove();
    map.on('move', handleMove);

    return () => {
      map.off('move', handleMove);
    };
  }, [map, isLoaded]);

  const handle3DView = useCallback(() => {
    if (!map) return;
    map.easeTo({
      pitch: 60,
      bearing: -20,
      duration: 1000,
    });
    setIs3DMode(true);
  }, [map]);

  const handleReset = useCallback(() => {
    if (!map) return;
    map.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
    setIs3DMode(false);
  }, [map]);

  const handleRotateLeft = useCallback(() => {
    if (!map) return;
    const currentBearing = map.getBearing();
    map.easeTo({
      bearing: currentBearing - 45,
      duration: 500,
    });
  }, [map]);

  const handleRotateRight = useCallback(() => {
    if (!map) return;
    const currentBearing = map.getBearing();
    map.easeTo({
      bearing: currentBearing + 45,
      duration: 500,
    });
  }, [map]);

  if (!isLoaded) return null;

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
      {/* 3D Controls */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={is3DMode ? 'default' : 'secondary'}
          onClick={handle3DView}
          className="h-auto px-2 py-1.5 text-[length:var(--text-tiny)] font-bold mono"
        >
          <Mountain className="mr-1 size-3.5" />
          3D VIEW
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleReset}
          className="h-auto px-2 py-1.5 text-[length:var(--text-tiny)] font-bold mono"
        >
          <RotateCcw className="mr-1 size-3.5" />
          RESET
        </Button>
      </div>

      {/* Rotation Controls (only show in 3D mode) */}
      {is3DMode && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRotateLeft}
            className="h-auto px-2 py-1.5 text-[length:var(--text-tiny)] font-bold mono"
          >
            <Compass className="mr-1 size-3.5" />
            ← ROTATE
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRotateRight}
            className="h-auto px-2 py-1.5 text-[length:var(--text-tiny)] font-bold mono"
          >
            ROTATE →
            <Compass className="ml-1 size-3.5" />
          </Button>
        </div>
      )}

      {/* Pitch & Bearing Display */}
      <div className="bg-[var(--bg-app)]/90 rounded-sm border border-[var(--bd)] px-2 py-1.5 font-mono text-[length:var(--text-tiny)] backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-[var(--t4)]">PITCH:</span>
          <span className="text-[var(--t1)] font-bold">{pitch}°</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[var(--t4)]">BEARING:</span>
          <span className="text-[var(--t1)] font-bold">{bearing}°</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Intel Map using MapCN
 * Clean, modern map component with 3D view support
 */
export function IntelMapWithMapCN() {
  const { data: mapData } = useMapData();

  return (
    <div className="h-full w-full relative">
      {/* Title Bar */}
      <div style={{ height: 36, background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 'var(--text-body-sm)', fontFamily: 'monospace' }}>◈ INTEL MAP (MapCN)</span>
        <span style={{ color: 'var(--t3)', fontSize: 'var(--text-caption)', fontFamily: 'monospace', marginLeft: 4 }}>OPERATION EPIC FURY</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', marginLeft: 4 }} />
        <span style={{ color: 'var(--success)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>LIVE</span>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 top-[36px]">
        <Map
          center={[51.0, 30.0]}
          zoom={4.5}
          style={MAP_STYLE_SAT}
          pitch={0}
          bearing={0}
        >
          <MapControls />
        </Map>
      </div>
    </div>
  );
}
