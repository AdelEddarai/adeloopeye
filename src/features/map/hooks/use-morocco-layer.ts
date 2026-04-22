/**
 * Morocco Intelligence Visualization Layer
 * Comprehensive visualization of all Morocco-related intelligence
 */

import { useMemo } from 'react';

import { ArcLayer, IconLayer, PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';

import type { 
  MoroccoEvent, 
  MoroccoConnection, 
  MoroccoInfrastructure 
} from '@/server/lib/morocco-intelligence-analyzer';
import type {
  MoroccoWeather,
  MoroccoTraffic,
  MoroccoCommodity,
  MoroccoFire
} from '@/server/lib/api-clients/morocco-local-data';
import type { MoroccoRoute } from '@/server/lib/api-clients/morocco-routes-client';

type RGBA = [number, number, number, number];

type Props = {
  events: MoroccoEvent[];
  connections: MoroccoConnection[];
  infrastructure: MoroccoInfrastructure[];
  weather: MoroccoWeather[];
  traffic: MoroccoTraffic[];
  commodities: MoroccoCommodity[];
  fires: MoroccoFire[];
  routes: MoroccoRoute[];
  isSatellite: boolean;
  isMobile?: boolean;
  pulseTime: number; // For animations
  zoom: number; // Current zoom level for responsive sizing
  selectedEventId?: string | null;
};

/**
 * Offset overlapping events in the same location
 * Creates a spiral pattern for better visibility with many events
 */
function offsetOverlappingEvents(events: MoroccoEvent[]): (MoroccoEvent & { offsetPosition: [number, number] })[] {
  // Group events by location (more precise grouping)
  const eventsByLocation = new Map<string, MoroccoEvent[]>();
  
  events.forEach(event => {
    const key = `${event.position[0].toFixed(2)},${event.position[1].toFixed(2)}`;
    if (!eventsByLocation.has(key)) {
      eventsByLocation.set(key, []);
    }
    eventsByLocation.get(key)!.push(event);
  });
  
  // Offset events in same location
  const offsetEvents: (MoroccoEvent & { offsetPosition: [number, number] })[] = [];
  
  eventsByLocation.forEach((locationEvents, key) => {
    if (locationEvents.length === 1) {
      // Single event - no offset needed
      offsetEvents.push({
        ...locationEvents[0],
        offsetPosition: locationEvents[0].position,
      });
    } else if (locationEvents.length <= 8) {
      // Few events - circular pattern with larger radius
      const radius = 0.02; // Increased from 0.15 to 0.02 degrees (about 2km)
      const angleStep = (2 * Math.PI) / locationEvents.length;
      
      locationEvents.forEach((event, index) => {
        const angle = index * angleStep;
        const offsetLng = event.position[0] + Math.cos(angle) * radius;
        const offsetLat = event.position[1] + Math.sin(angle) * radius;
        
        offsetEvents.push({
          ...event,
          offsetPosition: [offsetLng, offsetLat],
        });
      });
    } else {
      // Many events - spiral pattern for better distribution
      locationEvents.forEach((event, index) => {
        const spiralTurns = Math.ceil(locationEvents.length / 8);
        const angle = (index / locationEvents.length) * spiralTurns * 2 * Math.PI;
        const radius = 0.01 + (index / locationEvents.length) * 0.03; // 1-4km radius
        
        const offsetLng = event.position[0] + Math.cos(angle) * radius;
        const offsetLat = event.position[1] + Math.sin(angle) * radius;
        
        offsetEvents.push({
          ...event,
          offsetPosition: [offsetLng, offsetLat],
        });
      });
    }
  });
  
  return offsetEvents;
}

/**
 * Get color for event type
 */
function getEventColor(type: string, severity: string): RGBA {
  // Severity-based alpha
  const alpha = severity === 'CRITICAL' ? 255 : severity === 'HIGH' ? 220 : severity === 'MEDIUM' ? 180 : 140;
  
  switch (type) {
    case 'POLITICAL':
      return [100, 150, 255, alpha]; // Blue
    case 'DIPLOMATIC':
      return [150, 100, 255, alpha]; // Purple
    case 'ECONOMIC':
      return [0, 200, 150, alpha]; // Teal
    case 'INFRASTRUCTURE':
      return [255, 180, 0, alpha]; // Orange
    case 'WEATHER':
      return [100, 200, 255, alpha]; // Light blue
    case 'FIRE':
      return [255, 80, 0, alpha]; // Red-orange
    case 'PROTEST':
      return [255, 150, 0, alpha]; // Orange
    case 'ACCIDENT':
      return [255, 50, 50, alpha]; // Red
    case 'INVESTMENT':
      return [0, 255, 150, alpha]; // Green
    case 'TRADE':
      return [0, 180, 200, alpha]; // Cyan
    case 'TOURISM':
      return [255, 100, 200, alpha]; // Pink
    case 'AGRICULTURE':
      return [150, 200, 50, alpha]; // Yellow-green
    case 'ENERGY':
      return [255, 200, 0, alpha]; // Gold
    case 'SECURITY':
      return [200, 50, 50, alpha]; // Dark red
    case 'TRANSPORT':
      return [150, 150, 255, alpha]; // Light purple
    default:
      return [150, 150, 150, alpha]; // Gray
  }
}

/**
 * Get icon for event type
 */
function getEventIcon(type: string): string {
  switch (type) {
    case 'POLITICAL': return '🏛️';
    case 'DIPLOMATIC': return '🤝';
    case 'ECONOMIC': return '💼';
    case 'INFRASTRUCTURE': return '🏗️';
    case 'WEATHER': return '🌤️';
    case 'FIRE': return '🔥';
    case 'PROTEST': return '📢';
    case 'ACCIDENT': return '⚠️';
    case 'INVESTMENT': return '💰';
    case 'TRADE': return '🚢';
    case 'TOURISM': return '✈️';
    case 'AGRICULTURE': return '🌾';
    case 'ENERGY': return '⚡';
    case 'SECURITY': return '🛡️';
    case 'TRANSPORT': return '🚗';
    default: return '📍';
  }
}

/**
 * Get icon for infrastructure type
 */
function getInfrastructureIcon(type: string): string {
  switch (type) {
    case 'PORT': return '⚓';
    case 'AIRPORT': return '✈️';
    case 'ROAD': return '🛣️';
    case 'RAILWAY': return '🚂';
    case 'POWER_PLANT': return '⚡';
    case 'MINE': return '⛏️';
    case 'FACTORY': return '🏭';
    default: return '🏢';
  }
}

/**
 * Get color for infrastructure status
 */
function getInfrastructureColor(status: string): RGBA {
  switch (status) {
    case 'OPERATIONAL':
      return [0, 255, 100, 255]; // Green
    case 'DISRUPTED':
      return [255, 180, 0, 255]; // Orange
    case 'CLOSED':
      return [255, 50, 50, 255]; // Red
    case 'UNDER_CONSTRUCTION':
      return [100, 150, 255, 255]; // Blue
    default:
      return [150, 150, 150, 255]; // Gray
  }
}

/**
 * Get color for connection type
 */
function getConnectionColor(type: string, isSource: boolean): RGBA {
  const alpha = isSource ? 255 : 200;
  
  switch (type) {
    case 'TRADE_ROUTE':
      return isSource ? [0, 180, 255, alpha] : [100, 220, 255, alpha];
    case 'DIPLOMATIC':
      return isSource ? [150, 100, 255, alpha] : [200, 150, 255, alpha];
    case 'TRANSPORT':
      return isSource ? [255, 180, 0, alpha] : [255, 220, 100, alpha];
    case 'ENERGY':
      return isSource ? [255, 200, 0, alpha] : [255, 230, 100, alpha];
    case 'MIGRATION':
      return isSource ? [100, 200, 150, alpha] : [150, 230, 180, alpha];
    default:
      return isSource ? [150, 150, 150, alpha] : [200, 200, 200, alpha];
  }
}

function stablePhase(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 360) * (Math.PI / 180);
}

