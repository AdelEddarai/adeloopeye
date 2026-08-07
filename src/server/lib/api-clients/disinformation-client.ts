/**
 * Disinformation / Bot Network Intelligence Client
 * Free, keyless sources:
 *  1. GDELT DOC 2.0        — reported disinformation / influence-operation coverage (no key)
 *  2. Firehol + IPSum + C2IntelFeeds — observed botnet / C2 / scanning IPs (no key)
 *  3. ipwho.is             — free IP geolocation (no key)
 *  4. GreyNoise Community  — per-IP noise classification (no key)
 *
 * Honest attribution model:
 *  - CAMPAIGN edges: direction comes from journalistic reporting (GDELT) that ties a
 *    foreign country to disinformation/cyber activity against another country. When a
 *    headline phrases an attribution ("X accused of hacking Y") the arc follows that
 *    direction; otherwise the pair is a co-mention (two countries in one article).
 *  - BOT_TRAFFIC edges: bot IPs observed in a source country, pointing at the focus
 *    country under monitoring. This shows where bot activity originates, NOT that a
 *    government of that country is behind it.
 */

export type DisinfoArticle = {
  id: string;
  title: string;
  url: string;
  domain: string;
  date: string;
  countries: string[];
};

export type DisinfoEdgeSource = {
  title: string;
  url: string;
  domain: string;
};

export type DisinfoEdge = {
  id: string;
  source: string;
  target: string;
  weight: number;
  kind: 'CAMPAIGN' | 'BOT_TRAFFIC';
  subKind?:
    | 'INFLUENCE_OP'
    | 'ATTRIBUTED_ATTACK'
    | 'CO_MENTION'
    | 'BOTNET'
    | 'C2'
    | 'SCANNING';
  sources: DisinfoEdgeSource[];
  lastSeen: string;
};

export type DisinfoNode = {
  code: string;
  name: string;
  lat: number;
  lon: number;
  campaignVolume: number;
  botVolume: number;
};

export type DisinformationResponse = {
  focus: { code: string; name: string; lat: number; lon: number };
  edges: DisinfoEdge[];
  nodes: DisinfoNode[];
  articles: DisinfoArticle[];
  stats: {
    campaigns: number;
    botSources: number;
    botCountries: number;
    articleCount: number;
  };
  sources: Array<{ name: string; url: string }>;
  timestamp: string;
};

type CountryInfo = { code: string; name: string; lat: number; lon: number; matches: string[] };

