'use client';

import React, { useState, useMemo } from 'react';
import type { MapViewState } from '@deck.gl/core';
import { Map, useMap } from '@/components/ui/map';
import { MapCNDeckGLOverlay } from '@/features/map/components/MapCNDeckGLOverlay';
import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/features/map/components/map-styles';
import type { MapPageContext } from '@/features/map/components/use-map-page';
import { MobileFloatingControls } from '@/features/map/components/mobile/MobileFloatingControls';
import { MobileBottomSheet } from '@/features/map/components/mobile/MobileBottomSheet';
import { MobileLayersTab } from '@/features/map/components/mobile/MobileLayersTab';
import { MobileIntelTab } from '@/features/map/components/mobile/MobileIntelTab';
import { MobileSearchTab } from '@/features/map/components/mobile/MobileSearchTab';
import { MobileDetailPanel } from '@/features/map/components/mobile/MapDetailPanel';
import { SentinelHUD } from '@/features/sentinel/components/SentinelHUD';
import { DrawZoneToolbar } from '@/features/sentinel/components/DrawZoneToolbar';
import { getSentinelMapLayers } from '@/features/sentinel/components/SentinelMapLayers';
import { addDrawVertex, setSelectedZoneId, setHoveredZoneId } from '@/features/sentinel/state/sentinel-slice';
import { useSentinelMonitor } from '@/features/sentinel/hooks/use-sentinel-monitor';
import { useAppDispatch, useAppSelector } from '@/shared/state';

import '@/features/map/lib/deckgl-device';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Directly captures MapLibre clicks when Sentinel drawing mode is active on mobile.
 */
