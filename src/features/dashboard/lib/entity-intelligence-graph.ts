/**
 * Multi-Domain Entity Intelligence Graph Engine
 * Powers Palantir/Maltego-grade Link Analysis for OSINT and Cognitive Warfare.
 */

export type EntityDomain =
  | 'ACTOR'
  | 'PROXY'
  | 'C2_INFRA'
  | 'TARGET'
  | 'DISINFO'
  | 'FINANCE'
  | 'GEO'
  | 'EVENT';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NEUTRAL';

export type EntityRelationType =
  | 'COMMANDS'
  | 'OPERATES_C2'
  | 'TARGETS_ASSET'
  | 'PROPAGATES'
  | 'FINANCES'
  | 'LOCATED_IN'
  | 'SPOOFS'
  | 'COORDINATES_WITH'
  | 'CO_OCCURRENCE'
  | 'EXFILTRATES';

export type IntelligenceEntity = {
  id: string;
  name: string;
  domain: EntityDomain;
  riskLevel: RiskLevel;
  country?: string;
  countryFlag?: string;
  coordinates?: [number, number]; // [lon, lat]
  locationName?: string;
  aliases?: string[];
  attributionConfidence?: number; // 0 - 100
  mitreTactics?: string[];
  disarmTactics?: string[];
  technicalIndicators?: {
    ips?: string[];
    asns?: string[];
    domains?: string[];
    telegramChannels?: string[];
    cryptoWallets?: string[];
  };
  summary: string;
  firstSeen?: string;
  lastSeen?: string;
  activeCampaigns?: string[];
  degree?: number; // Calculated dynamic metric
};

export type IntelligenceEdge = {
  id: string;
  source: string;
  target: string;
  relation: EntityRelationType;
  label?: string;
  weight: number; // 1 - 10
  confidence: number; // 0 - 100
  firstObserved?: string;
  lastObserved?: string;
  evidenceNotes?: string;
};

export const DOMAIN_CONFIG: Record<
  EntityDomain,
  { label: string; color: string; glow: string; icon: string; symbol: string }
> = {
  ACTOR: {
    label: 'State APT / Threat Actor',
    color: '#ef4444', // Red
    glow: 'rgba(239, 68, 68, 0.6)',
    icon: '👤',
    symbol: 'circle',
  },
  PROXY: {
    label: 'Proxy / Botnet Outpost',
    color: '#f97316', // Orange
    glow: 'rgba(249, 115, 22, 0.6)',
    icon: '🛡️',
    symbol: 'triangle',
  },
  C2_INFRA: {
    label: 'C2 / Cyber Infrastructure',
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.6)',
    icon: '💻',
    symbol: 'rect',
  },
  TARGET: {
    label: 'Targeted Critical Asset',
    color: '#06b6d4', // Cyan
    glow: 'rgba(6, 182, 212, 0.6)',
    icon: '🏢',
    symbol: 'roundRect',
  },
  DISINFO: {
    label: 'Disinformation Campaign',
    color: '#ec4899', // Pink
    glow: 'rgba(236, 72, 153, 0.6)',
    icon: '🌐',
    symbol: 'diamond',
  },
  FINANCE: {
    label: 'Crypto / Funding Vector',
    color: '#eab308', // Amber / Gold
    glow: 'rgba(234, 179, 8, 0.6)',
    icon: '💰',
    symbol: 'pin',
  },
  GEO: {
    label: 'Geographic Chokepoint',
    color: '#10b981', // Emerald Green
    glow: 'rgba(16, 185, 129, 0.6)',
    icon: '📍',
    symbol: 'diamond',
  },
  EVENT: {
    label: 'Live Telemetry Event',
    color: '#3b82f6', // Blue
    glow: 'rgba(59, 130, 246, 0.6)',
    icon: '⚡',
    symbol: 'circle',
  },
};

