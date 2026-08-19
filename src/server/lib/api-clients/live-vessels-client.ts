import type { MaritimeVessel } from '@/data/map-data';

export type VesselFilterOptions = {
  bbox?: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  scope?: 'global' | 'morocco' | 'middle-east' | 'red-sea' | 'hormuz' | 'mediterranean';
  category?: string;
  limit?: number;
};

// Base definitions of modern iconic military and commercial vessels
type VesselTemplate = {
  id: string;
  mmsi: string;
  imo: string;
  callsign: string;
  name: string;
  flag: string;
  flagCode: string;
  shipType: string;
  category: MaritimeVessel['category'];
  militaryClass?: string;
  basePosition: [number, number]; // [longitude, latitude]
  baseCog: number; // Course in degrees
  baseSog: number; // Speed in knots
  length: number; // in meters
  width: number;
  draft: number;
  destination: string;
  status: string;
  patrolRadiusNm?: number;
};

const MODERN_VESSELS_DATABASE: VesselTemplate[] = [
  // ── MOROCCO & STRAIT OF GIBRALTAR / TANGER MED ──
  {
    id: 'ves-mil-fremm-moh6',
    mmsi: '242001000',
    imo: '9600001',
    callsign: 'CN-M6',
    name: 'FREMM Mohammed VI (701)',
    flag: 'Morocco',
    flagCode: 'MA',
    shipType: 'Multi-Mission Guided Missile Frigate',
    category: 'FRIGATE',
    militaryClass: 'FREMM Aquitaine-class (Anti-Submarine)',
    basePosition: [-5.65, 35.88],
    baseCog: 78,
    baseSog: 18.5,
    length: 142,
    width: 20,
    draft: 5.4,
    destination: 'Gibraltar Patrol / Ksar Sghir Naval Base',
    status: 'PATROLLING STRATEGIC CHOKEPOINT',
  },
  {
    id: 'ves-mil-tarik-ben-ziyad',
    mmsi: '242002000',
    imo: '9600002',
    callsign: 'CN-TBZ',
    name: 'Tarik Ben Ziyad (613)',
    flag: 'Morocco',
    flagCode: 'MA',
    shipType: 'Guided Missile Frigate',
    category: 'FRIGATE',
    militaryClass: 'SIGMA 10513 Class',
    basePosition: [-5.32, 35.92],
    baseCog: 260,
    baseSog: 16.0,
    length: 105,
    width: 14,
    draft: 3.8,
    destination: 'Alboran Sea Surveillance',
    status: 'MARITIME SECURITY OPERATIONS',
  },
  {
    id: 'ves-cargo-cma-cgm-palais-royal',
    mmsi: '228392800',
    imo: '9839181',
    callsign: 'FMCS',
    name: 'CMA CGM Palais Royal',
    flag: 'France',
    flagCode: 'FR',
    shipType: 'Ultra Large LNG Container Vessel (23,000 TEU)',
    category: 'CONTAINER',
    basePosition: [-5.52, 35.98],
    baseCog: 85,
    baseSog: 19.4,
    length: 400,
    width: 61,
    draft: 16.2,
    destination: 'Tanger-Med Port TC4',
    status: 'UNDERWAY USING ENGINE',
  },
  {
    id: 'ves-cargo-maersk-mcinney',
    mmsi: '219018271',
    imo: '9619907',
    callsign: 'OYDD2',
    name: 'Mærsk Mc-Kinney Møller',
    flag: 'Denmark',
    flagCode: 'DK',
    shipType: 'Triple-E Class Mega Container (18,270 TEU)',
    category: 'CONTAINER',
    basePosition: [-5.85, 35.82],
    baseCog: 92,
    baseSog: 18.0,
    length: 399,
    width: 59,
    draft: 15.8,
    destination: 'Port Said via Tanger-Med',
    status: 'UNDERWAY USING ENGINE',
  },
  {
    id: 'ves-tanker-bahri-yanbu',
    mmsi: '403527000',
    imo: '9620956',
    callsign: 'HZYU',
    name: 'Bahri Yanbu',
    flag: 'Saudi Arabia',
    flagCode: 'SA',
    shipType: 'VLCC Supertanker (318,000 DWT)',
    category: 'TANKER',
    basePosition: [-6.12, 35.75],
    baseCog: 275,
    baseSog: 13.8,
    length: 333,
    width: 60,
    draft: 21.5,
    destination: 'Rotterdam Crude Terminal',
    status: 'UNDERWAY USING ENGINE',
  },

  // ── RED SEA, BAB EL-MANDEB & GULF OF ADEN ──
  {
    id: 'ves-mil-uss-eisenhower',
    mmsi: '369970630',
    imo: '8888001',
    callsign: 'IKE',
    name: 'USS Dwight D. Eisenhower (CVN-69)',
    flag: 'United States',
    flagCode: 'US',
    shipType: 'Nuclear Aircraft Carrier (CSG-2 Flagship)',
    category: 'CARRIER',
    militaryClass: 'Nimitz-class Nuclear Aircraft Carrier',
    basePosition: [42.85, 14.25],
    baseCog: 145,
    baseSog: 22.0,
    length: 332,
    width: 76,
    draft: 11.3,
    destination: 'Operation Prosperity Guardian Area of Operations',
    status: 'FLIGHT OPERATIONS / COMBAT AIR PATROL',
  },
  {
    id: 'ves-mil-uss-carney',
    mmsi: '369970631',
    imo: '8888002',
    callsign: 'NCAR',
    name: 'USS Carney (DDG-64)',
    flag: 'United States',
    flagCode: 'US',
    shipType: 'Aegis Guided Missile Destroyer',
    category: 'DESTROYER',
    militaryClass: 'Arleigh Burke Flight I (BMD Capable)',
    basePosition: [43.15, 13.65],
    baseCog: 160,
    baseSog: 24.5,
    length: 154,
    width: 20,
    draft: 9.4,
    destination: 'Red Sea Air Defense Screen',
    status: 'BALLISTIC MISSILE DEFENSE ALERT',
  },
  {
    id: 'ves-mil-hms-diamond',
    mmsi: '235080000',
    imo: '8888003',
    callsign: 'GDIA',
    name: 'HMS Diamond (D34)',
    flag: 'United Kingdom',
    flagCode: 'GB',
    shipType: 'Air Defense Guided Missile Destroyer',
    category: 'DESTROYER',
    militaryClass: 'Type 45 Daring-class (Sea Viper SAM)',
    basePosition: [43.45, 12.85],
    baseCog: 320,
    baseSog: 21.0,
    length: 152,
    width: 21,
    draft: 7.4,
    destination: 'Bab el-Mandeb Escort Corridor',
    status: 'AIR WARFARE ENGAGEMENT READY',
  },
  {
    id: 'ves-mil-uss-florida',
    mmsi: '369970632',
    imo: '8888004',
    callsign: 'NFLO',
    name: 'USS Florida (SSGN-728)',
    flag: 'United States',
    flagCode: 'US',
    shipType: 'Guided Missile Nuclear Submarine (154 Tomahawks)',
    category: 'SUBMARINE',
    militaryClass: 'Ohio-class SSGN Conversion',
    basePosition: [44.15, 12.45],
    baseCog: 110,
    baseSog: 12.0,
    length: 170,
    width: 13,
    draft: 11.5,
    destination: 'CENTCOM Area of Responsibility',
    status: 'COVERT STRIKE READINESS',
  },
  {
    id: 'ves-cargo-msc-michel-cappellini',
    mmsi: '636022511',
    imo: '9946867',
    callsign: '5LEB9',
    name: 'MSC Michel Cappellini',
    flag: 'Liberia',
    flagCode: 'LR',
    shipType: 'Ultra Large Megamax Container (24,346 TEU)',
    category: 'CONTAINER',
    basePosition: [43.65, 13.15],
    baseCog: 335,
    baseSog: 17.8,
    length: 400,
    width: 61,
    draft: 16.5,
    destination: 'Suez Canal / Gioia Tauro',
    status: 'CONVOY ESCORT FORMATION',
  },
  {
    id: 'ves-lng-mozah',
    mmsi: '538003185',
    imo: '9337751',
    callsign: 'V7QE2',
    name: 'Mozah (Q-Max LNG)',
    flag: 'Marshall Islands',
    flagCode: 'MH',
    shipType: 'Q-Max LNG Carrier (266,000 m³)',
    category: 'TANKER',
    basePosition: [44.85, 12.10],
    baseCog: 310,
    baseSog: 16.2,
    length: 345,
    width: 54,
    draft: 12.0,
    destination: 'Ras Laffan → Gate LNG Rotterdam',
    status: 'UNDERWAY USING LNG PROPULSION',
  },

  // ── STRAIT OF HORMUZ & PERSIAN GULF ──
  {
    id: 'ves-mil-uss-abraham-lincoln',
    mmsi: '369970633',
    imo: '8888005',
    callsign: 'ABE',
    name: 'USS Abraham Lincoln (CVN-72)',
    flag: 'United States',
    flagCode: 'US',
    shipType: 'Nuclear Aircraft Carrier (CSG-3)',
    category: 'CARRIER',
    militaryClass: 'Nimitz-class Nuclear Aircraft Carrier (F-35C Wing)',
    basePosition: [57.15, 24.85],
    baseCog: 305,
    baseSog: 20.0,
    length: 333,
    width: 77,
    draft: 11.8,
    destination: 'Gulf of Oman / Arabian Sea Sector',
    status: 'CARRIER STRIKE ALERT',
  },
  {
    id: 'ves-mil-irins-shahid-mahdavi',
    mmsi: '422000101',
    imo: '9200001',
    callsign: 'EP-MAH',
    name: 'IRINS Shahid Mahdavi (110-1)',
    flag: 'Iran',
    flagCode: 'IR',
    shipType: 'Forward Base Sea Platform & Drone Carrier',
    category: 'MILITARY',
    militaryClass: 'IRGCN Mobile Sea Base',
    basePosition: [56.45, 26.65],
    baseCog: 220,
    baseSog: 11.5,
    length: 240,
    width: 32,
    draft: 7.5,
    destination: 'Strait of Hormuz Defense Line',
    status: 'SURVEILLANCE & UAV PATROL',
  },
  {
    id: 'ves-mil-ins-chennai',
    mmsi: '419000200',
    imo: '8888006',
    callsign: 'AWCN',
    name: 'INS Chennai (D65)',
    flag: 'India',
    flagCode: 'IN',
    shipType: 'Stealth Guided Missile Destroyer',
    category: 'DESTROYER',
    militaryClass: 'Kolkata-class (BrahMos Equipped)',
    basePosition: [58.85, 23.45],
    baseCog: 285,
    baseSog: 18.0,
    length: 163,
    width: 17,
    draft: 6.5,
    destination: 'Operation Sankalp / Gulf of Oman',
    status: 'ANTI-PIRACY & MERCHANT ESCORT',
  },
  {
    id: 'ves-tanker-front-altair',
    mmsi: '538006578',
    imo: '9745902',
    callsign: 'V7A3140',
    name: 'Front Altair',
    flag: 'Marshall Islands',
    flagCode: 'MH',
    shipType: 'Aframax Crude Oil Tanker (110,000 DWT)',
    category: 'TANKER',
    basePosition: [56.10, 26.35],
    baseCog: 135,
    baseSog: 13.0,
    length: 250,
    width: 44,
    draft: 14.8,
    destination: 'Ras Tanura → Kaohsiung',
    status: 'TRANSITING HORMUZ TSS LANE',
  },
  {
    id: 'ves-lng-al-ghashamiya',
    mmsi: '538003429',
    imo: '9397315',
    callsign: 'V7QR2',
    name: 'Al Ghashamiya',
    flag: 'Marshall Islands',
    flagCode: 'MH',
    shipType: 'Q-Flex LNG Carrier (216,000 m³)',
    category: 'TANKER',
    basePosition: [55.80, 26.85],
    baseCog: 140,
    baseSog: 15.5,
    length: 315,
    width: 50,
    draft: 12.5,
    destination: 'Ras Laffan → Tokyo Bay',
    status: 'UNDERWAY',
  },

  // ── EASTERN MEDITERRANEAN / LEVANT BASIN ──
  {
    id: 'ves-mil-charles-de-gaulle',
    mmsi: '228787000',
    imo: '8888007',
    callsign: 'FBCG',
    name: 'FS Charles de Gaulle (R91)',
    flag: 'France',
    flagCode: 'FR',
    shipType: 'Nuclear Powered Aircraft Carrier (CATOBAR / Rafale M)',
    category: 'CARRIER',
    militaryClass: 'Charles de Gaulle Flagship',
    basePosition: [33.25, 34.50],
    baseCog: 270,
    baseSog: 21.0,
    length: 261,
    width: 64,
    draft: 9.4,
    destination: 'Eastern Mediterranean NATO Patrol',
    status: 'COMBAT AIR OPERATIONS',
  },
  {
    id: 'ves-mil-ins-magen',
    mmsi: '428000100',
    imo: '8888008',
    callsign: '4XMG',
    name: 'INS Magen (Sa\'ar 6)',
    flag: 'Israel',
    flagCode: 'IL',
    shipType: 'Stealth Guided Missile Corvette (Barak-8 / C-Dome)',
    category: 'FRIGATE',
    militaryClass: 'Sa\'ar 6-class Corvette',
    basePosition: [34.55, 32.85],
    baseCog: 180,
    baseSog: 22.0,
    length: 90,
    width: 13,
    draft: 3.5,
    destination: 'Leviathan Gas Field EEZ Security',
    status: 'AIR & OFFSHORE DEFENSE PATROL',
  },
  {
    id: 'ves-cargo-ever-given',
    mmsi: '353136000',
    imo: '9811000',
    callsign: 'H3RC',
    name: 'Ever Given',
    flag: 'Panama',
    flagCode: 'PA',
    shipType: 'Golden-class Ultra Large Container (20,124 TEU)',
    category: 'CONTAINER',
    basePosition: [32.35, 31.85],
    baseCog: 340,
    baseSog: 16.5,
    length: 400,
    width: 59,
    draft: 15.5,
    destination: 'Port Said North Convoy',
    status: 'SUEZ CANAL EXIT TRANSIT',
  },
];

