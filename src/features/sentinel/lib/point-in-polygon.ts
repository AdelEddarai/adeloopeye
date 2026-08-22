/**
 * High-performance geospatial utilities for Adeloop Sentinel Geofencing.
 * Includes raycasting point-in-polygon, bounding box prefilters, and geodesic metrics.
 */

/**
 * Calculates the bounding box [minLng, minLat, maxLng, maxLat] of a polygon.
 */
export function computeBoundingBox(polygon: [number, number][]): [number, number, number, number] {
  if (!polygon || polygon.length === 0) return [0, 0, 0, 0];

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const [lng, lat] = polygon[i];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Ultra-fast Point-in-Polygon test using bounding box pre-filter + Raycasting (Even-Odd rule).
 * Returns true if the point [lng, lat] is strictly inside the polygon.
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][],
  bbox?: [number, number, number, number]
): boolean {
  if (!polygon || polygon.length < 3) return false;

  const [px, py] = point;

  // 1. Fast bounding box rejection
  if (bbox) {
    if (px < bbox[0] || py < bbox[1] || px > bbox[2] || py > bbox[3]) {
      return false;
    }
  }

  // 2. Ray-casting algorithm
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculates geodesic distance between two [lng, lat] points in kilometers (Haversine formula).
 */
export function calculateDistanceKm(p1: [number, number], p2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[1] * Math.PI) / 180) *
      Math.cos((p2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Approximates polygon area in square kilometers.
 */
export function calculatePolygonAreaKm2(polygon: [number, number][]): number {
  if (!polygon || polygon.length < 3) return 0;

  const R = 6371; // Earth radius in km
  let total = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const xi = (polygon[i][0] * Math.PI) / 180;
    const yi = (polygon[i][1] * Math.PI) / 180;
    const xj = (polygon[j][0] * Math.PI) / 180;
    const yj = (polygon[j][1] * Math.PI) / 180;

    total += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
  }

  total = (total * R * R) / 2.0;
  return Math.abs(total);
}
