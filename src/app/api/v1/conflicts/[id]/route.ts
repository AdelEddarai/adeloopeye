import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conflictId } = await params;

  await ensureConflictSynced(conflictId).catch(() => {
    /* Serve whatever is available in the DB */
  });

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });

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
      startDate: conflict.startDate.toISOString().split('T')[0],
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
