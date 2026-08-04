import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';
import { transformNewsToEvents } from '@/server/lib/live-data-transformer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const { id: conflictId } = await params;

  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? '25');
  const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 25;
  const afterId = req.nextUrl.searchParams.get('afterId') ?? undefined;
  const createdAfter = req.nextUrl.searchParams.get('createdAfter') ?? undefined;

  try {
    await ensureConflictSynced(conflictId).catch(() => {
      /* Serve whatever is currently in the in-memory store */
    });

    // Get events from the in-memory store (includes GDELT + multi-news + Telegram)
    const storeEvents = store.getEvents(conflictId);

    // Also fetch from NewsAPI for additional coverage
    let apiEvents: { id: string; createdAt: string; timestamp: string; severity: string; type: string; title: string; location: string; summary: string; verified: boolean; sources: Array<{ name: string; tier: number; reliability: number; url: string | null }> }[] = [];
    try {
      const articles = await newsAPIClient.searchNews('iran OR israel OR syria OR iraq breaking OR alert', take, 'en');
      apiEvents = transformNewsToEvents(articles);
    } catch {
      /* NewsAPI unavailable, continue with store events only */
    }

    // Combine store + API events, dedup by ID
    const seen = new Set<string>();
    const allEvents: typeof storeEvents = [];
    for (const e of storeEvents) {
      if (!seen.has(e.id)) { seen.add(e.id); allEvents.push(e); }
    }
    for (const e of apiEvents) {
      if (!seen.has(e.id)) { seen.add(e.id); allEvents.push(e as typeof storeEvents[number]); }
    }

    // Filter to only events newer than the cursor
    let filtered = allEvents;
    if (afterId) {
      const afterIdx = allEvents.findIndex(e => e.id === afterId);
      if (afterIdx >= 0) {
        filtered = allEvents.slice(afterIdx + 1);
      }
    }
    if (createdAfter) {
      const cutoff = new Date(createdAfter).getTime();
      filtered = filtered.filter(e => new Date(e.timestamp).getTime() > cutoff);
    }

    // Sort newest first, take limit
    filtered = filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, take);

    // Map to notification format
    const data = filtered.map(event => ({
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
