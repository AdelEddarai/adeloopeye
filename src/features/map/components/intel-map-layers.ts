'use client';

import { useMemo } from 'react';

import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ArcLayer, PolygonLayer, ScatterplotLayer, TextLayer, PathLayer, IconLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';

import type { MapDataResult } from '@/features/map/queries';

import type {
  Asset,
  HeatPoint,
  MissileTrack,
  StrikeArc,
  Target,
  ThreatZone,
} from '@/data/map-data';

import type { DisinfoEdge, DisinfoNode } from '@/shared/hooks/use-live-disinformation';

export type LayerVisibility = {
  strikes: boolean;
  missiles: boolean;
  targets: boolean;
  assets: boolean;
  flights: boolean;
  zones: boolean;
  heat: boolean;
  disinfo: boolean;
  relationships: boolean;
  maritime: boolean;
  labels: boolean;
};


export type DisinfoPayload = { edges: DisinfoEdge[]; nodes: DisinfoNode[] };

export type TooltipObject = StrikeArc | MissileTrack | Target | Asset | ThreatZone | HeatPoint;

const CONFLICT_TYPES = [
  'MILITARY_CONFLICT',
  'WAR_ALERT',
  'MILITARY_DEPLOYMENT',
  'BORDER_CLOSURE',
] as const;

const FLAT_TYPES = [
  'TRADE_ROUTE',
  'ECONOMIC_PARTNERSHIP',
  'ENERGY_DEPENDENCY',
  'MIGRATION_FLOW',
  'SUPPLY_CHAIN',
];

