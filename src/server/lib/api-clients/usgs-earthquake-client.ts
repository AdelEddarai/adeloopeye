/**
 * USGS Earthquake Client
 * Real-time seismic events from the USGS Earthquake Hazards feed (FREE, no API key)
 * https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 *
 * Filtered to Morocco and surrounding region (includes Alboran Sea, northern
 * Atlantic, and western Algeria where tremors are often felt in Morocco).
 */

export type MoroccoEarthquake = {
  id: string;
  magnitude: number;
  place: string;
  location: string;
  position: [number, number];
  depthKm: number;
  timestamp: string;
  tsunami: boolean;
  status: string;
  url: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

// Morocco + Alboran Sea + W Algeria + E Atlantic
export const MOROCCO_BBOX = [-20, 20, -1, 37] as const;

const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const QUERY_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

function magnitudeSeverity(mag: number): MoroccoEarthquake['severity'] {
  if (mag >= 5.0) return 'CRITICAL';
  if (mag >= 4.0) return 'HIGH';
  if (mag >= 3.0) return 'MEDIUM';
  return 'LOW';
}

function extractLocation(place: string): string {
  // USGS place format: "11 km NNE of Al Hoceima, Morocco"
  const match = place.match(/of\s+([^,]+)(?:,\s*(.+))?$/i);
  if (match) {
    return match[2] ? `${match[1].trim()}, ${match[2].trim()}` : match[1].trim();
  }
  return place;
}

function inMoroccoBBox(lng: number, lat: number): boolean {
  return lng >= MOROCCO_BBOX[0] && lng <= MOROCCO_BBOX[2] && lat >= MOROCCO_BBOX[1] && lat <= MOROCCO_BBOX[3];
}

function mapQuake(feature: any): MoroccoEarthquake | null {
  try {
    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (isNaN(lng) || isNaN(lat) || !inMoroccoBBox(lng, lat)) return null;

    const p = feature.properties || {};
    const mag = Number(p.mag) || 0;

    return {
      id: feature.id || `usgs-${Date.now()}-${Math.random()}`,
      magnitude: mag,
      place: p.place || 'Unknown location',
      location: extractLocation(p.place || 'Unknown location'),
      position: [lng, lat],
      depthKm: Number(coords[2]) || 0,
      timestamp: new Date(Number(p.time) || Date.now()).toISOString(),
      tsunami: !!p.tsunami,
      status: p.status || 'reviewed',
      url: p.url || 'https://earthquake.usgs.gov/',
      severity: magnitudeSeverity(mag),
    };
  } catch {
    return null;
  }
}

class UsgsEarthquakeClient {
  /**
   * Recent earthquakes (last 24h, all magnitudes) within the Morocco region
   */
  async getMoroccoEarthquakes(timeoutMs: number = 6000): Promise<MoroccoEarthquake[]> {
    const res = await fetch(FEED_URL, {
      headers: { 'User-Agent': 'AdeloopMoroccoIntel/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`USGS feed error: ${res.status}`);

    const json = await res.json();
    const quakes: MoroccoEarthquake[] = [];
    for (const feature of json?.features || []) {
      const q = mapQuake(feature);
      if (q) quakes.push(q);
    }

    return quakes
      .filter(q => q.magnitude >= 2.0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
  }

  /**
   * Earthquake history (last `days` days, mag >= 2.5) for charts and trend analysis
   */
  async getMoroccoEarthquakeHistory(days: number = 30, timeoutMs: number = 8000): Promise<MoroccoEarthquake[]> {
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const url = new URL(QUERY_URL);
    url.searchParams.set('format', 'geojson');
    url.searchParams.set('minmagnitude', '2.5');
    url.searchParams.set('starttime', start);
    url.searchParams.set('endtime', new Date().toISOString());
    url.searchParams.set('minlongitude', String(MOROCCO_BBOX[0]));
    url.searchParams.set('maxlongitude', String(MOROCCO_BBOX[2]));
    url.searchParams.set('minlatitude', String(MOROCCO_BBOX[1]));
    url.searchParams.set('maxlatitude', String(MOROCCO_BBOX[3]));
    url.searchParams.set('orderby', 'time');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AdeloopMoroccoIntel/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`USGS query error: ${res.status}`);

    const json = await res.json();
    const quakes: MoroccoEarthquake[] = [];
    for (const feature of json?.features || []) {
      const q = mapQuake(feature);
      if (q) quakes.push(q);
    }
    return quakes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const usgsEarthquakeClient = new UsgsEarthquakeClient();