const COUNTRIES: CountryInfo[] = [
  { code: 'MA', name: 'Morocco', lat: 31.79, lon: -7.09, matches: ['morocco', 'moroccan', 'western sahara', 'sahrawi', 'saharawi', 'laayoune'] },
  { code: 'DZ', name: 'Algeria', lat: 28.03, lon: 1.66, matches: ['algeria', 'algerian'] },
  { code: 'ES', name: 'Spain', lat: 40.46, lon: -3.75, matches: ['spain', 'spanish'] },
  { code: 'FR', name: 'France', lat: 46.23, lon: 2.21, matches: ['france', 'french'] },
  { code: 'PT', name: 'Portugal', lat: 39.4, lon: -8.22, matches: ['portugal', 'portuguese'] },
  { code: 'TN', name: 'Tunisia', lat: 33.89, lon: 9.54, matches: ['tunisia', 'tunisian'] },
  { code: 'LY', name: 'Libya', lat: 26.34, lon: 17.23, matches: ['libya', 'libyan'] },
  { code: 'EG', name: 'Egypt', lat: 26.82, lon: 30.8, matches: ['egypt', 'egyptian'] },
  { code: 'MR', name: 'Mauritania', lat: 20.57, lon: -12.21, matches: ['mauritania', 'mauritanian'] },
  { code: 'SN', name: 'Senegal', lat: 14.5, lon: -14.45, matches: ['senegal', 'senegalese'] },
  { code: 'ML', name: 'Mali', lat: 17.57, lon: -3.99, matches: ['mali'] },
  { code: 'NE', name: 'Niger', lat: 17.61, lon: 8.08, matches: ['niger'] },
  { code: 'BF', name: 'Burkina Faso', lat: 12.24, lon: -1.56, matches: ['burkina'] },
  { code: 'TD', name: 'Chad', lat: 15.45, lon: 18.73, matches: ['chad'] },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lon: 8.67, matches: ['nigeria', 'nigerian'] },
  { code: 'SD', name: 'Sudan', lat: 15.89, lon: 30.22, matches: ['sudan', 'sudanese'] },
  { code: 'SA', name: 'Saudi Arabia', lat: 23.89, lon: 45.08, matches: ['saudi'] },
  { code: 'QA', name: 'Qatar', lat: 25.35, lon: 51.18, matches: ['qatar', 'qatari'] },
  { code: 'AE', name: 'United Arab Emirates', lat: 23.42, lon: 53.85, matches: ['emirates', 'uae', 'dubai', 'abudhabi', 'abu dhabi'] },
  { code: 'KW', name: 'Kuwait', lat: 29.31, lon: 47.48, matches: ['kuwait', 'kuwaiti'] },
  { code: 'BH', name: 'Bahrain', lat: 26.07, lon: 50.55, matches: ['bahrain'] },
  { code: 'YE', name: 'Yemen', lat: 15.55, lon: 48.51, matches: ['yemen', 'yemeni'] },
  { code: 'OM', name: 'Oman', lat: 21.51, lon: 55.92, matches: ['oman', 'omani'] },
  { code: 'IQ', name: 'Iraq', lat: 33.22, lon: 43.68, matches: ['iraq', 'iraqi'] },
  { code: 'SY', name: 'Syria', lat: 34.8, lon: 38.99, matches: ['syria', 'syrian'] },
  { code: 'LB', name: 'Lebanon', lat: 33.85, lon: 35.86, matches: ['lebanon', 'lebanese'] },
  { code: 'JO', name: 'Jordan', lat: 31.95, lon: 36.24, matches: ['jordan'] },
  { code: 'IL', name: 'Israel', lat: 31.05, lon: 34.85, matches: ['israel', 'israeli'] },
  { code: 'PS', name: 'Palestine', lat: 31.95, lon: 35.23, matches: ['palestine', 'palestinian', 'gaza', 'west bank'] },
  { code: 'TR', name: 'Turkey', lat: 38.96, lon: 35.24, matches: ['turkey', 'turkish', 'türkiye'] },
  { code: 'IR', name: 'Iran', lat: 32.43, lon: 53.69, matches: ['iran', 'iranian'] },
  { code: 'AF', name: 'Afghanistan', lat: 33.94, lon: 67.71, matches: ['afghanistan', 'afghan'] },
  { code: 'PK', name: 'Pakistan', lat: 30.38, lon: 69.35, matches: ['pakistan', 'pakistani'] },
  { code: 'IN', name: 'India', lat: 20.59, lon: 78.96, matches: ['india', 'indian'] },
  { code: 'BD', name: 'Bangladesh', lat: 23.68, lon: 90.36, matches: ['bangladesh', 'bangladeshi'] },
  { code: 'LK', name: 'Sri Lanka', lat: 7.87, lon: 80.77, matches: ['sri lanka'] },
  { code: 'TH', name: 'Thailand', lat: 15.87, lon: 100.99, matches: ['thailand', 'thai'] },
  { code: 'VN', name: 'Vietnam', lat: 14.06, lon: 108.28, matches: ['vietnam', 'vietnamese'] },
  { code: 'MY', name: 'Malaysia', lat: 4.21, lon: 101.98, matches: ['malaysia', 'malaysian'] },
  { code: 'ID', name: 'Indonesia', lat: -0.79, lon: 113.92, matches: ['indonesia', 'indonesian'] },
  { code: 'PH', name: 'Philippines', lat: 12.88, lon: 121.77, matches: ['philippines', 'filipino'] },
  { code: 'CN', name: 'China', lat: 35.86, lon: 104.2, matches: ['china', 'chinese', 'beijing'] },
  { code: 'TW', name: 'Taiwan', lat: 23.7, lon: 121, matches: ['taiwan', 'taiwanese'] },
  { code: 'JP', name: 'Japan', lat: 36.2, lon: 138.25, matches: ['japan', 'japanese'] },
  { code: 'KR', name: 'South Korea', lat: 35.91, lon: 127.77, matches: ['south korea', 'korean'] },
  { code: 'KP', name: 'North Korea', lat: 40.34, lon: 127.51, matches: ['north korea'] },
  { code: 'MN', name: 'Mongolia', lat: 46.86, lon: 103.85, matches: ['mongolia', 'mongolian'] },
  { code: 'KZ', name: 'Kazakhstan', lat: 48.02, lon: 66.92, matches: ['kazakhstan', 'kazakh'] },
  { code: 'UZ', name: 'Uzbekistan', lat: 41.38, lon: 64.58, matches: ['uzbekistan', 'uzbek'] },
  { code: 'RU', name: 'Russia', lat: 61.52, lon: 105.32, matches: ['russia', 'russian', 'moscow', 'kremlin'] },
  { code: 'UA', name: 'Ukraine', lat: 48.38, lon: 31.17, matches: ['ukraine', 'ukrainian', 'kyiv'] },
  { code: 'BY', name: 'Belarus', lat: 53.71, lon: 27.95, matches: ['belarus', 'belarusian'] },
  { code: 'PL', name: 'Poland', lat: 51.92, lon: 19.15, matches: ['poland', 'polish'] },
  { code: 'CZ', name: 'Czechia', lat: 49.82, lon: 15.47, matches: ['czechia', 'czech'] },
  { code: 'DE', name: 'Germany', lat: 51.17, lon: 10.45, matches: ['germany', 'german', 'berlin'] },
  { code: 'AT', name: 'Austria', lat: 47.52, lon: 14.55, matches: ['austria', 'austrian'] },
  { code: 'CH', name: 'Switzerland', lat: 46.82, lon: 8.23, matches: ['switzerland', 'swiss'] },
  { code: 'NL', name: 'Netherlands', lat: 52.13, lon: 5.29, matches: ['netherlands', 'dutch', 'holland'] },
  { code: 'BE', name: 'Belgium', lat: 50.5, lon: 4.47, matches: ['belgium', 'belgian'] },
  { code: 'LU', name: 'Luxembourg', lat: 49.82, lon: 6.13, matches: ['luxembourg'] },
  { code: 'GB', name: 'United Kingdom', lat: 55.38, lon: -3.44, matches: ['britain', 'british', 'united kingdom', 'england', 'london', 'uk '] },
  { code: 'IE', name: 'Ireland', lat: 53.41, lon: -8.24, matches: ['ireland', 'irish'] },
  { code: 'DK', name: 'Denmark', lat: 56.26, lon: 9.5, matches: ['denmark', 'danish'] },
  { code: 'SE', name: 'Sweden', lat: 60.13, lon: 18.64, matches: ['sweden', 'swedish'] },
  { code: 'NO', name: 'Norway', lat: 60.47, lon: 8.47, matches: ['norway', 'norwegian'] },
  { code: 'FI', name: 'Finland', lat: 61.92, lon: 25.75, matches: ['finland', 'finnish'] },
  { code: 'EE', name: 'Estonia', lat: 58.6, lon: 25.01, matches: ['estonia', 'estonian'] },
  { code: 'LV', name: 'Latvia', lat: 56.88, lon: 24.6, matches: ['latvia', 'latvian'] },
  { code: 'LT', name: 'Lithuania', lat: 55.17, lon: 23.88, matches: ['lithuania', 'lithuanian'] },
  { code: 'RO', name: 'Romania', lat: 45.94, lon: 24.97, matches: ['romania', 'romanian'] },
  { code: 'BG', name: 'Bulgaria', lat: 42.73, lon: 25.49, matches: ['bulgaria', 'bulgarian'] },
  { code: 'GR', name: 'Greece', lat: 39.07, lon: 21.82, matches: ['greece', 'greek'] },
  { code: 'CY', name: 'Cyprus', lat: 35.13, lon: 33.43, matches: ['cyprus', 'cypriot'] },
  { code: 'MT', name: 'Malta', lat: 35.94, lon: 14.38, matches: ['malta', 'maltese'] },
  { code: 'IT', name: 'Italy', lat: 41.87, lon: 12.57, matches: ['italy', 'italian', 'rome'] },
  { code: 'HU', name: 'Hungary', lat: 47.16, lon: 19.5, matches: ['hungary', 'hungarian'] },
  { code: 'SK', name: 'Slovakia', lat: 48.67, lon: 19.7, matches: ['slovakia', 'slovak'] },
  { code: 'SI', name: 'Slovenia', lat: 46.15, lon: 14.99, matches: ['slovenia', 'slovenian'] },
  { code: 'HR', name: 'Croatia', lat: 45.1, lon: 15.2, matches: ['croatia', 'croatian'] },
  { code: 'BA', name: 'Bosnia', lat: 43.92, lon: 17.68, matches: ['bosnia'] },
  { code: 'RS', name: 'Serbia', lat: 44.02, lon: 21.01, matches: ['serbia', 'serbian'] },
  { code: 'MK', name: 'North Macedonia', lat: 41.61, lon: 21.75, matches: ['macedonia', 'macedonian'] },
  { code: 'AL', name: 'Albania', lat: 41.15, lon: 20.17, matches: ['albania', 'albanian'] },
  { code: 'XK', name: 'Kosovo', lat: 42.6, lon: 20.9, matches: ['kosovo'] },
  { code: 'ME', name: 'Montenegro', lat: 42.71, lon: 19.37, matches: ['montenegro'] },
  { code: 'MD', name: 'Moldova', lat: 47.41, lon: 28.37, matches: ['moldova', 'moldovan'] },
  { code: 'GE', name: 'Georgia', lat: 42.32, lon: 43.36, matches: ['georgia', 'georgian'] },
  { code: 'AM', name: 'Armenia', lat: 40.07, lon: 45.04, matches: ['armenia', 'armenian'] },
  { code: 'AZ', name: 'Azerbaijan', lat: 40.14, lon: 47.58, matches: ['azerbaijan', 'azerbaijani'] },
  { code: 'MX', name: 'Mexico', lat: 23.63, lon: -102.55, matches: ['mexico', 'mexican'] },
  { code: 'US', name: 'United States', lat: 37.09, lon: -95.71, matches: ['united states', 'america', 'american', 'washington dc', 'white house'] },
  { code: 'CA', name: 'Canada', lat: 56.13, lon: -106.35, matches: ['canada', 'canadian'] },
  { code: 'CU', name: 'Cuba', lat: 21.52, lon: -77.78, matches: ['cuba', 'cuban'] },
  { code: 'GT', name: 'Guatemala', lat: 15.78, lon: -90.23, matches: ['guatemala', 'guatemalan'] },
  { code: 'CO', name: 'Colombia', lat: 4.57, lon: -74.3, matches: ['colombia', 'colombian'] },
  { code: 'VE', name: 'Venezuela', lat: 6.42, lon: -66.59, matches: ['venezuela', 'venezuelan'] },
  { code: 'BR', name: 'Brazil', lat: -14.24, lon: -51.93, matches: ['brazil', 'brazilian'] },
  { code: 'AR', name: 'Argentina', lat: -38.42, lon: -63.62, matches: ['argentina', 'argentine', 'argentinian'] },
  { code: 'CL', name: 'Chile', lat: -35.68, lon: -71.54, matches: ['chile', 'chilean'] },
  { code: 'PE', name: 'Peru', lat: -9.19, lon: -75.02, matches: ['peru', 'peruvian'] },
  { code: 'EC', name: 'Ecuador', lat: -1.83, lon: -78.18, matches: ['ecuador', 'ecuadorian'] },
  { code: 'BO', name: 'Bolivia', lat: -16.29, lon: -63.59, matches: ['bolivia', 'bolivian'] },
  { code: 'PY', name: 'Paraguay', lat: -23.44, lon: -58.44, matches: ['paraguay', 'paraguayan'] },
  { code: 'UY', name: 'Uruguay', lat: -32.52, lon: -55.77, matches: ['uruguay', 'uruguayan'] },
  { code: 'ZA', name: 'South Africa', lat: -30.56, lon: 22.94, matches: ['south africa'] },
  { code: 'KE', name: 'Kenya', lat: -0.02, lon: 37.91, matches: ['kenya', 'kenyan'] },
  { code: 'ET', name: 'Ethiopia', lat: 9.15, lon: 40.49, matches: ['ethiopia', 'ethiopian'] },
  { code: 'AU', name: 'Australia', lat: -25.27, lon: 133.78, matches: ['australia', 'australian'] },
  { code: 'NZ', name: 'New Zealand', lat: -40.9, lon: 174.89, matches: ['new zealand'] },
];

