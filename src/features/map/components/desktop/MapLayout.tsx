'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { MapViewState } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import { Map } from '@/components/ui/map';
import { MapCNDeckGLOverlay } from '@/features/map/components/MapCNDeckGLOverlay';
import { MapCNController, MapCNEventFlyTo } from '@/features/map/components/MapCNControllers';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

import { DesktopDetailPanel } from '@/features/map/components/desktop/MapDetailPanel';
import { FlightTrackingPanel } from '@/features/map/components/FlightTrackingPanel';
import { MAP_STYLE_DARK, MAP_STYLE_SAT } from '@/features/map/components/map-styles';
import { UnifiedMapControls } from '@/features/map/components/UnifiedMapControls';
import { MapLegend } from '@/features/map/components/MapLegend';
import { MapOverlays } from '@/features/map/components/MapOverlays';
import { MapSidebar } from '@/features/map/components/MapSidebar';
import { MapTimeline } from '@/features/map/components/MapTimeline';
import type { MapPageContext } from '@/features/map/components/use-map-page';

import { getCoordinatesForLocation } from '@/shared/lib/location-coordinates';
import type { RootState } from '@/shared/state';
import { usePanelLayout } from '@/shared/hooks/use-panel-layout';

import '@/features/map/lib/deckgl-device';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  ctx: MapPageContext;
  embedded?: boolean;
};

