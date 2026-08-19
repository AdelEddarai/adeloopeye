import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { liveVesselsClient } from '@/server/lib/api-clients/live-vessels-client';

/**
 * GET /api/v1/live/vessels
 * Real-time modern military and commercial vessel tracking with dead reckoning.
 *
 * Query params:
 * - bbox: "minLat,minLon,maxLat,maxLon" (optional)
 * - scope: "global" | "morocco" | "middle-east" | "red-sea" | "hormuz" | "mediterranean"
 * - category: "CARRIER" | "DESTROYER" | "FRIGATE" | "SUBMARINE" | "TANKER" | "CONTAINER" | "MILITARY"
 * - limit: number (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const bboxParam = req.nextUrl.searchParams.get('bbox');
    const scope = req.nextUrl.searchParams.get('scope') as any;
    const category = req.nextUrl.searchParams.get('category') || undefined;
    const limit = req.nextUrl.searchParams.get('limit') ? Number(req.nextUrl.searchParams.get('limit')) : undefined;

    let bbox: [number, number, number, number] | undefined = undefined;
    if (bboxParam) {
      const parts = bboxParam.split(',').map(Number);
      if (parts.length === 4 && parts.every(p => !isNaN(p))) {
        bbox = parts as [number, number, number, number];
      }
    }

    const vessels = await liveVesselsClient.getLiveVessels({
      bbox,
      scope,
      category,
      limit,
    });

    return ok(
      {
        vessels,
        count: vessels.length,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=15',
        },
      }
    );
  } catch (error) {
    return ok({
      vessels: [],
      count: 0,
      fetchedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Live vessel tracking error',
    });
  }
}
