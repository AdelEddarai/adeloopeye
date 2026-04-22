import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { countryIntelligenceClient } from '@/server/lib/api-clients/country-intelligence-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('code');
    const countryName = searchParams.get('name');

    if (!countryCode && !countryName) {
      return new Response('Missing country code or name parameter', { status: 400 });
    }

    // Get country code from name if needed
    let code = countryCode;
    if (!code && countryName) {
      code = countryIntelligenceClient.searchCountryCode(countryName);
      if (!code) {
        return new Response('Country not found', { status: 404 });
      }
    }

    const intelligence = await countryIntelligenceClient.getCountryIntelligence(code!);

    if (!intelligence) {
      return new Response('Failed to fetch country intelligence', { status: 500 });
    }

    return ok(intelligence, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200', // 1 hour cache
      },
    });
  } catch (error) {
    console.error('Country intelligence API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
