import type {
  ActorKey,
  InstallationStatus,
  InstallationType,
  KineticStatus,
  KineticType,
  MarkerCategory,
  Priority,
  ZoneType,
} from './map-tokens';

export type { ActorKey };

export type StrikeArc = {
  id:        string;
  sourceEventId?: string | null;
  actor:     ActorKey;
  priority:  Priority;
  category:  Extract<MarkerCategory, 'KINETIC'>;
  type:      Extract<KineticType, 'AIRSTRIKE' | 'NAVAL_STRIKE'>;
  status:    Extract<KineticStatus, 'COMPLETE'>;
  timestamp: string;
  from:      [number, number];
  to:        [number, number];
  label:     string;
  severity:  'CRITICAL' | 'HIGH';
  url?:      string | null;
  source?:   string | null;
};

export type MissileTrack = {
  id:        string;
  sourceEventId?: string | null;
  actor:     ActorKey;
  priority:  Priority;
  category:  Extract<MarkerCategory, 'KINETIC'>;
  type:      Extract<KineticType, 'BALLISTIC' | 'CRUISE' | 'DRONE'>;
  status:    Extract<KineticStatus, 'INTERCEPTED' | 'IMPACTED'>;
  timestamp: string;
  from:      [number, number];
  to:        [number, number];
  label:     string;
  severity:  'CRITICAL' | 'HIGH';
  url?:      string | null;
  source?:   string | null;
};

export type Target = {
  id:          string;
  sourceEventId?: string | null;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'INSTALLATION'>;
  type:        InstallationType;
  status:      InstallationStatus;
  timestamp:   string;
  name:        string;
  position:    [number, number];
  description: string;
  url?:        string | null;
  source?:     string | null;
};

export type Asset = {
  id:          string;
  sourceEventId?: string | null;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'INSTALLATION'>;
  type:        Extract<InstallationType, 'CARRIER' | 'AIR_BASE' | 'NAVAL_BASE' | 'ARMY_BASE' | 'AIRCRAFT'>;
  status:      InstallationStatus;
  timestamp?:  string;
  name:        string;
  position:    [number, number];
  description?: string;
  heading?:    number; // For airplane rotation
  velocity?:   number | null;
  altitude?:   number | null;
  url?:        string | null;
  source?:     string | null;
};

export type ThreatZone = {
  id:          string;
  sourceEventId?: string | null;
  actor:       ActorKey;
  priority:    Priority;
  category:    Extract<MarkerCategory, 'ZONE'>;
  type:        ZoneType;
  timestamp?:  string;
  name:        string;
  coordinates: [number, number][];
  color:       [number, number, number, number];
  url?:        string | null;
  source?:     string | null;
};

export type HeatPoint = {
  id:             string;
  sourceEventId?: string | null;
  actor:          string;
  priority:       string;
  position:       [number, number];
  weight:         number;
  url?:           string | null;
  source?:        string | null;
};

export type CyberThreat = {
  id:          string;
  type:        'DDOS' | 'MALWARE' | 'INTRUSION' | 'PHISHING' | 'RANSOMWARE';
  severity:    'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  target:      string;
  targetCompany?: string;
  targetSector?: string;
  targetCountry?: string;
  source:      string;
  location:    string;
  position:    [number, number];
  timestamp:   string;
  description?: string;
  tags?:       string[];
  references?: string[];
  affectedSystems?: number;
  estimatedImpact?: string;
};

export type ConflictRelationship = {
  id:          string;
  sourceCountry: string;
  targetCountry: string;
  sourcePosition: [number, number];
  targetPosition: [number, number];
  intensity:   number; // 1-10
  type:        'MILITARY' | 'DIPLOMATIC' | 'ECONOMIC';
  description: string;
  timestamp:   string;
  articles:    string[];
};

export type CityMarker = {
  id:          string;
  name:        string;
  country:     string;
  position:    [number, number];
  population?: number;
  type:        'CAPITAL' | 'MAJOR_CITY' | 'CITY';
};

/** Approximate commercial sea lane / chokepoint polyline (not vessel positions). */
export type MaritimeLane = {
  id: string;
  name: string;
  kind: 'CONTAINER' | 'TANKER' | 'MIXED' | 'CHOKEPOINT';
  path: [number, number][];
};

/** Live-ish AIS snapshot (optional Datalastic or future providers). */
export type MaritimeVessel = {
  id: string;
  mmsi?:     string;
  name:      string;
  position:  [number, number];
  cog?:      number;
  sog?:      number;
  shipType?: string;
  flag?:     string;
  timestamp: string;
  source:    'DATALASTIC' | 'UNKNOWN';
};
