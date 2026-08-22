'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/state';
import { addIncident, setBreachingZoneIds } from '../state/sentinel-slice';
import { isPointInPolygon } from '../lib/point-in-polygon';
import type { SentinelIncident, GeofenceZone, WatchlistRule } from '../types';
import { toast } from 'sonner';
import { playMonitoringAlert, playNotificationTone } from '@/features/notifications/lib/monitoring-sound';
import { readNotificationPrefs } from '@/features/notifications/lib/notification-storage';
import { showSystemNotification } from '@/features/notifications/lib/browser-notifications';

const COOLDOWN_MS = 3 * 60 * 1000; // 3-minute cooldown per (targetId + zoneId/ruleId) pair
const MONITOR_INTERVAL_MS = 3000; // Check perimeters every 3 seconds

export interface SentinelMonitorFeedProps {
  flights?: Array<{ id: string; name?: string; position: [number, number]; velocity?: number; category?: string; [key: string]: any }>;
  vessels?: Array<{ id: string; name?: string; position: [number, number]; speed?: number; [key: string]: any }>;
  events?: Array<{ id: string; title: string; location?: string; position?: [number, number]; severity?: string; type?: string; [key: string]: any }>;
  newsPulses?: Array<{ id: string; title: string; source?: string; position?: [number, number] | null; description?: string; [key: string]: any }>;
  disinfoNodes?: Array<{ id: string; label: string; coordinates?: [number, number]; riskScore?: number; [key: string]: any }>;
}