function MobileDrawMapClickHandler() {
  const { map, isLoaded } = useMap();
  const dispatch = useAppDispatch();
  const drawModeActive = useAppSelector(state => state.sentinel.drawMode.active);

  React.useEffect(() => {
    if (!map || !isLoaded || !drawModeActive) return;

    const handleMapClick = (e: any) => {
      if (!e.lngLat) return;
      const lng = Number(e.lngLat.lng.toFixed(5));
      const lat = Number(e.lngLat.lat.toFixed(5));
      dispatch(addDrawVertex([lng, lat]));
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, isLoaded, drawModeActive, dispatch]);

  return null;
}

type Props = {
  ctx: MapPageContext;
  embedded?: boolean;
};

export function MobileMapLayout({ ctx, embedded = false }: Props) {
  const {
    viewState,
    activeStory,
    selectedItem,
    showAllLabels,
    mapStyle,
    overlayVisibility,
    toggleOverlay,
    tooltip,
    layers,
    handleMapClick,
    setViewState,
    activateStory,
    setActiveStory,
    setSelectedItem,
    setShowAllLabels,
    setMapStyle,
    moroccoLayerToggles,
    toggleMoroccoLayerType,
    dataLayers,
    scope,
    setScope,
    showTerrain,
    toggleTerrain,
    terrainExaggeration,
    hillshadeIntensity,
    showRoads,
    show3DBuildings,
    setTerrainExaggeration,
    setHillshadeIntensity,
    setShowRoads,
    setShow3DBuildings,
    toggleDataLayer,
  } = ctx;

  const dispatch = useAppDispatch();
  const sentinel = useAppSelector(state => state.sentinel);

  // Bottom Sheet State
  const [activeTab, setActiveTab] = useState<'layers' | 'intel' | 'search'>('intel');
  const [sheetState, setSheetState] = useState<'collapsed' | 'peek' | 'expanded'>('peek');
  const [is3D, setIs3D] = useState(false);

  // Monitor geofence breaches in background
  useSentinelMonitor();

  // Sentinel Deck.gl Layers
  const sentinelLayers = useMemo(() => {
    return getSentinelMapLayers({
      zones: sentinel.zones,
      drawMode: sentinel.drawMode,
      breachingZoneIds: sentinel.breachingZoneIds,
      hoveredZoneId: sentinel.hoveredZoneId,
      selectedZoneId: sentinel.selectedZoneId,
      visible: true,
      zoom: viewState?.zoom ?? 3,
      onZoneClick: zone => dispatch(setSelectedZoneId(zone.id)),
      onZoneHover: zone => dispatch(setHoveredZoneId(zone ? zone.id : null)),
    });
  }, [
    sentinel.zones,
    sentinel.drawMode,
    sentinel.breachingZoneIds,
    sentinel.hoveredZoneId,
    sentinel.selectedZoneId,
    viewState?.zoom,
    dispatch,
  ]);

  const allLayers = useMemo(() => {
    return [...layers, ...sentinelLayers];
  }, [layers, sentinelLayers]);

  // Handler to fly to any coordinate on map
  const handleFlyTo = ({ lat, lng, zoom = 10 }: { lat: number; lng: number; zoom?: number }) => {
    setViewState({
      ...viewState,
      latitude: lat,
      longitude: lng,
      zoom,
      transitionDuration: 1200,
    });
    // Snap sheet down to peek so the user sees the map in view
    setSheetState('peek');
  };

  // Toggle 3D pitch
  const handleToggle3D = () => {
    setIs3D(prev => {
      const next = !prev;
      setViewState({
        ...viewState,
        pitch: next ? 50 : 0,
        bearing: next ? -15 : 0,
        transitionDuration: 800,
      });
      return next;
    });
  };

  const handleResetView = () => {
    setIs3D(false);
    setViewState({
      ...viewState,
      pitch: 0,
      bearing: 0,
      transitionDuration: 800,
    });
  };

  const onOverlayClick = (info: any) => {
    if (sentinel.drawMode.active && info.coordinate) {
      dispatch(addDrawVertex([info.coordinate[0], info.coordinate[1]]));
      return;
    }
    handleMapClick(info);
  };

  return (
    <div className="w-full h-full bg-zinc-950 overflow-hidden relative select-none">
      {/* ── 100% Full-Bleed Map Canvas ── */}
      <Map
        center={[viewState.longitude || 0, viewState.latitude || 0]}
        zoom={viewState.zoom || 2}
        pitch={viewState.pitch || 0}
        bearing={viewState.bearing || 0}
        // @ts-ignore
        style={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT}
      >
        <MapCNDeckGLOverlay
          layers={allLayers}
          getTooltip={tooltip as any}
          onClick={onOverlayClick as any}
        />
        <MobileDrawMapClickHandler />
      </Map>

      {/* ── Floating Tactical Top Controls & Quick Target Strip ── */}
      <MobileFloatingControls
        mapStyle={mapStyle}
        onStyleChange={setMapStyle}
        is3d={is3D}
        onToggle3D={handleToggle3D}
        bearing={viewState.bearing || 0}
        pitch={viewState.pitch || 0}
        onResetView={handleResetView}
        onCityFlyTo={handleFlyTo}
        activeStory={activeStory}
        onClearStory={() => setActiveStory(null)}
        embedded={embedded}
      />

      {/* ── Sentinel HUD & Geofence Drawing Modals ── */}
      <SentinelHUD />
      <DrawZoneToolbar />

      {/* ── Selected Map Object Card (Slide up above bottom sheet) ── */}
      {selectedItem && (
        <div className="absolute inset-x-2 bottom-16 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-zinc-950/95 border border-cyan-500/50 rounded-md shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[45vh] flex flex-col">
            <MobileDetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onSelectItem={setSelectedItem}
              onActivateStory={activateStory}
            />
          </div>
        </div>
      )}

      {/* ── Interactive Command Deck (Swipeable Bottom Sheet) ── */}
      <MobileBottomSheet
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sheetState={sheetState}
        onSheetStateChange={setSheetState}
      >
        {activeTab === 'layers' && (
          <MobileLayersTab
            dataLayers={dataLayers}
            onDataLayerToggle={toggleDataLayer}
            visibility={overlayVisibility}
            onVisibilityToggle={toggleOverlay}
            scope={scope}
            onScopeChange={setScope}
            moroccoLayerToggles={moroccoLayerToggles}
            onMoroccoLayerToggle={toggleMoroccoLayerType}
            showAllLabels={showAllLabels}
            onShowAllLabelsChange={setShowAllLabels}
            showTerrain={showTerrain}
            onTerrainToggle={toggleTerrain}
            terrainExaggeration={terrainExaggeration}
            onTerrainExaggerationChange={setTerrainExaggeration}
            show3DBuildings={show3DBuildings}
            onShow3DBuildingsChange={setShow3DBuildings}
            showRoads={showRoads}
            onShowRoadsChange={setShowRoads}
          />
        )}

        {activeTab === 'intel' && (
          <MobileIntelTab
            onFlyToLocation={handleFlyTo}
            onIntelItemClick={item => {
              if (item.coordinates) {
                handleFlyTo({ lat: item.coordinates[1], lng: item.coordinates[0], zoom: 10 });
              }
            }}
          />
        )}

        {activeTab === 'search' && (
          <MobileSearchTab onFlyToLocation={handleFlyTo} />
        )}
      </MobileBottomSheet>
    </div>
  );
}
