/**
 * worldBaseline.ts
 * Always-on, seeded "world monitor" picture so the OSINT map renders instantly
 * (Palantir / World-Monitor style) even when live newswire APIs are rate-limited
 * or unreachable. Live news data is MERGED ON TOP of this baseline in the
 * map/data route, so the map is never empty.
 *
 * Items keep `timestamp: ''` (falsy) so they always pass the map's time filter
 * (`inTime` returns true when `item.timestamp` is falsy), i.e. they are pinned
 * visible regardless of the timeline window. Live items use real timestamps.
 */

import type {
  Asset,
  ConflictRelationship,
  CyberThreat,
  HeatPoint,
  MaritimeLane,
  MissileTrack,
  StrikeArc,
  Target,
  ThreatZone,
} from './map-data';
import type { ActorMeta } from './map-tokens';

export type WorldBaseline = {
  actorMeta: Record<string, ActorMeta>;
  conflictRelationships: ConflictRelationship[];
  threatZones: ThreatZone[];
  assets: Asset[];
  maritimeLanes: MaritimeLane[];
  strikeArcs: StrikeArc[];
  missileTracks: MissileTrack[];
  targets: Target[];
  cyberThreats: CyberThreat[];
  heatPoints: HeatPoint[];
};

const NEVER = '';

// ─── Actor meta ────────────────────────────────────────────
// Broad set so every seeded marker gets a colour in the layer pipeline.

const meta = (label: string, cssVar: string, rgb: number[], affiliation: ActorMeta['affiliation'], group: string): ActorMeta => ({
  label,
  cssVar,
  rgb,
  affiliation,
  group,
});

const FRIENDLY = 'FRIENDLY' as const;
const HOSTILE = 'HOSTILE' as const;
const NEUTRAL = 'NEUTRAL' as const;

// ─── Coordinates (approx. national anchors for arcs/lines) ─
const P = {
  us: [-77.04, 38.9] as [number, number],
  iran: [51.39, 35.69] as [number, number],
  israel: [34.78, 32.09] as [number, number],
  gaza: [34.28, 31.42] as [number, number],
  lebanon: [35.5, 33.89] as [number, number],
  syria: [36.28, 33.51] as [number, number],
  iraq: [44.37, 33.32] as [number, number],
  turkey: [32.86, 39.93] as [number, number],
  russia: [37.62, 55.76] as [number, number],
  ukraine: [30.52, 50.45] as [number, number],
  china: [116.4, 39.9] as [number, number],
  taiwan: [121.57, 25.03] as [number, number],
  south_korea: [126.98, 37.57] as [number, number],
  north_korea: [125.76, 39.04] as [number, number],
  india: [77.2, 28.6] as [number, number],
  pakistan: [73.05, 33.68] as [number, number],
  philippines: [120.98, 14.6] as [number, number],
  saudi_arabia: [46.68, 24.71] as [number, number],
  yemen: [44.2, 15.55] as [number, number],
  armenia: [44.51, 40.19] as [number, number],
  azerbaijan: [49.87, 40.41] as [number, number],
  venezuela: [-66.9, 10.48] as [number, number],
  sudan: [32.56, 15.5] as [number, number],
  myanmar: [96.16, 16.87] as [number, number],
  taiwan_strait: [119.5, 24.5] as [number, number],
  south_china_sea: [117.8, 11.9] as [number, number],
  red_sea: [38.2, 16.0] as [number, number],
  gulf: [53.0, 26.5] as [number, number],
  donbas: [38.5, 48.5] as [number, number],
  kashmir: [75.3, 34.5] as [number, number],
  west_bank: [35.2, 31.9] as [number, number],
  bosphorus: [29.0, 41.1] as [number, number],
  gibraltar: [-5.35, 36.0] as [number, number],
  suez: [32.4, 30.6] as [number, number],
  ethiopia: [38.7, 9.02] as [number, number],
  west_africa_sahel: [2.5, 16.0] as [number, number],
  nato: [-4.48, 50.85] as [number, number],
  eu: [4.9, 52.37] as [number, number],
  taliban: [69.2, 34.53] as [number, number],
};

