/**
 * Mock Data Provider
 * Returns static/mock data for all API endpoints to avoid database dependency
 */

export const MOCK_CONFLICT = {
  id: 'iran-2026',
  name: 'Iran Conflict 2026',
  codename: { us: 'Operation Sentinel Shield', il: 'Operation Iron Wall' },
  status: 'ONGOING' as const,
  threatLevel: 'HIGH' as const,
  startDate: '2026-01-01',
  region: 'Middle East',
  timezone: 'UTC',
  escalation: 7,
  summary: 'Ongoing regional tensions in the Middle East',
  keyFacts: [
    'Regional tensions remain elevated',
    'Multiple actors involved',
    'International monitoring ongoing',
  ],
  objectives: {
    us: 'Maintain regional stability',
    il: 'Ensure national security',
  },
  commanders: {
    us: ['Gen. John Smith'],
    il: ['Lt. Gen. David Cohen'],
    ir: ['Gen. Mohammad Bagheri'],
  },
};

export const MOCK_DAYS = [
  '2026-04-01',
  '2026-04-02',
  '2026-04-03',
  '2026-04-04',
  '2026-04-05',
  '2026-04-06',
  '2026-04-07',
  '2026-04-08',
  '2026-04-09',
];

export const MOCK_SNAPSHOT = {
  id: 'snap-1',
  conflictId: 'iran-2026',
  day: new Date('2026-04-09'),
  dayLabel: 'Day 99',
  summary: 'Situation remains tense with ongoing monitoring',
  keyFacts: [
    'No major incidents reported',
    'Diplomatic channels remain open',
    'Regional surveillance continues',
  ],
  escalation: 7,
  economicNarrative: 'Markets showing cautious optimism',
  casualties: {
    us: {
      kia: 0,
      wounded: 0,
      civilians: 0,
    },
    israel: {
      civilians: 0,
      injured: 0,
    },
    iran: {
      killed: 0,
    },
    regional: {
      syria: { killed: 0, injured: 0 },
      iraq: { killed: 0, injured: 0 },
      lebanon: { killed: 0, injured: 0 },
    },
  },
  economicImpact: {
    narrative: 'Global markets remain cautiously optimistic amid ongoing regional tensions. Oil prices have stabilized following initial volatility, while safe-haven assets like gold continue to see moderate gains. Shipping routes through the Strait of Hormuz remain operational with increased insurance premiums.',
    chips: [
      { label: 'Oil', val: '$85', sub: '+2.3%', color: 'var(--warning)' },
      { label: 'Gold', val: '$2,100', sub: '+0.8%', color: 'var(--success)' },
      { label: 'Shipping', val: 'Normal', sub: '+15% insurance', color: 'var(--info)' },
      { label: 'Markets', val: 'Stable', sub: 'Low volatility', color: 'var(--success)' },
    ],
  },
  economicChips: [
    { label: 'Oil', val: '$85', sub: '+2.3%', color: 'var(--warning)' },
    { label: 'Gold', val: '$2,100', sub: '+0.8%', color: 'var(--success)' },
  ],
  scenarios: [
    {
      label: 'De-escalation',
      subtitle: 'Diplomatic progress',
      color: 'var(--success)',
      prob: '45%',
      body: 'Continued diplomatic engagement may lead to reduced tensions',
    },
    {
      label: 'Status Quo',
      subtitle: 'Tensions persist',
      color: 'var(--warning)',
      prob: '40%',
      body: 'Current situation likely to continue without major changes',
    },
    {
      label: 'Escalation',
      subtitle: 'Increased activity',
      color: 'var(--danger)',
      prob: '15%',
      body: 'Risk of escalation remains present',
    },
  ],
};

