import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { MOCK_SNAPSHOT } from '@/server/lib/mock-data-provider';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; day: string }> }) {
  const { day } = await params;
  
  if (!day) {
    return err('VALIDATION', 'Day parameter is required', 422);
  }

  // Return mock snapshot data
  return ok(
    {
      ...MOCK_SNAPSHOT,
      day,
    },
    {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    },
  );
}
