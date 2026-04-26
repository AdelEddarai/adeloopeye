'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { MapViewState, PickingInfo } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';

import type { OverlayVisibility } from '@/features/map/components/MapVisibilityMenu';
import type { SelectedItem } from '@/features/map/components/types';
import { useMapFilters } from '@/features/map/hooks/use-map-filters';
import { useMapLayers } from '@/features/map/hooks/use-map-layers';
import { createBuildTooltip } from '@/features/map/lib/map-tooltip';
import { useMapStories } from '@/features/map/queries';
import { useMoroccoIntelligence } from '@/shared/hooks/use-morocco-intelligence';
import {
  activateStory as activateStoryAction,
  setActiveStory as setActiveStoryAction,
  setMapStyle as setMapStyleAction,
  setSelectedItem as setSelectedItemAction,
  setShowAllLabels as setShowAllLabelsAction,
  setSidebarOpen as setSidebarOpenAction,
  setViewState as setViewStateAction,
  toggleSidebar as toggleSidebarAction,
  toggleTerrain as toggleTerrainAction,
  setTerrainExaggeration as setTerrainExaggerationAction,
  setHillshadeIntensity as setHillshadeIntensityAction,
  setShowRoads as setShowRoadsAction,
  setShow3DBuildings as setShow3DBuildingsAction,
  toggleDataLayer as toggleDataLayerAction,
  setScope as setScopeAction,
} from '@/features/map/state/map-slice';
import { selectEvent, selectLocation } from '@/shared/state/event-selection-slice';

import { track } from '@/shared/lib/analytics';

import type { Asset, CityMarker, MissileTrack, StrikeArc, Target, ThreatZone } from '@/data/map-data';

import { useAppDispatch, useAppSelector } from '@/shared/state';

