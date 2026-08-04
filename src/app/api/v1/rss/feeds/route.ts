import { ok } from '@/server/lib/api-utils';
import { prisma } from '@/server/lib/db';

export async function GET() {
  const feeds = await prisma.rssFeed.findMany({
    orderBy: [{ tier: 'asc' }, { name: 'asc' }],
  });

  return ok(feeds, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
