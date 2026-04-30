import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { adsbfiClient } from '@/server/lib/api-clients/adsbfi-client';

/**
 * GET /api/v1/live/flights
 * Real-time flight tracking using adsb.fi API
 * 
 * Query params:
 * - bbox: bounding box as "minLat,minLon,maxLat,maxLon" (optional)
 * - icao24: specific aircraft ICAO24 address
 * - global: set to "true" for global flights
 * 
 * Default: GLOBAL flights (multiple search points worldwide)
 */
export async function GET(req: NextRequest) {
  try {
    const bboxParam = req.nextUrl.searchParams.get('bbox');
    const icao24 = req.nextUrl.searchParams.get('icao24');
    const globalParam = req.nextUrl.searchParams.get('global');

    // If specific aircraft requested
    if (icao24) {
      const aircraft = await adsbfiClient.getAircraftByHex(icao24);
      if (aircraft) {
        const flight = adsbfiClient.parseAircraft(aircraft);
        return ok({
          flight,
          fetchedAt: new Date().toISOString(),
        });
      }
      return ok({
        flight: null,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Global flights search using multiple points worldwide
    const isGlobal = globalParam === 'true' || !bboxParam;
    
    if (isGlobal) {
      const aircraftList = await adsbfiClient.getGlobalFlights();

      const flights = aircraftList.map(ac => adsbfiClient.parseAircraft(ac));

      const validFlights = flights.filter(
        f => f.latitude !== null && f.longitude !== null
      );

      return ok(
        {
          flights: validFlights,
          bbox: [-90, -180, 90, 180],
          count: validFlights.length,
          fetchedAt: new Date().toISOString(),
          scope: 'global',
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
          },
        }
      );
    }

    // Regional flights (bbox provided)
    let bbox: [number, number, number, number] = [24, 32, 42, 63];
    
    if (bboxParam) {
      const parts = bboxParam.split(',').map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) {
        return err('BAD_REQUEST', 'Invalid bbox format. Use: minLat,minLon,maxLat,maxLon');
      }
      bbox = parts as [number, number, number, number];
    }

    const aircraftList = await adsbfiClient.getFlightsInBbox(bbox);

    const flights = aircraftList.map(ac => adsbfiClient.parseAircraft(ac));

    const validFlights = flights.filter(
      f => f.latitude !== null && f.longitude !== null
    );

    return ok(
      {
        flights: validFlights,
        bbox,
        count: validFlights.length,
        fetchedAt: new Date().toISOString(),
        scope: 'regional',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    return ok(
      {
        flights: [],
        bbox: [-90, -180, 90, 180],
        count: 0,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'adsb.fi API unavailable',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  }
}
