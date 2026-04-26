import { useEffect, useRef } from 'react';
import type { 
  MoroccoEvent, 
  MoroccoConnection, 
  MoroccoInfrastructure 
} from '@/server/lib/morocco-intelligence-analyzer';
import type {
  MoroccoWeather,
  MoroccoFire,
  MoroccoTraffic,
  MoroccoCommodity
} from '@/server/lib/api-clients/morocco-local-data';
import type { MoroccoRoute } from '@/server/lib/api-clients/morocco-routes-client';
export type CesiumToggles = {
  events: boolean;
  infrastructure: boolean;
  connections: boolean;
  routes: boolean;
  fires: boolean;
  weather: boolean;
  flights: boolean;
  cyber: boolean;
};

type MoroccoIntelPayload = {
  events?: MoroccoEvent[];
  connections?: MoroccoConnection[];
  infrastructure?: MoroccoInfrastructure[];
  weather?: MoroccoWeather[];
  traffic?: MoroccoTraffic[];
  commodities?: MoroccoCommodity[];
  fires?: MoroccoFire[];
  routes?: MoroccoRoute[];
};

type GlobalIntelPayload = {
  assets?: any[];
  strikes?: any[];
  missiles?: any[];
  targets?: any[];
  cyberThreats?: any[];
};

type UseCesiumDataProps = {
  viewer: any; 
  moroccoData: MoroccoIntelPayload | undefined;
  globalData: GlobalIntelPayload | undefined;
  toggles: CesiumToggles;
  setHoverInfo: (info: { x: number, y: number, title: string, details: string } | null) => void;
  onSelectFlight?: (info: { flightObj: any, x: number, y: number, entity: any }) => void;
};

const _assetCanvasCache: Record<string, HTMLCanvasElement> = {};

function createAssetCanvas(type: string = 'aviation'): HTMLCanvasElement {
  const safeType = type || 'aviation';
  const t = safeType.toLowerCase();
  
  let key = 'aviation';
  if (t.includes('maritime') || t.includes('ship') || t.includes('vessel') || t.includes('carrier') || t.includes('submarine')) key = 'maritime';
  else if (t.includes('logistics') || t.includes('freight') || t.includes('truck')) key = 'logistics';
  else if (t.includes('military') || t.includes('tank')) key = 'military';
  else if (t.includes('satellite') || t.includes('space')) key = 'satellite';

  // CRITICAL PERF: Return cached memory reference instead of allocating thousands of Canvas DOM elements
  if (_assetCanvasCache[key]) return _assetCanvasCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
     ctx.font = '18px sans-serif';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     
     let emoji = '✈️'; // Default aviation
     if (key === 'maritime') emoji = '🚢';
     else if (key === 'logistics') emoji = '🚛';
     else if (key === 'military') emoji = '🪖';
     else if (key === 'satellite') emoji = '🛰️';
     
     ctx.fillText(emoji, 16, 16);
  }
  
  _assetCanvasCache[key] = canvas;
  return canvas;
}

// --- PLATFORM AESTHETIC PARITY HELPERS ---
function getEventColor(Cesium: any, type: string, severity: string) {
  const alpha = severity === 'CRITICAL' ? 1.0 : severity === 'HIGH' ? 0.8 : 0.6;
  switch (type) {
    case 'POLITICAL': return new Cesium.Color(100/255, 150/255, 255/255, alpha);
    case 'DIPLOMATIC': return new Cesium.Color(150/255, 100/255, 255/255, alpha);
    case 'ECONOMIC': return new Cesium.Color(0, 200/255, 150/255, alpha);
    case 'INFRASTRUCTURE': return new Cesium.Color(1.0, 180/255, 0, alpha);
    case 'WEATHER': return new Cesium.Color(100/255, 200/255, 1.0, alpha);
    case 'FIRE': return new Cesium.Color(1.0, 80/255, 0, alpha);
    case 'SECURITY': return new Cesium.Color(200/255, 50/255, 50/255, alpha);
    default: return new Cesium.Color(150/255, 150/255, 150/255, alpha);
  }
}

function getEventIcon(type: string): string {
  switch (type) {
    case 'POLITICAL': return '🏛️';
    case 'DIPLOMATIC': return '🤝';
    case 'ECONOMIC': return '💼';
    case 'INFRASTRUCTURE': return '🏗️';
    case 'WEATHER': return '🌤️';
    case 'FIRE': return '🔥';
    case 'SECURITY': return '🛡️';
    default: return '📍';
  }
}