export const BASE_INTELLIGENCE_ENTITIES: IntelligenceEntity[] = [
  // ── THREAT ACTORS ──
  {
    id: 'actor-sandworm',
    name: 'Sandworm / APT28 (GRU Unit 26165)',
    domain: 'ACTOR',
    riskLevel: 'CRITICAL',
    country: 'Russia',
    countryFlag: '🇷🇺',
    coordinates: [37.6173, 55.7558], // Moscow
    locationName: 'Moscow GRU HQ',
    aliases: ['Voodoo Bear', 'TeleBots', 'BlackEnergy Cluster'],
    attributionConfidence: 96,
    mitreTactics: ['T1190 Exploit Public App', 'T1071 C2 Protocol', 'T1499 Endpoint Denial'],
    disarmTactics: ['T0015 High-Volume Botnet Flooding', 'T0043 Forged Orders'],
    technicalIndicators: {
      ips: ['194.165.16.21', '91.240.118.172'],
      asns: ['AS48210 (GlobalNet Proxy)'],
      domains: ['pravda-eu-dispatch.org', 'defense-corridor-leak.net'],
    },
    summary:
      'Russian military intelligence offensive cyber & cognitive unit targeting energy grids, maritime hubs, and diplomatic communication networks.',
    firstSeen: '2014-03-12',
    lastSeen: 'Live Now',
    activeCampaigns: ['cib-ru-ua-01', 'pravda-stream-eu'],
  },
  {
    id: 'actor-storm-1376',
    name: 'Storm-1376 / Cyber Avengence',
    domain: 'ACTOR',
    riskLevel: 'CRITICAL',
    country: 'Iran',
    countryFlag: '🇮🇷',
    coordinates: [51.389, 35.6892], // Tehran
    locationName: 'Tehran Electronic Warfare Complex',
    aliases: ['IRGC Electronic Warfare Directorate', 'Cotton Sandstorm'],
    attributionConfidence: 94,
    mitreTactics: ['T1566 Phishing', 'T1059 Command Scripting', 'T1485 Data Destruction'],
    disarmTactics: ['T0031 Critical Alert Hijack', 'T0012 Sockpuppet Personas', 'T0044 SMS Blast Spoofing'],
    technicalIndicators: {
      ips: ['185.162.235.49', '5.188.87.12'],
      telegramChannels: ['@CyberAvengenceIR', '@MiddleEastFrontBrief'],
    },
    summary:
      'IRGC-affiliated threat group specializing in critical infrastructure cyber harassment and synchronized psychological alert spoofing.',
    firstSeen: '2020-08-15',
    lastSeen: 'Live Now',
    activeCampaigns: ['cib-ir-il-01'],
  },
  {
    id: 'actor-tindouf-cluster',
    name: 'Tindouf Cyber Array / Maghreb Cell',
    domain: 'ACTOR',
    riskLevel: 'HIGH',
    country: 'Algeria',
    countryFlag: '🇩🇿',
    coordinates: [3.0588, 36.7538], // Algiers/Tindouf
    locationName: 'Algiers-Tindouf Telegram Relay',
    aliases: ['Western Sahara Automated Swarms', 'Sahraoui Cyber Front'],
    attributionConfidence: 92,
    mitreTactics: ['T1584 Compromise Botnet', 'T1585 Sockpuppet Creation'],
    disarmTactics: ['T0023 AI Deepfake Generation', 'T0029 Telegram Swarms', 'T0041 SMS Spoofing'],
    technicalIndicators: {
      telegramChannels: ['@MaghrebWarTracker', '@SaharaConflictWatch', '@TangerTruthDesk'],
      domains: ['sahara-frontline-news.info', 'maghreb-tribune-direct.com'],
    },
    summary:
      'Coordinated inauthentic influence network deploying synthetic protest videos, deepfakes, and automated social harassment targeting Moroccan sovereignty and economic hubs.',
    firstSeen: '2021-02-10',
    lastSeen: 'Live Now',
    activeCampaigns: ['cib-dz-ma-01'],
  },
  {
    id: 'actor-dragonbridge',
    name: 'Spamouflage / PLA Unit 61398',
    domain: 'ACTOR',
    riskLevel: 'HIGH',
    country: 'China',
    countryFlag: '🇨🇳',
    coordinates: [116.4074, 39.9042], // Beijing
    locationName: 'Beijing Strategic Support Force',
    aliases: ['Dragonbridge', 'Volt Typhoon Proxy Cluster'],
    attributionConfidence: 98,
    mitreTactics: ['T1190 Web Vulnerability Exploit', 'T1557 Adversary-in-the-Middle'],
    disarmTactics: ['T0043 Multilingual LLM Agents', 'T0029 High-Frequency Flooding'],
    technicalIndicators: {
      domains: ['taiwan-strait-radar.cc', 'asia-semiconductor-leak.org'],
    },
    summary:
      'Strategic cognitive warfare unit deploying large-scale multilingual generative AI personas and social botnets to polarize maritime transit lanes and chip supply chains.',
    firstSeen: '2019-09-01',
    lastSeen: 'Live Now',
    activeCampaigns: ['cib-cn-tw-01'],
  },

  // ── PROXY & BOTNET OUTPOSTS ──
  {
    id: 'proxy-telegram-swarm-01',
    name: 'Maghreb Echo Telegram Bot Swarm',
    domain: 'PROXY',
    riskLevel: 'HIGH',
    country: 'Algeria',
    coordinates: [-8.134, 27.674], // Tindouf region
    locationName: 'Tindouf Border Relay',
    attributionConfidence: 89,
    disarmTactics: ['T0029 Telegram Swarms', 'T0012 Automated Sockpuppets'],
    technicalIndicators: {
      telegramChannels: ['@MaghrebEcho1', '@MaghrebEcho2', '@SaharaStrikeFeed'],
    },
    summary: 'Automated network of 1,400+ bot accounts broadcasting forged casualty reports and strike claims.',
  },
  {
    id: 'proxy-fastflux-c2',
    name: 'Fast-Flux C2 Proxy Array',
    domain: 'C2_INFRA',
    riskLevel: 'CRITICAL',
    country: 'Netherlands',
    coordinates: [4.9041, 52.3676], // Amsterdam bulletproof hub
    locationName: 'Bulletproof ASN Node',
    attributionConfidence: 94,
    technicalIndicators: {
      ips: ['185.220.101.5', '194.26.29.112', '45.154.255.89'],
      asns: ['AS200052 (Bulletproof Hosting)'],
      domains: ['api-sync-telemetry-cdn.net', 'ssl-auth-relay.com'],
    },
    summary: 'High-availability bulletproof fast-flux DNS network routing commands to compromised botnet relays.',
  },
  {
    id: 'proxy-sockpuppet-factory',
    name: 'LLM Sockpuppet Persona Factory',
    domain: 'PROXY',
    riskLevel: 'HIGH',
    country: 'Russia',
    coordinates: [30.3351, 59.9343], // St. Petersburg
    locationName: 'Lakhta Center Outpost',
    attributionConfidence: 93,
    disarmTactics: ['T0043 Multilingual LLM Agents', 'T0012 Inauthentic Personas'],
    summary: 'Automated API cluster using fine-tuned open-source LLMs to generate contextual Arabic and French social comments.',
  },

  // ── TARGETED CRITICAL INFRASTRUCTURE & ASSETS ──
  {
    id: 'target-tanger-med',
    name: 'Port of Tanger Med Logistics Complex',
    domain: 'TARGET',
    riskLevel: 'CRITICAL',
    country: 'Morocco',
    countryFlag: '🇲🇦',
    coordinates: [-5.895, 35.887], // Tanger Med
    locationName: 'Tanger Med Special Economic Zone',
    summary:
      'Mediterranean mega-port handling >100M tons of cargo. Strategic target of cyber probing on container TOS systems and disinfo claiming maritime blockades.',
  },
  {
    id: 'target-maroc-telecom',
    name: 'Maroc Telecom National Backbone & Datacenter',
    domain: 'TARGET',
    riskLevel: 'HIGH',
    country: 'Morocco',
    countryFlag: '🇲🇦',
    coordinates: [-6.8498, 34.0132], // Rabat Agdal
    locationName: 'Rabat Telecom Operations Center',
    summary:
      'National fiber-optic gateway and subsea cable termination landing station connecting Morocco to West Africa and Europe.',
  },
  {
    id: 'target-onee-grid',
    name: 'ONEE National Power Grid SCADA Center',
    domain: 'TARGET',
    riskLevel: 'CRITICAL',
    country: 'Morocco',
    countryFlag: '🇲🇦',
    coordinates: [-7.5898, 33.5731], // Casablanca
    locationName: 'Casablanca Electricity Dispatch',
    summary:
      'Central industrial control system (ICS/SCADA) coordinating Morocco high-voltage electrical grid and Noor Solar Complex.',
  },
  {
    id: 'target-haifa-port',
    name: 'Port of Haifa Strategic Terminal',
    domain: 'TARGET',
    riskLevel: 'HIGH',
    country: 'Israel',
    coordinates: [34.9896, 32.8191], // Haifa
    locationName: 'Haifa Port Industrial Basin',
    summary: 'Primary northern maritime import hub targeted by missile spoof alerts and GPS jamming.',
  },
  {
    id: 'target-tsmc-hsinchu',
    name: 'TSMC Advanced Fab Cluster (Hsinchu)',
    domain: 'TARGET',
    riskLevel: 'CRITICAL',
    country: 'Taiwan',
    coordinates: [120.9675, 24.8138], // Hsinchu
    locationName: 'Hsinchu Science Park',
    summary: 'Global epicenter of sub-3nm semiconductor production targeted by state-sponsored cyber espionage and disinfo sabotage rumors.',
  },

  // ── DISINFORMATION CAMPAIGNS ──
  {
    id: 'disinfo-maghreb-polarization',
    name: 'Operation Sahara Echo (Maghreb Polarization)',
    domain: 'DISINFO',
    riskLevel: 'CRITICAL',
    country: 'Morocco / Algeria',
    attributionConfidence: 91,
    disarmTactics: ['T0023 AI Deepfake Generation', 'T0029 Telegram Swarms', 'T0041 SMS Spoofing'],
    summary:
      'Coordinated cognitive campaign fabricating military engagements, falsifying export embargoes, and inciting student protests across Moroccan university forums.',
  },
  {
    id: 'disinfo-storm-alert-hijack',
    name: 'Operation False Siren (Civil Defense Alert Spoof)',
    domain: 'DISINFO',
    riskLevel: 'HIGH',
    attributionConfidence: 94,
    disarmTactics: ['T0031 Critical Alert Hijack', 'T0044 SMS Blast Spoofing'],
    summary:
      'Automated spoofing of home front defense alerts and push notifications intended to induce shelter panic during ballistic launches.',
  },
  {
    id: 'disinfo-semiconductor-panic',
    name: 'Operation Silicon Chokepoint (Taiwan Strait Panic)',
    domain: 'DISINFO',
    riskLevel: 'HIGH',
    attributionConfidence: 98,
    disarmTactics: ['T0038 Microelectronics Panic', 'T0043 Multilingual LLM Agents'],
    summary:
      'Global disinfo narrative asserting impending blockade of Taiwan chip exports to trigger panic buying and supply chain friction.',
  },

  // ── FINANCIAL & CRYPTO VECTORS ──
  {
    id: 'finance-monero-darkpool',
    name: 'Monero Bulletproof Darkpool Mixer',
    domain: 'FINANCE',
    riskLevel: 'CRITICAL',
    attributionConfidence: 87,
    technicalIndicators: {
      cryptoWallets: ['888tNkZrPN6JsE...MoneroPoolNode4', 'bc1q9v5...BitcoinEscrowCluster'],
    },
    summary: 'Anonymized cryptocurrency laundering vector financing bulletproof hosting, botnet rent, and zero-day exploit purchases.',
  },
  {
    id: 'finance-dubai-shell-corp',
    name: 'Al-Baraka Tech Trading FZE (Front Company)',
    domain: 'FINANCE',
    riskLevel: 'HIGH',
    country: 'UAE',
    coordinates: [55.2708, 25.2048], // Dubai
    locationName: 'Dubai Free Zone',
    summary: 'Sanctions evasion corporate vehicle utilized to procure enterprise firewalls and dual-use telecom hardware.',
  },

  // ── GEOGRAPHIC CHOKEPOINTS ──
  {
    id: 'geo-gibraltar-strait',
    name: 'Strait of Gibraltar Strategic Chokepoint',
    domain: 'GEO',
    riskLevel: 'MEDIUM',
    coordinates: [-5.6, 35.95],
    locationName: 'Gibraltar Maritime Gateway',
    summary: 'Critical maritime chokepoint bridging Atlantic and Mediterranean Sea; vital to Tanger Med port traffic and global maritime shipping.',
  },
  {
    id: 'geo-rabat-center',
    name: 'Rabat Sovereign Cyber & Defense Hub',
    domain: 'GEO',
    riskLevel: 'LOW',
    country: 'Morocco',
    countryFlag: '🇲🇦',
    coordinates: [-6.8498, 34.020882],
    locationName: 'Rabat Government District',
    summary: 'National command center for cybersecurity, intelligence operations, and inter-agency crisis monitoring.',
  },
  {
    id: 'geo-bab-el-mandeb',
    name: 'Bab-el-Mandeb Strait Chokepoint',
    domain: 'GEO',
    riskLevel: 'CRITICAL',
    coordinates: [43.3333, 12.5833],
    locationName: 'Red Sea Southern Gate',
    summary: 'High-risk maritime corridor subjected to anti-ship missile threats, radar spoofing, and freight insurance escalation.',
  },
];

