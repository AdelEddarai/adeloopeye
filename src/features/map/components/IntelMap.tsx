'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Link from 'next/link';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, MapPin } from 'lucide-react';

import { useMapData } from '@/features/map/queries';
import type { Asset } from '@/data/map-data';

import { type LayerVisibility, type TooltipObject, useMapLayers } from './intel-map-layers';
import { getMapTooltip } from './intel-map-tooltip';
import { IntelMapLegend } from './IntelMapLegend';
import { Map3DControls } from './Map3DControls';

import { useLiveDisinformation } from '@/shared/hooks/use-live-disinformation';

import { getCoordinatesForLocation } from '@/shared/lib/location-coordinates';
import { clearSelection } from '@/shared/state/event-selection-slice';
import type { RootState } from '@/shared/state';
import { MAP_STYLE_SAT, MAP_STYLE_DARK } from '@/features/map/components/map-styles';


import '@/features/map/lib/deckgl-device';
import 'maplibre-gl/dist/maplibre-gl.css';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 51.0, latitude: 30.0, zoom: 4.5, pitch: 0, bearing: 0,
};

const BUTTON_CONFIG: Array<{
  key: keyof LayerVisibility;
  label: string;
  active: { bg: string; border: string; color: string };
}> = [
  { key: 'strikes',  label: 'STRIKES',  active: { bg: 'var(--blue-dim)', border: 'var(--blue)', color: 'var(--blue-l)' } },
  { key: 'missiles', label: 'MISSILES', active: { bg: 'var(--danger-dim)', border: 'var(--danger)', color: 'var(--danger)' } },
  { key: 'targets',  label: 'TARGETS',  active: { bg: 'var(--warning-dim)', border: 'var(--warning)', color: 'var(--warning)' } },
  { key: 'assets',   label: 'ASSETS',   active: { bg: 'var(--teal-dim)', border: 'var(--teal)', color: 'var(--teal)' } },
  { key: 'flights',  label: 'FLIGHTS',  active: { bg: 'var(--purple-dim)', border: 'var(--purple)', color: 'var(--purple)' } },
  { key: 'zones',    label: 'ZONES',    active: { bg: 'var(--gold-dim)', border: 'var(--gold)', color: 'var(--gold)' } },
  { key: 'heat',     label: 'HEAT',     active: { bg: 'var(--cyber-dim)', border: 'var(--cyber)', color: 'var(--cyber)' } },
  { key: 'relationships', label: 'RELATIONS', active: { bg: 'var(--gold-dim)', border: 'var(--gold)', color: 'var(--gold)' } },
  { key: 'disinfo',  label: 'DISINFO',  active: { bg: 'var(--purple-dim)', border: 'var(--purple)', color: 'var(--purple)' } },
  { key: 'maritime', label: 'MARITIME', active: { bg: 'var(--blue-dim)', border: 'var(--blue)', color: 'var(--blue-l)' } },
  { key: 'labels',   label: 'LABELS',   active: { bg: 'var(--teal-dim)', border: 'var(--teal)', color: 'var(--teal)' } },
];

const DEFAULT_VISIBILITY: LayerVisibility = {
  strikes: true, missiles: true, targets: true, assets: true, flights: false, zones: true, heat: true, disinfo: true, relationships: true, maritime: true, labels: true,
};

