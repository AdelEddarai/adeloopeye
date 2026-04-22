import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { getActor } from '@/server/lib/actors-provider';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; actorId: string }> }) {
  const { id: conflictId, actorId } = await params;

  // Find actor in data
  const actor = getActor(conflictId, actorId);
  
  if (!actor) {
    return err('NOT_FOUND', `Actor ${actorId} not found`, 404);
  }

  return ok(actor, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  });
}
