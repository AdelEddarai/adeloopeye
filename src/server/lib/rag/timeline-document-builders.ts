import { RagDocumentSourceType } from '@/generated/prisma/client';

import type { RagDocument } from './document-types';

export function buildEventDocument(event: {
  id: string;
  title: string;
  summary: string;
  fullContent: string;
  severity: string;
  type: string;
  location: string;
  timestamp: Date;
  tags: string[];
  sources: { name: string; tier: number; reliability: number; url: string | null }[];
  actorResponses: { actorName: string; stance: string; type: string; statement: string }[];
}): RagDocument {
  const sources = event.sources.map(source => `${source.name} (tier ${source.tier}, reliability ${source.reliability})${source.url ? ` ${source.url}` : ''}`);
  const responses = event.actorResponses.map(response => `${response.actorName}: ${response.stance} / ${response.type} - ${response.statement}`);

  return {
    sourceType: RagDocumentSourceType.EVENT,
    sourceId: event.id,
    content: [
      event.title,
      event.summary,
      event.fullContent,
      sources.length > 0 ? `Sources: ${sources.join(' | ')}` : null,
      responses.length > 0 ? `Actor Responses: ${responses.join(' | ')}` : null,
    ].filter(Boolean).join('\n'),
    metadata: {
      title: event.title,
      severity: event.severity,
      type: event.type,
      location: event.location,
      timestamp: event.timestamp.toISOString(),
      tags: event.tags,
    },
  };
}

export function buildSnapshotDocument(snapshot: {
  id: string;
  day: Date;
  dayLabel: string;
  summary: string;
  keyFacts: string[];
  economicNarrative: string;
  escalation: number;
  casualties: { faction: string; killed: number; wounded: number; civilians: number; injured: number }[];
  economicChips: { label: string; val: string; sub: string }[];
  scenarios: { label: string; prob: string; body: string }[];
}): RagDocument {
  return {
    sourceType: RagDocumentSourceType.SNAPSHOT,
    sourceId: snapshot.id,
    content: [
      `Day: ${snapshot.dayLabel}`,
      snapshot.summary,
      snapshot.keyFacts.length > 0 ? `Key Facts: ${snapshot.keyFacts.join('; ')}` : null,
      snapshot.economicNarrative ? `Economic: ${snapshot.economicNarrative}` : null,
      snapshot.casualties.length > 0 ? `Casualties: ${snapshot.casualties.map(casualty => `${casualty.faction} killed ${casualty.killed}, wounded ${casualty.wounded}, civilians ${casualty.civilians}, injured ${casualty.injured}`).join(' | ')}` : null,
      snapshot.economicChips.length > 0 ? `Economic Indicators: ${snapshot.economicChips.map(chip => `${chip.label}: ${chip.val}${chip.sub ? ` (${chip.sub})` : ''}`).join(' | ')}` : null,
      snapshot.scenarios.length > 0 ? `Scenarios: ${snapshot.scenarios.map(scenario => `${scenario.label} ${scenario.prob} - ${scenario.body}`).join(' | ')}` : null,
    ].filter(Boolean).join('\n'),
    metadata: {
      day: snapshot.day.toISOString().slice(0, 10),
      dayLabel: snapshot.dayLabel,
      escalation: snapshot.escalation,
      title: snapshot.dayLabel,
    },
  };
}

export function buildXPostDocument(post: {
  id: string;
  handle: string;
  displayName: string;
  content: string;
  adeloopeyeNote: string | null;
  significance: string;
  accountType: string;
  postType: string;
  timestamp: Date;
  verificationStatus: string;
}): RagDocument {
  return {
    sourceType: RagDocumentSourceType.XPOST,
    sourceId: post.id,
    content: [
      `@${post.handle} (${post.displayName}): ${post.content}`,
      post.adeloopeyeNote ? `Adeloopeye Note: ${post.adeloopeyeNote}` : null,
      `Verification: ${post.verificationStatus}`,
    ].filter(Boolean).join('\n'),
    metadata: {
      title: `@${post.handle}`,
      handle: post.handle,
      displayName: post.displayName,
      significance: post.significance,
      accountType: post.accountType,
      postType: post.postType,
      timestamp: post.timestamp.toISOString(),
    },
  };
}
