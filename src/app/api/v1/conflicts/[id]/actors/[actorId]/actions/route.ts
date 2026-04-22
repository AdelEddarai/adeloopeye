import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; actorId: string }> }) {
  await params;

  // Return empty actions array - no database needed
  return ok([], {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  });
}
