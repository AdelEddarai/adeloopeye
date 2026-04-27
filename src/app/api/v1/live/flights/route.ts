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
  console.log('[Live Flights API] Request received');
  
  // Declare bbox outside try block so it's accessible in catch
  let bbox: [number, number, number, number] = [24, 32, 42, 63]; // Default
  
  try {
    const bboxParam = req.nextUrl.searchParams.get('bbox');
    const icao24 = req.nextUrl.searchParams.get('icao24');
    
    console.log('[Live Flights API] Params:', { bboxParam, icao24 });

    // If specific aircraft requested
    if (icao24) {
      console.log('[Live Flights API] Fetching specific aircraft:', icao24);
      const flight = await openSkyClient.getFlightByIcao(icao24);
      return ok({
        flight,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Parse bounding box or use Middle East default
    if (bboxParam) {
      const parts = bboxParam.split(',').map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) {
        console.error('[Live Flights API] Invalid bbox:', bboxParam);
        return err('BAD_REQUEST', 'Invalid bbox format. Use: minLat,minLon,maxLat,maxLon');
      }
      bbox = parts as [number, number, number, number];
    }

    console.log('[Live Flights API] Fetching flights for bbox:', bbox);
    const flights = await openSkyClient.getFlightsInBbox(bbox);
    console.log('[Live Flights API] Received', flights.length, 'flights from OpenSky');

    // Filter out flights with no position data
    const validFlights = flights.filter(
      f => f.latitude !== null && f.longitude !== null
    );
    
    console.log('[Live Flights API] Returning', validFlights.length, 'valid flights');

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
    console.error('[Live Flights API] Error:', error);
    
    // Return empty flights array with error details
    // Frontend will handle gracefully by showing no flights
    return ok(
      {
        flights: [],
        bbox,
        count: 0,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'OpenSky API unavailable',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  }
}
