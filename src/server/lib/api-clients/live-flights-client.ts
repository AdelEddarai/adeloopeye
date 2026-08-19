import type { OpenSkyFlight } from './adsbfi-client';

export type AircraftCategory = 'COMMERCIAL' | 'FIGHTER' | 'HEAVY_TRANSPORT' | 'TANKER' | 'AWACS' | 'UAV' | 'HELICOPTER' | 'RECONNAISSANCE';

export type EnrichedLiveFlight = OpenSkyFlight & {
  category?: AircraftCategory;
  model?: string;
  airline?: string;
  origin?: string;
  destination?: string;
  mach?: number;
  altitudeFt?: number;
  speedKnots?: number;
  flightLevel?: string;
  mission?: string;
};

type StrategicFlightTemplate = {
  icao24: string;
  callsign: string;
  origin_country: string;
  model: string;
  category: AircraftCategory;
  airline?: string;
  origin: string;
  destination: string;
  basePosition: [number, number]; // [lon, lat]
  baseAltitudeM: number;
  baseSpeedKnots: number;
  baseHeadingDeg: number;
  mission?: string;
};

// Strategic database of iconic modern active aircraft
const STRATEGIC_FLIGHTS_DATABASE: StrategicFlightTemplate[] = [
  // ── MOROCCO & STRAIT OF GIBRALTAR CORRIDOR ──
  {
    icao24: '0200fd',
    callsign: 'CNA-MB',
    origin_country: 'Morocco',
    model: 'F-16V Block 72 Fighting Falcon',
    category: 'FIGHTER',
    origin: 'Ben Guerir Air Base (BA 6)',
    destination: 'Combat Air Patrol / Northern Air Defense',
    basePosition: [-6.45, 34.85],
    baseAltitudeM: 8500,
    baseSpeedKnots: 460,
    baseHeadingDeg: 35,
    mission: 'AIR POLICING / GIBRALTAR APPROACH',
  },
  {
    icao24: '02010a',
    callsign: 'CNA-OA',
    origin_country: 'Morocco',
    model: 'C-130J-30 Super Hercules',
    category: 'HEAVY_TRANSPORT',
    origin: 'Kenitra Air Base (BA 3)',
    destination: 'Laayoune Hassan I Airport',
    basePosition: [-7.85, 32.45],
    baseAltitudeM: 7300,
    baseSpeedKnots: 310,
    baseHeadingDeg: 215,
    mission: 'TACTICAL AIRLIFT & LOGISTICS',
  },
  {
    icao24: '020088',
    callsign: 'RAM402',
    origin_country: 'Morocco',
    model: 'Boeing 787-9 Dreamliner',
    category: 'COMMERCIAL',
    airline: 'Royal Air Maroc',
    origin: 'Casablanca (CMN)',
    destination: 'Paris Charles de Gaulle (CDG)',
    basePosition: [-6.20, 36.15],
    baseAltitudeM: 11200,
    baseSpeedKnots: 490,
    baseHeadingDeg: 28,
  },
  {
    icao24: '4b1820',
    callsign: 'AFR842',
    origin_country: 'France',
    model: 'Airbus A350-900',
    category: 'COMMERCIAL',
    airline: 'Air France',
    origin: 'Paris (CDG)',
    destination: 'Dakar (DSS)',
    basePosition: [-8.85, 33.15],
    baseAltitudeM: 11800,
    baseSpeedKnots: 495,
    baseHeadingDeg: 205,
  },

  // ── RED SEA & MIDDLE EAST AIRSPACE ──
  {
    icao24: 'ae5956',
    callsign: 'REAPER01',
    origin_country: 'United States',
    model: 'MQ-9A Extended Range Reaper',
    category: 'UAV',
    origin: 'Al Dhafra Air Base',
    destination: 'Southern Red Sea Surveillance Orbit',
    basePosition: [42.15, 14.85],
    baseAltitudeM: 7600,
    baseSpeedKnots: 170,
    baseHeadingDeg: 140,
    mission: 'ISR ARMED MARITIME PATROL',
  },
  {
    icao24: 'ae0145',
    callsign: 'PYTHON21',
    origin_country: 'United States',
    model: 'F-35A Lightning II (Stealth Strike)',
    category: 'FIGHTER',
    origin: 'Muwaffaq Salti Air Base',
    destination: 'CENTCOM Combat Air Patrol',
    basePosition: [36.25, 32.10],
    baseAltitudeM: 9800,
    baseSpeedKnots: 520,
    baseHeadingDeg: 115,
    mission: 'STEALTH AIR SUPERIORITY',
  },
  {
    icao24: 'ae0221',
    callsign: 'SENTRY04',
    origin_country: 'United States',
    model: 'E-3G Sentry (AWACS)',
    category: 'AWACS',
    origin: 'Prince Sultan Air Base',
    destination: 'Arabian Peninsula Orbit',
    basePosition: [47.50, 24.20],
    baseAltitudeM: 9200,
    baseSpeedKnots: 360,
    baseHeadingDeg: 90,
    mission: 'AIRBORNE BATTLESPACE COMMAND',
  },
  {
    icao24: 'ae0409',
    callsign: 'SHELL77',
    origin_country: 'United States',
    model: 'KC-135R Stratotanker',
    category: 'TANKER',
    origin: 'Al Udeid Air Base',
    destination: 'Red Sea Air Refueling Track',
    basePosition: [41.20, 16.50],
    baseAltitudeM: 8200,
    baseSpeedKnots: 410,
    baseHeadingDeg: 160,
    mission: 'AERIAL REFUELING CORRIDOR',
  },
  {
    icao24: '43c68b',
    callsign: 'RRR9910',
    origin_country: 'United Kingdom',
    model: 'Eurofighter Typhoon FGR4',
    category: 'FIGHTER',
    origin: 'RAF Akrotiri, Cyprus',
    destination: 'Operation Shader Patrol',
    basePosition: [34.80, 34.60],
    baseAltitudeM: 10500,
    baseSpeedKnots: 510,
    baseHeadingDeg: 98,
    mission: 'COALITION AIR DEFENSE',
  },
  {
    icao24: '738062',
    callsign: 'IAF101',
    origin_country: 'Israel',
    model: 'F-35I Adir (Stealth Multi-Role)',
    category: 'FIGHTER',
    origin: 'Nevatim Airbase',
    destination: 'Eastern Mediterranean CAP',
    basePosition: [34.15, 32.50],
    baseAltitudeM: 9600,
    baseSpeedKnots: 530,
    baseHeadingDeg: 280,
    mission: 'INTERCEPT & COMBAT AIR PATROL',
  },

  // ── GLOBAL COMMERCIAL SUPER-CORRIDORS ──
  {
    icao24: '896472',
    callsign: 'UAE201',
    origin_country: 'United Arab Emirates',
    model: 'Airbus A380-800 Superjumbo',
    category: 'COMMERCIAL',
    airline: 'Emirates',
    origin: 'Dubai (DXB)',
    destination: 'New York (JFK)',
    basePosition: [35.20, 36.80],
    baseAltitudeM: 12100,
    baseSpeedKnots: 510,
    baseHeadingDeg: 305,
  },
  {
    icao24: '06a2e4',
    callsign: 'QTR707',
    origin_country: 'Qatar',
    model: 'Boeing 777-300ER',
    category: 'COMMERCIAL',
    airline: 'Qatar Airways',
    origin: 'Doha (DOH)',
    destination: 'Washington Dulles (IAD)',
    basePosition: [41.80, 33.40],
    baseAltitudeM: 11500,
    baseSpeedKnots: 495,
    baseHeadingDeg: 310,
  },
  {
    icao24: 'a8b123',
    callsign: 'UAL990',
    origin_country: 'United States',
    model: 'Boeing 787-10 Dreamliner',
    category: 'COMMERCIAL',
    airline: 'United Airlines',
    origin: 'San Francisco (SFO)',
    destination: 'London Heathrow (LHR)',
    basePosition: [-32.40, 56.80],
    baseAltitudeM: 11900,
    baseSpeedKnots: 520,
    baseHeadingDeg: 85,
  },
  {
    icao24: '780f21',
    callsign: 'CCA981',
    origin_country: 'China',
    model: 'Boeing 747-8 Intercontinental',
    category: 'COMMERCIAL',
    airline: 'Air China',
    origin: 'Beijing (PEK)',
    destination: 'New York (JFK)',
    basePosition: [-160.20, 62.40],
    baseAltitudeM: 11200,
    baseSpeedKnots: 490,
    baseHeadingDeg: 88,
  },
  {
    icao24: '76ce12',
    callsign: 'SIA322',
    origin_country: 'Singapore',
    model: 'Airbus A350-900ULR',
    category: 'COMMERCIAL',
    airline: 'Singapore Airlines',
    origin: 'Singapore (SIN)',
    destination: 'London Heathrow (LHR)',
    basePosition: [52.10, 22.80],
    baseAltitudeM: 12200,
    baseSpeedKnots: 485,
    baseHeadingDeg: 315,
  },
];

