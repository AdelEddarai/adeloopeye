import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';

/**
 * GET /api/v1/live/news
 * Real-time news streaming from multiple sources (GNews, NewsData, NewsAPI)
 * Automatic fallback for better reliability
 * 
 * Query params:
 * - q: search query (default: "iran israel conflict")
 * - limit: number of articles (default: 20, max: 100)
 * - language: language code (default: "en")
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('q') || 'iran israel conflict';
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') || '20', 10),
      100
    );
    const language = req.nextUrl.searchParams.get('language') || 'en';

    const articles = await multiNewsClient.searchNews(query, limit, language);

    return ok(
      {
        articles,
        query,
        count: articles.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('News API error:', error);
    return err(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch news',
      500
    );
  }
}
