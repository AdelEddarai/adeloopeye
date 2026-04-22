/**
 * Optional live AIS snapshots via Datalastic (free tier / API key).
 * https://api.datalastic.com/api/v0/vessel_inradius
 *
 * Set DATALASTIC_API_KEY in the environment. Without a key, returns [].
 */

import type { MaritimeVessel } from '@/data/map-data';

const BASE = 'https://api.datalastic.com/api/v0/vessel_inradius';

type Hub = { lat: number; lon: number };

const DEFAULT_HUBS: Hub[] = [
  { lat: 26.45, lon: 56.35 },
  { lat: 1.35, lon: 103.75 },
  { lat: 35.95, lon: -5.45 },
];

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number.parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function normalizeVessel(raw: Record<string, unknown>, idx: number): MaritimeVessel | null {
  const lat =
    pickNumber(raw, ['lat', 'latitude', 'Lat', 'Latitude']) ??
    pickNumber(raw, ['lat_deg', 'LAT']);
  const lon =
    pickNumber(raw, ['lon', 'lng', 'longitude', 'Lon', 'Longitude']) ??
    pickNumber(raw, ['lon_deg', 'LON']);
  if (lat === null || lon === null) return null;

  const mmsi = pickString(raw, ['mmsi', 'MMSI', 'mmsi_number']);
  const name = pickString(raw, ['name', 'shipname', 'vessel_name', 'Name']) ?? 'Unknown vessel';
  const cog = pickNumber(raw, ['course', 'cog', 'COG', 'true_heading', 'heading']) ?? undefined;
  const sog = pickNumber(raw, ['speed', 'sog', 'SOG']) ?? undefined;
  const shipType = pickString(raw, ['type', 'ship_type', 'type_specific', 'vessel_type']);
  const flag = pickString(raw, ['flag', 'country_iso', 'country']);

  const tsRaw = pickString(raw, ['last_position_utc', 'last_position_epoch', 'timestamp', 'ais_timestamp']);
  const timestamp = tsRaw ?? new Date().toISOString();

  const id = mmsi ? `mmsi-${mmsi}` : `ves-${idx}-${lat.toFixed(2)}-${lon.toFixed(2)}`;

  return {
    id,
    mmsi,
    name,
    position: [lon, lat],
    cog: cog ?? undefined,
    sog: sog ?? undefined,
    shipType,
    flag,
    timestamp,
    source: 'DATALASTIC',
  };
}

function extractVesselList(json: unknown): Record<string, unknown>[] {
  if (!json || typeof json !== 'object') return [];
  const root = json as Record<string, unknown>;
  const data = root.data;
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const vessels = d.vessels ?? d.ships ?? d.results;
    if (Array.isArray(vessels)) return vessels as Record<string, unknown>[];
  }
  if (Array.isArray(root.vessels)) return root.vessels as Record<string, unknown>[];
  return [];
}

async function fetchHub(apiKey: string, hub: Hub, radiusNm: number): Promise<MaritimeVessel[]> {
  const url = new URL(BASE);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('lat', String(hub.lat));
  url.searchParams.set('lon', String(hub.lon));
  url.searchParams.set('radius', String(radiusNm));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    console.warn('[Datalastic] vessel_inradius failed:', res.status, hub);
    return [];
  }
  const json: unknown = await res.json();
  const rows = extractVesselList(json);
  const out: MaritimeVessel[] = [];
  rows.forEach((row, i) => {
    const v = normalizeVessel(row, i);
    if (v) out.push(v);
  });
  return out;
}

/**
 * Merges AIS snapshots from several chokepoint hubs (max 50 NM per Datalastic docs).
 */
export async function fetchDatalasticVesselsSnapshot(): Promise<MaritimeVessel[]> {
  const apiKey = process.env.DATALASTIC_API_KEY?.trim();
  if (!apiKey) return [];

  const radiusNm = Math.min(
    50,
    Math.max(5, Number.parseInt(process.env.DATALASTIC_VESSEL_RADIUS_NM ?? '45', 10) || 45),
  );

  const hubs = DEFAULT_HUBS;
  const settled = await Promise.allSettled(hubs.map(h => fetchHub(apiKey, h, radiusNm)));
  const merged = new Map<string, MaritimeVessel>();

  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const v of r.value) {
      merged.set(v.mmsi ?? v.id, v);
    }
  }

  const max = Math.min(400, Math.max(50, Number.parseInt(process.env.DATALASTIC_VESSEL_MAX ?? '220', 10) || 220));
  return [...merged.values()].slice(0, max);
}