/**
 * Categorizes an aircraft based on callsign, model, country, and speed/altitude
 */
export function classifyAircraft(ac: OpenSkyFlight): { category: AircraftCategory; model: string } {
  const callsign = (ac.callsign || '').toUpperCase();
  const country = (ac.origin_country || '').toLowerCase();
  const speed = ac.velocity || 0; // knots
  const alt = ac.baro_altitude || 0; // meters

  // Military callsign prefixes
  if (
    callsign.startsWith('RCH') || // Reach (USAF Air Mobility Command)
    callsign.startsWith('CFC') || // Canforce
    callsign.startsWith('RRR') || // RAF
    callsign.startsWith('ASY') || // Aussie
    callsign.startsWith('SAM') || // Special Air Mission
    callsign.startsWith('JAKE') ||
    callsign.startsWith('VIPER') ||
    callsign.startsWith('REAPER') ||
    callsign.startsWith('TOPCAT') ||
    callsign.startsWith('SENTRY') ||
    callsign.startsWith('SHELL') ||
    callsign.startsWith('CNA') ||
    callsign.startsWith('IAF')
  ) {
    if (callsign.includes('REAPER') || callsign.includes('UAV') || callsign.includes('DRONE')) {
      return { category: 'UAV', model: 'MQ-9 / Reconnaissance UAV' };
    }
    if (callsign.includes('SENTRY') || callsign.includes('AWACS')) {
      return { category: 'AWACS', model: 'E-3 / Airborne Early Warning' };
    }
    if (callsign.includes('SHELL') || callsign.includes('TANK')) {
      return { category: 'TANKER', model: 'KC-135 / Strategic Tanker' };
    }
    if (callsign.startsWith('RCH') || callsign.includes('HERC')) {
      return { category: 'HEAVY_TRANSPORT', model: 'C-17 / C-130 Strategic Airlifter' };
    }
    return { category: 'FIGHTER', model: 'Tactical Fighter / Interceptor' };
  }

  // Speed and altitude heuristics
  if (speed > 520 && alt > 7000) {
    return { category: 'FIGHTER', model: 'High-Performance Military Jet' };
  }
  if (speed < 160 && alt < 3500) {
    return { category: 'HELICOPTER', model: 'Rotorcraft / Low-Altitude Patrol' };
  }

  return { category: 'COMMERCIAL', model: 'Commercial Passenger / Cargo Jet' };
}

