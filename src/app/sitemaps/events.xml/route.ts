import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  await ensureConflictSynced(CONFLICT_ID).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const events = [...store.getEvents(CONFLICT_ID)].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return createXmlResponse(
    renderSitemap(
      events.map((event) => ({
        url: toAbsoluteUrl(`/browse/events/${event.id}`),
        lastModified: new Date(event.createdAt),
      })),
    ),
  );
}
