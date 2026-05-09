'use client';

import { useEffect, useState, useRef } from "react";
import { useMap } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { RotateCcw, Mountain, Play, Square } from "lucide-react";
import { useSelector } from "react-redux";

import type { RootState } from "@/shared/state";
import { getCoordinatesForLocation } from "@/shared/lib/location-coordinates";

/**
 * 3D View and Reset buttons with Pitch/Bearing display
 * Now features a Cinematic Auto-Rotation Mode
 */
export function MapCNController() {
  const { map, isLoaded } = useMap();
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [isCinematic, setIsCinematic] = useState(false);
  const cinematicRef = useRef<number>(0);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMove = () => {
      setPitch(Math.round(map.getPitch()));
      setBearing(Math.round(map.getBearing()));
    };

    map.on("move", handleMove);
    return () => {
      map.off("move", handleMove);
    };
  }, [map, isLoaded]);

  // Handle Cinematic Auto-Rotation Mode
  useEffect(() => {
    if (!map || !isLoaded || !isCinematic) {
      if (cinematicRef.current) {
        cancelAnimationFrame(cinematicRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    
    // Animate map rotation
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      // Rotate ~2 degrees per second
      const rotationSpeed = 2 / 1000; 
      
      const currentBearing = map.getBearing();
      map.rotateTo(currentBearing + rotationSpeed * delta, { duration: 0 });
      
      cinematicRef.current = requestAnimationFrame(animate);
    };
    
    // Pitch up before starting
    if (map.getPitch() < 45) {
      map.easeTo({ pitch: 60, duration: 1000 });
      setTimeout(() => {
        if (isCinematic) cinematicRef.current = requestAnimationFrame(animate);
      }, 1000);
    } else {
      cinematicRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (cinematicRef.current) cancelAnimationFrame(cinematicRef.current);
    };
  }, [map, isLoaded, isCinematic]);

  const handle3DView = () => {
    setIsCinematic(false);
    map?.easeTo({
      pitch: 60,
      bearing: -20,
      duration: 1000,
    });
  };

  const handleReset = () => {
    setIsCinematic(false);
    map?.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
  };

  const toggleCinematic = () => {
    setIsCinematic(!isCinematic);
  };

  if (!isLoaded) return null;

  return (
    <div className="absolute top-[72px] left-3 z-10 flex flex-col gap-2 pointer-events-auto">
      <div className="flex flex-col gap-2 bg-background/30 backdrop-blur-md border border-white/10 rounded-lg p-2 shadow-2xl">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-background/50 hover:bg-background/80 border-0"
            onClick={handle3DView}
          >
            <Mountain className="mr-1.5 size-4 text-blue-400" />
            3D
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-background/50 hover:bg-background/80 border-0"
            onClick={handleReset}
          >
            <RotateCcw className="mr-1.5 size-4 text-muted-foreground" />
            Reset
          </Button>
        </div>
        
        <Button 
          size="sm" 
          variant={isCinematic ? "default" : "secondary"}
          className={`w-full border-0 transition-all ${isCinematic ? 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-background/50 hover:bg-background/80'}`}
          onClick={toggleCinematic}
        >
          {isCinematic ? (
            <Square className="mr-1.5 size-4 fill-current" />
          ) : (
            <Play className="mr-1.5 size-4 fill-current" />
          )}
          {isCinematic ? 'Stop Cinematic' : 'Cinematic Mode'}
        </Button>
      </div>
      
      <div className="bg-background/30 rounded-md border border-white/10 px-3 py-2 font-mono text-xs backdrop-blur-md shadow-lg">
        <div className="text-blue-400 font-semibold tracking-wider mb-1">CAMERA</div>
        <div className="flex justify-between w-24">
          <span className="text-muted-foreground">PITCH</span>
          <span className="text-white">{pitch}°</span>
        </div>
        <div className="flex justify-between w-24">
          <span className="text-muted-foreground">BEAR</span>
          <span className="text-white">{bearing}°</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Handles programmatic flying when events or locations are selected via Redux.
 */
export function MapCNEventFlyTo({ moroccoData, showMoroccoLayer, setMoroccoLayerToggles, setShowMoroccoLayer }: any) {
  const { map, isLoaded } = useMap();
  const eventSelection = useSelector((state: RootState) => state.eventSelection);

  useEffect(() => {
    if (!map || !isLoaded || !eventSelection.followSelection) return;
    
    if (eventSelection.selectedEventId && eventSelection.timestamp) {
      console.log('🎯 MapCN received event selection:', eventSelection.selectedEventId, eventSelection.selectedLocation);
      
      if (!showMoroccoLayer && setShowMoroccoLayer) {
        setShowMoroccoLayer(true);
        if (setMoroccoLayerToggles) {
          setMoroccoLayerToggles({
            events: true,
            routes: true,
            weather: true,
            fires: true,
            infrastructure: true,
            connections: true,
          });
        }
      }
      
      const event = moroccoData?.events?.find((e: any) => e.id === eventSelection.selectedEventId);
      
      if (event && event.position) {
        map.flyTo({
          center: [event.position[0], event.position[1]],
          zoom: 12,
          duration: 1500,
        });
      } else if (eventSelection.selectedLocation) {
        const coordinates = getCoordinatesForLocation(eventSelection.selectedLocation);
        if (coordinates) {
          map.flyTo({
            center: [coordinates.lng, coordinates.lat],
            zoom: coordinates.zoom || 11,
            duration: 1500,
          });
        }
      } else if (eventSelection.flyToCoords) {
        map.flyTo({
          center: [eventSelection.flyToCoords.coordinates[0], eventSelection.flyToCoords.coordinates[1]],
          zoom: eventSelection.flyToCoords.zoom,
          duration: 1500,
        });
      }
    }
  }, [
    map, isLoaded, eventSelection.followSelection, eventSelection.selectedEventId, 
    eventSelection.selectedLocation, eventSelection.flyToCoords, eventSelection.timestamp, 
    moroccoData, showMoroccoLayer, setShowMoroccoLayer, setMoroccoLayerToggles
  ]);

  return null;
}
