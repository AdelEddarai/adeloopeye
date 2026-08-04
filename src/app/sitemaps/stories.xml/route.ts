import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  await ensureConflictSynced(CONFLICT_ID).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const stories = [...store.getMapStories(CONFLICT_ID)].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return createXmlResponse(
    renderSitemap(
      stories.map((story) => ({
        url: toAbsoluteUrl(`/browse/stories/${story.id}`),
        lastModified: new Date(story.timestamp),
      })),
    ),
  );
}