const actorMeta: Record<string, ActorMeta> = {
  us: meta('United States', '--us', [45, 114, 210], FRIENDLY, 'allied'),
  israel: meta('Israel', '--israel', [76, 144, 240], FRIENDLY, 'allied'),
  ukraine: meta('Ukraine', '--ukraine', [80, 160, 240], FRIENDLY, 'allied'),
  nato: meta('NATO', '--t1', [90, 160, 220], FRIENDLY, 'allied'),
  eu: meta('European Union', '--t1', [90, 160, 220], FRIENDLY, 'allied'),
  south_korea: meta('South Korea', '--south_korea', [90, 170, 220], FRIENDLY, 'allied'),
  taiwan: meta('Taiwan', '--taiwan', [80, 150, 230], NEUTRAL, 'neutral'),
  philippines: meta('Philippines', '--t2', [80, 170, 225], FRIENDLY, 'allied'),
  india: meta('India', '--india', [120, 170, 220], NEUTRAL, 'neutral'),
  iran: meta('Iran', '--iran', [231, 106, 110], HOSTILE, 'adversary'),
  russia: meta('Russia', '--russia', [200, 80, 80], HOSTILE, 'adversary'),
  china: meta('China', '--china', [220, 100, 100], NEUTRAL, 'neutral'),
  north_korea: meta('North Korea', '--north_korea', [200, 90, 90], HOSTILE, 'adversary'),
  gaza: meta('Gaza', '--danger', [220, 80, 80], HOSTILE, 'adversary'),
  lebanon: meta('Lebanon', '--lebanon', [180, 40, 40], HOSTILE, 'adversary'),
  syria: meta('Syria', '--syria', [200, 60, 60], HOSTILE, 'adversary'),
  iraq: meta('Iraq', '--iraq', [210, 140, 40], HOSTILE, 'adversary'),
  turkey: meta('Turkey', '--turkey', [200, 160, 90], NEUTRAL, 'neutral'),
  saudi_arabia: meta('Saudi Arabia', '--saudi', [150, 170, 90], NEUTRAL, 'neutral'),
  yemen: meta('Yemen', '--warning', [236, 154, 60], HOSTILE, 'adversary'),
  pakistan: meta('Pakistan', '--pakistan', [190, 160, 80], NEUTRAL, 'neutral'),
  armenia: meta('Armenia', '--t2', [150, 160, 210], NEUTRAL, 'neutral'),
  azerbaijan: meta('Azerbaijan', '--t3', [180, 150, 120], NEUTRAL, 'neutral'),
  venezuela: meta('Venezuela', '--venezuela', [220, 150, 60], NEUTRAL, 'neutral'),
  sudan: meta('Sudan', '--sudan', [210, 120, 80], NEUTRAL, 'neutral'),
  myanmar: meta('Myanmar', '--myanmar', [200, 130, 100], NEUTRAL, 'neutral'),
  ethiopia: meta('Ethiopia', '--ethiopia', [190, 140, 100], NEUTRAL, 'neutral'),
  sahel: meta('Sahel', '--sahel', [200, 150, 90], NEUTRAL, 'neutral'),
  taliban: meta('Taliban', '--taliban', [190, 150, 110], HOSTILE, 'adversary'),
  // Non-country zones get a neutral entry so tooltips/colors never crash.
  gulf: meta('Persian Gulf', '--t3', [180, 160, 120], NEUTRAL, 'neutral'),
  red_sea: meta('Red Sea', '--t3', [180, 160, 120], NEUTRAL, 'neutral'),
  donbas: meta('Eastern Ukraine', '--danger', [200, 80, 80], NEUTRAL, 'neutral'),
  south_china_sea: meta('South China Sea', '--t2', [150, 170, 200], NEUTRAL, 'neutral'),
  taiwan_strait: meta('Taiwan Strait', '--t2', [150, 170, 200], NEUTRAL, 'neutral'),
  unknown: meta('Unknown', '--t3', [143, 153, 168], NEUTRAL, 'neutral'),
};

// ─── Global conflict / geopolitical relationship lines ─────
// Always-on, standing world-brief: arcs drawn between national anchors.

