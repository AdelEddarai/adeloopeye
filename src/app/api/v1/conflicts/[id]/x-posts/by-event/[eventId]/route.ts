import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';
import { transformNewsToXPosts } from '@/server/lib/live-data-transformer';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  await params;

  try {
    // Fetch real-time news and filter by event
    const articles = await newsAPIClient.searchNews('iran OR israel OR syria OR iraq', 20, 'en');
    const posts = transformNewsToXPosts(articles);
    
    // Filter posts related to this event (simple filtering for now)
    const filteredPosts = posts.slice(0, 10);

    return ok(filteredPosts, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Failed to fetch posts by event:', error);
    return ok([], { headers: { 'Cache-Control': 'public, max-age=10' } });
  }
}
