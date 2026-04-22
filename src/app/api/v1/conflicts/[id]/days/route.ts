import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { generateDaysList, generateDailySnapshot } from '@/server/lib/real-data-generator';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Consume params
  const lite = req.nextUrl.searchParams.get('lite') === 'true';
  
  const days = generateDaysList();
  
  if (lite) {
    return ok(
      days.map((day, idx) => ({ day, dayLabel: `Day ${idx + 1}` })),
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  }

  // Generate snapshots for all days
  const snapshots = await Promise.all(
    days.map(day => generateDailySnapshot(day))
  );

  return ok(snapshots, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
