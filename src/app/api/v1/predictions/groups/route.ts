import { ok } from '@/server/lib/api-utils';
import { MOCK_PREDICTION_GROUPS } from '@/server/lib/mock-data-provider';

export async function GET() {
  return ok(MOCK_PREDICTION_GROUPS, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
