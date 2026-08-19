'use client';

import { useEffect, useMemo, useState } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import type { Layer, MapViewState } from '@deck.gl/core';
import { ArcLayer, IconLayer, PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';

import type { SelectedItem } from '@/features/map/components/types';
import { selectVisibleLabels } from '@/features/map/lib/label-visibility';

import type { DisinfoEdge, DisinfoNode } from '@/shared/hooks/use-live-disinformation';

import type { Asset, CyberThreat, HeatPoint, MaritimeLane, MaritimeVessel, MissileTrack, NewsPulse, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import { NAVAL_RGB, STATUS_META } from '@/data/map-tokens';
import type { OpenSkyFlight } from '@/server/lib/api-clients/adsbfi-client';
import type { MapStory } from '@/types/domain';

import { useAppSelector } from '@/shared/state';

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
  showZones?: boolean;
  showCyberThreats?: boolean;
  showMaritime?: boolean;
  moroccoIntelligence?: MoroccoIntelPayload | null;
  showMoroccoLayer?: boolean;
  selectedEventId?: string | null;
  globalFlights?: OpenSkyFlight[];
  showDisinfo?: boolean;
  disinfo?: { edges: DisinfoEdge[]; nodes: DisinfoNode[] } | null;
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
  showZones = true,
  showCyberThreats = true,
  showMaritime = false,
  moroccoIntelligence = null,
  showMoroccoLayer = false,
  selectedEventId = null,
  globalFlights = [],
  showDisinfo = false,
  disinfo = null,
}: Props): Layer[] {
   const cyberThreats = (filtered as any).cyberThreats || [];
   const reduxNewsPulses = useAppSelector(s => s.newsPulses.pulses);
   const allNewsPulses = useMemo(() => {
     const server = (filtered as any).newsPulses || [];
     return [...server, ...reduxNewsPulses];
   }, [filtered, reduxNewsPulses]);
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
    const zoneLayer = showZones && filtered.zones.length > 0 && new PolygonLayer<ThreatZone>({
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

    // Target labels
    const targetLabels = showAllLabels && !isMobile && filtered.targets.length > 0 && new TextLayer<Target>({
      id: 'target-labels',
      data: filtered.targets,
      getPosition: (d: Target): [number, number] => d.position,
      getText: (d: Target): string => d.name,
      getSize: isSatellite ? baseLabelSize + 1 : baseLabelSize,
      getColor: (d: Target): RGBA => {
        const c = actorColor(d.actor);
        return [c[0], c[1], c[2], 255];
      },
      getPixelOffset: (): [number, number] => [0, 16],
      fontFamily: 'SFMono-Regular, Menlo, monospace',
      fontWeight: 600,
      background: true,
      getBackgroundColor: (): RGBA => labelBg,
      backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      pickable: true,
      autoHighlight: true,
      updateTriggers: { getColor: [isSatellite], getBackgroundColor: [isSatellite] },
    });

    // Transform OpenSkyFlights / InterpolatedFlights into rich Asset format on the fly
    const flightAssets: (Asset & { contrailPath?: [number, number][]; category?: string; speedKnots?: number; flightLevel?: string })[] = globalFlights.map((f: any) => {
      let actor = 'unknown';
      const country = (f.origin_country || '').toLowerCase();
      if (country.includes('united states') || country.includes('usa')) actor = 'us';
      else if (country.includes('israel')) actor = 'israel';
      else if (country.includes('iran')) actor = 'iran';
      else if (country.includes('russia')) actor = 'russia';
      else if (country.includes('china')) actor = 'china';
      else if (country.includes('morocco')) actor = 'morocco';

      const altM = f.baro_altitude || f.geo_altitude || 0;
      const altFt = f.altitudeFt || Math.round(altM * 3.28084);
      const fl = f.flightLevel || (altFt > 0 ? `FL${Math.round(altFt / 100)}` : 'GND');
      const spd = f.speedKnots || (f.velocity ? Math.round(f.velocity) : 450);

      const pos: [number, number] = f.currentPosition || [f.longitude!, f.latitude!];

      return {
        id: `flight-${f.icao24}`,
        sourceEventId: null,
        actor: actor as any,
        priority: altFt > 30000 ? 'P2' : 'P3',
        category: 'INSTALLATION',
        type: 'AIRCRAFT',
        status: 'ACTIVE',
        name: f.callsign?.trim() || f.icao24,
        position: pos,
        heading: f.true_track || 0,
        description: `${f.origin_country} - ${fl} (${Math.round(altM)}m), Speed: ${spd}kn`,
        contrailPath: f.contrailPath,
        speedKnots: spd,
        flightLevel: fl,
      };
    });

    // Combine any non-flight assets from the map engine with live flights
    const allAssets = [...filtered.assets, ...flightAssets];

    // High-tech Aircraft Icon Atlas (512x256)
    const AIRCRAFT_ATLAS_SVG = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="512" height="256" viewBox="0 0 512 256" xmlns="http://www.w3.org/2000/svg">
        <!-- AIRLINER (0, 0) -->
        <g id="airliner" transform="translate(0, 0)">
          <!-- Swept-wing Commercial Jet -->
          <path d="M64 12 L70 42 L112 70 L112 78 L70 66 L70 102 L86 114 L86 120 L64 116 L42 120 L42 114 L58 102 L58 66 L16 78 L16 70 L58 42 Z" 
                fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
          <!-- Engines -->
          <rect x="78" y="62" width="5" height="12" rx="2" fill="#333"/>
          <rect x="45" y="62" width="5" height="12" rx="2" fill="#333"/>
        </g>
        <!-- FIGHTER (128, 0) -->
        <g id="fighter" transform="translate(128, 0)">
          <!-- Stealth Fighter / Interceptor -->
          <path d="M64 10 L70 38 L98 78 L98 86 L74 76 L74 106 L86 116 L86 122 L64 116 L42 122 L42 116 L54 106 L54 76 L30 86 L30 78 L58 38 Z" 
                fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <!-- Twin Tail Fins -->
          <polygon points="64,30 67,48 61,48" fill="#333"/>
          <!-- Afterburner Glow -->
          <circle cx="64" cy="116" r="3" fill="#ff4400"/>
        </g>
        <!-- HEAVY TRANSPORT / TANKER (256, 0) -->
        <g id="heavy" transform="translate(256, 0)">
          <!-- High-Wing Strategic Transport (C-17 / Tanker) -->
          <path d="M64 10 L72 36 L118 64 L118 74 L72 66 L72 104 L88 114 L88 122 L64 116 L40 122 L40 114 L56 104 L56 66 L10 74 L10 64 L56 36 Z" 
                fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <!-- 4 Turbofan Engines -->
          <rect x="82" y="58" width="4" height="10" rx="1" fill="#333"/>
          <rect x="96" y="62" width="4" height="10" rx="1" fill="#333"/>
          <rect x="42" y="58" width="4" height="10" rx="1" fill="#333"/>
          <rect x="28" y="62" width="4" height="10" rx="1" fill="#333"/>
        </g>
        <!-- UAV / REAPER DRONE (384, 0) -->
        <g id="uav" transform="translate(384, 0)">
          <!-- High-Aspect Glider Wing Drone -->
          <path d="M64 18 L68 46 L122 52 L122 56 L68 56 L68 108 L78 118 L78 122 L64 116 L50 122 L50 118 L60 108 L60 56 L6 56 L6 52 L60 46 Z" 
                fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="1.8"/>
          <!-- Sensor Ball Turret Nose -->
          <circle cx="64" cy="18" r="4" fill="#00e5ff"/>
          <!-- Pusher Propeller -->
          <line x1="58" y1="116" x2="70" y2="116" stroke="#ff8800" stroke-width="2"/>
        </g>
        <!-- CARRIER (0, 128) -->
        <g id="carrier" transform="translate(0, 128)">
          <rect x="52" y="16" width="24" height="96" rx="3" fill="#444" stroke="white" stroke-width="2"/>
          <rect x="56" y="20" width="16" height="88" fill="#333"/>
          <line x1="70" y1="24" x2="56" y2="96" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-dasharray="3,3"/>
        </g>
        <!-- HELICOPTER (128, 128) -->
        <g id="helicopter" transform="translate(128, 128)">
          <ellipse cx="64" cy="54" rx="12" ry="24" fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
          <line x1="64" y1="78" x2="64" y2="118" stroke="white" stroke-width="3"/>
          <line x1="58" y1="116" x2="70" y2="116" stroke="white" stroke-width="2"/>
          <!-- Rotor Blades -->
          <line x1="16" y1="54" x2="112" y2="54" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
          <line x1="64" y1="6" x2="64" y2="102" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
          <circle cx="64" cy="54" r="3" fill="#222"/>
        </g>
        <!-- AIRPLANE DEFAULT (256, 128) -->
        <g id="airplane" transform="translate(256, 128)">
          <path d="M64 20 L68 50 L88 64 L88 70 L68 62 L68 96 L76 106 L76 110 L64 106 L52 110 L52 106 L60 96 L60 62 L40 70 L40 64 L60 50 Z" 
                fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
        </g>
      </svg>
    `);

    const getAircraftIconName = (d: Asset): string => {
      if (d.type === 'CARRIER') return 'carrier';
      const name = (d.name || '').toUpperCase();
      const desc = (d.description || '').toUpperCase();

      if (name.startsWith('PYTHON') || name.startsWith('VIPER') || name.startsWith('IAF') || name.startsWith('F-') || desc.includes('FIGHTER')) {
        return 'fighter';
      }
      if (name.startsWith('REAPER') || desc.includes('UAV') || desc.includes('DRONE')) {
        return 'uav';
      }
      if (name.startsWith('RCH') || name.startsWith('SENTRY') || name.startsWith('SHELL') || name.startsWith('CNA') || desc.includes('TRANSPORT') || desc.includes('TANKER')) {
        return 'heavy';
      }
      if (desc.includes('ROTOR') || desc.includes('HELICOPTER')) {
        return 'helicopter';
      }
      return 'airliner';
    };

    const getAircraftColor = (d: Asset): RGBA => {
      const name = (d.name || '').toUpperCase();
      const desc = (d.description || '').toUpperCase();

      if (name.startsWith('PYTHON') || name.startsWith('VIPER') || name.startsWith('IAF') || desc.includes('FIGHTER')) {
        return [255, 75, 75, 255]; // Tactical Red
      }
      if (name.startsWith('REAPER') || desc.includes('UAV')) {
        return [0, 230, 255, 255]; // Cyber Cyan
      }
      if (name.startsWith('SENTRY') || name.startsWith('SHELL') || desc.includes('AWACS') || desc.includes('TANKER')) {
        return [255, 190, 40, 255]; // Amber Gold
      }
      if (d.actor === 'us') return [100, 180, 255, 255];
      if (d.actor === 'morocco') return [50, 220, 150, 255];
      return [240, 240, 255, 255]; // Bright white for airliners
    };

    // Dynamic vapor contrail paths for high-altitude aircraft
    const flightContrailsData = showFlights ? flightAssets.filter(f => f.contrailPath && f.contrailPath.length > 1) : [];
    const flightContrailLayer = flightContrailsData.length > 0 && new PathLayer({
      id: 'flight-contrails',
      data: flightContrailsData,
      getPath: (d: any) => d.contrailPath,
      getColor: (): RGBA => [160, 200, 255, 80],
      getWidth: 2.5,
      widthUnits: 'pixels',
      rounded: true,
      pickable: false,
      updateTriggers: {
        getPath: [flightContrailsData.map(f => f.contrailPath?.length).join(',')],
      },
    });

    // Asset layer with modern SVG aircraft icons
    const assetLayer = showFlights && allAssets.length > 0 && new IconLayer<Asset>({
      id: 'assets',
      data: allAssets,
      getPosition: (d: Asset): [number, number] => d.position,
      getIcon: (d: Asset) => getAircraftIconName(d),
      getSize: (d: Asset): number => (d.type === 'CARRIER' ? 52 : 38),
      getAngle: (d: Asset): number => -(d.heading || 0),
      getColor: (d: Asset): RGBA => {
        if (dimActive && !(mergedActiveStory?.highlightAssetIds ?? []).includes(d.id)) {
          return [140, 150, 170, DIM];
        }
        return getAircraftColor(d);
      },
      iconAtlas: AIRCRAFT_ATLAS_SVG,
      iconMapping: {
        airliner:   { x: 0,   y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        fighter:    { x: 128, y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        heavy:      { x: 256, y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        uav:        { x: 384, y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        carrier:    { x: 0,   y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
        helicopter: { x: 128, y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
        airplane:   { x: 256, y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getColor: [mergedActiveStory?.id, isSatellite],
        getAngle: [allAssets.map(a => a.heading).join(',')],
        getPosition: [allAssets.map(a => a.position.join(',')).join('|')],
      },
    });

    // Asset labels (show callsigns + altitude for flights)
    const assetLabelsData = !isMobile && showFlights ? allAssets : [];
    const assetLabels = assetLabelsData.length > 0 && new TextLayer<any>({
      id: 'asset-labels',
      data: assetLabelsData,
      getPosition: (d: any): [number, number] => d.position,
      getText: (d: any): string => {
        const fl = d.flightLevel ? ` · ${d.flightLevel}` : '';
        const spd = d.speedKnots ? ` · ${d.speedKnots}kn` : '';
        return `${d.name}${fl}${spd}`;
      },
      getSize: textToken('--text-tiny', 9),
      getColor: (d: any): RGBA => {
        const c = getAircraftColor(d);
        return [c[0], c[1], c[2], 230];
      },
      getPixelOffset: (): [number, number] => [0, -24],
      fontFamily: 'SFMono-Regular, Menlo, monospace',
      fontWeight: 700,
      background: true,
      getBackgroundColor: (): RGBA => labelBg,
      backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getPosition: [allAssets.map(a => a.position.join(',')).join('|')],
      },
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
    
    // Helper function to get color by relationship type - OPTIMIZED for visual hierarchy
    const getRelationshipColor = (type: string, isSource: boolean): RGBA => {
      const alpha = isSource ? 180 : 140; // Reduced opacity for subtlety
      const alphaTarget = isSource ? 140 : 100;
      
      switch (type) {
        case 'MILITARY_CONFLICT':
          return isSource ? [255, 60, 60, alpha] : [255, 120, 120, alphaTarget]; // Bright red for conflicts
        case 'WAR_ALERT':
          return isSource ? [255, 40, 40, alpha] : [255, 80, 80, alphaTarget]; // Crimson pulsing for coming war
        case 'DIPLOMATIC_TENSION':
          return isSource ? [255, 180, 0, alpha] : [255, 200, 80, alphaTarget]; // Orange for tensions
        case 'MILITARY_DEPLOYMENT':
          return isSource ? [255, 90, 90, alpha] : [255, 150, 150, alphaTarget]; // Red for deployments
        case 'BORDER_CLOSURE':
          return isSource ? [180, 50, 50, alpha] : [220, 100, 100, alphaTarget]; // Dark red for closures
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
        case 'LOGISTICS_CRISIS':
          return isSource ? [255, 100, 0, alpha] : [255, 150, 50, alphaTarget]; // Orange-red for logistics
        case 'LOGISTICS_PLAN':
          return isSource ? [50, 220, 180, alpha] : [100, 240, 210, alphaTarget]; // Cyan-green for new plans
        case 'CEASEFIRE':
          return isSource ? [80, 220, 80, alpha] : [140, 240, 140, alphaTarget]; // Bright green for ceasefire
        case 'DIPLOMATIC_AGREEMENT':
          return isSource ? [140, 220, 120, alpha] : [180, 240, 160, alphaTarget]; // Soft green for deals
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
        // Add pulsing effect for military conflicts, war alerts and deployments
        if (['MILITARY_CONFLICT', 'WAR_ALERT', 'MILITARY_DEPLOYMENT', 'BORDER_CLOSURE'].includes(d.type)) {
          const pulse = Math.sin(pulseTime * 1.5) * 0.2 + 0.8;
          return [baseColor[0], baseColor[1], baseColor[2], Math.floor(baseColor[3] * pulse)];
        }
        return baseColor;
      },
      getTargetColor: (d: any): RGBA => {
        const baseColor = getRelationshipColor(d.type, false);
        // Add pulsing effect ONLY for military conflicts
        if (['MILITARY_CONFLICT', 'WAR_ALERT', 'MILITARY_DEPLOYMENT', 'BORDER_CLOSURE'].includes(d.type)) {
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
        if (d.type === 'ENERGY_DEPENDENCY' || d.type === 'SUPPLY_CHAIN' || d.type === 'MIGRATION_FLOW') {
          return 2.0; // Slightly thicker for energy/supply/migration
        }
        if (['LOGISTICS_CRISIS', 'LOGISTICS_PLAN'].includes(d.type)) {
          return 2.5; // Medium-thick for logistics
        }
        if (d.type === 'ALLIANCE' || d.type === 'CEASEFIRE' || d.type === 'DIPLOMATIC_AGREEMENT') {
          return 2.5; // Medium for alliances & deals
        }
        if (['MILITARY_CONFLICT', 'WAR_ALERT', 'MILITARY_DEPLOYMENT', 'BORDER_CLOSURE'].includes(d.type)) {
          // Subtle pulsing width for active/threatened conflicts only
          const pulse = Math.sin(pulseTime * 1.5) * 0.3 + 1;
          return Math.max(3, Math.min(6, 3.0 * pulse + (d.intensity || 0) * 0.2)); // Thickest for conflicts
        }
        return Math.max(1.5, 2.0 + (d.intensity || 0) * 0.15); // Default
      },
      getHeight: (d: any): number => {
        // COMPLETELY FLAT for trade and shipping - NO 3D arc
        if (['TRADE_ROUTE', 'ECONOMIC_PARTNERSHIP', 'ENERGY_DEPENDENCY', 'MIGRATION_FLOW', 'SUPPLY_CHAIN'].includes(d.type)) {
          return 0; // ZERO height = completely flat line
        }
        if (['LOGISTICS_CRISIS', 'LOGISTICS_PLAN'].includes(d.type)) {
          return 0.05; // Nearly flat for logistics
        }
        if (['ALLIANCE', 'CEASEFIRE', 'DIPLOMATIC_AGREEMENT', 'DIPLOMATIC_TENSION'].includes(d.type)) {
          return 0.05; // Nearly flat for alliances/deals
        }
        if (['MILITARY_CONFLICT', 'WAR_ALERT', 'MILITARY_DEPLOYMENT', 'BORDER_CLOSURE'].includes(d.type)) {
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

    // REFINED: Subtle glow effect for active/threatened conflicts and energy
    const relationshipGlowLayer = relationships.length > 0 && new ArcLayer<any>({
      id: 'relationship-glow',
      data: relationships.filter((d: any) =>
        ['MILITARY_CONFLICT', 'WAR_ALERT', 'MILITARY_DEPLOYMENT', 'BORDER_CLOSURE', 'LOGISTICS_CRISIS', 'ENERGY_DEPENDENCY'].includes(d.type),
      ),
      getSourcePosition: (d: any): [number, number] => d.sourcePosition,
      getTargetPosition: (d: any): [number, number] => d.targetPosition,
      getSourceColor: (d: any): RGBA => {
        const [r, g, b] = getRelationshipColor(d.type, true);
        return [r, g, b, 45]; // Soft halo under conflict arcs
      },
      getTargetColor: (d: any): RGBA => {
        const [r, g, b] = getRelationshipColor(d.type, false);
        return [r, g, b, 32];
      },
      getWidth: (d: any): number => {
        if (['MILITARY_CONFLICT', 'WAR_ALERT'].includes(d.type)) {
          return 7; // Wider glow for conflicts
        }
        return 5; // Subtle glow for others
      },
      getHeight: (d: any): number => {
        // Match main layer heights
        if (['ENERGY_DEPENDENCY', 'LOGISTICS_CRISIS', 'LOGISTICS_PLAN'].includes(d.type)) {
          return 0; // Completely flat
        }
        if (['MILITARY_CONFLICT', 'WAR_ALERT', 'MILITARY_DEPLOYMENT', 'BORDER_CLOSURE'].includes(d.type)) {
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

    // Midpoint relationship-type badges on each arc
    const REL_BADGES: Record<string, string> = {
      MILITARY_CONFLICT: '⚔ CONFLICT',
      WAR_ALERT: '⚠ WAR ALERT',
      DIPLOMATIC_TENSION: 'TENSION',
      MILITARY_DEPLOYMENT: 'DEPLOY',
      BORDER_CLOSURE: 'BORDER',
      LOGISTICS_CRISIS: 'LOGISTICS',
      LOGISTICS_PLAN: 'LOGISTICS',
      CEASEFIRE: 'CEASEFIRE',
      DIPLOMATIC_AGREEMENT: 'AGREEMENT',
      TRADE_ROUTE: 'TRADE',
      ECONOMIC_PARTNERSHIP: 'ECON',
      ALLIANCE: 'ALLIANCE',
      SUPPLY_CHAIN: 'SUPPLY',
      ENERGY_DEPENDENCY: 'ENERGY',
      MIGRATION_FLOW: 'MIGRATION',
    };
    const relationshipMidLabels = relationships.length > 0 && new TextLayer<any>({
      id: 'relationship-mid-labels',
      data: relationships.map((r: any) => ({
        position: [
          (r.sourcePosition[0] + r.targetPosition[0]) / 2,
          (r.sourcePosition[1] + r.targetPosition[1]) / 2,
        ],
        text: REL_BADGES[r.type] ?? r.type.replace(/_/g, ' '),
        color: getRelationshipColor(r.type, true),
      })),
      getPosition: (d: any): [number, number] => d.position,
      getText: (d: any): string => d.text,
      getSize: 9,
      getColor: (d: any): RGBA => [d.color[0], d.color[1], d.color[2], 220],
      getPixelOffset: [0, 18],
      fontFamily: 'monospace',
      fontWeight: 'bold',
      background: true,
      getBackgroundColor: [8, 8, 12, 190],
      backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      billboard: true,
      pickable: false,
    });

    // Logistics crises - pulsing danger markers at disrupted hubs
    const logisticsCrises = (filtered as any).logisticsCrises || [];
    const logisticsCrisisLayer = logisticsCrises.length > 0 && new IconLayer<any>({
      id: 'logistics-crises',
      data: logisticsCrises,
      getPosition: (d: any): [number, number] => d.position,
      getIcon: () => 'crisis',
      getSize: 44,
      getColor: (d: any): RGBA => {
        const isCritical = d.severity === 'CRITICAL';
        if (isCritical) {
          const pulse = Math.sin(pulseTime * 1.5) * 0.2 + 0.8;
          return [255, 100, 0, Math.floor(230 * pulse)];
        }
        return [255, 160, 60, 210];
      },
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <g id="crisis">
            <path d="M64 10 L118 108 L10 108 Z" fill="currentColor" opacity="0.35" stroke="currentColor" stroke-width="3"/>
            <path d="M64 45 L72 85 L56 85 Z" fill="currentColor"/>
            <rect x="61" y="52" width="6" height="20" fill="white"/>
            <rect x="61" y="76" width="6" height="4" fill="white"/>
          </g>
        </svg>
      `),
      iconMapping: {
        crisis: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getColor: [pulseTime],
      },
    });

    // Investment flows - teal markers at economic hubs
    const investmentFlows = (filtered as any).investmentFlows || [];
    const investmentFlowLayer = investmentFlows.length > 0 && new IconLayer<any>({
      id: 'investment-flows',
      data: investmentFlows,
      getPosition: (d: any): [number, number] => d.position,
      getIcon: () => 'invest',
      getSize: 36,
      getColor: (d: any): RGBA => {
        if (d.type === 'AID') return [40, 200, 160, 230];
        if (d.type === 'INFRASTRUCTURE') return [60, 190, 220, 230];
        if (d.type === 'TRADE_DEAL') return [80, 200, 120, 230];
        return [40, 160, 120, 210];
      },
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
          <g id="invest">
            <path d="M64 18 L96 52 L78 52 L78 96 L50 96 L50 52 L32 52 Z" fill="currentColor" opacity="0.85"/>
            <rect x="42" y="20" width="44" height="6" rx="3" fill="white"/>
          </g>
        </svg>
      `),
      iconMapping: {
        invest: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getColor: [],
      },
    });

     // News pulses — pulsing red markers for every new news article
     const newsPulses = allNewsPulses;
     const newsPulseLayer = newsPulses.length > 0 && new IconLayer<any>({
       id: 'news-pulses',
       data: newsPulses,
       getPosition: (d: any): [number, number] => d.position,
       getIcon: () => 'pulse',
       getSize: (d: any): number => 48 + Math.sin(Date.now() / 600 + d.id.length) * 16,
       getColor: (d: any): RGBA => {
         const pos = d.position;
         if (!pos) return [255, 60, 60, 200];
         return [255, 50, 50, 230];
       },
       iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
         <svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
           <g id="pulse">
             <circle cx="64" cy="64" r="30" fill="currentColor" opacity="0.9"/>
             <circle cx="64" cy="64" r="18" fill="white" opacity="0.7"/>
             <path d="M64 20 L64 108 M20 64 L108 64" stroke="currentColor" stroke-width="3" opacity="0.5"/>
           </g>
         </svg>
       `),
       iconMapping: {
         pulse: { x: 0, y: 0, width: 128, height: 128, anchorY: 64, anchorX: 64 },
       },
       pickable: true,
       autoHighlight: true,
       updateTriggers: {
         getSize: [],
         getColor: [],
       },
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

    // Modern vessel icon atlas with high-fidelity naval warships, carriers, submarines, mega-containers, supertankers, and frigates
    const VESSEL_ATLAS_SVG = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="512" height="256" viewBox="0 0 512 256" xmlns="http://www.w3.org/2000/svg">
        <!-- CARRIER (0, 0) -->
        <g id="carrier" transform="translate(0, 0)">
          <path d="M48 10 L80 10 L88 28 L86 118 L42 118 L40 28 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <path d="M72 16 L48 112" stroke="rgba(0,0,0,0.4)" stroke-width="2.5" stroke-dasharray="4,3"/>
          <path d="M64 12 L64 116" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>
          <rect x="76" y="52" width="8" height="24" rx="2" fill="#222" stroke="white" stroke-width="1"/>
          <line x1="56" y1="12" x2="56" y2="40" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>
        </g>
        <!-- DESTROYER (128, 0) -->
        <g id="destroyer" transform="translate(128, 0)">
          <path d="M64 14 L76 42 L74 112 L54 112 L52 42 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <circle cx="64" cy="36" r="4.5" fill="#333" stroke="white" stroke-width="1"/>
          <line x1="64" y1="36" x2="64" y2="25" stroke="#222" stroke-width="2"/>
          <polygon points="64,48 71,58 57,58" fill="#333"/>
          <rect x="59" y="66" width="10" height="16" fill="#555" rx="1"/>
          <circle cx="64" cy="98" r="6" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="1.5"/>
          <text x="64" y="101" font-size="7" font-weight="bold" text-anchor="middle" fill="rgba(0,0,0,0.6)">H</text>
        </g>
        <!-- SUBMARINE (256, 0) -->
        <g id="submarine" transform="translate(256, 0)">
          <path d="M64 16 C74 26 74 100 64 114 C54 100 54 26 64 16 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <rect x="61" y="46" width="6" height="24" rx="3" fill="#222" stroke="white" stroke-width="1"/>
          <line x1="50" y1="58" x2="78" y2="58" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <line x1="52" y1="108" x2="76" y2="108" stroke="white" stroke-width="2"/>
        </g>
        <!-- CONTAINER (384, 0) -->
        <g id="container" transform="translate(384, 0)">
          <path d="M64 12 L82 32 L82 114 L46 114 L46 32 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <rect x="50" y="32" width="28" height="12" fill="#3b82f6" stroke="rgba(0,0,0,0.4)"/>
          <rect x="50" y="46" width="28" height="12" fill="#ef4444" stroke="rgba(0,0,0,0.4)"/>
          <rect x="50" y="60" width="28" height="12" fill="#10b981" stroke="rgba(0,0,0,0.4)"/>
          <rect x="50" y="74" width="28" height="12" fill="#f59e0b" stroke="rgba(0,0,0,0.4)"/>
          <rect x="48" y="90" width="32" height="10" rx="1" fill="#1e293b" stroke="white" stroke-width="1"/>
        </g>
        <!-- TANKER / LNG (0, 128) -->
        <g id="tanker" transform="translate(0, 128)">
          <path d="M64 12 C78 20 80 34 80 114 L48 114 C48 34 50 20 64 12 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <circle cx="64" cy="36" r="8" fill="#f97316" stroke="white" stroke-width="1"/>
          <circle cx="64" cy="56" r="8" fill="#f97316" stroke="white" stroke-width="1"/>
          <circle cx="64" cy="76" r="8" fill="#f97316" stroke="white" stroke-width="1"/>
          <line x1="64" y1="26" x2="64" y2="86" stroke="#222" stroke-width="1.5"/>
          <rect x="52" y="96" width="24" height="10" rx="1" fill="#1e293b" stroke="white" stroke-width="1"/>
        </g>
        <!-- FRIGATE (128, 128) -->
        <g id="frigate" transform="translate(128, 128)">
          <path d="M64 16 L74 38 L72 112 L56 112 L54 38 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <circle cx="64" cy="34" r="3.5" fill="#333" stroke="white" stroke-width="1"/>
          <polygon points="64,46 70,54 58,54" fill="#333"/>
          <circle cx="64" cy="98" r="5" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="1.2"/>
        </g>
        <!-- PATROL (256, 128) -->
        <g id="patrol" transform="translate(256, 128)">
          <path d="M64 20 L74 44 L70 108 L58 108 L54 44 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <circle cx="64" cy="40" r="3" fill="#333"/>
          <rect x="60" y="52" width="8" height="16" rx="2" fill="#222"/>
        </g>
        <!-- SHIP / GENERAL (384, 128) -->
        <g id="ship" transform="translate(384, 128)">
          <path d="M64 18 L84 48 L80 110 L48 110 L44 48 Z" fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
          <path d="M54 50 L74 50 L64 28 Z" fill="rgba(0,0,0,0.2)"/>
          <rect x="52" y="78" width="24" height="16" rx="2" fill="#333"/>
        </g>
      </svg>
    `);

    const getVesselIcon = (d: MaritimeVessel): string => {
      const cat = d.category;
      if (cat === 'CARRIER') return 'carrier';
      if (cat === 'DESTROYER') return 'destroyer';
      if (cat === 'SUBMARINE') return 'submarine';
      if (cat === 'FRIGATE') return 'frigate';
      if (cat === 'CONTAINER' || cat === 'CARGO') return 'container';
      if (cat === 'TANKER') return 'tanker';
      if (cat === 'PATROL') return 'patrol';

      const type = (d.shipType || '').toLowerCase();
      if (type.includes('carrier')) return 'carrier';
      if (type.includes('destroyer')) return 'destroyer';
      if (type.includes('submarine')) return 'submarine';
      if (type.includes('frigate') || type.includes('corvette')) return 'frigate';
      if (type.includes('container') || type.includes('cargo')) return 'container';
      if (type.includes('tanker') || type.includes('lng') || type.includes('crude')) return 'tanker';
      if (type.includes('patrol') || type.includes('guard')) return 'patrol';
      return 'ship';
    };

    const getVesselColor = (d: MaritimeVessel): RGBA => {
      const cat = d.category;
      if (cat === 'CARRIER') return [255, 200, 50, 255]; // Gold
      if (cat === 'DESTROYER' || cat === 'FRIGATE' || cat === 'MILITARY') return [0, 220, 255, 255]; // High-tech Cyan
      if (cat === 'SUBMARINE') return [190, 120, 255, 255]; // Deep Violet
      if (cat === 'TANKER') return [255, 150, 30, 255]; // Tanker Amber
      if (cat === 'CONTAINER' || cat === 'CARGO') return [45, 212, 191, 255]; // Teal Emerald
      if (cat === 'PATROL') return [100, 200, 255, 255];
      return [140, 180, 230, 255];
    };

    const getVesselSize = (d: MaritimeVessel): number => {
      const cat = d.category;
      if (cat === 'CARRIER') return 52;
      if (cat === 'CONTAINER' || cat === 'TANKER') return 44;
      if (cat === 'DESTROYER') return 40;
      if (cat === 'FRIGATE' || cat === 'SUBMARINE') return 36;
      return 32;
    };

    // Modern vessel deck layer
    const maritimeVesselLayer = showMaritime && tradeVessels.length > 0 && new IconLayer<MaritimeVessel>({
      id: 'maritime-vessels',
      data: tradeVessels,
      getPosition: (d: MaritimeVessel): [number, number] => d.position,
      getIcon: (d: MaritimeVessel) => getVesselIcon(d),
      getSize: (d: MaritimeVessel) => getVesselSize(d),
      getAngle: (d: MaritimeVessel) => -(d.cog ?? 0),
      getColor: (d: MaritimeVessel): RGBA => getVesselColor(d),
      iconAtlas: VESSEL_ATLAS_SVG,
      iconMapping: {
        carrier:   { x: 0,   y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        destroyer: { x: 128, y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        submarine: { x: 256, y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        container: { x: 384, y: 0,   width: 128, height: 128, anchorY: 64, anchorX: 64 },
        tanker:    { x: 0,   y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
        frigate:   { x: 128, y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
        patrol:    { x: 256, y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
        ship:      { x: 384, y: 128, width: 128, height: 128, anchorY: 64, anchorX: 64 },
      },
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getAngle: [tradeVessels.map(v => v.cog).join(',')],
        getPosition: [tradeVessels.map(v => v.position.join(',')).join('|')],
      },
    });

    // Radar signature rings for military vessels & carrier strike groups
    const militaryVessels = tradeVessels.filter(v =>
      ['CARRIER', 'DESTROYER', 'FRIGATE', 'SUBMARINE', 'MILITARY'].includes(v.category || '')
    );

    const maritimeRadarRings = showMaritime && militaryVessels.length > 0 && new ScatterplotLayer<MaritimeVessel>({
      id: 'maritime-radar-rings',
      data: militaryVessels,
      getPosition: (d: MaritimeVessel): [number, number] => d.position,
      getRadius: (d: MaritimeVessel): number => {
        const isCarrier = d.category === 'CARRIER';
        const pulse = (pulseTime * 1.2) % (Math.PI * 2);
        const factor = Math.sin(pulse) * 0.35 + 1;
        return (isCarrier ? 35000 : 20000) * factor;
      },
      getFillColor: [0, 0, 0, 0],
      stroked: true,
      getLineColor: (d: MaritimeVessel): RGBA => {
        const isCarrier = d.category === 'CARRIER';
        const pulse = (pulseTime * 1.2) % (Math.PI * 2);
        const alpha = Math.floor(Math.max(20, (1 - pulse / (Math.PI * 2)) * 140));
        return isCarrier ? [255, 200, 50, alpha] : [0, 220, 255, alpha];
      },
      lineWidthMinPixels: 1.5,
      pickable: false,
      updateTriggers: {
        getRadius: [pulseTime],
        getLineColor: [pulseTime],
        getPosition: [militaryVessels.map(v => v.position.join(',')).join('|')],
      },
    });

    // Vessel callout labels (showing Name & Speed in Knots)
    const maritimeVesselLabels = showMaritime && !isMobile && tradeVessels.length > 0 && new TextLayer<MaritimeVessel>({
      id: 'maritime-vessel-labels',
      data: tradeVessels,
      getPosition: (d: MaritimeVessel): [number, number] => d.position,
      getText: (d: MaritimeVessel): string => {
        const sog = d.sog != null ? ` · ${Number(d.sog).toFixed(0)}kn` : '';
        return `${d.name}${sog}`;
      },
      getSize: textToken('--text-tiny', 9),
      getColor: (d: MaritimeVessel): RGBA => {
        const c = getVesselColor(d);
        return [c[0], c[1], c[2], 230];
      },
      getPixelOffset: (): [number, number] => [0, 22],
      fontFamily: 'SFMono-Regular, Menlo, monospace',
      fontWeight: 700,
      background: true,
      getBackgroundColor: [10, 14, 22, 200],
      backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      pickable: false,
      updateTriggers: {
        getPosition: [tradeVessels.map(v => v.position.join(',')).join('|')],
      },
    });

    // ═══════════════════════════════════════════════════════════
    // MOROCCO INTELLIGENCE LAYER
    // ═══════════════════════════════════════════════════════════
    // Morocco layers are created outside useMemo and passed in

    // Disinformation / bot network arcs (reported campaigns + observed bot sources)
    const disinfoLayer = showDisinfo && disinfo && disinfo.edges.length > 0 && new ArcLayer<DisinfoEdge>({
      id: 'disinfo-arcs',
      data: disinfo.edges,
      getSourcePosition: (d: DisinfoEdge): [number, number] => {
        const n = disinfo.nodes.find(x => x.code === d.source);
        return n ? [n.lon, n.lat] : [0, 0];
      },
      getTargetPosition: (d: DisinfoEdge): [number, number] => {
        const n = disinfo.nodes.find(x => x.code === d.target);
        return n ? [n.lon, n.lat] : [0, 0];
      },
      getSourceColor: (d: DisinfoEdge): RGBA =>
        d.kind === 'CAMPAIGN' ? [245, 158, 11, isSatellite ? 240 : 220] : [56, 189, 248, isSatellite ? 230 : 200],
      getTargetColor: (): RGBA => [255, 255, 255, isSatellite ? 200 : 160],
      getWidth: (d: DisinfoEdge): number => Math.min(1.5 + d.weight, 6),
      getHeight: 0.14,
      widthUnits: 'pixels',
      greatCircle: true,
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getSourceColor: [isSatellite],
        getTargetColor: [isSatellite],
      },
    });

    // Disinformation / bot network node volume
    const disinfoNodeLayer = showDisinfo && disinfo && disinfo.nodes.length > 0 && new ScatterplotLayer<DisinfoNode>({
      id: 'disinfo-nodes',
      data: disinfo.nodes.filter(n => n.campaignVolume + n.botVolume > 0),
      getPosition: (d: DisinfoNode): [number, number] => [d.lon, d.lat],
      getRadius: (d: DisinfoNode): number =>
        20000 + Math.min(220000, Math.sqrt(d.campaignVolume + d.botVolume) * 90000),
      getFillColor: (d: DisinfoNode): RGBA =>
        d.campaignVolume >= d.botVolume ? [245, 158, 11, 60] : [56, 189, 248, 60],
      stroked: true,
      getLineColor: (d: DisinfoNode): RGBA =>
        d.campaignVolume >= d.botVolume ? [245, 158, 11, 180] : [56, 189, 248, 160],
      lineWidthMinPixels: 1,
      pickable: true,
      autoHighlight: true,
      updateTriggers: {
        getFillColor: [isSatellite],
        getLineColor: [isSatellite],
      },
    });

    const layers = [
      heatLayer,
      zoneLayer,
      strikeLayer,
      missileLayer,
      targetLayer,
      flightContrailLayer,
      assetLayer,
      cyberThreatLayer,
      fireLayer,
      relationshipGlowLayer,
      relationshipLayer,
      relationshipLabels,
      relationshipMidLabels,
       logisticsCrisisLayer,
       investmentFlowLayer,
       newsPulseLayer,
       cityLayer,
      targetLabels,
      assetLabels,
      cityLabels,
      maritimeLaneGlow,
      maritimeLaneCore,
      maritimeFlowLayer,
      maritimeRadarRings,
      maritimeVesselLayer,
      maritimeVesselLabels,
      disinfoLayer,
      disinfoNodeLayer,
      ...(showMoroccoLayer ? moroccoLayers : []),
    ].filter(Boolean);

    return layers as Layer[];
   }, [filtered, actorMeta, activeStory, selectedItem, viewState, isSatellite, isMobile, showAllLabels, showFlights, showEvents, showZones, showCyberThreats, showMaritime, pulseTime, cyberThreats, showMoroccoLayer, moroccoLayers, globalFlights, allNewsPulses, showDisinfo, disinfo]);
}

// Re-export so tooltip handler can share STATUS_META without another import
export { STATUS_META };
