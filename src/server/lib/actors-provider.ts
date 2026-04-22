/**
 * Actors data provider
 * Uses seed data directly as the source of truth
 */

import { ACTORS } from '../../../prisma/seed-data/iran-actors';
import type { Actor } from '@/types/domain';

/**
 * Get all actors for a conflict
 */
export function getActors(conflictId: string): Actor[] {
  // All actors in seed data are for iran-2026 conflict
  return ACTORS;
}

/**
 * Get a single actor by ID
 */
export function getActor(conflictId: string, actorId: string): Actor | null {
  return ACTORS.find(a => a.id === actorId) || null;
}

/**
 * Get lite actor data (minimal fields for lists)
 */
export function getActorsLite(conflictId: string) {
  return getActors(conflictId).map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    activityLevel: a.activityLevel,
    stance: a.stance,
  }));
}