export function DesktopMapLayout({ ctx, embedded = false }: Props) {
  const {
    viewState, activeStory, selectedItem, showAllLabels, sidebarOpen, mapStyle, stories,
    overlayVisibility, toggleOverlay, f, tooltip, layers, handleMapClick, showTimeline,
    setViewState, activateStory, setActiveStory, setSelectedItem, setShowAllLabels,
    toggleSidebar, setMapStyle, trackedFlight, setTrackedFlightId, focusOnTrackedFlight,
    showMoroccoLayer, moroccoData, moroccoLayerToggles, toggleMoroccoLayerType,
    showTerrain, toggleTerrain, terrainExaggeration, hillshadeIntensity, showRoads, show3DBuildings,
    setTerrainExaggeration, setHillshadeIntensity, setShowRoads, setShow3DBuildings,
    dataLayers, scope, toggleDataLayer, setShowMoroccoLayer, setMoroccoLayerToggles, setScope,
  } = ctx;

  const { defaultLayout, onLayoutChanged } = usePanelLayout({ id: 'map', panelIds: ['sidebar', 'canvas'] });

  // 🎯 Listen to event selection from Network Graph
  const eventSelection = useSelector((state: RootState) => state.eventSelection);

  // Track selected country for sidebar
  const selectedCountry = selectedItem?.type === 'country' ? {
    name: selectedItem.data.name,
    code: selectedItem.data.code,
  } : null;

  // MapCNEventFlyTo component handles event selection flying natively.
  // We no longer rely on viewState changes for flying to events since MapCN manages its own viewState.

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      className="w-full h-full bg-[var(--bg-app)] overflow-hidden min-w-0"
    >
      {/* ── Sidebar (stories) ── */}
      {sidebarOpen && (
        <>
          <ResizablePanel id="sidebar" defaultSize="25%" minSize="15%" maxSize="40%" className="flex flex-col overflow-hidden min-w-[280px]">
            <MapSidebar
              isOpen={sidebarOpen}
              stories={stories}
              activeStory={activeStory}
              onToggle={toggleSidebar}
              onActivateStory={story => {
                setSelectedItem(null);
                activateStory(story);
              }}
              onClearStory={() => setActiveStory(null)}
              onCitySelect={(city) => {
                // Navigate to city on map
                setViewState({
                  ...viewState,
                  longitude: city.lon,
                  latitude: city.lat,
                  zoom: 10,
                  transitionDuration: 1500,
                });
              }}
              onNewsClick={(news) => {
                // Navigate to news location on map
                if (news.location) {
                  setViewState({
                    ...viewState,
                    longitude: news.location.lon,
                    latitude: news.location.lat,
                    zoom: 12,
                    transitionDuration: 1500,
                  });
                }
              }}
              onIntelItemClick={(item) => {
                // Navigate to intel item location on map
                if (item.coordinates) {
                  setViewState({
                    ...viewState,
                    longitude: item.coordinates[0],
                    latitude: item.coordinates[1],
                    zoom: item.type === 'FLIGHT' ? 8 : 10,
                    transitionDuration: 1500,
                  });
                }
              }}
              selectedCountry={selectedCountry}
            />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}

      {/* ── Map canvas ── */}
      <ResizablePanel id="canvas" defaultSize="75%" minSize="40%" className="relative overflow-hidden min-w-0">
        <div className="relative overflow-hidden w-full h-full min-w-0">
          <Map
            center={[viewState.longitude || 0, viewState.latitude || 0]}
            zoom={viewState.zoom || 2}
            pitch={viewState.pitch || 0}
            bearing={viewState.bearing || 0}
            // @ts-ignore
            style={mapStyle === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_SAT}
          >
            <MapCNController />
            <MapCNEventFlyTo
              moroccoData={moroccoData}
              showMoroccoLayer={showMoroccoLayer}
              setShowMoroccoLayer={setShowMoroccoLayer}
              setMoroccoLayerToggles={setMoroccoLayerToggles}
            />
            <MapCNDeckGLOverlay
              layers={layers}
              getTooltip={tooltip as any}
              onClick={handleMapClick as any}
            />

            {/* Overlays */}
            <MapOverlays
              activeStory={activeStory}
              onClearStory={() => setActiveStory(null)}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={toggleSidebar}
              embedded={embedded}
              isMobile={false}
            />

            {overlayVisibility.legend && (
              <MapLegend
                hasPanel={!!selectedItem}
                timelineVisible={showTimeline}
              />
            )}

            {/* Unified Map Controls */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: selectedItem ? 344 : 12,
              zIndex: 10,
              transition: 'right 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <UnifiedMapControls
                mapStyle={mapStyle}
                onStyleChange={setMapStyle}
                showAllLabels={showAllLabels}
                onShowAllLabelsChange={setShowAllLabels}
                dataLayers={dataLayers}
                onDataLayerToggle={toggleDataLayer}
                scope={scope}
                onScopeChange={setScope}
                moroccoLayerToggles={moroccoLayerToggles}
                onMoroccoLayerToggle={toggleMoroccoLayerType}
                visibility={overlayVisibility}
                onVisibilityToggle={toggleOverlay}
                showTerrain={showTerrain}
                onTerrainToggle={toggleTerrain}
                terrainExaggeration={terrainExaggeration}
                onTerrainExaggerationChange={setTerrainExaggeration}
                hillshadeIntensity={hillshadeIntensity}
                onHillshadeIntensityChange={setHillshadeIntensity}
                showRoads={showRoads}
                onShowRoadsChange={setShowRoads}
                show3DBuildings={show3DBuildings}
                onShow3DBuildingsChange={setShow3DBuildings}
              />
            </div>





            {/* Flight tracking panel */}
            {trackedFlight && !selectedItem && (
              <FlightTrackingPanel
                trackedFlight={trackedFlight}
                onClearTracking={() => setTrackedFlightId(null)}
                onFocusFlight={focusOnTrackedFlight}
              />
            )}

            {/* Detail panel (absolute right side) */}
            <DesktopDetailPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onSelectItem={setSelectedItem}
              onActivateStory={activateStory}
            />

            {/* Timeline */}
            {showTimeline && (
              <MapTimeline
                rawData={f.rawData}
                dataExtent={f.dataExtent}
                viewExtent={f.viewExtent}
                onViewExtent={f.setViewExtent}
                timeRange={f.state.timeRange}
                onTimeRange={f.setTimeRange}
                isMobile={false}
              />
            )}
          </Map>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