const R = (id: string, sourceCountry: string, targetCountry: string, sourcePosition: [number, number], targetPosition: [number, number], intensity: number, type: ConflictRelationship['type'], description: string, source: string, target: string): ConflictRelationship => ({
  id,
  sourceCountry,
  targetCountry,
  sourcePosition,
  targetPosition,
  intensity,
  type,
  description,
  timestamp: NEVER,
  articles: [`[seeded] ${description}`],
});

const conflictRelationships: ConflictRelationship[] = [
  R('r-ua-ru', 'Ukraine', 'Russia', P.ukraine, P.russia, 9, 'MILITARY_CONFLICT', 'Full-scale invasion and active combat along the eastern front.', 'ukraine', 'russia'),
  R('r-il-ir', 'Israel', 'Iran', P.israel, P.iran, 8, 'WAR_ALERT', 'Open-war footing: missile exchanges and escalating mutual strikes.', 'israel', 'iran'),
  R('r-il-gz', 'Israel', 'Gaza', P.israel, P.gaza, 7, 'MILITARY_CONFLICT', 'Active ground and air operations in the Gaza Strip.', 'israel', 'gaza'),
  R('r-il-lb', 'Israel', 'Lebanon', P.israel, P.lebanon, 6, 'MILITARY_DEPLOYMENT', 'Hezbollah-Israel front with cross-border fire.', 'israel', 'lebanon'),
  R('r-us-ir', 'United States', 'Iran', P.us, P.iran, 7, 'DIPLOMATIC_TENSION', 'Sanctions, naval standoffs and proxy confrontation.', 'us', 'iran'),
  R('r-us-ru', 'United States', 'Russia', P.us, P.russia, 7, 'DIPLOMATIC_TENSION', 'Strategic rivalry over Ukraine, arms control and cyber.', 'us', 'russia'),
  R('r-us-cn', 'United States', 'China', P.us, P.china, 6, 'MILITARY_DEPLOYMENT', 'Indo-Pacific force posture and freedom-of-navigation operations.', 'us', 'china'),
  R('r-cn-tw', 'China', 'Taiwan', P.china, P.taiwan, 7, 'MILITARY_DEPLOYMENT', 'Air/sea incursions in the Taiwan Strait.', 'china', 'taiwan'),
  R('r-cn-ph', 'China', 'Philippines', P.china, P.philippines, 5, 'MILITARY_DEPLOYMENT', 'South China Sea standoffs around contested shoals, including Scarborough.', 'china', 'philippines'),
  R('r-kp-kr', 'North Korea', 'South Korea', P.north_korea, P.south_korea, 8, 'DIPLOMATIC_TENSION', 'Near-perpetual ballistic tests and hostile rhetoric across the DMZ.', 'north_korea', 'south_korea'),
  R('r-in-pk', 'India', 'Pakistan', P.india, P.pakistan, 6, 'MILITARY_CONFLICT', 'Line-of-control clashes in Kashmir amid nuclear standoff.', 'india', 'pakistan'),
  R('r-sa-ye', 'Saudi Arabia', 'Yemen', P.saudi_arabia, P.yemen, 5, 'MILITARY_CONFLICT', 'Coalition campaign against Houthi forces.', 'saudi_arabia', 'yemen'),
  R('r-am-az', 'Armenia', 'Azerbaijan', P.armenia, P.azerbaijan, 5, 'BORDER_CLOSURE', 'Closed border and blockade of the Lachin corridor after the Karabakh war.', 'armenia', 'azerbaijan'),
  R('r-tr-sy', 'Turkey', 'Syria', P.turkey, P.syria, 5, 'BORDER_CLOSURE', 'Closure of frontier segments; cross-border operations against Kurdish forces.', 'turkey', 'syria'),
  R('r-us-ve', 'United States', 'Venezuela', P.us, P.venezuela, 5, 'DIPLOMATIC_TENSION', 'Sanctions and disputed electoral legitimacy.', 'us', 'venezuela'),
  R('r-eu-ru', 'European Union', 'Russia', P.eu, P.russia, 6, 'ENERGY_DEPENDENCY', 'Energy decoupling amid sanctions on Russian gas and oil.', 'eu', 'russia'),
  R('r-ru-cn', 'Russia', 'China', P.russia, P.china, 7, 'ALLIANCE', 'Deepening "no limits" partnership across energy, trade and defence.', 'russia', 'china'),
  R('r-nato-ru', 'NATO', 'Russia', P.nato, P.russia, 7, 'MILITARY_DEPLOYMENT', 'Reinforced eastern-flank posture along the alliance border.', 'nato', 'russia'),
  R('r-uk-pl', 'Ukraine', 'Poland', P.ukraine, P.eu, 4, 'LOGISTICS_PLAN', 'Black Sea grain corridor and overland border transit.', 'ukraine', 'eu'),
  R('r-il-sa', 'Israel', 'Saudi Arabia', P.israel, P.saudi_arabia, 4, 'DIPLOMATIC_AGREEMENT', 'Normalisation negotiations under US brokering.', 'israel', 'saudi_arabia'),
  R('r-pk-af', 'Pakistan', 'Afghanistan', P.pakistan, P.taliban, 5, 'MIGRATION_FLOW', 'Cross-border displacement and militant spillover.', 'pakistan', 'taliban'),
];

