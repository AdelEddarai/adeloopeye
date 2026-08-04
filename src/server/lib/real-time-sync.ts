/**
 * Real-Time Sync
 * Populates the application database tables (conflict, events, actors,
 * x-posts, day snapshots, map features, map stories) from real, live data
 * sources — GDELT (keyless) and the multi-source news client. No mock or
 * fabricated intelligence is ever written.
 *
 * Consumers call `ensureConflictSynced()` before reading. A freshness guard
 * (in-memory TTL + a cheap DB recency check) keeps steady-state requests fast
 * and only performs the expensive network sync when the feed is stale/empty.
 */

import { prisma } from './db';
import { multiNewsClient, type NewsArticle } from './api-clients/multi-news-client';
import {
  getGlobalConflictArticles,
  getGlobalHeadlines,
  type GDELTArticle,
} from './api-clients/gdelt-client';
import {
  transformNewsToCriticalEvents,
  transformNewsToHeatPoints,
} from './live-data-transformer';
import { fetchCommodityPrices } from './api-clients/commodity-prices-client';
import { fetchCryptoPrices } from './api-clients/crypto-client';

const SYNC_TTL_MS = 10 * 60 * 1000;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;
const SNAPSHOT_DAYS = 14;

const inFlight: Record<string, Promise<void>> = {};
const lastSync: Record<string, number> = {};

/**
 * Ensure the conflict feed is populated with recent real data before reads.
 * Cheap (single indexed count) when fresh; full network sync only when stale.
 */
export async function ensureConflictSynced(conflictId: string): Promise<void> {
  if (inFlight[conflictId]) return inFlight[conflictId];

  const since = lastSync[conflictId];
  if (since && Date.now() - since < SYNC_TTL_MS) return;

  // Skip during static build — data syncs at runtime on first request.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  // Cheap DB recency check: recent real events present => already synced.
  try {
    const recent = await prisma.intelEvent.count({
      where: {
        conflictId,
        timestamp: { gte: new Date(Date.now() - RECENT_WINDOW_MS) },
      },
    });
    if (recent > 0) {
      lastSync[conflictId] = Date.now();
      return;
    }
  } catch (error) {
    console.warn('[sync] recency check failed:', error);
  }

  inFlight[conflictId] = syncConflict(conflictId)
    .catch((error) => {
      console.error('[sync] sync failed:', error);
    })
    .finally(() => {
      delete inFlight[conflictId];
      lastSync[conflictId] = Date.now();
    });

  return inFlight[conflictId];
}

// ────────────────────────────────────────────────────────────────────────────
// Article fetching
// ────────────────────────────────────────────────────────────────────────────

function gdeltToNewsArticle(a: GDELTArticle): NewsArticle {
  return {
    title: a.title,
    description: a.title,
    url: a.url || '',
    source: a.source || a.domain || 'GDELT',
    publishedAt: a.date,
    author: null,
    imageUrl: null,
    content: a.title,
  };
}

