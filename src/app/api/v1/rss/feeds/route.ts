import { ok } from '@/server/lib/api-utils';
import { RSS_FEEDS } from '@/server/data/rss-feeds';

export async function GET() {
  const feeds = [...RSS_FEEDS].sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

  return ok(feeds, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
