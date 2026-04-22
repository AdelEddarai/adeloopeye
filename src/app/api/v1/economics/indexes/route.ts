import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { ECONOMIC_INDEXES } from '@/server/lib/economic-indexes';

export async function GET(req: NextRequest) {
  return ok(ECONOMIC_INDEXES, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
