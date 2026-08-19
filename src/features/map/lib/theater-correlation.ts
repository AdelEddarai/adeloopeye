import type { SelectedItem } from '@/features/map/components/types';
import type { CyberThreat, StrikeArc, MissileTrack, Target, ThreatZone, MaritimeLane } from '@/data/map-data';

export type ThreatDomain = 'KINETIC' | 'CYBER' | 'COGNITIVE' | 'MARITIME_INFRA' | 'AEROSPACE';

export type CorrelatedThreatNode = {
  id: string;
  domain: ThreatDomain;
  title: string;
  actor: string;
  coordinates: [number, number];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  summary: string;
  relevance: string;
};

export type TheaterCorrelation = {
  theaterId: string;
  theaterName: string;
  compositeScore: number; // 0-100
  hybridClassification: string; // e.g. "MULTI-VECTOR COGNITIVE & KINETIC HYBRID"
  primaryActor: string;
  targetedSectors: string[];
  nodes: CorrelatedThreatNode[];
  strategicAssessment: string;
};

export const THEATER_CORRELATIONS: Record<string, TheaterCorrelation> = {
  // ── 1. MAGHREB & WESTERN MEDITERRANEAN ──
  THEATER_MAGHREB: {
    theaterId: 'THEATER_MAGHREB',
    theaterName: 'MAGHREB & WESTERN MEDITERRANEAN THEATER',
    compositeScore: 84,
    hybridClassification: 'COGNITIVE DISINFORMATION & MARITIME GATEWAY PRESSURE',
    primaryActor: 'Tindouf Telegram Botnets & Regional State Actors',
    targetedSectors: [
      'Strait of Gibraltar & Tanger Med Port Logistics',
      'Territorial Sovereignty & Defense Morale',
      'Atlantic Trade Corridors & Subsea Telecom Cables',
    ],
    strategicAssessment:
      'Coordinated cognitive disinformation campaigns synchronized with cyber probing against Moroccan government web endpoints and continuous scrutiny of naval transit through the Gibraltar corridor.',
    nodes: [
      {
        id: 'cib-dz-ma-01',
        domain: 'COGNITIVE',
        title: 'Maghreb CIB Botnet & Deepfake Network',
        actor: 'Algeria / Tindouf Telegram Array',
        coordinates: [1.66, 28.03],
        severity: 'HIGH',
        summary: '142 Botnet IPs generating fabricated border skirmish footage and diplomatic polarization.',
        relevance: 'Information warfare targeting domestic and foreign investor sentiment.',
      },
      {
        id: 'cy-maghreb-bot',
        domain: 'CYBER',
        title: 'Tindouf Cyber Botnet Probing Array',
        actor: 'State-Linked Cyber Units',
        coordinates: [3.05, 36.75],
        severity: 'HIGH',
        summary: 'Targeted DDoS and credential harvesting against Moroccan public sector portals.',
        relevance: 'Cyber component acting in tandem with narrative injection vectors.',
      },
      {
        id: 'lane-gibraltar',
        domain: 'MARITIME_INFRA',
        title: 'Strait of Gibraltar & Tanger Med Chokepoint',
        actor: 'International / Morocco Port Authority',
        coordinates: [-5.4, 36.0],
        severity: 'CRITICAL',
        summary: 'Over 100,000 annual vessel transits; key maritime artery between Mediterranean and Atlantic.',
        relevance: 'Primary strategic trade infrastructure sensitive to regional stability claims.',
      },
      {
        id: 'as-morocco-air',
        domain: 'AEROSPACE',
        title: 'Royal Moroccan Air Force VIP & Patrol Vector',
        actor: 'Morocco Defense Force',
        coordinates: [-7.09, 31.79],
        severity: 'MEDIUM',
        summary: 'Active airspace monitoring and coastal surveillance patrols.',
        relevance: 'Defensive aerial posture maintaining situational control.',
      },
    ],
  },

  // ── 2. MIDDLE EAST & LEVANT / RED SEA ──
  THEATER_MIDDLE_EAST: {
    theaterId: 'THEATER_MIDDLE_EAST',
    theaterName: 'MIDDLE EAST, LEVANT & RED SEA THEATER',
    compositeScore: 94,
    hybridClassification: 'ACTIVE MULTI-DOMAIN KINETIC, CYBER & MARITIME CLOSURE',
    primaryActor: 'IRGC Axis / Houthi Ansar Allah',
    targetedSectors: [
      'Bab-el-Mandeb & Red Sea Commercial Shipping',
      'Strait of Hormuz Oil Tanker Transit',
      'National Civil Defense & Energy Infrastructure',
    ],
    strategicAssessment:
      'High-intensity hybrid warfare featuring anti-ship ballistic missiles in the southern Red Sea, state-sponsored cyber intrusion (Storm-1376 / Cyber Avengence), and automated cognitive siren spoofing campaigns.',
    nodes: [
      {
        id: 'ms-ye-sea',
        domain: 'KINETIC',
        title: 'Houthi Anti-Ship Cruise & Ballistic Vectors',
        actor: 'Yemen / Houthi Ansar Allah',
        coordinates: [44.20, 15.36],
        severity: 'CRITICAL',
        summary: 'Continuous long-range drone and missile launches targeting Bab-el-Mandeb merchant traffic.',
        relevance: 'Direct kinetic interdiction of global energy and container supply lines.',
      },
      {
        id: 'cy-storm1376',
        domain: 'CYBER',
        title: 'Storm-1376 / Cyber Avengence',
        actor: 'IRGC Cyber Directorate',
        coordinates: [51.38, 35.68],
        severity: 'CRITICAL',
        summary: 'Wiper malware targeting critical infrastructure, ports, and emergency siren networks.',
        relevance: 'Cyber offensive synchronized with missile and maritime drone strikes.',
      },
      {
        id: 'cib-ir-il-01',
        domain: 'COGNITIVE',
        title: 'Iranian Cognitive Influence & Panic Swarms',
        actor: 'Iran Cognitive Ops Desk',
        coordinates: [48.00, 32.00],
        severity: 'HIGH',
        summary: '210 Botnet IPs distributing fabricated civilian casualty graphics and false strike claims.',
        relevance: 'Psychological warfare designed to overwhelm civil emergency desks.',
      },
      {
        id: 'lane-bab',
        domain: 'MARITIME_INFRA',
        title: 'Bab el-Mandeb Strategic Chokepoint',
        actor: 'Red Sea Coalition / Merchant Shipping',
        coordinates: [43.4, 12.6],
        severity: 'CRITICAL',
        summary: 'Critical waterway handling 12% of global seaborne trade and 30% of global container traffic.',
        relevance: 'Primary maritime chokepoint impacted by kinetic and cognitive operations.',
      },
      {
        id: 'lane-hormuz',
        domain: 'MARITIME_INFRA',
        title: 'Strait of Hormuz Petroleum Corridor',
        actor: 'Gulf Tanker Operators',
        coordinates: [56.3, 26.5],
        severity: 'CRITICAL',
        summary: 'Vulnerability point for 21 million barrels of daily petroleum flow.',
        relevance: 'Energy infrastructure subject to boarding actions and GPS spoofing.',
      },
    ],
  },

  // ── 3. EASTERN EUROPE & BALTIC ──
  THEATER_EAST_EUROPE: {
    theaterId: 'THEATER_EAST_EUROPE',
    theaterName: 'EASTERN EUROPE & BALTIC THEATER',
    compositeScore: 92,
    hybridClassification: 'HIGH-INTENSITY KINETIC, SANDWORM CYBER & DOPPELGÄNGER CIB',
    primaryActor: 'Russian Federation (GRU / SDA)',
    targetedSectors: [
      'Critical Energy Grids & Railway Logistics',
      'European Union Defense Alliances & Public Cohesion',
      'Black Sea Commercial Grain Corridors',
    ],
    strategicAssessment:
      'Extensive hybrid warfare blending cruise missile / Shahed drone strikes across Ukraine, deepfake and cloned media operations across France and Germany (Doppelgänger), and APT28 cyber espionage targeting NATO commands.',
    nodes: [
      {
        id: 'sa-ru-ua',
        domain: 'KINETIC',
        title: 'Russian Strategic Strike Packages',
        actor: 'Russian Air Force / Black Sea Fleet',
        coordinates: [37.61, 55.75],
        severity: 'CRITICAL',
        summary: 'Integrated ballistic, cruise missile, and loitering munition waves targeting power stations.',
        relevance: 'Core kinetic driver of the regional security crisis.',
      },
      {
        id: 'cy-apt28',
        domain: 'CYBER',
        title: 'APT28 (Fancy Bear) / Sandworm Unit 26165',
        actor: 'Russian GRU',
        coordinates: [30.52, 50.45],
        severity: 'CRITICAL',
        summary: 'Targeted spearphishing and ICS malware targeting Western defense logistics.',
        relevance: 'Digital espionage complementing theater kinetic operations.',
      },
      {
        id: 'cib-ru-fr-01',
        domain: 'COGNITIVE',
        title: 'Operation Doppelgänger Cloned Media Matrix',
        actor: 'Social Design Agency (SDA)',
        coordinates: [2.21, 46.23],
        severity: 'HIGH',
        summary: '185 Botnet nodes amplifying fabricated government directives and forged news portals.',
        relevance: 'Cognitive domain vector undermining European defense cooperation.',
      },
      {
        id: 'tg-port-odessa',
        domain: 'MARITIME_INFRA',
        title: 'Black Sea Odesa Commercial Port',
        actor: 'Ukraine Grain Corridor',
        coordinates: [30.73, 46.48],
        severity: 'HIGH',
        summary: 'Key maritime agricultural export facility subject to periodic blockade and naval mining.',
        relevance: 'Global food security bottleneck.',
      },
    ],
  },

  // ── 4. INDO-PACIFIC & TAIWAN STRAIT ──
  THEATER_INDO_PACIFIC: {
    theaterId: 'THEATER_INDO_PACIFIC',
    theaterName: 'INDO-PACIFIC & TAIWAN STRAIT THEATER',
    compositeScore: 86,
    hybridClassification: 'GRAY-ZONE MARITIME BLOCKADE & SPAMOUFLAGE BOTNET INJECTION',
    primaryActor: 'PLA Strategic Support Force & APT41',
    targetedSectors: [
      'Taiwan Strait ADIZ & Semiconductor Logistics',
      'South China Sea Island Reef Fortifications',
      'Global Microelectronics Supply Chains',
    ],
    strategicAssessment:
      'Gray-zone maritime encirclement drills matched with multilingual Spamouflage narrative swarms and APT41 supply-chain hardware intrusions.',
    nodes: [
      {
        id: 'cib-cn-tw-01',
        domain: 'COGNITIVE',
        title: 'Spamouflage / Dragonbridge Narrative Swarm',
        actor: 'PLA Network Systems Dept',
        coordinates: [116.40, 39.90],
        severity: 'HIGH',
        summary: '340 Botnet IPs pushing fabricated blockade ultimatums and factory sabotage rumors.',
        relevance: 'Psychological pressure on commercial shipping and semiconductor logistics.',
      },
      {
        id: 'cy-apt41',
        domain: 'CYBER',
        title: 'APT41 (Double Dragon)',
        actor: 'China-Linked Cyber Syndicate',
        coordinates: [121.56, 25.03],
        severity: 'HIGH',
        summary: 'Intrusions targeting telecommunications and semiconductor manufacturer firmware.',
        relevance: 'Supply chain vulnerabilities in high-end tech components.',
      },
      {
        id: 'lane-taiwan',
        domain: 'MARITIME_INFRA',
        title: 'Taiwan Strait Global Container Arteries',
        actor: 'International Commercial Navies',
        coordinates: [119.5, 24.5],
        severity: 'CRITICAL',
        summary: 'Nearly 50% of global container ships transit the strait annually.',
        relevance: 'Critical chokepoint vulnerable to gray-zone naval closures.',
      },
    ],
  },
};

