import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { openSkyClient } from '@/server/lib/api-clients/opensky-client';

/**
 * GET /api/v1/live/flights
 * Real-time flight tracking from OpenSky Network
 * 
 * Query params:
 * - bbox: bounding box as "minLat,minLon,maxLat,maxLon"
 * - icao24: specific aircraft ICAO24 address
 * 
 * Default bbox covers Middle East conflict zone:
 * [24, 32, 42, 63] = Persian Gulf, Iran, Israel, Iraq, Syria
 */
export async function GET(req: NextRequest) {
  try {
    const bboxParam = req.nextUrl.searchParams.get('bbox');
    const icao24 = req.nextUrl.searchParams.get('icao24');

    // If specific aircraft requested
    if (icao24) {
      const flight = await openSkyClient.getFlightByIcao(icao24);
      return ok({
        flight,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Parse bounding box or use Middle East default
    let bbox: [number, number, number, number];
    if (bboxParam) {
      const parts = bboxParam.split(',').map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) {
        return err('BAD_REQUEST', 'Invalid bbox format. Use: minLat,minLon,maxLat,maxLon');
      }
      bbox = parts as [number, number, number, number];
    } else {
      // Default: Middle East region
      bbox = [24, 32, 42, 63];
    }

    const flights = await openSkyClient.getFlightsInBbox(bbox);

    // Filter out flights with no position data
    const validFlights = flights.filter(
      f => f.latitude !== null && f.longitude !== null
    );

    return ok(
      {
        flights: validFlights,
        bbox,
        count: validFlights.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Flights API error:', error);
    return err(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch flights',
      500
    );
  }
}
