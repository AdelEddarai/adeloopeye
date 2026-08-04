/**
 * Travel Advisory Client
 * Global country risk ratings aggregated from multiple national travel advisories
 * (US State Dept, UK FCDO, Australia DFAT, Canada) via the keyless travel-advisory.info
 * REST API. Returns a 0–5 risk score per country, mirroring WorldMonitor's
 * "security advisory" layer (Do-Not-Travel / Reconsider / Exercise Caution).
 * https://www.travel-advisory.info/api
 */

export type TravelAdvisory = {
  code: string; // ISO-3166 alpha-2
  name: string;
  score: number; // 0–5 advisory rating
  level: string; // human label
  message: string;
  source: string;
  timestamp: string;
};

const API_URL = 'https://www.travel-advisory.info/api';

// Advisory score → human level label (0 = normal, 5 = do not travel).
export function advisoryLevelLabel(score: number): string {
  const s = Math.round(Math.max(0, Math.min(5, score)));
  switch (s) {
    case 5: return 'Do Not Travel';
    case 4: return 'Reconsider Travel';
    case 3: return 'Exercise Increased Caution';
    case 2: return 'Exercise Caution';
    case 1: return 'Normal / Info';
    default: return 'Normal / Info';
  }
}

/**
 * Extract a numeric advisory score from the API's per-country payload.
 * The `score` field may be a plain number, a string, or an array of
 * { name, score } entries (per-source) — defensively collapse to a 0–5 int.
 */
function extractScore(advisory: any): number {
  try {
    const raw = advisory?.score ?? 0;
    if (Array.isArray(raw)) {
      if (raw.length === 0) return 0;
      const vals = raw
        .map((s: any) => Number(s?.score))
        .filter((n: number) => !isNaN(n));
      return vals.length ? Math.max(...vals) : 0;
    }
    return Number(raw) || 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch global travel advisory scores (keyless). Guarded — never throws.
 */
export async function fetchGlobalTravelAdvisories(
  minScore: number = 3,
  timeoutMs: number = 8000
): Promise<TravelAdvisory[]> {
  try {
    const url = new URL(API_URL);
    url.searchParams.set('countrycode', 'all');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AdeloopWorldMonitor/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 900 }, // cache 15 min server-side
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`Travel advisory error: ${res.status}`);

    const json = await res.json();
    const data = json?.data || {};
    const now = new Date().toISOString();
    const advisories: TravelAdvisory[] = [];

    for (const [code, entry] of Object.entries<any>(data)) {
      try {
        const score = extractScore(entry?.advisory);
        if (!code || score < minScore) continue;

        advisories.push({
          code,
          name: entry?.name || code,
          score: Math.min(5, score),
          level: advisoryLevelLabel(score),
          message: (entry?.advisory?.message || '').slice(0, 500),
          source: 'travel-advisory.info',
          timestamp: now,
        });
      } catch {
        // skip malformed entry
      }
    }

    return advisories
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);
  } catch (error) {
    console.error('[TravelAdvisory] failed:', error instanceof Error ? error.message : error);
    return [];
  }
}