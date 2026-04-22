import type { MaritimeLane } from '@/data/map-data';

/**
 * Major global shipping routes and trade lanes (2024-2026)
 * Based on current maritime trade patterns and strategic corridors
 * 
 * Sources: UNCTAD Maritime Transport Review, major shipping lane analysis
 * Content rephrased for compliance with licensing restrictions
 */

export const GLOBAL_SHIPPING_ROUTES: MaritimeLane[] = [
  // ═══ NORTH ATLANTIC ROUTE (Europe-North America) ═══
  // Busiest sea lane, ~150M tons annually, $600B+ trade
  {
    id: 'north-atlantic-westbound',
    name: 'North Atlantic - Europe to North America',
    kind: 'CONTAINER',
    path: [
      [4.4777, 51.9244],    // Rotterdam
      [3.2044, 51.3361],    // Antwerp
      [-5.3700, 50.3755],   // English Channel
      [-15.0, 53.0],        // Mid-Atlantic
      [-30.0, 48.0],        // Mid-Atlantic
      [-50.0, 45.0],        // Approaching North America
      [-74.0060, 40.7128],  // New York
    ],
  },
  {
    id: 'north-atlantic-eastbound',
    name: 'North Atlantic - North America to Europe',
    kind: 'CONTAINER',
    path: [
      [-76.6122, 39.2904],  // Baltimore
      [-74.0060, 40.7128],  // New York
      [-50.0, 45.0],        // Mid-Atlantic
      [-30.0, 48.0],        // Mid-Atlantic
      [-15.0, 53.0],        // Approaching Europe
      [-5.3700, 50.3755],   // English Channel
      [4.4777, 51.9244],    // Rotterdam
    ],
  },

  // ═══ TRANS-PACIFIC ROUTE (Asia-North America) ═══
  // 40% of global container traffic, 200M+ tons annually
  {
    id: 'transpacific-eastbound',
    name: 'Trans-Pacific - Asia to North America',
    kind: 'CONTAINER',
    path: [
      [121.4737, 31.2304],  // Shanghai
      [139.6917, 35.6762],  // Tokyo
      [160.0, 35.0],        // Mid-Pacific
      [-160.0, 35.0],       // Mid-Pacific
      [-140.0, 40.0],       // Approaching North America
      [-122.4194, 37.7749], // San Francisco
      [-118.2437, 33.7701], // Los Angeles
    ],
  },
  {
    id: 'transpacific-westbound',
    name: 'Trans-Pacific - North America to Asia',
    kind: 'CONTAINER',
    path: [
      [-122.3321, 47.6062], // Seattle
      [-140.0, 45.0],       // Mid-Pacific
      [-160.0, 40.0],       // Mid-Pacific
      [160.0, 38.0],        // Mid-Pacific
      [139.6917, 35.6762],  // Tokyo
      [126.9780, 37.5665],  // Busan
      [121.4737, 31.2304],  // Shanghai
    ],
  },

  // ═══ EUROPE-ASIA VIA SUEZ CANAL ═══
  // 12% of global trade, critical chokepoint
  {
    id: 'europe-asia-suez',
    name: 'Europe to Asia via Suez Canal',
    kind: 'CONTAINER',
    path: [
      [4.4777, 51.9244],    // Rotterdam
      [9.9937, 53.5511],    // Hamburg
      [-5.3700, 50.3755],   // English Channel
      [2.3522, 48.8566],    // Past France
      [12.4964, 41.9028],   // Mediterranean (Rome)
      [23.7275, 37.9838],   // Athens
      [32.3078, 31.2001],   // Suez Canal
      [43.1450, 12.7854],   // Bab-el-Mandeb
      [60.0, 20.0],         // Arabian Sea
      [80.0, 10.0],         // Indian Ocean
      [95.0, 5.0],          // Approaching Malacca
      [103.8198, 1.3521],   // Singapore
      [114.1095, 22.3964],  // Hong Kong
      [121.4737, 31.2304],  // Shanghai
    ],
  },
  {
    id: 'asia-europe-suez',
    name: 'Asia to Europe via Suez Canal',
    kind: 'CONTAINER',
    path: [
      [121.4737, 31.2304],  // Shanghai
      [114.1095, 22.3964],  // Hong Kong
      [103.8198, 1.3521],   // Singapore
      [95.0, 5.0],          // Malacca Strait
      [80.0, 10.0],         // Indian Ocean
      [60.0, 20.0],         // Arabian Sea
      [43.1450, 12.7854],   // Bab-el-Mandeb
      [32.3078, 31.2001],   // Suez Canal
      [23.7275, 37.9838],   // Athens
      [12.4964, 41.9028],   // Mediterranean
      [4.4777, 51.9244],    // Rotterdam
    ],
  },

  // ═══ CAPE OF GOOD HOPE ALTERNATIVE ═══
  // Alternative to Suez, +3000-5000 nautical miles
  {
    id: 'asia-europe-cape',
    name: 'Asia to Europe via Cape of Good Hope',
    kind: 'CONTAINER',
    path: [
      [103.8198, 1.3521],   // Singapore
      [95.0, 5.0],          // Malacca exit
      [80.0, -5.0],         // Indian Ocean
      [60.0, -15.0],        // Indian Ocean
      [40.0, -25.0],        // Approaching Africa
      [18.4241, -33.9249],  // Cape Town
      [10.0, -20.0],        // Atlantic
      [0.0, 0.0],           // Equator
      [-10.0, 20.0],        // North Atlantic
      [-5.3700, 50.3755],   // English Channel
      [4.4777, 51.9244],    // Rotterdam
    ],
  },

  // ═══ PANAMA CANAL ROUTE ═══
  // 6% of global trade, 14,000+ transits/year
  {
    id: 'asia-useast-panama',
    name: 'Asia to US East Coast via Panama',
    kind: 'CONTAINER',
    path: [
      [121.4737, 31.2304],  // Shanghai
      [139.6917, 35.6762],  // Tokyo
      [160.0, 30.0],        // Pacific
      [-120.0, 20.0],       // Approaching Panama
      [-79.9197, 8.9824],   // Panama Canal
      [-80.0, 15.0],        // Caribbean
      [-75.0, 25.0],        // Atlantic
      [-74.0060, 40.7128],  // New York
    ],
  },

  // ═══ ENGLISH CHANNEL ═══
  // Busiest shipping lane globally, 400-500 transits/day
  {
    id: 'english-channel-main',
    name: 'English Channel Main Corridor',
    kind: 'CONTAINER',
    path: [
      [1.0, 50.0],          // Western approach
      [-1.0, 50.5],         // Mid-channel
      [-3.0, 50.7],         // Eastern approach
      [-5.3700, 50.3755],   // Dover Strait (narrowest)
      [-2.0, 51.0],         // North Sea approach
      [3.2044, 51.3361],    // Antwerp
      [4.4777, 51.9244],    // Rotterdam
    ],
  },

  // ═══ STRAIT OF MALACCA ═══
  // 25% of global oil, critical Asia gateway
  {
    id: 'malacca-strait-main',
    name: 'Strait of Malacca - Main Channel',
    kind: 'TANKER',
    path: [
      [95.3173, 5.5483],    // Northern entrance
      [98.0, 3.0],          // Mid-strait
      [100.5, 2.0],         // Narrowest point
      [103.8198, 1.3521],   // Singapore exit
    ],
  },

  // ═══ SOUTH CHINA SEA ROUTES ═══
  // 45M+ tons annually, ASEAN-China integration
  {
    id: 'south-china-sea-north',
    name: 'South China Sea - Northern Corridor',
    kind: 'CONTAINER',
    path: [
      [103.8198, 1.3521],   // Singapore
      [104.0, 5.0],         // Gulf of Thailand
      [108.0, 12.0],        // Vietnam coast
      [114.1095, 22.3964],  // Hong Kong
      [121.4737, 31.2304],  // Shanghai
    ],
  },
  {
    id: 'south-china-sea-central',
    name: 'South China Sea - Central Corridor',
    kind: 'CONTAINER',
    path: [
      [103.8198, 1.3521],   // Singapore
      [110.0, 5.0],         // Central SCS
      [115.0, 10.0],        // Spratly area
      [120.0, 14.0],        // Philippines
      [121.0, 25.0],        // Taiwan
      [126.9780, 37.5665],  // Busan
    ],
  },

  // ═══ MEDITERRANEAN SEA ROUTES ═══
  // 35M+ tons, intra-regional trade
  {
    id: 'mediterranean-east-west',
    name: 'Mediterranean - East-West Corridor',
    kind: 'CONTAINER',
    path: [
      [32.3078, 31.2001],   // Suez
      [28.0, 34.0],         // Eastern Med
      [23.7275, 37.9838],   // Athens
      [18.0, 40.0],         // Adriatic
      [12.4964, 41.9028],   // Rome
      [7.0, 43.0],          // Genoa
      [2.1734, 41.3851],    // Barcelona
      [-5.3700, 36.1408],   // Gibraltar
    ],
  },

  // ═══ NORTH SEA ROUTES ═══
  // 30M+ tons, Northern European network
  {
    id: 'north-sea-main',
    name: 'North Sea - Main Corridor',
    kind: 'CONTAINER',
    path: [
      [-3.0, 58.0],         // Scotland
      [0.0, 56.0],          // Central North Sea
      [3.0, 54.0],          // Approaching Netherlands
      [4.4777, 51.9244],    // Rotterdam
      [6.0, 53.5],          // German Bight
      [9.9937, 53.5511],    // Hamburg
      [10.7522, 59.9139],   // Oslo
    ],
  },

  // ═══ BALTIC SEA ROUTES ═══
  // Northern European integration, specialized ice navigation
  {
    id: 'baltic-main',
    name: 'Baltic Sea - Main Corridor',
    kind: 'CONTAINER',
    path: [
      [10.0, 55.0],         // Danish Straits
      [12.5683, 55.6761],   // Copenhagen
      [18.0, 57.0],         // Central Baltic
      [24.7536, 59.4370],   // Tallinn
      [27.5615, 60.1699],   // Helsinki
      [30.3141, 59.9343],   // St. Petersburg
    ],
  },

  // ═══ RED SEA ROUTE ═══
  // 20% of container traffic (pre-2024 disruptions)
  {
    id: 'red-sea-main',
    name: 'Red Sea - Main Corridor',
    kind: 'CONTAINER',
    path: [
      [43.1450, 12.7854],   // Bab-el-Mandeb
      [42.0, 15.0],         // Southern Red Sea
      [38.0, 20.0],         // Central Red Sea
      [35.0, 25.0],         // Northern Red Sea
      [32.3078, 31.2001],   // Suez Canal
    ],
  },

  // ═══ PERSIAN GULF ROUTES ═══
  // 20% of global oil, critical energy corridor
  {
    id: 'persian-gulf-export',
    name: 'Persian Gulf - Oil Export Route',
    kind: 'TANKER',
    path: [
      [50.0, 26.0],         // Kuwait/Saudi terminals
      [51.5, 26.5],         // Qatar terminals
      [54.0, 25.0],         // UAE terminals
      [56.25, 26.55],       // Strait of Hormuz
      [58.0, 25.0],         // Gulf of Oman
      [60.0, 23.0],         // Arabian Sea
    ],
  },

  // ═══ INDIAN OCEAN ROUTES ═══
  {
    id: 'indian-ocean-east-west',
    name: 'Indian Ocean - East-West Corridor',
    kind: 'TANKER',
    path: [
      [60.0, 20.0],         // Arabian Sea
      [70.0, 10.0],         // Central Indian Ocean
      [80.0, 5.0],          // Approaching Sri Lanka
      [90.0, 5.0],          // Bay of Bengal
      [95.3173, 5.5483],    // Malacca entrance
    ],
  },

  // ═══ AUSTRALIA-ASIA ROUTES ═══
  {
    id: 'australia-asia-main',
    name: 'Australia to Asia - Main Route',
    kind: 'CONTAINER',
    path: [
      [151.2093, -33.8688], // Sydney
      [153.0, -27.4698],    // Brisbane
      [145.0, -15.0],       // Great Barrier Reef
      [130.0, -5.0],        // Timor Sea
      [115.0, 0.0],         // Java Sea
      [103.8198, 1.3521],   // Singapore
    ],
  },

  // ═══ SOUTH AMERICA ROUTES ═══
  {
    id: 'south-america-east-coast',
    name: 'South America - East Coast Route',
    kind: 'CONTAINER',
    path: [
      [-43.1729, -22.9068], // Rio de Janeiro
      [-38.5014, -12.9714], // Salvador
      [-34.8813, -7.1195],  // Recife
      [-40.0, 0.0],         // Equator
      [-50.0, 10.0],        // Caribbean approach
      [-60.0, 15.0],        // Caribbean
    ],
  },

  // ═══ WEST AFRICA ROUTES ═══
  {
    id: 'west-africa-main',
    name: 'West Africa - Main Coastal Route',
    kind: 'CONTAINER',
    path: [
      [-17.4467, 14.6928],  // Dakar
      [-13.0, 10.0],        // Guinea
      [-8.0, 5.0],          // Ivory Coast
      [-3.0, 5.0],          // Ghana
      [3.3792, 6.5244],     // Lagos
      [8.0, 4.0],           // Gulf of Guinea
    ],
  },

  // ═══ EAST AFRICA ROUTES ═══
  {
    id: 'east-africa-main',
    name: 'East Africa - Main Coastal Route',
    kind: 'CONTAINER',
    path: [
      [32.5825, -25.9692],  // Maputo
      [32.0, -20.0],        // Mozambique Channel
      [39.6682, -4.0435],   // Mombasa
      [39.0, 0.0],          // Equator
      [43.1450, 12.7854],   // Bab-el-Mandeb
    ],
  },

  // ═══ ARCTIC ROUTES (EMERGING) ═══
  // 5M+ tons annually, 30-50% shorter Asia-Europe
  {
    id: 'northeast-passage',
    name: 'Northeast Passage (Northern Sea Route)',
    kind: 'CONTAINER',
    path: [
      [30.3141, 59.9343],   // St. Petersburg
      [40.0, 70.0],         // Barents Sea
      [60.0, 75.0],         // Kara Sea
      [90.0, 77.0],         // Laptev Sea
      [140.0, 72.0],        // East Siberian Sea
      [170.0, 66.0],        // Bering Strait approach
      [-168.0, 65.5],       // Bering Strait
    ],
  },
];
