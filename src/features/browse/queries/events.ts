import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { fmtDate } from '@/shared/lib/format';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

import type { BrowseEventFilters } from '@/types/domain';

import { PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

export const getEvents = cache(async (filters?: BrowseEventFilters) => {
  await ensureConflictSynced(CONFLICT_ID);

  let rows = store.getEvents(CONFLICT_ID);

  if (filters?.severity?.length) {
    rows = rows.filter((e) => filters.severity?.includes(e.severity));
  }

  if (filters?.date) {
    const start = new Date(filters.date + 'T00:00:00Z').getTime();
    const end = new Date(filters.date + 'T23:59:59.999Z').getTime();
    rows = rows.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      return ts >= start && ts <= end;
    });
  }

  const page = Math.max(1, filters?.page ?? 1);
  const total = rows.length;
  const paged = rows
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    events: paged.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      severity: e.severity,
      type: e.type,
      title: e.title,
      location: e.location,
      summary: e.summary,
      verified: e.verified,
      tags: e.tags,
      sources: e.sources.map((s) => ({ name: s.name, url: s.url })),
    })),
    total,
  };
});

export const getEvent = cache(async (eventId: string) => {
  await ensureConflictSynced(CONFLICT_ID);

  const row = store.getEvents(CONFLICT_ID).find((e) => e.id === eventId);

  if (!row) return null;

  return {
    ...row,
    timestamp: row.timestamp,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
  };
});

export async function getEventDates(): Promise<Set<string>> {
  await ensureConflictSynced(CONFLICT_ID);

  const rows = store.getEvents(CONFLICT_ID);
  return new Set(rows.map((r) => fmtDate(r.timestamp)));
}

export const getXPostsByEvent = cache(async (eventId: string) => {
  await ensureConflictSynced(CONFLICT_ID);

  const rows = store
    .getPosts(CONFLICT_ID)
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return rows.map((r) => ({
    ...r,
    timestamp: r.timestamp,
    verifiedAt: r.verifiedAt ?? null,
    pharosNote: r.adeloopeyeNote,
  }));
});
