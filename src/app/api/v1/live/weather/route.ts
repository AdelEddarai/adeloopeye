import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { getWeatherByCoords } from '@/server/lib/api-clients/openweather-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    if (!lat || !lon) {
      return new Response('Missing lat/lon parameters', { status: 400 });
    }

    const weather = await getWeatherByCoords(lat, lon);

    if (!weather) {
      return new Response('Weather data not available', { status: 404 });
    }

    return ok(weather, {
      headers: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600', // 30 min cache
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
