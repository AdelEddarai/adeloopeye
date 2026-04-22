'use client';

import { useEffect, useMemo, useState } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Layer, MapViewState } from '@deck.gl/core';
import { ArcLayer, IconLayer, PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';

import type { SelectedItem } from '@/features/map/components/types';
import { selectVisibleLabels } from '@/features/map/lib/label-visibility';

import type { Asset, CyberThreat, HeatPoint, MaritimeLane, MaritimeVessel, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { NAVAL_RGB, STATUS_META } from '@/data/map-tokens';
import type { MapStory } from '@/types/domain';

import type { FilteredData } from './use-map-filters';
import { useMoroccoLayer } from './use-morocco-layer';
import type { MoroccoCommodity, MoroccoFire, MoroccoTraffic, MoroccoWeather } from '@/server/lib/api-clients/morocco-local-data';
import type { MoroccoRoute } from '@/server/lib/api-clients/morocco-routes-client';
import type { MoroccoConnection, MoroccoEvent, MoroccoInfrastructure } from '@/server/lib/morocco-intelligence-analyzer';

// Types

const FALLBACK_META: ActorMeta = {
  label: '??', cssVar: 'var(--t3)', rgb: [143, 153, 168],
  affiliation: 'NEUTRAL', group: 'Unknown',
};

type MoroccoIntelPayload = {
  events: MoroccoEvent[];
  connections: MoroccoConnection[];
  infrastructure: MoroccoInfrastructure[];
  weather?: MoroccoWeather[];
  traffic?: MoroccoTraffic[];
  commodities?: MoroccoCommodity[];
  fires?: MoroccoFire[];
  routes?: MoroccoRoute[];
};

type Props = {
  filtered:    FilteredData;
  actorMeta:   Record<string, ActorMeta>;
  activeStory: MapStory | null;
  selectedItem: SelectedItem | null;
  viewState: MapViewState;
  isSatellite: boolean;
  isMobile?:   boolean;
  showAllLabels?: boolean;
  showFlights?: boolean;
  showEvents?: boolean;
  showCyberThreats?: boolean;
  showMaritime?: boolean;
  moroccoIntelligence?: MoroccoIntelPayload | null;
  showMoroccoLayer?: boolean;
  selectedEventId?: string | null;
};

type RGBA = [number, number, number, number];

// Helpers

/** Read a --text-* CSS token as a numeric pixel value for DeckGL layers. */
function textToken(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

const activeAlpha = (isSatellite: boolean) => (isSatellite ? 255 : 220);

const withAlpha = (rgb: number[], a: number): RGBA => [rgb[0] ?? 0, rgb[1] ?? 0, rgb[2] ?? 0, a];

/** Alpha for non-highlighted items */
const DIM = 40;

/** Actor-driven color, dimmed when not in active story's highlight set. */
function actorColor(
  rgb: number[],
  id: string,
  highlightIds: string[],
  isDimActive: boolean,
  alpha: number,
): RGBA {
  if (isDimActive && !highlightIds.includes(id)) return withAlpha(rgb, DIM);
  return withAlpha(rgb, alpha);
}

function statusFill(status: Target['status'] | Asset['status'], type?: string): [number, number, number] {
  // Special colors for critical events
  if (type === 'FIRE') return [255, 140, 0];      // Orange for fire
  if (type === 'EXPLOSION') return [255, 50, 50]; // Bright red for explosion
  if (type === 'ATTACK') return [220, 50, 80];    // Red for attack
  if (type === 'STRIKE') return [200, 50, 100];   // Dark red for strike
  if (type === 'INCIDENT') return [220, 150, 50]; // Yellow-orange for incident
  
  // Regular status colors
  switch (status) {
    case 'DESTROYED': return [220, 50,  50 ];
    case 'DAMAGED':   return [220, 150, 50 ];
    case 'STRUCK':    return [220, 180, 80 ];
    case 'DEGRADED':  return [180, 160, 60 ];
    default:          return [80,  180, 120];   // ACTIVE → green
  }
}

function stringPhase(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 360) * (Math.PI / 180);
}

// Hook

 
export function useMapLayers({
  filtered,
  actorMeta,
  activeStory,
  selectedItem,
  viewState,
  isSatellite,
  isMobile = false,
  showAllLabels = false,
  showFlights = true,
  showEvents = true,
  showCyberThreats = true,
  showMaritime = false,
  moroccoIntelligence = null,
  showMoroccoLayer = false,
  selectedEventId = null,
}: Props): Layer[] {
  const cyberThreats = (filtered as any).cyberThreats || [];
  const [pulseTime, setPulseTime] = useState(0);

  const moroccoNeedsPulse = useMemo(() => {
    if (!showMoroccoLayer || !moroccoIntelligence) return false;
    const m = moroccoIntelligence;
    return (
      m.events.length +
      m.connections.length +
      m.infrastructure.length +
      (m.weather?.length ?? 0) +
      (m.traffic?.length ?? 0) +
      (m.commodities?.length ?? 0) +
      (m.fires?.length ?? 0) +
      (m.routes?.length ?? 0)
    ) > 0;
  }, [showMoroccoLayer, moroccoIntelligence]);

  const maritimeLaneCount = filtered.maritimeLanes?.length ?? 0;
  const vesselCount = filtered.vessels?.length ?? 0;
  const maritimeNeedsPulse = showMaritime && (maritimeLaneCount > 0 || vesselCount > 0);

  const needsPulseAnimation =
    (showCyberThreats && cyberThreats.length > 0) || moroccoNeedsPulse || maritimeNeedsPulse;

  useEffect(() => {
    if (!needsPulseAnimation) return;
    const interval = setInterval(() => {
      setPulseTime(t => (t + 0.045) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, [needsPulseAnimation]);

  // Morocco intelligence layers (outside useMemo)
  const moroccoLayers = useMoroccoLayer({
    events: showMoroccoLayer && moroccoIntelligence ? moroccoIntelligence.events : [],
    connections: showMoroccoLayer && moroccoIntelligence ? moroccoIntelligence.connections : [],
    infrastructure: showMoroccoLayer && moroccoIntelligence ? moroccoIntelligence.infrastructure : [],
    weather: showMoroccoLayer && moroccoIntelligence ? (moroccoIntelligence.weather || []) : [],
    traffic: showMoroccoLayer && moroccoIntelligence ? (moroccoIntelligence.traffic || []) : [],
    commodities: showMoroccoLayer && moroccoIntelligence ? (moroccoIntelligence.commodities || []) : [],
    fires: showMoroccoLayer && moroccoIntelligence ? (moroccoIntelligence.fires || []) : [],
    routes: showMoroccoLayer && moroccoIntelligence ? (moroccoIntelligence.routes || []) : [],
    isSatellite,
    isMobile,
    pulseTime,
    zoom: viewState.zoom,
    selectedEventId,
  });

  return useMemo(() => {
    const activeEventIds = activeStory
      ? new Set<string>(
          [activeStory.primaryEventId, ...(activeStory.sourceEventIds ?? [])].filter(
            (id): id is string => Boolean(id),
          ),
        )
      : null;

    const mergedActiveStory = !activeStory || !activeEventIds
      ? activeStory
      : {
          ...activeStory,
          highlightStrikeIds: [...new Set([
            ...activeStory.highlightStrikeIds,
            ...filtered.strikes.filter(d => d.sourceEventId && activeEventIds.has(d.sourceEventId)).map(d => d.id),
          ])],
          highlightMissileIds: [...new Set([
            ...activeStory.highlightMissileIds,
            ...filtered.missiles.filter(d => d.sourceEventId && activeEventIds.has(d.sourceEventId)).map(d => d.id),
          ])],
          highlightTargetIds: [...new Set([
            ...activeStory.highlightTargetIds,
            ...filtered.targets.filter(d => d.sourceEventId && activeEventIds.has(d.sourceEventId)).map(d => d.id),
          ])],
          highlightAssetIds: [...new Set([
            ...activeStory.highlightAssetIds,
            ...filtered.assets.filter(d => d.sourceEventId && activeEventIds.has(d.sourceEventId)).map(d => d.id),
          ])],
        };

    const alpha    = activeAlpha(isSatellite);
    const dimActive = mergedActiveStory !== null;

    const highlighted = (id: string, arr: string[]) => !dimActive || arr.includes(id);

    // Label appearance — reads CSS scale tokens so DeckGL respects UI scale
    const baseLabelSize = textToken('--text-body-sm', 11);
    const labelSize    = isSatellite ? baseLabelSize + 1 : baseLabelSize;
    const labelWeight  = isSatellite ? 700 : 400;
    const labelBg: RGBA = isSatellite ? [10, 14, 22, 230] : [28, 33, 39, 200];
    const strokeWidth  = isSatellite ? 2 : 1;
    const visibleLabels = selectVisibleLabels(
      filtered.targets,
      filtered.assets,
      viewState,
      selectedItem,
      mergedActiveStory,
      showAllLabels,
    );

    // Heat map
    const heatLayer = filtered.heat.length > 0 && new HeatmapLayer<HeatPoint>({
      id: 'heat',
      data: filtered.heat,
      getPosition: (d: HeatPoint): [number, number] => d.position,
      getWeight:   (d: HeatPoint): number => d.weight,
      radiusPixels: 60,
      intensity: dimActive ? 0.3 : 1,
      threshold: 0.03,
      colorRange: [
        [255, 255, 178, 25], [254, 204, 92, 80],
        [253, 141, 60, 120], [240, 59, 32, 160], [189, 0, 38, 200],
      ],
    });

    // Threat zones
    const zoneLayer = filtered.zones.length > 0 && new PolygonLayer<ThreatZone>({
      id: 'zones',
      data: filtered.zones,
      getPolygon:    (d: ThreatZone): [number, number][] => d.coordinates,
      getFillColor:  (d: ThreatZone): RGBA => dimActive ? [d.color[0], d.color[1], d.color[2], 20] : d.color,
      getLineColor:  (d: ThreatZone): RGBA => dimActive
        ? [d.color[0], d.color[1], d.color[2], 40]
        : [d.color[0], d.color[1], d.color[2], 200],
      lineWidthMinPixels: 1,
      filled: true,
      stroked: true,
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getFillColor: [dimActive], getLineColor: [dimActive] },
    });

    // Strike arcs
    const strikeLayer = filtered.strikes.length > 0 && new ArcLayer<StrikeArc>({
      id: 'strikes',
      data: filtered.strikes,
      getSourcePosition: (d: StrikeArc): [number, number] => d.from,
      getTargetPosition: (d: StrikeArc): [number, number] => d.to,
      getSourceColor: (d: StrikeArc): RGBA => {
        const rgb = d.type === 'NAVAL_STRIKE' ? NAVAL_RGB : (actorMeta[d.actor] ?? FALLBACK_META).rgb;
        return highlighted(d.id, mergedActiveStory?.highlightStrikeIds ?? [])
          ? withAlpha(rgb, alpha)
          : withAlpha(rgb, DIM);
      },
      getTargetColor: (d: StrikeArc): RGBA =>
        highlighted(d.id, mergedActiveStory?.highlightStrikeIds ?? [])
          ? [255, 255, 255, isSatellite ? 230 : 180]
          : [255, 255, 255, 30],
      getWidth: (d: StrikeArc): number =>
        (isSatellite ? 1 : 0) + (d.severity === 'CRITICAL' ? 3 : 2),
      widthUnits: 'pixels',
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getSourceColor: [mergedActiveStory?.id, mergedActiveStory?.highlightStrikeIds.join('|'), isSatellite],
        getTargetColor: [mergedActiveStory?.id, mergedActiveStory?.highlightStrikeIds.join('|'), isSatellite],
        getWidth:       [isSatellite],
      },
    });

    // Missile arcs
    const missileLayer = filtered.missiles.length > 0 && new ArcLayer<MissileTrack>({
      id: 'missiles',
      data: filtered.missiles,
      getSourcePosition: (d: MissileTrack): [number, number] => d.from,
      getTargetPosition: (d: MissileTrack): [number, number] => d.to,
      getSourceColor: (d: MissileTrack): RGBA =>
        actorColor((actorMeta[d.actor] ?? FALLBACK_META).rgb, d.id, mergedActiveStory?.highlightMissileIds ?? [], dimActive, alpha),
      getTargetColor: (d: MissileTrack): RGBA => {
        if (dimActive && !(mergedActiveStory?.highlightMissileIds ?? []).includes(d.id)) return withAlpha((actorMeta[d.actor] ?? FALLBACK_META).rgb, DIM);
        return d.status === 'INTERCEPTED' ? [255, 200, 0, alpha] : [255, 50, 50, alpha];
      },
      getWidth: (d: MissileTrack): number =>
        (isSatellite ? 1 : 0) + (d.severity === 'CRITICAL' ? 3 : 2),
      widthUnits: 'pixels',
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getSourceColor: [mergedActiveStory?.id, mergedActiveStory?.highlightMissileIds.join('|'), isSatellite],
        getTargetColor: [mergedActiveStory?.id, mergedActiveStory?.highlightMissileIds.join('|'), isSatellite],
        getWidth:       [isSatellite],
      },
    });

    // Target scatter (includes critical events)
    const targetLayer = showEvents && filtered.targets.length > 0 && new ScatterplotLayer<Target>({
      id: 'targets',
      data: filtered.targets,
      getPosition:  (d: Target): [number, number] => d.position,
      getRadius:    (d: Target): number => {
        // Larger radius for critical events
        const isCriticalEvent = ['FIRE', 'EXPLOSION', 'ATTACK', 'STRIKE', 'INCIDENT'].includes(d.type);
        if (isCriticalEvent) return 16000;
        return d.status === 'DESTROYED' ? 18000 : d.status === 'DAMAGED' ? 14000 : 10000;
      },
      getFillColor: (d: Target): RGBA => {
        const base = statusFill(d.status, d.type);
        if (dimActive && !(mergedActiveStory?.highlightTargetIds ?? []).includes(d.id)) return withAlpha(base, DIM);
        return withAlpha(base, alpha);
      },
      stroked: true,
      getLineColor: (): RGBA => [255, 255, 255, isSatellite ? 220 : 100],
      lineWidthMinPixels: strokeWidth,
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getFillColor: [mergedActiveStory?.id, mergedActiveStory?.highlightTargetIds.join('|'), isSatellite],
        getLineColor: [isSatellite],
        getRadius: [isSatellite],
      },
    });

    // Asset layer with airplane icons for flights
    const assetLayer = showFlights && filtered.assets.length > 0 && new IconLayer<Asset>({
      id: 'assets',
      data: filtered.assets,
      getPosition: (d: Asset): [number, number] => d.position,
      getIcon: () => 'airplane',
      getSize: (d: Asset): number => (d.type === 'CARRIER' ? 48 : 36),
      getAngle: (d: Asset): number => {
        // Rotate airplane icon based on heading (true_track from OpenSky)
        // Heading is in degrees clockwise from north
        return -(d.heading || 0); // Negative because deck.gl rotates counter-clockwise
      },
      getColor: (d: Asset): [number, number, number, number] => {
        const rgb = (actorMeta[d.actor] ?? FALLBACK_META).rgb;
        if (dimActive && !(mergedActiveStory?.highlightAssetIds ?? []).includes(d.id)) {
          return [rgb[0], rgb[1], rgb[2], DIM];
        }
        return [rgb[0], rgb[1], rgb[2], alpha];
      },
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <g id="airplane">
            <!-- Airplane body pointing up (north) -->
            <path d="M64 20 L68 50 L80 54 L68 58 L64 88 L60 58 L48 54 L60 50 Z" 
                  fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="2"/>
            <!-- Nose -->
            <circle cx="64" cy="20" r="4" fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
          </g>
        </svg>
      `),
      iconMapping: {
        airplane: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getColor: [mergedActiveStory?.id, mergedActiveStory?.highlightAssetIds.join('|'), isSatellite],
        getSize: [isSatellite],
        getAngle: [filtered.assets.map(a => a.heading).join(',')], // Update when headings change
      },
    });

    // Target labels - REMOVED to reduce clutter
    // Users can hover to see event details in tooltip
    const targetLabels = false; // Disabled

    // Asset labels (show callsigns for flights)
    const assetLabels = !isMobile && showFlights && visibleLabels.assets.length > 0 && new TextLayer<Asset>({
      id: 'asset-labels',
      data: visibleLabels.assets,
      getPosition:       (d: Asset): [number, number] => d.position,
      getText:           (d: Asset): string => d.name,
      getSize:           isSatellite ? baseLabelSize : textToken('--text-label', 10),
      getColor:          (d: Asset): RGBA => {
        const [r, g, b] = (actorMeta[d.actor] ?? FALLBACK_META).rgb;
        return isSatellite ? [r + 40, g + 40, b + 40, 255] : [r, g, b, 200];
      },
      getPixelOffset:    (): [number, number] => [0, -28],
      fontFamily:        'SFMono-Regular, Menlo, monospace',
      fontWeight:        labelWeight,
      background:        true,
      getBackgroundColor: (): RGBA => labelBg,
      backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
      pickable:          true,
      autoHighlight:     true,
      updateTriggers:    { getColor: [isSatellite], getBackgroundColor: [isSatellite] },
    });

    // Cyber threat layer with icon instead of pulse
    const cyberThreatLayer = showCyberThreats && cyberThreats.length > 0 && new IconLayer<CyberThreat>({
      id: 'cyber-threats',
      data: cyberThreats,
      getPosition: (d: CyberThreat): [number, number] => d.position,
      getIcon: () => 'cyber',
      getSize: 40,
      getColor: (d: CyberThreat): RGBA => {
        // Color based on threat type
        switch (d.type) {
          case 'DDOS':
            return [255, 50, 50, 255]; // Red
          case 'MALWARE':
            return [255, 140, 0, 255]; // Orange
          case 'RANSOMWARE':
            return [200, 50, 200, 255]; // Purple
          case 'PHISHING':
            return [255, 200, 0, 255]; // Yellow
          case 'INTRUSION':
            return [100, 150, 255, 255]; // Blue
          default:
            return [150, 150, 150, 255]; // Gray
        }
      },
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <g id="cyber">
            <!-- Shield with warning symbol -->
            <path d="M64 10 L100 25 L100 60 C100 85, 85 100, 64 110 C43 100, 28 85, 28 60 L28 25 Z" 
                  fill="currentColor" opacity="0.3" stroke="currentColor" stroke-width="3"/>
            <!-- Warning triangle -->
            <path d="M64 45 L75 65 L53 65 Z" fill="currentColor"/>
            <!-- Exclamation mark -->
            <rect x="62" y="50" width="4" height="8" fill="white"/>
            <rect x="62" y="60" width="4" height="3" fill="white"/>
          </g>
        </svg>
      `),
      iconMapping: {
        cyber: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getColor: [],
      },
    });

    // Fire icons layer - show fires with fire icon
    const fireEvents = filtered.targets.filter(t => t.type === 'FIRE');
    const fireLayer = showEvents && fireEvents.length > 0 && new IconLayer<Target>({
      id: 'fire-icons',
      data: fireEvents,
      getPosition: (d: Target): [number, number] => d.position,
      getIcon: () => 'fire',
      getSize: 48,
      getColor: [255, 140, 0, 255], // Orange
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <g id="fire">
            <path d="M64 10 C64 10, 50 30, 50 50 C50 65, 55 75, 64 85 C73 75, 78 65, 78 50 C78 30, 64 10, 64 10 Z" fill="#FF4500" stroke="#FF8C00" stroke-width="2"/>
            <path d="M64 30 C64 30, 56 42, 56 52 C56 60, 59 65, 64 70 C69 65, 72 60, 72 52 C72 42, 64 30, 64 30 Z" fill="#FFA500"/>
            <path d="M64 45 C64 45, 60 50, 60 55 C60 59, 62 62, 64 65 C66 62, 68 59, 68 55 C68 50, 64 45, 64 45 Z" fill="#FFD700"/>
          </g>
        </svg>
      `),
      iconMapping: {
        fire: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
    });

    // Geopolitical relationship lines - comprehensive visualization
    const relationships = (filtered as any).conflictRelationships || [];
    
    // DEBUG: Log relationships to console
    if (relationships.length > 0) {
      console.log('[Map Layers] Rendering', relationships.length, 'geopolitical relationships');
      console.log('[Map Layers] Sample relationship:', relationships[0]);
    } else {
      console.warn('[Map Layers] No geopolitical relationships to render');
      console.log('[Map Layers] Filtered data:', filtered);
    }
    
    // Helper function to get color by relationship type - OPTIMIZED for visual hierarchy
    const getRelationshipColor = (type: string, isSource: boolean): RGBA => {
      const alpha = isSource ? 180 : 140; // Reduced opacity for subtlety
      const alphaTarget = isSource ? 140 : 100;
      
      switch (type) {
        case 'MILITARY_CONFLICT':
          return isSource ? [255, 60, 60, alpha] : [255, 120, 120, alphaTarget]; // Bright red for conflicts
        case 'DIPLOMATIC_TENSION':
          return isSource ? [255, 180, 0, alpha] : [255, 200, 80, alphaTarget]; // Orange for tensions
        case 'TRADE_ROUTE':
          return isSource ? [80, 160, 220, alpha] : [120, 180, 240, alphaTarget]; // Subtle blue for trade
        case 'ALLIANCE':
          return isSource ? [80, 200, 120, alpha] : [120, 220, 160, alphaTarget]; // Green for alliances
        case 'SUPPLY_CHAIN':
          return isSource ? [160, 120, 200, alpha] : [180, 140, 220, alphaTarget]; // Purple for supply
        case 'ENERGY_DEPENDENCY':
          return isSource ? [220, 120, 40, alpha] : [240, 160, 80, alphaTarget]; // Orange for energy
        case 'MIGRATION_FLOW':
          return isSource ? [120, 120, 200, alpha] : [160, 160, 220, alphaTarget]; // Light purple
        case 'ECONOMIC_PARTNERSHIP':
          return isSource ? [40, 160, 120, alpha] : [80, 180, 140, alphaTarget]; // Teal for economics
        default:
          return isSource ? [120, 120, 120, alpha] : [160, 160, 160, alphaTarget]; // Gray default
      }
    };
    
    // OPTIMIZED: Main geopolitical relationship arcs - FLAT for trade, curved for conflicts
    const relationshipLayer = relationships.length > 0 && new ArcLayer<any>({
      id: 'geopolitical-relationships',
      data: relationships,
      getSourcePosition: (d: any): [number, number] => d.sourcePosition,
      getTargetPosition: (d: any): [number, number] => d.targetPosition,
      getSourceColor: (d: any): RGBA => {
        const baseColor = getRelationshipColor(d.type, true);
        // Add pulsing effect ONLY for military conflicts
        if (d.type === 'MILITARY_CONFLICT') {
          const pulse = Math.sin(pulseTime * 1.5) * 0.2 + 0.8;
          return [baseColor[0], baseColor[1], baseColor[2], Math.floor(baseColor[3] * pulse)];
        }
        return baseColor;
      },
      getTargetColor: (d: any): RGBA => {
        const baseColor = getRelationshipColor(d.type, false);
        // Add pulsing effect ONLY for military conflicts
        if (d.type === 'MILITARY_CONFLICT') {
          const pulse = Math.sin(pulseTime * 1.5 + Math.PI) * 0.2 + 0.8;
          return [baseColor[0], baseColor[1], baseColor[2], Math.floor(baseColor[3] * pulse)];
        }
        return baseColor;
      },
      getWidth: (d: any): number => {
        // REFINED: Much smaller, tighter lines for trade routes
        if (d.type === 'TRADE_ROUTE' || d.type === 'ECONOMIC_PARTNERSHIP') {
          return 1.5; // Very thin for trade
        }
        if (d.type === 'ENERGY_DEPENDENCY') {
          return 2.0; // Slightly thicker for energy
        }
        if (d.type === 'ALLIANCE') {
          return 2.5; // Medium for alliances
        }
        if (d.type === 'MILITARY_CONFLICT') {
          // Subtle pulsing width for conflicts only
          const pulse = Math.sin(pulseTime * 1.5) * 0.3 + 1;
          return 3.0 * pulse; // Thickest for conflicts
        }
        return 2.0; // Default
      },
      getHeight: (d: any): number => {
        // COMPLETELY FLAT for trade and shipping - NO 3D arc
        if (d.type === 'TRADE_ROUTE' || d.type === 'ECONOMIC_PARTNERSHIP') {
          return 0; // ZERO height = completely flat line
        }
        if (d.type === 'ENERGY_DEPENDENCY') {
          return 0; // ZERO height = completely flat line
        }
        if (d.type === 'ALLIANCE') {
          return 0.05; // Nearly flat for alliances
        }
        if (d.type === 'MILITARY_CONFLICT') {
          return 0.15; // Higher arc for conflicts (drama)
        }
        return 0.05; // Default subtle curve
      },
      widthUnits: 'pixels',
      pickable: true,
      autoHighlight: true,
      greatCircle: true,
      updateTriggers: {
        getSourceColor: [isSatellite, pulseTime],
        getTargetColor: [isSatellite, pulseTime],
        getWidth: [pulseTime],
      },
    });

    // REFINED: Subtle glow effect only for conflicts and energy
    const relationshipGlowLayer = relationships.length > 0 && new ArcLayer<any>({
      id: 'relationship-glow',
      data: relationships.filter((d: any) => ['MILITARY_CONFLICT', 'ENERGY_DEPENDENCY'].includes(d.type)),
      getSourcePosition: (d: any): [number, number] => d.sourcePosition,
      getTargetPosition: (d: any): [number, number] => d.targetPosition,
      getSourceColor: (d: any): RGBA => {
        const [r, g, b] = getRelationshipColor(d.type, true);
        return [r, g, b, 30]; // Much more subtle glow
      },
      getTargetColor: (d: any): RGBA => {
        const [r, g, b] = getRelationshipColor(d.type, false);
        return [r, g, b, 20]; // Very subtle
      },
      getWidth: (d: any): number => {
        if (d.type === 'MILITARY_CONFLICT') {
          return 6; // Wider glow for conflicts
        }
        return 4; // Subtle glow for energy
      },
      getHeight: (d: any): number => {
        // Match main layer heights
        if (d.type === 'ENERGY_DEPENDENCY') {
          return 0; // Completely flat
        }
        if (d.type === 'MILITARY_CONFLICT') {
          return 0.15;
        }
        return 0.05;
      },
      widthUnits: 'pixels',
      pickable: false,
      greatCircle: true,
    });

    // ENHANCED: Country labels for relationships
    const relationshipLabels = relationships.length > 0 && new TextLayer<any>({
      id: 'relationship-country-labels',
      data: relationships.flatMap((r: any) => [
        { 
          position: r.sourcePosition, 
          text: r.sourceCountry, 
          type: 'source',
          relationshipType: r.type,
        },
        { 
          position: r.targetPosition, 
          text: r.targetCountry, 
          type: 'target',
          relationshipType: r.type,
        },
      ]),
      getPosition: (d: any): [number, number] => d.position,
      getText: (d: any): string => d.text,
      getSize: 11,
      getColor: (d: any): RGBA => {
        // Color labels based on relationship type
        const [r, g, b] = getRelationshipColor(d.relationshipType, true);
        return [r, g, b, 255];
      },
      getPixelOffset: [0, -22],
      fontFamily: 'monospace',
      fontWeight: 'bold',
      background: true,
      getBackgroundColor: [0, 0, 0, 200],
      backgroundPadding: [4, 2, 4, 2] as [number, number, number, number],
      billboard: true,
      pickable: true,
    });

    // City markers - clickable for weather
    const cities = (filtered as any).cities || [];
    const cityLayer = cities.length > 0 && new ScatterplotLayer<any>({
      id: 'cities',
      data: cities,
      getPosition: (d: any): [number, number] => d.position,
      getRadius: (d: any): number => {
        // Size based on city type
        if (d.type === 'CAPITAL') return 12000;
        if (d.type === 'MAJOR_CITY') return 9000;
        return 7000;
      },
      getFillColor: [100, 150, 255, 180], // Blue for cities
      stroked: true,
      getLineColor: [255, 255, 255, 220],
      lineWidthMinPixels: 2,
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getRadius: [isSatellite],
      },
    });

    // City labels
    const cityLabels = !isMobile && cities.length > 0 && new TextLayer<any>({
      id: 'city-labels',
      data: cities,
      getPosition: (d: any): [number, number] => d.position,
      getText: (d: any): string => d.name,
      getSize: isSatellite ? baseLabelSize + 1 : baseLabelSize,
      getColor: [100, 150, 255, 255], // Blue
      getPixelOffset: (): [number, number] => [0, -18],
      fontFamily: 'SFMono-Regular, Menlo, monospace',
      fontWeight: 700,
      background: true,
      getBackgroundColor: (): RGBA => labelBg,
      backgroundPadding: [4, 3, 4, 3] as [number, number, number, number],
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getColor: [isSatellite], getBackgroundColor: [isSatellite] },
    });

    const tradeLanes = filtered.maritimeLanes ?? [];
    const tradeVessels = filtered.vessels ?? [];

    // OPTIMIZED: Subtle glow for maritime lanes (no pulsing)
    const maritimeLaneGlow = showMaritime && tradeLanes.length > 0 && new PathLayer<MaritimeLane>({
      id: 'maritime-lanes-glow',
      data: tradeLanes,
      getPath: d => d.path,
      getColor: (d: MaritimeLane): RGBA => {
        // Different colors for different lane types
        if (d.kind === 'TANKER') {
          return [255, 140, 0, 25]; // Orange glow for tankers
        }
        if (d.kind === 'CHOKEPOINT') {
          return [255, 50, 50, 30]; // Red glow for chokepoints
        }
        return [NAVAL_RGB[0], NAVAL_RGB[1], NAVAL_RGB[2], 20]; // Subtle blue glow
      },
      getWidth: (d: MaritimeLane): number => {
        if (d.kind === 'TANKER') return 6; // Wider glow for tankers
        if (d.kind === 'CHOKEPOINT') return 8; // Widest for chokepoints
        return 5; // Default glow width
      },
      widthUnits: 'pixels',
      rounded: true,
      pickable: false,
    });

    // OPTIMIZED: Clean, flat maritime lanes with smooth workflow-style animation
    const maritimeLaneCore = showMaritime && tradeLanes.length > 0 && new PathLayer<MaritimeLane>({
      id: 'maritime-lanes',
      data: tradeLanes,
      getPath: d => d.path,
      getColor: (d: MaritimeLane): RGBA => {
        // Color-coded by lane type
        if (d.kind === 'TANKER') {
          return [255, 140, 0, isSatellite ? 200 : 160]; // Orange for tankers
        }
        if (d.kind === 'CHOKEPOINT') {
          return [255, 80, 80, isSatellite ? 220 : 180]; // Red for chokepoints
        }
        if (d.kind === 'CONTAINER') {
          return [100, 180, 255, isSatellite ? 200 : 160]; // Light blue for containers
        }
        return [NAVAL_RGB[0], NAVAL_RGB[1], NAVAL_RGB[2], isSatellite ? 180 : 140]; // Default blue
      },
      getWidth: (d: MaritimeLane): number => {
        // Fixed widths - no pulsing for clean look
        if (d.kind === 'TANKER') return 3; // Thicker for tankers
        if (d.kind === 'CHOKEPOINT') return 4; // Thickest for chokepoints
        if (d.kind === 'CONTAINER') return 2.5; // Medium for containers
        return 2; // Thin for mixed/other
      },
      widthUnits: 'pixels',
      rounded: true,
      pickable: true,
      autoHighlight: true,
      // No pulsing animation - clean and stable
    });

    // OPTIMIZED: Smooth workflow-style flow animation along shipping lanes
    const laneFlowDots = showMaritime && tradeLanes.length > 0
      ? tradeLanes.flatMap((lane) => {
          if (lane.path.length < 2) return [];
          const phase = stringPhase(lane.id);
          
          // More dots for smoother animation
          const markerCount = lane.kind === 'TANKER' ? 5 : 4;
          
          return Array.from({ length: markerCount }, (_, i) => {
            const offset = (i / markerCount) * Math.PI * 2;
            // Slower, smoother animation like workflow diagrams
            const u = (Math.sin(pulseTime * 0.8 + phase + offset) + 1) / 2;
            const idx = Math.min(lane.path.length - 1, Math.floor(u * (lane.path.length - 1)));
            return {
              id: `sea-flow-${lane.id}-${i}`,
              position: lane.path[idx],
              t: (i + 1) / markerCount,
              laneType: lane.kind,
            };
          });
        })
      : [];

    const maritimeFlowLayer = laneFlowDots.length > 0 && new ScatterplotLayer<(typeof laneFlowDots)[0]>({
      id: 'maritime-lane-flow',
      data: laneFlowDots,
      getPosition: d => d.position,
      getRadius: (d): number => {
        // Smaller, more subtle flow indicators
        if (d.laneType === 'TANKER') return 800; // Slightly larger for tankers
        if (d.laneType === 'CHOKEPOINT') return 600; // Medium for chokepoints
        return 500; // Small for others
      },
      getFillColor: (d): RGBA => {
        // Match lane colors with transparency
        if (d.laneType === 'TANKER') {
          return [255, 140, 0, 180]; // Orange
        }
        if (d.laneType === 'CHOKEPOINT') {
          return [255, 80, 80, 200]; // Red
        }
        if (d.laneType === 'CONTAINER') {
          return [100, 180, 255, 160]; // Light blue
        }
        return [NAVAL_RGB[0], NAVAL_RGB[1], NAVAL_RGB[2], 140]; // Default blue
      },
      stroked: false, // Clean dots without borders
      pickable: false,
      updateTriggers: { 
        getPosition: [pulseTime], // Smooth position updates
      },
    });

    const maritimeVesselLayer = showMaritime && tradeVessels.length > 0 && new IconLayer<MaritimeVessel>({
      id: 'maritime-vessels',
      data: tradeVessels,
      getPosition: d => d.position,
      getIcon: () => 'ship',
      getSize: () => 36,
      getAngle: d => -(d.cog ?? 0),
      getColor: (): RGBA => [NAVAL_RGB[0], NAVAL_RGB[1], NAVAL_RGB[2], 255],
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <g id="ship">
            <path d="M64 18 L92 52 L88 98 L40 98 L36 52 Z" fill="white" stroke="rgba(0,0,0,0.45)" stroke-width="2"/>
            <path d="M52 52 L76 52 L64 28 Z" fill="rgba(0,0,0,0.2)"/>
          </g>
        </svg>
      `),
      iconMapping: { ship: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 } },
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getAngle: [tradeVessels.map(v => v.cog).join(',')] },
    });

    // ═══════════════════════════════════════════════════════════
    // MOROCCO INTELLIGENCE LAYER
    // ═══════════════════════════════════════════════════════════
    // Morocco layers are created outside useMemo and passed in

    const layers = [
      heatLayer,
      zoneLayer,
      strikeLayer,
      missileLayer,
      targetLayer,
      assetLayer,
      cyberThreatLayer,
      fireLayer,
      relationshipGlowLayer,
      relationshipLayer,
      relationshipLabels,
      cityLayer,
      targetLabels,
      assetLabels,
      cityLabels,
      maritimeLaneGlow,
      maritimeLaneCore,
      maritimeFlowLayer,
      maritimeVesselLayer,
      ...(showMoroccoLayer ? moroccoLayers : []),
    ].filter(Boolean);

    return layers as Layer[];
  }, [filtered, actorMeta, activeStory, selectedItem, viewState, isSatellite, isMobile, showAllLabels, showFlights, showEvents, showCyberThreats, showMaritime, pulseTime, cyberThreats, showMoroccoLayer, moroccoLayers]);
}

// Re-export so tooltip handler can share STATUS_META without another import
export { STATUS_META };
