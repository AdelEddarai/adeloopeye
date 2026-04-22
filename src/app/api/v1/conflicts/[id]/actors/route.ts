import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { getActors, getActorsLite } from '@/server/lib/actors-provider';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conflictId } = await params;
  const lite = req.nextUrl.searchParams.get('lite') === 'true';
  
  if (lite) {
    const actors = getActorsLite(conflictId);
    return ok(actors, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  }

  // Full actor data with day snapshots
  const actors = getActors(conflictId);

  return ok(actors, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
