import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';
import { transformNewsToEvents, transformNewsToXPosts } from '@/server/lib/live-data-transformer';
import { calculateInstability, SEVEN_DAYS_MS } from '@/server/lib/instability';

const CACHE = 'public, s-maxage=30, stale-while-revalidate=120';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;

  try {
    // Fetch real-time news data
    const articles = await newsAPIClient.searchNews('iran OR israel OR syria OR iraq attack OR strike OR military', 50, 'en');
    
    // Transform to events and posts
    const events = transformNewsToEvents(articles);
    const xPosts = transformNewsToXPosts(articles);
    
    // Filter to last 7 days
    const since = new Date(Date.now() - SEVEN_DAYS_MS);
    const recentEvents = events.filter(e => new Date(e.timestamp) >= since);
    const recentPosts = xPosts.filter(p => new Date(p.timestamp) >= since);
    
    // Calculate instability from real-time data
    const result = calculateInstability(
      recentEvents.map(e => ({ timestamp: new Date(e.timestamp), severity: e.severity })),
      recentPosts.map(p => ({ timestamp: new Date(p.timestamp), significance: p.significance, verificationStatus: p.verificationStatus })),
      [] // No actor actions from news
    );

    return ok(result, { headers: { 'Cache-Control': CACHE } });
  } catch (error) {
    console.error('Failed to calculate instability:', error);
    // Return default instability on error
    return ok({ score: 50, trend: 'STABLE', factors: [] }, { headers: { 'Cache-Control': 'public, max-age=10' } });
  }
}