/** Smooth 0..1 easing for workflow-style pulses (replaces linear sin ramps). */
function easeInOutSine01(u: number): number {
  const x = Math.min(1, Math.max(0, u));
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

export function useMoroccoLayer({
  events,
  connections,
  infrastructure,
  weather = [],
  traffic = [],
  commodities = [],
  fires = [],
  routes = [],
  isSatellite,
  isMobile = false,
  pulseTime,
  zoom,
  selectedEventId = null,
}: Props): Layer[] {
  return useMemo(() => {
    const layers: Layer[] = [];
    
    // Safe logging with fallback for undefined arrays
    console.log('[Morocco Layer] Rendering:', 
      events?.length ?? 0, 'events,', 
      connections?.length ?? 0, 'connections,', 
      infrastructure?.length ?? 0, 'infrastructure,', 
      weather?.length ?? 0, 'weather,', 
      traffic?.length ?? 0, 'traffic,', 
      fires?.length ?? 0, 'fires,',
      routes?.length ?? 0, 'routes', 
      'zoom:', zoom);
    
    // Offset overlapping events for better UX
    const offsetEvents = offsetOverlappingEvents(events || []);
    
    // Calculate zoom-based scale factor for better visibility
    // Keep dots visible at all zoom levels
    // At zoom 6 (Morocco view): scale = 1.0 (full size)
    // At zoom 10 (city view): scale = 0.7 (70% size) - was 0.4, now larger
    // At zoom 14 (street view): scale = 0.5 (50% size) - was 0.25, now larger
    const zoomScale = Math.max(0.5, Math.min(1, (12 - zoom) / 6 + 0.7));
    
    // ═══════════════════════════════════════════════════════════
    // EVENT MARKERS - Pulsing circles for events (zoom-responsive)
    // ═══════════════════════════════════════════════════════════
    if (offsetEvents.length > 0) {
      // 1. Modern Radar Ripple Layer (Bottom layer for pulse effect)
      const eventRippleLayer = new ScatterplotLayer<typeof offsetEvents[0]>({
        id: 'morocco-events-ripple',
        data: offsetEvents,
        getPosition: (d): [number, number] => d.offsetPosition,
        getRadius: (d): number => {
          const isSelected = selectedEventId === d.id;
          const baseRadius = d.severity === 'CRITICAL' ? 6000 : 
                           d.severity === 'HIGH' ? 4000 : 2500;
          
          if (isSelected || d.status === 'ONGOING' || d.severity === 'CRITICAL') {
            const pulsePhase = (pulseTime * (d.severity === 'CRITICAL' ? 1.5 : 1.0)) % 1;
            const selectedBoost = isSelected ? 1.4 : 1;
            return baseRadius * selectedBoost * pulsePhase * zoomScale;
          }
          return 0; 
        },
        getFillColor: (d): RGBA => {
          const color = getEventColor(d.type, d.severity);
          const isSelected = selectedEventId === d.id;
          if (isSelected || d.status === 'ONGOING' || d.severity === 'CRITICAL') {
            const pulsePhase = (pulseTime * (d.severity === 'CRITICAL' ? 1.5 : 1.0)) % 1;
            // Fade out exponentially for radar fading trail
            const alphaBase = isSelected ? 255 : 200;
            const alpha = Math.max(0, Math.floor(alphaBase * Math.pow(1 - pulsePhase, 2)));
            return [color[0], color[1], color[2], alpha];
          }
          return [0, 0, 0, 0];
        },
        stroked: true,
        getLineColor: (d): RGBA => {
          const color = getEventColor(d.type, d.severity);
          if (d.status === 'ONGOING' || d.severity === 'CRITICAL') {
            const pulsePhase = (pulseTime * (d.severity === 'CRITICAL' ? 1.5 : 1.0)) % 1;
            const alpha = Math.max(0, Math.floor(255 * (1 - pulsePhase)));
            return [color[0], color[1], color[2], alpha];
          }
          return [0, 0, 0, 0];
        },
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 3,
        pickable: false,
        radiusMinPixels: 0,
        radiusMaxPixels: 45,
        updateTriggers: {
          getRadius: [pulseTime, zoom],
          getFillColor: [pulseTime],
          getLineColor: [pulseTime],
        },
      });

      // 2. Modern Radar Core Layer (Top layer for sharp focal point)
      const eventCoreLayer = new ScatterplotLayer<typeof offsetEvents[0]>({
        id: 'morocco-events-core',
        data: offsetEvents,
        getPosition: (d): [number, number] => d.offsetPosition,
        getRadius: (d): number => {
          const isSelected = selectedEventId === d.id;
          const baseRadius = d.severity === 'CRITICAL' ? 800 : 
                           d.severity === 'HIGH' ? 600 : 400;
          return baseRadius * (isSelected ? 1.8 : 1) * zoomScale;
        },
        getFillColor: (d): RGBA => getEventColor(d.type, d.severity),
        stroked: false,
        pickable: true,
        autoHighlight: true,
        radiusUnits: 'meters',
        radiusMinPixels: 2,
        radiusMaxPixels: 6,
        updateTriggers: {
          getRadius: [zoom],
          getFillColor: [pulseTime],
        },
      });
      
      layers.push(eventRippleLayer, eventCoreLayer);
    }
    
    // ═══════════════════════════════════════════════════════════
    // EVENT ICONS - Type-specific icons
    // ═══════════════════════════════════════════════════════════
    if (offsetEvents.length > 0) {
      // Create SVG atlas with all event icons
      const iconAtlas = createEventIconAtlas();
      
      const eventIconLayer = new IconLayer<typeof offsetEvents[0]>({
        id: 'morocco-event-icons',
        data: offsetEvents,
        getPosition: (d): [number, number] => d.offsetPosition,
        getIcon: (d) => d.type.toLowerCase(),
        getSize: (d): number => {
          // Smaller and tighter icons to preserve density at high events
          return d.severity === 'CRITICAL' ? 24 : d.severity === 'HIGH' ? 20 : 16;
        },
        getColor: (d): RGBA => getEventColor(d.type, d.severity),
        iconAtlas,
        iconMapping: createEventIconMapping(),
        pickable: true,
        autoHighlight: true,
      });
      
      layers.push(eventIconLayer);
    }
    
    // ═══════════════════════════════════════════════════════════
    // EVENT LABELS - City and event type
    // ═══════════════════════════════════════════════════════════
    if (!isMobile && offsetEvents.length > 0) {
      const eventLabelLayer = new TextLayer<typeof offsetEvents[0]>({
        id: 'morocco-event-labels',
        data: offsetEvents,
        getPosition: (d): [number, number] => d.offsetPosition,
        getText: (d): string => `${getEventIcon(d.type)} ${d.location}`,
        getSize: 11,
        getColor: (d): RGBA => {
          const [r, g, b] = getEventColor(d.type, d.severity);
          return [r + 40, g + 40, b + 40, 255];
        },
        getPixelOffset: [0, -35],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        fontWeight: 700,
        background: true,
        getBackgroundColor: isSatellite ? [10, 14, 22, 230] : [28, 33, 39, 200],
        backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
        pickable: true,
      });
      
      layers.push(eventLabelLayer);
    }
    
    // ═══════════════════════════════════════════════════════════
    // INFRASTRUCTURE MARKERS
    // ═══════════════════════════════════════════════════════════
    if (infrastructure.length > 0) {
      const infraLayer = new ScatterplotLayer<MoroccoInfrastructure>({
        id: 'morocco-infrastructure',
        data: infrastructure,
        getPosition: (d: MoroccoInfrastructure): [number, number] => d.position,
        getRadius: 15000,
        getFillColor: (d: MoroccoInfrastructure): RGBA => {
          const color = getInfrastructureColor(d.status);
          
          // Pulsing for disrupted/closed
          if (d.status === 'DISRUPTED' || d.status === 'CLOSED') {
            const pulse = Math.sin(pulseTime * 3) * 0.3 + 0.7;
            return [color[0], color[1], color[2], Math.floor(color[3] * pulse)];
          }
          
          return color;
        },
        stroked: true,
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 1,
        radiusMinPixels: 2,
        radiusMaxPixels: 10,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [pulseTime],
        },
      });
      
      layers.push(infraLayer);
      
      // Infrastructure labels
      if (!isMobile) {
        const infraLabelLayer = new TextLayer<MoroccoInfrastructure>({
          id: 'morocco-infrastructure-labels',
          data: infrastructure,
          getPosition: (d: MoroccoInfrastructure): [number, number] => d.position,
          getText: (d: MoroccoInfrastructure): string => `${getInfrastructureIcon(d.type)} ${d.name}`,
          getSize: 10,
          getColor: (d: MoroccoInfrastructure): RGBA => {
            const [r, g, b] = getInfrastructureColor(d.status);
            return [r, g, b, 255];
          },
          getPixelOffset: [0, -25],
          fontFamily: 'monospace',
          fontWeight: 600,
          background: true,
          getBackgroundColor: isSatellite ? [10, 14, 22, 220] : [28, 33, 39, 180],
          backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
          pickable: true,
        });
        
        layers.push(infraLabelLayer);
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // CONNECTION LINES - Diplomatic, trade, etc.
    // ═══════════════════════════════════════════════════════════
    if (connections.length > 0) {
      // Glow layer (behind)
      const connectionGlowLayer = new ArcLayer<MoroccoConnection>({
        id: 'morocco-connections-glow',
        data: connections,
        getSourcePosition: (d: MoroccoConnection): [number, number] => d.fromPosition,
        getTargetPosition: (d: MoroccoConnection): [number, number] => d.toPosition,
        getSourceColor: (d: MoroccoConnection): RGBA => {
          const [r, g, b] = getConnectionColor(d.type, true);
          return [r, g, b, 60];
        },
        getTargetColor: (d: MoroccoConnection): RGBA => {
          const [r, g, b] = getConnectionColor(d.type, false);
          return [r, g, b, 40];
        },
        getWidth: (d: MoroccoConnection): number => {
          const baseWidth = d.intensity * 0.6;
          return baseWidth * 2.5; // Wide glow
        },
        getHeight: 0.3,
        widthUnits: 'pixels',
        pickable: false,
        greatCircle: true,
      });
      
      layers.push(connectionGlowLayer);
      
      // Main connection layer with animation
      const connectionLayer = new ArcLayer<MoroccoConnection>({
        id: 'morocco-connections',
        data: connections,
        getSourcePosition: (d: MoroccoConnection): [number, number] => d.fromPosition,
        getTargetPosition: (d: MoroccoConnection): [number, number] => d.toPosition,
        getSourceColor: (d: MoroccoConnection): RGBA => {
          const color = getConnectionColor(d.type, true);
          const phase = stablePhase(d.id);
          const flow = 0.72 + 0.28 * easeInOutSine01((Math.sin(pulseTime * 1.8 + phase) + 1) / 2);
          return [color[0], color[1], color[2], Math.floor(color[3] * flow)];
        },
        getTargetColor: (d: MoroccoConnection): RGBA => {
          const color = getConnectionColor(d.type, false);
          const phase = stablePhase(d.id);
          const flow = 0.68 + 0.27 * easeInOutSine01((Math.sin(pulseTime * 1.8 + phase + Math.PI * 0.8) + 1) / 2);
          return [color[0], color[1], color[2], Math.floor(color[3] * flow)];
        },
        getWidth: (d: MoroccoConnection): number => {
          const baseWidth = d.intensity * 0.6;
          const phase = stablePhase(d.id);
          const workflowPulse = 0.9 + 0.14 * easeInOutSine01((Math.sin(pulseTime * 1.6 + phase) + 1) / 2);
          if (d.status === 'DISRUPTED') {
            const disruptionBoost = 1.05 + 0.18 * easeInOutSine01((Math.sin(pulseTime * 2.1 + phase) + 1) / 2);
            return baseWidth * workflowPulse * disruptionBoost;
          }
          return baseWidth * workflowPulse;
        },
        getHeight: 0.3,
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        greatCircle: true,
        updateTriggers: {
          getSourceColor: [pulseTime],
          getTargetColor: [pulseTime],
          getWidth: [pulseTime],
        },
      });
      
      layers.push(connectionLayer);
    }
    
    // ═══════════════════════════════════════════════════════════
    // WEATHER MARKERS - Current weather in major cities
    // ═══════════════════════════════════════════════════════════
    if (weather.length > 0) {
      const weatherAtlas = createWeatherIconAtlas();
      const weatherMapping = createWeatherIconMapping();

      const weatherIconKey = (d: MoroccoWeather): string => {
        const code = String(d.icon || '');
        if (code.startsWith('11')) return 'storm';
        if (code.startsWith('13')) return 'snow';
        if (code.startsWith('09') || code.startsWith('10')) return 'rain';
        if (code.startsWith('50')) return 'fog';
        if (code.startsWith('01')) return 'clear';
        if (code.startsWith('02') || code.startsWith('03') || code.startsWith('04')) return 'cloud';
        return 'cloud';
      };

      const weatherIconLayer = new IconLayer<MoroccoWeather>({
        id: 'morocco-weather-icons',
        data: weather,
        getPosition: (d: MoroccoWeather): [number, number] => d.position,
        getIcon: (d) => weatherIconKey(d),
        getSize: (d) => (d.alert ? 44 : 34),
        getColor: (d): RGBA => {
          if (d.alert?.severity === 'CRITICAL') return [255, 60, 60, 255];
          if (d.alert?.severity === 'HIGH') return [255, 160, 60, 255];
          if (d.alert) return [255, 220, 120, 255];
          return [160, 210, 255, 240];
        },
        iconAtlas: weatherAtlas,
        iconMapping: weatherMapping,
        pickable: true,
        autoHighlight: true,
        sizeUnits: 'pixels',
      });
      layers.push(weatherIconLayer);

      const weatherLayer = new ScatterplotLayer<MoroccoWeather>({
        id: 'morocco-weather',
        data: weather,
        getPosition: (d: MoroccoWeather): [number, number] => d.position,
        getRadius: 12000,
        getFillColor: (d: MoroccoWeather): RGBA => {
          // Color based on temperature
          if (d.temperature > 35) return [255, 100, 0, 200]; // Hot - orange
          if (d.temperature > 25) return [255, 200, 0, 200]; // Warm - yellow
          if (d.temperature > 15) return [100, 200, 255, 200]; // Mild - light blue
          return [100, 150, 255, 200]; // Cool - blue
        },
        stroked: true,
        getLineColor: (d: MoroccoWeather): RGBA => {
          // Alert border if weather alert
          return d.alert ? [255, 50, 50, 255] : [255, 255, 255, 180];
        },
        getLineWidth: (d: MoroccoWeather): number => {
          return d.alert ? 3 : 2;
        },
        lineWidthUnits: 'pixels',
        radiusMinPixels: 2,
        radiusMaxPixels: 8,
        pickable: true,
        autoHighlight: true,
      });
      
      layers.push(weatherLayer);
      
      // Weather labels
      if (!isMobile) {
        const weatherLabelLayer = new TextLayer<MoroccoWeather>({
          id: 'morocco-weather-labels',
          data: weather,
          getPosition: (d: MoroccoWeather): [number, number] => d.position,
          getText: (d: MoroccoWeather): string => `${d.city} ${d.temperature}°C`,
          getSize: 10,
          getColor: (d: MoroccoWeather): RGBA => {
            if (d.alert) return [255, 100, 100, 255];
            return [100, 200, 255, 255];
          },
          getPixelOffset: [0, -20],
          fontFamily: 'monospace',
          fontWeight: 600,
          background: true,
          getBackgroundColor: isSatellite ? [10, 14, 22, 220] : [28, 33, 39, 180],
          backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
          pickable: true,
        });
        
        layers.push(weatherLabelLayer);
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // FIRE MARKERS - Active fires with pulsing effect
    // ═══════════════════════════════════════════════════════════
    if (fires.length > 0) {
      const fireLayer = new ScatterplotLayer<MoroccoFire>({
        id: 'morocco-fires',
        data: fires,
        getPosition: (d: MoroccoFire): [number, number] => d.position,
        getRadius: (d: MoroccoFire): number => {
          const baseRadius = d.severity === 'CRITICAL' ? 25000 : 
                           d.severity === 'HIGH' ? 20000 : 
                           d.severity === 'MEDIUM' ? 15000 : 12000;
          
          // Intense pulsing for active fires
          if (d.status === 'ACTIVE') {
            const pulse = Math.sin(pulseTime * 3) * 0.5 + 1;
            return baseRadius * pulse;
          }
          
          return baseRadius;
        },
        getFillColor: (d: MoroccoFire): RGBA => {
          // Red-orange for fires
          const alpha = d.status === 'ACTIVE' ? 255 : d.status === 'CONTAINED' ? 180 : 120;
          const pulse = d.status === 'ACTIVE' ? Math.sin(pulseTime * 3) * 0.4 + 0.6 : 1;
          return [255, 80, 0, Math.floor(alpha * pulse)];
        },
        stroked: true,
        getLineColor: [255, 200, 0, 255],
        lineWidthMinPixels: 2,
        radiusMinPixels: 3,
        radiusMaxPixels: 14,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getRadius: [pulseTime],
          getFillColor: [pulseTime],
        },
      });
      
      layers.push(fireLayer);
      
      // Fire labels
      if (!isMobile) {
        const fireLabelLayer = new TextLayer<MoroccoFire>({
          id: 'morocco-fire-labels',
          data: fires,
          getPosition: (d: MoroccoFire): [number, number] => d.position,
          getText: (d: MoroccoFire): string => `🔥 ${d.location} Fire`,
          getSize: 11,
          getColor: [255, 100, 50, 255],
          getPixelOffset: [0, -30],
          fontFamily: 'monospace',
          fontWeight: 700,
          background: true,
          getBackgroundColor: isSatellite ? [10, 14, 22, 230] : [28, 33, 39, 200],
          backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
          pickable: true,
        });
        
        layers.push(fireLabelLayer);
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // TRAFFIC INCIDENTS - Road closures, accidents, congestion
    // ═══════════════════════════════════════════════════════════
    if (traffic.length > 0) {
      const trafficLayer = new ScatterplotLayer<MoroccoTraffic>({
        id: 'morocco-traffic',
        data: traffic,
        getPosition: (d: MoroccoTraffic): [number, number] => d.position,
        getRadius: (d: MoroccoTraffic): number => {
          const baseRadius = d.severity === 'CRITICAL' ? 18000 : 
                           d.severity === 'HIGH' ? 14000 : 10000;
          
          // Pulsing for active incidents
          if (d.status === 'ACTIVE') {
            const pulse = Math.sin(pulseTime * 2.5) * 0.3 + 1;
            return baseRadius * pulse;
          }
          
          return baseRadius;
        },
        getFillColor: (d: MoroccoTraffic): RGBA => {
          // Color based on incident type
          if (d.type === 'ROAD_CLOSED') return [255, 50, 50, 220];
          if (d.type === 'ACCIDENT') return [255, 100, 0, 220];
          if (d.type === 'CONGESTION') return [255, 180, 0, 200];
          return [255, 150, 0, 200];
        },
        stroked: true,
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 1,
        radiusMinPixels: 2,
        radiusMaxPixels: 10,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getRadius: [pulseTime],
        },
      });
      
      layers.push(trafficLayer);
      
      // Traffic labels
      if (!isMobile) {
        const trafficLabelLayer = new TextLayer<MoroccoTraffic>({
          id: 'morocco-traffic-labels',
          data: traffic,
          getPosition: (d: MoroccoTraffic): [number, number] => d.position,
          getText: (d: MoroccoTraffic): string => `🚧 ${d.location}`,
          getSize: 10,
          getColor: [255, 150, 0, 255],
          getPixelOffset: [0, -25],
          fontFamily: 'monospace',
          fontWeight: 600,
          background: true,
          getBackgroundColor: isSatellite ? [10, 14, 22, 220] : [28, 33, 39, 180],
          backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
          pickable: true,
        });
        
        layers.push(trafficLabelLayer);
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // ROUTES - Major highways and roads
    // ═══════════════════════════════════════════════════════════
    if (routes.length > 0) {
      // Route lines
      // Neon Dual-Layer Pathway System
      const getCyberRouteColor = (status: string, condition: string, isHalo: boolean): RGBA => {
        const alpha = isHalo ? 60 : 255;
        
        if (status === 'CLOSED') return [255, 30, 30, isHalo ? 80 : 255]; 
        if (status === 'DISRUPTED') return [255, 140, 0, isHalo ? 70 : 255]; 
        if (status === 'CONSTRUCTION') return [50, 200, 255, isHalo ? 70 : 255]; 

        if (condition === 'EXCELLENT') return [0, 250, 150, alpha]; 
        if (condition === 'GOOD') return [40, 150, 255, alpha]; 
        return [100, 120, 150, isHalo ? 40 : 200]; 
      };

      const routeHaloLayer = new PathLayer<MoroccoRoute>({
        id: 'morocco-routes-halo',
        data: routes,
        getPath: (d: MoroccoRoute) => d.path,
        getColor: (d: MoroccoRoute) => getCyberRouteColor(d.status, d.condition, true),
        getWidth: (d: MoroccoRoute) => {
          const base = d.type === 'HIGHWAY' ? 12 : d.type === 'TOLL_ROAD' ? 8 : 4;
          if (d.status === 'DISRUPTED' || d.status === 'CLOSED') {
            return base * (Math.sin(pulseTime * 3) * 0.2 + 1.2);
          }
          return base;
        },
        widthUnits: 'pixels',
        widthMinPixels: 3,
        widthMaxPixels: 15,
        rounded: true,
        pickable: false,
        updateTriggers: { getWidth: [pulseTime] }
      });

      const routeCoreLayer = new PathLayer<MoroccoRoute>({
        id: 'morocco-routes-core',
        data: routes,
        getPath: (d: MoroccoRoute) => d.path,
        getColor: (d: MoroccoRoute) => getCyberRouteColor(d.status, d.condition, false),
        getWidth: (d: MoroccoRoute) => d.type === 'HIGHWAY' ? 2 : 1,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        widthMaxPixels: 3,
        rounded: true,
        pickable: true,
        autoHighlight: true,
      });

      layers.push(routeHaloLayer, routeCoreLayer);

      const riskSegments = routes.flatMap(route =>
        (route.segments || []).map(segment => ({
          id: route.id,
          name: route.name,
          type: route.type,
          length: route.length,
          tollCost: route.tollCost,
          description: route.description,
          incidents: route.incidents,
          riskScore: route.riskScore,
          condition: route.condition,
          routeId: route.id,
          status: route.status,
          risk: segment.risk,
          path: segment.path,
        })),
      );
      const segmentRiskColor = (risk: number, status: MoroccoRoute['status']): RGBA => {
        if (status === 'CLOSED') return [255, 40, 40, 255];
        if (risk >= 80) return [255, 60, 60, 240];
        if (risk >= 60) return [255, 140, 0, 230];
        if (risk >= 40) return [255, 200, 0, 220];
        if (risk >= 20) return [80, 200, 255, 210];
        return [0, 220, 130, 190];
      };

      if (riskSegments.length > 0) {
        const riskSegmentsLayer = new PathLayer<typeof riskSegments[0]>({
          id: 'morocco-route-risk-segments',
          data: riskSegments,
          getPath: d => d.path,
          getColor: d => segmentRiskColor(d.risk, d.status),
          getWidth: d => {
            const pulseBoost = d.risk >= 60 ? Math.sin(pulseTime * 3) * 0.3 + 1 : 1;
            return (d.risk >= 60 ? 5 : d.risk >= 30 ? 3 : 2) * pulseBoost;
          },
          widthUnits: 'pixels',
          widthMinPixels: 1,
          widthMaxPixels: 8,
          rounded: true,
          pickable: true,
          autoHighlight: true,
          updateTriggers: {
            getWidth: [pulseTime],
          },
        });
        layers.push(riskSegmentsLayer);
      }

      // Flow pulse dots along routes for live traffic feeling
      const routeFlowDots = routes
        .filter(route => route.path.length > 2)
        .flatMap(route => {
          const phase = stablePhase(route.id);
          const markerCount = route.status === 'CLOSED' ? 2 : route.status === 'DISRUPTED' ? 3 : 4;
          return Array.from({ length: markerCount }, (_, i) => {
            const offset = (i / markerCount) * Math.PI * 2;
            const progress = (Math.sin(pulseTime * 1.35 + phase + offset) + 1) / 2;
            const idx = Math.min(route.path.length - 2, Math.floor(progress * (route.path.length - 1)));
            return {
              id: `route-dot-${route.id}-${i}`,
              routeId: route.id,
              status: route.status,
              condition: route.condition,
              intensity: (i + 1) / markerCount,
              position: route.path[idx],
            };
          });
        });

      if (routeFlowDots.length > 0) {
        const routeFlowLayer = new ScatterplotLayer<typeof routeFlowDots[0]>({
          id: 'morocco-routes-flow-dots',
          data: routeFlowDots,
          getPosition: d => d.position,
          getRadius: d => {
            const base = d.status === 'CLOSED' ? 9000 : d.status === 'DISRUPTED' ? 7000 : 5000;
            const phase = stablePhase(d.id);
            const smoothPulse = Math.sin(pulseTime * 2.8 + phase) * 0.16 + 0.94;
            return base * smoothPulse * (0.85 + d.intensity * 0.35);
          },
          getFillColor: d => {
            const [r, g, b, a] = getCyberRouteColor(d.status, d.condition, false);
            const phase = stablePhase(d.id);
            const alphaPulse = Math.sin(pulseTime * 2 + phase) * 0.2 + 0.8;
            return [r, g, b, Math.min(255, Math.floor(a * alphaPulse))];
          },
          stroked: true,
          getLineColor: [255, 255, 255, 220],
          lineWidthMinPixels: 1,
          radiusMinPixels: 2,
          radiusMaxPixels: 9,
          pickable: false,
          updateTriggers: {
            getRadius: [pulseTime],
            getFillColor: [pulseTime],
          },
        });
        layers.push(routeFlowLayer);
      }
      
      // Route incident markers - show where incidents are on the route
      const routeIncidents = routes.flatMap(route => 
        route.incidents.map(incident => ({
          ...incident,
          routeId: route.id,
          routeName: route.name,
        }))
      );
      
      if (routeIncidents.length > 0) {
        const incidentLayer = new ScatterplotLayer<typeof routeIncidents[0]>({
          id: 'morocco-route-incidents',
          data: routeIncidents,
          getPosition: (d) => d.position,
          getRadius: (d): number => {
            const baseRadius = d.severity === 'CRITICAL' ? 18000 : 
                             d.severity === 'HIGH' ? 14000 : 10000;
            
            // Pulsing for critical incidents
            if (d.severity === 'CRITICAL') {
              const pulse = Math.sin(pulseTime * 2.5) * 0.4 + 1;
              return baseRadius * pulse;
            }
            
            return baseRadius;
          },
          getFillColor: (d): RGBA => {
            // Color based on incident type
            if (d.type === 'CLOSURE') return [255, 50, 50, 220]; // Red
            if (d.type === 'ACCIDENT') return [255, 100, 0, 220]; // Orange
            if (d.type === 'CONSTRUCTION') return [100, 150, 255, 220]; // Blue
            if (d.type === 'CONGESTION') return [255, 180, 0, 200]; // Yellow
            return [255, 150, 0, 200]; // Default orange
          },
          stroked: true,
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 1,
          radiusMinPixels: 2,
          radiusMaxPixels: 10,
          pickable: true,
          autoHighlight: true,
          updateTriggers: {
            getRadius: [pulseTime],
          },
        });
        
        layers.push(incidentLayer);
        
        // Incident labels
        if (!isMobile) {
          const incidentLabelLayer = new TextLayer<typeof routeIncidents[0]>({
            id: 'morocco-route-incident-labels',
            data: routeIncidents,
            getPosition: (d) => d.position,
            getText: (d): string => {
              const icon = d.type === 'CLOSURE' ? '🚫' : 
                          d.type === 'ACCIDENT' ? '💥' : 
                          d.type === 'CONSTRUCTION' ? '🚧' : 
                          d.type === 'CONGESTION' ? '🚗' : '⚠️';
              return `${icon} ${d.location}`;
            },
            getSize: 10,
            getColor: (d): RGBA => {
              if (d.type === 'CLOSURE') return [255, 100, 100, 255];
              if (d.type === 'ACCIDENT') return [255, 150, 100, 255];
              return [255, 200, 100, 255];
            },
            getPixelOffset: [0, -25],
            fontFamily: 'monospace',
            fontWeight: 700,
            background: true,
            getBackgroundColor: isSatellite ? [10, 14, 22, 240] : [28, 33, 39, 220],
            backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
            pickable: true,
          });
          
          layers.push(incidentLabelLayer);
        }
      }
      
      // Route labels (show route name at midpoint)
      if (!isMobile) {
        const routeLabels = routes.map(route => {
          const midIndex = Math.floor(route.path.length / 2);
          return {
            ...route,
            midpoint: route.path[midIndex],
          };
        });
        
        const routeLabelLayer = new TextLayer<typeof routeLabels[0]>({
          id: 'morocco-route-labels',
          data: routeLabels,
          getPosition: (d) => d.midpoint,
          getText: (d): string => {
            let icon = '🛣️';
            if (d.type === 'HIGHWAY') icon = '🛤️';
            if (d.type === 'TOLL_ROAD') icon = '💰';
            
            let statusIcon = '';
            if (d.status === 'CLOSED') statusIcon = ' 🚫';
            if (d.status === 'DISRUPTED') statusIcon = ' ⚠️';
            if (d.status === 'CONSTRUCTION') statusIcon = ' 🚧';
            
            return `${icon} ${d.id}${statusIcon}`;
          },
          getSize: 10,
          getColor: (d): RGBA => {
            if (d.status === 'CLOSED') return [255, 100, 100, 255];
            if (d.status === 'DISRUPTED') return [255, 200, 100, 255];
            if (d.condition === 'EXCELLENT') return [100, 255, 150, 255];
            return [150, 200, 255, 255];
          },
          getPixelOffset: [0, -15],
          fontFamily: 'monospace',
          fontWeight: 700,
          background: true,
          getBackgroundColor: isSatellite ? [10, 14, 22, 240] : [28, 33, 39, 220],
          backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
          pickable: true,
        });
        
        layers.push(routeLabelLayer);
      }
    }
    
    console.log('[Morocco Layer] Created', layers.length, 'layers');
    
    return layers;
  }, [events, connections, infrastructure, weather, traffic, commodities, fires, routes, isSatellite, isMobile, pulseTime, selectedEventId, zoom]);
}

function createWeatherIconAtlas(): string {
  const svg = `
    <svg width="256" height="64" viewBox="0 0 256 64" xmlns="http://www.w3.org/2000/svg">
      <g id="clear" transform="translate(32, 32)">
        <circle cx="0" cy="0" r="14" fill="white" opacity="0.9"/>
        <g stroke="white" stroke-width="3" opacity="0.65">
          <line x1="0" y1="-26" x2="0" y2="-20"/>
          <line x1="0" y1="26" x2="0" y2="20"/>
          <line x1="-26" y1="0" x2="-20" y2="0"/>
          <line x1="26" y1="0" x2="20" y2="0"/>
          <line x1="-18" y1="-18" x2="-14" y2="-14"/>
          <line x1="18" y1="18" x2="14" y2="14"/>
          <line x1="18" y1="-18" x2="14" y2="-14"/>
          <line x1="-18" y1="18" x2="-14" y2="14"/>
        </g>
      </g>
      <g id="cloud" transform="translate(96, 32)">
        <path d="M-18,8 C-26,8 -30,2 -30,-4 C-30,-12 -24,-18 -16,-18 C-12,-26 -2,-30 6,-26 C14,-26 22,-20 22,-10 C30,-10 34,-4 34,2 C34,12 26,16 18,16 H-18 Z"
              fill="white" opacity="0.9"/>
      </g>
      <g id="rain" transform="translate(160, 32)">
        <path d="M-18,4 C-26,4 -30,-2 -30,-8 C-30,-16 -24,-22 -16,-22 C-12,-30 -2,-34 6,-30 C14,-30 22,-24 22,-14 C30,-14 34,-8 34,-2 C34,8 26,12 18,12 H-18 Z"
              fill="white" opacity="0.9"/>
        <g stroke="white" stroke-width="3" opacity="0.7">
          <line x1="-10" y1="16" x2="-14" y2="26"/>
          <line x1="2" y1="16" x2="-2" y2="26"/>
          <line x1="14" y1="16" x2="10" y2="26"/>
        </g>
      </g>
      <g id="storm" transform="translate(224, 32)">
        <path d="M-18,4 C-26,4 -30,-2 -30,-8 C-30,-16 -24,-22 -16,-22 C-12,-30 -2,-34 6,-30 C14,-30 22,-24 22,-14 C30,-14 34,-8 34,-2 C34,8 26,12 18,12 H-18 Z"
              fill="white" opacity="0.9"/>
        <path d="M2,14 L-6,30 L4,30 L-2,46" fill="none" stroke="white" stroke-width="4" opacity="0.8"/>
      </g>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function createWeatherIconMapping(): Record<string, { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number }> {
  const size = 64;
  return {
    clear: { x: 0, y: 0, width: size, height: size, anchorX: size / 2, anchorY: size / 2 },
    cloud: { x: 64, y: 0, width: size, height: size, anchorX: size / 2, anchorY: size / 2 },
    rain: { x: 128, y: 0, width: size, height: size, anchorX: size / 2, anchorY: size / 2 },
    storm: { x: 192, y: 0, width: size, height: size, anchorX: size / 2, anchorY: size / 2 },
    snow: { x: 64, y: 0, width: size, height: size, anchorX: size / 2, anchorY: size / 2 },
    fog: { x: 64, y: 0, width: size, height: size, anchorX: size / 2, anchorY: size / 2 },
  };
}

/**
 * Create SVG icon atlas for event types
 */
function createEventIconAtlas(): string {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- Each icon is 64x64 in an 8x8 grid -->
      
      <!-- POLITICAL (0,0) -->
      <g id="political" transform="translate(32, 32)">
        <rect x="-20" y="-20" width="40" height="40" fill="currentColor" opacity="0.3" rx="4"/>
        <path d="M0,-15 L-12,0 L-8,0 L-8,15 L8,15 L8,0 L12,0 Z" fill="currentColor"/>
      </g>
      
      <!-- DIPLOMATIC (64,0) -->
      <g id="diplomatic" transform="translate(96, 32)">
        <circle cx="0" cy="0" r="22" fill="currentColor" opacity="0.3"/>
        <path d="M-10,-5 L-5,0 L-10,5 M10,-5 L5,0 L10,5" stroke="currentColor" stroke-width="3" fill="none"/>
      </g>
      
      <!-- ECONOMIC (128,0) -->
      <g id="economic" transform="translate(160, 32)">
        <circle cx="0" cy="0" r="22" fill="currentColor" opacity="0.3"/>
        <rect x="-12" y="-15" width="24" height="30" fill="currentColor" rx="2"/>
        <rect x="-8" y="-10" width="16" height="5" fill="white"/>
      </g>
      
      <!-- INFRASTRUCTURE (192,0) -->
      <g id="infrastructure" transform="translate(224, 32)">
        <rect x="-18" y="-18" width="36" height="36" fill="currentColor" opacity="0.3" rx="3"/>
        <path d="M-15,-10 L-15,10 L-5,10 L-5,-5 L5,-5 L5,10 L15,10 L15,-10 Z" fill="currentColor"/>
      </g>
      
      <!-- WEATHER (256,0) -->
      <g id="weather" transform="translate(288, 32)">
        <circle cx="0" cy="-5" r="8" fill="currentColor"/>
        <path d="M-15,5 Q-10,0 -5,5 Q0,0 5,5 Q10,0 15,5" stroke="currentColor" stroke-width="3" fill="none"/>
      </g>
      
      <!-- FIRE (320,0) -->
      <g id="fire" transform="translate(352, 32)">
        <path d="M0,-20 C-8,-10 -10,0 -10,8 C-10,15 -5,20 0,20 C5,20 10,15 10,8 C10,0 8,-10 0,-20 Z" fill="currentColor"/>
      </g>
      
      <!-- PROTEST (384,0) -->
      <g id="protest" transform="translate(416, 32)">
        <circle cx="0" cy="0" r="20" fill="currentColor" opacity="0.3"/>
        <path d="M-10,-10 L-10,10 M-5,-10 L-5,10 M0,-10 L0,10 M5,-10 L5,10 M10,-10 L10,10" stroke="currentColor" stroke-width="2"/>
      </g>
      
      <!-- ACCIDENT (448,0) -->
      <g id="accident" transform="translate(480, 32)">
        <path d="M0,-20 L-18,15 L18,15 Z" fill="currentColor"/>
        <text x="0" y="8" font-size="20" text-anchor="middle" fill="white" font-weight="bold">!</text>
      </g>
      
      <!-- Add more event types in subsequent rows... -->
      <!-- For brevity, using simple shapes for remaining types -->
      
      <!-- INVESTMENT (0,64) -->
      <g id="investment" transform="translate(32, 96)">
        <circle cx="0" cy="0" r="20" fill="currentColor"/>
        <text x="0" y="8" font-size="24" text-anchor="middle" fill="white" font-weight="bold">$</text>
      </g>
      
      <!-- TRADE (64,64) -->
      <g id="trade" transform="translate(96, 96)">
        <rect x="-15" y="-10" width="30" height="20" fill="currentColor" rx="2"/>
        <rect x="-12" y="-7" width="24" height="14" fill="white" opacity="0.3"/>
      </g>
      
      <!-- TOURISM (128,64) -->
      <g id="tourism" transform="translate(160, 96)">
        <path d="M-15,-5 L0,-15 L15,-5 L15,10 L-15,10 Z" fill="currentColor"/>
        <circle cx="0" cy="0" r="5" fill="white"/>
      </g>
      
      <!-- AGRICULTURE (192,64) -->
      <g id="agriculture" transform="translate(224, 96)">
        <path d="M0,-15 L0,15 M-10,-5 Q-5,-10 0,-5 M10,-5 Q5,-10 0,-5" stroke="currentColor" stroke-width="3" fill="none"/>
      </g>
      
      <!-- ENERGY (256,64) -->
      <g id="energy" transform="translate(288, 96)">
        <path d="M5,-20 L-10,0 L0,0 L-5,20 L10,0 L0,0 Z" fill="currentColor"/>
      </g>
      
      <!-- SECURITY (320,64) -->
      <g id="security" transform="translate(352, 96)">
        <path d="M0,-20 L-15,-10 L-15,5 C-15,12 -8,18 0,20 C8,18 15,12 15,5 L15,-10 Z" fill="currentColor"/>
      </g>
      
      <!-- TRANSPORT (384,64) -->
      <g id="transport" transform="translate(416, 96)">
        <rect x="-18" y="-8" width="36" height="16" fill="currentColor" rx="3"/>
        <circle cx="-10" cy="8" r="5" fill="white"/>
        <circle cx="10" cy="8" r="5" fill="white"/>
      </g>
      
      <!-- HEALTH (448,64) -->
      <g id="health" transform="translate(480, 96)">
        <circle cx="0" cy="0" r="20" fill="currentColor"/>
        <path d="M0,-12 L0,12 M-12,0 L12,0" stroke="white" stroke-width="4"/>
      </g>
    </svg>
  `;
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Create icon mapping for event types
 */
function createEventIconMapping(): Record<string, { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number }> {
  const iconSize = 64;
  const mapping: Record<string, any> = {};
  
  const types = [
    'political', 'diplomatic', 'economic', 'infrastructure', 'weather', 'fire', 'protest', 'accident',
    'investment', 'trade', 'tourism', 'agriculture', 'energy', 'security', 'transport', 'health',
  ];
  
  types.forEach((type, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    
    mapping[type] = {
      x: col * iconSize,
      y: row * iconSize,
      width: iconSize,
      height: iconSize,
      anchorX: iconSize / 2,
      anchorY: iconSize / 2,
    };
  });
  
  return mapping;
}
