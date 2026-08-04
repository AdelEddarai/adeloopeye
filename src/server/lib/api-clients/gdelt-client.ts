/**
 * GDELT Client
 * Global Database of Events, Language, and Tone (FREE, no API key)
 * Real-time world news + events index updated every 15 minutes.
 * https://www.gdeltproject.org/
 *
 * Used to keep the Morocco conflict/regional flashpoints driven by real,
 * continuously-updating coverage instead of static baselines.
 */

export type GDELTArticle = {
  title: string;
  url: string;
  source: string;
  domain: string;
  date: string; // ISO
  countryCode?: string;
};

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

// GDELT "seendate" format: 20260804T001500Z
function parseGDELTDate(seendate: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(seendate || '');
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  }
  return new Date().toISOString();
}

/**
 * Query the GDELT DOC 2.0 API (artlist mode).
 * NOTE: GDELT does NOT support nested OR blocks — a query may contain at most
 * one "(a OR b OR c)" group. Keywords outside the group are implicitly AND'd.
 * Timespan accepts 15min/1h/3d/1w/1m suffixes.
 */
async function queryGDELT(
  query: string,
  opts: { maxRecords?: number; timespan?: string; timeoutMs?: number; retries?: number } = {}
): Promise<GDELTArticle[]> {
  const { maxRecords = 50, timespan = '3d', timeoutMs = 8000, retries = 1 } = opts;

  const url = new URL(GDELT_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', String(maxRecords));
  url.searchParams.set('timespan', timespan);
  url.searchParams.set('sort', 'datedesc');

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'AdeloopMoroccoIntel/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 429) {
        lastError = new Error('GDELT rate limit (429)');
        await new Promise(r => setTimeout(r, 2500));
        continue;
      }
      if (!res.ok) throw new Error(`GDELT error: ${res.status}`);
      if (!res.headers.get('content-type')?.includes('json')) {
        throw new Error('GDELT returned non-JSON response');
      }

      const json = await res.json();
      const seen = new Set<string>();

      return (json?.articles || [])
        .filter((a: any) => a?.title)
        .map((a: any) => ({
          title: a.title,
          url: a.url || '',
          source: a.domain || a.sourcecountry || 'GDELT',
          domain: a.domain || '',
          date: parseGDELTDate(a.seendate),
          countryCode: a.sourcecountry,
        }))
        .filter((a: any) => {
          if (seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
        })
        .slice(0, maxRecords);
    } catch (error) {
      lastError = error as Error;
      // Timeouts / network errors: don't retry — the caller's phase deadline
      // already bounds total latency, and an abort retry just burns a rate-limit slot.
      break;
    }
  }

  throw lastError || new Error('GDELT request failed');
}

/**
 * Real-time conflict / flashpoint coverage around Morocco: Western Sahara,
 * Algeria border, Ceuta & Melilla, and the Sahel corridor.
 * Uses a single flat OR block (GDELT rejects nested groupings).
 */
export async function getMoroccoConflictArticles(timeoutMs: number = 8000): Promise<GDELTArticle[]> {
  const query =
    'morocco (conflict OR clash OR attack OR border OR military OR protest OR ' +
    'ceasefire OR migrant OR polisario OR sahrawi OR guerguerat OR laayoune OR dakhla)';

  return queryGDELT(query, { maxRecords: 40, timespan: '3d', timeoutMs });
}

/**
 * General Morocco real-time headlines (used to enrich the news stream when
 * RSS feeds are slow or unavailable).
 */
export async function getMoroccoHeadlines(timeoutMs: number = 8000): Promise<GDELTArticle[]> {
  return queryGDELT('morocco (news OR economy OR weather OR tourism OR politics)', {
    maxRecords: 40,
    timespan: '3d',
    timeoutMs,
  });
}
