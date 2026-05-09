'use client';

import { useEffect, useMemo } from 'react';
import { useMap } from '@/components/ui/map';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapboxOverlayProps } from '@deck.gl/mapbox';

export function MapCNDeckGLOverlay(props: MapboxOverlayProps & { interleaved?: boolean }) {
  const { map } = useMap();
  
  // Create the overlay once
  const overlay = useMemo(() => {
    return new MapboxOverlay({
      interleaved: props.interleaved ?? true,
      ...props
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update props when they change
  useEffect(() => {
    overlay.setProps(props);
  }, [props, overlay]);

  // Add/remove control when map is ready
  useEffect(() => {
    if (map) {
      map.addControl(overlay as any);
      return () => {
        map.removeControl(overlay as any);
      };
    }
  }, [map, overlay]);

  return null;
}
