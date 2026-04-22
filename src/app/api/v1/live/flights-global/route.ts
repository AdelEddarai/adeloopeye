import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { openSkyClient } from '@/server/lib/api-clients/opensky-client';

/**
 * Live global flights endpoint
 * Returns all airborne flights worldwide
 * Auto-refreshes every 10 seconds
 */
export async function GET(req: NextRequest) {
  try {
    const flights = await openSkyClient.getAllFlights();
    
    // Filter only airborne flights with valid positions
    const airborneFlights = flights.filter(
      f => !f.on_ground && f.latitude !== null && f.longitude !== null
    );

    console.log(`Fetched ${airborneFlights.length} airborne flights globally`);

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