const COUNTRY_BY_CODE = new Map(COUNTRIES.map(c => [c.code, c]));
const COUNTRY_BY_NAME = new Map(COUNTRIES.map(c => [c.name.toLowerCase(), c]));

// Western Sahara is Moroccan territory in this product: fold its code into Morocco.
const CODE_ALIASES: Record<string, string> = { EH: 'MA' };

function normalizeCode(code: string): string {
  return CODE_ALIASES[code] ?? code;
}

function countryByCode(code: string): CountryInfo {
  return COUNTRY_BY_CODE.get(code) ?? COUNTRY_BY_CODE.get('MA')!;
}

export function countryFromCode(code: string) {
  return countryByCode(code);
}

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

const GDELT_QUERIES = {
  // Maghreb/Morocco-centric disinformation, Facebook/Meta bot networks, phishing & digital deception
  maghreb:
    '(morocco OR algeria OR sahrawi OR "western sahara" OR maghreb OR rabat OR casablanca) ' +
    '(disinformation OR propaganda OR "influence operation" OR "bot network" OR "fake accounts" OR ' +
    'disinfo OR manipulation OR "information war" OR phishing OR astroturfing OR "facebook bots" OR ' +
    '"social media manipulation" OR "coordinated inauthentic" OR "fake news" OR "cyber attack" OR "data breach")',
  // Worldwide disinformation / coordinated inauthentic behavior
  disinfo:
    '(disinformation OR "influence operation" OR "bot network" OR "coordinated inauthentic" OR ' +
    '"fake accounts" OR disinfo OR propaganda OR "information war" OR phishing OR astroturfing OR "digital deception")',
  // Worldwide cyber attacks, espionage and state-backed hacking
  cyber:
    '(cyber attack OR cyberattack OR cyberwar OR "cyber warfare" OR "cyber espionage" OR ' +
    'hacking OR hacker OR ransomware OR malware OR "data breach" OR DDoS OR ' +
    '"denial-of-service" OR "zero-day" OR "state-sponsored" OR "state-backed" OR botnet OR phishing)',
};