export const BASE_INTELLIGENCE_EDGES: IntelligenceEdge[] = [
  // Sandworm / APT28 Connections
  {
    id: 'edge-sandworm-c2',
    source: 'actor-sandworm',
    target: 'proxy-fastflux-c2',
    relation: 'OPERATES_C2',
    label: 'Controls Fast-Flux C2 Node',
    weight: 9,
    confidence: 96,
    evidenceNotes: 'Signed telemetry beacons identified in GRU malware dropper configuration.',
  },
  {
    id: 'edge-sandworm-lakhta',
    source: 'actor-sandworm',
    target: 'proxy-sockpuppet-factory',
    relation: 'COORDINATES_WITH',
    label: 'Synchronizes Cyber Attack with Disinfo',
    weight: 8,
    confidence: 92,
  },
  {
    id: 'edge-sandworm-finance',
    source: 'actor-sandworm',
    target: 'finance-monero-darkpool',
    relation: 'FINANCES',
    label: 'Funds Zero-Day Purchases via Crypto',
    weight: 7,
    confidence: 88,
  },

  // Tindouf / Algeria -> Morocco Vectors
  {
    id: 'edge-tindouf-swarm',
    source: 'actor-tindouf-cluster',
    target: 'proxy-telegram-swarm-01',
    relation: 'COMMANDS',
    label: 'Commands 1,400+ Telegram Bot Swarms',
    weight: 9,
    confidence: 94,
  },
  {
    id: 'edge-swarm-disinfo',
    source: 'proxy-telegram-swarm-01',
    target: 'disinfo-maghreb-polarization',
    relation: 'PROPAGATES',
    label: 'Distributes Forged Casualty Media',
    weight: 10,
    confidence: 95,
  },
  {
    id: 'edge-disinfo-tangermed',
    source: 'disinfo-maghreb-polarization',
    target: 'target-tanger-med',
    relation: 'TARGETS_ASSET',
    label: 'Claims Tanger Med Cargo Embargo',
    weight: 9,
    confidence: 93,
    evidenceNotes: 'Fabricated port authority press release circulated across 45 Telegram channels.',
  },
  {
    id: 'edge-tindouf-onee',
    source: 'actor-tindouf-cluster',
    target: 'target-onee-grid',
    relation: 'TARGETS_ASSET',
    label: 'Reconnaissance & Port Scanning on SCADA',
    weight: 8,
    confidence: 89,
  },
  {
    id: 'edge-tindouf-rabat',
    source: 'actor-tindouf-cluster',
    target: 'target-maroc-telecom',
    relation: 'TARGETS_ASSET',
    label: 'DDoS probes against DNS root servers',
    weight: 7,
    confidence: 88,
  },
  {
    id: 'edge-tangermed-gibraltar',
    source: 'target-tanger-med',
    target: 'geo-gibraltar-strait',
    relation: 'LOCATED_IN',
    label: 'Anchored at Strait Entrance',
    weight: 10,
    confidence: 100,
  },
  {
    id: 'edge-rabat-maroc-telecom',
    source: 'target-maroc-telecom',
    target: 'geo-rabat-center',
    relation: 'LOCATED_IN',
    label: 'Protected by Rabat Cyber Command',
    weight: 9,
    confidence: 99,
  },

  // Storm-1376 / Iran Vectors
  {
    id: 'edge-storm-c2',
    source: 'actor-storm-1376',
    target: 'proxy-fastflux-c2',
    relation: 'OPERATES_C2',
    label: 'Shares Bulletproof Infrastructure',
    weight: 7,
    confidence: 86,
  },
  {
    id: 'edge-storm-disinfo',
    source: 'actor-storm-1376',
    target: 'disinfo-storm-alert-hijack',
    relation: 'PROPAGATES',
    label: 'Orchestrates Siren Alert Spoofing',
    weight: 10,
    confidence: 95,
  },
  {
    id: 'edge-disinfo-haifa',
    source: 'disinfo-storm-alert-hijack',
    target: 'target-haifa-port',
    relation: 'TARGETS_ASSET',
    label: 'Simulates Missile Impact Reports at Haifa',
    weight: 9,
    confidence: 91,
  },
  {
    id: 'edge-storm-shell',
    source: 'actor-storm-1376',
    target: 'finance-dubai-shell-corp',
    relation: 'FINANCES',
    label: 'Routes Funds through Free Zone Trading Entity',
    weight: 8,
    confidence: 90,
  },

  // Dragonbridge / China Vectors
  {
    id: 'edge-dragonbridge-disinfo',
    source: 'actor-dragonbridge',
    target: 'disinfo-semiconductor-panic',
    relation: 'PROPAGATES',
    label: 'Deploys AI Bot Swarms on Chip Shortage',
    weight: 10,
    confidence: 98,
  },
  {
    id: 'edge-disinfo-tsmc',
    source: 'disinfo-semiconductor-panic',
    target: 'target-tsmc-hsinchu',
    relation: 'TARGETS_ASSET',
    label: 'Spreads Blockade Rumors Targeting TSMC Fab',
    weight: 9,
    confidence: 96,
  },
  {
    id: 'edge-fastflux-dubai',
    source: 'finance-dubai-shell-corp',
    target: 'proxy-fastflux-c2',
    relation: 'FINANCES',
    label: 'Pays Bulletproof Hosting Server Lease',
    weight: 6,
    confidence: 84,
  },
];

