/**
 * OpenSky Network Client
 * Free real-time flight tracking API
 * https://openskynetwork.github.io/opensky-api/
 */

export class OpenSkyClient {
  private baseUrl = 'https://opensky-network.org/api';
  private username?: string;
  private password?: string;

  constructor(username?: string, password?: string) {
    this.username = username || process.env.OPENSKY_USERNAME;
    this.password = password || process.env.OPENSKY_PASSWORD;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add basic auth if credentials provided (increases rate limit from 10s to 5s intervals)
    if (this.username && this.password) {
      // Use btoa() instead of Buffer for Edge Runtime compatibility (Netlify, Vercel Edge)
      const auth = btoa(`${this.username}:${this.password}`);
      headers['Authorization'] = `Basic ${auth}`;
      console.log('[OpenSky Client] Using authenticated request (better rate limits)');
    } else {
      console.warn('[OpenSky Client] No credentials - using anonymous access (limited rate)');
    }

    try {
      console.log('[OpenSky Client] Requesting:', url.toString());
      
      const res = await fetch(url.toString(), {
        headers,
        next: { revalidate: 10 }, // Cache for 10s (flights move fast)
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      console.log('[OpenSky Client] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'No error details');
        console.error('[OpenSky Client] API error:', {
          status: res.status,
          statusText: res.statusText,
          body: errorText,
          authenticated: !!this.username,
        });
        
        // Provide specific error messages for common issues
        if (res.status === 429) {
          throw new Error('OpenSky API rate limit exceeded. Authenticated users: 5s intervals, Anonymous: 10s intervals.');
        } else if (res.status === 401) {
          throw new Error('OpenSky API authentication failed. Check OPENSKY_USERNAME and OPENSKY_PASSWORD.');
        } else if (res.status === 503) {
          throw new Error('OpenSky API service unavailable. Try again later.');
        }
        
        throw new Error(`OpenSky API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log('[OpenSky Client] Success, states count:', data.states?.length || 0);
      return data;
    } catch (error) {
      console.error('[OpenSky Client] Request failed:', {
        error: error instanceof Error ? error.message : String(error),
        url: url.toString(),
        authenticated: !!this.username,
      });
      throw error;
    }
  }

  /**
   * Get all flights in bounding box
   * @param bbox [minLat, minLon, maxLat, maxLon]
   */
  async getFlightsInBbox(bbox: [number, number, number, number]): Promise<OpenSkyFlight[]> {
    const [lamin, lomin, lamax, lomax] = bbox;
    const response = await this.request<OpenSkyResponse>('/states/all', {
      lamin: String(lamin),
      lomin: String(lomin),
      lamax: String(lamax),
      lomax: String(lomax),
    });

    return (response.states || []).map(this.parseState);
  }

  /**
   * Get all current flights (no filter)
   */
  async getAllFlights(): Promise<OpenSkyFlight[]> {
    const response = await this.request<OpenSkyResponse>('/states/all');
    return (response.states || []).map(this.parseState);
  }

  /**
   * Get flights for specific aircraft by ICAO24 address
   */
  async getFlightByIcao(icao24: string): Promise<OpenSkyFlight | null> {
    const response = await this.request<OpenSkyResponse>('/states/all', {
      icao24: icao24.toLowerCase(),
    });

    if (!response.states || response.states.length === 0) return null;
    return this.parseState(response.states[0]);
  }

  /**
   * Get flights arriving at airport
   * @param airport ICAO airport code (e.g., 'EDDF' for Frankfurt)
   * @param begin Unix timestamp
   * @param end Unix timestamp
   */
  async getArrivals(airport: string, begin: number, end: number) {
    return this.request<OpenSkyFlightInfo[]>('/flights/arrival', {
      airport,
      begin: String(begin),
      end: String(end),
    });
  }

  /**
   * Get flights departing from airport
   */
  async getDepartures(airport: string, begin: number, end: number) {
    return this.request<OpenSkyFlightInfo[]>('/flights/departure', {
      airport,
      begin: String(begin),
      end: String(end),
    });
  }

  /**
   * Parse OpenSky state vector into typed object
   */
  private parseState(state: OpenSkyStateVector): OpenSkyFlight {
    return {
      icao24: state[0],
      callsign: state[1]?.trim() || null,
      origin_country: state[2],
      time_position: state[3],
      last_contact: state[4],
      longitude: state[5],
      latitude: state[6],
      baro_altitude: state[7],
      on_ground: state[8],
      velocity: state[9],
      true_track: state[10],
      vertical_rate: state[11],
      sensors: state[12],
      geo_altitude: state[13],
      squawk: state[14],
      spi: state[15],
      position_source: state[16],
    };
  }
}

// OpenSky API types
type OpenSkyStateVector = [
  string,      // 0: icao24
  string,      // 1: callsign
  string,      // 2: origin_country
  number,      // 3: time_position
  number,      // 4: last_contact
  number | null, // 5: longitude
  number | null, // 6: latitude
  number | null, // 7: baro_altitude
  boolean,     // 8: on_ground
  number | null, // 9: velocity
  number | null, // 10: true_track
  number | null, // 11: vertical_rate
  number[] | null, // 12: sensors
  number | null, // 13: geo_altitude
  string | null, // 14: squawk
  boolean,     // 15: spi
  number,      // 16: position_source
];

type OpenSkyResponse = {
  time: number;
  states: OpenSkyStateVector[] | null;
};

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

export type OpenSkyFlightInfo = {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string;
  lastSeen: number;
  estArrivalAirport: string;
  callsign: string;
  estDepartureAirportHorizDistance: number;
  estDepartureAirportVertDistance: number;
  estArrivalAirportHorizDistance: number;
  estArrivalAirportVertDistance: number;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
};

// Singleton instance
export const openSkyClient = new OpenSkyClient();
