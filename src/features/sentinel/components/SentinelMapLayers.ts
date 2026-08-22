import { PolygonLayer, PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { GeofenceZone, DrawModeState } from '../types';

export interface SentinelLayerProps {
  zones: GeofenceZone[];
  drawMode: DrawModeState;
  breachingZoneIds: string[];
  hoveredZoneId: string | null;
  selectedZoneId: string | null;
  visible: boolean;
  onZoneClick?: (zone: GeofenceZone) => void;
  onZoneHover?: (zone: GeofenceZone | null) => void;
}

/**
 * Converts Hex color string (#RRGGBB) to [R, G, B, A] tuple.
 */
function hexToRgba(hex: string, alpha: number = 255): [number, number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 6;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 182;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 212;
  return [r, g, b, alpha];
}

/**
 * Calculates centroid of a polygon for placing labels.
 */
function calculateCentroid(coordinates: [number, number][]): [number, number] {
  if (!coordinates || coordinates.length === 0) return [0, 0];
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of coordinates) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / coordinates.length, sumLat / coordinates.length];
}

/**
 * Generates all Deck.gl layers for Sentinel Geofences & Active Drawing Mode.
 */
export function getSentinelMapLayers({
  zones,
  drawMode,
  breachingZoneIds,
  hoveredZoneId,
  selectedZoneId,
  visible,
  onZoneClick,
  onZoneHover,
}: SentinelLayerProps) {
  if (!visible) return [];

  const enabledZones = zones.filter(z => z.enabled);
  const layers: any[] = [];

  // ── 1. GEOFENCE POLYGONS (Translucent Glowing Fill) ──
  if (enabledZones.length > 0) {
    layers.push(
      new PolygonLayer<GeofenceZone>({
        id: 'sentinel-geofence-polygons',
        data: enabledZones,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        wireframe: false,
        lineWidthUnits: 'pixels',
        getPolygon: (d: GeofenceZone) => d.coordinates,
        getFillColor: (d: GeofenceZone) => {
          const isBreaching = breachingZoneIds.includes(d.id);
          const isHovered = d.id === hoveredZoneId;
          const isSelected = d.id === selectedZoneId;

          if (isBreaching) {
            return [239, 68, 68, 85]; // Pulsing red fill
          }
          if (isSelected) {
            return hexToRgba(d.color, 110);
          }
          if (isHovered) {
            return hexToRgba(d.color, 90);
          }
          return hexToRgba(d.color, 45); // Subtle translucent fill
        },
        getLineColor: (d: GeofenceZone) => {
          const isBreaching = breachingZoneIds.includes(d.id);
          const isHovered = d.id === hoveredZoneId;
          const isSelected = d.id === selectedZoneId;

          if (isBreaching) return [255, 40, 40, 255];
          if (isSelected || isHovered) return [255, 255, 255, 255];
          return hexToRgba(d.color, 200);
        },
        getLineWidth: (d: GeofenceZone) => {
          const isBreaching = breachingZoneIds.includes(d.id);
          const isSelected = d.id === selectedZoneId;
          const isHovered = d.id === hoveredZoneId;
          if (isBreaching) return 3.5;
          if (isSelected || isHovered) return 2.5;
          return 1.8;
        },
        onClick: info => {
          if (info.object && onZoneClick) {
            onZoneClick(info.object as GeofenceZone);
          }
        },
        onHover: info => {
          if (onZoneHover) {
            onZoneHover((info.object as GeofenceZone) || null);
          }
        },
        updateTriggers: {
          getFillColor: [breachingZoneIds, hoveredZoneId, selectedZoneId],
          getLineColor: [breachingZoneIds, hoveredZoneId, selectedZoneId],
          getLineWidth: [breachingZoneIds, hoveredZoneId, selectedZoneId],
        },
      })
    );

    // ── 2. GEOFENCE LABELS (Centroid Names) ──
    const labelData = enabledZones.map(z => ({
      ...z,
      position: calculateCentroid(z.coordinates),
    }));

    layers.push(
      new TextLayer({
        id: 'sentinel-geofence-labels',
        data: labelData,
        pickable: false,
        getPosition: (d: any) => [d.position[0], d.position[1]],
        getText: (d: any) => {
          const breachSuffix = d.breachCount > 0 ? ` (${d.breachCount} BREACHES)` : '';
          return `⬡ ${d.name.toUpperCase()}${breachSuffix}`;
        },
        getSize: 10,
        getColor: (d: any) => {
          const isBreaching = breachingZoneIds.includes(d.id);
          return isBreaching ? [255, 80, 80, 255] : [200, 230, 255, 220];
        },
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        fontFamily: 'monospace',
        fontWeight: 700,
        background: true,
        getBackgroundColor: [15, 20, 28, 210],
        backgroundPadding: [4, 2, 4, 2],
        updateTriggers: {
          getColor: [breachingZoneIds],
          getText: [zones],
        },
      })
    );
  }

  // ── 3. ACTIVE DRAWING MODE OVERLAYS ──
  if (drawMode.active && drawMode.vertices.length > 0) {
    const drawRgba = hexToRgba(drawMode.zoneColor || '#06b6d4', 255);
    const drawFill = hexToRgba(drawMode.zoneColor || '#06b6d4', 60);

    // Vertices dots
    layers.push(
      new ScatterplotLayer({
        id: 'sentinel-draw-vertices',
        data: drawMode.vertices.map((v, i) => ({ position: v, index: i })),
        pickable: false,
        getPosition: (d: any) => d.position,
        getRadius: 7,
        radiusUnits: 'pixels',
        getFillColor: drawRgba,
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
        stroked: true,
        updateTriggers: {
          getPosition: [drawMode.vertices.map(v => v.join(',')).join('|')],
          getFillColor: [drawMode.zoneColor],
        },
      })
    );

    // Connecting lines
    if (drawMode.vertices.length >= 2) {
      layers.push(
        new PathLayer({
          id: 'sentinel-draw-path',
          data: [{ path: drawMode.vertices }],
          pickable: false,
          getPath: (d: any) => d.path,
          getColor: drawRgba,
          getWidth: 2.5,
          widthUnits: 'pixels',
          updateTriggers: {
            getPath: [drawMode.vertices.map(v => v.join(',')).join('|')],
            getColor: [drawMode.zoneColor],
          },
        })
      );
    }

    // Polygon preview when >= 3 points
    if (drawMode.vertices.length >= 3) {
      layers.push(
        new PolygonLayer({
          id: 'sentinel-draw-preview-polygon',
          data: [{ coordinates: drawMode.vertices }],
          pickable: false,
          stroked: true,
          filled: true,
          getPolygon: (d: any) => d.coordinates,
          getFillColor: drawFill,
          getLineColor: drawRgba,
          getLineWidth: 2,
          lineWidthUnits: 'pixels',
          updateTriggers: {
            getPolygon: [drawMode.vertices.map(v => v.join(',')).join('|')],
            getFillColor: [drawMode.zoneColor],
            getLineColor: [drawMode.zoneColor],
          },
        })
      );
    }
  }

  return layers;
}
