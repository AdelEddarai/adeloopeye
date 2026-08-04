import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; day: string }> }) {
  const { id: conflictId, day } = await params;

  if (!day) {
    return err('VALIDATION', 'Day parameter is required', 422);
  }

  await ensureConflictSynced(conflictId).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const snapshot = store.getSnapshotByDay(conflictId, day);

  if (!snapshot) {
    return ok(
      {
        id: `snap-${day}`,
        conflictId,
        day,
        dayLabel: 'Day',
        summary: 'No real-time data available for this day.',
        keyFacts: [],
        escalation: 5,
        casualties: {},
        economicImpact: { narrative: '', chips: [] },
        economicChips: [],
        scenarios: [],
      },
      {
        headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
      },
    );
  }

  return ok(
    {
      id: snapshot.id,
      conflictId: snapshot.conflictId,
      day,
      dayLabel: snapshot.dayLabel,
      summary: snapshot.summary,
      keyFacts: snapshot.keyFacts,
      escalation: snapshot.escalation,
      casualties: Object.fromEntries(snapshot.casualties.map((c) => [c.faction, { killed: c.killed, wounded: c.wounded, civilians: c.civilians, injured: c.injured }])),
      economicImpact: { narrative: snapshot.economicNarrative, chips: snapshot.economicChips },
      economicChips: snapshot.economicChips,
      scenarios: snapshot.scenarios,
    },
    {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    },
  );
}
