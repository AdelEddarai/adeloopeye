import { ok } from '@/server/lib/api-utils';
import { ensureConflictSynced, generateDaysList } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

export async function GET() {
  const conflictId = process.env.NEXT_PUBLIC_CONFLICT_ID ?? 'iran-2026';

  await ensureConflictSynced(conflictId).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const conflict = store.getConflict(conflictId);

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
