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

export type DailyVesselActivity = {
  date: string;
  dayLabel: string;
  totalVessels: number;
  tankers: number;
  containers: number;
  cargo: number;
  military: number;
  disruptionLevel: 'NORMAL' | 'ELEVATED' | 'HIGH_DISRUPTION';
  note?: string;
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
  dailyActivity: DailyVesselActivity[];
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
    dailyActivity: [
      { date: '08-06', dayLabel: 'Aug 6', totalVessels: 92, tankers: 46, containers: 26, cargo: 14, military: 6, disruptionLevel: 'NORMAL' },
      { date: '08-07', dayLabel: 'Aug 7', totalVessels: 89, tankers: 44, containers: 25, cargo: 14, military: 6, disruptionLevel: 'NORMAL' },
      { date: '08-08', dayLabel: 'Aug 8', totalVessels: 86, tankers: 42, containers: 24, cargo: 14, military: 6, disruptionLevel: 'NORMAL' },
      { date: '08-09', dayLabel: 'Aug 9', totalVessels: 84, tankers: 41, containers: 24, cargo: 13, military: 6, disruptionLevel: 'NORMAL' },
      { date: '08-10', dayLabel: 'Aug 10', totalVessels: 81, tankers: 39, containers: 23, cargo: 13, military: 6, disruptionLevel: 'NORMAL' },
      { date: '08-11', dayLabel: 'Aug 11', totalVessels: 78, tankers: 38, containers: 22, cargo: 12, military: 6, disruptionLevel: 'NORMAL' },
      { date: '08-12', dayLabel: 'Aug 12', totalVessels: 62, tankers: 28, containers: 18, cargo: 10, military: 6, disruptionLevel: 'HIGH_DISRUPTION', note: 'IRGC swarm exercise declared' },
      { date: '08-13', dayLabel: 'Aug 13', totalVessels: 58, tankers: 24, containers: 18, cargo: 10, military: 6, disruptionLevel: 'HIGH_DISRUPTION', note: 'GPS jamming spike across TSS' },
      { date: '08-14', dayLabel: 'Aug 14', totalVessels: 71, tankers: 34, containers: 21, cargo: 11, military: 5, disruptionLevel: 'ELEVATED' },
      { date: '08-15', dayLabel: 'Aug 15', totalVessels: 76, tankers: 37, containers: 22, cargo: 12, military: 5, disruptionLevel: 'ELEVATED' },
      { date: '08-16', dayLabel: 'Aug 16', totalVessels: 79, tankers: 39, containers: 23, cargo: 12, military: 5, disruptionLevel: 'NORMAL' },
      { date: '08-17', dayLabel: 'Aug 17', totalVessels: 74, tankers: 36, containers: 22, cargo: 11, military: 5, disruptionLevel: 'ELEVATED', note: 'AIS spoofing surge' },
      { date: '08-18', dayLabel: 'Aug 18', totalVessels: 68, tankers: 32, containers: 20, cargo: 11, military: 5, disruptionLevel: 'HIGH_DISRUPTION', note: 'Boarding attempt reported' },
      { date: '08-19', dayLabel: 'TODAY', totalVessels: 84, tankers: 42, containers: 24, cargo: 12, military: 6, disruptionLevel: 'ELEVATED' },
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
    dailyActivity: [
      { date: '08-06', dayLabel: 'Aug 6', totalVessels: 52, tankers: 20, containers: 22, cargo: 7, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-07', dayLabel: 'Aug 7', totalVessels: 48, tankers: 18, containers: 20, cargo: 7, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-08', dayLabel: 'Aug 8', totalVessels: 44, tankers: 16, containers: 18, cargo: 7, military: 3, disruptionLevel: 'HIGH_DISRUPTION', note: 'Anti-ship ballistic missile launch' },
      { date: '08-09', dayLabel: 'Aug 9', totalVessels: 38, tankers: 14, containers: 15, cargo: 6, military: 3, disruptionLevel: 'HIGH_DISRUPTION', note: 'Commercial liner diversion' },
      { date: '08-10', dayLabel: 'Aug 10', totalVessels: 34, tankers: 12, containers: 14, cargo: 5, military: 3, disruptionLevel: 'HIGH_DISRUPTION', note: 'Drone swarm intercept' },
      { date: '08-11', dayLabel: 'Aug 11', totalVessels: 41, tankers: 15, containers: 17, cargo: 6, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-12', dayLabel: 'Aug 12', totalVessels: 43, tankers: 16, containers: 18, cargo: 6, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-13', dayLabel: 'Aug 13', totalVessels: 45, tankers: 17, containers: 19, cargo: 6, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-14', dayLabel: 'Aug 14', totalVessels: 40, tankers: 14, containers: 17, cargo: 6, military: 3, disruptionLevel: 'HIGH_DISRUPTION', note: 'USV drone boat engagement' },
      { date: '08-15', dayLabel: 'Aug 15', totalVessels: 36, tankers: 13, containers: 14, cargo: 6, military: 3, disruptionLevel: 'HIGH_DISRUPTION' },
      { date: '08-16', dayLabel: 'Aug 16', totalVessels: 42, tankers: 16, containers: 17, cargo: 6, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-17', dayLabel: 'Aug 17', totalVessels: 41, tankers: 15, containers: 17, cargo: 6, military: 3, disruptionLevel: 'ELEVATED' },
      { date: '08-18', dayLabel: 'Aug 18', totalVessels: 39, tankers: 14, containers: 16, cargo: 6, military: 3, disruptionLevel: 'HIGH_DISRUPTION', note: 'Missile splash in transit lane' },
      { date: '08-19', dayLabel: 'TODAY', totalVessels: 42, tankers: 16, containers: 17, cargo: 6, military: 3, disruptionLevel: 'ELEVATED' },
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
    dailyActivity: [
      { date: '08-06', dayLabel: 'Aug 6', totalVessels: 265, tankers: 60, containers: 130, cargo: 68, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-07', dayLabel: 'Aug 7', totalVessels: 270, tankers: 62, containers: 132, cargo: 69, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-08', dayLabel: 'Aug 8', totalVessels: 274, tankers: 63, containers: 135, cargo: 69, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-09', dayLabel: 'Aug 9', totalVessels: 278, tankers: 64, containers: 137, cargo: 70, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-10', dayLabel: 'Aug 10', totalVessels: 280, tankers: 65, containers: 138, cargo: 70, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-11', dayLabel: 'Aug 11', totalVessels: 282, tankers: 66, containers: 139, cargo: 70, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-12', dayLabel: 'Aug 12', totalVessels: 284, tankers: 66, containers: 140, cargo: 71, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-13', dayLabel: 'Aug 13', totalVessels: 286, tankers: 67, containers: 141, cargo: 71, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-14', dayLabel: 'Aug 14', totalVessels: 285, tankers: 67, containers: 140, cargo: 71, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-15', dayLabel: 'Aug 15', totalVessels: 288, tankers: 68, containers: 142, cargo: 71, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-16', dayLabel: 'Aug 16', totalVessels: 290, tankers: 69, containers: 143, cargo: 71, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-17', dayLabel: 'Aug 17', totalVessels: 285, tankers: 67, containers: 141, cargo: 70, military: 7, disruptionLevel: 'ELEVATED', note: 'Shadow tanker inspection' },
      { date: '08-18', dayLabel: 'Aug 18', totalVessels: 282, tankers: 66, containers: 139, cargo: 70, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-19', dayLabel: 'TODAY', totalVessels: 288, tankers: 68, containers: 143, cargo: 70, military: 7, disruptionLevel: 'NORMAL' },
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
    dailyActivity: [
      { date: '08-06', dayLabel: 'Aug 6', totalVessels: 250, tankers: 55, containers: 130, cargo: 58, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-07', dayLabel: 'Aug 7', totalVessels: 245, tankers: 54, containers: 127, cargo: 57, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-08', dayLabel: 'Aug 8', totalVessels: 240, tankers: 53, containers: 125, cargo: 55, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-09', dayLabel: 'Aug 9', totalVessels: 236, tankers: 52, containers: 122, cargo: 55, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-10', dayLabel: 'Aug 10', totalVessels: 230, tankers: 50, containers: 120, cargo: 53, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-11', dayLabel: 'Aug 11', totalVessels: 224, tankers: 48, containers: 118, cargo: 51, military: 7, disruptionLevel: 'NORMAL' },
      { date: '08-12', dayLabel: 'Aug 12', totalVessels: 198, tankers: 42, containers: 104, cargo: 45, military: 7, disruptionLevel: 'HIGH_DISRUPTION', note: 'Live-fire exclusion NOTAM active' },
      { date: '08-13', dayLabel: 'Aug 13', totalVessels: 192, tankers: 40, containers: 102, cargo: 43, military: 7, disruptionLevel: 'HIGH_DISRUPTION', note: 'Naval combat patrol drills' },
      { date: '08-14', dayLabel: 'Aug 14', totalVessels: 215, tankers: 46, containers: 112, cargo: 50, military: 7, disruptionLevel: 'ELEVATED' },
      { date: '08-15', dayLabel: 'Aug 15', totalVessels: 220, tankers: 48, containers: 115, cargo: 50, military: 7, disruptionLevel: 'ELEVATED' },
      { date: '08-16', dayLabel: 'Aug 16', totalVessels: 225, tankers: 49, containers: 118, cargo: 51, military: 7, disruptionLevel: 'ELEVATED' },
      { date: '08-17', dayLabel: 'Aug 17', totalVessels: 210, tankers: 45, containers: 110, cargo: 48, military: 7, disruptionLevel: 'HIGH_DISRUPTION', note: 'Subsea cable telemetry alert' },
      { date: '08-18', dayLabel: 'Aug 18', totalVessels: 222, tankers: 48, containers: 116, cargo: 51, military: 7, disruptionLevel: 'ELEVATED' },
      { date: '08-19', dayLabel: 'TODAY', totalVessels: 235, tankers: 51, containers: 124, cargo: 53, military: 7, disruptionLevel: 'ELEVATED' },
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
    ],
  },
};
