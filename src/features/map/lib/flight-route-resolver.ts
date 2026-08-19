export type ResolvedAirport = {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  coordinates: [number, number]; // [lon, lat]
};

export type ResolvedFlightInfo = {
  callsign: string;
  icao24: string;
  operator: string;
  aircraftType: string;
  aircraftModel: string;
  origin: ResolvedAirport;
  destination: ResolvedAirport;
  distanceKm: number;
  progressPct: number;
  altitudeFt: number;
  speedKnots: number;
  headingDeg: number;
  verticalRateFpm: number;
  squawk: string;
};

// Known hubs
const AIRPORTS: Record<string, ResolvedAirport> = {
  CMN: { iata: 'CMN', icao: 'GMMN', name: 'Mohammed V Intl', city: 'Casablanca', country: 'Morocco', coordinates: [-7.5898, 33.3675] },
  RAK: { iata: 'RAK', icao: 'GMMX', name: 'Menara Airport', city: 'Marrakech', country: 'Morocco', coordinates: [-8.0363, 31.6069] },
  TNG: { iata: 'TNG', icao: 'GMTT', name: 'Ibn Battouta', city: 'Tangier', country: 'Morocco', coordinates: [-5.9169, 35.7269] },
  AGA: { iata: 'AGA', icao: 'GMAD', name: 'Al Massira', city: 'Agadir', country: 'Morocco', coordinates: [-9.4131, 30.3250] },
  RBA: { iata: 'RBA', icao: 'GMME', name: 'Rabat-Salé Airport', city: 'Rabat', country: 'Morocco', coordinates: [-6.7515, 34.0515] },
  CDG: { iata: 'CDG', icao: 'LFPG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', coordinates: [2.5500, 49.0097] },
  LHR: { iata: 'LHR', icao: 'EGLL', name: 'Heathrow', city: 'London', country: 'United Kingdom', coordinates: [-0.4614, 51.4700] },
  JFK: { iata: 'JFK', icao: 'KJFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'United States', coordinates: [-73.7781, 40.6413] },
  DXB: { iata: 'DXB', icao: 'OMDB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', coordinates: [55.3644, 25.2532] },
  DOH: { iata: 'DOH', icao: 'OTHH', name: 'Hamad International', city: 'Doha', country: 'Qatar', coordinates: [51.6081, 25.2731] },
  IST: { iata: 'IST', icao: 'LTFM', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', coordinates: [28.7519, 41.2753] },
  MAD: { iata: 'MAD', icao: 'LEMD', name: 'Barajas Airport', city: 'Madrid', country: 'Spain', coordinates: [-3.5673, 40.4839] },
  FRA: { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', coordinates: [8.5706, 50.0379] },
  CAI: { iata: 'CAI', icao: 'HECA', name: 'Cairo International', city: 'Cairo', country: 'Egypt', coordinates: [31.4056, 30.1219] },
  TLV: { iata: 'TLV', icao: 'LLBG', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel', coordinates: [34.8854, 32.0055] },
  IKA: { iata: 'IKA', icao: 'OIIE', name: 'Imam Khomeini Intl', city: 'Tehran', country: 'Iran', coordinates: [51.1522, 35.4161] },
  RMS: { iata: 'RMS', icao: 'ETAR', name: 'Ramstein Air Base', city: 'Ramstein', country: 'United States / NATO', coordinates: [7.6003, 49.4369] },
  ROT: { iata: 'NAV', icao: 'LERT', name: 'Naval Station Rota', city: 'Rota', country: 'Spain / USN', coordinates: [-6.3498, 36.6453] },
  BGN: { iata: 'BGN', icao: 'GMMB', name: 'Ben Guerir Air Base', city: 'Ben Guerir', country: 'Royal Moroccan Air Force', coordinates: [-7.9042, 32.2197] },
  ALV: { iata: 'UAV', icao: 'OEDR', name: 'King Abdulaziz Air Base', city: 'Dhahran', country: 'Saudi Arabia', coordinates: [50.1525, 26.2656] },
};

function haversineDist(pos1: [number, number], pos2: [number, number]): number {
  const R = 6371; // km
  const dLat = ((pos2[1] - pos1[1]) * Math.PI) / 180;
  const dLon = ((pos2[0] - pos1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1[1] * Math.PI) / 180) *
      Math.cos((pos2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function resolveFlightRoute(asset: any): ResolvedFlightInfo {
  const name = (asset.name || asset.id || '').toUpperCase().trim();
  const desc = (asset.description || '').toUpperCase();
  const pos: [number, number] = asset.position || [0, 0];
  const heading = asset.heading || 0;
  const altFt = Math.round((asset.altitude || 10500) * (asset.altitude > 1000 ? 1 : 3.28084));
  const spd = Math.round(asset.speedKnots || asset.velocity || 460);

  // Defaults
  let origin = AIRPORTS.CMN;
  let destination = AIRPORTS.CDG;
  let operator = 'Commercial Civil Airline';
  let aircraftType = 'B738';
  let aircraftModel = 'Boeing 737-800 NextGen';
  let squawk = '2412';

  // 1. Military & Tactical Callbacks
  if (name.startsWith('RCH') || name.startsWith('REACH')) {
    origin = AIRPORTS.RMS;
    destination = AIRPORTS.DOH;
    operator = 'US Air Force Air Mobility Command';
    aircraftType = 'C17';
    aircraftModel = 'Boeing C-17A Globemaster III';
    squawk = '4410';
  } else if (name.startsWith('PYTHON') || name.startsWith('VIPER') || name.startsWith('IAF')) {
    origin = AIRPORTS.TLV;
    destination = AIRPORTS.TLV;
    operator = 'Israeli Air Force (IAF)';
    aircraftType = 'F16';
    aircraftModel = 'Lockheed Martin F-16I Sufa';
    squawk = '7600';
  } else if (name.startsWith('REAPER') || name.startsWith('UAV') || name.startsWith('PRED')) {
    origin = AIRPORTS.ROT;
    destination = AIRPORTS.BGN;
    operator = 'Allied ISR Unmanned Task Force';
    aircraftType = 'MQ9';
    aircraftModel = 'General Atomics MQ-9A Reaper';
    squawk = '0024';
  } else if (name.startsWith('SENTRY') || name.startsWith('NATO') || name.startsWith('MAGIC')) {
    origin = AIRPORTS.RMS;
    destination = AIRPORTS.ROT;
    operator = 'NATO Airborne Early Warning Force';
    aircraftType = 'E3TF';
    aircraftModel = 'Boeing E-3A Sentry (AWACS)';
    squawk = '7100';
  } else if (name.startsWith('RAM') || name.startsWith('AT')) {
    operator = 'Royal Air Maroc';
    origin = AIRPORTS.CMN;
    destination = name.includes('84') ? AIRPORTS.DXB : name.includes('72') ? AIRPORTS.CDG : AIRPORTS.JFK;
    aircraftType = 'B789';
    aircraftModel = 'Boeing 787-9 Dreamliner';
    squawk = '3215';
  } else if (name.startsWith('AFR') || name.startsWith('AF')) {
    operator = 'Air France';
    origin = AIRPORTS.CDG;
    destination = AIRPORTS.DXB;
    aircraftType = 'A359';
    aircraftModel = 'Airbus A350-900';
    squawk = '5124';
  } else if (name.startsWith('BAW') || name.startsWith('BA')) {
    operator = 'British Airways';
    origin = AIRPORTS.LHR;
    destination = AIRPORTS.DOH;
    aircraftType = 'B77W';
    aircraftModel = 'Boeing 777-300ER';
    squawk = '6230';
  } else if (name.startsWith('UAE') || name.startsWith('EK')) {
    operator = 'Emirates';
    origin = AIRPORTS.DXB;
    destination = AIRPORTS.LHR;
    aircraftType = 'A388';
    aircraftModel = 'Airbus A380-800';
    squawk = '1452';
  } else if (name.startsWith('QTR') || name.startsWith('QR')) {
    operator = 'Qatar Airways';
    origin = AIRPORTS.DOH;
    destination = AIRPORTS.JFK;
    aircraftType = 'A35K';
    aircraftModel = 'Airbus A350-1000';
    squawk = '2671';
  } else if (name.startsWith('THY') || name.startsWith('TK')) {
    operator = 'Turkish Airlines';
    origin = AIRPORTS.IST;
    destination = AIRPORTS.CMN;
    aircraftType = 'A333';
    aircraftModel = 'Airbus A330-300';
    squawk = '4012';
  } else if (name.startsWith('UAL') || name.startsWith('UA')) {
    operator = 'United Airlines';
    origin = AIRPORTS.JFK;
    destination = AIRPORTS.TLV;
    aircraftType = 'B78X';
    aircraftModel = 'Boeing 787-10 Dreamliner';
    squawk = '3310';
  } else {
    // Dynamic geographic assignment based on position
    if (pos[0] > 30) {
      origin = AIRPORTS.DXB;
      destination = AIRPORTS.CDG;
    } else if (pos[0] < -2) {
      origin = AIRPORTS.CMN;
      destination = AIRPORTS.MAD;
    } else {
      origin = AIRPORTS.MAD;
      destination = AIRPORTS.CAI;
    }
  }

  const totalDist = Math.max(100, haversineDist(origin.coordinates, destination.coordinates));
  const distFromOrigin = haversineDist(origin.coordinates, pos);
  const progressPct = Math.max(5, Math.min(95, Math.round((distFromOrigin / totalDist) * 100)));

  return {
    callsign: name,
    icao24: (asset.id || '').replace('flight-', '').toUpperCase(),
    operator,
    aircraftType,
    aircraftModel,
    origin,
    destination,
    distanceKm: totalDist,
    progressPct,
    altitudeFt: altFt,
    speedKnots: spd,
    headingDeg: Math.round(heading),
    verticalRateFpm: Math.round(((Math.random() * 400) - 200)),
    squawk,
  };
}
