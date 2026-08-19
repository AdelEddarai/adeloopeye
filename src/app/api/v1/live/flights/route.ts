import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { adsbfiClient } from '@/server/lib/api-clients/adsbfi-client';
import { liveFlightsClient, classifyAircraft, type EnrichedLiveFlight } from '@/server/lib/api-clients/live-flights-client';

/**
 * GET /api/v1/live/flights
 * Real-time flight tracking using adsb.fi API + strategic aircraft fleet telemetry
 */
export async function GET(req: NextRequest) {
  try {
    const bboxParam = req.nextUrl.searchParams.get('bbox');
    const icao24 = req.nextUrl.searchParams.get('icao24');
    const globalParam = req.nextUrl.searchParams.get('global');
    const scopeParam = req.nextUrl.searchParams.get('scope');

    const strategicFlights = liveFlightsClient.getLiveStrategicFlights(scopeParam || undefined);

    // If specific aircraft requested
    if (icao24) {
      const matchStrategic = strategicFlights.find(f => f.icao24.toLowerCase() === icao24.toLowerCase());
      if (matchStrategic) {
        return ok({
          flight: matchStrategic,
          fetchedAt: new Date().toISOString(),
        });
      }

      const aircraft = await adsbfiClient.getAircraftByHex(icao24);
      if (aircraft) {
        const rawFlight = adsbfiClient.parseAircraft(aircraft);
        const { category, model } = classifyAircraft(rawFlight);
        const flight: EnrichedLiveFlight = {
          ...rawFlight,
          category,
          model,
          altitudeFt: rawFlight.baro_altitude ? Math.round(rawFlight.baro_altitude * 3.28084) : undefined,
          speedKnots: rawFlight.velocity || undefined,
          flightLevel: rawFlight.baro_altitude ? `FL${Math.round((rawFlight.baro_altitude * 3.28084) / 100)}` : undefined,
        };
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

    // Helper to merge ADS-B and strategic flights without duplicates
    const mergeFlights = (adsbList: any[]): EnrichedLiveFlight[] => {
      const mergedMap = new Map<string, EnrichedLiveFlight>();

      // Add strategic military and iconic flights first
      for (const sf of strategicFlights) {
        mergedMap.set(sf.icao24.toLowerCase(), sf);
      }

      // Add and classify ADS-B flights
      for (const ac of adsbList) {
        if (!ac.latitude || !ac.longitude) continue;
        const key = ac.icao24.toLowerCase();
        if (!mergedMap.has(key)) {
          const { category, model } = classifyAircraft(ac);
          const altFt = ac.baro_altitude ? Math.round(ac.baro_altitude * 3.28084) : undefined;
          const speedKt = ac.velocity || undefined;
          mergedMap.set(key, {
            ...ac,
            category,
            model,
            altitudeFt: altFt,
            speedKnots: speedKt,
            flightLevel: altFt ? `FL${Math.round(altFt / 100)}` : undefined,
          });
        }
      }

      return Array.from(mergedMap.values());
    };

    // Global flights search using multiple points worldwide
    const isGlobal = globalParam === 'true' || !bboxParam;
    
    if (isGlobal) {
      let aircraftList: any[] = [];
      try {
        aircraftList = (await adsbfiClient.getGlobalFlights()).map(ac => adsbfiClient.parseAircraft(ac));
      } catch (err) {
        console.warn('[Live Flights] ADS-B global fetch failed, relying on strategic live fleet:', err);
      }

      const validFlights = mergeFlights(aircraftList);

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
            'Cache-Control': 'public, max-age=5, stale-while-revalidate=15',
          },
        }
      );
    }

    // Morocco-focused flights (multi-hub coverage)
    if (scopeParam === 'morocco') {
      let aircraftList: any[] = [];
      try {
        aircraftList = (await adsbfiClient.getMoroccoFlights()).map(ac => adsbfiClient.parseAircraft(ac));
      } catch (err) {
        console.warn('[Live Flights] ADS-B morocco fetch failed, relying on strategic live fleet:', err);
      }

      const validFlights = mergeFlights(aircraftList);

      return ok(
        {
          flights: validFlights,
          bbox: [21, -17, 36, -1],
          count: validFlights.length,
          fetchedAt: new Date().toISOString(),
          scope: 'morocco',
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=5, stale-while-revalidate=15',
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

    let aircraftList: any[] = [];
    try {
      aircraftList = (await adsbfiClient.getFlightsInBbox(bbox)).map(ac => adsbfiClient.parseAircraft(ac));
    } catch (err) {
      console.warn('[Live Flights] ADS-B bbox fetch failed, relying on strategic live fleet:', err);
    }

    const validFlights = mergeFlights(aircraftList);

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
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=15',
        },
      }
    );
  } catch (error) {
    const strategicFlights = liveFlightsClient.getLiveStrategicFlights();
    return ok(
      {
        flights: strategicFlights,
        bbox: [-90, -180, 90, 180],
        count: strategicFlights.length,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'ADS-B fallback mode',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=15',
        },
      }
    );
  }
}
