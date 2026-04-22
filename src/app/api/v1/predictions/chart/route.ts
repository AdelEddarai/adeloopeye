import { NextRequest } from 'next/server';

import type { TimePoint } from '@/types/domain';
import { err, ok } from '@/server/lib/api-utils';

export async function GET(req: NextRequest) {
  const conditionId = req.nextUrl.searchParams.get('id');
  if (!conditionId) {
    return err('MISSING_ID', 'missing id', 400);
  }

  try {
    const url = `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(conditionId)}&interval=all&fidelity=60`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return err('CLOB_ERROR', `CLOB ${res.status}`, res.status);
    }
    const data = await res.json() as { history?: TimePoint[] };
    return ok({ history: data.history ?? [] });
  } catch (e) {
    return err('FETCH_ERROR', String(e), 500);
  }
}
