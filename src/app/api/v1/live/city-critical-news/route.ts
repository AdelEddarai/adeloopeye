import { NextRequest } from 'next/server';

import { ok } from '@/server/lib/api-utils';
import { newsAPIClient } from '@/server/lib/api-clients/newsapi-client';

type CriticalNews = {
  article: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'ATTACK' | 'CONFLICT' | 'DISASTER' | 'POLITICAL' | 'SECURITY';
  location?: { lat: number; lon: number };
  keywords: string[];
};

// Critical keywords for intelligence analysis
const CRITICAL_KEYWORDS = {
  ATTACK: ['attack', 'strike', 'bombing', 'explosion', 'assault', 'raid', 'airstrike', 'missile'],
  CONFLICT: ['war', 'conflict', 'fighting', 'battle', 'clash', 'combat', 'violence'],
  DISASTER: ['earthquake', 'flood', 'fire', 'disaster', 'emergency', 'evacuation', 'casualties'],
  POLITICAL: ['coup', 'protest', 'election', 'government', 'crisis', 'unrest', 'revolution'],
  SECURITY: ['terror', 'threat', 'security', 'police', 'arrest', 'incident', 'breach'],
};

const SEVERITY_KEYWORDS = {
  CRITICAL: ['killed', 'dead', 'death', 'casualties', 'destroyed', 'major', 'massive', 'critical'],
  HIGH: ['injured', 'wounded', 'damaged', 'serious', 'significant', 'heavy'],
  MEDIUM: ['minor', 'reported', 'alleged', 'suspected', 'possible'],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lon = parseFloat(searchParams.get('lon') || '0');

    if (!city) {
      return new Response('Missing city parameter', { status: 400 });
    }

    // Fetch news about the city with critical keywords
    const articles = await newsAPIClient.searchNews(
      `${city} AND (attack OR strike OR conflict OR war OR disaster OR emergency OR security OR threat)`,
      30,
      'en'
    );

    // Analyze and filter for critical news
    const criticalNews: CriticalNews[] = [];

    for (const article of articles) {
      const analysis = analyzeArticle(article, city, lat, lon);
      if (analysis) {
        criticalNews.push(analysis);
      }
    }

    // Sort by severity (CRITICAL first)
    criticalNews.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return ok(criticalNews.slice(0, 15), {
      headers: {
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=360', // 3 min cache
      },
    });
  } catch (error) {
    console.error('Critical news API error:', error);
    return ok([], { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
}

/**
 * Analyze article for critical intelligence
 */
function analyzeArticle(article: any, city: string, lat: number, lon: number): CriticalNews | null {
  const content = `${article.title} ${article.description || ''}`.toLowerCase();
  
  // Determine category
  let category: CriticalNews['category'] | null = null;
  let categoryScore = 0;

  for (const [cat, keywords] of Object.entries(CRITICAL_KEYWORDS)) {
    const score = keywords.filter(kw => content.includes(kw)).length;
    if (score > categoryScore) {
      categoryScore = score;
      category = cat as CriticalNews['category'];
    }
  }

  // Skip if no critical category found
  if (!category || categoryScore === 0) {
    return null;
  }

  // Determine severity
  let severity: CriticalNews['severity'] = 'MEDIUM';
  for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some(kw => content.includes(kw))) {
      severity = sev as CriticalNews['severity'];
      break;
    }
  }

  // Extract keywords
  const keywords: string[] = [];
  for (const [, kwList] of Object.entries(CRITICAL_KEYWORDS)) {
    for (const kw of kwList) {
      if (content.includes(kw) && !keywords.includes(kw)) {
        keywords.push(kw);
      }
    }
  }

  // Try to extract location from content
  let location: { lat: number; lon: number } | undefined;
  
  // Check if article mentions specific locations near the city
  const locationKeywords = extractLocationKeywords(content);
  if (locationKeywords.length > 0) {
    // Use city coordinates with slight offset for variety
    const offset = (Math.random() - 0.5) * 0.1; // ~5km radius
    location = {
      lat: lat + offset,
      lon: lon + offset,
    };
  }

  return {
    article,
    severity,
    category,
    location,
    keywords: keywords.slice(0, 5),
  };
}

/**
 * Extract location keywords from content
 */
function extractLocationKeywords(content: string): string[] {
  const locationWords = [
    'north', 'south', 'east', 'west', 'central', 'downtown',
    'district', 'neighborhood', 'area', 'region', 'zone',
    'near', 'close to', 'vicinity', 'outskirts',
  ];

  return locationWords.filter(word => content.includes(word));
}
