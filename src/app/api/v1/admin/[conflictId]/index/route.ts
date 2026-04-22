import { NextRequest } from 'next/server';

import { requireAdmin } from '@/server/lib/admin-auth';
import { err, ok } from '@/server/lib/api-utils';
import { indexConflict } from '@/server/lib/rag/indexer';

export const maxDuration = 300; // indexing can take a while

export async function POST(req: NextRequest, { params }: { params: Promise<{ conflictId: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { conflictId } = await params;

  try {
    const counts = await indexConflict(conflictId);
    return ok({ conflictId, indexed: counts });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error during indexing';
    return err('INDEX_ERROR', message, 500);
  }
}
