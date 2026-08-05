import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { multiNewsClient } from '@/server/lib/api-clients/multi-news-client';
import { getGlobalConflictArticles } from '@/server/lib/api-clients/gdelt-client';
import { COUNTRY_COORDS } from '@/server/lib/geopolitical-analyzer';

import type { NewsArticle } from '@/server/lib/api-clients/multi-news-client';

// ─── Geocode a news article to a map coordinate ──────────
// Scans the title + description for known country names and returns the
// first match. Returns null when no country is detected.

function geocodeArticle(article: { title: string; description?: string }): [number, number] | null {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();

  // Try longest country names first to avoid partial matches (e.g. "Iran" inside "Iranian")
  const sorted = Object.keys(COUNTRY_COORDS).sort((a, b) => b.length - a.length);
  for (const country of sorted) {
    if (text.includes(country.toLowerCase())) {
      return COUNTRY_COORDS[country];
    }
  }
  return null;
}

function articleToPulse(article: NewsArticle | { title: string; description?: string; url: string; source: string; publishedAt: string }): {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  position: [number, number] | null;
} {
  const url = article.url || '';
  const id = `pulse-${hashString(url)}`;
  return {
    id,
    title: article.title,
    description: article.description || article.title,
    url,
    source: article.source || '',
    publishedAt: article.publishedAt || new Date().toISOString(),
    position: geocodeArticle(article),
  };
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') || '20', 10),
      50,
    );

    // Phase 1: GDELT (keyless, always available) — global conflict coverage
    const gdeltArticles = await getGlobalConflictArticles(8000).catch(() => []);

    // Phase 2: multi-news-client fallback (GNews → NewsData → NewsAPI)
    let newsApiArticles: NewsArticle[] = [];
    try {
      newsApiArticles = await multiNewsClient.searchNews(
        'attack OR strike OR missile OR drone OR war OR conflict OR ceasefire OR sanction OR deal OR tension OR escalation',
        limit,
        'en',
      );
    } catch {
      // GDELT alone is enough; news API is best-effort augment
    }

    // Merge: GDELT first (most reliable for conflict), then news API (deduped by URL)
    const seen = new Set<string>();
    const merged: { title: string; description: string; url: string; source: string; publishedAt: string }[] = [];

    for (const a of gdeltArticles) {
      if (!a.url || seen.has(a.url)) continue;
      seen.add(a.url);
      merged.push({ title: a.title, description: a.title, url: a.url, source: a.domain || 'GDELT', publishedAt: a.date });
    }
    for (const a of newsApiArticles) {
      if (!a.url || seen.has(a.url)) continue;
      seen.add(a.url);
      merged.push({ title: a.title, description: a.description, url: a.url, source: a.source, publishedAt: a.publishedAt });
    }

    const pulses = merged.slice(0, limit).map(articleToPulse);

    return ok(
      {
        pulses,
        count: pulses.length,
        fetchedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('[News Pulse] Error:', error);
    return ok(
      { pulses: [], count: 0, fetchedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, max-age=10' } },
    );
  }
}