import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';
import { ensureConflictSynced, generateDaysList } from '@/server/lib/real-time-sync';

export async function GET() {
  const conflictId = process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';

  await ensureConflictSynced(conflictId).catch(() => {
    /* Serve whatever is available in the DB */
  });

  const conflict = await prisma.conflict.findUnique({
    where: { id: conflictId },
    select: {
      id: true,
      name: true,
      status: true,
      threatLevel: true,
      escalation: true,
    },
  });

  return ok(
    {
      conflictId: conflict?.id ?? conflictId,
      conflictName: conflict?.name ?? 'Global & Middle East Conflict Monitor',
      days: generateDaysList(30),
      status: conflict?.status ?? 'ONGOING',
      threatLevel: conflict?.threatLevel ?? 'MONITORING',
      escalation: conflict?.escalation ?? 5,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    },
  );
}
