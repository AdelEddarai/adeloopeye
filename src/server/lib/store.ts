/**
 * In-memory real-time data store (no database).
 *
 * The app no longer uses Postgres/Prisma. Real-time sync layer
 * (`real-time-sync.ts`) fetches live data from external APIs and stores the
 * shaped records here; providers and API routes read from this store. All
 * data is ephemeral — it lives for the lifetime of the server process and is
 * refreshed on a TTL/recency basis by the sync layer.
 */

import type {
  Actor,
  Conflict,
  IntelEvent,
  MapStory,
  StoryEvent,
  XPost,
} from '@/types/domain';

// ─── Stored shapes ────────────────────────────────────────────

export type StoredSource = { name: string; tier: number; reliability: number; url: string | null };

export type StoredActorResponse = {
  actorId: string;
  actorName: string;
  stance: 'SUPPORTING' | 'OPPOSING' | 'NEUTRAL' | 'UNKNOWN';
  type: string;
  statement: string;
};

export type StoredEvent = IntelEvent & {
  conflictId: string;
  sources: StoredSource[];
  actorResponses: StoredActorResponse[];
  createdAt: string;
};

export type StoredXPost = XPost & { conflictId: string };

export type StoredActor = Actor & {
  conflictId: string;
  responses?: StoredActorResponse[];
};

export type StoredCasualty = { faction: string; killed: number; wounded: number; civilians: number; injured: number };
export type StoredEconChip = { label: string; val: string; sub: string; color: string };
export type StoredScenario = { label: string; subtitle: string; color: string; prob: string; body: string };

export type StoredSnapshot = {
  id: string;
  conflictId: string;
  day: string; // YYYY-MM-DD
  dayLabel: string;
  summary: string;
  keyFacts: string[];
  escalation: number;
  economicNarrative: string;
  casualties: StoredCasualty[];
  economicChips: StoredEconChip[];
  scenarios: StoredScenario[];
};

export type StoredMapFeature = {
  id: string;
  conflictId: string;
  featureType: 'TARGET' | 'HEAT_POINT';
  sourceEventId: string | null;
  actor: string;
  priority: string;
  category: string;
  type: string;
  status: string | null;
  timestamp: string | null;
  geometry: Record<string, unknown>;
  properties: Record<string, unknown>;
};

export type StoredStory = MapStory & { conflictId: string };

// ─── Store ────────────────────────────────────────────────────

class InMemoryStore {
  private conflicts = new Map<string, Conflict>();
  private events = new Map<string, StoredEvent[]>();
  private posts = new Map<string, StoredXPost[]>();
  private actors = new Map<string, StoredActor[]>();
  private snapshots = new Map<string, StoredSnapshot[]>();
  private mapFeatures = new Map<string, StoredMapFeature[]>();
  private mapStories = new Map<string, StoredStory[]>();

  // Conflict
  setConflict(conflict: Conflict): void { this.conflicts.set(conflict.id, conflict); }
  getConflict(id: string): Conflict | undefined { return this.conflicts.get(id); }
  hasConflict(id: string): boolean { return this.conflicts.has(id); }

  // Events
  setEvents(conflictId: string, events: StoredEvent[]): void { this.events.set(conflictId, events); }
  getEvents(conflictId: string): StoredEvent[] { return this.events.get(conflictId) ?? []; }

  // X posts
  setPosts(conflictId: string, posts: StoredXPost[]): void { this.posts.set(conflictId, posts); }
  getPosts(conflictId: string): StoredXPost[] { return this.posts.get(conflictId) ?? []; }

  // Actors
  setActors(conflictId: string, actors: StoredActor[]): void { this.actors.set(conflictId, actors); }
  getActors(conflictId: string): StoredActor[] { return this.actors.get(conflictId) ?? []; }

  // Day snapshots
  setSnapshots(conflictId: string, snapshots: StoredSnapshot[]): void { this.snapshots.set(conflictId, snapshots); }
  getSnapshots(conflictId: string): StoredSnapshot[] { return this.snapshots.get(conflictId) ?? []; }
  getSnapshotByDay(conflictId: string, day: string): StoredSnapshot | undefined {
    return this.getSnapshots(conflictId).find((s) => s.day === day);
  }

  // Map features
  setMapFeatures(conflictId: string, features: StoredMapFeature[]): void { this.mapFeatures.set(conflictId, features); }
  getMapFeatures(conflictId: string): StoredMapFeature[] { return this.mapFeatures.get(conflictId) ?? []; }

  // Map stories
  setMapStories(conflictId: string, stories: StoredStory[]): void { this.mapStories.set(conflictId, stories); }
  getMapStories(conflictId: string): StoredStory[] { return this.mapStories.get(conflictId) ?? []; }
}

export const store = new InMemoryStore();

// ─── Static reference config (no database) ────────────────────

export { RSS_FEEDS, CONFLICT_COLLECTIONS } from '@/server/data/rss-feeds';
export { MARKET_GROUPS } from '@/data/prediction-groups';

export type { Conflict as StoredConflict, StoryEvent as StoredStoryEvent };
