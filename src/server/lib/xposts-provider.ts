/**
 * X Posts (Signals) data provider
 * Combines seed data with live news data
 */

import { X_POSTS } from '../../../prisma/seed-data/iran-x-posts';
import { newsAPIClient } from './api-clients/newsapi-client';
import { transformNewsToXPosts } from './live-data-transformer';
import type { XPost } from '@/types/domain';

/**
 * Get all X posts for a conflict (seed data + live news)
 */
export async function getXPosts(conflictId: string): Promise<XPost[]> {
  try {
    // Get seed posts (all posts are for iran-2026 conflict)
    const seedPosts = X_POSTS;
    
    // Get live news posts
    const articles = await newsAPIClient.searchNews('iran OR israel OR middle east conflict', 30, 'en');
    const livePosts = transformNewsToXPosts(articles);
    
    // Combine and sort by timestamp (newest first)
    const allPosts = [...seedPosts, ...livePosts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return allPosts;
  } catch (error) {
    console.error('Failed to fetch live posts, returning seed data only:', error);
    // Fallback to seed data only
    return X_POSTS;
  }
}

/**
 * Get a single X post by ID
 */
export async function getXPost(conflictId: string, postId: string): Promise<XPost | null> {
  const posts = await getXPosts(conflictId);
  return posts.find(p => p.id === postId) || null;
}

/**
 * Get seed posts only (no live data)
 */
export function getSeedXPosts(conflictId: string): XPost[] {
  return X_POSTS;
}