// ─── Threat zones (active conflict / hazard areas) ────────
// Small polygons centred on real crisis hotspots.

const z = (id: string, actor: string, name: string, center: [number, number], dx: number, dy: number, color: [number, number, number, number]): ThreatZone => ({
  id,
  actor,
  priority: 'P2',
  category: 'ZONE',
  type: 'THREAT_CORRIDOR' as ThreatZone['type'],
  timestamp: NEVER,
  name,
  coordinates: [
    [center[0] - dx, center[1] - dy],
    [center[0] + dx, center[1] - dy],
    [center[0] + dx, center[1] + dy],
    [center[0] - dx, center[1] + dy],
  ],
  color,
});

const threatZones: ThreatZone[] = [
  z('tz-gaza', 'gaza', 'Gaza Strip', P.gaza, 0.6, 0.4, [220, 80, 80, 0.22]),
  z('tz-west-bank', 'israel', 'West Bank', P.west_bank, 0.7, 0.6, [220, 90, 90, 0.15]),
  z('tz-lebanon', 'lebanon', 'Israel–Lebanon border', [35.5, 33.1], 0.8, 0.5, [200, 60, 60, 0.2]),
  z('tz-donbas', 'donbas', 'Eastern Ukraine front', P.donbas, 2.0, 1.5, [200, 80, 80, 0.2]),
  z('tz-kherson', 'ukraine', 'Southern Ukraine / Black Sea', [33.5, 46.8], 2.0, 1.2, [200, 90, 80, 0.16]),
  z('tz-taiwan', 'taiwan_strait', 'Taiwan Strait', P.taiwan_strait, 2.5, 2.0, [220, 120, 90, 0.18]),
  z('tz-south-china', 'south_china_sea', 'South China Sea / Scarborough', P.south_china_sea, 5.0, 4.0, [220, 130, 90, 0.14]),
  z('tz-kashmir', 'india', 'Kashmir LOC', P.kashmir, 1.0, 1.0, [210, 130, 90, 0.16]),
  z('tz-dmz', 'south_korea', 'Korean DMZ', [126.6, 38.0], 0.9, 0.5, [210, 90, 90, 0.16]),
  z('tz-red-sea', 'red_sea', 'Red Sea / Bab el-Mandeb', P.red_sea, 3.0, 3.0, [236, 154, 60, 0.18]),
  z('tz-gulf', 'gulf', 'Persian Gulf / Hormuz', P.gulf, 4.0, 2.5, [231, 120, 110, 0.16]),
  z('tz-golan', 'syria', 'Golan Heights', [35.9, 33.0], 0.6, 0.5, [200, 80, 80, 0.18]),
  z('tz-sudan', 'sudan', 'Sudan civil war', P.sudan, 1.5, 1.5, [210, 120, 80, 0.18]),
  z('tz-ethiopia', 'ethiopia', 'Ethiopia / Tigray instability', P.ethiopia, 1.5, 1.5, [200, 140, 100, 0.18]),
  z('tz-sahel', 'sahel', 'Sahel / Lake Chad basin', P.west_africa_sahel, 3.0, 2.0, [200, 150, 90, 0.16]),
  z('tz-myanmar', 'myanmar', 'Myanmar civil war', P.myanmar, 1.5, 1.5, [210, 130, 100, 0.18]),
  z('tz-karabakh', 'azerbaijan', 'Nagorno-Karabakh corridor', [46.5, 39.8], 0.7, 0.6, [200, 140, 120, 0.16]),
  z('tz-yemen', 'yemen', 'Yemeni civil war', P.yemen, 1.5, 1.5, [236, 154, 60, 0.18]),
];

