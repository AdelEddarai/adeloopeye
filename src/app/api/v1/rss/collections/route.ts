import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { CONFLICT_COLLECTIONS } from '@/server/data/rss-feeds';

export async function GET(req: NextRequest) {
  const conflictId = req.nextUrl.searchParams.get('conflictId');

  const collections = CONFLICT_COLLECTIONS.filter(c => (conflictId ? c.id === conflictId : true));

  return ok(collections, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
