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

    visibility.strikes && strikes.length > 0 &&
      new ArcLayer<StrikeArc>({
        id: 'strikes',
        data: strikes,
        getSourcePosition: (d: StrikeArc): [number, number] => d.from,
        getTargetPosition: (d: StrikeArc): [number, number] => d.to,
        getSourceColor: (d: StrikeArc): [number, number, number, number] =>
          d.type === 'NAVAL_STRIKE'
            ? [50, 200, 200, 220]
            : d.actor === 'ISRAEL'
            ? [50, 200, 120, 220]
            : [45, 114, 210, 220],
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 180],
        getWidth: (d: StrikeArc): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [],
          getTargetColor: [],
        },
      }),

    visibility.missiles && missiles.length > 0 &&
      new ArcLayer<MissileTrack>({
        id: 'missiles',
        data: missiles,
        getSourcePosition: (d: MissileTrack): [number, number] => d.from,
        getTargetPosition: (d: MissileTrack): [number, number] => d.to,
        getSourceColor: (): [number, number, number, number] => [210, 50, 50, 220],
        getTargetColor: (d: MissileTrack): [number, number, number, number] =>
          d.status === 'INTERCEPTED' ? [255, 200, 0, 200] : [255, 50, 50, 220],
        getWidth: (d: MissileTrack): number => (d.severity === 'CRITICAL' ? 3 : 2),
        widthUnits: 'pixels',
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [],
          getTargetColor: [],
        },
      }),

    visibility.targets && targets.length > 0 &&
      new ScatterplotLayer<Target>({
        id: 'targets',
        data: targets,
        getPosition: (d: Target): [number, number] => d.position,
        getRadius: (d: Target): number =>
          d.status === 'DESTROYED' ? 18000 : d.status === 'DAMAGED' ? 14000 : 10000,
        getFillColor: (d: Target): [number, number, number, number] =>
          d.status === 'DESTROYED'
            ? [220, 50, 50, 200]
            : d.status === 'DAMAGED'
            ? [220, 150, 50, 200]
            : [220, 200, 50, 200],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 100],
        lineWidthMinPixels: 1,
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
        getRadius: (d: Asset): number => (d.type === 'CARRIER' ? 20000 : 14000),
        getFillColor: (d: Asset): [number, number, number, number] =>
          d.actor === 'US' ? [45, 114, 210, 220] : [50, 200, 200, 220],
        stroked: true,
        getLineColor: (): [number, number, number, number] => [255, 255, 255, 150],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [],
          getLineColor: [],
        },
      }),

    visibility.targets && targets.length > 0 &&
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

    visibility.assets && assets.length > 0 &&
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

    // Flight icons using IconLayer for better rendering
    visibility.flights && flights.length > 0 &&
      (() => {
        console.log('[useMapLayers] Creating flights-icons layer:', {
          visibility: visibility.flights,
          flightCount: flights.length,
          sampleFlight: flights[0],
        });
        return new IconLayer<Asset>({
          id: 'flights-icons',
          data: flights,
          iconAtlas: AIRPLANE_SVG,
          iconMapping: {
            airplane: { x: 0, y: 0, width: 24, height: 24, mask: true },
          },
          getPosition: (d: Asset): [number, number] => d.position,
          getIcon: () => 'airplane',
          getSize: 18,
          getAngle: (d: Asset): number => -(d.heading || 0),
          getColor: (d: Asset): [number, number, number, number] =>
            d.actor === 'us' ? [100, 180, 255, 255] : [255, 100, 100, 255],
          sizeUnits: 'pixels',
          sizeScale: 1,
          pickable: true,
          autoHighlight: true,
          updateTriggers: {
            getAngle: [],
            getPosition: [],
          },
        });
      })(),

    visibility.flights && flights.length > 0 &&
      new TextLayer<Asset>({
        id: 'flights-labels',
        data: flights,
        getPosition: (d: Asset): [number, number] => d.position,
        getText: (d: Asset): string => d.name,
        getSize: textToken('--text-tiny', 9),
        getColor: (): [number, number, number, number] => [255, 255, 255, 200],
        getPixelOffset: (): [number, number] => [0, 18],
        fontFamily: 'SFMono-Regular, Menlo, monospace',
        background: true,
        getBackgroundColor: (): [number, number, number, number] => [28, 33, 39, 180],
        backgroundPadding: [3, 2, 3, 2] as [number, number, number, number],
        updateTriggers: {
          getPosition: [],
        },
      }),

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

    maritimeLanes.length > 0 &&
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

    // Disinformation / bot network arcs (reported campaigns + observed bot sources)
    visibility.disinfo && disinfo && disinfo.edges.length > 0 &&
      new ArcLayer<DisinfoEdge>({
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
        getSourceColor: (d: DisinfoEdge): [number, number, number, number] =>
          d.kind === 'CAMPAIGN' ? [245, 158, 11, 220] : [56, 189, 248, 200],
        getTargetColor: (): [number, number, number, number] => [255, 255, 255, 180],
        getWidth: (d: DisinfoEdge): number => Math.min(1.5 + d.weight, 6),
        getHeight: 0.14,
        widthUnits: 'pixels',
        greatCircle: true,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getSourceColor: [],
          getTargetColor: [],
        },
      }),

    // Disinformation / bot network node volume
    visibility.disinfo && disinfo && disinfo.nodes.length > 0 &&
      new ScatterplotLayer<DisinfoNode>({
        id: 'disinfo-nodes',
        data: disinfo.nodes.filter(n => n.campaignVolume + n.botVolume > 0),
        getPosition: (d: DisinfoNode): [number, number] => [d.lon, d.lat],
        getRadius: (d: DisinfoNode): number =>
          20000 + Math.min(220000, Math.sqrt(d.campaignVolume + d.botVolume) * 90000),
        getFillColor: (d: DisinfoNode): [number, number, number, number] =>
          d.campaignVolume >= d.botVolume ? [245, 158, 11, 60] : [56, 189, 248, 60],
        stroked: true,
        getLineColor: (d: DisinfoNode): [number, number, number, number] =>
          d.campaignVolume >= d.botVolume ? [245, 158, 11, 180] : [56, 189, 248, 160],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        updateTriggers: {
          getFillColor: [],
          getLineColor: [],
        },
      }),

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