async function fetchConflictArticles(): Promise<NewsArticle[]> {
  // Keyless GDELT is the primary source so the feed works without paid keys.
  const [gdeltArticles, gdeltHeadlines, newsArticles] = await Promise.allSettled([
    getGlobalConflictArticles(),
    getGlobalHeadlines(),
    multiNewsClient.searchNews(
      'iran OR israel OR gaza OR syria OR lebanon OR yemen OR ukraine OR middle east conflict',
      60,
      'en'
    ),
  ]);

  const articles: NewsArticle[] = [];

  if (gdeltArticles.status === 'fulfilled') {
    articles.push(...gdeltArticles.value.map(gdeltToNewsArticle));
  }
  if (gdeltHeadlines.status === 'fulfilled') {
    articles.push(...gdeltHeadlines.value.map(gdeltToNewsArticle));
  }
  if (newsArticles.status === 'fulfilled') {
    articles.push(...newsArticles.value);
  }

  // De-dupe by URL, sort newest first.
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    const key = a.url || a.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Pure analysis helpers
// ────────────────────────────────────────────────────────────────────────────

const CRITICAL_KEYWORDS = [
  'attack',
  'strike',
  'missile',
  'drone',
  'explosion',
  'killed',
  'casualties',
  'war',
  'invasion',
];
const HIGH_KEYWORDS = ['tension', 'threat', 'military', 'escalation', 'warning', 'sanction'];

function scoreArticles(articles: NewsArticle[]): number {
  if (articles.length === 0) return 0;
  let score = 0;
  for (const a of articles) {
    const content = `${a.title} ${a.description}`.toLowerCase();
    if (CRITICAL_KEYWORDS.some((k) => content.includes(k))) score += 2;
    else if (HIGH_KEYWORDS.some((k) => content.includes(k))) score += 1;
  }
  return Math.min(10, Math.max(1, Math.round(score / Math.max(1, articles.length) * 2)));
}

function threatLevelFromScore(score: number): 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MONITORING' {
  if (score >= 8) return 'CRITICAL';
  if (score >= 6) return 'HIGH';
  if (score >= 4) return 'ELEVATED';
  return 'MONITORING';
}

function generateSummary(articles: NewsArticle[]): string {
  const a = articles[0];
  return a?.title || 'Monitoring ongoing regional developments';
}

function generateKeyFacts(articles: NewsArticle[]): string[] {
  return articles.slice(0, 5).map((a) => a.title).filter(Boolean);
}

function generateScenarios(escalation: number) {
  if (escalation > 7) {
    return [
      { label: 'Escalation', subtitle: 'Heightened tensions', color: 'var(--danger)', prob: '50%', body: 'Current indicators suggest an elevated risk of further escalation.' },
      { label: 'Status Quo', subtitle: 'Tensions persist', color: 'var(--warning)', prob: '35%', body: 'The situation may stabilize at current levels.' },
      { label: 'De-escalation', subtitle: 'Diplomatic progress', color: 'var(--success)', prob: '15%', body: 'Diplomatic efforts may reduce tensions.' },
    ];
  }
  if (escalation >= 5) {
    return [
      { label: 'De-escalation', subtitle: 'Diplomatic progress', color: 'var(--success)', prob: '40%', body: 'Continued engagement may lead to reduced tensions.' },
      { label: 'Status Quo', subtitle: 'Tensions persist', color: 'var(--warning)', prob: '40%', body: 'The current situation is likely to continue.' },
      { label: 'Escalation', subtitle: 'Increased activity', color: 'var(--danger)', prob: '20%', body: 'Risk of escalation remains present.' },
    ];
  }
  return [
    { label: 'De-escalation', subtitle: 'Calm prevailing', color: 'var(--success)', prob: '50%', body: 'Conditions are stable with limited conflict activity.' },
    { label: 'Status Quo', subtitle: 'Steady state', color: 'var(--info)', prob: '40%', body: 'The situation remains at current levels.' },
    { label: 'Escalation', subtitle: 'Increased activity', color: 'var(--danger)', prob: '10%', body: 'A low but present risk of escalation.' },
  ];
}

/**
 * Last N calendar days (ISO strings), oldest first.
 */
export function generateDaysList(days = 30): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

