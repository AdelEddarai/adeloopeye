import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

import { PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

type ActorFilters = {
  type?: string[];
  affiliation?: string[];
  page?: number;
};

export const getActors = cache(async (filters?: ActorFilters) => {
  await ensureConflictSynced(CONFLICT_ID);

  let rows = store.getActors(CONFLICT_ID);

  if (filters?.type?.length) {
    rows = rows.filter((a) => filters.type?.includes(a.type));
  }
  if (filters?.affiliation?.length) {
    rows = rows.filter((a) => filters.affiliation?.includes(a.affiliation));
  }

  const page = Math.max(1, filters?.page ?? 1);
  const total = rows.length;
  const paged = rows
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    actors: paged.map((a) => ({
      id: a.id,
      name: a.name,
      fullName: a.fullName,
      countryCode: a.countryCode,
      type: a.type,
      affiliation: a.affiliation,
      cssVar: a.cssVar,
      colorRgb: a.colorRgb,
      activityLevel: a.activityLevel,
      activityScore: a.activityScore,
      stance: a.stance,
      saying: a.saying,
      assessment: a.assessment,
    })),
    total,
  };
});

export const getActor = cache(async (actorId: string) => {
  await ensureConflictSynced(CONFLICT_ID);

  const row = store.getActors(CONFLICT_ID).find((a) => a.id === actorId);

  if (!row) return null;

  return {
    ...row,
    responses: (row.responses ?? []).map((r) => ({
      ...r,
      event: null,
    })),
  };
});