function getInfrastructureColor(Cesium: any, status: string) {
  switch (status) {
    case 'OPERATIONAL': return new Cesium.Color(0, 1.0, 100/255, 1.0);
    case 'DISRUPTED': return new Cesium.Color(1.0, 180/255, 0, 1.0);
    case 'CLOSED': return new Cesium.Color(1.0, 50/255, 50/255, 1.0);
    case 'UNDER_CONSTRUCTION': return new Cesium.Color(100/255, 150/255, 1.0, 1.0);
    default: return new Cesium.Color(150/255, 150/255, 150/255, 1.0);
  }
}

function getConnectionColor(Cesium: any, type: string) {
  switch (type) {
    case 'TRADE_ROUTE': return new Cesium.Color(0, 180/255, 1.0, 0.8);
    case 'DIPLOMATIC': return new Cesium.Color(150/255, 100/255, 1.0, 0.8);
    case 'ENERGY': return new Cesium.Color(1.0, 200/255, 0, 0.8);
    default: return new Cesium.Color(150/255, 150/255, 150/255, 0.8);
  }
}

function getCyberRouteColor(Cesium: any, status: string, condition: string) {
  if (status === 'CLOSED') return new Cesium.Color(1.0, 30/255, 30/255, 1.0); 
  if (status === 'DISRUPTED') return new Cesium.Color(1.0, 140/255, 0, 1.0); 
  if (condition === 'EXCELLENT') return new Cesium.Color(0, 250/255, 150/255, 0.8); 
  return new Cesium.Color(40/255, 150/255, 1.0, 0.8); 
}

function getStrikeColor(Cesium: any, type: string) {
  if (type === 'NAVAL_STRIKE') return new Cesium.Color(0, 150/255, 255/255, 0.8);
  return new Cesium.Color(255/255, 50/255, 50/255, 0.8);
}

function getTrafficColor(Cesium: any, type: string) {
  if (type === 'ROAD_CLOSED') return new Cesium.Color(255/255, 50/255, 50/255, 0.9);
  if (type === 'ACCIDENT') return new Cesium.Color(255/255, 100/255, 0, 0.9);
  if (type === 'CONGESTION') return new Cesium.Color(255/255, 180/255, 0, 0.8);
  return new Cesium.Color(255/255, 150/255, 0, 0.8);
}

function getPulseRadius(time?: any) {
    if (time && typeof time.secondsOfDay === 'number') {
        // Pure, deterministic physics frame based on JulianDate
        const ms = (time.dayNumber * 86400 + time.secondsOfDay) * 1000;
        const smoothOscillator = (Math.sin(ms / 1500) + 1) / 2;
        return 8000 + smoothOscillator * 4000;
    }
    // Fallback
    const now = Date.now();
    const smoothOscillator = (Math.sin(now / 1500) + 1) / 2;
    return 8000 + smoothOscillator * 4000;
}

// Applies a spiral offset to events sharing exact same coordinates
function offsetOverlappingEvents(events: MoroccoEvent[]) {
  const eventsByLoc = new Map<string, MoroccoEvent[]>();
  events.forEach(e => {
    if (!e.position || e.position.length !== 2) return;
    try {
      const lon = Number(e.position[0]);
      const lat = Number(e.position[1]);
      if (isNaN(lon) || isNaN(lat)) return;
      const key = `${lon.toFixed(2)},${lat.toFixed(2)}`;
      if (!eventsByLoc.has(key)) eventsByLoc.set(key, []);
      eventsByLoc.get(key)!.push(e);
    } catch(err) {}
  });

  const offsetEvents: (MoroccoEvent & { offsetPosition: [number, number] })[] = [];
  eventsByLoc.forEach((locEvents) => {
    if (locEvents.length === 1) {
      offsetEvents.push({ ...locEvents[0], offsetPosition: locEvents[0].position });
    } else {
      locEvents.forEach((ev, idx) => {
        const spiralTurns = Math.ceil(locEvents.length / 8);
        const angle = (idx / locEvents.length) * spiralTurns * 2 * Math.PI;
        const radius = 0.01 + (idx / locEvents.length) * 0.03; 
        offsetEvents.push({
          ...ev,
          offsetPosition: [ev.position[0] + Math.cos(angle) * radius, ev.position[1] + Math.sin(angle) * radius]
        });
      });
    }
  });
  return offsetEvents;
}

function getPlaceholderImage(type: string) {
  switch (type) {
    case 'FIRE': return 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&h=150&fit=crop';
    case 'SECURITY': return 'https://images.unsplash.com/photo-1544253139-652e90f2382e?w=400&h=150&fit=crop';
    case 'INFRASTRUCTURE': return 'https://images.unsplash.com/photo-1549449339-da76d296e85e?w=400&h=150&fit=crop';
    case 'WEATHER': return 'https://images.unsplash.com/photo-1561484930-998b6a7b22e8?w=400&h=150&fit=crop';
    case 'CYBER': return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=150&fit=crop';
    default: return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=150&fit=crop'; // Satellite top-down
  }
}

