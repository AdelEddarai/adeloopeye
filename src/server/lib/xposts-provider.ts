/**
 * X Posts (Signals) data provider
 * Reads signals from the database, which is populated from real-time news by
 * the real-time sync layer (no seed/fake data).
 */

import { prisma } from './db';
import { ensureConflictSynced } from './real-time-sync';
import type { XPost } from '@/types/domain';

/**
 * Get all X posts for a conflict (real-time synced)
 */
export async function getXPosts(conflictId: string): Promise<XPost[]> {
  await ensureConflictSynced(conflictId);

  const rows = await prisma.xPost.findMany({
    where: { conflictId },
    orderBy: { timestamp: 'desc' },
    take: 200,
    include: {
      actor: { select: { cssVar: true, colorRgb: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    tweetId: r.tweetId ?? undefined,
    postType: r.postType as XPost['postType'],
    handle: r.handle,
    displayName: r.displayName,
    avatar: r.avatar,
    avatarColor: r.avatarColor,
    verified: r.verified,
    accountType: r.accountType as XPost['accountType'],
    significance: r.significance as XPost['significance'],
    timestamp: r.timestamp.toISOString(),
    content: r.content,
    images: r.images,
    videoThumb: r.videoThumb ?? undefined,
    likes: r.likes,
    retweets: r.retweets,
    replies: r.replies,
    views: r.views,
    eventId: r.eventId ?? undefined,
    actorId: r.actorId ?? undefined,
    actorCssVar: r.actor?.cssVar ?? null,
    actorColorRgb: r.actor?.colorRgb ?? [],
    adeloopeyeNote: r.pharosNote ?? undefined,
    verificationStatus: r.verificationStatus as XPost['verificationStatus'],
    verifiedAt: r.verifiedAt?.toISOString() ?? undefined,
    xaiCitations: r.xaiCitations,
  }));
}

/**
 * Get a single X post by ID
 */
export async function getXPost(conflictId: string, postId: string): Promise<XPost | null> {
  const posts = await getXPosts(conflictId);
  return posts.find((p) => p.id === postId) || null;
}
