import { NextRequest } from 'next/server';

import { err, ok } from '@/server/lib/api-utils';
import { abuseIPDBClient } from '@/server/lib/api-clients/abuseipdb-client';

/**
 * GET /api/v1/live/threats
 * Real-time IP threat intelligence from AbuseIPDB
 * 
 * Query params:
 * - ip: check specific IP address
 * - limit: number of blacklisted IPs to return (default: 100)
 * - confidence: minimum confidence score 0-100 (default: 90)
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.nextUrl.searchParams.get('ip');
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') || '100', 10),
      1000
    );
    const confidence = Math.min(
      parseInt(req.nextUrl.searchParams.get('confidence') || '90', 10),
      100
    );

    // Check specific IP
    if (ip) {
      const report = await abuseIPDBClient.checkIP(ip);
      return ok({
        report,
        fetchedAt: new Date().toISOString(),
      });
    }

    // Get blacklist
    const blacklist = await abuseIPDBClient.getBlacklist(limit, confidence);

    // Group by country for dashboard display
    const byCountry = blacklist.reduce((acc, ip) => {
      const country = ip.countryCode || 'UNKNOWN';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(ip);
      return acc;
    }, {} as Record<string, typeof blacklist>);

    return ok(
      {
        blacklist,
        byCountry,
        count: blacklist.length,
        confidence,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Threats API error:', error);
    return err(
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Failed to fetch threat data',
      500
    );
  }
}
