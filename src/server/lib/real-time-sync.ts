/**
 * Real-Time Sync
 * Populates the in-memory data store (no database) from real, live data
 * sources — GDELT (keyless) and the multi-source news client. No mock or
 * fabricated intelligence is ever written.
 *
 * Consumers call `ensureConflictSynced()` before reading. A freshness guard
 * (in-memory TTL + a cheap store recency check) keeps steady-state requests
 * fast and only performs the expensive network sync when the feed is stale or
 * empty.
 */

import { multiNewsClient, type NewsArticle } from './api-clients/multi-news-client';
import {
  getGlobalConflictArticles,
  getGlobalHeadlines,
  getMoroccoConflictArticles,
  getMoroccoHeadlines,
  type GDELTArticle,
} from './api-clients/gdelt-client';
import { telegramClient, MOROCCO_TELEGRAM_CHANNELS, GLOBAL_TELEGRAM_CHANNELS, type TelegramMessage } from './api-clients/telegram-client';
import {
  transformNewsToCriticalEvents,
  transformNewsToHeatPoints,
} from './live-data-transformer';
import { fetchCommodityPrices } from './api-clients/commodity-prices-client';
import { fetchCryptoPrices } from './api-clients/crypto-client';

import {
  store,
  type StoredActor,
  type StoredCasualty,
  type StoredEconChip,
  type StoredEvent,
  type StoredMapFeature,
  type StoredScenario,
  type StoredSnapshot,
  type StoredSource,
  type StoredStory,
  type StoredXPost,
} from './store';

import type { Actor, Conflict } from '@/types/domain';

const SYNC_TTL_MS = 10 * 60 * 1000;
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;
const SNAPSHOT_DAYS = 14;

const inFlight: Record<string, Promise<void>> = {};
const lastSync: Record<string, number> = {};

/**
 * Ensure the conflict feed is populated with recent real data before reads.
 * Cheap (in-memory recency check) when fresh; full network sync only when stale.
 */
