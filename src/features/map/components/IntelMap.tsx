'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import Link from 'next/link';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, MapPin } from 'lucide-react';

import { useMapData } from '@/features/map/queries';

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
  { key: 'zones',    label: 'ZONES',    active: { bg: 'var(--gold-dim)', border: 'var(--gold)', color: 'var(--gold)' } },
  { key: 'heat',     label: 'HEAT',     active: { bg: 'var(--cyber-dim)', border: 'var(--cyber)', color: 'var(--cyber)' } },
];

const DEFAULT_VISIBILITY: LayerVisibility = {
  strikes: true, missiles: true, targets: true, assets: true, zones: true, heat: true,
};

export function IntelMap() {
  const { data: mapData } = useMapData();
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);
  
  // Redux: Listen to event selection
  const dispatch = useDispatch();
  const eventSelection = useSelector((state: RootState) => state.eventSelection);

  const toggleLayer = (key: keyof LayerVisibility) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const layers = useMapLayers(visibility, mapData);
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
          style={{ width: '100%', height: '100%' }}
        >
          <Map mapStyle={MAP_STYLE_SAT} />
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
