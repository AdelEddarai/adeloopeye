/**
 * adsb.fi Client
 * Free real-time flight tracking API
 * https://adsb.fi/
 * https://github.com/adsbfi/opendata
 * 
 * Community-driven flight tracker with 5400+ feeders worldwide
 * Provides open and unfiltered access to worldwide air traffic data
 * Rate limit: 1 request/second for public endpoints
 */

export class ADSBFiClient {
  private baseUrl = 'https://opendata.adsb.fi/api';

  /**
   * Get flights within a radius of a center point
   * @param lat Center latitude
   * @param lon Center longitude
   * @param dist Distance in nautical miles (max 250 NM)
   */
  async getFlightsByLocation(lat: number, lon: number, dist: number = 250): Promise<ADSBFiAircraft[]> {
    try {
      const url = `${this.baseUrl}/v3/lat/${lat}/lon/${lon}/dist/${dist}`;
      
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'No error details');
        
        if (res.status === 429) {
          throw new Error('adsb.fi API rate limit exceeded. Max 1 request/second.');
        } else if (res.status === 503) {
          throw new Error('adsb.fi API service unavailable. Try again later.');
        }
        
        throw new Error(`adsb.fi API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      return data.ac || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get flights in a bounding box by calculating center point
   * and using the maximum distance that covers the bbox
   * @param bbox [minLat, minLon, maxLat, maxLon]
   */
  async getFlightsInBbox(bbox: [number, number, number, number]): Promise<ADSBFiAircraft[]> {
    const [minLat, minLon, maxLat, maxLon] = bbox;
    
    // Calculate center point
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    
    // Calculate approximate distance needed to cover the bbox
    // Using haversine formula approximation
    const latDiff = Math.abs(maxLat - minLat);
    const lonDiff = Math.abs(maxLon - minLon);
    
    // Convert to nautical miles (1 degree lat ≈ 60 NM)
    const latDistNM = latDiff * 60;
    const lonDistNM = lonDiff * 60 * Math.cos((centerLat * Math.PI) / 180);
    
    // Use the larger dimension, add 20% margin
    const maxDistNM = Math.max(latDistNM, lonDistNM) * 1.2;
    
    // Cap at 250 NM (adsb.fi limit)
    const distNM = Math.min(maxDistNM, 250);
    
    const aircraft = await this.getFlightsByLocation(centerLat, centerLon, distNM);
    
    // Filter aircraft to ensure they're within the bbox
    return aircraft.filter(ac => 
      ac.lat !== null && ac.lon !== null &&
      ac.lat >= minLat && ac.lat <= maxLat &&
      ac.lon >= minLon && ac.lon <= maxLon
    );
  }

  /**
   * Get specific aircraft by ICAO hex code
   * @param hex ICAO 24-bit address (hex string)
   */
  async getAircraftByHex(hex: string): Promise<ADSBFiAircraft | null> {
    try {
      const url = `${this.baseUrl}/v2/hex/${hex}`;
      
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`adsb.fi API error: ${res.status}`);
      }

      const data = await res.json();
      const aircraft = data.ac?.[0] || null;
      return aircraft;
    } catch (error) {
      console.error('[ADSB.fi Client] Failed to fetch aircraft:', error);
      throw error;
    }
  }

  /**
   * Get all aircraft (full snapshot)
   * Note: This endpoint requires feeder authentication
   * For public access, use getFlightsByLocation or getFlightsInBbox
   */
  async getAllAircraft(): Promise<ADSBFiAircraft[]> {
    console.warn('[ADSB.fi Client] getAllAircraft requires feeder authentication');
    console.warn('[ADSB.fi Client] Use getFlightsByLocation or getFlightsInBbox instead');
    return [];
  }

  /**
   * Get GLOBAL flights by searching multiple strategic points worldwide
   * This covers major flight corridors and busy airspace
   */
  async getGlobalFlights(): Promise<ADSBFiAircraft[]> {
    // Strategic search points covering major flight routes worldwide
    const searchPoints = [
      // North America
      { lat: 40.7128, lon: -74.0060, dist: 250 }, // New York
      { lat: 34.0522, lon: -118.2437, dist: 250 }, // Los Angeles
      { lat: 41.8781, lon: -87.6298, dist: 250 }, // Chicago
      
      // Europe
      { lat: 51.5074, lon: -0.1278, dist: 250 }, // London
      { lat: 48.8566, lon: 2.3522, dist: 250 }, // Paris
      { lat: 52.5200, lon: 13.4050, dist: 250 }, // Berlin
      
      // Middle East
      { lat: 25.2048, lon: 55.2708, dist: 250 }, // Dubai
      { lat: 33.3152, lon: 44.3661, dist: 250 }, // Baghdad
      
      // Asia
      { lat: 35.6762, lon: 139.6503, dist: 250 }, // Tokyo
      { lat: 31.2304, lon: 121.4737, dist: 250 }, // Shanghai
      { lat: 1.3521, lon: 103.8198, dist: 250 }, // Singapore
      
      // Australia
      { lat: -33.8688, lon: 151.2093, dist: 250 }, // Sydney
      
      // Africa
      { lat: -26.2041, lon: 28.0473, dist: 250 }, // Johannesburg
    ];

    const allAircraft: ADSBFiAircraft[] = [];
    const seenHexes = new Set<string>();

    // Search each location with delay to respect rate limits
    for (let i = 0; i < searchPoints.length; i++) {
      const point = searchPoints[i];
      
      try {
        const aircraft = await this.getFlightsByLocation(point.lat, point.lon, point.dist);
        
        for (const ac of aircraft) {
          if (!seenHexes.has(ac.hex) && ac.lat !== null && ac.lon !== null) {
            seenHexes.add(ac.hex);
            allAircraft.push(ac);
          }
        }
        
        if (i < searchPoints.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      } catch (err) {
        // Silently continue if one location fails
      }
    }

    return allAircraft;
  }

  /**
   * Parse adsb.fi aircraft data to unified format
   */
  parseAircraft(ac: ADSBFiAircraft): OpenSkyFlight {
    return {
      icao24: ac.hex || '',
      callsign: ac.flight ? ac.flight.trim() : null,
      origin_country: ac.r || 'Unknown',
      time_position: ac.seen_pos || 0,
      last_contact: ac.seen || 0,
      longitude: ac.lon,
      latitude: ac.lat,
      baro_altitude: ac.alt_baro !== undefined ? ac.alt_baro : ac.alt_geom,
      on_ground: ac.alt_baro === 0 || ac.alt_geom === 0,
      velocity: ac.gs || null,
      true_track: ac.track || null,
      vertical_rate: ac.baro_rate || ac.geom_rate || null,
      sensors: null,
      geo_altitude: ac.alt_geom !== undefined ? ac.alt_geom : ac.alt_baro,
      squawk: ac.squawk || null,
      spi: ac.spi || false,
      position_source: 0,
    };
  }
}

// adsb.fi API response types
export type ADSBFiAircraft = {
  hex: string;                    // ICAO 24-bit address
  type: string;                   // Message type (ADSB, MODES, etc.)
  flight: string | null;          // Callsign
  r: string;                      // Registration
  t: string;                      // Aircraft type
  alt_baro: number | null;        // Barometric altitude
  alt_geom: number | null;        // Geometric altitude
  gs: number | null;              // Ground speed (knots)
  track: number | null;           // Ground track (degrees)
  baro_rate: number | null;       // Barometric vertical rate
  geom_rate: number | null;       // Geometric vertical rate
  squawk: string | null;          // Squawk code
  emergency: string | null;       // Emergency status
  category: string | null;        // Aircraft category
  nav_qnh: number | null;         // Nav QNH
  nav_altitude_mcp: number | null;// MCP altitude
  nav_heading: number | null;     // Autopilot heading
  lat: number | null;             // Latitude
  lon: number | null;             // Longitude
  nic: number | null;             // Navigation integrity
  rc: number | null;              // Navigation integrity radius
  seen_pos: number | null;        // Seconds since position update
  version: number | null;         // ADS-B version
  nic_baro: number | null;        // Barometric altitude NIC
  nac_p: number | null;           // Position NIC
  nac_v: number | null;           // Velocity NIC
  sil: number | null;             // Source integrity level
  sil_type: string | null;        // SIL type
  gva: number | null;             // Geometric vertical accuracy
  sda: number | null;             // System design assurance
  alert: boolean | null;          // Alert flag
  spi: boolean | null;            // SPI flag
  mlat: string[] | null;          // MLAT components
  tisb: string[] | null;          // TIS-B components
  messages: number | null;        // Total messages
  seen: number | null;            // Seconds since last message
  rssi: number | null;            // Signal strength
};

// OpenSky-compatible flight type (for backward compatibility)
export type OpenSkyFlight = {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
};

// Singleton instance
export const adsbfiClient = new ADSBFiClient();
