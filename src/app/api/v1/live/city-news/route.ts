import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');

    if (!city) {
      return new Response('Missing city parameter', { status: 400 });
    }

    // Fetch news about the city
    const articles = await newsAPIClient.searchNews(
      `${city} OR "${city}"`,
      20,
      'en'
    );

    return ok(articles, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache
      },
    });
  } catch (error) {
    console.error('City news API error:', error);
    return ok([], { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
}