/**
 * Fuse live data from Morocco Intelligence and Disinformation feeds into graph entities
 */
export function buildEnhancedIntelligenceGraph(
  liveEvents?: any[],
  liveDisinfo?: { edges?: any[]; nodes?: any[] }
): { entities: IntelligenceEntity[]; edges: IntelligenceEdge[] } {
  const entityMap = new Map<string, IntelligenceEntity>();
  const edgeMap = new Map<string, IntelligenceEdge>();

  // Add base entities
  for (const entity of BASE_INTELLIGENCE_ENTITIES) {
    entityMap.set(entity.id, { ...entity });
  }

  // Add base edges
  for (const edge of BASE_INTELLIGENCE_EDGES) {
    edgeMap.set(edge.id, { ...edge });
  }

  // 1. Ingest live Morocco Events
  if (liveEvents && liveEvents.length > 0) {
    liveEvents.slice(0, 20).forEach((event: any, idx: number) => {
      const eventEntityId = `event-${event.id || idx}`;
      const isCritical = event.severity === 'CRITICAL';
      const isHigh = event.severity === 'HIGH';

      const entity: IntelligenceEntity = {
        id: eventEntityId,
        name: event.title || `Incident #${idx + 1}`,
        domain: 'EVENT',
        riskLevel: isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MEDIUM',
        coordinates: event.position ? [event.position[0], event.position[1]] : undefined,
        locationName: event.location || 'Morocco Regional Area',
        summary: event.summary || event.title || 'Live OSINT incident detected in Morocco theater.',
        firstSeen: event.timestamp || 'Recent',
        lastSeen: 'Live Telemetry',
      };

      entityMap.set(eventEntityId, entity);

      // Link event to targeted assets or geographic nodes if applicable
      if (event.location) {
        const locLower = event.location.toLowerCase();
        let targetId: string | null = null;

        if (locLower.includes('tanger') || locLower.includes('tangier')) {
          targetId = 'target-tanger-med';
        } else if (locLower.includes('rabat') || locLower.includes('salé')) {
          targetId = 'geo-rabat-center';
        } else if (locLower.includes('casablanca')) {
          targetId = 'target-onee-grid';
        }

        if (targetId && entityMap.has(targetId)) {
          const edgeId = `edge-${eventEntityId}-${targetId}`;
          edgeMap.set(edgeId, {
            id: edgeId,
            source: eventEntityId,
            target: targetId,
            relation: 'CO_OCCURRENCE',
            label: `Occurred near ${event.location}`,
            weight: isCritical ? 8 : 5,
            confidence: 90,
          });
        }
      }
    });
  }

  // 2. Ingest live Disinformation Arc edges
  if (liveDisinfo?.edges && liveDisinfo.edges.length > 0) {
    liveDisinfo.edges.forEach((edge: any) => {
      const edgeId = `live-disinfo-edge-${edge.id || `${edge.source}-${edge.target}`}`;
      const srcId = `geo-${edge.source.toLowerCase()}`;
      const tgtId = `geo-${edge.target.toLowerCase()}`;

      // Create synthetic geo nodes if not already present
      if (!entityMap.has(srcId)) {
        entityMap.set(srcId, {
          id: srcId,
          name: `${edge.source} Origin Hub`,
          domain: 'GEO',
          riskLevel: 'HIGH',
          summary: `Origin vector for live disinformation campaign attacking ${edge.target}.`,
        });
      }

      if (!entityMap.has(tgtId)) {
        entityMap.set(tgtId, {
          id: tgtId,
          name: `${edge.target} Target Theater`,
          domain: 'GEO',
          riskLevel: 'CRITICAL',
          summary: `Primary targeted region for automated botnet narrative injection.`,
        });
      }

      edgeMap.set(edgeId, {
        id: edgeId,
        source: srcId,
        target: tgtId,
        relation: 'PROPAGATES',
        label: `Active Bot Volume: ${edge.weight || 20}k`,
        weight: Math.min(10, Math.max(2, Math.round((edge.weight || 20) / 10))),
        confidence: 92,
      });
    });
  }

  // Compute graph degrees
  const degrees = new Map<string, number>();
  for (const edge of edgeMap.values()) {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
  }

  const entities = Array.from(entityMap.values()).map((entity) => ({
    ...entity,
    degree: degrees.get(entity.id) || 1,
  }));

  const edges = Array.from(edgeMap.values());

  return { entities, edges };
}

