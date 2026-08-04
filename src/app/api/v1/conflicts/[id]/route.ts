import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conflictId } = await params;

  await ensureConflictSynced(conflictId).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const conflict = store.getConflict(conflictId);

  if (!conflict) {
    return ok({ id: conflictId, summary: 'Awaiting first real-time sync', escalation: 5, status: 'ONGOING', threatLevel: 'MONITORING' });
  }

  return ok(
    {
      id: conflict.id,
      name: conflict.name,
      codename: conflict.codename,
      status: conflict.status,
      threatLevel: conflict.threatLevel,
      startDate: conflict.startDate,
      region: conflict.region,
      timezone: conflict.timezone,
      escalation: conflict.escalation,
      summary: conflict.summary,
      keyFacts: conflict.keyFacts,
      objectives: conflict.objectives,
      commanders: conflict.commanders,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    },
  );
}
