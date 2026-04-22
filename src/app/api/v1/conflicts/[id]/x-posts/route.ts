import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { getXPosts } from '@/server/lib/xposts-provider';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conflictId } = await params;
  
  try {
    const posts = await getXPosts(conflictId);
    
    return ok(posts, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    // Return empty array on error
    return ok([], {
      headers: { 'Cache-Control': 'public, max-age=10' },
    });
  }
}
