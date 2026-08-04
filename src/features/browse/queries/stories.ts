import { cache } from 'react';

import { publicConflictId } from '@/shared/lib/env';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

import { STORY_PAGE_SIZE } from './page-size';

const CONFLICT_ID = publicConflictId;

export const getStories = cache(async (page = 1) => {
  await ensureConflictSynced(CONFLICT_ID);

  const rows = [...store.getMapStories(CONFLICT_ID)]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const total = rows.length;
  const paged = rows.slice((page - 1) * STORY_PAGE_SIZE, page * STORY_PAGE_SIZE);

  return {
    stories: paged.map((r) => ({
      id: r.id,
      title: r.title,
      tagline: r.tagline,
      category: r.category,
      narrative: r.narrative,
      keyFacts: r.keyFacts,
      timestamp: r.timestamp,
      eventCount: r.events.length,
    })),
    total,
  };
});

export const getStory = cache(async (storyId: string) => {
  await ensureConflictSynced(CONFLICT_ID);

  const row = store.getMapStories(CONFLICT_ID).find((s) => s.id === storyId);

  if (!row) return null;

  return {
    ...row,
    timestamp: row.timestamp,
    createdAt: row.timestamp,
    updatedAt: row.timestamp,
  };
});
