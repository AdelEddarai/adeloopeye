/**
 * Actors data provider
 * Reads actors from the in-memory store, which is populated from real-time
 * sources by the real-time sync layer (no database, no fake data).
 */

import { store } from './store';
import { ensureConflictSynced } from './real-time-sync';
import type { Actor } from '@/types/domain';

/**
 * Get all actors for a conflict
 */
export async function getActors(conflictId: string): Promise<Actor[]> {
  await ensureConflictSynced(conflictId);

  return store.getActors(conflictId).map((row) => ({
    id: row.id,
    name: row.name,
    fullName: row.fullName,
    countryCode: row.countryCode,
    type: row.type,
    mapKey: row.mapKey,
    cssVar: row.cssVar,
    colorRgb: row.colorRgb,
    affiliation: row.affiliation,
    mapGroup: row.mapGroup,
    activityLevel: row.activityLevel,
    activityScore: row.activityScore,
    stance: row.stance,
    saying: row.saying,
    doing: row.doing,
    assessment: row.assessment,
    recentActions: row.recentActions,
    keyFigures: row.keyFigures,
    linkedEventIds: row.linkedEventIds,
    daySnapshots: row.daySnapshots,
  }));
}

/**
 * Get a single actor by ID
 */
export async function getActor(conflictId: string, actorId: string): Promise<Actor | null> {
  const actors = await getActors(conflictId);
  return actors.find((a) => a.id === actorId) || null;
}

/**
 * Get lite actor data (minimal fields for lists)
 */
export async function getActorsLite(conflictId: string) {
  const actors = await getActors(conflictId);
  return actors.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    activityLevel: a.activityLevel,
    stance: a.stance,
  }));
}
