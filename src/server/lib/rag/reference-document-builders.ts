import { RagDocumentSourceType } from '@/generated/prisma/client';

import type { RagDocument } from './document-types';

export function buildActorDocument(actor: {
  id: string;
  name: string;
  fullName: string;
  assessment: string;
  saying: string;
  doing: string[];
  stance: string;
  activityLevel: string;
  type: string;
  keyFigures: string[];
  linkedEventIds: string[];
  actions: { date: string; type: string; description: string; significance: string }[];
}): RagDocument {
  const actions = actor.actions.map(action => `${action.date}: ${action.type} (${action.significance}) - ${action.description}`);

  return {
    sourceType: RagDocumentSourceType.ACTOR,
    sourceId: actor.id,
    content: [
      `${actor.fullName} (${actor.name})`,
      `Stance: ${actor.stance} | Activity: ${actor.activityLevel} | Type: ${actor.type}`,
      `Saying: ${actor.saying}`,
      `Doing: ${actor.doing.join('; ')}`,
      `Assessment: ${actor.assessment}`,
      actor.keyFigures.length > 0 ? `Key Figures: ${actor.keyFigures.join('; ')}` : null,
      actor.linkedEventIds.length > 0 ? `Linked Events: ${actor.linkedEventIds.join(', ')}` : null,
      actions.length > 0 ? `Recent Actions: ${actions.join(' | ')}` : null,
    ].filter(Boolean).join('\n'),
    metadata: {
      name: actor.name,
      fullName: actor.fullName,
      stance: actor.stance,
      activityLevel: actor.activityLevel,
      type: actor.type,
    },
  };
}

export function buildMapStoryDocument(story: {
  id: string;
  title: string;
  tagline: string;
  narrative: string;
  keyFacts: string[];
  category: string;
  timestamp: Date;
  events: { time: string; label: string; type: string }[];
}): RagDocument {
  return {
    sourceType: RagDocumentSourceType.STORY,
    sourceId: story.id,
    content: [
      `${story.title} - ${story.tagline}`,
      story.narrative,
      story.keyFacts.length > 0 ? `Key Facts: ${story.keyFacts.join('; ')}` : null,
      story.events.length > 0 ? `Timeline: ${story.events.map(event => `${event.time} ${event.type} ${event.label}`).join(' | ')}` : null,
    ].filter(Boolean).join('\n'),
    metadata: {
      title: story.title,
      category: story.category,
      timestamp: story.timestamp.toISOString(),
    },
  };
}
