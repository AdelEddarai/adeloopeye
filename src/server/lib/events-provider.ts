/**
 * Events data provider
 * Combines seed data with live news data
 */

import { EVENTS } from '../../../prisma/seed-data/iran-events';
import { newsAPIClient } from './api-clients/newsapi-client';
import { transformNewsToEvents } from './live-data-transformer';
import type { IntelEvent } from '@/types/domain';

/**
 * Get all events for a conflict (seed data + live news)
 */
export async function getEvents(conflictId: string): Promise<IntelEvent[]> {
  try {
    // Get seed events (all events are for iran-2026 conflict)
    const seedEvents = EVENTS;
    
    // Get live news events
    const articles = await newsAPIClient.searchNews('iran OR israel OR middle east conflict', 30, 'en');
    const liveEvents = transformNewsToEvents(articles);
    
    // Combine and sort by timestamp (newest first)
    const allEvents = [...seedEvents, ...liveEvents].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return allEvents;
  } catch (error) {
    console.error('Failed to fetch live events, returning seed data only:', error);
    // Fallback to seed data only
    return EVENTS;
  }
}

/**
 * Get a single event by ID
 */
export async function getEvent(conflictId: string, eventId: string): Promise<IntelEvent | null> {
  const events = await getEvents(conflictId);
  return events.find(e => e.id === eventId) || null;
}

/**
 * Get lite event data (minimal fields for lists)
 */
export async function getEventsLite(conflictId: string) {
  const events = await getEvents(conflictId);
  return events.map(e => ({
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

/**
 * Get seed events only (no live data)
 */
export function getSeedEvents(conflictId: string): IntelEvent[] {
  return EVENTS;
}
