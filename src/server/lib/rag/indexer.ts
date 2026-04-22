import { prisma } from '@/server/lib/db';

import { loadActorDocument, loadEventDocument, loadMapStoryDocument, loadSnapshotDocument, loadXPostDocument } from './document-loaders';
import { removeDocument, upsertDocument, upsertDocumentBatch } from './document-store';
import type { RagDocument } from './document-types';

import { RagDocumentSourceType } from '@/generated/prisma/client';

const REINDEX_BATCH_SIZE = 10;

async function syncSingleDocument(conflictId: string, loader: () => Promise<Awaited<ReturnType<typeof loadEventDocument>>>) {
  const document = await loader();
  if (!document) return false;
  return upsertDocument(conflictId, document);
}

export function removeActorDocument(conflictId: string, actorId: string) {
  return removeDocument(conflictId, RagDocumentSourceType.ACTOR, actorId);
}

export function removeEventDocument(conflictId: string, eventId: string) {
  return removeDocument(conflictId, RagDocumentSourceType.EVENT, eventId);
}

export function removeMapStoryDocument(conflictId: string, storyId: string) {
  return removeDocument(conflictId, RagDocumentSourceType.STORY, storyId);
}

export function removeSnapshotDocument(conflictId: string, snapshotId: string) {
  return removeDocument(conflictId, RagDocumentSourceType.SNAPSHOT, snapshotId);
}

export function removeXPostDocument(conflictId: string, postId: string) {
  return removeDocument(conflictId, RagDocumentSourceType.XPOST, postId);
}

export function upsertActorDocument(conflictId: string, actorId: string) {
  return syncSingleDocument(conflictId, () => loadActorDocument(conflictId, actorId));
}

export function upsertEventDocument(conflictId: string, eventId: string) {
  return syncSingleDocument(conflictId, () => loadEventDocument(conflictId, eventId));
}

export function upsertMapStoryDocument(conflictId: string, storyId: string) {
  return syncSingleDocument(conflictId, () => loadMapStoryDocument(conflictId, storyId));
}

export function upsertSnapshotDocument(conflictId: string, snapshotId: string) {
  return syncSingleDocument(conflictId, () => loadSnapshotDocument(conflictId, snapshotId));
}

export function upsertXPostDocument(conflictId: string, postId: string) {
  return syncSingleDocument(conflictId, () => loadXPostDocument(conflictId, postId));
}

export async function reindexConflict(conflictId: string) {
  const [events, xPosts, snapshots, actors, stories] = await Promise.all([
    prisma.intelEvent.findMany({ where: { conflictId }, select: { id: true } }),
    prisma.xPost.findMany({ where: { conflictId }, select: { id: true } }),
    prisma.conflictDaySnapshot.findMany({ where: { conflictId }, select: { id: true } }),
    prisma.actor.findMany({ where: { conflictId }, select: { id: true } }),
    prisma.mapStory.findMany({ where: { conflictId }, select: { id: true } }),
  ]);

  const documents = (await Promise.all([
    ...events.map(event => loadEventDocument(conflictId, event.id)),
    ...xPosts.map(post => loadXPostDocument(conflictId, post.id)),
    ...snapshots.map(snapshot => loadSnapshotDocument(conflictId, snapshot.id)),
    ...actors.map(actor => loadActorDocument(conflictId, actor.id)),
    ...stories.map(story => loadMapStoryDocument(conflictId, story.id)),
  ])).filter((document): document is RagDocument => document !== null);

  let embedded = 0;
  for (let index = 0; index < documents.length; index += REINDEX_BATCH_SIZE) {
    embedded += await upsertDocumentBatch(
      conflictId,
      documents.slice(index, index + REINDEX_BATCH_SIZE),
      true,
    );
  }

  return {
    events: events.length,
    xPosts: xPosts.length,
    snapshots: snapshots.length,
    actors: actors.length,
    stories: stories.length,
    embedded,
  };
}

export { reindexConflict as indexConflict };