function parseGDELTDate(seendate: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(seendate || '');
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  }
  return new Date().toISOString();
}

async function queryGDELTDisinfo(
  query: string,
  opts: { maxRecords?: number; timespan?: string; timeoutMs?: number } = {}
): Promise<DisinfoArticle[]> {
  const { maxRecords = 50, timespan = '2d', timeoutMs = 8000 } = opts;
  const url = new URL(GDELT_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('format', 'json');
  url.searchParams.set('maxrecords', String(maxRecords));
  url.searchParams.set('timespan', timespan);
  url.searchParams.set('sort', 'datedesc');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AdeloopDisinfoIntel/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 429) throw new Error('GDELT rate limit (429)');
    if (!res.ok) throw new Error(`GDELT error: ${res.status}`);
    if (!res.headers.get('content-type')?.includes('json')) throw new Error('GDELT non-JSON');

    const json = await res.json();
    const seen = new Set<string>();

    return (json?.articles || [])
      .filter((a: any) => a?.title)
      .map((a: any) => ({
        id: a.url || a.title,
        title: a.title,
        url: a.url || '',
        domain: a.domain || a.sourcecountry || 'GDELT',
        date: parseGDELTDate(a.seendate),
        countries: [],
      }))
      .filter((a: any) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      })
      .slice(0, maxRecords);
  } catch {
    return [];
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectCountries(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set<string>();
  for (const c of COUNTRIES) {
    for (const m of c.matches) {
      const esc = escapeRegExp(m);
      if (new RegExp(`[\\s\\p{P}](?:${esc})[\\s\\p{P}]`, 'iu').test(lower)) {
        found.add(c.code);
        break;
      }
    }
  }
  return [...found];
}

// ── Directional attribution from reporting language ──────────────────────────
// Titles like "Russia accused of hacking Germany" carry a direction. We template
// country names into numbered placeholders, then match small phrase patterns to
// decide who attacks whom. This reflects what reporting claims — not proof.

const NAME_ALT_RE = new RegExp(
  `(?<![a-z])(?:${COUNTRIES.flatMap(c => c.matches)
    .map(m => escapeRegExp(m.replace(/\s+/g, ' ').trim()))
    .sort((a, b) => b.length - a.length)
    .join('|')})(?![a-z])`,
  'gi'
);

const PH = '\x01(\\d+)\x02';

function templateTitle(title: string): { text: string; codes: string[] } {
  const lower = ` ${title.toLowerCase()} `;
  const codes: string[] = [];
  const text = lower.replace(NAME_ALT_RE, m => {
    const t = m.trim();
    const cc = COUNTRIES.find(c => c.matches.some(mm => mm.replace(/\s+/g, ' ').trim() === t));
    if (!cc) return m;
    codes.push(cc.code);
    return `\x01${codes.length - 1}\x02`;
  });
  return { text, codes };
}

function at(pattern: string): RegExp {
  return new RegExp(pattern.replace(/@/g, PH), 'gi');
}

const ATTACK_PATTERNS: Array<{
  re: RegExp;
  dir: (a: number, b: number) => [number, number];
}> = [
  {
    // "[source] accused of / suspected of / orchestrated ... attack on [target]"
    re: at(
      `@(?: accused of| suspected of| blamed for| behind| linked to| responsible for| orchestrated| conducted| launched| waged| mounted| carried out| directed| admits| admitted).{0,60}?(?:attack|hack|cyberattack|cyber attack|campaign|operation|disinformation|propaganda|botnet|malware|espionage|influence).{0,50}?(?:on|against|targeting)\\s+@`
    ),
    dir: (a, b) => [a, b],
  },
  {
    // "[source] accused of / suspected of hacking [target]"
    re: at(
      `@\\s+(?:accused of|suspected of|blamed for|responsible for|admits to|admitted to)\\s+(?:hacking|attacking|targeting|breaching|penetrating)\\s+@`
    ),
    dir: (a, b) => [a, b],
  },
  {
    // "attack on [target] attributed / blamed / linked to [source]"
    re: at(
      `(?:cyberattack|cyber attack|attack|hack|hacking|campaign|operation|disinformation|propaganda|botnet|malware|espionage|strike)\\s+(?:on|against|targeting)\\s+@.{0,40}?(?:attributed|blamed|linked|traced|tied) to\\s+@`
    ),
    dir: (a, b) => [b, a],
  },
  {
    // "[source] hackers / military hacked / attacked / targeted [target]"
    re: at(`@\\s+(?:hackers?\\s+)?(?:hacked|attacked|targeted|struck|breached|penetrated|hit)\\s+@`),
    dir: (a, b) => [a, b],
  },
  {
    // "[target] accuses / blames [source] of ..."
    re: at(`@\\s+(?:accuses|blames|suspects)\\s+@\\s+(?:of|for)\\b`),
    dir: (a, b) => [b, a],
  },
  {
    // "attack on [target] by [source]"
    re: at(
      `@(?:attack|cyberattack|cyber attack|hack|espionage|campaign|operation).{0,40}?(?:on|against|targeting)\\s+@\\s+(?:by|from)\\s+@`
    ),
    dir: (a, b) => [b, a],
  },
];

function inferAttackDirection(title: string): { source: string; target: string } | null {
  const { text, codes } = templateTitle(title);
  if (codes.length < 2) return null;
  for (const pattern of ATTACK_PATTERNS) {
    const match = text.match(pattern.re);
    if (!match) continue;
    const ids: number[] = [];
    const phRe = new RegExp(PH, 'g');
    let ph: RegExpExecArray | null;
    while ((ph = phRe.exec(match[0])) !== null) ids.push(Number(ph[1]));
    if (ids.length < 2) continue;
    const [a, b] = pattern.dir(ids[0], ids[1]);
    const source = codes[a];
    const target = codes[b];
    if (!source || !target || source === target) continue;
    return { source, target };
  }
  return null;
}

function upsertDisinfoEdge(
  map: Map<string, DisinfoEdge>,
  source: string,
  target: string,
  subKind: DisinfoEdge['subKind'],
  a: DisinfoArticle
): void {
  const key = `${source}-${target}`;
  if (!map.has(key)) {
    map.set(key, {
      id: `campaign-${key}`,
      source,
      target,
      weight: 0,
      kind: 'CAMPAIGN',
      subKind,
      sources: [],
      lastSeen: a.date,
    });
  }
  const e = map.get(key)!;
  e.weight += 1;
  if (e.sources.length < 3) e.sources.push({ title: a.title, url: a.url, domain: a.domain });
  if (a.date > e.lastSeen) e.lastSeen = a.date;
}

function withCountries(articles: DisinfoArticle[]): DisinfoArticle[] {
  return articles.map(a => ({ ...a, countries: detectCountries(`${a.title} ${a.domain}`) }));
}

function campaignEdges(
  articles: DisinfoArticle[],
  focusCode: string
): { edges: DisinfoEdge[]; articles: DisinfoArticle[] } {
  const focus = COUNTRY_BY_CODE.get(focusCode);
  if (!focus) return { edges: [], articles: [] };

  const bySource = new Map<string, DisinfoEdge>();
  const focused: DisinfoArticle[] = [];

  for (const a of articles) {
    if (!a.countries.includes(focusCode)) continue;
    focused.push(a);

    const dir = inferAttackDirection(a.title);
    if (dir && (dir.source === focusCode || dir.target === focusCode)) {
      // Reporting names a direction that involves the focus country — keep it.
      upsertDisinfoEdge(bySource, dir.source, dir.target, 'ATTRIBUTED_ATTACK', a);
    } else {
      // No explicit direction: an arc from each other country toward the focus.
      for (const code of a.countries) {
        if (code === focusCode) continue;
        upsertDisinfoEdge(bySource, code, focusCode, 'CO_MENTION', a);
      }
    }
  }

  return { edges: [...bySource.values()], articles: focused };
}

/**
 * World mode (focus = 'WLD'): one directed arc per country pair mentioned in a
 * single article. When reporting phrases an attribution ("X accused of hacking Y")
 * the arc follows that direction; otherwise the pair is a plain co-mention.
 */
function campaignEdgesWorld(
  articles: DisinfoArticle[]
): { edges: DisinfoEdge[] } {
  const byPair = new Map<string, DisinfoEdge>();

  for (const a of articles) {
    const dir = inferAttackDirection(a.title);
    if (dir) {
      upsertDisinfoEdge(byPair, dir.source, dir.target, 'ATTRIBUTED_ATTACK', a);
      continue;
    }

    const codes = a.countries
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .sort();
    if (codes.length < 2) continue;

    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        upsertDisinfoEdge(byPair, codes[i], codes[j], 'CO_MENTION', a);
      }
    }
  }

  return {
    edges: [...byPair.values()]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 45),
  };
}

