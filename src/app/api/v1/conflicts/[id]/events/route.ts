import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { getEvents, getEventsLite } from '@/server/lib/events-provider';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conflictId } = await params;
  const lite = req.nextUrl.searchParams.get('lite') === 'true';
  
  try {
    if (lite) {
      const events = await getEventsLite(conflictId);
      return ok(events, {
        headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
      });
    }

    const events = await getEvents(conflictId);
    return ok(events, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    // Return empty array on error
    return ok([], {
      headers: { 'Cache-Control': 'public, max-age=10' },
    });
  }
}
