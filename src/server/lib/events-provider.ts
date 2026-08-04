/**
 * Events data provider
 * Reads events from the database, which is populated from real-time sources
 * by the real-time sync layer (no seed/fake data).
 */

import { prisma } from './db';
import { ensureConflictSynced } from './real-time-sync';
import type { IntelEvent } from '@/types/domain';

/**
 * Get all events for a conflict (real-time synced)
 */
export async function getEvents(conflictId: string): Promise<IntelEvent[]> {
  await ensureConflictSynced(conflictId);

  const rows = await prisma.intelEvent.findMany({
    where: { conflictId },
    orderBy: { timestamp: 'desc' },
    take: 200,
    include: {
      sources: true,
      actorResponses: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp.toISOString(),
    createdAt: r.createdAt.toISOString(),
    severity: r.severity as IntelEvent['severity'],
    type: r.type as IntelEvent['type'],
    title: r.title,
    location: r.location,
    summary: r.summary,
    fullContent: r.fullContent,
    verified: r.verified,
    sources: r.sources.map((s) => ({
      name: s.name,
      tier: s.tier,
      reliability: s.reliability,
      url: s.url,
    })),
    actorResponses: r.actorResponses.map((a) => ({
      actorId: a.actorId,
      actorName: a.actorName,
      stance: a.stance as 'SUPPORTING' | 'OPPOSING' | 'NEUTRAL' | 'UNKNOWN',
      type: a.type,
      statement: a.statement,
    })),
    tags: r.tags,
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