function isValidCoord(lon: any, lat: any) {
  const ln = Number(lon);
  const lt = Number(lat);
  return !isNaN(ln) && !isNaN(lt) && ln >= -180 && ln <= 180 && lt >= -90 && lt <= 90;
}


export function useCesiumData({ viewer, moroccoData, globalData, toggles, setHoverInfo, onSelectFlight }: UseCesiumDataProps) {
  const dsRef = useRef<any>(null); // Static data (Events, Traffic) - Clustered
  const dynamicDsRef = useRef<any>(null); // Dynamic data (Flights, Missiles) - Unclustered
  const activeFlightIdsRef = useRef<Set<string>>(new Set());
  const lastStaticHashRef = useRef<string>('');

  // Dedicated unmount cleanup for the Data Source
  useEffect(() => {
    return () => {
      if (viewer && !viewer.isDestroyed()) {
         if (dsRef.current) {
            try { viewer.dataSources.remove(dsRef.current, true); } catch(e){}
            dsRef.current = null;
         }
         if (dynamicDsRef.current) {
            try { viewer.dataSources.remove(dynamicDsRef.current, true); } catch(e){}
            dynamicDsRef.current = null;
         }
      }
    };
  }, [viewer]);

  // Setup UI Interaction Handlers (Hover, Click, Zoom) - Runs strictly ONCE per viewer
  useEffect(() => {
    if (!viewer) return;
    
    let handler: any = null;
    let isActive = true;

    import('cesium').then(Cesium => {
      if (!isActive || viewer.isDestroyed()) return;
      
      handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      
      // Setup Hover Interactions
      handler.setInputAction((movement: any) => {
        const pickedObject = viewer.scene.pick(movement.endPosition);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id;
          if (entity.name || entity.description) {
            setHoverInfo({
              x: movement.endPosition.x,
              y: movement.endPosition.y,
              title: entity.name || 'Details',
              details: entity.description ? entity.description.getValue(Cesium.JulianDate.now()) : ''
            });
            viewer.scene.canvas.style.cursor = 'pointer';
          }
        } else {
          setHoverInfo(null);
          viewer.scene.canvas.style.cursor = 'default';
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Setup Click/Zoom Tracking Interactions
      handler.setInputAction((movement: any) => {
        const pickedObject = viewer.scene.pick(movement.position);
        
        // Clear tracked entity manually if you click the earth
        if (!Cesium.defined(pickedObject) && viewer.trackedEntity) {
           viewer.trackedEntity = undefined;
           if (onSelectFlight) onSelectFlight(null as any);
           return;
        }

        if (Cesium.defined(pickedObject) && pickedObject.id) {
          const entity = pickedObject.id;
          
          // Flight Click Interaction -> Fire Modal
          if (entity.customProperty_isFlight && onSelectFlight) {
              const windowPosition = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, entity.position.getValue(Cesium.JulianDate.now()));
              if (windowPosition) {
                 onSelectFlight({
                    flightObj: { name: entity.name, description: entity.description ? entity.description.getValue() : '' },
                    x: movement.position.x,
                    y: movement.position.y,
                    entity: entity
                 });
              }
              return;
          }

          // If cluster clicked: zoom into it to shatter
          if (entity.customProperty_isCluster || (entity.label && entity.label.text && !isNaN(parseInt(entity.label.text.getValue(Cesium.JulianDate.now()))))) {
             try {
               const dest = entity.position.getValue(Cesium.JulianDate.now());
               viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(
                      Cesium.Cartographic.fromCartesian(dest).longitude * (180/Math.PI),
                      Cesium.Cartographic.fromCartesian(dest).latitude * (180/Math.PI),
                      30000 
                  ),
                  duration: 1.5,
                  easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
              });
             } catch(e){}
          } 
          // If Route/Connection clicked: frame the entire line via flyTo bounding sphere
          else if (entity.polyline) {
              viewer.flyTo(entity, {
                   duration: 1.5,
                   offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_FOUR, 3000000)
              });
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    });

    return () => {
      isActive = false;
      if (handler && !handler.isDestroyed()) {
        handler.destroy();
      }
    };
  }, [viewer, onSelectFlight, setHoverInfo]);

  useEffect(() => {
    if (!viewer) return;
    
    let isActive = true;

    const setupData = async () => {
      try {
        const Cesium = await import('cesium');
        
        // STRICT CHECK: If component unmounted or viewer destroyed during download, halt!
        if (!isActive || !viewer || viewer.isDestroyed()) return;

        // Setup Persistent Data Source with Clustering
        if (!dsRef.current) {
          const ds = new Cesium.CustomDataSource('OSINT');
          ds.clustering.enabled = true;
          ds.clustering.pixelRange = 45;
          ds.clustering.minimumClusterSize = 3;
          
          ds.clustering.clusterEvent.addEventListener((clusteredEntities: any, cluster: any) => {
            // Modern Hex/Circle Cluster Hub
            cluster.label.show = true;
            cluster.label.text = clusteredEntities.length.toString();
            cluster.label.font = 'bold 15px sans-serif';
            cluster.label.fillColor = Cesium.Color.WHITE;
            cluster.label.style = Cesium.LabelStyle.FILL_AND_OUTLINE;
            cluster.label.outlineColor = Cesium.Color.BLACK;
            cluster.label.outlineWidth = 2;
            cluster.label.pixelOffset = new Cesium.Cartesian2(0, 0);
            
            cluster.point.show = true;
            cluster.point.color = Cesium.Color.fromCssColorString('#0f172a'); 
            cluster.point.outlineColor = Cesium.Color.CYAN;
            cluster.point.outlineWidth = 3;
            cluster.point.pixelSize = 34;
            
            // Critical OSINT safeguarding
            cluster.point.disableDepthTestDistance = Number.POSITIVE_INFINITY;
            cluster.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
          });

          await viewer.dataSources.add(ds);
          if (!isActive) return;
          dsRef.current = ds;
        } else if (!viewer.dataSources.contains(dsRef.current)) {
          // React Strict Mode / HMR protection
          await viewer.dataSources.add(dsRef.current);
          if (!isActive) return;
        }

        if (!dynamicDsRef.current) {
          const dDs = new Cesium.CustomDataSource('DYNAMIC_OSINT');
          dDs.clustering.enabled = false; // CRITICAL PERFORMANCE FIX: Never cluster dynamically moving entities
          await viewer.dataSources.add(dDs);
          if (!isActive) return;
          dynamicDsRef.current = dDs;
        } else if (!viewer.dataSources.contains(dynamicDsRef.current)) {
          // React Strict Mode / HMR protection
          await viewer.dataSources.add(dynamicDsRef.current);
          if (!isActive) return;
        }

        if (!isActive) return; // Prevent concurrent loops from wiping each other


        const ds = dsRef.current;
        const dynamicDs = dynamicDsRef.current;

        // Suspend events to prevent flickering or blank frames during the wipe/rebuild cycle
        ds.entities.suspendEvents();
        dynamicDs.entities.suspendEvents();

        // Start fresh frame smoothly ONLY for non-flights.
        const flightIds = activeFlightIdsRef.current;
        
        const dynamicToRemove: any[] = [];
        dynamicDs.entities.values.forEach((ent: any) => {
            const isFlight = ent.id && typeof ent.id === 'string' && ent.id.startsWith('flight-');
            if (isFlight && !toggles.flights) {
               dynamicToRemove.push(ent);
            } else if (!flightIds.has(ent.id)) {
               dynamicToRemove.push(ent);
            }
        });
        dynamicToRemove.forEach((ent: any) => dynamicDs.entities.remove(ent));

        // --- ANTI-FLICKER DIFFERENTIAL SYNC ---
        // Instead of wiping the entire graphics card memory every 5 seconds, we hash the static data.
        // If the API data hasn't physically changed, we bypass the wipe and rebuild completely.
        const currentStaticHash = JSON.stringify({
           toggles: {
              events: toggles.events,
              infrastructure: toggles.infrastructure,
              connections: toggles.connections,
              routes: toggles.routes,
              fires: toggles.fires,
              weather: toggles.weather
           },
           data: moroccoData
        });

        const shouldRebuildStatic = currentStaticHash !== lastStaticHashRef.current;
        
        if (shouldRebuildStatic) {
           lastStaticHashRef.current = currentStaticHash;
           ds.entities.removeAll(); // Wipe static entities cleanly ONLY when data actually changes
        }

        // ------------ GLOBAL DATA ------------

        // 1. Assets (Flights, Maritime Ships, Logistics, Military)
        if (toggles.flights && globalData?.assets) {
          const currentFlightIds = new Set<string>();

          globalData.assets.forEach(asset => {
            if (!asset.position || asset.position.length !== 2) return;
            if (!isValidCoord(asset.position[0], asset.position[1])) return;
            const heading = asset.heading ? Cesium.Math.toRadians(asset.heading) : 0;
            const safeName = asset.name || 'UnknownAsset';
            const entityId = `flight-${asset.id || safeName.replace(/\s+/g, '')}`;
            currentFlightIds.add(entityId);

            let ent = dynamicDs.entities.getById(entityId);
            const targetPos = Cesium.Cartesian3.fromDegrees(asset.position[0], asset.position[1], 10000); // 10km high

            if (!ent) {
              ent = dynamicDs.entities.add({
                id: entityId,
                name: safeName,
                position: targetPos,
                billboard: {
                  image: createAssetCanvas(asset.type),
                  scaleByDistance: new Cesium.NearFarScalar(1.5e2, 0.7, 8.0e6, 0.25),
                  rotation: 0,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  // CRITICAL PERF: Stop drawing flights if camera is in orbit
                  distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 9000000.0)
                },
                path: {
                  // CRITICAL PERF: Drastically reduce calculation resolution and history buffer to prevent WebGL array overflow
                  resolution: 15,
                  material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: Cesium.Color.CYAN
                  }),
                  width: 3,
                  leadTime: 0,
                  trailTime: 300, // Show max 5 mins of history
                  show: false // Intentionally toggled via UI
                },
                description: `<strong>Type:</strong> ${asset.type || 'Aviation'}<br/><strong>Heading:</strong> ${asset.heading || 'N/A'}°<br/><strong>Altitude:</strong> ${asset.altitude || 'N/A'} ft`
              });
              ent.customProperty_isFlight = true;
            }

            // Update position immediately without relying on the Cesium Simulation Clock
            ent.position = targetPos as any;
            
            if (ent.billboard && (asset.type?.toLowerCase().includes('aviation') || asset.type?.toLowerCase().includes('flight'))) {
               ent.billboard.rotation = heading as any;
            }
          });

          // Cleanup stale flights that vanished from radar
          activeFlightIdsRef.current.forEach(id => {
            if (!currentFlightIds.has(id)) dynamicDs.entities.removeById(id);
          });
          activeFlightIdsRef.current = currentFlightIds;
        } else {
           // Completely wipe flights if toggled off
           activeFlightIdsRef.current.forEach(id => dynamicDs.entities.removeById(id));
           activeFlightIdsRef.current.clear();
        }

        // 2. Cyber Threats
        if (toggles.cyber && globalData?.cyberThreats) {
          globalData.cyberThreats.forEach(threat => {
            try {
              if (!threat.position || threat.position.length !== 2) return;
              if (!isValidCoord(threat.position[0], threat.position[1])) return;
              ds.entities.add({
                name: 'Cyber Threat',
                position: Cesium.Cartesian3.fromDegrees(Number(threat.position[0]), Number(threat.position[1]), 0),
                point: {
                  pixelSize: 20,
                  color: Cesium.Color.MAGENTA.withAlpha(0.6),
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                  text: '💻',
                  font: '16px sans-serif',
                  verticalOrigin: Cesium.VerticalOrigin.CENTER,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                description: `<strong>Severity:</strong> ${threat.severity || 'Unknown'}<br/><strong>Target:</strong> ${threat.target || 'Unknown'}`
              });
            } catch(e) {}
          });
        }

        // 3. Targets (Global)
        if (toggles.flights && globalData?.targets) {
           globalData.targets.forEach(target => {
              try {
                if (!target.position || target.position.length !== 2) return;
                if (!isValidCoord(target.position[0], target.position[1])) return;
                dynamicDs.entities.add({
                   name: target.name || 'Target',
                   position: Cesium.Cartesian3.fromDegrees(Number(target.position[0]), Number(target.position[1]), 0),
                   point: {
                      pixelSize: target.status === 'DESTROYED' ? 24 : 16,
                      color: target.status === 'DESTROYED' ? Cesium.Color.RED : Cesium.Color.ORANGE,
                      outlineColor: Cesium.Color.WHITE,
                      outlineWidth: 2,
                      disableDepthTestDistance: Number.POSITIVE_INFINITY
                   },
                   description: `<strong>Type:</strong> ${target.type}<br/><strong>Status:</strong> ${target.status}`
                });
              } catch(e) {}
           });
        }

        // 4. Strikes & Missiles
        if (toggles.flights && globalData?.strikes) {
           globalData.strikes.forEach(strike => {
              try {
                if (!strike.from || !strike.to || strike.from.length !== 2 || strike.to.length !== 2) return;
                if (!isValidCoord(strike.from[0], strike.from[1]) || !isValidCoord(strike.to[0], strike.to[1])) return;
                dynamicDs.entities.add({
                   polyline: {
                      positions: Cesium.Cartesian3.fromDegreesArray([
                         Number(strike.from[0]), Number(strike.from[1]),
                         Number(strike.to[0]), Number(strike.to[1])
                      ]),
                      width: 4,
                      material: new Cesium.PolylineGlowMaterialProperty({
                         glowPower: 0.2,
                         color: getStrikeColor(Cesium, strike.type)
                      }),
                      arcType: Cesium.ArcType.GEODESIC
                   },
                   name: 'Kinetic Strike',
                   description: `<strong>Type:</strong> ${strike.type}<br/><strong>Severity:</strong> ${strike.severity}`
                });
              } catch(e) {}
           });
        }
        
        if (toggles.flights && globalData?.missiles) {
           globalData.missiles.forEach(missile => {
              try {
                if (!missile.from || !missile.to || missile.from.length !== 2 || missile.to.length !== 2) return;
                if (!isValidCoord(missile.from[0], missile.from[1]) || !isValidCoord(missile.to[0], missile.to[1])) return;
                dynamicDs.entities.add({
                   polyline: {
                      positions: Cesium.Cartesian3.fromDegreesArray([
                         Number(missile.from[0]), Number(missile.from[1]),
                         Number(missile.to[0]), Number(missile.to[1])
                      ]),
                      width: 3,
                      material: new Cesium.PolylineDashMaterialProperty({
                         color: missile.status === 'INTERCEPTED' ? Cesium.Color.YELLOW : Cesium.Color.RED,
                         dashLength: 16.0
                      }),
                      arcType: Cesium.ArcType.GEODESIC
                   },
                   name: 'Missile Track',
                   description: `<strong>Status:</strong> ${missile.status}<br/><strong>Speed:</strong> Mach ${missile.speed}`
                });
              } catch(e) {}
           });
        }


        // ------------ MOROCCO DATA ------------

        // CRITICAL PERFORMANCE FIX: If data hasn't changed, skip rendering static layers completely.
        // Failing to do this causes 10,000 duplicate entities to be injected every 5 seconds!
        if (!shouldRebuildStatic) {
            ds.entities.resumeEvents();
            dynamicDs.entities.resumeEvents();
            viewer.scene.requestRender();
            return;
        }

        // 1. Events
        if (toggles.events && moroccoData?.events) {
          const offsetEvents = offsetOverlappingEvents(moroccoData.events);
          
          // Spatial buffer to track spawned rings and prevent overlapping Z-fighting / Opacity stacking
          const spawnedRings: {lon: number, lat: number}[] = [];

          offsetEvents.forEach((ev) => {
            try {
              if (!isValidCoord(ev.offsetPosition[0], ev.offsetPosition[1])) return;
              const lon = Number(ev.offsetPosition[0]);
              const lat = Number(ev.offsetPosition[1]);
              const position = Cesium.Cartesian3.fromDegrees(lon, lat, 100);
              const eventColor = getEventColor(Cesium, ev.type, ev.severity);
              
              // Determine if we should show a Tension Ring
              const isConflict = ['SECURITY', 'POLITICAL', 'PROTEST', 'CONFLICT', 'FIRE', 'ACCIDENT'].includes(ev.type as string);
              const isCritical = ev.severity === 'CRITICAL';
              let showRing = isConflict || isCritical;
              
              // Deduplication Logic: Suppress ring if another exists within ~20km (0.2 degrees)
              if (showRing) {
                  const tooClose = spawnedRings.some(ring => {
                      const dLon = ring.lon - lon;
                      const dLat = ring.lat - lat;
                      return Math.sqrt(dLon * dLon + dLat * dLat) < 0.2;
                  });

                  if (tooClose) {
                      showRing = false;
                  } else {
                      spawnedRings.push({ lon, lat });
                  }
              }
              
              ds.entities.add({
                name: ev.title,
                position: position,
                point: {
                  pixelSize: ev.severity === 'CRITICAL' ? 22 : 16,
                  color: eventColor,
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 3,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                ellipse: showRing ? {
                  // Uses the strict Cesium simulation time for mathematical purity.
                  // This provides a mathematical guarantee that major >= minor axis, completely destroying the DeveloperError.
                  semiMajorAxis: new Cesium.CallbackProperty((time: any) => getPulseRadius(time) + 50, false),
                  semiMinorAxis: new Cesium.CallbackProperty((time: any) => getPulseRadius(time), false),
                  material: new Cesium.ColorMaterialProperty(eventColor.withAlpha(0.15)),
                  outline: true,
                  outlineColor: eventColor.withAlpha(0.8),
                  outlineWidth: 2,
                  height: 10
                } : undefined,
                label: {
                  text: `${getEventIcon(ev.type)} ${ev.title.substring(0, 15)}...`,
                  font: 'bold 12px sans-serif',
                  pixelOffset: new Cesium.Cartesian2(0, -25),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                  fillColor: Cesium.Color.WHITE,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 3
                },
                description: `<div style="font-size: 11px;">
                  <img src="${ev.image || getPlaceholderImage(ev.type)}" onerror="this.src='${getPlaceholderImage(ev.type)}'" class="w-full h-24 object-cover rounded mb-2 border border-slate-700/50" />
                  <p><strong>Type:</strong> ${ev.type}</p>
                  <p><strong>Severity:</strong> ${ev.severity}</p>
                  <p class="mt-1">${ev.description}</p>
                  ${ev.source ? `<a href="${ev.source}" target="_blank" style="display:inline-block; margin-top:8px; padding:4px 8px; background:rgba(6,182,212,0.1); border:1px solid rgba(6,182,212,0.4); color:#22d3ee; border-radius:4px; text-decoration:none; font-family:monospace; font-size:10px;">ACCESS RAW INTEL ↗</a>` : ''}
                </div>`
              });
            } catch(e) {}
          });
        }

        // 2. Infrastructure
        if (toggles.infrastructure && moroccoData?.infrastructure) {
          moroccoData.infrastructure.forEach((infra) => {
            try {
              if (!infra.position || infra.position.length !== 2) return;
              if (!isValidCoord(infra.position[0], infra.position[1])) return;
              ds.entities.add({
                name: infra.name,
                position: Cesium.Cartesian3.fromDegrees(Number(infra.position[0]), Number(infra.position[1]), 0),
                point: {
                  pixelSize: 16,
                  color: getInfrastructureColor(Cesium, infra.status),
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                  text: `🏗️ ${infra.name}`,
                  font: 'bold 11px sans-serif',
                  pixelOffset: new Cesium.Cartesian2(0, -20),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                  fillColor: Cesium.Color.WHITE,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2
                },
                description: `<div style="font-size: 11px;">
                  <img src="${getPlaceholderImage('INFRASTRUCTURE')}" class="w-full h-16 object-cover rounded mb-2 border border-slate-700/50" />
                  <p><strong>Type:</strong> ${infra.type}</p>
                  <p><strong>Status:</strong> <span style="color: ${infra.status === 'OPERATIONAL' ? '#0f0' : '#f90'}">${infra.status}</span></p>
                  <p class="mt-1">${infra.description}</p>
                </div>`
              });
            } catch(e) {}
          });
        }

        // 3. Connections
        if (toggles.connections && moroccoData?.connections) {
          moroccoData.connections.forEach((conn) => {
            try {
              if (!conn.fromPosition || !conn.toPosition || conn.fromPosition.length !== 2 || conn.toPosition.length !== 2) return;
              if (!isValidCoord(conn.fromPosition[0], conn.fromPosition[1]) || !isValidCoord(conn.toPosition[0], conn.toPosition[1])) return;
              ds.entities.add({
                polyline: {
                  positions: Cesium.Cartesian3.fromDegreesArray([
                    Number(conn.fromPosition[0]), Number(conn.fromPosition[1]),
                    Number(conn.toPosition[0]), Number(conn.toPosition[1])
                  ]),
                  width: 3 + conn.intensity,
                  material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: new Cesium.CallbackProperty(() => {
                      return 0.15 + Math.abs(Math.sin((Date.now() + conn.toPosition[1]*10000) / 400)) * 0.15;
                    }, false),
                    color: getConnectionColor(Cesium, conn.type)
                  }),
                  arcType: Cesium.ArcType.GEODESIC
                },
                name: `${conn.from} ➔ ${conn.to}`,
                description: `<strong>Status:</strong> ${conn.status}<br/><strong>Type:</strong> ${conn.type}<br/><strong>Intensity:</strong> ${conn.intensity}/10`
              });
            } catch(e) {}
          });
        }

        // 4. Routes
        if (toggles.routes && moroccoData?.routes) {
          moroccoData.routes.forEach((route) => {
            try {
              if (!route.path || route.path.length < 1) return;
              const flatPath: number[] = [];
              let isValid = true;
              route.path.forEach((pt: any) => {
                 if (pt.length !== 2 || !isValidCoord(pt[0], pt[1])) isValid = false;
                 flatPath.push(Number(pt[0]), Number(pt[1]));
              });
              if (!isValid) return;

              ds.entities.add({
                polyline: {
                  positions: Cesium.Cartesian3.fromDegreesArray(flatPath),
                  width: 6,
                  material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: new Cesium.CallbackProperty(() => {
                      return 0.1 + Math.abs(Math.sin(Date.now() / 300)) * 0.2;
                    }, false),
                    color: getCyberRouteColor(Cesium, route.status, route.condition)
                  }),
                  clampToGround: true 
                },
                name: route.name,
                description: `<strong>Condition:</strong> ${route.condition}<br/><strong>Status:</strong> ${route.status}<br/>${route.description}`
              });
            } catch(e) {}
          });
        }

        // 5. Fires
        if (toggles.fires && moroccoData?.fires) {
          moroccoData.fires.forEach((fire) => {
            try {
              if (!fire.position || fire.position.length !== 2) return;
              if (!isValidCoord(fire.position[0], fire.position[1])) return;
              ds.entities.add({
                position: Cesium.Cartesian3.fromDegrees(Number(fire.position[0]), Number(fire.position[1]), 0),
                point: {
                  pixelSize: new Cesium.CallbackProperty(() => {
                    return 18 + Math.abs(Math.sin(Date.now() / 200)) * 6;
                  }, false),
                  color: Cesium.Color.ORANGERED.withAlpha(0.7),
                  outlineColor: Cesium.Color.YELLOW,
                  outlineWidth: 2,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                  text: '🔥',
                  font: '18px sans-serif',
                  pixelOffset: new Cesium.Cartesian2(0, -10),
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                name: `Fire near ${fire.location}`,
                description: `<div>
                  <img src="${getPlaceholderImage('FIRE')}" class="w-full h-16 object-cover rounded mb-2 border border-slate-700/50" />
                  <strong>Status:</strong> ${fire.status}<br/><strong>Severity:</strong> ${fire.severity}<br/>${fire.description}
                  </div>`
              });
            } catch(e) {}
          });
        }

        // 6. Weather
        if (toggles.weather && moroccoData?.weather) {
          moroccoData.weather.forEach((w) => {
            try {
              if (!w.position || w.position.length !== 2) return;
              if (!isValidCoord(w.position[0], w.position[1])) return;
              ds.entities.add({
                position: Cesium.Cartesian3.fromDegrees(Number(w.position[0]), Number(w.position[1]), 0),
                label: {
                  text: `🌤️ ${w.temperature}°C`,
                  font: '14px sans-serif',
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                name: `Weather in ${w.city}`,
                description: `<div>
                  <img src="${getPlaceholderImage('WEATHER')}" class="w-full h-16 object-cover rounded mb-2 border border-slate-700/50" />
                  <strong>Temperature:</strong> ${w.temperature}°C<br/><strong>Condition:</strong> ${w.condition || 'Unknown'}
                </div>`
              });
            } catch(e) {}
          });
        }

        // 7. Traffic
        if (toggles.routes && moroccoData?.traffic) {
           moroccoData.traffic.forEach(traffic => {
              try {
                if (!traffic.position || traffic.position.length !== 2) return;
                if (!isValidCoord(traffic.position[0], traffic.position[1])) return;
                ds.entities.add({
                   name: traffic.location || 'Traffic Incident',
                   position: Cesium.Cartesian3.fromDegrees(Number(traffic.position[0]), Number(traffic.position[1]), 0),
                   point: {
                      pixelSize: traffic.severity === 'CRITICAL' ? 18 : 12,
                      color: getTrafficColor(Cesium, traffic.type),
                      outlineColor: Cesium.Color.WHITE,
                      outlineWidth: 2,
                      disableDepthTestDistance: Number.POSITIVE_INFINITY
                   },
                   label: {
                      text: '🚧',
                      font: '16px sans-serif',
                      pixelOffset: new Cesium.Cartesian2(0, -15),
                      disableDepthTestDistance: Number.POSITIVE_INFINITY
                   },
                   description: `<strong>Type:</strong> ${traffic.type}<br/><strong>Severity:</strong> ${traffic.severity}`
                });
              } catch(e) {}
           });
        }

        // Resume events to execute the batch draw instantly
        ds.entities.resumeEvents();
        dynamicDs.entities.resumeEvents();

        // Ensure Cesium renders the new synchronous entities
        viewer.scene.requestRender();

      } catch (err) {
        console.error('Error rendering Cesium layers:', err);
        // Ensure events resume even on crash
        if (dsRef.current) dsRef.current.entities.resumeEvents();
        if (dynamicDsRef.current) dynamicDsRef.current.entities.resumeEvents();
      }
    };

    setupData();
    
    return () => {
      isActive = false;
      // DO NOT destroy dsRef.current here! It must persist across renders to allow differential updates.
    };

  }, [viewer, moroccoData, globalData, toggles]);
}
