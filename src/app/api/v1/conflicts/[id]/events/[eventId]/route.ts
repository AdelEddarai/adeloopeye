import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { getEvent } from '@/server/lib/events-provider';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id: conflictId, eventId } = await params;

  try {
    const event = await getEvent(conflictId, eventId);
    
    if (!event) {
      return err('NOT_FOUND', `Event ${eventId} not found`, 404);
    }

    return ok(event, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Failed to fetch event:', error);
    return err('INTERNAL_ERROR', 'Failed to fetch event', 500);
  }
}
