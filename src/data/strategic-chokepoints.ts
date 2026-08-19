export type ChokepointIncident = {
  id: string;
  date: string;
  timeAgo: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MED';
  type: string;
  description: string;
};

export type WeeklyVesselTrend = {
  week: string;
  totalVessels: number;
  tankers: number;
  containers: number;
  cargo: number;
  military: number;
  alertCount: number;
};

export type StrategicChokepointData = {
  id: string;
  name: string;
  region: string;
  level: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  dailyVolume: string;
  crudeFlow: string;
  riskIndex: number;
  delayAvg: string;
  spoofingRate: string;
  description: string;
  coordinates: [number, number];
  weeklyTrend: WeeklyVesselTrend[];
  incidents: ChokepointIncident[];
};

export const STRATEGIC_CHOKEPOINTS: Record<string, StrategicChokepointData> = {
  'sector-hormuz': {
    id: 'sector-hormuz',
    name: 'Strait of Hormuz',
    region: 'Persian Gulf / Arabian Sea',
    level: 'CRITICAL',
    dailyVolume: '84 Vessels / 24h',
    crudeFlow: '20.5M bpd (21% Global)',
    riskIndex: 88,
    delayAvg: '+18.4 hrs',
    spoofingRate: '41% AIS Spoofed',
    description: 'Vital global oil chokepoint connecting Persian Gulf exporters to Asian and European markets. High threat of naval boarding, fast-boat swarms, and GPS manipulation.',
    coordinates: [56.2, 26.4],
    weeklyTrend: [
      { week: 'W-3', totalVessels: 620, tankers: 310, containers: 180, cargo: 90, military: 40, alertCount: 8 },
      { week: 'W-2', totalVessels: 580, tankers: 285, containers: 175, cargo: 85, military: 35, alertCount: 14 },
      { week: 'W-1', totalVessels: 540, tankers: 260, containers: 165, cargo: 80, military: 35, alertCount: 19 },
      { week: 'CURRENT', totalVessels: 512, tankers: 242, containers: 158, cargo: 74, military: 38, alertCount: 26 },
    ],
    incidents: [
      {
        id: 'inc-h-01',
        date: '2026-08-19',
        timeAgo: '2h ago',
        title: 'IRGC Fast Attack Boat Shadowing',
        severity: 'CRITICAL',
        type: 'NAVAL HARASSMENT',
        description: 'Two IRGC fast patrol craft closed within 200m of a Greek-flagged crude carrier in the inbound traffic separation scheme.',
      },
      {
        id: 'inc-h-02',
        date: '2026-08-18',
        timeAgo: '1d ago',
        title: 'Widespread AIS GNSS Spoofing Spike',
        severity: 'HIGH',
        type: 'ELECTRONIC WARFARE',
        description: 'Multiple VLCCs reported circular drift patterns and spoofed GPS coordinates placing them inside Iranian territorial waters.',
      },
      {
        id: 'inc-h-03',
        date: '2026-08-16',
        timeAgo: '3d ago',
        title: 'U.S. Navy Destroyer Escort Corridor',
        severity: 'MED',
        type: 'COALITION DEFENSE',
        description: 'Arleigh Burke-class destroyer provided continuous maritime security escort for 4 high-value LNG tankers.',
      },
      {
        id: 'inc-h-04',
        date: '2026-08-14',
        timeAgo: '5d ago',
        title: 'Commercial Insurance War-Risk Surcharge Hike',
        severity: 'MED',
        type: 'ECONOMIC IMPACT',
        description: 'Lloyds Joint War Committee raised Persian Gulf transit premiums by +35% following drone telemetry reports.',
      },
    ],
  },
  'sector-bab-el-mandeb': {
    id: 'sector-bab-el-mandeb',
    name: 'Bab el-Mandeb Strait',
    region: 'Red Sea / Gulf of Aden',
    level: 'CRITICAL',
    dailyVolume: '42 Vessels / 24h',
    crudeFlow: '7.8M bpd',
    riskIndex: 94,
    delayAvg: '+42.0 hrs (Cape Reroute)',
    spoofingRate: '56% Dark Fleet / Spoofed',
    description: 'Chokepoint between Horn of Africa and Arabian Peninsula controlling Suez Canal access. Target of persistent anti-ship ballistic missile and maritime USV strikes.',
    coordinates: [43.3, 12.6],
    weeklyTrend: [
      { week: 'W-3', totalVessels: 380, tankers: 140, containers: 160, cargo: 60, military: 20, alertCount: 22 },
      { week: 'W-2', totalVessels: 330, tankers: 125, containers: 130, cargo: 55, military: 20, alertCount: 31 },
      { week: 'W-1', totalVessels: 305, tankers: 110, containers: 120, cargo: 55, military: 20, alertCount: 38 },
      { week: 'CURRENT', totalVessels: 294, tankers: 104, containers: 112, cargo: 54, military: 24, alertCount: 42 },
    ],
    incidents: [
      {
        id: 'inc-b-01',
        date: '2026-08-19',
        timeAgo: '4h ago',
        title: 'Anti-Ship Ballistic Missile Launch',
        severity: 'CRITICAL',
        type: 'KINETIC STRIKE',
        description: 'Missile splashed 15NM south of transit lane without contact. Operation Prosperity Guardian warships tracking launcher.',
      },
      {
        id: 'inc-b-02',
        date: '2026-08-18',
        timeAgo: '1d ago',
        title: 'Explosive USV Drone Boat Intercepted',
        severity: 'HIGH',
        type: 'NAVAL DRONE',
        description: 'Helicopter gunship neutralized uncrewed surface vessel approaching commercial bulk carrier.',
      },
      {
        id: 'inc-b-03',
        date: '2026-08-15',
        timeAgo: '4d ago',
        title: 'Container Carrier Fleet Cape of Good Hope Reroute',
        severity: 'MED',
        type: 'LOGISTICS DELAY',
        description: 'Maersk and MSC confirmed 65% of Asia-to-Europe liner services continuing around Africa (+12-14 day delay).',
      },
    ],
  },
  'sector-gibraltar': {
    id: 'sector-gibraltar',
    name: 'Strait of Gibraltar & Tanger-Med',
    region: 'Mediterranean / Atlantic',
    level: 'ELEVATED',
    dailyVolume: '280 Vessels / 24h',
    crudeFlow: '5.2M bpd',
    riskIndex: 38,
    delayAvg: '+2.1 hrs',
    spoofingRate: '8% Dark Fleet / Shadow Tankers',
    description: 'Western gate to the Mediterranean and mega-hub Tanger-Med port. Key corridor for EU energy imports, container transshipment, and NATO maritime surveillance.',
    coordinates: [-5.55, 36.0],
    weeklyTrend: [
      { week: 'W-3', totalVessels: 1850, tankers: 420, containers: 910, cargo: 480, military: 40, alertCount: 3 },
      { week: 'W-2', totalVessels: 1910, tankers: 435, containers: 940, cargo: 490, military: 45, alertCount: 4 },
      { week: 'W-1', totalVessels: 1960, tankers: 450, containers: 970, cargo: 495, military: 45, alertCount: 5 },
      { week: 'CURRENT', totalVessels: 2010, tankers: 468, containers: 1005, cargo: 490, military: 47, alertCount: 6 },
    ],
    incidents: [
      {
        id: 'inc-g-01',
        date: '2026-08-19',
        timeAgo: '6h ago',
        title: 'Tanger-Med Container Berth Record',
        severity: 'MED',
        type: 'LOGISTICS SURGE',
        description: 'Tanger-Med processed 32,400 TEU in 24h as Mediterranean hub capacity expands to meet transshipment demand.',
      },
      {
        id: 'inc-g-02',
        date: '2026-08-17',
        timeAgo: '2d ago',
        title: 'Russian Dark Fleet Shadow Tanker Monitored',
        severity: 'HIGH',
        type: 'SANCTIONS MONITORING',
        description: 'Uninsured Aframax tanker performing ship-to-ship crude transfer tracked by Royal Navy and Marine Royale.',
      },
      {
        id: 'inc-g-03',
        date: '2026-08-15',
        timeAgo: '4d ago',
        title: 'NATO Maritime Group 1 Anti-Submarine Patrol',
        severity: 'MED',
        type: 'NAVAL SURVEILLANCE',
        description: 'Frigate patrol conducted sonar sweeps across the eastern approach following sub-surface acoustic detection.',
      },
    ],
  },
  'sector-taiwan-strait': {
    id: 'sector-taiwan-strait',
    name: 'Taiwan Strait & Bashi Channel',
    region: 'East Asia / Western Pacific',
    level: 'CRITICAL',
    dailyVolume: '240 Vessels / 24h',
    crudeFlow: '14.0M bpd',
    riskIndex: 82,
    delayAvg: '+8.5 hrs',
    spoofingRate: '22% Military Gray-Zone AIS',
    description: 'Vital semiconductor and industrial supply chain artery. Subject to military live-fire exercises, median-line crossing drills, and maritime gray-zone blockades.',
    coordinates: [119.8, 24.5],
    weeklyTrend: [
      { week: 'W-3', totalVessels: 1680, tankers: 380, containers: 890, cargo: 370, military: 40, alertCount: 12 },
      { week: 'W-2', totalVessels: 1620, tankers: 360, containers: 860, cargo: 360, military: 40, alertCount: 18 },
      { week: 'W-1', totalVessels: 1540, tankers: 340, containers: 810, cargo: 350, military: 40, alertCount: 25 },
      { week: 'CURRENT', totalVessels: 1480, tankers: 320, containers: 780, cargo: 340, military: 40, alertCount: 32 },
    ],
    incidents: [
      {
        id: 'inc-t-01',
        date: '2026-08-19',
        timeAgo: '1h ago',
        title: 'Joint Air-Sea Combat Readiness Patrol',
        severity: 'CRITICAL',
        type: 'MILITARY EXERCISE',
        description: '18 PLA fighter aircraft and 6 destroyers entered Taiwan ADIZ western sector; civil vessels rerouted 20NM east.',
      },
      {
        id: 'inc-t-02',
        date: '2026-08-17',
        timeAgo: '2d ago',
        title: 'Undersea Fiber Optic Cable Telemetry Ping',
        severity: 'HIGH',
        type: 'INFRASTRUCTURE RISK',
        description: 'Coast Guard monitored sand dredger operating within 1.2km of Matsu-Taiwan subsea communications line.',
      },
    ],
  },
};