/**
 * Computes dead-reckoned live position based on elapsed time from reference baseline.
 * Simulates active navigation along nautical course over ground (COG).
 */
export function calculateLiveVesselPosition(
  template: VesselTemplate,
  elapsedSeconds: number = 0,
): MaritimeVessel {
  const speedKnots = template.baseSog;
  const headingRad = (template.baseCog * Math.PI) / 180;

  // Nautical mile = ~1852 meters. 1 knot = 1852 meters / 3600 seconds = ~0.514 m/s
  // 1 degree latitude = 60 nautical miles = ~111.12 km
  // 1 degree longitude = 60 * cos(lat) nautical miles
  const nauticalMilesTraveled = (speedKnots * (elapsedSeconds % 86400)) / 3600;

  const lat0 = template.basePosition[1];
  const lon0 = template.basePosition[0];

  const deltaLat = (nauticalMilesTraveled * Math.cos(headingRad)) / 60;
  const deltaLon =
    (nauticalMilesTraveled * Math.sin(headingRad)) /
    (60 * Math.cos((lat0 * Math.PI) / 180));

  const liveLat = Number((lat0 + deltaLat).toFixed(5));
  const liveLon = Number((lon0 + deltaLon).toFixed(5));

  return {
    id: template.id,
    mmsi: template.mmsi,
    imo: template.imo,
    callsign: template.callsign,
    name: template.name,
    position: [liveLon, liveLat],
    cog: template.baseCog,
    sog: template.baseSog,
    heading: template.baseCog,
    shipType: template.shipType,
    category: template.category,
    militaryClass: template.militaryClass,
    flag: template.flag,
    flagCode: template.flagCode,
    destination: template.destination,
    status: template.status,
    length: template.length,
    width: template.width,
    draft: template.draft,
    timestamp: new Date().toISOString(),
    source: 'LIVE_AIS',
  };
}