const REL_LABELS: Record<string, string> = {
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

function getRelationshipColor(type: string, isSource: boolean): [number, number, number, number] {
  const alpha = isSource ? 200 : 150;
  switch (type) {
    case 'MILITARY_CONFLICT':  return isSource ? [255, 60, 60, alpha] : [255, 120, 120, 130];
    case 'WAR_ALERT':          return isSource ? [255, 40, 40, alpha] : [255, 80, 80, 130];
    case 'DIPLOMATIC_TENSION': return isSource ? [255, 180, 0, alpha] : [255, 200, 80, 130];
    case 'MILITARY_DEPLOYMENT':return isSource ? [255, 90, 90, alpha] : [255, 150, 150, 130];
    case 'BORDER_CLOSURE':     return isSource ? [180, 50, 50, alpha] : [220, 100, 100, 130];
    case 'TRADE_ROUTE':        return isSource ? [80, 160, 220, alpha] : [120, 180, 240, 130];
    case 'ALLIANCE':           return isSource ? [80, 200, 120, alpha] : [120, 220, 160, 130];
    case 'SUPPLY_CHAIN':       return isSource ? [160, 120, 200, alpha] : [180, 140, 220, 130];
    case 'ENERGY_DEPENDENCY':  return isSource ? [220, 120, 40, alpha] : [240, 160, 80, 130];
    case 'MIGRATION_FLOW':     return isSource ? [120, 120, 200, alpha] : [160, 160, 220, 130];
    case 'ECONOMIC_PARTNERSHIP': return isSource ? [40, 160, 120, alpha] : [80, 180, 140, 130];
    case 'LOGISTICS_CRISIS':   return isSource ? [255, 100, 0, alpha] : [255, 150, 50, 130];
    case 'LOGISTICS_PLAN':     return isSource ? [50, 220, 180, alpha] : [100, 240, 210, 130];
    case 'CEASEFIRE':          return isSource ? [80, 220, 80, alpha] : [140, 240, 140, 130];
    case 'DIPLOMATIC_AGREEMENT': return isSource ? [140, 220, 120, alpha] : [180, 240, 160, 130];
    default:                   return isSource ? [120, 120, 120, alpha] : [160, 160, 160, 130];
  }
}

function isConflictType(type: string): boolean {
  return (CONFLICT_TYPES as readonly string[]).includes(type);
}

function isFlatType(type: string): boolean {
  return FLAT_TYPES.includes(type);
}

function textToken(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

const AIRPLANE_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M21,16v-2l-8-5V3.5c0-0.83-0.67-1.5-1.5-1.5S10,2.67,10,3.5V9l-8,5v2l8-2.5V19l-2,1.5V22l3.5-1l3.5,1v-1.5L13,19v-5.5L21,16z" fill="white"/>
</svg>
`);

// Catmull-Rom Spline interpolation for curvy paths
function catmullRomSpline(points: [number, number][], numSegments = 10): [number, number][] {
  if (points.length < 3) return points; 
  
  const result: [number, number][] = [];
  const pts = [points[0], ...points, points[points.length - 1]];
  
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];
    
    for (let t = 0; t < numSegments; t++) {
      const t1 = t / numSegments;
      const t2 = t1 * t1;
      const t3 = t2 * t1;
      
      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t1 +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      
      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t1 +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );
      
      result.push([x, y]);
    }
  }
  
  result.push(points[points.length - 1]);
  return result;
}

export function useMapLayers(
  visibility: LayerVisibility, 
  mapData: MapDataResult | undefined, 
  flights: Asset[] = [], 
  time: number = 0,
  selectedFlightId: string | null = null,
  flightTrails?: Map<string, [number, number][]>,
  disinfo?: DisinfoPayload | null
) {
  return useMemo(() => {
    
    const strikes = mapData?.strikes ?? [];
    const missiles = mapData?.missiles ?? [];
    const targets = mapData?.targets ?? [];
    const assets = mapData?.assets ?? [];
    const zones = mapData?.zones ?? [];
    const heatPts = mapData?.heat ?? [];
    const maritimeLanes = mapData?.maritimeLanes ?? [];

    const pathStyleExtension = new PathStyleExtension({dash: true});

    const layers = [
    visibility.heat && heatPts.length > 0 &&
      new HeatmapLayer<HeatPoint>({
        id: 'heat',
        data: heatPts,
        getPosition: (d: HeatPoint): [number, number] => d.position,
        getWeight: (d: HeatPoint): number => d.weight,
        radiusPixels: 60,
        intensity: 1,
        threshold: 0.03,
        colorRange: [
          [255, 255, 178, 25],
          [254, 204, 92, 80],
          [253, 141, 60, 120],
          [240, 59, 32, 160],
          [189, 0, 38, 200],
        ],
      }),

    visibility.zones && zones.length > 0 &&
      new PolygonLayer<ThreatZone>({
        id: 'zones',
        data: zones,
        getPolygon: (d: ThreatZone): [number, number][] => d.coordinates,
        getFillColor: (d: ThreatZone): [number, number, number, number] => d.color,
        getLineColor: (d: ThreatZone): [number, number, number, number] => [d.color[0], d.color[1], d.color[2], 200],
        lineWidthMinPixels: 1,
        filled: true,
        stroked: true,
        pickable: true,
        autoHighlight: true,
      }),

    // ── STRIKES: Modern Palantir-style thin arc + origin/impact endpoint dots ──
    ...(() => {
      if (!visibility.strikes || strikes.length === 0) return [];

      const getStrikeColor = (d: StrikeArc): [number, number, number, number] =>
        d.type === 'NAVAL_STRIKE'
          ? [50, 200, 200, 220]
          : d.actor === 'ISRAEL'
          ? [50, 200, 120, 220]
          : [45, 114, 210, 220];

      // Subtle glow behind main arc
      const strikeGlow = new ArcLayer<StrikeArc>({
        id: 'strikes-glow',
        data: strikes,
        getSourcePosition: (d: StrikeArc): [number, number] => d.from,
        getTargetPosition: (d: StrikeArc): [number, number] => d.to,
        getSourceColor: (d: StrikeArc): [number, number, number, number] => {
          const c = getStrikeColor(d);
          return [c[0], c[1], c[2], 30];
        },
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 20],
        getWidth: 5,
        widthUnits: 'pixels',
        pickable: false,
      });

      // Crisp thin main arc
      const strikeArcs = new ArcLayer<StrikeArc>({
        id: 'strikes',
        data: strikes,
        getSourcePosition: (d: StrikeArc): [number, number] => d.from,
        getTargetPosition: (d: StrikeArc): [number, number] => d.to,
        getSourceColor: getStrikeColor,
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 140],
        getWidth: (d: StrikeArc): number => (d.severity === 'CRITICAL' ? 1.5 : 1),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
      });

      // Source origin dots (small, hollow)
      const strikeOrigins = new ScatterplotLayer<StrikeArc>({
        id: 'strikes-origins',
        data: strikes,
        getPosition: (d: StrikeArc): [number, number] => d.from,
        getRadius: 3500,
        getFillColor: (d: StrikeArc): [number, number, number, number] => {
          const c = getStrikeColor(d);
          return [c[0], c[1], c[2], 60];
        },
        stroked: true,
        getLineColor: (d: StrikeArc): [number, number, number, number] => getStrikeColor(d),
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 6,
        pickable: true,
        autoHighlight: true,
      });

      // Target impact dots (solid, brighter)
      const strikeImpacts = new ScatterplotLayer<StrikeArc>({
        id: 'strikes-impacts',
        data: strikes,
        getPosition: (d: StrikeArc): [number, number] => d.to,
        getRadius: 4000,
        getFillColor: (d: StrikeArc): [number, number, number, number] => {
          const c = getStrikeColor(d);
          return [c[0], c[1], c[2], d.severity === 'CRITICAL' ? 200 : 140];
        },
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 120],
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 7,
        pickable: true,
        autoHighlight: true,
      });

      return [strikeGlow, strikeArcs, strikeOrigins, strikeImpacts];
    })(),

    // ── MISSILES: Modern thin arcs with animated pulse + origin/impact dots ──
    ...(() => {
      if (!visibility.missiles || missiles.length === 0) return [];

      // Faint glow
      const missileGlow = new ArcLayer<MissileTrack>({
        id: 'missiles-glow',
        data: missiles,
        getSourcePosition: (d: MissileTrack): [number, number] => d.from,
        getTargetPosition: (d: MissileTrack): [number, number] => d.to,
        getSourceColor: (): [number, number, number, number] => [210, 50, 50, 25],
        getTargetColor: (): [number, number, number, number] => [255, 50, 50, 15],
        getWidth: 5,
        widthUnits: 'pixels',
        pickable: false,
      });

      // Crisp main arc
      const missileArcs = new ArcLayer<MissileTrack>({
        id: 'missiles',
        data: missiles,
        getSourcePosition: (d: MissileTrack): [number, number] => d.from,
        getTargetPosition: (d: MissileTrack): [number, number] => d.to,
        getSourceColor: (): [number, number, number, number] => [210, 50, 50, 200],
        getTargetColor: (d: MissileTrack): [number, number, number, number] =>
          d.status === 'INTERCEPTED' ? [255, 200, 0, 180] : [255, 50, 50, 200],
        getWidth: (d: MissileTrack): number => (d.severity === 'CRITICAL' ? 1.5 : 1),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
      });

      // Launch origin dots
      const missileOrigins = new ScatterplotLayer<MissileTrack>({
        id: 'missiles-origins',
        data: missiles,
        getPosition: (d: MissileTrack): [number, number] => d.from,
        getRadius: 3000,
        getFillColor: (): [number, number, number, number] => [210, 50, 50, 80],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [210, 50, 50, 200],
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 5,
        pickable: true,
        autoHighlight: true,
      });

      // Impact / intercept dots
      const missileImpacts = new ScatterplotLayer<MissileTrack>({
        id: 'missiles-impacts',
        data: missiles,
        getPosition: (d: MissileTrack): [number, number] => d.to,
        getRadius: 4500,
        getFillColor: (d: MissileTrack): [number, number, number, number] =>
          d.status === 'INTERCEPTED' ? [255, 200, 0, 160] : [255, 50, 50, 180],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 7,
        pickable: true,
        autoHighlight: true,
      });

      return [missileGlow, missileArcs, missileOrigins, missileImpacts];
    })(),

    visibility.targets && targets.length > 0 &&
      new ScatterplotLayer<Target>({
        id: 'targets',
        data: targets,
        getPosition: (d: Target): [number, number] => d.position,
        getRadius: (d: Target): number =>
          d.status === 'DESTROYED' ? 12000 : d.status === 'DAMAGED' ? 9000 : 6000,
        getFillColor: (d: Target): [number, number, number, number] =>
          d.status === 'DESTROYED'
            ? [220, 50, 50, 200]
            : d.status === 'DAMAGED'
            ? [220, 150, 50, 200]
            : [220, 200, 50, 200],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 14,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [],
          getLineColor: [],
        },
      }),

    visibility.assets && assets.length > 0 &&
      new ScatterplotLayer<Asset>({
        id: 'assets',
        data: assets,
        getPosition: (d: Asset): [number, number] => d.position,
        getRadius: (d: Asset): number => (d.type === 'CARRIER' ? 12000 : 8000),
        getFillColor: (d: Asset): [number, number, number, number] =>
          d.actor === 'US' ? [45, 114, 210, 220] : [50, 200, 200, 220],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 150],
        lineWidthMinPixels: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 14,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [],
          getLineColor: [],
        },
      }),


    visibility.labels && (viewState?.zoom || 3) >= 5.0 && visibility.targets && targets.length > 0 &&
      new TextLayer<Target>({
        id: 'target-labels',
        data: targets,
        getPosition: (d: Target): [number, number] => d.position,
        getText: (d: Target): string => d.name,
        getSize: textToken('--text-body-sm', 11),
        getColor: (): [number, number, number, number] => [220, 220, 220, 200],
        getPixelOffset: (): [number, number] => [0, -20],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 200],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      }),

    visibility.labels && (viewState?.zoom || 3) >= 5.0 && visibility.assets && assets.length > 0 &&
      new TextLayer<Asset>({
        id: 'asset-labels',
        data: assets,
        getPosition: (d: Asset): [number, number] => d.position,
        getText: (d: Asset): string => d.name,
        getSize: textToken('--text-label', 10),
        getColor: (): [number, number, number, number] => [150, 200, 255, 200],
        getPixelOffset: (): [number, number] => [0, -22],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 200],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
      }),


    // High-tech Aircraft Icon Atlas (512x256)
    ...(() => {
      if (!visibility.flights || flights.length === 0) return [];

      const AIRCRAFT_ATLAS_SVG = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="512" height="256" viewBox="0 0 512 256" xmlns="http://www.w3.org/2000/svg">
          <!-- AIRLINER (0, 0) -->
          <g id="airliner" transform="translate(0, 0)">
            <path d="M64 12 L70 42 L112 70 L112 78 L70 66 L70 102 L86 114 L86 120 L64 116 L42 120 L42 114 L58 102 L58 66 L16 78 L16 70 L58 42 Z" 
                  fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
            <rect x="78" y="62" width="5" height="12" rx="2" fill="#333"/>
            <rect x="45" y="62" width="5" height="12" rx="2" fill="#333"/>
          </g>
          <!-- FIGHTER (128, 0) -->
          <g id="fighter" transform="translate(128, 0)">
            <path d="M64 10 L70 38 L98 78 L98 86 L74 76 L74 106 L86 116 L86 122 L64 116 L42 122 L42 116 L54 106 L54 76 L30 86 L30 78 L58 38 Z" 
                  fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
            <polygon points="64,30 67,48 61,48" fill="#333"/>
            <circle cx="64" cy="116" r="3" fill="#ff4400"/>
          </g>
          <!-- HEAVY TRANSPORT / TANKER (256, 0) -->
          <g id="heavy" transform="translate(256, 0)">
            <path d="M64 10 L72 36 L118 64 L118 74 L72 66 L72 104 L88 114 L88 122 L64 116 L40 122 L40 114 L56 104 L56 66 L10 74 L10 64 L56 36 Z" 
                  fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="2"/>
            <rect x="82" y="58" width="4" height="10" rx="1" fill="#333"/>
            <rect x="96" y="62" width="4" height="10" rx="1" fill="#333"/>
            <rect x="42" y="58" width="4" height="10" rx="1" fill="#333"/>
            <rect x="28" y="62" width="4" height="10" rx="1" fill="#333"/>
          </g>
          <!-- UAV / REAPER DRONE (384, 0) -->
          <g id="uav" transform="translate(384, 0)">
            <path d="M64 18 L68 46 L122 52 L122 56 L68 56 L68 108 L78 118 L78 122 L64 116 L50 122 L50 118 L60 108 L60 56 L6 56 L6 52 L60 46 Z" 
                  fill="white" stroke="rgba(0,0,0,0.6)" stroke-width="1.8"/>
            <circle cx="64" cy="18" r="4" fill="#00e5ff"/>
            <line x1="58" y1="116" x2="70" y2="116" stroke="#ff8800" stroke-width="2"/>
          </g>
          <!-- CARRIER (0, 128) -->
          <g id="carrier" transform="translate(0, 128)">
            <rect x="52" y="16" width="24" height="96" rx="3" fill="#444" stroke="white" stroke-width="2"/>
            <rect x="56" y="20" width="16" height="88" fill="#333"/>
          </g>
          <!-- HELICOPTER (128, 128) -->
          <g id="helicopter" transform="translate(128, 128)">
            <ellipse cx="64" cy="54" rx="12" ry="24" fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
            <line x1="64" y1="78" x2="64" y2="118" stroke="white" stroke-width="3"/>
            <line x1="16" y1="54" x2="112" y2="54" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
            <line x1="64" y1="6" x2="64" y2="102" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
          </g>
          <!-- AIRPLANE DEFAULT (256, 128) -->
          <g id="airplane" transform="translate(256, 128)">
            <path d="M64 20 L68 50 L88 64 L88 70 L68 62 L68 96 L76 106 L76 110 L64 106 L52 110 L52 106 L60 96 L60 62 L40 70 L40 64 L60 50 Z" 
                  fill="white" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
          </g>
        </svg>
      `);

      const getAircraftIconName = (d: Asset): string => {
        const name = (d.name || '').toUpperCase();
        const desc = (d.description || '').toUpperCase();
        if (name.startsWith('PYTHON') || name.startsWith('VIPER') || name.startsWith('IAF') || desc.includes('FIGHTER')) return 'fighter';
        if (name.startsWith('REAPER') || desc.includes('UAV') || desc.includes('DRONE')) return 'uav';
        if (name.startsWith('RCH') || name.startsWith('SENTRY') || name.startsWith('SHELL') || name.startsWith('CNA') || desc.includes('TRANSPORT') || desc.includes('TANKER')) return 'heavy';
        if (desc.includes('ROTOR') || desc.includes('HELICOPTER')) return 'helicopter';
        return 'airliner';
      };

      const getAircraftColor = (d: Asset): [number, number, number, number] => {
        const name = (d.name || '').toUpperCase();
        const desc = (d.description || '').toUpperCase();
        if (name.startsWith('PYTHON') || name.startsWith('VIPER') || name.startsWith('IAF') || desc.includes('FIGHTER')) return [255, 75, 75, 255];
        if (name.startsWith('REAPER') || desc.includes('UAV')) return [0, 230, 255, 255];
        if (name.startsWith('SENTRY') || name.startsWith('SHELL') || desc.includes('AWACS') || desc.includes('TANKER')) return [255, 190, 40, 255];
        if (d.actor === 'us') return [100, 180, 255, 255];
        return [240, 240, 255, 255];
      };

      const flightIcons = new IconLayer<Asset>({
        id: 'flights-icons',
        data: flights,
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
        getPosition: (d: Asset): [number, number] => d.position,
        getIcon: (d: Asset) => getAircraftIconName(d),
        getSize: 34,
        getAngle: (d: Asset): number => -(d.heading || 0),
        getColor: (d: Asset): [number, number, number, number] => getAircraftColor(d),
        sizeUnits: 'pixels',
        sizeScale: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getAngle: [flights.map(f => f.heading).join(',')],
          getPosition: [flights.map(f => f.position.join(',')).join('|')],
        },
      });

      const flightLabels = new TextLayer<Asset>({
        id: 'flights-labels',
        data: flights,
        getPosition: (d: Asset): [number, number] => d.position,
        getText: (d: Asset): string => d.name,
        getSize: textToken('--text-tiny', 9),
        getColor: (d: Asset): [number, number, number, number] => {
          const c = getAircraftColor(d);
          return [c[0], c[1], c[2], 220];
        },
        getPixelOffset: (): [number, number] => [0, 20],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 190],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
        updateTriggers: {
          getPosition: [flights.map(f => f.position.join(',')).join('|')],
        },
      });

      const showFlightLabels = visibility.labels && (viewState?.zoom || 3) >= 6.0;
      return [flightIcons, showFlightLabels && flightLabels].filter(Boolean);
    })(),

    // Selected flight highlight circle
    visibility.flights && selectedFlightId && flights.find(f => f.id === selectedFlightId) &&
      new ScatterplotLayer<Asset>({
        id: 'selected-flight-circle',
        data: flights.filter(f => f.id === selectedFlightId),
        getPosition: (d: Asset): [number, number] => d.position,
        getRadius: 25000, // Larger circle around selected flight
        getFillColor: [160, 100, 255, 30], // Purple with transparency
        stroked: true,
        getLineColor: [160, 100, 255, 200], // Solid purple border
        lineWidthMinPixels: 3,
        pickable: false,
        updateTriggers: {
          data: [selectedFlightId],
        },
      }),

    // Flight trail path
    visibility.flights && selectedFlightId && flightTrails && flightTrails.has(selectedFlightId) &&
      new PathLayer({
        id: 'selected-flight-trail',
        data: [{ id: selectedFlightId, path: flightTrails.get(selectedFlightId)! }],
        getPath: (d: any) => d.path,
        getColor: [160, 100, 255, 180], // Purple trail
        getWidth: 3,
        widthUnits: 'pixels',
        widthMinPixels: 2,
        pickable: false,
        updateTriggers: {
          data: [selectedFlightId, flightTrails.get(selectedFlightId)?.length],
        },
      }),

    // Projected flight route line (where the plane is going)
    visibility.flights && selectedFlightId && flights.find(f => f.id === selectedFlightId) &&
      new PathLayer({
        id: 'selected-flight-route',
        data: [(() => {
          const flight = flights.find(f => f.id === selectedFlightId)!;
          const heading = (flight.heading || 0) * (Math.PI / 180); // Convert to radians
          const distance = 200000; // 200km projection
          
          // Calculate destination point
          const lat1 = flight.position[1] * (Math.PI / 180);
          const lon1 = flight.position[0] * (Math.PI / 180);
          const R = 6371000; // Earth's radius in meters
          
          const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(distance / R) +
            Math.cos(lat1) * Math.sin(distance / R) * Math.cos(heading)
          );
          
          const lon2 = lon1 + Math.atan2(
            Math.sin(heading) * Math.sin(distance / R) * Math.cos(lat1),
            Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
          );
          
          return {
            id: selectedFlightId,
            path: [
              flight.position, // Current position
              [(lon2 * 180 / Math.PI), (lat2 * 180 / Math.PI)] // Projected destination
            ]
          };
        })()],
        getPath: (d: any) => d.path,
        getColor: [160, 100, 255, 100], // Purple with less opacity
        getWidth: 2,
        widthUnits: 'pixels',
        widthMinPixels: 1,
        getDashArray: [10, 5], // Dashed line
        dashJustified: true,
        pickable: false,
        updateTriggers: {
          data: [selectedFlightId, flights.find(f => f.id === selectedFlightId)?.heading],
        },
      }),

    visibility.maritime && maritimeLanes.length > 0 &&
      new PathLayer({
        id: 'maritime-lanes',
        data: maritimeLanes,
        getPath: (d: any) => catmullRomSpline(d.path, 15), // Interpolate to make curvy!
        getColor: (): [number, number, number, number] => [100, 150, 255, 140],
        getWidth: 3,
        widthUnits: 'pixels',
        getDashArray: [12, 8], // 12px solid, 8px gap
        dashJustified: true,
        dashOffset: time, // use time for animation
        extensions: [pathStyleExtension],
        pickable: true,
        updateTriggers: {
          dashOffset: [time]
        }
      }),

    // Real-time modern naval vessels and commercial mega-ships
    ...(() => {
      const vessels = (mapData as any)?.vessels ?? [];
      if (!visibility.maritime || vessels.length === 0) return [];

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

      const getVesselIcon = (d: any): string => {
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
        return 'ship';
      };

      const getVesselColor = (d: any): [number, number, number, number] => {
        const cat = d.category;
        if (cat === 'CARRIER') return [255, 200, 50, 255];
        if (cat === 'DESTROYER' || cat === 'FRIGATE' || cat === 'MILITARY') return [0, 220, 255, 255];
        if (cat === 'SUBMARINE') return [190, 120, 255, 255];
        if (cat === 'TANKER') return [255, 150, 30, 255];
        if (cat === 'CONTAINER' || cat === 'CARGO') return [45, 212, 191, 255];
        if (cat === 'PATROL') return [100, 200, 255, 255];
        return [140, 180, 230, 255];
      };

      const getVesselSize = (d: any): number => {
        const cat = d.category;
        if (cat === 'CARRIER') return 48;
        if (cat === 'CONTAINER' || cat === 'TANKER') return 40;
        if (cat === 'DESTROYER') return 36;
        if (cat === 'FRIGATE' || cat === 'SUBMARINE') return 32;
        return 28;
      };

      const vesselLayer = new IconLayer<any>({
        id: 'maritime-vessels',
        data: vessels,
        getPosition: (d: any): [number, number] => d.position,
        getIcon: (d: any) => getVesselIcon(d),
        getSize: (d: any) => getVesselSize(d),
        getAngle: (d: any) => -(d.cog ?? 0),
        getColor: (d: any): [number, number, number, number] => getVesselColor(d),
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
          getAngle: [vessels.map((v: any) => v.cog).join(',')],
          getPosition: [vessels.map((v: any) => v.position.join(',')).join('|')],
        },
      });

      const militaryVessels = vessels.filter((v: any) =>
        ['CARRIER', 'DESTROYER', 'FRIGATE', 'SUBMARINE', 'MILITARY'].includes(v.category || '')
      );

      const radarRings = militaryVessels.length > 0 && new ScatterplotLayer<any>({
        id: 'maritime-radar-rings',
        data: militaryVessels,
        getPosition: (d: any): [number, number] => d.position,
        getRadius: (d: any): number => {
          const isCarrier = d.category === 'CARRIER';
          const pulse = (time * 0.1) % (Math.PI * 2);
          return (isCarrier ? 35000 : 20000) * (Math.sin(pulse) * 0.35 + 1);
        },
        getFillColor: [0, 0, 0, 0],
        stroked: true,
        getLineColor: (d: any): [number, number, number, number] => {
          const isCarrier = d.category === 'CARRIER';
          const pulse = (time * 0.1) % (Math.PI * 2);
          const alpha = Math.floor(Math.max(20, (1 - pulse / (Math.PI * 2)) * 140));
          return isCarrier ? [255, 200, 50, alpha] : [0, 220, 255, alpha];
        },
        lineWidthMinPixels: 1.5,
        pickable: false,
        updateTriggers: {
          getRadius: [time],
          getLineColor: [time],
        },
      });

      const vesselLabels = new TextLayer<any>({
        id: 'maritime-vessel-labels',
        data: vessels,
        getPosition: (d: any): [number, number] => d.position,
        getText: (d: any): string => {
          const sog = d.sog != null ? ` · ${Number(d.sog).toFixed(0)}kn` : '';
          return `${d.name}${sog}`;
        },
        getSize: textToken('--text-tiny', 9),
        getColor: (d: any): [number, number, number, number] => {
          const c = getVesselColor(d);
          return [c[0], c[1], c[2], 220];
        },
        getPixelOffset: (): [number, number] => [0, 20],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: [10, 14, 22, 190],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
        pickable: false,
        updateTriggers: {
          getPosition: [vessels.map((v: any) => v.position.join(',')).join('|')],
        },
      });

      const showVesselLabels = visibility.labels && (viewState?.zoom || 3) >= 6.0;
      return [vesselLayer, radarRings, showVesselLabels && vesselLabels].filter(Boolean);
    })(),


    // ── DISINFO NETWORK: Modern Palantir-style thin lines, small nodes, clean labels ──
    ...(() => {
      if (!visibility.disinfo || !disinfo || !disinfo.edges || disinfo.edges.length === 0) return [];

      const edges = disinfo.edges;
      const nodes = disinfo.nodes || [];

      // Build a fast node lookup map instead of repeated .find() calls
      const nodeMap = new Map(nodes.map(n => [n.code, n]));

      const getSourcePos = (d: DisinfoEdge): [number, number] => {
        const n = nodeMap.get(d.source);
        return n ? [n.lon, n.lat] : [0, 0];
      };

      const getTargetPos = (d: DisinfoEdge): [number, number] => {
        const n = nodeMap.get(d.target);
        return n ? [n.lon, n.lat] : [0, 0];
      };

      const getEdgeColor = (d: DisinfoEdge): [number, number, number, number] =>
        d.kind === 'CAMPAIGN' ? [245, 158, 11, 180] : [56, 189, 248, 180];

      // 1. Subtle ambient glow behind arcs (barely visible halo)
      const glowArcs = new ArcLayer<DisinfoEdge>({
        id: 'disinfo-glow-arcs',
        data: edges,
        getSourcePosition: getSourcePos,
        getTargetPosition: getTargetPos,
        getSourceColor: (d: DisinfoEdge): [number, number, number, number] => {
          const c = getEdgeColor(d);
          return [c[0], c[1], c[2], 18];
        },
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 10],
        getWidth: 3,
        getHeight: 0.08,
        widthUnits: 'pixels',
        greatCircle: true,
        pickable: false,
      });

      // 2. Crisp thin main arc (Palantir-style hairline)
      const mainArcs = new ArcLayer<DisinfoEdge>({
        id: 'disinfo-arcs',
        data: edges,
        getSourcePosition: getSourcePos,
        getTargetPosition: getTargetPos,
        getSourceColor: getEdgeColor,
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 100],
        getWidth: (d: DisinfoEdge): number => Math.max(0.8, Math.min(1.5, 0.6 + d.weight * 0.3)),
        getHeight: 0.08,
        widthUnits: 'pixels',
        greatCircle: true,
        pickable: true,
        autoHighlight: true,
      });

      // 3. Source endpoint dots for each arc (origin of attack)
      const edgeSourceDots = new ScatterplotLayer<DisinfoEdge>({
        id: 'disinfo-edge-sources',
        data: edges,
        getPosition: getSourcePos,
        getRadius: 2000,
        getFillColor: (d: DisinfoEdge): [number, number, number, number] => {
          const c = getEdgeColor(d);
          return [c[0], c[1], c[2], 50];
        },
        stroked: true,
        getLineColor: getEdgeColor,
        lineWidthMinPixels: 0.5,
        radiusMinPixels: 2,
        radiusMaxPixels: 4,
        pickable: true,
        autoHighlight: true,
      });

      // 4. Target endpoint dots for each arc (where attack lands)
      const edgeTargetDots = new ScatterplotLayer<DisinfoEdge>({
        id: 'disinfo-edge-targets',
        data: edges,
        getPosition: getTargetPos,
        getRadius: 2500,
        getFillColor: (d: DisinfoEdge): [number, number, number, number] => {
          const c = getEdgeColor(d);
          return [c[0], c[1], c[2], 120];
        },
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 80],
        lineWidthMinPixels: 0.5,
        radiusMinPixels: 2,
        radiusMaxPixels: 5,
        pickable: true,
        autoHighlight: true,
      });

      // 5. Single flowing data packet per edge (clean, not noisy)
      const particleData: Array<{ position: [number, number]; kind: string; id: string }> = [];
      edges.forEach((edge, idx) => {
        const src = getSourcePos(edge);
        const tgt = getTargetPos(edge);
        if ((src[0] === 0 && src[1] === 0) || (tgt[0] === 0 && tgt[1] === 0)) return;

        const progress = (time * 0.03 + idx * 0.13) % 1;
        const lon = src[0] + (tgt[0] - src[0]) * progress;
        const lat = src[1] + (tgt[1] - src[1]) * progress;
        particleData.push({
          id: `pkt-${edge.id}`,
          position: [lon, lat],
          kind: edge.kind,
        });
      });

      const flowParticles = new ScatterplotLayer<typeof particleData[0]>({
        id: 'disinfo-flow-particles',
        data: particleData,
        getPosition: d => d.position,
        getRadius: 2500,
        getFillColor: (d): [number, number, number, number] =>
          d.kind === 'CAMPAIGN' ? [255, 210, 80, 220] : [80, 210, 255, 220],
        stroked: false,
        radiusMinPixels: 1.5,
        radiusMaxPixels: 3,
        pickable: false,
        updateTriggers: {
          getPosition: [time],
        },
      });

      // 6. Node circles (small, refined — Palantir proportions)
      const validNodes = nodes.filter(n => n.campaignVolume + n.botVolume > 0);

      const getNodeColor = (d: DisinfoNode): [number, number, number, number] =>
        d.campaignVolume >= d.botVolume ? [245, 158, 11, 180] : [56, 189, 248, 180];

      const disinfoNodes = new ScatterplotLayer<DisinfoNode>({
        id: 'disinfo-nodes',
        data: validNodes,
        getPosition: (d: DisinfoNode): [number, number] => [d.lon, d.lat],
        getRadius: (d: DisinfoNode): number =>
          4000 + Math.min(20000, Math.sqrt(d.campaignVolume + d.botVolume) * 6000),
        getFillColor: (d: DisinfoNode): [number, number, number, number] => {
          const c = getNodeColor(d);
          return [c[0], c[1], c[2], 40];
        },
        stroked: true,
        getLineColor: getNodeColor,
        lineWidthMinPixels: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 10,
        pickable: true,
        autoHighlight: true,
      });

      // 7. Subtle micro-pulse ring (refined, not overwhelming)
      const nodeRings = new ScatterplotLayer<DisinfoNode>({
        id: 'disinfo-nodes-pulse',
        data: validNodes,
        getPosition: (d: DisinfoNode): [number, number] => [d.lon, d.lat],
        getRadius: (d: DisinfoNode): number => {
          const pulse = (time * 0.06) % 1;
          return (6000 + Math.min(20000, Math.sqrt(d.campaignVolume + d.botVolume) * 6000)) * (0.9 + pulse * 0.3);
        },
        getFillColor: [0, 0, 0, 0],
        stroked: true,
        getLineColor: (d: DisinfoNode): [number, number, number, number] => {
          const pulse = (time * 0.06) % 1;
          const alpha = Math.floor(80 * (1 - pulse));
          const c = getNodeColor(d);
          return [c[0], c[1], c[2], alpha];
        },
        lineWidthMinPixels: 0.5,
        radiusMinPixels: 4,
        radiusMaxPixels: 14,
        pickable: false,
        updateTriggers: {
          getRadius: [time],
          getLineColor: [time],
        },
      });

      return [glowArcs, mainArcs, edgeSourceDots, edgeTargetDots, flowParticles, nodeRings, disinfoNodes];
    })(),


    // Geopolitical relationship / conflict lines (source→target arcs)
    ...(() => {
      const rels = (mapData?.conflictRelationships ?? []) as any[];
      if (!visibility.relationships || rels.length === 0) return [];

      const isConflict = (d: any) => isConflictType(d.type);

      const main = new ArcLayer<any>({
        id: 'geopolitical-relationships',
        data: rels,
        getSourcePosition: (d: any): [number, number] => d.sourcePosition,
        getTargetPosition: (d: any): [number, number] => d.targetPosition,
        getSourceColor: (d: any): [number, number, number, number] => {
          const c = getRelationshipColor(d.type, true);
          if (isConflict(d)) {
            const pulse = Math.sin(time * 0.4) * 0.25 + 0.75;
            return [c[0], c[1], c[2], Math.floor(c[3] * pulse)];
          }
          return c;
        },
        getTargetColor: (d: any): [number, number, number, number] =>
          getRelationshipColor(d.type, false),
        getWidth: (d: any): number => {
          const base = isFlatType(d.type) ? 1.5 : isConflict(d.type) ? 2.5 : 2;
          return Math.max(1, Math.min(4, base + (d.intensity || 0) * 0.12));
        },
        getHeight: (d: any): number =>
          isFlatType(d.type) ? 0 : isConflict(d.type) ? 0.15 : 0.05,
        widthUnits: 'pixels',
        greatCircle: true,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [time],
          getTargetColor: [],
        },
      });

      const conflictRels = rels.filter(isConflict);
      const glow = conflictRels.length > 0 &&
        new ArcLayer<any>({
          id: 'relationship-glow',
          data: conflictRels,
          getSourcePosition: (d: any): [number, number] => d.sourcePosition,
          getTargetPosition: (d: any): [number, number] => d.targetPosition,
          getSourceColor: (d: any): [number, number, number, number] => {
            const c = getRelationshipColor(d.type, true);
            return [c[0], c[1], c[2], 35];
          },
          getTargetColor: (d: any): [number, number, number, number] => {
            const c = getRelationshipColor(d.type, false);
            return [c[0], c[1], c[2], 25];
          },
          getWidth: (d: any): number =>
            d.type === 'MILITARY_CONFLICT' || d.type === 'WAR_ALERT' ? 7 : 5,
          getHeight: 0.15,
          widthUnits: 'pixels',
          greatCircle: true,
          pickable: false,
        });

      const midpointLabels = rels.map((d: any) => ({
        position: [
          (d.sourcePosition[0] + d.targetPosition[0]) / 2,
          (d.sourcePosition[1] + d.targetPosition[1]) / 2,
        ] as [number, number],
        text: REL_LABELS[d.type] ?? d.type,
        color: getRelationshipColor(d.type, true),
      }));

      const labels = new TextLayer<any>({
        id: 'relationship-type-labels',
        data: midpointLabels,
        getPosition: (d: any): [number, number] => d.position,
        getText: (d: any): string => d.text,
        getSize: 9,
        getColor: (d: any): [number, number, number, number] =>
          [d.color[0], d.color[1], d.color[2], 210],
        getPixelOffset: [0, -8],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        fontWeight: 'bold',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [10, 10, 14, 180],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
        billboard: true,
        pickable: false,
      });

      return [glow, main, labels];
    })(),

    ];

    const filteredLayers = layers.filter(Boolean);
    
    console.log('[useMapLayers] Created layers:', {
      total: filteredLayers.length,
      layerIds: filteredLayers.map((l: any) => l?.id).filter(Boolean),
      flightLayersIncluded: filteredLayers.some((l: any) => l?.id === 'flights-icons'),
      selectedFlightLayersIncluded: filteredLayers.some((l: any) => l?.id === 'selected-flight-circle'),
    });
    
    return filteredLayers as any;
  }, [visibility, mapData, flights, time, selectedFlightId, flightTrails, disinfo]);
}