/**
 * Resolves the correlated theater based on any clicked or active map item.
 */
export function resolveCorrelationFromItem(item: SelectedItem | null): TheaterCorrelation | null {
  if (!item) return null;

  // Disinformation match
  if (item.type === 'disinfo') {
    const src = item.data.edge.source;
    const tgt = item.data.edge.target;
    if (src === 'DZ' || tgt === 'MA' || src === 'MA') return THEATER_CORRELATIONS.THEATER_MAGHREB;
    if (src === 'IR' || tgt === 'IL' || src === 'YE' || tgt === 'SA') return THEATER_CORRELATIONS.THEATER_MIDDLE_EAST;
    if (src === 'RU' || tgt === 'FR' || tgt === 'UA' || tgt === 'DE') return THEATER_CORRELATIONS.THEATER_EAST_EUROPE;
    if (src === 'CN' || tgt === 'TW') return THEATER_CORRELATIONS.THEATER_INDO_PACIFIC;
    return THEATER_CORRELATIONS.THEATER_MAGHREB;
  }

  // Chokepoint match
  if (item.type === 'chokepoint') {
    const name = item.data.name.toLowerCase();
    if (name.includes('gibraltar') || name.includes('tanger')) return THEATER_CORRELATIONS.THEATER_MAGHREB;
    if (name.includes('hormuz') || name.includes('mandeb') || name.includes('suez') || name.includes('red sea'))
      return THEATER_CORRELATIONS.THEATER_MIDDLE_EAST;
    if (name.includes('bosphorus') || name.includes('black sea')) return THEATER_CORRELATIONS.THEATER_EAST_EUROPE;
    if (name.includes('taiwan') || name.includes('malacca')) return THEATER_CORRELATIONS.THEATER_INDO_PACIFIC;
  }

  // Kinetic strike / missile match
  if (item.type === 'strike' || item.type === 'missile') {
    const actor = (item.data as any).actor?.toLowerCase() || '';
    if (actor.includes('israel') || actor.includes('iran') || actor.includes('yemen') || actor.includes('saudi'))
      return THEATER_CORRELATIONS.THEATER_MIDDLE_EAST;
    if (actor.includes('russia') || actor.includes('ukraine')) return THEATER_CORRELATIONS.THEATER_EAST_EUROPE;
    if (actor.includes('north_korea') || actor.includes('china')) return THEATER_CORRELATIONS.THEATER_INDO_PACIFIC;
  }

  // City / Country match
  if (item.type === 'country') {
    const c = item.data.code;
    if (c === 'MA' || c === 'DZ' || c === 'ES') return THEATER_CORRELATIONS.THEATER_MAGHREB;
    if (c === 'IL' || c === 'IR' || c === 'YE' || c === 'SA') return THEATER_CORRELATIONS.THEATER_MIDDLE_EAST;
    if (c === 'RU' || c === 'UA' || c === 'FR' || c === 'DE') return THEATER_CORRELATIONS.THEATER_EAST_EUROPE;
    if (c === 'CN' || c === 'TW') return THEATER_CORRELATIONS.THEATER_INDO_PACIFIC;
  }

  // Default fallback to Maghreb & Mediterranean
  return THEATER_CORRELATIONS.THEATER_MAGHREB;
}
