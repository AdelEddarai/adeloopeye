import type { Asset, CityMarker, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { StrategicChokepointData } from '@/data/strategic-chokepoints';
import type { DisinfoEdge, DisinfoNode } from '@/shared/hooks/use-live-disinformation';

export type DisinfoDetailPayload = {
  edge: DisinfoEdge;
  sourceNode?: DisinfoNode;
  targetNode?: DisinfoNode;
  campaignName: string;
  threatActor: string;
  confidenceScore: number;
  disarmTactics: string[];
  targetedSectors: string[];
  narrativeObjective: string;
  botnetVolume: number;
  sources: Array<{ title: string; domain: string; url: string }>;
};

export type SelectedItem =
  | { type: 'strike'; data: StrikeArc }
  | { type: 'missile'; data: MissileTrack }
  | { type: 'target'; data: Target }
  | { type: 'asset'; data: Asset }
  | { type: 'zone'; data: ThreatZone }
  | { type: 'city'; data: CityMarker }
  | { type: 'country'; data: { code: string; name: string; coordinates?: [number, number] } }
  | { type: 'chokepoint'; data: StrategicChokepointData }
  | { type: 'disinfo'; data: DisinfoDetailPayload };