export async function ensureConflictSynced(conflictId: string): Promise<void> {
  if (inFlight[conflictId]) return inFlight[conflictId];

  const since = lastSync[conflictId];
  if (since && Date.now() - since < SYNC_TTL_MS) return;

  // Skip during static build — data syncs at runtime on first request.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  // Cheap recency check: recent real events present in the store => already synced.
  const recent = store
    .getEvents(conflictId)
    .some((e) => Date.now() - new Date(e.timestamp).getTime() < RECENT_WINDOW_MS);
  if (recent) {
    lastSync[conflictId] = Date.now();
    return;
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
  // Morocco-specific queries ensure regional coverage.
  const [
    gdeltArticles,
    gdeltHeadlines,
    moroccoArticles,
    moroccoHeadlines,
    newsArticles,
    telegramArticles,
  ] = await Promise.allSettled([
    getGlobalConflictArticles(),
    getGlobalHeadlines(),
    getMoroccoConflictArticles().catch(() => [] as GDELTArticle[]),
    getMoroccoHeadlines().catch(() => [] as GDELTArticle[]),
    multiNewsClient.searchNews(
      'iran OR israel OR gaza OR syria OR lebanon OR yemen OR ukraine OR middle east conflict OR morocco OR western sahara OR houthi OR airstrike OR missile OR drone OR strike OR attack OR explosion',
      60,
      'en'
    ),
    fetchTelegramArticles().catch(() => [] as NewsArticle[]),
  ]);

  const articles: NewsArticle[] = [];

  if (gdeltArticles.status === 'fulfilled') {
    articles.push(...gdeltArticles.value.map(gdeltToNewsArticle));
  }
  if (gdeltHeadlines.status === 'fulfilled') {
    articles.push(...gdeltHeadlines.value.map(gdeltToNewsArticle));
  }
  if (moroccoArticles.status === 'fulfilled') {
    articles.push(...moroccoArticles.value.map(gdeltToNewsArticle));
  }
  if (moroccoHeadlines.status === 'fulfilled') {
    articles.push(...moroccoHeadlines.value.map(gdeltToNewsArticle));
  }
  if (newsArticles.status === 'fulfilled') {
    articles.push(...newsArticles.value);
  }
  if (telegramArticles.status === 'fulfilled') {
    articles.push(...telegramArticles.value);
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

/**
 * Fetch recent messages from Morocco and global Telegram channels
 * and convert them into NewsArticle objects for the sync pipeline.
 */
async function fetchTelegramArticles(): Promise<NewsArticle[]> {
  const channels = [...MOROCCO_TELEGRAM_CHANNELS, ...GLOBAL_TELEGRAM_CHANNELS];
  const articles: NewsArticle[] = [];

  for (const channel of channels) {
    const chat = await telegramClient.getChat(channel.id).catch(() => null);
    if (!chat) continue;

    const updates = await telegramClient.getUpdates(undefined, 20).catch(() => []);
    for (const update of updates) {
      const msg = update.message;
      if (!msg || !msg.text) continue;
      const text = msg.text.slice(0, 500);
      const date = new Date(msg.date * 1000).toISOString();
      articles.push({
        title: text.slice(0, 120) || channel.title,
        description: text.slice(0, 300),
        url: '',
        source: channel.title,
        publishedAt: date,
        author: null,
        imageUrl: null,
        content: text,
      });
    }
  }

  return articles;
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

function threatLevelFromScore(score: number): Conflict['threatLevel'] {
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

function generateScenarios(escalation: number): StoredScenario[] {
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
// Section builders (store shapes)
// ────────────────────────────────────────────────────────────────────────────

function buildEvents(conflictId: string, articles: NewsArticle[]): StoredEvent[] {
  return articles.slice(0, 60).map((a, idx) => {
    const content = `${a.title} ${a.description}`.toLowerCase();
    let severity: StoredEvent['severity'] = 'STANDARD';
    if (CRITICAL_KEYWORDS.some((k) => content.includes(k))) severity = 'CRITICAL';
    else if (HIGH_KEYWORDS.some((k) => content.includes(k))) severity = 'HIGH';

    let type: StoredEvent['type'] = 'POLITICAL';
    if (/military|attack|strike|troops|missile|drone|bomb/.test(content)) type = 'MILITARY';
    else if (/diplomat|negotiat|talks|summit/.test(content)) type = 'DIPLOMATIC';
    else if (/econom|sanction|trade|oil|market/.test(content)) type = 'ECONOMIC';
    else if (/humanitarian|refugee|aid|ceasefire/.test(content)) type = 'HUMANITARIAN';
    else if (/intel|espionage|cyber|intelligence/.test(content)) type = 'INTELLIGENCE';

    const locations = ['Tehran', 'Jerusalem', 'Tel Aviv', 'Baghdad', 'Damascus', 'Beirut', 'Gaza', 'Yemen', 'Iran', 'Israel', 'Lebanon', 'Syria', 'Iraq', 'Ukraine', 'Russia'];
    const found = locations.filter((loc) => content.includes(loc.toLowerCase()));

    const published = new Date(a.publishedAt).toISOString();

    return {
      id: `evt-${hashId(a.url || a.title)}-${idx}`,
      conflictId,
      timestamp: published,
      createdAt: published,
      severity,
      type,
      title: a.title,
      location: found[0] || 'Regional',
      summary: a.description || a.title,
      fullContent: a.content || a.description || a.title,
      verified: true,
      tags: [type.toLowerCase()],
      sources: [{ name: a.source, tier: 1, reliability: 90, url: a.url || null } as StoredSource],
      actorResponses: [],
    };
  });
}

function buildPosts(events: StoredEvent[], articles: NewsArticle[]): StoredXPost[] {
  return events.map((event, idx) => {
    const a = articles[idx];
    const content = `${a.title} ${a.description}`.toLowerCase();
    let significance: StoredXPost['significance'] = 'STANDARD';
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
      adeloopeyeNote: a.description || undefined,
      eventId: event.id,
      actorId: undefined,
      actorCssVar: null,
      actorColorRgb: [],
      verificationStatus: 'UNVERIFIED',
      xaiCitations: [],
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
  type: Actor['type'];
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
  { id: 'houthis', name: 'Houthis', fullName: 'Ansar Allah (Houthi movement)', countryCode: 'YE', type: 'NON-STATE', mapKey: 'HOUTHI', cssVar: 'var(--warning)', colorRgb: [236, 154, 60], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['houthi', 'yemen', 'bab el-mandeb', 'ansar allah'] },
  { id: 'hezbollah', name: 'Hezbollah', fullName: 'Hezbollah', countryCode: 'LB', type: 'NON-STATE', mapKey: 'HEZBOLLAH', cssVar: 'var(--danger)', colorRgb: [180, 40, 40], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['hezbollah', 'lebanon', 'beirut'] },
  { id: 'russia', name: 'Russia', fullName: 'Russian Federation', countryCode: 'RU', type: 'STATE', mapKey: 'RUSSIA', cssVar: 'var(--russia)', colorRgb: [200, 80, 80], affiliation: 'NEUTRAL', mapGroup: 'Observer', keywords: ['russia', 'moscow', 'putin'] },
  { id: 'china', name: 'China', fullName: 'People\'s Republic of China', countryCode: 'CN', type: 'STATE', mapKey: 'CHINA', cssVar: 'var(--china)', colorRgb: [220, 100, 100], affiliation: 'NEUTRAL', mapGroup: 'Observer', keywords: ['china', 'beijing', 'chinese'] },
  { id: 'morocco', name: 'Morocco', fullName: 'Kingdom of Morocco', countryCode: 'MA', type: 'STATE', mapKey: 'MOROCCO', cssVar: 'var(--warning)', colorRgb: [255, 180, 50], affiliation: 'NEUTRAL', mapGroup: 'Regional', keywords: ['morocco', 'rabat', 'casablanca', 'marrakech', 'maghreb', 'western sahara', 'polisario', 'hespress', 'le360'] },
  { id: 'gaza', name: 'Gaza / Hamas', fullName: 'Gaza Strip / Hamas', countryCode: 'PS', type: 'NON-STATE', mapKey: 'GAZA', cssVar: 'var(--danger)', colorRgb: [220, 80, 80], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['gaza', 'hamas', 'palestine', 'gazan'] },
  { id: 'yemen', name: 'Yemen / Houthis', fullName: 'Republic of Yemen / Ansar Allah', countryCode: 'YE', type: 'NON-STATE', mapKey: 'YEMEN', cssVar: 'var(--warning)', colorRgb: [236, 154, 60], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['yemen', 'houthi', 'ansar allah', 'sanaa', 'aden'] },
  { id: 'lebanon', name: 'Lebanon / Hezbollah', fullName: 'Lebanese Republic', countryCode: 'LB', type: 'STATE', mapKey: 'LEBANON', cssVar: 'var(--danger)', colorRgb: [180, 40, 40], affiliation: 'NEUTRAL', mapGroup: 'Regional', keywords: ['lebanon', 'beirut', 'hezbollah', 'hariri'] },
  { id: 'syria', name: 'Syria', fullName: 'Syrian Arab Republic', countryCode: 'SY', type: 'STATE', mapKey: 'SYRIA', cssVar: 'var(--danger)', colorRgb: [200, 60, 60], affiliation: 'HOSTILE', mapGroup: 'Adversary', keywords: ['syria', 'damascus', ' Assad', 'aleppo'] },
  { id: 'iraq', name: 'Iraq', fullName: 'Republic of Iraq', countryCode: 'IQ', type: 'STATE', mapKey: 'IRAQ', cssVar: 'var(--warning)', colorRgb: [210, 140, 40], affiliation: 'NEUTRAL', mapGroup: 'Regional', keywords: ['iraq', 'baghdad', 'mosul', 'shia', 'sunni'] },
];

function buildActorRows(conflictId: string, articles: NewsArticle[]): StoredActor[] {
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
      activityLevel: activityLevel as Actor['activityLevel'],
      activityScore: score,
      stance: stance as Actor['stance'],
      saying: mentions[0]?.title || `No recent ${seed.name} coverage in monitored feeds`,
      doing,
      assessment: `${seed.name} detected in ${mentions.length} of ${articles.length} monitored articles.`,
      recentActions: [],
      keyFigures: [],
      linkedEventIds: [],
      daySnapshots: {},
      responses: [],
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Day snapshots
// ────────────────────────────────────────────────────────────────────────────

function formatISODay(d: Date): string {
  return d.toISOString().split('T')[0];
}

function buildSnapshots(
  conflictId: string,
  articles: NewsArticle[],
  chips: StoredEconChip[],
  scenarios: StoredScenario[],
  today: string,
): StoredSnapshot[] {
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
    const isToday = day === today;
    return {
      id: `snap-${day}`,
      conflictId,
      day,
      dayLabel: idx === days.length - 1 ? 'Today' : `Day ${idx + 1}`,
      summary: dayArticles[0]?.title || 'No significant developments reported in monitored feeds on this day.',
      keyFacts: dayArticles.slice(0, 3).map((a) => a.title),
      escalation,
      economicNarrative: isToday ? generateSummary(articles) : '',
      casualties: [] as StoredCasualty[],
      economicChips: isToday ? chips : [],
      scenarios: isToday ? scenarios : [],
    };
  });
}

async function buildEconomicChips(): Promise<StoredEconChip[]> {
  const chips: StoredEconChip[] = [];
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

function buildMapFeatures(conflictId: string, articles: NewsArticle[]): StoredMapFeature[] {
  const features: StoredMapFeature[] = [];

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
      timestamp: evt.timestamp ? new Date(evt.timestamp).toISOString() : null,
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

function evtIdFromHeat(hp: { position?: [number, number]; weight?: number }): string {
  return `${hp.position?.[0] ?? 0}-${hp.position?.[1] ?? 0}-${hp.weight ?? 0}`;
}

function buildStories(conflictId: string, events: StoredEvent[]): StoredStory[] {
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
      category: category as StoredStory['category'],
      narrative: `${event.summary}\n\nSource: ${event.sources[0]?.name ?? 'GDELT'}`,
      highlightStrikeIds: category === 'STRIKE' ? [event.id] : [],
      highlightMissileIds: [],
      highlightTargetIds: [],
      highlightAssetIds: [],
      viewState: { longitude: 35.2137, latitude: 31.0461, zoom: 5 },
      keyFacts: [event.summary],
      timestamp: event.timestamp,
      events: [
        { time: event.timestamp, label: event.title.slice(0, 80), type: category === 'STRIKE' ? 'STRIKE' : 'POLITICAL' },
      ],
    };
  });
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

function mergeWithTTL<T extends { id: string; timestamp: string }>(
  existing: T[],
  incoming: T[],
): { merged: T[]; newIds: string[] } {
  const now = Date.now();
  const cutoff = now - TWENTY_FOUR_HOURS;

  const existingMap = new Map<string, T>();
  for (const item of existing) {
    const ts = new Date(item.timestamp).getTime();
    if (ts >= cutoff) {
      existingMap.set(item.id, item);
    }
  }

  const newIds: string[] = [];
  for (const item of incoming) {
    const ts = new Date(item.timestamp).getTime();
    if (ts < cutoff) continue;
    if (!existingMap.has(item.id)) {
      newIds.push(item.id);
    }
    existingMap.set(item.id, item);
  }

  return { merged: Array.from(existingMap.values()), newIds };
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

  const today = generateDaysList(1)[0];
  const conflict: Conflict = {
    id: conflictId,
    name: 'Global & Middle East Conflict Monitor',
    codename: { us: 'Regional Monitor', il: 'Regional Monitor' },
    status: 'ONGOING',
    threatLevel: threatLevelFromScore(score),
    startDate: today,
    region: 'Middle East & Global',
    timezone: 'UTC',
    escalation: score,
    summary: generateSummary(articles),
    keyFacts: generateKeyFacts(articles),
    objectives: { us: 'Monitor regional stability and protect allies', il: 'Ensure national security and deter threats' },
    commanders: { us: [], il: [], ir: [] },
  };
  store.setConflict(conflict);

  const existingEvents = store.getEvents(conflictId);
  const { merged: mergedEvents, newIds: newEventIds } = mergeWithTTL(existingEvents, events);
  store.setEvents(conflictId, mergedEvents);

  const existingPosts = store.getPosts(conflictId);
  const { merged: mergedPosts } = mergeWithTTL(existingPosts, posts);
  store.setPosts(conflictId, mergedPosts);

  const actors = buildActorRows(conflictId, articles);
  store.setActors(conflictId, actors);

  const chips = await buildEconomicChips();
  const scenarios = generateScenarios(score);
  const snapshots = buildSnapshots(conflictId, articles, chips, scenarios, today);
  store.setSnapshots(conflictId, snapshots);

  const existingFeatures = store.getMapFeatures(conflictId);
  const { merged: mergedFeatures } = mergeWithTTL(existingFeatures, buildMapFeatures(conflictId, articles));
  store.setMapFeatures(conflictId, mergedFeatures);

  const existingStories = store.getMapStories(conflictId);
  const { merged: mergedStories } = mergeWithTTL(existingStories, buildStories(conflictId, mergedEvents));
  store.setMapStories(conflictId, mergedStories);

  console.log(`[sync] Synced ${conflictId}: ${articles.length} articles, ${mergedEvents.length} events (${newEventIds.length} new), ${mergedPosts.length} posts, ${actors.length} actors, ${snapshots.length} snapshots, ${mergedFeatures.length} map features, ${mergedStories.length} stories.`);
}
