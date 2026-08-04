import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { ensureConflictSynced, generateDaysList } from '@/server/lib/real-time-sync';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conflictId } = await params;
  const lite = req.nextUrl.searchParams.get('lite') === 'true';

  await ensureConflictSynced(conflictId).catch(() => {
    /* Serve whatever is available in the DB */
  });

  const days = generateDaysList(30);

  if (lite) {
    return ok(
      days.map((day, idx) => ({ day, dayLabel: idx === days.length - 1 ? 'Today' : `Day ${idx + 1}` })),
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  }

  const snapshots = await prisma.conflictDaySnapshot.findMany({
    where: { conflictId },
    orderBy: { day: 'desc' },
    take: 30,
    include: {
      casualties: true,
      economicChips: { orderBy: { ord: 'asc' } },
      scenarios: { orderBy: { ord: 'asc' } },
    },
  });

  return ok(
    snapshots.map((s) => ({
      id: s.id,
      conflictId: s.conflictId,
      day: s.day.toISOString().split('T')[0],
      dayLabel: s.dayLabel,
      summary: s.summary,
      keyFacts: s.keyFacts,
      escalation: s.escalation,
      economicNarrative: s.economicNarrative,
      casualties: Object.fromEntries(s.casualties.map((c) => [c.faction, { killed: c.killed, wounded: c.wounded, civilians: c.civilians, injured: c.injured }])),
      economicImpact: { narrative: s.economicNarrative, chips: s.economicChips },
      economicChips: s.economicChips,
      scenarios: s.scenarios,
    })),
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