// ─── Strategic military assets ─────────────────────────────

const a = (id: string, actor: string, type: Asset['type'], name: string, position: [number, number], description: string): Asset => ({
  id,
  actor,
  priority: 'P2',
  category: 'INSTALLATION',
  type,
  status: 'ACTIVE',
  timestamp: NEVER,
  name,
  position,
  description,
});

const assets: Asset[] = [
  // Aircraft carriers
  a('as-carrier-5th', 'us', 'CARRIER', 'US Carrier Strike Group 5th Fleet', [56.0, 26.0], 'USS carrier operating in the Persian Gulf alongside coalition forces.'),
  a('as-carrier-6th', 'us', 'CARRIER', 'US Carrier Strike Group 6th Fleet', [33.0, 34.0], 'US carrier deployed in the eastern Mediterranean near the Levant.'),
  a('as-carrier-liaoning', 'china', 'CARRIER', 'PLA carrier group', [112.0, 19.0], 'Chinese carrier operating in the South China Sea.'),
  a('as-carrier-uk', 'us', 'CARRIER', 'UK CSG', [-4.0, 50.5], 'UK carrier strike group home/forward deployment for power projection.'),
  // Major international air & naval bases
  a('as-al-udeid', 'us', 'AIR_BASE', 'Al Udeid Air Base', [51.31, 25.12], 'US CENTCOM air hub, Qatar.'),
  a('as-al-dhafra', 'us', 'AIR_BASE', 'Al Dhafra Air Base', [54.5, 24.7], 'US air base in the UAE.'),
  a('as-diego-garcia', 'us', 'NAVAL_BASE', 'Diego Garcia', [72.4, -7.3], 'UK/US strategic naval-aviation base in the Indian Ocean.'),
  a('as-andersen', 'us', 'AIR_BASE', 'Andersen AFB', [144.8, 13.5], 'US B-52 strategic bomber hub, Guam.'),
  a('as-yokosuka', 'us', 'NAVAL_BASE', 'Yokosuka Naval Base', [139.67, 35.28], 'US 7th Fleet homeport, Japan.'),
  a('as-incirlik', 'us', 'AIR_BASE', 'Incirlik Air Base', [35.43, 37.0], 'US/NATO air base in southern Turkey.'),
  a('as-ramstein', 'us', 'AIR_BASE', 'Ramstein AB', [7.6, 49.44], 'US European Command air hub, Germany.'),
  a('as-tartus', 'russia', 'NAVAL_BASE', 'Tartus Naval Facility', [35.9, 34.9], 'Russian naval support facility on the Syrian coast.'),
  a('as-hmeimim', 'russia', 'AIR_BASE', 'Hmeimim Air Base', [35.9, 35.4], 'Russian air base at Latakia, Syria.'),
  a('as-kaliningrad', 'russia', 'NAVAL_BASE', 'Kaliningrad Baltic Fleet', [20.5, 54.7], 'Russian Baltic Fleet HQ and nuclear-weapon depot.'),
  a('as-sevastopol', 'russia', 'NAVAL_BASE', 'Sevastopol Naval Base', [33.52, 44.62], 'Russian Black Sea Fleet homeport, Crimea.'),
  a('as-baranovichi', 'russia', 'AIR_BASE', 'Baranavichy Air Base', [26.05, 53.13], 'Russian early-warning (A-50) forward base in Belarus.'),
  a('as-fiery-cross', 'china', 'NAVAL_BASE', 'Fiery Cross Reef', [112.7, 9.5], 'Chinese militarised artificial island in the Spratlys.'),
  a('as-zhanjiang', 'china', 'NAVAL_BASE', 'Zhanjiang Naval Base', [110.4, 21.15], 'PLA South Sea Fleet homeport.'),
  a('as-pak-af', 'taliban', 'ARMY_BASE', 'Kandahar operations hub', [65.7, 31.6], 'Major armed-group logistics hub in southern Afghanistan.'),
];

