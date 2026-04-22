import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { generateConflictData } from '@/server/lib/real-data-generator';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Consume params
  
  // Generate real-time conflict data from news
  const conflict = await generateConflictData();
  
  return ok(conflict, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
