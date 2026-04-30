import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { adsbfiClient } from '@/server/lib/api-clients/adsbfi-client';

/**
 * Live global flights endpoint
 * Returns airborne flights in Middle East region (250 NM radius)
 * Auto-refreshes every 10 seconds
 */
export async function GET(req: NextRequest) {
  try {
    // Use a large radius search centered on Middle East
    const centerLat = 33;
    const centerLon = 44;
    const distNM = 250; // Maximum allowed by adsb.fi
    
    console.log(`[Global Flights API] Fetching from adsb.fi: center(${centerLat}, ${centerLon}) dist=${distNM}NM`);
    
    const aircraftList = await adsbfiClient.getFlightsByLocation(centerLat, centerLon, distNM);
    
    // Convert to OpenSky-compatible format
    const flights = aircraftList.map(ac => adsbfiClient.parseAircraft(ac));
    
    // Filter only airborne flights with valid positions
    const airborneFlights = flights.filter(
      f => !f.on_ground && f.latitude !== null && f.longitude !== null
    );

    console.log(`[Global Flights API] Fetched ${airborneFlights.length} airborne flights from adsb.fi`);

    return ok(
      {
        count: airborneFlights.length,
        timestamp: new Date().toISOString(),
        flights: airborneFlights,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
          'X-Flight-Count': String(airborneFlights.length),
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch global flights:', error);
    return ok(
      {
        count: 0,
        timestamp: new Date().toISOString(),
        flights: [],
        error: 'Failed to fetch flights',
      },
      {
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}