const BOT_FEED_URLS = {
  botscout: 'https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/botscout_30d.ipset',
  ipsum: 'https://raw.githubusercontent.com/stamparm/ipsum/master/levels/3.txt',
  c2: 'https://raw.githubusercontent.com/drb-ra/C2IntelFeeds/master/feeds/IPC2s-30day.csv',
};

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

async function fetchBotIPs(maxPerFeed: number): Promise<Array<{ ip: string; feed: string }>> {
  const results = await Promise.allSettled([
    fetch(BOT_FEED_URLS.botscout, { signal: AbortSignal.timeout(8000) }).then(r => r.text()),
    fetch(BOT_FEED_URLS.ipsum, { signal: AbortSignal.timeout(8000) }).then(r => r.text()),
    fetch(BOT_FEED_URLS.c2, { signal: AbortSignal.timeout(8000) }).then(r => r.text()),
  ]);

  const ips: Array<{ ip: string; feed: string }> = [];
  const seen = new Set<string>();
  const feedNames: string[] = ['botscout', 'ipsum', 'c2'];

  results.forEach((res, i) => {
    if (res.status !== 'fulfilled') return;
    const feed = feedNames[i];
    const lines = res.value.split('\n').slice(i === 2 ? 1 : 0);
    let count = 0;
    for (const line of lines) {
      const ip = line.trim().split(',')[0];
      if (!IP_RE.test(ip) || seen.has(ip)) continue;
      seen.add(ip);
      ips.push({ ip, feed });
      if (++count >= maxPerFeed) break;
    }
  });

  return ips.slice(0, maxPerFeed * 3);
}

