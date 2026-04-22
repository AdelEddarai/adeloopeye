import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';
import { transformNewsToEvents } from '@/server/lib/live-data-transformer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '25');
  const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 25;

  try {
    // Fetch real-time news
    const articles = await newsAPIClient.searchNews('iran OR israel OR syria OR iraq breaking OR alert', take, 'en');
    const events = transformNewsToEvents(articles);
    
    // Map to notification format
    const data = events.map(event => ({
      id: event.id,
      createdAt: event.createdAt,
      timestamp: event.timestamp,
      severity: event.severity,
      type: event.type,
      title: event.title,
      location: event.location,
      summary: event.summary,
      verified: event.verified,
      sourceCount: event.sources.length,
    }));

    return ok(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Failed to fetch event notifications:', error);
    return ok([], { headers: { 'Cache-Control': 'public, max-age=10' } });
  }
}
