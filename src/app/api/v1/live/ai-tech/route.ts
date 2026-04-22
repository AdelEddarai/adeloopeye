import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { fetchAITechNews } from '@/server/lib/api-clients/ai-tech-client';

/**
 * AI & Tech News API
 * Returns real-time AI/LLM/Agent news from NewsAPI
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[AI Tech API] Fetching AI news...');
    const articles = await fetchAITechNews(30);
    console.log(`[AI Tech API] Fetched ${articles.length} articles`);

    return ok(
      {
        articles,
        timestamp: new Date().toISOString(),
        source: 'NewsAPI',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[AI Tech API] Error:', error);
    return ok(
      {
        articles: [],
        timestamp: new Date().toISOString(),
        source: 'NewsAPI',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
