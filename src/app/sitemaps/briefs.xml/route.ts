import { createXmlResponse, renderSitemap, toAbsoluteUrl } from '@/features/browse/lib/sitemap';

import { publicConflictId } from '@/shared/lib/env';
import { ensureConflictSynced } from '@/server/lib/real-time-sync';
import { store } from '@/server/lib/store';

const CONFLICT_ID = publicConflictId;

export async function GET() {
  await ensureConflictSynced(CONFLICT_ID).catch(() => {
    /* Serve whatever is currently in the in-memory store */
  });

  const briefs = [...store.getSnapshots(CONFLICT_ID)].reverse();

  return createXmlResponse(
    renderSitemap(
      briefs.map((brief) => ({
        url: toAbsoluteUrl(`/browse/brief/${brief.day}`),
        lastModified: new Date(brief.day),
      })),
    ),
  );
}
