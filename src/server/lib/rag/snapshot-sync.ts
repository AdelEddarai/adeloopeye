import { prisma } from '@/server/lib/db';

import { upsertSnapshotDocument } from './indexer';

export async function syncSnapshotDocumentForDay(conflictId: string, day: Date) {
  const snapshot = await prisma.conflictDaySnapshot.findUnique({
    where: { conflictId_day: { conflictId, day } },
    select: { id: true },
  });

  if (!snapshot) return null;
  await upsertSnapshotDocument(conflictId, snapshot.id);
  return snapshot.id;
}
