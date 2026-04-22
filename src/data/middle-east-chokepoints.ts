import type { ThreatZone } from '@/data/map-data';

/**
 * Critical Middle East maritime chokepoints and strategic zones
 * These are high-risk areas for shipping disruption
 */

export const MIDDLE_EAST_CHOKEPOINTS: Omit<ThreatZone, 'id' | 'actor' | 'priority' | 'category'>[] = [
  {
    name: 'Strait of Hormuz - Narrowest Point',
    type: 'CLOSURE',
    timestamp: new Date().toISOString(),
    coordinates: [
      [56.15, 26.65],
      [56.35, 26.65],
      [56.35, 26.50],
      [56.15, 26.50],
      [56.15, 26.65],
    ],
    color: [255, 50, 50, 100], // Red - Critical chokepoint
  },
  {
    name: 'Strait of Hormuz - Iranian Waters',
    type: 'PATROL',
    timestamp: new Date().toISOString(),
    coordinates: [
      [56.00, 27.00],
      [56.50, 27.00],
      [56.50, 26.40],
      [56.00, 26.40],
      [56.00, 27.00],
    ],
    color: [255, 100, 0, 80], // Orange - High risk
  },
  {
    name: 'Bab-el-Mandeb Strait',
    type: 'CLOSURE',
    timestamp: new Date().toISOString(),
    coordinates: [
      [43.20, 12.80],
      [43.50, 12.80],
      [43.50, 12.50],
      [43.20, 12.50],
      [43.20, 12.80],
    ],
    color: [255, 50, 50, 100], // Red - Houthi threat zone
  },
  {
    name: 'Red Sea - Houthi Threat Zone',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [42.00, 15.50],
      [43.50, 15.50],
      [43.50, 12.50],
      [42.00, 12.50],
      [42.00, 15.50],
    ],
    color: [255, 140, 0, 60], // Orange - Extended threat
  },
  {
    name: 'Suez Canal - Northern Approach',
    type: 'CLOSURE',
    timestamp: new Date().toISOString(),
    coordinates: [
      [32.25, 31.30],
      [32.45, 31.30],
      [32.45, 31.15],
      [32.25, 31.15],
      [32.25, 31.30],
    ],
    color: [255, 200, 0, 80], // Yellow - Strategic
  },
  {
    name: 'Persian Gulf - IRGC Naval Zone',
    type: 'PATROL',
    timestamp: new Date().toISOString(),
    coordinates: [
      [55.50, 28.00],
      [57.00, 28.00],
      [57.00, 26.50],
      [55.50, 26.50],
      [55.50, 28.00],
    ],
    color: [200, 50, 50, 70], // Dark red - Military zone
  },
  {
    name: 'Gulf of Aden - Piracy Risk Zone',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [43.00, 13.50],
      [51.00, 13.50],
      [51.00, 11.00],
      [43.00, 11.00],
      [43.00, 13.50],
    ],
    color: [255, 165, 0, 50], // Light orange - Moderate risk
  },
];

/**
 * Active conflict zones in the Middle East
 */
export const MIDDLE_EAST_CONFLICT_ZONES: Omit<ThreatZone, 'id' | 'actor' | 'priority' | 'category'>[] = [
  {
    name: 'Yemen - Houthi Territory',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [43.50, 17.50],
      [45.50, 17.50],
      [45.50, 14.50],
      [43.50, 14.50],
      [43.50, 17.50],
    ],
    color: [220, 50, 50, 90], // Red - Active conflict
  },
  {
    name: 'Syria - Active Conflict Zone',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [36.00, 37.00],
      [42.00, 37.00],
      [42.00, 32.50],
      [36.00, 32.50],
      [36.00, 37.00],
    ],
    color: [220, 50, 50, 80], // Red - Ongoing conflict
  },
  {
    name: 'Iraq - PMF Zones',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [43.00, 37.00],
      [47.00, 37.00],
      [47.00, 30.00],
      [43.00, 30.00],
      [43.00, 37.00],
    ],
    color: [255, 140, 0, 70], // Orange - Militia presence
  },
  {
    name: 'Gaza Strip',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [34.20, 31.60],
      [34.55, 31.60],
      [34.55, 31.20],
      [34.20, 31.20],
      [34.20, 31.60],
    ],
    color: [220, 50, 50, 100], // Red - High intensity
  },
  {
    name: 'Southern Lebanon - Hezbollah Zone',
    type: 'THREAT_CORRIDOR',
    timestamp: new Date().toISOString(),
    coordinates: [
      [35.00, 33.50],
      [35.90, 33.50],
      [35.90, 33.00],
      [35.00, 33.00],
      [35.00, 33.50],
    ],
    color: [255, 100, 0, 85], // Orange-red - Tension zone
  },
];
