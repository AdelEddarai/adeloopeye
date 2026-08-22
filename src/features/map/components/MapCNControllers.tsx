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
    <div className="absolute top-3 left-32 z-30 flex items-center gap-1.5 p-1 rounded-sm bg-zinc-950/90 border border-zinc-800 shadow-xl backdrop-blur-md font-mono text-[10px] pointer-events-auto">
      {/* 3D Mode Button */}
      <button
        onClick={handle3DView}
        className="px-2 py-0.5 rounded-xs font-bold text-zinc-300 hover:text-cyan-300 hover:bg-zinc-900 transition-colors flex items-center gap-1"
        title="Tilt Camera to 3D View"
      >
        <Mountain size={11} className="text-cyan-400" />
        <span>3D</span>
      </button>

      {/* Cinematic Rotation Button */}
      <button
        onClick={toggleCinematic}
        className={`px-2 py-0.5 rounded-xs font-bold transition-all flex items-center gap-1 ${
          isCinematic
            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.4)] animate-pulse'
            : 'text-zinc-300 hover:text-blue-300 hover:bg-zinc-900'
        }`}
        title="Toggle Cinematic 360° Auto-Rotation"
      >
        {isCinematic ? <Square size={10} className="fill-current text-blue-400" /> : <Play size={10} className="fill-current text-blue-400" />}
        <span>{isCinematic ? 'STOP CINE' : 'CINEMATIC'}</span>
      </button>

      {/* Quick Reset to Top-Down 0° */}
      {(pitch > 0 || bearing !== 0) && (
        <button
          onClick={handleReset}
          className="px-1.5 py-0.5 rounded-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors flex items-center gap-0.5"
          title="Reset Camera to Top-Down North (0°)"
        >
          <RotateCcw size={10} />
          <span>0°</span>
        </button>
      )}

      {/* Small Pitch Indicator Badge */}
      {pitch > 0 && (
        <span className="text-[9px] text-zinc-400 px-1 border-l border-zinc-800">
          P:{pitch}°
        </span>
      )}
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

    // 1️⃣ Fly to arbitrary coordinates (from Link Analysis, Dossiers, Chokepoints, etc.)
    if (eventSelection.flyToCoords) {
      map.flyTo({
        center: [eventSelection.flyToCoords.coordinates[0], eventSelection.flyToCoords.coordinates[1]],
        zoom: eventSelection.flyToCoords.zoom,
        duration: 1500,
      });
      return;
    }

    // 2️⃣ Fly to a selected event by ID (from Morocco layer / event list)
    if (eventSelection.selectedEventId) {
      // Ensure Morocco layer is visible when selecting events
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
        return;
      }
      // If event not found but has a location, fall through to location handler
    }

    // 3️⃣ Fly to a named location (from city/location selection)
    if (eventSelection.selectedLocation) {
      const coordinates = getCoordinatesForLocation(eventSelection.selectedLocation);
      if (coordinates) {
        map.flyTo({
          center: [coordinates.lng, coordinates.lat],
          zoom: coordinates.zoom || 11,
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
