/**
 * Events data provider
 * Reads events from the in-memory store, which is populated from real-time
 * sources by the real-time sync layer (no database, no fake data).
 */

import { store } from './store';
import { ensureConflictSynced } from './real-time-sync';
import type { IntelEvent } from '@/types/domain';

/**
 * Get all events for a conflict (real-time synced)
 */
export async function getEvents(conflictId: string): Promise<IntelEvent[]> {
  await ensureConflictSynced(conflictId);

  return store.getEvents(conflictId).map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    createdAt: e.createdAt,
    severity: e.severity,
    type: e.type,
    title: e.title,
    location: e.location,
    summary: e.summary,
    fullContent: e.fullContent,
    verified: e.verified,
    sources: e.sources,
    actorResponses: e.actorResponses,
    tags: e.tags,
  }));
}

/**
 * Get a single event by ID
 */
export async function getEvent(conflictId: string, eventId: string): Promise<IntelEvent | null> {
  const events = await getEvents(conflictId);
  return events.find((e) => e.id === eventId) || null;
}

/**
 * Get lite event data (minimal fields for lists)
 */
export async function getEventsLite(conflictId: string) {
  const events = await getEvents(conflictId);
  return events.map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    severity: e.severity,
    type: e.type,
    title: e.title,
    location: e.location,
    verified: e.verified,
    tags: e.tags,
  }));
}