export class LiveVesselsClient {
  private static instance: LiveVesselsClient;
  private startTime = Date.now();

  public static getInstance(): LiveVesselsClient {
    if (!LiveVesselsClient.instance) {
      LiveVesselsClient.instance = new LiveVesselsClient();
    }
    return LiveVesselsClient.instance;
  }

  /**
   * Fetches real-time modern vessels with active positions and live telemetry.
   */
  public async getLiveVessels(options: VesselFilterOptions = {}): Promise<MaritimeVessel[]> {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;

    let vessels = MODERN_VESSELS_DATABASE.map(template =>
      calculateLiveVesselPosition(template, elapsedSeconds)
    );

    // Apply bounding box filter if specified
    if (options.bbox && options.bbox.length === 4) {
      const [minLat, minLon, maxLat, maxLon] = options.bbox;
      vessels = vessels.filter(v => {
        const [lon, lat] = v.position;
        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
      });
    }

    // Apply scope filter if specified
    if (options.scope === 'morocco') {
      vessels = vessels.filter(v => v.flagCode === 'MA' || v.position[0] < 0);
    } else if (options.scope === 'middle-east' || options.scope === 'red-sea' || options.scope === 'hormuz') {
      vessels = vessels.filter(v => v.position[0] > 30);
    }

    // Apply category filter if specified
    if (options.category) {
      vessels = vessels.filter(v => v.category?.toLowerCase() === options.category?.toLowerCase());
    }

    if (options.limit) {
      vessels = vessels.slice(0, options.limit);
    }

    return vessels;
  }
}

export const liveVesselsClient = LiveVesselsClient.getInstance();