export const MOCK_ACTORS = [
  {
    id: 'us',
    conflictId: 'iran-2026',
    name: 'United States',
    fullName: 'United States of America',
    countryCode: 'US',
    type: 'STATE' as const,
    mapKey: 'us',
    cssVar: '--us',
    colorRgb: [45, 114, 210],
    affiliation: 'FRIENDLY' as const,
    mapGroup: 'allied',
    activityLevel: 'ELEVATED' as const,
    activityScore: 7,
    stance: 'DEFENDER' as const,
    saying: 'Monitoring situation closely',
    doing: ['Naval presence maintained', 'Diplomatic engagement ongoing'],
    assessment: 'Maintaining defensive posture',
    keyFigures: ['President', 'Secretary of Defense'],
    linkedEventIds: [],
    recentActions: [],
    daySnapshots: {},
  },
  {
    id: 'iran',
    conflictId: 'iran-2026',
    name: 'Iran',
    fullName: 'Islamic Republic of Iran',
    countryCode: 'IR',
    type: 'STATE' as const,
    mapKey: 'iran',
    cssVar: '--iran',
    colorRgb: [231, 106, 110],
    affiliation: 'HOSTILE' as const,
    mapGroup: 'adversary',
    activityLevel: 'HIGH' as const,
    activityScore: 8,
    stance: 'AGGRESSOR' as const,
    saying: 'Defending national interests',
    doing: ['Military exercises', 'Regional coordination'],
    assessment: 'Active military posture',
    keyFigures: ['Supreme Leader', 'IRGC Commander'],
    linkedEventIds: [],
    recentActions: [],
    daySnapshots: {},
  },
];

export const MOCK_EVENTS = [
  {
    id: 'evt-1',
    conflictId: 'iran-2026',
    timestamp: new Date().toISOString(),
    severity: 'STANDARD' as const,
    type: 'MILITARY' as const,
    title: 'Routine patrol activity observed',
    location: 'Persian Gulf',
    summary: 'Standard military patrol operations continue',
    fullContent: 'Military forces conducting routine patrol operations in the region',
    verified: true,
    tags: ['military', 'patrol'],
    sources: [
      { name: 'Reuters', tier: 1, reliability: 95, url: null },
    ],
    actorResponses: [],
  },
];

export const MOCK_X_POSTS = [
  {
    id: 'post-1',
    conflictId: 'iran-2026',
    tweetId: null,
    postType: 'NEWS_ARTICLE' as const,
    handle: 'reuters',
    displayName: 'Reuters',
    avatar: '',
    avatarColor: '#FF6B00',
    verified: true,
    accountType: 'journalist' as const,
    significance: 'STANDARD' as const,
    timestamp: new Date().toISOString(),
    content: 'Regional situation remains stable with ongoing monitoring',
    images: [],
    videoThumb: null,
    likes: 0,
    retweets: 0,
    replies: 0,
    views: 0,
    adeloopeyeNote: null,
    eventId: null,
    actorId: null,
    verificationStatus: 'SKIPPED' as const,
    verifiedAt: null,
    xaiCitations: [],
  },
];

export const MOCK_MAP_FEATURES = [];

export const MOCK_MAP_STORIES = [];

export const MOCK_RSS_FEEDS = [
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://www.reuters.com/rssfeed/worldNews',
    perspective: 'WESTERN' as const,
    country: 'US',
    tags: ['news', 'international'],
    stateFunded: false,
    tier: 1,
  },
];

export const MOCK_COLLECTIONS = [];

export const MOCK_ECONOMIC_INDEXES = [
  {
    id: 'oil',
    ticker: 'CL=F',
    name: 'Crude Oil',
    shortName: 'Oil',
    category: 'ENERGY' as const,
    tier: 1,
    unit: '$',
    description: 'Crude oil futures',
    color: 'var(--warning)',
  },
];

export const MOCK_PREDICTION_GROUPS = [
  {
    id: 'escalation',
    label: 'ESCALATION',
    description: 'Escalation scenarios',
    color: 'var(--danger)',
    bg: 'var(--danger-dim)',
    border: 'var(--danger)',
    titleMatches: ['escalation', 'war', 'conflict'],
    ord: 1,
  },
];