export function useSentinelMonitor(feeds: SentinelMonitorFeedProps) {
  const dispatch = useAppDispatch();
  const zones = useAppSelector(state => state.sentinel.zones);
  const rules = useAppSelector(state => state.sentinel.rules);

  // Keep latest references to prevent infinite re-render cycles
  const feedsRef = useRef(feeds);
  feedsRef.current = feeds;

  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const cooldownMapRef = useRef<Map<string, number>>(new Map());
  const prevBreachingIdsRef = useRef<string[]>([]);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Evaluation function running on a stable interval
    const evaluatePerimeters = () => {
      // Skip the very first evaluation on mount to prevent toast burst
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
      }

      const currentFeeds = feedsRef.current;
      const currentZones = zonesRef.current.filter(z => z.enabled);
      const currentRules = rulesRef.current.filter(r => r.enabled);

      if (currentZones.length === 0 && currentRules.length === 0) {
        if (prevBreachingIdsRef.current.length > 0) {
          prevBreachingIdsRef.current = [];
          dispatch(setBreachingZoneIds([]));
        }
        return;
      }

      const now = Date.now();
      const activeBreachingZones = new Set<string>();
      const newIncidents: SentinelIncident[] = [];
      const notifPrefs = readNotificationPrefs();

      // ── 1. EVALUATE FLIGHTS AGAINST GEOFENCE ZONES & WATCHLISTS ──
      if (currentFeeds.flights && currentFeeds.flights.length > 0) {
        for (const flight of currentFeeds.flights) {
          if (!flight.position || flight.position.length !== 2) continue;
          const [lng, lat] = flight.position;

          // Geofence checks
          for (const zone of currentZones) {
            if (!zone.triggers.flights) continue;

            if (zone.triggers.minFlightSpeedKnots && (flight.velocity || 0) * 1.944 < zone.triggers.minFlightSpeedKnots) {
              continue;
            }

            if (isPointInPolygon([lng, lat], zone.coordinates, zone.bbox)) {
              activeBreachingZones.add(zone.id);
              const cooldownKey = `zone-flight-${zone.id}-${flight.id}`;
              const lastAlert = cooldownMapRef.current.get(cooldownKey);

              if (!lastAlert || now - lastAlert > COOLDOWN_MS) {
                cooldownMapRef.current.set(cooldownKey, now);

                const incident: SentinelIncident = {
                  id: `inc-${now}-${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: now,
                  zoneId: zone.id,
                  zoneName: zone.name,
                  targetId: flight.id,
                  targetName: flight.name || `Flight ${flight.id}`,
                  targetType: 'AIRCRAFT',
                  coordinates: [lng, lat],
                  severity: zone.severity,
                  details: `Aircraft entered restricted zone "${zone.name}". Speed: ${Math.round((flight.velocity || 0) * 1.944)} kts.`,
                  acknowledged: false,
                };

                newIncidents.push(incident);
                triggerAlertUI(incident, notifPrefs);
              }
            }
          }

          // Watchlist callsign checks
          for (const rule of currentRules) {
            const nameStr = (flight.name || '').toLowerCase();
            const idStr = (flight.id || '').toLowerCase();

            const matches = rule.keywords.some(kw => {
              const lk = kw.toLowerCase();
              return nameStr.includes(lk) || idStr.includes(lk);
            });

            if (matches) {
              const cooldownKey = `rule-flight-${rule.id}-${flight.id}`;
              const lastAlert = cooldownMapRef.current.get(cooldownKey);

              if (!lastAlert || now - lastAlert > COOLDOWN_MS) {
                cooldownMapRef.current.set(cooldownKey, now);

                const incident: SentinelIncident = {
                  id: `inc-${now}-${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: now,
                  ruleId: rule.id,
                  ruleLabel: rule.label,
                  targetId: flight.id,
                  targetName: flight.name || `Flight ${flight.id}`,
                  targetType: 'WATCHLIST_KEYWORD',
                  coordinates: [lng, lat],
                  severity: rule.severity,
                  details: `Target matching Watchlist "${rule.label}" detected in airspace.`,
                  acknowledged: false,
                };

                newIncidents.push(incident);
                triggerAlertUI(incident, notifPrefs);
              }
            }
          }
        }
      }

      // ── 2. EVALUATE MARITIME VESSELS AGAINST GEOFENCE ZONES ──
      if (currentFeeds.vessels && currentFeeds.vessels.length > 0) {
        for (const vessel of currentFeeds.vessels) {
          if (!vessel.position || vessel.position.length !== 2) continue;
          const [lng, lat] = vessel.position;

          for (const zone of currentZones) {
            if (!zone.triggers.maritime) continue;

            if (isPointInPolygon([lng, lat], zone.coordinates, zone.bbox)) {
              activeBreachingZones.add(zone.id);
              const cooldownKey = `zone-vessel-${zone.id}-${vessel.id}`;
              const lastAlert = cooldownMapRef.current.get(cooldownKey);

              if (!lastAlert || now - lastAlert > COOLDOWN_MS) {
                cooldownMapRef.current.set(cooldownKey, now);

                const incident: SentinelIncident = {
                  id: `inc-${now}-${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: now,
                  zoneId: zone.id,
                  zoneName: zone.name,
                  targetId: vessel.id,
                  targetName: vessel.name || `Vessel ${vessel.id}`,
                  targetType: 'VESSEL',
                  coordinates: [lng, lat],
                  severity: zone.severity,
                  details: `Maritime vessel breached perimeter "${zone.name}".`,
                  acknowledged: false,
                };

                newIncidents.push(incident);
                triggerAlertUI(incident, notifPrefs);
              }
            }
          }
        }
      }

      // ── 3. EVALUATE NEWS PULSES AGAINST WATCHLIST RULES ──
      if (currentFeeds.newsPulses && currentFeeds.newsPulses.length > 0) {
        for (const pulse of currentFeeds.newsPulses) {
          const text = `${pulse.title} ${pulse.description || ''}`.toLowerCase();

          for (const rule of currentRules) {
            const matchedKw = rule.keywords.find(kw => text.includes(kw.toLowerCase()));
            if (matchedKw) {
              const cooldownKey = `rule-news-${rule.id}-${pulse.id}`;
              const lastAlert = cooldownMapRef.current.get(cooldownKey);

              if (!lastAlert || now - lastAlert > COOLDOWN_MS) {
                cooldownMapRef.current.set(cooldownKey, now);

                const coords: [number, number] = pulse.position || [-7.0, 31.7];

                const incident: SentinelIncident = {
                  id: `inc-${now}-${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: now,
                  ruleId: rule.id,
                  ruleLabel: rule.label,
                  targetId: pulse.id,
                  targetName: pulse.title.substring(0, 40) + '...',
                  targetType: 'NEWS_EVENT',
                  coordinates: coords,
                  severity: rule.severity,
                  details: `Keyword "${matchedKw}" triggered rule "${rule.label}".`,
                  acknowledged: false,
                };

                newIncidents.push(incident);
                triggerAlertUI(incident, notifPrefs);
              }
            }
          }
        }
      }

      // Dispatch new incidents (if any)
      for (const inc of newIncidents) {
        dispatch(addIncident(inc));
      }

      // Update breaching zones ONLY if changed
      const nextBreachingList = Array.from(activeBreachingZones).sort();
      const prevBreachingList = prevBreachingIdsRef.current.sort();

      const isDiff =
        nextBreachingList.length !== prevBreachingList.length ||
        nextBreachingList.some((id, i) => id !== prevBreachingList[i]);

      if (isDiff) {
        prevBreachingIdsRef.current = nextBreachingList;
        dispatch(setBreachingZoneIds(nextBreachingList));
      }
    };

    const intervalId = setInterval(evaluatePerimeters, MONITOR_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [dispatch]);
}

/**
 * Triggers Toast + Audio Chime + System Push for a breach incident
 */
function triggerAlertUI(incident: SentinelIncident, notifPrefs: any) {
  if (!notifPrefs.enabled) return;

  const severityIcon = incident.severity === 'CRITICAL' ? '🚨' : incident.severity === 'HIGH' ? '⚠️' : '🛡️';
  const title = `${severityIcon} SENTINEL: ${incident.zoneName ? `ZONE BREACH [${incident.zoneName}]` : `WATCHLIST [${incident.ruleLabel}]`}`;

  toast.error(title, {
    description: `${incident.targetName} — ${incident.details}`,
    duration: 8000,
    className:
      incident.severity === 'CRITICAL'
        ? 'border-red-500 border-2 bg-red-950/90 text-white font-mono'
        : 'border-amber-500 border bg-amber-950/90 text-white font-mono',
  });

  if (notifPrefs.playSound) {
    if (incident.severity === 'CRITICAL') {
      playMonitoringAlert('CRITICAL');
    } else if (incident.severity === 'HIGH') {
      playMonitoringAlert('HIGH');
    } else {
      playNotificationTone();
    }
  }

  // System notification for background tabs
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    void showSystemNotification({
      title,
      body: `${incident.targetName}: ${incident.details}`,
      eventId: incident.id,
      url: '/dashboard/map',
    }).catch(() => {});
  }
}
