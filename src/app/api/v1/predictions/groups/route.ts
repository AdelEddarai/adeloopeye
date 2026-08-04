import { ok } from '@/server/lib/api-utils';
import { MARKET_GROUPS } from '@/data/prediction-groups';

export async function GET() {
  return ok(MARKET_GROUPS, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
