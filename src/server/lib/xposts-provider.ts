/**
 * X Posts (Signals) data provider
 * Reads signals from the in-memory store, which is populated from real-time
 * news by the real-time sync layer (no database, no fake data).
 */

import { store } from './store';
import { ensureConflictSynced } from './real-time-sync';
import type { XPost } from '@/types/domain';

/**
 * Get all X posts for a conflict (real-time synced)
 */
export async function getXPosts(conflictId: string): Promise<XPost[]> {
  await ensureConflictSynced(conflictId);

  return store.getPosts(conflictId).map((r) => ({
    id: r.id,
    tweetId: r.tweetId,
    postType: r.postType,
    handle: r.handle,
    displayName: r.displayName,
    avatar: r.avatar,
    avatarColor: r.avatarColor,
    verified: r.verified,
    accountType: r.accountType,
    significance: r.significance,
    timestamp: r.timestamp,
    content: r.content,
    images: r.images,
    videoThumb: r.videoThumb,
    likes: r.likes,
    retweets: r.retweets,
    replies: r.replies,
    views: r.views,
    eventId: r.eventId,
    actorId: r.actorId,
    actorCssVar: r.actorCssVar,
    actorColorRgb: r.actorColorRgb,
    adeloopeyeNote: r.adeloopeyeNote,
    verificationStatus: r.verificationStatus,
    verifiedAt: r.verifiedAt,
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
