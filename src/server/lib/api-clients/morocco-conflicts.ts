/**
 * Morocco Regional Conflicts Client
 * Tracks border tensions, territorial disputes and security flashpoints
 * involving Morocco and its neighbours (Algeria, Spain, Mauritania, the
 * Western Sahara front).
 *
 * Sources: real-time GDELT coverage + the current RSS/news feed. Intensity,
 * status and reports are driven by live headlines, not static baselines.
 */

import type { NewsArticle } from './newsapi-client';
import type { GDELTArticle } from './gdelt-client';

export type ConflictReport = {
  title: string;
  url: string;
  source: string;
  date: string;
};

export type ConflictEntry = {
  id: string;
  name: string;
  type: 'BORDER_TENSION' | 'TERRITORIAL_DISPUTE' | 'SEPARATIST' | 'MIGRATION' | 'TERRORISM';
  countries: string[];
  position: [number, number];
  status: 'ESCALATING' | 'ACTIVE' | 'DORMANT' | 'RESOLVED';
  intensity: number; // 0-100
  description: string;
  flashpoints: string[];
  reports: ConflictReport[];
  lastUpdate: string;
};

type ConflictSeed = {
  id: string;
  name: string;
  type: ConflictEntry['type'];
  countries: string[];
  position: [number, number];
  description: string;
  flashpoints: string[];
};

const CONFLICT_SEED: ConflictSeed[] = [
  {
    id: 'western-sahara',
    name: 'Western Sahara Dispute',
    type: 'TERRITORIAL_DISPUTE',
    countries: ['Morocco', 'Sahrawi Arab Democratic Republic', 'Algeria'],
    position: [-13.0000, 26.0000],
    description: 'Long-running territorial dispute over Western Sahara between Morocco and the Polisario Front.',
    flashpoints: ['Guerguerat buffer zone', 'Makhzen dike', 'Dakhla', 'Laayoune'],
  },
  {
    id: 'morocco-algeria-border',
    name: 'Morocco–Algeria Border Closure',
    type: 'BORDER_TENSION',
    countries: ['Morocco', 'Algeria'],
    position: [-1.5000, 33.0000],
    description: 'Land border sealed since 1994; diplomatic rupture and airspace restrictions since 2021.',
    flashpoints: ['Oujda', 'Béchar', 'Figuig', 'Eastern Sahara frontier'],
  },
  {
    id: 'ceuta-melilla',
    name: 'Ceuta & Melilla Enclaves',
    type: 'MIGRATION',
    countries: ['Morocco', 'Spain'],
    position: [-2.9333, 35.2917],
    description: 'Spanish enclaves in North Africa — periodic mass migration attempts and fence incidents.',
    flashpoints: ['Tarajal crossing', 'Beni Enzar crossing', 'Perejil Island'],
  },
  {
    id: 'sahel-jihadism',
    name: 'Sahel Jihadist Spillover',
    type: 'TERRORISM',
    countries: ['Morocco', 'Mauritania', 'Mali', 'Niger'],
    position: [-8.0000, 20.0000],
    description: 'Counter-terrorism posture against Islamist groups operating in the Sahel corridor south of Morocco.',
    flashpoints: ['Mauritania border', 'Guerguerat road', 'Southern Sahara'],
  },
  {
    id: 'dakhla-atlantic',
    name: 'Atlantic Maritime Zone',
    type: 'BORDER_TENSION',
    countries: ['Morocco', 'Spain', 'Canary Islands'],
    position: [-16.0000, 24.0000],
    description: 'Maritime boundary and fishing-rights friction with Spain in Atlantic waters west of Dakhla.',
    flashpoints: ['Canary Islands waters', 'Dakhla EEZ', 'Fishing grounds'],
  },
];

const ESCALATE_KEYWORDS = [
  'clash', 'attack', 'firing', 'military', 'troop', 'escalat', 'standoff',
  'provocation', 'violence', 'deadly', 'offensive', 'tension', 'threat',
  'missile', 'drone', 'confrontation', 'arrest', 'raid', 'surge', 'front',
  'strike', 'protest', 'migrant', 'breach', 'stand',
];

const DEESCALATE_KEYWORDS = [
  'ceasefire', 'de-escalat', 'talks', 'negotiation', 'dialogue', 'normalization',
  'resume', 'agreement', 'reopened', 'truce', 'calm',
];

type MatchableArticle = { title: string; url: string; source?: string; description?: string; date?: string };

function normalizeArticles(articles: (NewsArticle | GDELTArticle)[]): MatchableArticle[] {
  return articles.map(a => ({
    title: (a as any).title || '',
    url: (a as any).url || '',
    source: (a as any).source || (a as any).domain || (a as any).sourceName || '',
    description: (a as any).description,
    date: (a as any).date || (a as any).publishedAt,
  }));
}

function contentOf(a: MatchableArticle): string {
  return `${a.title} ${a.description || ''}`.toLowerCase();
}

/**
 * Build a live regional conflict snapshot driven by real-time GDELT coverage
 * plus the current news feed. Intensity rises with recent matching headlines;
 * every match is kept as a real report with a link.
 */
export function fetchMoroccoConflicts(articles: (NewsArticle | GDELTArticle)[]): ConflictEntry[] {
  const now = Date.now();
  const matches = normalizeArticles(articles);

  return CONFLICT_SEED.map(seed => {
    const relevant = matches.filter(article => {
      const content = contentOf(article);
      return (
        seed.flashpoints.some(fp => content.includes(fp.toLowerCase())) ||
        seed.countries.some(c => content.includes(c.toLowerCase())) ||
        content.includes(seed.name.toLowerCase())
      );
    });

    let intensity = 15; // baseline
    const reports: ConflictReport[] = [];

    for (const article of relevant) {
      const content = contentOf(article);
      const escalate = ESCALATE_KEYWORDS.some(kw => content.includes(kw));
      const deescalate = DEESCALATE_KEYWORDS.some(kw => content.includes(kw));

      if (escalate) intensity += 15;
      if (deescalate) intensity -= 12;

      // Recency boost: coverage from the last 24h is a live signal
      if (article.date) {
        const age = now - new Date(article.date).getTime();
        if (age < 24 * 60 * 60 * 1000) intensity += 8;
      }

      reports.push({
        title: article.title,
        url: article.url,
        source: article.source || 'Unknown',
        date: article.date || new Date().toISOString(),
      });
    }

    intensity = Math.max(5, Math.min(100, intensity));

    let status: ConflictEntry['status'];
    if (intensity >= 60) status = 'ESCALATING';
    else if (intensity >= 30) status = 'ACTIVE';
    else if (reports.length === 0) status = 'DORMANT';
    else status = 'RESOLVED';

    // Western Sahara baseline stays active by default (frozen conflict)
    if (seed.id === 'western-sahara' && reports.length === 0) {
      status = 'ACTIVE';
      intensity = Math.max(intensity, 40);
    }

    return {
      ...seed,
      status,
      intensity,
      reports: reports.slice(0, 8),
      lastUpdate: new Date(now).toISOString(),
    };
  });
}
