import type { XPost } from '@/types/domain';
export type { XPost };

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export const X_POSTS: XPost[] = [
  // ── 1. CENTCOM — US KIA confirmed ─────────────────────────────────────────
  {
    id: 'xi-001',
    handle: '@CENTCOM',
    displayName: 'US Central Command',
    avatar: 'CC',
    avatarColor: '#1a56db',
    verified: true,
    accountType: 'military',
    significance: 'BREAKING',
    timestamp: '2026-03-01T14:32:00Z',
    content: 'CENTCOM STATEMENT — March 1, 2026:\n\nThree U.S. service members have been killed in action and five are seriously wounded as part of Operation Epic Fury. Several others sustained minor injuries during Iranian retaliatory strikes on regional installations.\n\nThe names of the fallen will be released after notification of next of kin. We honor their sacrifice and remain committed to mission success.\n\nOperations are ongoing.',
    likes: 181000,
    retweets: 94000,
    replies: 28700,
    views: 12400000,
    eventId: 'evt-014',
    actorId: 'us',
  },

  // ── 2. IDF — Opening strike confirmed ────────────────────────────────────
  {
    id: 'xi-002',
    handle: '@IDF',
    displayName: 'Israel Defense Forces',
    avatar: 'ID',
    avatarColor: '#0049a0',
    verified: true,
    accountType: 'military',
    significance: 'BREAKING',
    timestamp: '2026-02-28T04:55:00Z',
    content: 'OPERATION ROARING LION — UNDERWAY\n\nThe IDF is currently conducting extensive strikes against Iranian nuclear facilities, ballistic missile launchers, and regime leadership targets across Iran.\n\nTargets include:\n▸ Iranian nuclear enrichment sites\n▸ IRGC leadership compounds, Tehran\n▸ Surface-to-surface missile launcher arrays\n▸ Air defense infrastructure\n\nThe State of Israel is exercising its inherent right of self-defense. Operations are ongoing. Updates will follow.',
    likes: 224000,
    retweets: 117000,
    replies: 61000,
    views: 19800000,
    eventId: 'evt-001',
    actorId: 'idf',

  },

  // ── 3. Reuters BREAKING — Khamenei killed ────────────────────────────────
  {
    id: 'xi-003',
    handle: '@Reuters',
    displayName: 'Reuters',
    avatar: 'RT',
    avatarColor: '#ff8000',
    verified: true,
    accountType: 'journalist',
    significance: 'BREAKING',
    timestamp: '2026-02-28T14:38:00Z',
    content: 'BREAKING: Iran\'s state broadcaster IRNA confirms Supreme Leader Ali Khamenei was killed in Israeli airstrikes on his residential compound in Tehran earlier today.\n\nIRGC confirms "martyrdom of the Supreme Leader" — Khamenei, 86, had led the Islamic Republic since 1989.\n\nTransitional leadership now forming under constitutional succession procedure. Full story: reuters.com',
    likes: 892000,
    retweets: 441000,
    replies: 189000,
    views: 67000000,
    eventId: 'evt-003',
    actorId: 'iran',

  },

  // ── 4. NYT — GBU-57 MOP strike detail ────────────────────────────────────
  {
    id: 'xi-004',
    handle: '@nytimes',
    displayName: 'The New York Times',
    avatar: 'NY',
    avatarColor: '#000000',
    verified: true,
    accountType: 'journalist',
    significance: 'HIGH',
    timestamp: '2026-02-28T08:12:00Z',
    content: 'NEW: The US Air Force dropped 14 GBU-57 Massive Ordnance Penetrators — each weighing 30,000 pounds — on Iran\'s underground nuclear facilities at Fordow and Natanz, per US officials.\n\nThis is the largest B-2 Spirit operational strike in US history. The US is believed to hold roughly 20 MOPs total.\n\nThe IAEA has lost sensor contact with both facilities. nytimes.com',
    likes: 523000,
    retweets: 278000,
    replies: 97000,
    views: 38000000,
    eventId: 'evt-002',
    actorId: 'us',

  },

  // ── 5. OSINT_Defender — Thermal imagery ──────────────────────────────────
  {
    id: 'xi-005',
    handle: '@OSINTdefender',
    displayName: 'OSINTdefender',
    avatar: 'OD',
    avatarColor: '#7c3aed',
    verified: true,
    accountType: 'analyst',
    significance: 'HIGH',
    timestamp: '2026-02-28T06:47:00Z',
    content: 'OSINT THREAD — Fordow nuclear site:\n\nSentinel-1 SAR imagery from 05:30Z shows massive ground disturbance signatures at grid [33.894° N, 51.077° E] consistent with multiple large-yield bunker penetrator strikes.\n\nThermal anomaly persists 90 min post-strike — indicates subsurface structural collapse and possible fire/gas release.\n\nMatches B-2 routing observed in ADS-B/MLAT data from Diego Garcia ~4h prior. Thread 🧵 [1/12]',
    images: ['osint-thermal-1'],
    likes: 187000,
    retweets: 104000,
    replies: 24000,
    views: 8900000,
    eventId: 'evt-002',

  },

];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPostsForEvent(eventId: string): XPost[] {
  return X_POSTS.filter(p => p.eventId === eventId);
}

export function getPostsForActor(actorId: string): XPost[] {
  return X_POSTS.filter(p => p.actorId === actorId);
}

export function getBreakingPosts(): XPost[] {
  return X_POSTS.filter(p => p.significance === 'BREAKING');
}