export function useMapPage({ isMobile }: { isMobile: boolean }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewState = useAppSelector(s => s.map.viewState);
  const activeStory = useAppSelector(s => s.map.activeStory);
  const selectedItem = useAppSelector(s => s.map.selectedItem);
  const showAllLabels = useAppSelector(s => s.map.showAllLabels);
  const sidebarOpen = useAppSelector(s => s.map.sidebarOpen);
  const mapStyle = useAppSelector(s => s.map.mapStyle);
  const showTerrain = useAppSelector(s => s.map.showTerrain);
  const terrainExaggeration = useAppSelector(s => s.map.terrainExaggeration);
  const hillshadeIntensity = useAppSelector(s => s.map.hillshadeIntensity);
  const showRoads = useAppSelector(s => s.map.showRoads);
  const show3DBuildings = useAppSelector(s => s.map.show3DBuildings);
  const dataLayers = useAppSelector(s => s.map.dataLayers);
  const scope = useAppSelector(s => s.map.scope);
  const selectedEventId = useAppSelector(s => s.eventSelection.selectedEventId);

  const [overlayVisibility, setOverlayVisibility] = useState<OverlayVisibility>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
      ? { timeline: true, filters: false, legend: false, flights: true, events: true, cyberThreats: true }
      : { timeline: true, filters: true, legend: true, flights: true, events: true, cyberThreats: true }
  ));

  // Sync dataLayers from Redux to overlayVisibility and Morocco layer
  useEffect(() => {
    setOverlayVisibility(prev => ({
      ...prev,
      flights: dataLayers.flights,
    }));
  }, [dataLayers.flights]);

  // Sync routes toggle with Morocco layer
  useEffect(() => {
    if (dataLayers.routes) {
      setShowMoroccoLayer(true);
      setMoroccoLayerToggles(prev => ({ ...prev, routes: true }));
      dispatch(setScopeAction({ morocco: true }));
    }
  }, [dataLayers.routes]);

  useEffect(() => {
    if (dataLayers.weather) {
      setShowMoroccoLayer(true);
      setMoroccoLayerToggles(prev => ({ ...prev, weather: true }));
      dispatch(setScopeAction({ morocco: true }));
    }
  }, [dataLayers.weather]);

  useEffect(() => {
    if (dataLayers.fires) {
      setShowMoroccoLayer(true);
      setMoroccoLayerToggles(prev => ({ ...prev, fires: true }));
      dispatch(setScopeAction({ morocco: true }));
    }
  }, [dataLayers.fires]);

  useEffect(() => {
    if (dataLayers.infrastructure) {
      setShowMoroccoLayer(true);
      setMoroccoLayerToggles(prev => ({ ...prev, infrastructure: true }));
      dispatch(setScopeAction({ morocco: true }));
    }
  }, [dataLayers.infrastructure]);

  useEffect(() => {
    if (dataLayers.maritime) {
      dispatch(setScopeAction({ world: true }));
    }
  }, [dataLayers.maritime, dispatch]);

  const [trackedFlightId, setTrackedFlightId] = useState<string | null>(null);
  const [showMoroccoLayer, setShowMoroccoLayer] = useState(false);
  const prevMoroccoScopeRef = useRef(scope.morocco);

  useEffect(() => {
    setShowMoroccoLayer(scope.morocco);
  }, [scope.morocco]);

  useEffect(() => {
    const wasMoroccoEnabled = prevMoroccoScopeRef.current;
    prevMoroccoScopeRef.current = scope.morocco;
    if (!scope.morocco || wasMoroccoEnabled) return;

    // Run focus only once on world->morocco scope transition.
    dispatch(setViewStateAction({
      ...viewState,
      longitude: MOROCCO_CENTER[0],
      latitude: MOROCCO_CENTER[1],
      zoom: MOROCCO_ZOOM,
      transitionDuration: 2000,
    }));

    setMoroccoLayerToggles(prev => ({
      ...prev,
      events: true,
      routes: true,
      weather: true,
      fires: true,
      infrastructure: true,
      connections: true,
    }));
  }, [dispatch, scope.morocco, viewState]);

  // Morocco layer toggles for individual data types
  const [moroccoLayerToggles, setMoroccoLayerToggles] = useState({
    events: true,
    routes: true,
    weather: true,
    fires: true,
    infrastructure: true,
    connections: true,
  });

  // When scope.world is off, pause world feeds for performance.
  // Morocco data is controlled by scope.morocco.
  const enableOtherAPIs = scope.world;

  // Fetch Morocco intelligence data - only when enabled
  const { data: moroccoData } = useMoroccoIntelligence(showMoroccoLayer);
  const { data: stories = [], isLoading: storiesLoading } = useMapStories(undefined, enableOtherAPIs);

  // Morocco coordinates (center of the country)
  const MOROCCO_CENTER: [number, number] = [-7.0926, 31.7917]; // Between Casablanca and Marrakech
  const MOROCCO_ZOOM = 6;

  const toggleMoroccoLayer = useCallback(() => {
    const newState = !showMoroccoLayer;
    setShowMoroccoLayer(newState);

    // If enabling, focus camera on Morocco
    if (newState) {
      dispatch(setViewStateAction({
        ...viewState,
        longitude: MOROCCO_CENTER[0],
        latitude: MOROCCO_CENTER[1],
        zoom: MOROCCO_ZOOM,
        transitionDuration: 2000,
      }));

      track('map_object_clicked', {
        type: 'morocco_layer',
        action: 'enabled',
        from_location: [viewState.longitude, viewState.latitude],
      });

      console.log('[Morocco Layer] Enabled - Pausing other API calls');
    } else {
      track('map_object_clicked', {
        type: 'morocco_layer',
        action: 'disabled',
      });

      console.log('[Morocco Layer] Disabled - Resuming other API calls');
    }
  }, [showMoroccoLayer, viewState, dispatch]);

  const toggleMoroccoLayerType = useCallback((layer: keyof typeof moroccoLayerToggles) => {
    setMoroccoLayerToggles(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));

    // @ts-ignore
    track('map_layer_toggled', {
      layer: `morocco_${layer}`,
      enabled: !moroccoLayerToggles[layer],
    });
  }, [moroccoLayerToggles]);

  const toggleOverlay = useCallback((key: keyof OverlayVisibility) => {
    setOverlayVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const f = useMapFilters(enableOtherAPIs);
  const tooltip = useMemo(() => createBuildTooltip(f.actorMeta), [f.actorMeta]);

  const moroccoIntelForLayers = useMemo(() => {
    if (!showMoroccoLayer || !moroccoData) return null;
    return {
      events: moroccoLayerToggles.events ? moroccoData.events : [],
      connections: moroccoLayerToggles.connections ? moroccoData.connections : [],
      infrastructure: moroccoLayerToggles.infrastructure ? moroccoData.infrastructure : [],
      weather: moroccoLayerToggles.weather ? (moroccoData.weather || []) : [],
      traffic: moroccoData.traffic || [],
      commodities: moroccoData.commodities || [],
      fires: moroccoLayerToggles.fires ? (moroccoData.fires || []) : [],
      routes: moroccoLayerToggles.routes ? (moroccoData.routes || []) : [],
    };
  }, [showMoroccoLayer, moroccoData, moroccoLayerToggles]);

  const showMaritime = scope.world && dataLayers.maritime;

  const layers = useMapLayers({
    filtered: f.filtered,
    actorMeta: f.actorMeta,
    activeStory,
    selectedItem,
    viewState,
    isSatellite: mapStyle === 'satellite',
    isMobile,
    showAllLabels,
    showFlights: overlayVisibility.flights,
    showEvents: overlayVisibility.events,
    showCyberThreats: overlayVisibility.cyberThreats,
    showMaritime,
    moroccoIntelligence: moroccoIntelForLayers,
    showMoroccoLayer,
    selectedEventId,
  });

  const handleMapClick = useCallback(({ object, layer }: PickingInfo): SelectedItem | null => {
    if (!object || !layer) {
      dispatch(setSelectedItemAction(null));
      return null;
    }

    const id = layer.id;
    let next: SelectedItem | null = null;

    // Handle geopolitical relationship clicks with navigation animation
    if (id === 'geopolitical-relationships' || id === 'relationship-glow') {
      const relationship = object as any;

      // Calculate midpoint between source and target
      const midLon = (relationship.sourcePosition[0] + relationship.targetPosition[0]) / 2;
      const midLat = (relationship.sourcePosition[1] + relationship.targetPosition[1]) / 2;

      // Calculate distance to determine zoom level
      const lonDiff = Math.abs(relationship.sourcePosition[0] - relationship.targetPosition[0]);
      const latDiff = Math.abs(relationship.sourcePosition[1] - relationship.targetPosition[1]);
      const distance = Math.sqrt(lonDiff * lonDiff + latDiff * latDiff);

      // Zoom level based on distance (closer for nearby countries, farther for distant ones)
      const targetZoom = distance > 50 ? 3 : distance > 20 ? 4 : distance > 10 ? 5 : 6;

      // Animate camera to the relationship region
      dispatch(setViewStateAction({
        ...viewState,
        longitude: midLon,
        latitude: midLat,
        zoom: targetZoom,
        transitionDuration: 2000, // Smooth 2-second animation
        transitionInterpolator: new FlyToInterpolator(),
      }));

      // Track analytics
      track('map_object_clicked', {
        type: 'geopolitical_relationship',
        relationship_type: relationship.type,
        source: relationship.sourceCountry,
        target: relationship.targetCountry,
        intensity: relationship.intensity,
      });

      // Don't set as selected item (no detail panel for relationships yet)
      return null;
    }

    if (id === 'morocco-events-core' || id === 'morocco-event-icons' || id === 'morocco-event-labels') {
      const event = object as any;
      if (event.id) {
        dispatch(selectEvent({ eventId: event.id, location: event.location }));
      }
    } else if (id === 'morocco-connections' || id === 'morocco-connections-glow') {
      const connection = object as any;
      if (connection?.fromLocation) {
        const eventsAtLocation = (moroccoData?.events || [])
          .filter(e => e.location === connection.fromLocation || e.location === connection.toLocation)
          .map(e => e.id);
        dispatch(selectLocation({ location: connection.fromLocation, eventIds: eventsAtLocation }));
      }
    } else if (id === 'strikes') next = { type: 'strike', data: object as StrikeArc };
    else if (id === 'missiles') next = { type: 'missile', data: object as MissileTrack };
    else if (id === 'targets' || id === 'target-labels') next = { type: 'target', data: object as Target };
    else if (id === 'assets' || id === 'asset-labels') {
      next = { type: 'asset', data: object as Asset };
      // If clicking on a flight, track it
      const asset = object as Asset;
      if (asset.heading !== undefined) {
        setTrackedFlightId(asset.id);
        track('map_object_clicked', {
          type: 'flight_tracked',
          flight_id: asset.id,
          callsign: asset.name
        });
      }
    }
    else if (id === 'zones') next = { type: 'zone', data: object as ThreatZone };
    else if (id === 'cities' || id === 'city-labels') next = { type: 'city', data: object as CityMarker };

    dispatch(setSelectedItemAction(next));
    if (next) track('map_object_clicked', { type: next.type });
    return next;
  }, [dispatch, moroccoData?.events, viewState]);

  const showTimeline = overlayVisibility.timeline && !(isMobile && !!selectedItem);
  const isLoading = storiesLoading || f.isLoading;

  const storyId = searchParams.get('story');
  const prevStoryIdRef = useRef<string | null>(null);

  // Sync story from URL query parameter
  useEffect(() => {
    // Skip if story ID hasn't changed
    if (prevStoryIdRef.current === storyId) {
      return;
    }

    prevStoryIdRef.current = storyId;

    // No story in URL - clear active story
    if (!storyId) {
      dispatch(setActiveStoryAction(null));
      return;
    }

    // Find and activate the story
    const nextStory = stories.find(story => story.id === storyId) ?? null;
    if (nextStory) {
      dispatch(activateStoryAction(nextStory));
    }
  }, [storyId, stories, dispatch]);

  const syncStoryQuery = useCallback((story: Parameters<typeof activateStoryAction>[0] | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (story) next.set('story', story.id);
    else next.delete('story');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Get tracked flight data
  const trackedFlight = useMemo(() => {
    if (!trackedFlightId) return null;
    return f.filtered.assets.find(a => a.id === trackedFlightId) || null;
  }, [trackedFlightId, f.filtered.assets]);

  // Focus on tracked flight
  const focusOnTrackedFlight = useCallback(() => {
    if (!trackedFlight) return;
    dispatch(setViewStateAction({
      ...viewState,
      longitude: trackedFlight.position[0],
      latitude: trackedFlight.position[1],
      zoom: 8,
      transitionDuration: 1000,
    }));
  }, [trackedFlight, viewState, dispatch]);

  return {
    dispatch,
    viewState,
    activeStory,
    selectedItem,
    showAllLabels,
    sidebarOpen,
    mapStyle,
    showTerrain,
    terrainExaggeration,
    hillshadeIntensity,
    showRoads,
    show3DBuildings,
    dataLayers,
    scope,
    stories,
    overlayVisibility,
    toggleOverlay,
    f,
    tooltip,
    layers,
    handleMapClick,
    showTimeline,
    isLoading,
    trackedFlight,
    setTrackedFlightId,
    focusOnTrackedFlight,
    showMoroccoLayer,
    setShowMoroccoLayer, // Expose setter
    toggleMoroccoLayer,
    moroccoData,
    moroccoLayerToggles,
    setMoroccoLayerToggles, // Expose setter
    toggleMoroccoLayerType,
    // Actions (pre-bound for convenience)
    setViewState: (vs: MapViewState) => { dispatch(setViewStateAction(vs)); },
    activateStory: (story: Parameters<typeof activateStoryAction>[0]) => {
      syncStoryQuery(story);
      track('map_story_activated', { story_id: story?.id });
      return dispatch(activateStoryAction(story));
    },
    setActiveStory: (story: Parameters<typeof setActiveStoryAction>[0]) => {
      syncStoryQuery(story);
      return dispatch(setActiveStoryAction(story));
    },
    setSelectedItem: (item: Parameters<typeof setSelectedItemAction>[0]) => dispatch(setSelectedItemAction(item)),
    setShowAllLabels: (show: boolean) => dispatch(setShowAllLabelsAction(show)),
    toggleSidebar: () => dispatch(toggleSidebarAction()),
    setSidebarOpen: (open: boolean) => dispatch(setSidebarOpenAction(open)),
    setMapStyle: (style: Parameters<typeof setMapStyleAction>[0]) => { track('map_style_changed', { style }); return dispatch(setMapStyleAction(style)); },
    toggleTerrain: () => dispatch(toggleTerrainAction()),
    setTerrainExaggeration: (value: number) => dispatch(setTerrainExaggerationAction(value)),
    setHillshadeIntensity: (value: number) => dispatch(setHillshadeIntensityAction(value)),
    setShowRoads: (value: boolean) => dispatch(setShowRoadsAction(value)),
    setShow3DBuildings: (value: boolean) => dispatch(setShow3DBuildingsAction(value)),
    toggleDataLayer: (layer: Parameters<typeof toggleDataLayerAction>[0]) => dispatch(toggleDataLayerAction(layer)),
    setScope: (next: Parameters<typeof setScopeAction>[0]) => dispatch(setScopeAction(next)),
  };
}

export type MapPageContext = ReturnType<typeof useMapPage>;
