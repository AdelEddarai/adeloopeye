/**
 * crisisDesk.ts
 * Global "crisis desk" aggregator mirroring the keyless public layers WorldMonitor
 * surfaces (USGS quakes, NASA EONET disasters, GDELT unrest). Every source is
 * independent and guarded — a failure in any one silently yields no events from
 * that source without breaking the map.
 *
 * Output is normalized into shape the map route already understands:
 *   - `disasters`  → mapped to `Target` markers + heat in the map route
 *   - `unrestHeat` → `HeatPoint[]` for the heatmap (social-unrest density)
 */

import { usgsEarthquakeClient } from '@/server/lib/api-clients/usgs-earthquake-client';
import { eonetClient, eonetCategorySlug } from '@/server/lib/api-clients/eonet-client';
import { getGlobalConflictArticles } from '@/server/lib/api-clients/gdelt-client';
import { fetchGlobalTravelAdvisories } from '@/server/lib/api-clients/travel-advisory-client';
import type { HeatPoint, Target, ThreatZone } from '@/data/map-data';

export type DisasterKind = 'EARTHQUAKE' | 'WILDFIRE' | 'FLOOD' | 'VOLCANO' | 'STORM' | 'LANDSLIDE' | 'DROUGHT' | 'OTHER';

export type DisasterEvent = {
  id: string;
  kind: DisasterKind;
  name: string;
  description: string;
  position: [number, number];
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  magnitude?: number;
  magnitudeUnit?: string;
  url?: string;
  source: 'USGS' | 'EONET';
};

export type CrisisDeskData = {
  disasters: DisasterEvent[];
  unrestHeat: HeatPoint[];
  travelAdvisoryZones: ThreatZone[];
};

// ─── Normalize USGS quakes ────────────────────────────────
function quakeToDisaster(q: any): DisasterEvent {
  return {
    id: `usgs-${q.id}`,
    kind: 'EARTHQUAKE',
    name: q.location || q.place || 'Earthquake',
    description: `${q.place} — M${q.magnitude} at ${q.depthKm} km depth${q.tsunami ? ', tsunami alert' : ''}.`,
    position: q.position,
    timestamp: q.timestamp,
    severity: q.severity,
    magnitude: q.magnitude,
    magnitudeUnit: 'Mw',
    url: q.url,
    source: 'USGS',
  };
}

// ─── Normalize EONET events ───────────────────────────────
const EONET_KIND: Record<string, DisasterKind> = {
  wildfire: 'WILDFIRE',
  'flood-storm': 'FLOOD',
  volcano: 'VOLCANO',
  drought: 'DROUGHT',
  landslide: 'LANDSLIDE',
  earthquake: 'EARTHQUAKE',
  snow: 'OTHER',
  ocean: 'OTHER',
  other: 'OTHER',
};

function eonetToDisaster(e: any): DisasterEvent {
  const slug = eonetCategorySlug(e.category);
  const kind = EONET_KIND[slug] || 'OTHER';
  const magnitude = e.magnitudeValue != null ? Number(e.magnitudeValue) : undefined;
  const severity: DisasterEvent['severity'] = kind === 'WILDFIRE' || kind === 'VOLCANO' ? 'HIGH' : 'MEDIUM';
  return {
    id: `eonet-${e.id}`,
    kind,
    name: e.title,
    description: e.description || `${e.category} event.`,
    position: e.position,
    timestamp: e.timestamp,
    severity,
    magnitude,
    magnitudeUnit: e.magnitudeUnit,
    url: e.url,
    source: 'EONET',
  };
}

