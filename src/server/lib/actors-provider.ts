/**
 * Actors data provider
 * Reads actors from the database, which is populated from real-time sources
 * by the real-time sync layer (no seed/fake data).
 */

import { prisma } from './db';
import { ensureConflictSynced } from './real-time-sync';
import type { Actor } from '@/types/domain';

/**
 * Get all actors for a conflict
 */
export async function getActors(conflictId: string): Promise<Actor[]> {
  await ensureConflictSynced(conflictId);

  const rows = await prisma.actor.findMany({
    where: { conflictId },
    orderBy: { activityScore: 'desc' },
    include: {
      actions: { orderBy: { date: 'desc' }, take: 20 },
      daySnapshots: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    fullName: row.fullName,
    countryCode: row.countryCode ?? undefined,
    type: (row.type === 'NON_STATE' ? 'NON-STATE' : row.type) as Actor['type'],
    mapKey: row.mapKey ?? undefined,
    cssVar: row.cssVar ?? undefined,
    colorRgb: row.colorRgb ?? undefined,
    affiliation: row.affiliation ?? undefined,
    mapGroup: row.mapGroup ?? undefined,
    activityLevel: row.activityLevel as Actor['activityLevel'],
    activityScore: row.activityScore,
    stance: row.stance as Actor['stance'],
    saying: row.saying,
    doing: row.doing,
    assessment: row.assessment,
    recentActions: row.actions.map((a) => ({
      date: a.date,
      type: a.type as 'MILITARY' | 'DIPLOMATIC' | 'POLITICAL' | 'ECONOMIC' | 'INTELLIGENCE',
      description: a.description,
      verified: a.verified,
      significance: a.significance as 'HIGH' | 'MEDIUM' | 'LOW',
    })),
    keyFigures: row.keyFigures,
    linkedEventIds: row.linkedEventIds,
    daySnapshots: Object.fromEntries(
      row.daySnapshots.map((s) => [
        s.day.toISOString().split('T')[0],
        {
          activityLevel: s.activityLevel,
          activityScore: s.activityScore,
          stance: s.stance,
          saying: s.saying,
          doing: s.doing,
          assessment: s.assessment,
        },
      ])
    ),
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