// ─── Maritime chokepoints & commercial lanes ──────────────
// Expanded beyond the route defaults; drawn as deck.gl line layers.

const maritimeLanes: MaritimeLane[] = [
  { id: 'lane-suez', name: 'Suez Canal', kind: 'CHOKEPOINT', path: [[32.3, 30.0], [32.5, 31.0], [32.3, 32.0]] },
  { id: 'lane-bab', name: 'Bab el-Mandeb', kind: 'CHOKEPOINT', path: [[43.4, 12.6], [43.5, 12.5], [43.6, 12.4]] },
  { id: 'lane-hormuz', name: 'Strait of Hormuz', kind: 'CHOKEPOINT', path: [[56.3, 26.5], [56.4, 26.6], [56.5, 26.7]] },
  { id: 'lane-malacca', name: 'Malacca Strait', kind: 'CHOKEPOINT', path: [[100.0, 1.0], [100.5, 2.0], [101.0, 3.0]] },
  { id: 'lane-bosphorus', name: 'Bosphorus', kind: 'CHOKEPOINT', path: [[28.9, 41.0], [29.0, 41.1], [29.1, 41.3]] },
  { id: 'lane-gibraltar', name: 'Strait of Gibraltar', kind: 'CHOKEPOINT', path: [[-5.4, 36.0], [-5.3, 35.9], [-5.1, 35.9]] },
  { id: 'lane-taiwan', name: 'Taiwan Strait', kind: 'CHOKEPOINT', path: [[118.5, 24.5], [119.5, 24.5], [120.5, 24.5]] },
  { id: 'lane-bcl', name: 'Bengkulu–Colombo tanker route', kind: 'TANKER', path: [[80.0, 6.0], [80.0, 8.0], [80.2, 10.0]] },
  { id: 'lane-hormuz-tanker', name: 'Hormuz Tanker Route', kind: 'TANKER', path: [[56.0, 26.0], [56.5, 26.5], [57.0, 27.0]] },
  { id: 'lane-med', name: 'Mediterranean Corridor', kind: 'CONTAINER', path: [[-5.0, 36.0], [0.0, 37.0], [10.0, 38.0], [20.0, 37.0], [30.0, 36.0]] },
  { id: 'lane-red-sea', name: 'Red Sea Lane', kind: 'TANKER', path: [[32.0, 30.0], [33.0, 28.0], [34.0, 26.0], [42.0, 15.0]] },
  { id: 'lane-gulf', name: 'Persian Gulf Route', kind: 'TANKER', path: [[48.0, 26.0], [52.0, 26.5], [56.0, 26.5], [56.5, 27.0]] },
  { id: 'lane-cape', name: 'Cape of Good Hope reroute', kind: 'CONTAINER', path: [[20.0, -30.0], [18.5, -33.0], [18.0, -34.5]] },
  { id: 'lane-panama', name: 'Panama Canal', kind: 'CHOKEPOINT', path: [[-79.5, 9.0], [-79.9, 8.9], [-80.0, 9.1]] },
];

// ─── Illustrative kinetic traces (last-known dynamics) ────
// Seed arcs/missiles so the world monitor animates alive immediately; live
// news adds/refreshes more on top.

