import { prisma } from '@/server/lib/db';

import { buildActorDocument, buildMapStoryDocument } from './reference-document-builders';
import { buildEventDocument, buildSnapshotDocument, buildXPostDocument } from './timeline-document-builders';

export async function loadActorDocument(conflictId: string, actorId: string) {
  const actor = await prisma.actor.findFirst({
    where: { id: actorId, conflictId },
    select: {
      id: true,
      name: true,
      fullName: true,
      assessment: true,
      saying: true,
      doing: true,
      stance: true,
      activityLevel: true,
      type: true,
      keyFigures: true,
      linkedEventIds: true,
      actions: {
        orderBy: { date: 'desc' },
        take: 5,
        select: { date: true, type: true, description: true, significance: true },
      },
    },
  });

  return actor ? buildActorDocument(actor) : null;
}

export async function loadEventDocument(conflictId: string, eventId: string) {
  const event = await prisma.intelEvent.findFirst({
    where: { id: eventId, conflictId },
    select: {
      id: true,
      title: true,
      summary: true,
      fullContent: true,
      severity: true,
      type: true,
      location: true,
      timestamp: true,
      tags: true,
      sources: { select: { name: true, tier: true, reliability: true, url: true } },
      actorResponses: { select: { actorName: true, stance: true, type: true, statement: true } },
    },
  });

  return event ? buildEventDocument(event) : null;
}

export async function loadMapStoryDocument(conflictId: string, storyId: string) {
  const story = await prisma.mapStory.findFirst({
    where: { id: storyId, conflictId },
    select: {
      id: true,
      title: true,
      tagline: true,
      narrative: true,
      keyFacts: true,
      category: true,
      timestamp: true,
      events: { orderBy: { ord: 'asc' }, select: { time: true, label: true, type: true } },
    },
  });

  return story ? buildMapStoryDocument(story) : null;
}

export async function loadSnapshotDocument(conflictId: string, snapshotId: string) {
  const snapshot = await prisma.conflictDaySnapshot.findFirst({
    where: { id: snapshotId, conflictId },
    select: {
      id: true,
      day: true,
      dayLabel: true,
      summary: true,
      keyFacts: true,
      economicNarrative: true,
      escalation: true,
      casualties: { select: { faction: true, killed: true, wounded: true, civilians: true, injured: true } },
      economicChips: { orderBy: { ord: 'asc' }, select: { label: true, val: true, sub: true } },
      scenarios: { orderBy: { ord: 'asc' }, select: { label: true, prob: true, body: true } },
    },
  });

  return snapshot ? buildSnapshotDocument(snapshot) : null;
}

export async function loadXPostDocument(conflictId: string, postId: string) {
  const post = await prisma.xPost.findFirst({
    where: { id: postId, conflictId },
    select: {
      id: true,
      handle: true,
      displayName: true,
      content: true,
      // @ts-ignore
      adeloopeyeNote: true,
      significance: true,
      accountType: true,
      postType: true,
      timestamp: true,
      verificationStatus: true,
    },
  });
  // @ts-ignore
  return post ? buildXPostDocument(post) : null;
}
