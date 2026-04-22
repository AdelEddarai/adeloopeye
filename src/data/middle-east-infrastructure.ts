import type { Target } from '@/data/map-data';

/**
 * Strategic Middle East infrastructure
 * Oil terminals, ports, naval bases, refineries
 */

export const MIDDLE_EAST_INFRASTRUCTURE: Omit<Target, 'id' | 'actor' | 'priority' | 'category' | 'sourceEventId'>[] = [
  // ═══ Oil Terminals & Export Facilities ═══
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Ras Tanura Oil Terminal',
    position: [50.1644, 26.6398],
    description: 'World\'s largest offshore oil loading facility - 5M barrels/day capacity (Saudi Aramco)',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Kharg Island Oil Terminal',
    position: [50.3248, 29.2352],
    description: 'Iran\'s primary oil export terminal - 85% of Iranian crude exports',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Fujairah Oil Terminal',
    position: [56.3264, 25.1164],
    description: 'UAE strategic oil storage and export hub - bypasses Strait of Hormuz',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Mina Al Ahmadi Terminal',
    position: [48.1333, 29.0667],
    description: 'Kuwait\'s largest oil export terminal - 1.5M barrels/day',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Ras Laffan LNG Terminal',
    position: [51.5333, 25.9333],
    description: 'Qatar\'s primary LNG export facility - world\'s largest LNG exporter',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Yanbu Oil Terminal',
    position: [38.0614, 24.0889],
    description: 'Saudi Red Sea export terminal - alternative to Hormuz route',
  },

  // ═══ Major Ports ═══
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Jebel Ali Port',
    position: [55.0271, 25.0157],
    description: 'World\'s 9th busiest container port - UAE logistics hub',
  },
  {
    type: 'NAVAL_BASE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Port of Bandar Abbas',
    position: [56.2666, 27.1832],
    description: 'Iran\'s largest port and IRGC naval headquarters',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Port of Salalah',
    position: [54.0000, 16.9333],
    description: 'Oman\'s major container transshipment hub',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Port of Aden',
    position: [45.0187, 12.7855],
    description: 'Yemen strategic port - contested in civil war',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Port of Hodeidah',
    position: [42.9541, 14.7969],
    description: 'Yemen Red Sea port - Houthi-controlled, critical for aid',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Port Said',
    position: [32.3019, 31.2653],
    description: 'Egypt - Northern entrance to Suez Canal',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Haifa Port',
    position: [35.0018, 32.7940],
    description: 'Israel\'s largest port - Mediterranean gateway',
  },

  // ═══ Naval Bases ═══
  {
    type: 'NAVAL_BASE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'NSA Bahrain',
    position: [50.5860, 26.2285],
    description: 'US Naval Support Activity - 5th Fleet headquarters',
  },
  {
    type: 'NAVAL_BASE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Al Udeid Air Base',
    position: [51.3149, 25.1175],
    description: 'US Air Force base in Qatar - CENTCOM forward HQ',
  },
  {
    type: 'NAVAL_BASE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Al Dhafra Air Base',
    position: [54.5477, 24.2483],
    description: 'UAE air base hosting US Air Force operations',
  },
  {
    type: 'NAVAL_BASE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'IRGC Chabahar Naval Base',
    position: [60.6223, 25.3467],
    description: 'Iran\'s eastern naval base - Indian Ocean access',
  },
  {
    type: 'NAVAL_BASE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Duqm Naval Base',
    position: [57.7088, 19.6686],
    description: 'Oman strategic port - UK and US access',
  },

  // ═══ Refineries & Processing ═══
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Abqaiq Processing Facility',
    position: [49.6667, 25.9333],
    description: 'Saudi Arabia - World\'s largest oil processing facility (2019 drone attack target)',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Ras Tanura Refinery',
    position: [50.1644, 26.6398],
    description: 'Saudi Arabia\'s largest refinery - 550,000 barrels/day',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Isfahan Refinery',
    position: [51.6625, 32.6500],
    description: 'Iran\'s largest refinery - 375,000 barrels/day',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Haifa Refinery',
    position: [35.0018, 32.8200],
    description: 'Israel\'s largest refinery - 9M tons/year capacity',
  },

  // ═══ Strategic Chokepoint Markers ═══
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Strait of Hormuz',
    position: [56.2500, 26.5667],
    description: 'World\'s most critical oil chokepoint - 21M barrels/day (30% of seaborne oil)',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Bab-el-Mandeb Strait',
    position: [43.3333, 12.5833],
    description: 'Red Sea chokepoint - 6.2M barrels/day, Houthi threat zone',
  },
  {
    type: 'INFRASTRUCTURE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    name: 'Suez Canal',
    position: [32.3439, 30.7050],
    description: 'Critical Europe-Asia shipping route - 12% of global trade',
  },
];
