import { useQuery } from '@tanstack/react-query';

import type { DataArrays } from '@/features/map/lib/map-filter-engine';

import { publicConflictId } from '@/shared/lib/env';
import { api } from '@/shared/lib/query/client';
import { queryKeys, REFETCH, STALE } from '@/shared/lib/query/keys';

import type { Asset, CityMarker, ConflictRelationship, CyberThreat, HeatPoint, MaritimeLane, MaritimeVessel, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';
import type { ActorMeta } from '@/data/map-tokens';
import type { MapStory } from '@/types/domain';

const CONFLICT_ID = publicConflictId;

export type MapDataResponse = {
  strikeArcs: StrikeArc[];
  missileTracks: MissileTrack[];
  targets: Target[];
  assets: Asset[];
  threatZones: ThreatZone[];
  heatPoints: HeatPoint[];
  cyberThreats: CyberThreat[];
  conflictRelationships: ConflictRelationship[];
  cities: CityMarker[];
  actorMeta: Record<string, ActorMeta>;
  maritimeLanes?: MaritimeLane[];
  vessels?: MaritimeVessel[];
};

export type MapDataResult = DataArrays & { actorMeta: Record<string, ActorMeta> };

function toDataArrays(r: MapDataResponse): MapDataResult {
  return {
    strikes:    r.strikeArcs  ?? [],
    missiles:   r.missileTracks ?? [],
    targets:    r.targets  ?? [],
    assets:     r.assets   ?? [],
    zones:      r.threatZones ?? [],
    heat:       r.heatPoints  ?? [],
    cyberThreats: r.cyberThreats ?? [],
    conflictRelationships: r.conflictRelationships ?? [],
    cities:     r.cities ?? [],
    maritimeLanes: r.maritimeLanes ?? [],
    vessels:    r.vessels ?? [],
    actorMeta:  r.actorMeta ?? {},
  };
}

export function useMapData(id: string = CONFLICT_ID, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.map.data(id),
    queryFn: () => api.get<MapDataResponse>(`/conflicts/${id}/map/data`),
    enabled, // Only fetch when enabled
    staleTime: 12_000,
    refetchInterval: enabled ? 15_000 : false,
    refetchIntervalInBackground: false, // Don't update when tab not focused
    select: toDataArrays,
  });
}

export function useMapStories(id: string = CONFLICT_ID, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.map.stories(id),
    queryFn: () => api.get<MapStory[]>(`/conflicts/${id}/map/stories`),
    enabled, // Only fetch when enabled
    staleTime: STALE.SHORT,
    refetchInterval: enabled ? REFETCH.FAST : false, // More frequent for breaking world events
    refetchIntervalInBackground: false,
  });
}
