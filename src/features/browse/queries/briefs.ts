import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { fmtDate } from '@/shared/lib/format';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

import { PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

export const getBriefs = cache(async (filters?: { page?: number }) => {
  await ensureConflictSynced(CONFLICT_ID);

  const page = Math.max(1, filters?.page ?? 1);
  const rows = [...store.getSnapshots(CONFLICT_ID)].reverse();
  const total = rows.length;
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    briefs: paged.map((r) => ({
      id: r.id,
      day: fmtDate(r.day),
      dayLabel: r.dayLabel,
      summary: r.summary,
      escalation: r.escalation,
      keyFacts: r.keyFacts,
    })),
    total,
  };
});

export const getBrief = cache(async (day: string) => {
  await ensureConflictSynced(CONFLICT_ID);

  const row = store.getSnapshotByDay(CONFLICT_ID, day);

  if (!row) return null;

  const previousSnapshot = row.casualties.length === 0
    ? [...store.getSnapshots(CONFLICT_ID)]
      .filter((s) => s.day < day && s.casualties.length > 0)
      .sort((a, b) => b.day.localeCompare(a.day))[0]
    : undefined;

  return {
    ...row,
    casualties: row.casualties.length > 0 ? row.casualties : (previousSnapshot?.casualties ?? []),
    day: fmtDate(row.day),
    createdAt: `${row.day}T00:00:00.000Z`,
    updatedAt: `${row.day}T00:00:00.000Z`,
  };
});
