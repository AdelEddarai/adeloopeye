export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'INFO';

export type TriggerCategory = 'FLIGHTS' | 'MARITIME' | 'CYBER' | 'DISINFO' | 'NEWS' | 'EVENTS';

export interface GeofenceTriggerConfig {
  flights: boolean;
  maritime: boolean;
  cyber: boolean;
  disinfo: boolean;
  news: boolean;
  events: boolean;
  militaryOnlyFlights?: boolean;
  minFlightSpeedKnots?: number;
  minVesselSpeedKnots?: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  description?: string;
  category: 'MARITIME' | 'AIRSPACE' | 'STRATEGIC_CHOKEPOINT' | 'CRITICAL_INFRASTRUCTURE' | 'BORDER_SURVEILLANCE' | 'CUSTOM';
  severity: SeverityLevel;
  color: string; // Hex e.g. '#06b6d4', '#ef4444', '#f59e0b', '#10b981', '#a855f7'
  coordinates: [number, number][]; // Polygon vertices [[lng, lat], [lng, lat], ...]
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  triggers: GeofenceTriggerConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  breachCount: number;
  lastBreachTimestamp?: number;
}

export interface WatchlistRule {
  id: string;
  label: string;
  keywords: string[]; // e.g. ["Drone", "Tu-95", "LockBit", "Dark Fleet"]
  category: 'KEYWORD' | 'ACTOR' | 'CALLSIGN' | 'VESSEL_IMO' | 'CRYPTO_WALLET';
  severity: SeverityLevel;
  color: string;
  enabled: boolean;
  createdAt: string;
  matchCount: number;
  lastMatchTimestamp?: number;
}

export type BreachTargetType = 'AIRCRAFT' | 'VESSEL' | 'CYBER_THREAT' | 'DISINFO_CAMPAIGN' | 'NEWS_EVENT' | 'WATCHLIST_KEYWORD';

export interface SentinelIncident {
  id: string;
  timestamp: number;
  zoneId?: string;
  zoneName?: string;
  ruleId?: string;
  ruleLabel?: string;
  targetId: string;
  targetName: string;
  targetType: BreachTargetType;
  coordinates: [number, number]; // [lng, lat]
  severity: SeverityLevel;
  details: string;
  rawMetadata?: Record<string, any>;
  acknowledged: boolean;
}

export interface DrawModeState {
  active: boolean;
  zoneName: string;
  zoneCategory: GeofenceZone['category'];
  zoneSeverity: SeverityLevel;
  zoneColor: string;
  vertices: [number, number][]; // [lng, lat][]
  triggers: GeofenceTriggerConfig;
}