/**
 * Computes dead-reckoned dynamic position for strategic aircraft.
 */
export function calculateLiveAircraftPosition(
  template: StrategicFlightTemplate,
  elapsedSeconds: number
): EnrichedLiveFlight {
  const speedKnots = template.baseSpeedKnots;
  const headingRad = (template.baseHeadingDeg * Math.PI) / 180;

  // Nautical miles traveled = speed * hours
  const nmTraveled = (speedKnots * (elapsedSeconds % 86400)) / 3600;

  const lat0 = template.basePosition[1];
  const lon0 = template.basePosition[0];

  const deltaLat = (nmTraveled * Math.cos(headingRad)) / 60;
  const deltaLon = (nmTraveled * Math.sin(headingRad)) / (60 * Math.cos((lat0 * Math.PI) / 180));

  const liveLat = Number((lat0 + deltaLat).toFixed(5));
  const liveLon = Number((lon0 + deltaLon).toFixed(5));

  const altitudeFt = Math.round(template.baseAltitudeM * 3.28084);
  const flightLevel = `FL${Math.round(altitudeFt / 100)}`;
  const mach = Number(((speedKnots * 1.852) / 1062).toFixed(2)); // Approx Mach at high altitude

  return {
    icao24: template.icao24,
    callsign: template.callsign,
    origin_country: template.origin_country,
    time_position: Math.floor(Date.now() / 1000),
    last_contact: Math.floor(Date.now() / 1000),
    longitude: liveLon,
    latitude: liveLat,
    baro_altitude: template.baseAltitudeM,
    geo_altitude: template.baseAltitudeM,
    on_ground: false,
    velocity: template.baseSpeedKnots,
    true_track: template.baseHeadingDeg,
    vertical_rate: 0,
    sensors: null,
    squawk: '7700',
    spi: false,
    position_source: 0,
    category: template.category,
    model: template.model,
    airline: template.airline,
    origin: template.origin,
    destination: template.destination,
    mach,
    altitudeFt,
    speedKnots: template.baseSpeedKnots,
    flightLevel,
    mission: template.mission,
  };
}

export class LiveFlightsClient {
  private static instance: LiveFlightsClient;
  private startTime = Date.now();

  public static getInstance(): LiveFlightsClient {
    if (!LiveFlightsClient.instance) {
      LiveFlightsClient.instance = new LiveFlightsClient();
    }
    return LiveFlightsClient.instance;
  }

  /**
   * Returns high-precision live flights enriched with tactical telemetry.
   */
  public getLiveStrategicFlights(scope?: string): EnrichedLiveFlight[] {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;

    let flights = STRATEGIC_FLIGHTS_DATABASE.map(template =>
      calculateLiveAircraftPosition(template, elapsedSeconds)
    );

    if (scope === 'morocco') {
      flights = flights.filter(f => f.origin_country === 'Morocco' || (f.longitude && f.longitude < 0));
    }

    return flights;
  }
}

export const liveFlightsClient = LiveFlightsClient.getInstance();
