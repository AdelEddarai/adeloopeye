import type { MaritimeLane } from '@/data/map-data';

/**
 * Approximate major commercial sea lanes / chokepoint corridors for OSINT context.
 * Not live AIS — live positions come from optional DATALASTIC_API_KEY (see server client).
 */
export const WORLD_MARITIME_LANES: MaritimeLane[] = [
  // ═══ STRAIT OF HORMUZ - Enhanced Detail ═══
  {
    id: 'lane-hormuz-north',
    name: 'Strait of Hormuz (N approach)',
    kind: 'CHOKEPOINT',
    path: [
      [56.4, 26.55],
      [56.3, 26.6],
      [56.2, 26.65],
    ],
  },
  {
    id: 'lane-hormuz-south',
    name: 'Strait of Hormuz (S approach)',
    kind: 'CHOKEPOINT',
    path: [
      [56.4, 26.45],
      [56.3, 26.50],
      [56.2, 26.55],
    ],
  },
  {
    id: 'lane-hormuz-tanker-inbound',
    name: 'Hormuz Tanker Route (Inbound to Persian Gulf)',
    kind: 'TANKER',
    path: [
      [58.0, 25.5],   // Gulf of Oman
      [57.5, 26.0],
      [57.0, 26.3],
      [56.5, 26.5],   // Strait entrance
      [56.2, 26.6],   // Narrowest point
      [55.5, 27.0],
      [54.5, 27.5],
      [53.0, 28.0],
      [51.5, 28.5],   // Persian Gulf
      [50.5, 29.0],   // Kharg Island area
    ],
  },
  {
    id: 'lane-hormuz-tanker-outbound',
    name: 'Hormuz Tanker Route (Outbound from Persian Gulf)',
    kind: 'TANKER',
    path: [
      [50.3, 29.2],   // Kharg Island
      [51.0, 28.8],
      [52.0, 28.3],
      [53.5, 27.8],
      [55.0, 27.2],
      [56.0, 26.7],   // Strait
      [56.3, 26.55],  // Narrowest point
      [57.0, 26.2],
      [58.0, 25.8],
      [59.0, 25.5],   // Indian Ocean
    ],
  },
  {
    id: 'lane-persian-gulf-saudi',
    name: 'Saudi Oil Export Route (Ras Tanura)',
    kind: 'TANKER',
    path: [
      [50.1644, 26.6398], // Ras Tanura
      [51.0, 27.0],
      [52.5, 27.5],
      [54.0, 27.3],
      [55.5, 27.0],
      [56.2, 26.6],       // Hormuz
    ],
  },
  {
    id: 'lane-persian-gulf-kuwait',
    name: 'Kuwait Oil Export Route',
    kind: 'TANKER',
    path: [
      [48.1333, 29.0667], // Mina Al Ahmadi
      [49.0, 28.8],
      [50.5, 28.5],
      [52.0, 28.0],
      [54.0, 27.5],
      [56.0, 26.8],
      [56.3, 26.55],      // Hormuz
    ],
  },
  {
    id: 'lane-persian-gulf-uae',
    name: 'UAE Jebel Ali Container Route',
    kind: 'CONTAINER',
    path: [
      [55.0271, 25.0157], // Jebel Ali
      [55.5, 25.5],
      [56.0, 26.0],
      [56.3, 26.5],       // Hormuz
      [57.0, 26.2],
      [58.0, 25.8],
    ],
  },
  {
    id: 'lane-fujairah-bypass',
    name: 'Fujairah Bypass Route (Hormuz Alternative)',
    kind: 'TANKER',
    path: [
      [56.3264, 25.1164], // Fujairah (bypasses Hormuz)
      [57.0, 24.5],
      [58.0, 24.0],
      [59.5, 23.5],
      [61.0, 23.0],       // Direct to Indian Ocean
    ],
  },
  {
    id: 'lane-red-sea-north',
    name: 'Red Sea Northern Route (to Suez)',
    kind: 'MIXED',
    path: [
      [43.3, 12.6],   // Bab-el-Mandeb
      [42.5, 15.0],
      [41.5, 18.0],
      [38.5, 22.0],
      [36.0, 25.0],
      [34.5, 27.5],
      [33.5, 29.0],
      [32.5, 30.5],   // Suez approach
    ],
  },
  {
    id: 'lane-red-sea-south',
    name: 'Red Sea Southern Route (from Suez)',
    kind: 'MIXED',
    path: [
      [32.5, 30.0],   // Suez
      [33.5, 28.5],
      [35.0, 26.0],
      [37.0, 23.0],
      [39.5, 19.0],
      [42.0, 15.0],
      [43.2, 12.6],   // Bab-el-Mandeb
    ],
  },
  {
    id: 'lane-malacca',
    name: 'Strait of Malacca (core track)',
    kind: 'CONTAINER',
    path: [
      [100.2, 3.95],
      [101.2, 3.15],
      [102.4, 2.2],
      [103.75, 1.35],
    ],
  },
  {
    id: 'lane-suez',
    name: 'Suez Canal corridor',
    kind: 'MIXED',
    path: [
      [32.55, 31.22],
      [32.52, 30.75],
      [32.45, 30.05],
      [32.35, 29.95],
    ],
  },
  {
    id: 'lane-gibraltar',
    name: 'Strait of Gibraltar',
    kind: 'MIXED',
    path: [
      [-5.75, 36.05],
      [-5.45, 35.95],
      [-5.2, 35.88],
    ],
  },
  {
    id: 'lane-panama',
    name: 'Panama Canal approach',
    kind: 'CONTAINER',
    path: [
      [-79.95, 9.38],
      [-79.92, 9.15],
      [-79.9, 8.95],
    ],
  },
  {
    id: 'lane-english-channel',
    name: 'English Channel (east-west)',
    kind: 'MIXED',
    path: [
      [-1.6, 50.85],
      [0.2, 51.0],
      [1.65, 51.05],
    ],
  },
  {
    id: 'lane-bab-el-mandeb',
    name: 'Bab-el-Mandeb approach',
    kind: 'CHOKEPOINT',
    path: [
      [43.35, 12.62],
      [43.18, 12.55],
      [43.05, 12.48],
    ],
  },
  {
    id: 'lane-cape-horn-track',
    name: 'S Atlantic — Cape routing (segment)',
    kind: 'TANKER',
    path: [
      [-38.5, -20.2],
      [-32.0, -28.5],
      [-20.0, -35.5],
    ],
  },
];
