'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mountain, RotateCcw, Compass } from 'lucide-react';

type Map3DControlsProps = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
};

/**
 * 3D View Controls for MapLibre GL
 * Allows users to toggle between 2D and 3D views with pitch and bearing controls
 */
export function Map3DControls({ map, isLoaded }: Map3DControlsProps) {
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);

  console.log('[Map3DControls] Render:', { map: !!map, isLoaded });

  // Update pitch and bearing when map moves
  useEffect(() => {
    if (!map || !isLoaded) {
      console.log('[Map3DControls] Waiting for map...', { map: !!map, isLoaded });
      return;
    }
    
    console.log('[Map3DControls] Setting up map listeners');
    
    const handleMapMove = () => {
      setPitch(Math.round(map.getPitch()));
      setBearing(Math.round(map.getBearing()));
    };
    
    // Set initial values
    handleMapMove();
    
    map.on('move', handleMapMove);
    
    return () => {
      map.off('move', handleMapMove);
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