// ─── ISO-3166 alpha-2 → approximate country centre (for GDELT unrest) ──
export const COUNTRY_CENTER: Record<string, [number, number]> = {
  AF: [69.2, 33.9], DZ: [3.06, 36.75], AR: [-58.38, -34.6], AM: [44.5, 40.2],
  AU: [149.13, -35.28], AZ: [49.9, 40.4], BD: [90.41, 23.81], BY: [27.56, 53.9],
  BE: [4.36, 50.85], BO: [-66.16, -16.5], BA: [18.41, 43.85], BR: [-47.93, -15.79],
  BG: [23.32, 42.7], KH: [104.88, 11.55], CA: [-75.7, 45.42], CF: [20.94, 6.61],
  TD: [15.04, 12.13], CL: [-70.65, -33.45], CN: [116.4, 39.9], CO: [-74.07, 4.71],
  CR: [-84.08, 9.93], HR: [15.98, 45.81], CU: [-82.37, 23.11], CY: [33.37, 35.17],
  CZ: [14.42, 50.08], CD: [15.32, -4.32], DK: [12.57, 55.68], DO: [-69.9, 18.47],
  EC: [-78.47, -0.18], EG: [31.24, 30.04], SV: [-89.22, 13.69], ER: [38.79, 15.34],
  EE: [24.75, 59.44], ET: [38.7, 9.02], FI: [24.94, 60.17], FR: [2.35, 48.86],
  GA: [9.45, 0.39], GE: [44.81, 41.71], DE: [13.4, 52.52], GH: [-0.2, 5.6],
  GR: [23.73, 37.98], GT: [-90.51, 14.63], HT: [-72.34, 18.53], HN: [-87.21, 14.07],
  HU: [19.04, 47.5], IS: [-21.94, 64.15], IN: [77.2, 28.6], ID: [106.85, -6.2],
  IR: [51.39, 35.69], IQ: [44.37, 33.32], IE: [-6.26, 53.35], IL: [34.78, 32.09],
  IT: [12.5, 41.9], JM: [-76.79, 18.02], JP: [139.69, 35.69], JO: [35.93, 31.95],
  KZ: [71.42, 51.17], KE: [36.82, -1.29], KP: [125.76, 39.04], KR: [126.98, 37.57],
  KW: [47.96, 29.38], KG: [74.59, 42.87], LA: [102.63, 17.97], LV: [24.1, 56.95],
  LB: [35.5, 33.89], LR: [-10.8, 6.3], LY: [13.18, 32.89], LT: [25.28, 54.69],
  MY: [101.69, 3.14], ML: [-8.0, 12.65], MT: [14.51, 35.9], MR: [-15.96, 18.09],
  MX: [-99.13, 19.43], MD: [28.86, 47.01], MN: [106.9, 47.89], ME: [19.26, 42.44],
  MA: [-6.85, 31.63], MM: [96.16, 16.87], NP: [85.32, 27.71], NL: [4.9, 52.37],
  NZ: [174.76, -36.85], NI: [-86.25, 12.11], NE: [2.11, 13.51], NG: [7.4, 9.08],
  MK: [21.43, 41.99], NO: [10.75, 59.91], OM: [58.41, 23.59], PK: [73.05, 33.68],
  PS: [35.2, 31.9], PA: [-79.52, 8.98], PY: [-57.58, -25.26], PE: [-77.03, -12.05],
  PH: [120.98, 14.6], PL: [21.01, 52.23], PT: [-9.14, 38.72], QA: [51.53, 25.29],
  RO: [26.1, 44.46], RU: [37.62, 55.76], RW: [30.06, -1.94], SA: [46.68, 24.71],
  SN: [-17.44, 14.69], RS: [20.47, 44.82], SL: [-13.23, 8.48], SG: [103.82, 1.35],
  SK: [17.1, 48.15], SI: [14.5, 46.05], SO: [45.34, 2.05], ZA: [28.05, -25.75],
  SS: [31.6, 4.86], ES: [-3.7, 40.42], LK: [79.86, 6.93], SD: [32.56, 15.5],
  SE: [18.06, 59.33], CH: [7.45, 46.95], SY: [36.28, 33.51], TW: [121.57, 25.03],
  TJ: [68.77, 38.54], TZ: [35.74, -6.17], TH: [100.5, 13.76], TT: [-61.22, 10.65],
  TN: [10.18, 36.8], TR: [32.86, 39.93], TM: [58.38, 37.96], UG: [32.58, 0.35],
  UA: [30.52, 50.45], AE: [55.27, 25.2], GB: [-0.13, 51.5], US: [-77.04, 38.9],
  UY: [-56.19, -34.9], UZ: [69.24, 41.3], VE: [-66.9, 10.48], VN: [105.85, 21.03],
  YE: [44.2, 15.55], ZM: [28.32, -15.42], ZW: [31.05, -17.83],
};

/**
 * Gather live global crisis data from keyless public sources (USGS + EONET +
 * GDELT) in parallel. Each source is entirely optional: failures resolve to
 * empty arrays, never throwing.
 */