const geoCache = new Map<string, { code: string; name: string; lat: number; lon: number }>();

async function geolocateIP(ip: string): Promise<{ code: string; name: string; lat: number; lon: number } | null> {
  const cached = geoCache.get(ip);
  if (cached) return cached;

  const attempts = [
    `https://ipwho.is/${ip}`,
    `http://ip-api.com/json/${ip}`,
  ];

  for (const url of attempts) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = await res.json();
      let code: string;
      let name: string;
      let lat: number;
      let lon: number;
      if (json.country_code) {
        code = json.country_code;
        name = json.country || code;
        lat = Number(json.latitude);
        lon = Number(json.longitude);
      } else if (json.countryCode) {
        code = json.countryCode;
        name = json.country || code;
        lat = Number(json.lat);
        lon = Number(json.lon);
      } else {
        continue;
      }
      if (!code || Number.isNaN(lat) || Number.isNaN(lon)) continue;
      code = normalizeCode(code);
      const known = COUNTRY_BY_CODE.get(code);
      const info = {
        code,
        name: known?.name ?? name,
        lat: known?.lat ?? lat,
        lon: known?.lon ?? lon,
      };
      geoCache.set(ip, info);
      return info;
    } catch {
      // try next provider
    }
  }
  return null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function greyNoiseClassification(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.greynoise.io/v3/community/${ip}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.noise === true && json.classification) return String(json.classification).toUpperCase();
    return null;
  } catch {
    return null;
  }
}

