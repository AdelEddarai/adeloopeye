'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Link from 'next/link';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl/maplibre';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, MapPin } from 'lucide-react';

import { useMapData } from '@/features/map/queries';
import { useLiveFlights } from '@/shared/hooks/use-live-flights';
import type { Asset } from '@/data/map-data';

import { type LayerVisibility, type TooltipObject, useMapLayers } from './intel-map-layers';
import { getMapTooltip } from './intel-map-tooltip';
import { IntelMapLegend } from './IntelMapLegend';

import { getCoordinatesForLocation } from '@/shared/lib/location-coordinates';
import { clearSelection } from '@/shared/state/event-selection-slice';
import type { RootState } from '@/shared/state';
import { MAP_STYLE_SAT } from '@/features/map/components/map-styles';

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
];

const DEFAULT_VISIBILITY: LayerVisibility = {
  strikes: true, missiles: true, targets: true, assets: true, flights: true, zones: true, heat: true,
};

export function IntelMap() {
  const { data: mapData } = useMapData();
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);
  
  // Flight tracking state
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [flightTrails, setFlightTrails] = useState(new globalThis.Map<string, [number, number][]>());
  const MAX_TRAIL_LENGTH = 50; // Keep last 50 positions
  
  // Redux: Listen to event selection
  const dispatch = useDispatch();
  const eventSelection = useSelector((state: RootState) => state.eventSelection);

  const toggleLayer = (key: keyof LayerVisibility) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

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

  // Use live flights API with Middle East bounding box
  const bbox: [number, number, number, number] = [24, 32, 42, 63];
  const { data: liveFlightsData } = useLiveFlights(bbox);
  
  // Transform live flights to Asset format for map layers
  const flights = useMemo(() => {
    console.log('[IntelMap] Raw flight data:', liveFlightsData);
    
    if (!liveFlightsData?.flights) {
      console.warn('[IntelMap] No flight data available');
      return [];
    }
    
    console.log(`[IntelMap] Processing ${liveFlightsData.flights.length} flights`);
    
    const transformed = liveFlightsData.flights
      .filter(flight => {
        const hasPosition = flight.latitude !== null && flight.longitude !== null;
        if (!hasPosition) {
          console.log('[IntelMap] Skipping flight without position:', flight.icao24);
        }
        return hasPosition;
      })
      .map(flight => ({
        id: flight.icao24,
        name: flight.callsign?.trim() || flight.icao24,
        type: 'AIRCRAFT' as const,
        actor: flight.origin_country.toLowerCase().includes('united states') ? 'us' : 
               flight.origin_country.toLowerCase().includes('israel') ? 'israel' : 'other',
        position: [flight.longitude!, flight.latitude!] as [number, number],
        heading: flight.true_track || 0,
        velocity: flight.velocity,
        altitude: flight.baro_altitude || flight.geo_altitude,
        status: 'ACTIVE' as const,
        priority: 'P2' as const,
        category: 'INSTALLATION' as const,
      }));
    
    console.log('[IntelMap] Transformed flights:', {
      count: transformed.length,
      samples: transformed.slice(0, 3),
    });
    
    return transformed;
  }, [liveFlightsData]);
  
  // DEBUG: Log flights data
  useEffect(() => {
    console.log('[IntelMap] Flights data updated:', {
      count: flights.length,
      sample: flights[0],
      visibility: visibility.flights,
    });
  }, [flights, visibility.flights]);
  
  // Update flight trails when positions change
  useEffect(() => {
    if (flights.length === 0) return;
    
    setFlightTrails(prev => {
      const updated = new globalThis.Map(prev);
      
      flights.forEach(flight => {
        const trail = updated.get(flight.id) || [];
        const lastPos = trail[trail.length - 1];
        
        // Only add if position changed significantly (avoid duplicates)
        const posChanged = !lastPos || 
          Math.abs(lastPos[0] - flight.position[0]) > 0.001 ||
          Math.abs(lastPos[1] - flight.position[1]) > 0.001;
        
        if (posChanged) {
          const newTrail = [...trail, flight.position].slice(-MAX_TRAIL_LENGTH);
          updated.set(flight.id, newTrail);
        }
      });
      
      // Clean up trails for flights that no longer exist
      const currentFlightIds = new Set(flights.map(f => f.id));
      Array.from(updated.keys()).forEach((id: string) => {
        if (!currentFlightIds.has(id)) {
          updated.delete(id);
        }
      });
      
      return updated;
    });
  }, [flights, MAX_TRAIL_LENGTH]);
  
  // Get selected flight data
  const selectedFlight = useMemo(() => {
    if (!selectedFlightId) return null;
    return flights.find(f => f.id === selectedFlightId) || null;
  }, [selectedFlightId, flights]);
  
  const layers = useMapLayers(visibility, mapData, flights, time, selectedFlightId, flightTrails);
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
      }, 250);
    }
  }, []);
  
  // Handle click on map objects (especially flights)
  const handleClick = useCallback((info: PickingInfo) => {
    console.log('[IntelMap] Click detected:', info);
    
    if (info.object && info.layer?.id === 'flights-icons') {
      const flight = info.object as Asset;
      console.log('[IntelMap] Flight clicked:', flight);
      
      // Toggle selection
      if (selectedFlightId === flight.id) {
        setSelectedFlightId(null);
        console.log('[IntelMap] Deselected flight');
      } else {
        setSelectedFlightId(flight.id);
        console.log('[IntelMap] Selected flight:', flight.id);
        
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
        console.log('[IntelMap] Deselected flight (clicked empty space)');
      }
    }
  }, [selectedFlightId]);
  
  // 🎯 FLY TO LOCATION when event is selected
  useEffect(() => {
    if (eventSelection.selectedLocation && eventSelection.timestamp) {
      const coordinates = getCoordinatesForLocation(eventSelection.selectedLocation);
      
      if (coordinates) {
        console.log('🗺️ Map: Flying to location:', eventSelection.selectedLocation, coordinates);
        
        setViewState(prev => ({
          ...prev,
          longitude: coordinates.lng,
          latitude: coordinates.lat,
          zoom: coordinates.zoom || 12,
          transitionDuration: 1500,
          transitionInterpolator: undefined, // Use default smooth interpolation
        }));
      } else {
        console.warn('⚠️ Map: No coordinates found for location:', eventSelection.selectedLocation);
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
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
          
          {BUTTON_CONFIG.map(({ key, label, active }) => {
            const on = visibility[key];
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => toggleLayer(key)}
                className="h-auto px-1.5 py-0.5 rounded-sm text-[length:var(--text-tiny)] font-bold mono"
                style={{
                  border: `1px solid ${on ? active.border : 'var(--bd)'}`,
                  background: on ? active.bg : 'var(--bg-1)',
                  color: on ? active.color : 'var(--t4)',
                }}
              >
                {label}
              </Button>
            );
          })}
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
              // Gradually increase pitch at higher zoom for a more realistic earth feel.
              pitch: zoom >= 9 ? Math.min(60, 28 + (zoom - 9) * 5) : 0,
            });
          }}
          controller={true}
          layers={layers}
          onHover={handleHover}
          onClick={handleClick}
          style={{ width: '100%', height: '100%' }}
        >
          <MapGL mapStyle={MAP_STYLE_SAT} />
        </DeckGL>

        {hoverInfo && (
          <div
            style={{
              position: 'absolute',
              left: hoverInfo.x,
              top: hoverInfo.y,
              zIndex: 100,
              pointerEvents: 'auto',
              transform: 'translate(12px, 12px)',
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => setHoverInfo(null), 250);
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
                    {Math.round(selectedFlight.velocity * 3.6)} km/h
                  </span>
                </div>
              )}
              
              {selectedFlight.altitude !== undefined && selectedFlight.altitude !== null && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: 'var(--t4)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>Altitude:</span>
                  <span style={{ color: 'var(--t2)', fontSize: 'var(--text-caption)', marginLeft: 8, fontFamily: 'monospace' }}>
                    {Math.round(selectedFlight.altitude)} m
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
                <span style={{ color: 'var(--purple)', fontSize: 'var(--text-caption)', fontFamily: 'monospace' }}>
                  Trail: {flightTrails.get(selectedFlight.id)?.length || 0} points
                </span>
              </div>
            </div>
          </div>
        )}

        <IntelMapLegend />

        {/* Coords */}
        <div style={{ position: 'absolute', bottom: 52, right: 12, background: 'rgba(28,33,39,0.85)', border: '1px solid var(--bd)', padding: '4px 8px', fontSize: 'var(--text-caption)', fontFamily: 'monospace', color: 'var(--t4)', pointerEvents: 'none' }}>
          {viewState.latitude.toFixed(2)}°N {viewState.longitude.toFixed(2)}°E
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