const strikeArcs: StrikeArc[] = [
  { id: 'sa-ru-ua', actor: 'russia', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE', status: 'COMPLETE', timestamp: NEVER, from: P.russia, to: P.donbas, label: 'Russian strike package over eastern front', severity: 'CRITICAL' },
  { id: 'sa-il-gz', actor: 'israel', priority: 'P1', category: 'KINETIC', type: 'AIRSTRIKE', status: 'COMPLETE', timestamp: NEVER, from: P.israel, to: P.gaza, label: 'IAF airstrike in northern Gaza', severity: 'CRITICAL' },
  { id: 'sa-il-lb', actor: 'israel', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE', status: 'COMPLETE', timestamp: NEVER, from: P.israel, to: P.lebanon, label: 'Cross-border strikes in southern Lebanon', severity: 'HIGH' },
  { id: 'sa-us-ye', actor: 'us', priority: 'P2', category: 'KINETIC', type: 'NAVAL_STRIKE', status: 'COMPLETE', timestamp: NEVER, from: P.red_sea, to: P.yemen, label: 'Coalition interceptions off Hodeidah', severity: 'HIGH' },
  { id: 'sa-sa-ye', actor: 'saudi_arabia', priority: 'P2', category: 'KINETIC', type: 'AIRSTRIKE', status: 'COMPLETE', timestamp: NEVER, from: P.saudi_arabia, to: P.yemen, label: 'Coalition air operation over Yemen', severity: 'HIGH' },
];

const missileTracks: MissileTrack[] = [
  { id: 'ms-ir-il', actor: 'iran', priority: 'P1', category: 'KINETIC', type: 'BALLISTIC', status: 'INTERCEPTED', timestamp: NEVER, from: P.iran, to: P.israel, label: 'Ballistic barrage intercepted by air defence', severity: 'CRITICAL' },
  { id: 'ms-nk-sea', actor: 'north_korea', priority: 'P2', category: 'KINETIC', type: 'BALLISTIC', status: 'IMPACTED', timestamp: NEVER, from: P.north_korea, to: [130.0, 38.0], label: 'MRBM splash-down in the Sea of Japan', severity: 'HIGH' },
  { id: 'ms-ye-sea', actor: 'yemen', priority: 'P2', category: 'KINETIC', type: 'CRUISE', status: 'INTERCEPTED', timestamp: NEVER, from: P.yemen, to: P.red_sea, label: 'Anti-ship missile intercepted in the Red Sea', severity: 'CRITICAL' },
  { id: 'ms-ru-ua', actor: 'russia', priority: 'P2', category: 'KINETIC', type: 'DRONE', status: 'IMPACTED', timestamp: NEVER, from: P.russia, to: P.ukraine, label: 'Shahid drone wave over Ukraine', severity: 'HIGH' },
];

// ─── Illustrative incident targets ────────────────────────

const targets: Target[] = [
  { id: 'tg-port-odessa', actor: 'ukraine', priority: 'P1', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK', timestamp: NEVER, name: 'Odesa grain terminal', position: [30.73, 46.48], description: 'Port infrastructure hit in Black Sea drone/missile strikes.' },
  { id: 'tg-port-hodeidah', actor: 'yemen', priority: 'P2', category: 'INSTALLATION', type: 'NAVAL_BASE', status: 'DAMAGED', timestamp: NEVER, name: 'Hodeidah naval/port zone', position: [42.96, 14.8], description: 'Coalition strikes on Houthi-controlled port facilities.' },
  { id: 'tg-refinery-razorvant', actor: 'russia', priority: 'P1', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'STRUCK', timestamp: NEVER, name: 'Russian refineries', position: [39.0, 56.0], description: 'Drone strikes on energy infrastructure inside Russia.' },
  { id: 'tg-nuclear-bushehr', actor: 'iran', priority: 'P1', category: 'INSTALLATION', type: 'NUCLEAR_SITE', status: 'DEGRADED', timestamp: NEVER, name: 'Bushehr nuclear vicinity', position: [51.3, 35.7], description: 'Heightened scrutiny around Iranian nuclear sites.' },
  { id: 'tg-dam-sab', actor: 'ukraine', priority: 'P2', category: 'INSTALLATION', type: 'INFRASTRUCTURE', status: 'DAMAGED', timestamp: NEVER, name: 'Dnipro hydro-electric dam', position: [30.5, 50.45], description: 'Critical civil infrastructure in the war zone.' },
];

// ─── Cyber threats (attribution-based clusters) ───────────

const cyberThreats: CyberThreat[] = [
  { id: 'cy-apt28', type: 'INTRUSION', severity: 'HIGH', target: 'APT28 (Fancy Bear)', targetSector: 'Government / Defence', targetCountry: 'NATO members', source: 'Russia-linked', location: 'Moscow', position: P.russia, timestamp: NEVER, description: 'State-backed espionage network targeting European governments and defence bodies.', tags: ['espionage', 'spearphishing'] },
  { id: 'cy-apt41', type: 'MALWARE', severity: 'HIGH', target: 'APT41 (Double Dragon)', targetSector: 'Technology / Telecom', targetCountry: 'Taiwan, SE Asia', source: 'China-linked', location: 'Beijing', position: P.china, timestamp: NEVER, description: 'Dual espionage + cybercrime syndicate concentrated on SE Asian supply chains.', tags: ['espionage', 'supply-chain'] },
  { id: 'cy-apt33', type: 'RANSOMWARE', severity: 'HIGH', target: 'APT33 (Elfin)', targetSector: 'Energy', targetCountry: 'Saudi Arabia, Gulf', source: 'Iran-linked', location: 'Tehran', position: P.iran, timestamp: NEVER, description: 'Destructive wipers targeting energy and industrial control systems.', tags: ['wiper', 'ics'] },
  { id: 'cy-lazarus', type: 'INTRUSION', severity: 'HIGH', target: 'Lazarus Group', targetSector: 'Finance / Crypto', targetCountry: 'Global', source: 'DPRK-linked', location: 'Pyongyang', position: P.north_korea, timestamp: NEVER, description: 'Cryptocurrency exchanges and financial institutions targeted for theft.', tags: ['theft', 'crypto'] },
];

// ─── Heat (intensity density) for the heatmap layer ───────

const heatPoints: HeatPoint[] = [
  { id: 'hp-donbas', actor: 'ukraine', priority: 'P1', position: P.donbas, weight: 9, source: 'baseline' },
  { id: 'hp-odesa', actor: 'ukraine', priority: 'P1', position: [30.73, 46.48], weight: 6, source: 'baseline' },
  { id: 'hp-gaza', actor: 'gaza', priority: 'P1', position: P.gaza, weight: 8, source: 'baseline' },
  { id: 'hp-lebanon', actor: 'lebanon', priority: 'P2', position: [35.5, 33.1], weight: 5, source: 'baseline' },
  { id: 'hp-iran-il', actor: 'iran', priority: 'P1', position: P.iran, weight: 6, source: 'baseline' },
  { id: 'hp-red-sea', actor: 'red_sea', priority: 'P2', position: P.red_sea, weight: 6, source: 'baseline' },
  { id: 'hp-gulf', actor: 'gulf', priority: 'P2', position: P.gulf, weight: 5, source: 'baseline' },
  { id: 'hp-taiwan', actor: 'taiwan_strait', priority: 'P2', position: P.taiwan_strait, weight: 6, source: 'baseline' },
  { id: 'hp-south-china', actor: 'south_china_sea', priority: 'P2', position: P.south_china_sea, weight: 5, source: 'baseline' },
  { id: 'hp-kashmir', actor: 'india', priority: 'P2', position: P.kashmir, weight: 4, source: 'baseline' },
  { id: 'hp-dmz', actor: 'south_korea', priority: 'P2', position: [126.6, 38.0], weight: 4, source: 'baseline' },
  { id: 'hp-sudan', actor: 'sudan', priority: 'P2', position: P.sudan, weight: 6, source: 'baseline' },
  { id: 'hp-sahel', actor: 'sahel', priority: 'P2', position: P.west_africa_sahel, weight: 5, source: 'baseline' },
  { id: 'hp-myanmar', actor: 'myanmar', priority: 'P2', position: P.myanmar, weight: 5, source: 'baseline' },
  { id: 'hp-yemen', actor: 'yemen', priority: 'P2', position: P.yemen, weight: 5, source: 'baseline' },
];

export const WORLD_BASELINE: WorldBaseline = {
  actorMeta,
  conflictRelationships,
  threatZones,
  assets,
  maritimeLanes,
  strikeArcs,
  missileTracks,
  targets,
  cyberThreats,
  heatPoints,
};