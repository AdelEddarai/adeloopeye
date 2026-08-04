import { BROWSE_PAGE_SIZES, BROWSE_STATIC_ROUTES, buildPaginatedUrls, createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  await ensureConflictSynced(CONFLICT_ID).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const eventTotal = store.getEvents(CONFLICT_ID).length;
  const actorTotal = store.getActors(CONFLICT_ID).length;
  const briefTotal = store.getSnapshots(CONFLICT_ID).length;
  const storyTotal = store.getMapStories(CONFLICT_ID).length;

  return createXmlResponse(
    renderSitemap([
      ...BROWSE_STATIC_ROUTES.map((path) => ({ url: toAbsoluteUrl(path) })),
      ...buildPaginatedUrls('/browse/events', eventTotal, BROWSE_PAGE_SIZES.events),
      ...buildPaginatedUrls('/browse/actors', actorTotal, BROWSE_PAGE_SIZES.actors),
      ...buildPaginatedUrls('/browse/brief', briefTotal, BROWSE_PAGE_SIZES.briefs),
      ...buildPaginatedUrls('/browse/stories', storyTotal, BROWSE_PAGE_SIZES.stories),
    ]),
  );
}
