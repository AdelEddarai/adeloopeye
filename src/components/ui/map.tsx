'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

type MapContextType = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextType>({ map: null, isLoaded: false });

export const useMap = () => useContext(MapContext);

type MapProps = {
  center?: [number, number];
  zoom?: number;
  style?: string;
  children?: React.ReactNode;
  className?: string;
  pitch?: number;
  bearing?: number;
  onLoad?: (map: maplibregl.Map) => void;
};

export function Map({
  center = [0, 0],
  zoom = 2,
  style = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  children,
  className = '',
  pitch = 0,
  bearing = 0,
  onLoad,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center,
      zoom,
      pitch,
      bearing,
    });

    mapInstance.on('load', () => {
      setIsLoaded(true);
      onLoad?.(mapInstance);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (map && style) {
      map.setStyle(style);
    }
  }, [map, style]);

  return (
    <MapContext.Provider value={{ map, isLoaded }}>
      <div ref={mapContainer} className={`w-full h-full ${className}`} />
      {children}
    </MapContext.Provider>
  );
}