export function IntelMap() {
  const { data: mapData } = useMapData();
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);
  const [layersOpen, setLayersOpen] = useState(false);
  const [isSatStyle, setIsSatStyle] = useState(true);
  const [is3dPitch, setIs3dPitch] = useState(true);
  const activeLayerCount = BUTTON_CONFIG.filter(c => visibility[c.key]).length;
  const { data: disinfoData } = useLiveDisinformation('MA', visibility.disinfo);

  
  // MapLibre map instance for 3D controls
  const mapRef = useRef<MapRef>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Flight tracking state
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [flightTrails, setFlightTrails] = useState(new globalThis.Map<string, [number, number][]>());
  const MAX_TRAIL_LENGTH = 50; // Keep last 50 positions
  
  // Redux: Listen to event selection
  const dispatch = useDispatch();
  const eventSelection = useSelector((state: RootState) => state.eventSelection);

  const toggleLayer = (key: keyof LayerVisibility) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  // Get map instance when it loads
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapInstance(map);
      
      map.on('load', () => {
        setIsMapLoaded(true);
      });
    }
  }, []);

  // Animation loop for maritime lanes dashed offset
  const [time, setTime] = useState(0);
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;
      
      // Update time (speed multiplier)
      setTime(t => (t + dt * 0.02) % 100);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Use flights from mapData.assets (already includes flights from map/data endpoint)
  // This is more reliable than separate useLiveFlights() which can timeout in production
  const flights = useMemo(() => {
    if (!mapData?.assets) {
      return [];
    }
    
    // Filter only aircraft assets (flights)
    const flightAssets = mapData.assets.filter(asset => {
      const isAircraft = asset.type === 'AIRCRAFT';
      const hasPosition = asset.position && asset.position.length === 2;
      
      return isAircraft && hasPosition;
    });
    
    return flightAssets;
  }, [mapData]);
  
  // Update flight trails when positions change
  useEffect(() => {
    if (flights.length === 0) return;
    
    setFlightTrails(prev => {
      const updated = new globalThis.Map(prev);
      
      flights.forEach(flight => {
        const trail = updated.get(flight.id) || [];
        const lastPos = trail[trail.length - 1];
        
        const posChanged = !lastPos || 
          Math.abs(lastPos[0] - flight.position[0]) > 0.001 ||
          Math.abs(lastPos[1] - flight.position[1]) > 0.001;
        
        if (posChanged) {
          const newTrail = [...trail, flight.position].slice(-MAX_TRAIL_LENGTH);
          updated.set(flight.id, newTrail);
        }
      });
      
      const currentFlightIds = new Set(flights.map(f => f.id));
      Array.from(updated.keys()).forEach((id: string) => {
        if (!currentFlightIds.has(id)) {
          updated.delete(id);
        }
      });
      
      return updated;
    });
  }, [flights, MAX_TRAIL_LENGTH]);
  
  // Listen for track-flight events from LiveFlightsWidget
  useEffect(() => {
    const handleTrackFlight = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { icao24 } = customEvent.detail;
      
      if (icao24) {
        setSelectedFlightId(icao24);
        
        // Fly to the selected flight
        const flight = flights.find(f => f.id === icao24);
        if (flight) {
          setViewState(prev => ({
            ...prev,
            longitude: flight.position[0],
            latitude: flight.position[1],
            zoom: Math.max(prev.zoom ?? 4.5, 8),
            transitionDuration: 1000,
          }));
        }
      }
    };
    
    window.addEventListener('track-flight', handleTrackFlight);
    return () => window.removeEventListener('track-flight', handleTrackFlight);
  }, [flights]);
  
  // Get selected flight data
  const selectedFlight = useMemo(() => {
    if (!selectedFlightId) return null;
    return flights.find(f => f.id === selectedFlightId) || null;
  }, [selectedFlightId, flights]);
  
  const layers = useMapLayers(visibility, mapData, flights, time, selectedFlightId, flightTrails,
    disinfoData ? { edges: disinfoData.edges, nodes: disinfoData.nodes } : null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, object: any, html: string } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHover = useCallback((info: PickingInfo) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    if (info.object) {
      const tooltip = getMapTooltip(info as PickingInfo<TooltipObject>);
      if (tooltip && tooltip.html) {
        setHoverInfo({ x: info.x, y: info.y, object: info.object, html: tooltip.html });
      } else {
        setHoverInfo(null);
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverInfo(null);
      }, 500);
    }
  }, []);
  
  // Handle click on map objects (especially flights)
  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object && info.layer?.id === 'flights-icons') {
      const flight = info.object as Asset;
      
      // Toggle selection
      if (selectedFlightId === flight.id) {
        setSelectedFlightId(null);
      } else {
        setSelectedFlightId(flight.id);
        
        // Optionally fly to the selected flight
        setViewState(prev => ({
          ...prev,
          longitude: flight.position[0],
          latitude: flight.position[1],
          zoom: Math.max(prev.zoom ?? 4.5, 8),
          transitionDuration: 1000,
        }));
      }
    } else if (!info.object) {
      // Clicked on empty space - deselect
      if (selectedFlightId) {
        setSelectedFlightId(null);
      }
    }
  }, [selectedFlightId]);
  
  // 🎯 FLY TO LOCATION when event is selected
  useEffect(() => {
    if (eventSelection.selectedLocation && eventSelection.timestamp) {
      const coordinates = getCoordinatesForLocation(eventSelection.selectedLocation);
      
      if (coordinates) {
        setViewState(prev => ({
          ...prev,
          longitude: coordinates.lng,
          latitude: coordinates.lat,
          zoom: coordinates.zoom || 12,
          transitionDuration: 1500,
          transitionInterpolator: undefined, // Use default smooth interpolation
        }));
      }
    }
  }, [eventSelection.selectedLocation, eventSelection.timestamp]);
  
  // Clear selection handler
  const handleClearSelection = () => {
    dispatch(clearSelection());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)' }}>
      {/* Title Bar */}
      <div style={{ height: 36, background: 'var(--bg-app)', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
        <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 'var(--text-body-sm)', fontFamily: 'monospace' }}>◈ INTEL MAP</span>
        <span style={{ color: 'var(--t3)', fontSize: 'var(--text-caption)', fontFamily: 'monospace', marginLeft: 4 }}>OPERATION EPIC FURY</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', marginLeft: 4 }} />
        <span style={{ color: 'var(--success)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>LIVE</span>

        {/* Quick City Locator HUD */}
        <div className="flex items-center gap-1.5 ml-3 overflow-x-auto hide-scrollbar max-w-[420px]">
          <span className="text-[9px] text-[var(--t3)] font-mono font-bold tracking-wider mr-0.5">LOCATE:</span>
          {[
            { name: 'RABAT', lat: 33.9716, lng: -6.8498 },
            { name: 'CASA', lat: 33.5731, lng: -7.5898 },
            { name: 'TANGER', lat: 35.7595, lng: -5.8134 },
            { name: 'KECH', lat: 31.6295, lng: -7.9811 },
            { name: 'AGADIR', lat: 30.4278, lng: -9.5981 },
            { name: 'FES', lat: 34.0181, lng: -5.0003 },
            { name: 'OUJDA', lat: 34.6814, lng: -1.9085 },
            { name: 'LAAYOUNE', lat: 27.1536, lng: -13.1994 },
            { name: 'DAKHLA', lat: 23.7158, lng: -15.9582 },
          ].map(city => (
            <button
              key={city.name}
              onClick={() => {
                setViewState(prev => ({
                  ...prev,
                  longitude: city.lng,
                  latitude: city.lat,
                  zoom: 10.5,
                  transitionDuration: 1200,
                }));
              }}
              className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-2)] hover:bg-[var(--blue-dim)] text-[var(--t2)] hover:text-[var(--blue-l)] border border-[var(--bd)] transition-colors shrink-0"
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Selection Badge */}
        {eventSelection.selectedEventId && (
          <Badge 
            variant="outline" 
            className="ml-2 text-[8px] bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse"
          >
            <Target className="w-2.5 h-2.5 mr-1" />
            EVENT SELECTED
          </Badge>
        )}
        {eventSelection.selectedLocation && !eventSelection.selectedEventId && (
          <Badge 
            variant="outline" 
            className="ml-2 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse"
          >
            <MapPin className="w-2.5 h-2.5 mr-1" />
            {eventSelection.selectedLocation}
          </Badge>
        )}

        {/* Toggle buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center', position: 'relative' }}>
          {/* Map Config Toggles */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSatStyle(s => !s)}
            className="h-auto px-1.5 py-0.5 rounded-sm text-[length:var(--text-tiny)] font-bold mono border border-[var(--bd)] bg-[var(--bg-1)] text-[var(--t2)] hover:bg-[var(--bg-2)]"
            title="Toggle Satellite vs Dark Map style"
          >
            {isSatStyle ? '🛰 SAT' : '🗺 DARK'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIs3dPitch(p => {
                const next = !p;
                setViewState(prev => ({ ...prev, pitch: next ? 45 : 0, transitionDuration: 800 }));
                return next;
              });
            }}
            className={`h-auto px-1.5 py-0.5 rounded-sm text-[length:var(--text-tiny)] font-bold mono border ${
              is3dPitch ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue-l)]' : 'border-[var(--bd)] bg-[var(--bg-1)] text-[var(--t3)]'
            }`}
            title="Toggle 3D Pitch camera tilt"
          >
            📐 3D {is3dPitch ? 'ON' : 'OFF'}
          </Button>

          {/* Clear Selection Button */}
          {(eventSelection.selectedEventId || eventSelection.selectedLocation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-auto px-1.5 py-0.5 rounded-sm text-[length:var(--text-tiny)] font-bold mono"
              style={{
                border: '1px solid var(--blue)',
                background: 'var(--blue-dim)',
                color: 'var(--blue-l)',
              }}
            >
              CLEAR
            </Button>
          )}

          {/* Collapsible LAYERS dropdown */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayersOpen(o => !o)}
              className="h-auto px-2 py-0.5 rounded-sm text-[length:var(--text-tiny)] font-bold mono"
              style={{
                border: `1px solid ${layersOpen ? 'var(--blue)' : 'var(--bd)'}`,
                background: layersOpen ? 'var(--blue-dim)' : 'var(--bg-1)',
                color: layersOpen ? 'var(--blue-l)' : 'var(--t2)',
              }}
            >
              LAYERS {layersOpen ? '▴' : '▾'}
              <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--t4)' }}>
                {activeLayerCount}/{BUTTON_CONFIG.length}
              </span>
            </Button>

            {layersOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  minWidth: 200,
                  padding: 6,
                  background: 'var(--bg-app)',
                  border: '1px solid var(--bd)',
                  borderRadius: 3,
                  zIndex: 120,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {BUTTON_CONFIG.map(({ key, label, active }) => {
                  const on = visibility[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleLayer(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        textAlign: 'left',
                        padding: '5px 8px',
                        background: on ? active.bg : 'transparent',
                        border: `1px solid ${on ? active.border : 'var(--bd)'}`,
                        borderRadius: 2,
                        color: on ? active.color : 'var(--t3)',
                        fontFamily: 'monospace',
                        fontSize: 'var(--text-label)',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: on ? active.border : 'var(--bd-s)',
                          boxShadow: on ? `0 0 6px ${active.border}` : 'none',
                          flexShrink: 0,
                        }}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => {
            const nextViewState = vs as MapViewState;
            const zoom = nextViewState.zoom ?? 0;
            setViewState({
              ...nextViewState,
              // Gradually increase pitch at higher zoom if 3D pitch mode is active.
              pitch: is3dPitch ? (zoom >= 9 ? Math.min(60, 28 + (zoom - 9) * 5) : (nextViewState.pitch ?? 0)) : 0,
            });
          }}
          controller={true}
          layers={layers}
          onHover={handleHover}
          onClick={handleClick}
          style={{ width: '100%', height: '100%' }}
        >
          <MapGL 
            ref={mapRef}
            mapStyle={isSatStyle ? MAP_STYLE_SAT : MAP_STYLE_DARK} 
          />
        </DeckGL>


        {/* 3D View Controls */}
        <Map3DControls map={mapInstance} isLoaded={isMapLoaded} />

        {hoverInfo && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(hoverInfo.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 320),
              top: Math.min(hoverInfo.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 48),
              zIndex: 100,
              pointerEvents: 'auto',
              transform: 'translate(12px, 12px)',
              maxWidth: 300,
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => setHoverInfo(null), 500);
            }}
            dangerouslySetInnerHTML={{ __html: hoverInfo.html }}
          />
        )}
        
        {/* Selected Flight Info Card */}
        {selectedFlight && (
          <div
            style={{
              position: 'absolute',
              top: 60,
              left: 12,
              zIndex: 110,
              background: 'rgba(28, 33, 39, 0.95)',
              border: '2px solid var(--purple)',
              borderRadius: 4,
              padding: 12,
              minWidth: 280,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--purple)', fontWeight: 700, fontSize: 'var(--text-body-sm)', fontFamily: 'monospace' }}>
                ✈ TRACKING FLIGHT
              </span>
              <button
                onClick={() => setSelectedFlightId(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--t3)',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>Callsign:</span>
                <span style={{ color: 'var(--t1)', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginLeft: 8, fontFamily: 'monospace' }}>
                  {selectedFlight.name}
                </span>
              </div>
              
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>ICAO24:</span>
                <span style={{ color: 'var(--t2)', fontSize: 'var(--text-caption)', marginLeft: 8, fontFamily: 'monospace' }}>
                  {selectedFlight.id}
                </span>
              </div>
              
              {selectedFlight.heading !== undefined && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>Heading:</span>
                  <span style={{ color: 'var(--t2)', fontSize: 'var(--text-caption)', marginLeft: 8, fontFamily: 'monospace' }}>
                    {Math.round(selectedFlight.heading)}°
                  </span>
                </div>
              )}
              
              {selectedFlight.velocity !== undefined && selectedFlight.velocity !== null && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>Speed:</span>
                  <span style={{ color: 'var(--t2)', fontSize: 'var(--text-caption)', marginLeft: 8, fontFamily: 'monospace' }}>
                    {Math.round(selectedFlight.velocity * 3.6)} km/h ({Math.round(selectedFlight.velocity * 1.944)} kts)
                  </span>
                </div>
              )}
              
              {selectedFlight.altitude !== undefined && selectedFlight.altitude !== null && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>Altitude:</span>
                  <span style={{ color: 'var(--t2)', fontSize: 'var(--text-caption)', marginLeft: 8, fontFamily: 'monospace' }}>
                    {Math.round(selectedFlight.altitude)} m ({Math.round(selectedFlight.altitude * 3.281).toLocaleString()} ft)
                  </span>
                </div>
              )}
              
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>Position:</span>
                <span style={{ color: 'var(--t2)', fontSize: 'var(--text-caption)', marginLeft: 8, fontFamily: 'monospace' }}>
                  {selectedFlight.position[1].toFixed(4)}°N, {selectedFlight.position[0].toFixed(4)}°E
                </span>
              </div>
              
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bd)' }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: 'var(--purple)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>
                    Trail: {flightTrails.get(selectedFlight.id)?.length || 0} points
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>
                    Route: Projected 200km ahead →
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <IntelMapLegend />

        {/* Coords */}
        <div style={{ position: 'absolute', bottom: 52, right: 12, background: 'rgba(28,33,39,0.85)', border: '1px solid var(--bd)', padding: '4px 8px', fontSize: 'var(--text-caption)', fontFamily: 'monospace', color: 'var(--t4)', pointerEvents: 'none' }}>
          {viewState.latitude.toFixed(2)}°N {viewState.longitude.toFixed(2)}°E · ZOOM {viewState.zoom?.toFixed(1) ?? '—'} · PITCH {viewState.pitch?.toFixed(0) ?? '0'}°
        </div>

        <OpenMapButton />
      </div>
    </div>
  );
}

function OpenMapButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/dashboard/map"
      style={{
        position: 'absolute', bottom: 16, right: 12,
        background: hovered ? 'var(--blue)' : 'var(--blue)',
        color: 'white', padding: '8px 16px', fontSize: 'var(--text-body-sm)', fontWeight: 700,
        fontFamily: 'monospace', border: 'none', borderRadius: 2,
        cursor: 'pointer', letterSpacing: '0.08em', textDecoration: 'none',
        display: 'inline-block', transition: 'background 0.15s ease', zIndex: 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ⤢&nbsp;&nbsp;OPEN FULL MAP
    </Link>
  );
}
