/**
 * NASA EONET Disaster Client
 * Live natural disasters from the NASA Earth Observatory Natural Event Tracker (FREE, no API key)
 * https://eonet.gsfc.nasa.gov/docs/v3
 *
 * Covers wildfires, floods, severe storms, droughts, volcanoes, earthquakes,
 * and more — filtered to the Morocco region.
 */

export type MoroccoDisaster = {
  id: string;
  title: string;
  description: string;
  category: string;
  position: [number, number];
  timestamp: string;
  closed: boolean;
  sources: { id: string; url: string }[];
  url: string;
  magnitudeValue?: number;
  magnitudeUnit?: string;
};

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

// Morocco + surrounding region (matches USGS bbox)
const BBOX = '-20,20,-1,37';

// Map EONET category titles to a stable slug used by the UI
export function eonetCategorySlug(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('wildfire') || t.includes('fire')) return 'wildfire';
  if (t.includes('flood') || t.includes('severe') || t.includes('storm')) return 'flood-storm';
  if (t.includes('drought')) return 'drought';
  if (t.includes('volcano')) return 'volcano';
  if (t.includes('earthquake')) return 'earthquake';
  if (t.includes('landslide')) return 'landslide';
  if (t.includes('snow') || t.includes('cold')) return 'snow';
  if (t.includes('sea')) return 'ocean';
  return 'other';
}

class EonetClient {
  /**
   * Open (active) natural disasters in the Morocco region
   */
  async getMoroccoDisasters(timeoutMs: number = 6000): Promise<MoroccoDisaster[]> {
    const url = new URL(EONET_URL);
    url.searchParams.set('status', 'open');
    url.searchParams.set('bbox', BBOX);
    url.searchParams.set('limit', '50');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AdeloopMoroccoIntel/1.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`EONET error: ${res.status}`);

    const json = await res.json();
    const disasters: MoroccoDisaster[] = [];

    for (const event of json?.events || []) {
      try {
        const geometry = event.geometry && event.geometry[0];
        if (!geometry) continue;

        let lng = NaN;
        let lat = NaN;
        if (geometry.type === 'Point' && geometry.coordinates) {
          lng = Number(geometry.coordinates[0]);
          lat = Number(geometry.coordinates[1]);
        } else if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
          // Use polygon centroid for display
          const pts = geometry.coordinates[0];
          lng = pts.reduce((s: number, p: number[]) => s + Number(p[0]), 0) / pts.length;
          lat = pts.reduce((s: number, p: number[]) => s + Number(p[1]), 0) / pts.length;
        }
        if (isNaN(lng) || isNaN(lat)) continue;

        const category = event.categories && event.categories[0]
          ? event.categories[0].title
          : 'Natural Event';

        disasters.push({
          id: event.id || `eonet-${Date.now()}-${Math.random()}`,
          title: event.title || 'Untitled event',
          description: event.description || '',
          category,
          position: [lng, lat],
          timestamp: geometry.date || new Date().toISOString(),
          closed: !!event.closed,
          sources: (event.sources || []).map((s: any) => ({ id: s.id, url: s.url })),
          url: event.link || '',
          magnitudeValue: geometry.magnitudeValue,
          magnitudeUnit: geometry.magnitudeUnit,
        });
      } catch {
        // skip malformed event
      }
    }

    return disasters.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Open (active) natural disasters worldwide (no bbox) for the global crisis desk.
   */
  async getGlobalDisasters(timeoutMs: number = 6000): Promise<MoroccoDisaster[]> {
    const url = new URL(EONET_URL);
    url.searchParams.set('status', 'open');
    url.searchParams.set('limit', '100');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AdeloopMoroccoIntel/1.0', 'Accept': 'application/json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`EONET error: ${res.status}`);

    const json = await res.json();
    const disasters: MoroccoDisaster[] = [];

    for (const event of json?.events || []) {
      try {
        const geometry = event.geometry && event.geometry[0];
        if (!geometry) continue;

        let lng = NaN;
        let lat = NaN;
        if (geometry.type === 'Point' && geometry.coordinates) {
          lng = Number(geometry.coordinates[0]);
          lat = Number(geometry.coordinates[1]);
        } else if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
          const pts = geometry.coordinates[0];
          lng = pts.reduce((s: number, p: number[]) => s + Number(p[0]), 0) / pts.length;
          lat = pts.reduce((s: number, p: number[]) => s + Number(p[1]), 0) / pts.length;
        }
        if (isNaN(lng) || isNaN(lat)) continue;

        const category = event.categories && event.categories[0]
          ? event.categories[0].title
          : 'Natural Event';

        disasters.push({
          id: event.id || `eonet-${Date.now()}-${Math.random()}`,
          title: event.title || 'Untitled event',
          description: event.description || '',
          category,
          position: [lng, lat],
          timestamp: geometry.date || new Date().toISOString(),
          closed: !!event.closed,
          sources: (event.sources || []).map((s: any) => ({ id: s.id, url: s.url })),
          url: event.link || '',
          magnitudeValue: geometry.magnitudeValue,
          magnitudeUnit: geometry.magnitudeUnit,
        });
      } catch {
        // skip malformed event
      }
    }

    return disasters.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const eonetClient = new EonetClient();