export async function gatherCrisisDeskData(timeoutMs: number = 6000): Promise<CrisisDeskData> {
  const [quakes, eonet, gdelt, advisories] = await Promise.allSettled([
    usgsEarthquakeClient.getGlobalEarthquakes(4.5, timeoutMs),
    eonetClient.getGlobalDisasters(timeoutMs),
    getGlobalConflictArticles(timeoutMs).catch(() => []),
    fetchGlobalTravelAdvisories(3, timeoutMs),
  ]);

  const quakesData = quakes.status === 'fulfilled' ? quakes.value : [];
  const eonetData = eonet.status === 'fulfilled' ? eonet.value : [];
  const gdeltData = gdelt.status === 'fulfilled' ? gdelt.value : [];
  const advisoryData = advisories.status === 'fulfilled' ? advisories.value : [];

  // Travel-advisory risk zones (countries rated >= 3 on the 0–5 scale).
  const travelAdvisoryZones: ThreatZone[] = [];
  for (const a of advisoryData) {
    const zone = advisoryToZone(a);
    if (zone) travelAdvisoryZones.push(zone);
  }

  // Disasters: USGS quakes + EONET events, USGS-first with de-dup by id.
  const disastersById = new Map<string, DisasterEvent>();
  for (const q of quakesData) {
    const d = quakeToDisaster(q);
    if (!disastersById.has(d.id)) disastersById.set(d.id, d);
  }
  for (const e of eonetData) {
    const d = eonetToDisaster(e);
    if (!disastersById.has(d.id)) disastersById.set(d.id, d);
  }

  // Social-unrest heat from GDELT geo-tagged conflict/protest coverage.
  const unrestHeat: HeatPoint[] = [];
  const unrestSeen = new Set<string>();
  for (const a of gdeltData) {
    const cc = a.countryCode;
    if (!cc) continue;
    const pos = COUNTRY_CENTER[cc];
    if (!pos || unrestSeen.has(cc)) continue;
    unrestSeen.add(cc);
    unrestHeat.push({
      id: `unrest-${cc}-${Date.now()}`,
      actor: 'unrest',
      priority: 'P2',
      position: pos,
      weight: 4,
      url: a.url || null,
      source: 'GDELT',
    });
  }

  return {
    disasters: Array.from(disastersById.values())
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 60),
    unrestHeat: unrestHeat.slice(0, 30),
    travelAdvisoryZones: travelAdvisoryZones.slice(0, 60),
  };
}

function severityRank(s: DisasterEvent['severity']): number {
  return s === 'CRITICAL' ? 4 : s === 'HIGH' ? 3 : s === 'MEDIUM' ? 2 : 1;
}

const DISASTER_TARGET_TYPE: Record<DisasterKind, Target['type']> = {
  EARTHQUAKE: 'INCIDENT',
  WILDFIRE: 'FIRE',
  FLOOD: 'INCIDENT',
  VOLCANO: 'EXPLOSION',
  STORM: 'INCIDENT',
  LANDSLIDE: 'INCIDENT',
  DROUGHT: 'INCIDENT',
  OTHER: 'INCIDENT',
};

// Advisory score (0–5) → risk-polygon fill colour (RGBA).
function advisoryColor(score: number): [number, number, number, number] {
  if (score >= 5) return [220, 50, 60, 0.22];
  if (score >= 4) return [240, 110, 60, 0.2];
  if (score >= 3) return [236, 154, 60, 0.18];
  return [236, 154, 60, 0.14];
}

/**
 * Build a coloured risk-zone polygon around a country's advisory rating.
 * Only countries with a meaningful risk score (already >= 3 from the API)
 * produce a polygon; size scales gently with severity.
 */
export function advisoryToZone(a: { code: string; name: string; score: number; level: string }): ThreatZone | null {
  const pos = COUNTRY_CENTER[a.code];
  if (!pos) return null;
  const [lng, lat] = pos;
  const size = 1.5 + Math.round(a.score) * 1.1;
  return {
    id: `advisory-${a.code}`,
    actor: a.code.toLowerCase(),
    priority: 'P2',
    category: 'ZONE',
    type: 'THREAT_CORRIDOR' as ThreatZone['type'],
    timestamp: '',
    name: `${a.name} — ${a.level} (${a.score}/5)`,
    coordinates: [
      [lng - size, lat - size * 0.8],
      [lng + size, lat - size * 0.8],
      [lng + size, lat + size * 0.8],
      [lng - size, lat + size * 0.8],
    ],
    color: advisoryColor(a.score),
    source: 'advisory',
  };
}

/** Map a crisis-desk disaster into a `Target` so it renders as a marker. */
export function disasterToTarget(d: DisasterEvent): Target {
  const critical = d.severity === 'CRITICAL';
  return {
    id: `disaster-${d.id}`,
    actor: 'natural',
    priority: critical || d.severity === 'HIGH' ? 'P1' : 'P2',
    category: 'INSTALLATION',
    type: DISASTER_TARGET_TYPE[d.kind],
    status: 'DEGRADED',
    timestamp: d.timestamp,
    name: d.name,
    position: d.position,
    description: d.description,
    url: d.url || null,
    source: `crisis:${d.source.toUpperCase()}`,
  };
}

/** Heat contribution for a disaster, weighted by severity. */
export function disasterToHeat(d: DisasterEvent): HeatPoint {
  const weight = d.severity === 'CRITICAL' ? 7 : d.severity === 'HIGH' ? 5 : 3;
  return {
    id: `disaster-heat-${d.id}`,
    actor: 'natural',
    priority: d.severity === 'CRITICAL' ? 'P1' : 'P2',
    position: d.position,
    weight,
    source: `crisis:${d.source.toUpperCase()}`,
  };
}

// Small helpers so `unrestSeen` stays an iterable Set with fresh keys each run.
function uncheckedHas(set: Set<string>, key: string): boolean {
  return set.has(key);
}
function uncheckedAdd(set: Set<string>, key: string): void {
  set.add(key);
}