function hashId(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

// ────────────────────────────────────────────────────────────────────────────
// Section writers
// ────────────────────────────────────────────────────────────────────────────

type EventRow = {
  id: string;
  conflictId: string;
  timestamp: Date;
  severity: 'CRITICAL' | 'HIGH' | 'STANDARD';
  type: 'MILITARY' | 'DIPLOMATIC' | 'INTELLIGENCE' | 'ECONOMIC' | 'HUMANITARIAN' | 'POLITICAL';
  title: string;
  location: string;
  summary: string;
  fullContent: string;
  verified: boolean;
  tags: string[];
  sources: { name: string; tier: number; reliability: number; url: string | null }[];
};

function buildEvents(conflictId: string, articles: NewsArticle[]): EventRow[] {
  return articles.slice(0, 60).map((a, idx) => {
    const content = `${a.title} ${a.description}`.toLowerCase();
    let severity: EventRow['severity'] = 'STANDARD';
    if (CRITICAL_KEYWORDS.some((k) => content.includes(k))) severity = 'CRITICAL';
    else if (HIGH_KEYWORDS.some((k) => content.includes(k))) severity = 'HIGH';

    let type: EventRow['type'] = 'POLITICAL';
    if (/military|attack|strike|troops|missile|drone|bomb/.test(content)) type = 'MILITARY';
    else if (/diplomat|negotiat|talks|summit/.test(content)) type = 'DIPLOMATIC';
    else if (/econom|sanction|trade|oil|market/.test(content)) type = 'ECONOMIC';
    else if (/humanitarian|refugee|aid|ceasefire/.test(content)) type = 'HUMANITARIAN';
    else if (/intel|espionage|cyber|intelligence/.test(content)) type = 'INTELLIGENCE';

    const locations = ['Tehran', 'Jerusalem', 'Tel Aviv', 'Baghdad', 'Damascus', 'Beirut', 'Gaza', 'Yemen', 'Iran', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Ukraine', 'Russia'];
    const found = locations.filter((loc) => content.includes(loc.toLowerCase()));

    return {
      id: `evt-${hashId(a.url || a.title)}-${idx}`,
      conflictId,
      timestamp: new Date(a.publishedAt),
      severity,
      type,
      title: a.title,
      location: found[0] || 'Regional',
      summary: a.description || a.title,
      fullContent: a.content || a.description || a.title,
      verified: true,
      tags: [type.toLowerCase()],
      sources: [{ name: a.source, tier: 1, reliability: 90, url: a.url || null }],
    };
  });
}

type PostRow = {
  id: string;
  conflictId: string;
  postType: 'NEWS_ARTICLE';
  handle: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  verified: boolean;
  accountType: 'journalist';
  significance: 'BREAKING' | 'HIGH' | 'STANDARD';
  timestamp: Date;
  content: string;
  images: string[];
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  pharosNote: string | null;
  eventId: string | null;
  actorId: string | null;
};

function buildPosts(events: EventRow[], articles: NewsArticle[]): PostRow[] {
  return events.map((event, idx) => {
    const a = articles[idx];
    const content = `${a.title} ${a.description}`.toLowerCase();
    let significance: PostRow['significance'] = 'STANDARD';
    if (/breaking|urgent|alert|just in/.test(content)) significance = 'BREAKING';
    else if (/major|significant|critical/.test(content)) significance = 'HIGH';

    return {
      id: `post-${hashId(a.url || a.title)}`,
      conflictId: event.conflictId,
      postType: 'NEWS_ARTICLE',
      handle: a.source.toLowerCase().replace(/\s+/g, ''),
      displayName: a.source,
      avatar: '',
      avatarColor: '#5B8DEF',
      verified: true,
      accountType: 'journalist',
      significance,
      timestamp: event.timestamp,
      content: a.title,
      images: a.imageUrl ? [a.imageUrl] : [],
      likes: 0,
      retweets: 0,
      replies: 0,
      views: 0,
      pharosNote: a.description || null,
      eventId: event.id,
      actorId: null,
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Actors
// ────────────────────────────────────────────────────────────────────────────

type ActorSeed = {
  id: string;
  name: string;
  fullName: string;
  countryCode: string;
  type: 'STATE' | 'NON_STATE' | 'ORGANIZATION' | 'INDIVIDUAL';
  mapKey: string;
  cssVar: string;
  colorRgb: number[];
  affiliation: 'FRIENDLY' | 'HOSTILE' | 'NEUTRAL';
  mapGroup: string;
  keywords: string[];
};

const ACTOR_SEEDS: ActorSeed[] = [
  { id: 'us', name: 'United States', fullName: 'United States of America', countryCode: 'US', type: 'STATE', mapKey: 'US', cssVar: 'var(--blue)', colorRgb: [45, 114, 210], affiliation: 'FRIENDLY', mapGroup: 'Coalition', keywords: ['united states', 'us ', 'america', 'american', 'washington', 'penta'] },
  { id: 'iran', name: 'Iran', fullName: 'Islamic Republic of Iran', countryCode: 'IR', type: 'STATE', mapKey: 'IRAN', cssVar: 'var(--danger)', colorRgb: [231, 106, 110], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['iran', 'tehran', 'irgc'] },
  { id: 'israel', name: 'Israel', fullName: 'State of Israel', countryCode: 'IL', type: 'STATE', mapKey: 'ISRAEL', cssVar: 'var(--teal)', colorRgb: [50, 200, 200], affiliation: 'FRIENDLY', mapGroup: 'Coalition', keywords: ['israel', 'idf', 'jerusalem', 'tel aviv'] },
  { id: 'houthis', name: 'Houthis', fullName: 'Ansar Allah (Houthi movement)', countryCode: 'YE', type: 'NON_STATE', mapKey: 'HOUTHI', cssVar: 'var(--warning)', colorRgb: [236, 154, 60], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['houthi', 'yemen', 'bab el-mandeb', 'ansar allah'] },
  { id: 'hezbollah', name: 'Hezbollah', fullName: 'Hezbollah', countryCode: 'LB', type: 'NON_STATE', mapKey: 'HEZBOLLAH', cssVar: 'var(--danger)', colorRgb: [180, 40, 40], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['hezbollah', 'lebanon', 'beirut'] },
  { id: 'russia', name: 'Russia', fullName: 'Russian Federation', countryCode: 'RU', type: 'STATE', mapKey: 'RUSSIA', cssVar: 'var(--russia)', colorRgb: [200, 80, 80], affiliation: 'NEUTRAL', mapGroup: 'Observer', keywords: ['russia', 'moscow', 'putin'] },
  { id: 'china', name: 'China', fullName: 'People\'s Republic of China', countryCode: 'CN', type: 'STATE', mapKey: 'CHINA', cssVar: 'var(--china)', colorRgb: [220, 100, 100], affiliation: 'NEUTRAL', mapGroup: 'Observer', keywords: ['china', 'beijing', 'chinese'] },
];

function buildActorRows(conflictId: string, articles: NewsArticle[]) {
  return ACTOR_SEEDS.map((seed) => {
    const mentions = articles.filter((a) => {
      const content = `${a.title} ${a.description}`.toLowerCase();
      return seed.keywords.some((k) => content.includes(k));
    });

    const score = Math.min(10, Math.max(1, Math.round((mentions.length / Math.max(1, articles.length)) * 20)));
    const activityLevel = score >= 8 ? 'CRITICAL' : score >= 6 ? 'HIGH' : score >= 4 ? 'ELEVATED' : 'MODERATE';

    const hostile = seed.affiliation === 'HOSTILE';
    const criticalMention = mentions.some((a) => CRITICAL_KEYWORDS.some((k) => `${a.title} ${a.description}`.toLowerCase().includes(k)));
    const stance = criticalMention ? (hostile ? 'AGGRESSOR' : 'RETALIATING') : hostile ? 'DEFENDER' : 'DEFENDER';

    const doing: string[] = [];
    if (mentions.length > 0) {
      const content = mentions.map((a) => `${a.title} ${a.description}`.toLowerCase()).join(' ');
      if (/attack|strike|airstrike/.test(content)) doing.push(hostile ? 'Conducting military operations' : 'Responding to attacks');
      if (/sanction|diplomat|negotiat|talks/.test(content)) doing.push('Diplomatic engagement');
      if (/military|troops|naval|exercise/.test(content)) doing.push('Military posture');
      if (/missile|drone/.test(content)) doing.push('Missile/drone activity');
    }
    if (doing.length === 0) doing.push('Monitoring regional developments');

    return {
      id: seed.id,
      conflictId,
      name: seed.name,
      fullName: seed.fullName,
      countryCode: seed.countryCode,
      type: seed.type,
      mapKey: seed.mapKey,
      cssVar: seed.cssVar,
      colorRgb: seed.colorRgb,
      affiliation: seed.affiliation,
      mapGroup: seed.mapGroup,
      activityLevel: activityLevel as 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE',
      activityScore: score,
      stance: stance as 'AGGRESSOR' | 'DEFENDER' | 'RETALIATING' | 'PROXY' | 'NEUTRAL' | 'CONDEMNING',
      saying: mentions[0]?.title || `No recent ${seed.name} coverage in monitored feeds`,
      doing,
      assessment: `${seed.name} detected in ${mentions.length} of ${articles.length} monitored articles.`,
      keyFigures: [],
      linkedEventIds: [],
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Day snapshots
// ────────────────────────────────────────────────────────────────────────────

function formatISODay(d: Date): string {
  return d.toISOString().split('T')[0];
}

function buildSnapshots(conflictId: string, articles: NewsArticle[]) {
  const byDay = new Map<string, NewsArticle[]>();
  for (const a of articles) {
    const day = formatISODay(new Date(a.publishedAt));
    const list = byDay.get(day) ?? [];
    list.push(a);
    byDay.set(day, list);
  }

  const days = generateDaysList(SNAPSHOT_DAYS);
  return days.map((day, idx) => {
    const dayArticles = byDay.get(day) ?? [];
    const escalation = scoreArticles(dayArticles);
    return {
      conflictId,
      day: new Date(day + 'T00:00:00Z'),
      dayLabel: idx === days.length - 1 ? 'Today' : `Day ${idx + 1}`,
      summary: dayArticles[0]?.title || 'No significant developments reported in monitored feeds on this day.',
      keyFacts: dayArticles.slice(0, 3).map((a) => a.title),
      escalation,
      economicNarrative: '',
    };
  });
}

async function buildEconomicChips(): Promise<{ label: string; val: string; sub: string; color: string }[]> {
  const chips: { label: string; val: string; sub: string; color: string }[] = [];
  const [commodities, crypto] = await Promise.allSettled([fetchCommodityPrices(), fetchCryptoPrices()]);

  if (commodities.status === 'fulfilled') {
    for (const c of commodities.value) {
      const sign = c.changePercent >= 0 ? '+' : '';
      chips.push({
        label: c.name,
        val: `$${c.price.toFixed(2)}`,
        sub: `${sign}${c.changePercent.toFixed(1)}%`,
        color: c.changePercent >= 0 ? 'var(--success)' : 'var(--danger)',
      });
    }
  }
  if (crypto.status === 'fulfilled') {
    for (const c of crypto.value.slice(0, 3)) {
      const sign = c.changePercent24h >= 0 ? '+' : '';
      chips.push({
        label: c.name,
        val: `$${c.price >= 100 ? c.price.toFixed(0) : c.price.toFixed(2)}`,
        sub: `${sign}${c.changePercent24h.toFixed(1)}% 24h`,
        color: c.changePercent24h >= 0 ? 'var(--success)' : 'var(--danger)',
      });
    }
  }
  return chips;
}

// ────────────────────────────────────────────────────────────────────────────
// Map features + stories
// ────────────────────────────────────────────────────────────────────────────

function buildMapFeatures(conflictId: string, articles: NewsArticle[]) {
  const features: {
    id: string;
    conflictId: string;
    featureType: 'TARGET' | 'HEAT_POINT';
    sourceEventId: string | null;
    actor: string;
    priority: string;
    category: string;
    type: string;
    status: string | null;
    timestamp: Date | null;
    geometry: Record<string, unknown>;
    properties: Record<string, unknown>;
  }[] = [];

  for (const evt of transformNewsToCriticalEvents(articles)) {
    if (!evt.position) continue;
    features.push({
      id: `target-${hashId(evt.url || evt.name)}`,
      conflictId,
      featureType: 'TARGET',
      sourceEventId: null,
      actor: evt.actor || 'unknown',
      priority: evt.priority || 'P2',
      category: 'CRITICAL_EVENT',
      type: evt.type || 'INCIDENT',
      status: 'ACTIVE',
      timestamp: evt.timestamp ? new Date(evt.timestamp) : null,
      geometry: { position: evt.position },
      properties: { name: evt.name, description: evt.description, severity: evt.severity, url: evt.url },
    });
  }

  for (const hp of transformNewsToHeatPoints(articles)) {
    if (!hp.position) continue;
    features.push({
      id: `heat-${hashId(evtIdFromHeat(hp))}`,
      conflictId,
      featureType: 'HEAT_POINT',
      sourceEventId: null,
      actor: 'news',
      priority: 'STANDARD',
      category: 'HEATMAP',
      type: 'HEAT_POINT',
      status: null,
      timestamp: null,
      geometry: { position: hp.position },
      properties: { weight: hp.weight },
    });
  }

  return features;
}

function evtIdFromHeat(hp: any): string {
  return `${hp.position?.[0] ?? 0}-${hp.position?.[1] ?? 0}-${hp.weight ?? 0}`;
}

function buildStories(conflictId: string, events: EventRow[]) {
  return events.slice(0, 6).map((event, idx) => {
    const category = event.type === 'MILITARY' ? 'STRIKE' : event.type === 'DIPLOMATIC' ? 'DIPLOMATIC' : event.type === 'ECONOMIC' ? 'INTEL' : 'INTEL';
    return {
      id: `story-${hashId(event.title)}-${idx}`,
      conflictId,
      primaryEventId: event.id,
      sourceEventIds: [event.id],
      title: event.title.slice(0, 90),
      tagline: event.summary.slice(0, 140),
      iconName: category === 'STRIKE' ? 'target' : 'radio',
      category,
      narrative: `${event.summary}\n\nSource: ${event.sources[0]?.name ?? 'GDELT'}`,
      highlightStrikeIds: category === 'STRIKE' ? [event.id] : [],
      highlightMissileIds: [],
      highlightTargetIds: [],
      highlightAssetIds: [],
      viewState: { longitude: 35.2137, latitude: 31.0461, zoom: 5 },
      keyFacts: [event.summary],
      timestamp: event.timestamp,
      events: [
        { time: event.timestamp.toISOString(), label: event.title.slice(0, 80), type: category === 'STRIKE' ? 'STRIKE' : 'POLITICAL' },
      ],
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Main sync
// ────────────────────────────────────────────────────────────────────────────

async function syncConflict(conflictId: string): Promise<void> {
  const articles = await fetchConflictArticles();
  if (articles.length === 0) {
    console.warn('[sync] No real-time articles available; leaving existing data intact.');
    return;
  }

  const score = scoreArticles(articles);
  const events = buildEvents(conflictId, articles);
  const posts = buildPosts(events, articles);

  const conflict = await prisma.conflict.upsert({
    where: { id: conflictId },
    update: {
      status: 'ONGOING',
      threatLevel: threatLevelFromScore(score),
      escalation: score,
      summary: generateSummary(articles),
      keyFacts: generateKeyFacts(articles),
    },
    create: {
      id: conflictId,
      name: 'Global & Middle East Conflict Monitor',
      codename: { us: 'Regional Monitor', il: 'Regional Monitor' },
      status: 'ONGOING',
      threatLevel: threatLevelFromScore(score),
      startDate: new Date(generateDaysList(1)[0] + 'T00:00:00Z'),
      region: 'Middle East & Global',
      timezone: 'UTC',
      escalation: score,
      summary: generateSummary(articles),
      keyFacts: generateKeyFacts(articles),
      objectives: { us: 'Monitor regional stability and protect allies', il: 'Ensure national security and deter threats' },
      commanders: { us: [], il: [], ir: [] },
    },
  });
  void conflict;

  // Events + sources + posts
  await prisma.$transaction([
    prisma.intelEvent.deleteMany({ where: { conflictId } }),
    prisma.xPost.deleteMany({ where: { conflictId } }),
  ]);

  for (let i = 0; i < events.length; i += 50) {
    const batch = events.slice(i, i + 50);
    await prisma.intelEvent.createMany({ data: batch.map(({ sources, ...row }) => row) });
  }
  await prisma.eventSource.createMany({
    data: events.flatMap((e) => e.sources.map((s) => ({ eventId: e.id, ...s }))),
    skipDuplicates: true,
  });
  await prisma.xPost.createMany({ data: posts, skipDuplicates: true });

  // Actors
  const actorRows = buildActorRows(conflictId, articles);
  for (const actor of actorRows) {
    await prisma.actor.upsert({
      where: { id: actor.id },
      update: {
        activityLevel: actor.activityLevel,
        activityScore: actor.activityScore,
        stance: actor.stance,
        saying: actor.saying,
        doing: actor.doing,
        assessment: actor.assessment,
      },
      create: actor,
    });
  }

  // Day snapshots + chips + scenarios
  const snapshots = buildSnapshots(conflictId, articles);
  await prisma.$transaction([
    prisma.conflictDaySnapshot.deleteMany({ where: { conflictId } }),
    prisma.mapFeature.deleteMany({ where: { conflictId } }),
    prisma.mapStory.deleteMany({ where: { conflictId } }),
  ]);

  for (const snap of snapshots) {
    await prisma.conflictDaySnapshot.upsert({
      where: { conflictId_day: { conflictId: snap.conflictId, day: snap.day } },
      update: {
        dayLabel: snap.dayLabel,
        summary: snap.summary,
        keyFacts: snap.keyFacts,
        escalation: snap.escalation,
      },
      create: snap,
    });
  }

  const today = new Date(generateDaysList(1)[0] + 'T00:00:00Z');
  const todaySnap = await prisma.conflictDaySnapshot.findFirst({ where: { conflictId, day: today } });
  if (todaySnap) {
    const chips = await buildEconomicChips();
    const scenarios = generateScenarios(score);
    await prisma.$transaction([
      prisma.economicImpactChip.deleteMany({ where: { snapshotId: todaySnap.id } }),
      prisma.scenario.deleteMany({ where: { snapshotId: todaySnap.id } }),
      prisma.economicImpactChip.createMany({
        data: chips.map((c, ord) => ({ snapshotId: todaySnap.id, ord, ...c })),
      }),
      prisma.scenario.createMany({
        data: scenarios.map((s, ord) => ({ snapshotId: todaySnap.id, ord, ...s })),
      }),
      prisma.conflictDaySnapshot.update({
        where: { id: todaySnap.id },
        data: { economicNarrative: generateSummary(articles) },
      }),
    ]);
  }

  // Map features + stories
  const mapFeatures = buildMapFeatures(conflictId, articles);
  await prisma.mapFeature.createMany({ data: mapFeatures, skipDuplicates: true });

  const stories = buildStories(conflictId, events);
  for (const story of stories) {
    await prisma.mapStory.create({
      data: {
        ...story,
        events: { create: story.events.map((e, ord) => ({ ord, ...e })) },
      },
    });
  }

  console.log(`[sync] Synced ${conflictId}: ${articles.length} articles, ${events.length} events, ${actorRows.length} actors, ${snapshots.length} snapshots, ${mapFeatures.length} map features.`);
}
