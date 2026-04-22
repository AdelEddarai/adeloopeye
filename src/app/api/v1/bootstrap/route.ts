import { ok } from '@/server/lib/api-utils';
import { MOCK_CONFLICT, MOCK_DAYS } from '@/server/lib/mock-data-provider';

export async function GET() {
  return ok(
    {
      conflictId: MOCK_CONFLICT.id,
      conflictName: MOCK_CONFLICT.name,
      days: MOCK_DAYS,
      status: MOCK_CONFLICT.status,
      threatLevel: MOCK_CONFLICT.threatLevel,
      escalation: MOCK_CONFLICT.escalation,
    },
    {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    },
  );
}