/**
 * Shortest Path finder between two entities using Breadth-First Search (BFS)
 */
export function findShortestPath(
  sourceId: string,
  targetId: string,
  edges: IntelligenceEdge[]
): { pathNodeIds: string[]; pathEdgeIds: string[] } | null {
  if (sourceId === targetId) {
    return { pathNodeIds: [sourceId], pathEdgeIds: [] };
  }

  // Build adjacency list
  const adj = new Map<string, Array<{ neighbor: string; edgeId: string }>>();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.source)!.push({ neighbor: edge.target, edgeId: edge.id });
    adj.get(edge.target)!.push({ neighbor: edge.source, edgeId: edge.id });
  }

  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const parentMap = new Map<string, { parent: string; edgeId: string }>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === targetId) {
      // Reconstruct path
      const pathNodeIds: string[] = [];
      const pathEdgeIds: string[] = [];
      let curr = targetId;

      while (curr !== sourceId) {
        pathNodeIds.unshift(curr);
        const record = parentMap.get(curr);
        if (!record) break;
        pathEdgeIds.unshift(record.edgeId);
        curr = record.parent;
      }
      pathNodeIds.unshift(sourceId);

      return { pathNodeIds, pathEdgeIds };
    }

    const neighbors = adj.get(current) || [];
    for (const { neighbor, edgeId } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parentMap.set(neighbor, { parent: current, edgeId });
        queue.push(neighbor);
      }
    }
  }

  return null;
}

/**
 * Extract N-hop neighborhood around an entity
 */
export function extractNHopNeighborhood(
  centerId: string,
  hops: number,
  edges: IntelligenceEdge[]
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set<string>([centerId]);
  const edgeIds = new Set<string>();

  let currentFrontier = new Set<string>([centerId]);

  for (let h = 0; h < hops; h++) {
    const nextFrontier = new Set<string>();

    for (const edge of edges) {
      if (currentFrontier.has(edge.source)) {
        nodeIds.add(edge.target);
        edgeIds.add(edge.id);
        nextFrontier.add(edge.target);
      } else if (currentFrontier.has(edge.target)) {
        nodeIds.add(edge.source);
        edgeIds.add(edge.id);
        nextFrontier.add(edge.source);
      }
    }

    currentFrontier = nextFrontier;
  }

  return { nodeIds, edgeIds };
}