type LocatedBot = { ip: string; feed: string; code: string; classification: string | null };

type BotResult = {
  edges: DisinfoEdge[];
  sources: number;
  botCountries: number;
  byCountry: Map<string, { weight: number; c2: number; classified: string }>;
};

async function locateBotIPs(ips: Array<{ ip: string; feed: string }>): Promise<LocatedBot[]> {
  return (await mapWithConcurrency(ips, 5, async item => {
    const info = await geolocateIP(item.ip);
    if (!info) return null;
    const classification = await greyNoiseClassification(item.ip);
    return { ...item, ...info, classification };
  })).filter(Boolean) as LocatedBot[];
}

async function buildBotTrafficEdges(
  ips: Array<{ ip: string; feed: string }>,
  focusCode: string
): Promise<BotResult> {
  const located = await locateBotIPs(ips);

  const byCountry = new Map<string, { weight: number; c2: number; classified: string }>();
  for (const l of located) {
    const cur = byCountry.get(l.code) ?? { weight: 0, c2: 0, classified: '' };
    cur.weight += 1;
    if (l.feed === 'c2') cur.c2 += 1;
    if (l.classification && !cur.classified) cur.classified = l.classification;
    byCountry.set(l.code, cur);
  }

  // World mode: no single radar target — just report which countries host the bots.
  if (focusCode === 'WLD') {
    return { edges: [], sources: located.length, botCountries: byCountry.size, byCountry };
  }

  const now = new Date().toISOString();
  const edges: DisinfoEdge[] = [...byCountry.entries()]
    .map(([code, v]): DisinfoEdge => {
      const subKind: DisinfoEdge['subKind'] = v.c2 >= Math.ceil(v.weight / 2) ? 'C2' : 'BOTNET';
      return {
        id: `bot-${code}-${focusCode}`,
        source: code,
        target: focusCode,
        weight: v.weight,
        kind: 'BOT_TRAFFIC',
        subKind: v.classified === 'MALICIOUS' ? 'SCANNING' : subKind,
        sources: [],
        lastSeen: now,
      };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8); // keep the most significant bot-source countries

  return { edges, sources: located.length, botCountries: byCountry.size, byCountry };
}

function buildNodes(
  edges: DisinfoEdge[],
  articles: DisinfoArticle[],
  botByCountry?: Map<string, { weight: number; c2: number; classified: string }>
): DisinfoNode[] {
  const map = new Map<string, DisinfoNode>();
  const ensure = (code: string) => {
    if (!map.has(code)) {
      const c = COUNTRY_BY_CODE.get(code);
      if (!c) return;
      map.set(code, { code, name: c.name, lat: c.lat, lon: c.lon, campaignVolume: 0, botVolume: 0 });
    }
    return map.get(code)!;
  };

  for (const e of edges) {
    for (const code of [e.source, e.target]) {
      const n = ensure(code);
      if (!n) continue;
      if (e.kind === 'CAMPAIGN') n.campaignVolume += e.weight;
      else n.botVolume += e.weight;
    }
  }

  if (botByCountry) {
    for (const [code, v] of botByCountry) {
      const n = ensure(code);
      if (!n) continue;
      n.botVolume += v.weight;
    }
  }

  for (const a of articles) {
    for (const code of a.countries) {
      const n = ensure(code);
      if (!n) continue;
      if (a.countries.includes('MA') || a.countries.length <= 2) {
        n.campaignVolume += 1;
      }
    }
  }

  return [...map.values()];
}

export async function fetchDisinformationIntel(
  focusCode: string = 'MA'
): Promise<DisinformationResponse> {
  const isWorld = focusCode === 'WLD';
  const focus = isWorld
    ? { code: 'WLD', name: 'World', lat: 0, lon: 0 }
    : COUNTRY_BY_CODE.get(focusCode) ?? COUNTRY_BY_CODE.get('MA')!;

  const [q1, q2] = await Promise.allSettled([
    isWorld
      ? queryGDELTDisinfo(GDELT_QUERIES.cyber, { timespan: '7d', maxRecords: 75 })
      : queryGDELTDisinfo(GDELT_QUERIES.maghreb, { timespan: '7d', maxRecords: 50 }),
    queryGDELTDisinfo(GDELT_QUERIES.disinfo, { timespan: isWorld ? '7d' : '14d', maxRecords: isWorld ? 75 : 50 }),
  ]);

  const r1 = q1.status === 'fulfilled' ? q1.value : [];
  const r2 = q2.status === 'fulfilled' ? q2.value : [];

  const combined = withCountries([...r1, ...r2]);

  const botIPs = await fetchBotIPs(10);
  const bot = await buildBotTrafficEdges(botIPs.slice(0, 30), focusCode);

  let edges: DisinfoEdge[];
  let nodes: DisinfoNode[];
  let campaignCount: number;

  if (isWorld) {
    const { edges: campaign } = campaignEdgesWorld(combined);
    edges = [...campaign];
    campaignCount = campaign.length;
    nodes = buildNodes(edges, combined, bot.byCountry);
  } else {
    const { edges: campaign } = campaignEdges(combined, focusCode);
    edges = [...campaign, ...bot.edges];
    campaignCount = campaign.length;
    nodes = buildNodes(edges, combined);
  }

  const articles = combined
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    focus: { code: focus.code, name: focus.name, lat: focus.lat, lon: focus.lon },
    edges,
    nodes,
    articles,
    stats: {
      campaigns: campaignCount,
      botSources: bot.sources,
      botCountries: bot.botCountries,
      articleCount: articles.length,
    },
    sources: [
      { name: 'GDELT Project', url: 'https://www.gdeltproject.org' },
      { name: 'Firehol Blocklists', url: 'https://github.com/firehol/blocklist-ipsets' },
      { name: 'IPsum Threat List', url: 'https://github.com/stamparm/ipsum' },
      { name: 'C2IntelFeeds', url: 'https://github.com/drb-ra/C2IntelFeeds' },
      { name: 'ipwho.is', url: 'https://ipwho.is' },
      { name: 'GreyNoise Community', url: 'https://www.greynoise.io' },
    ],
    timestamp: new Date().toISOString(),
  };
}
