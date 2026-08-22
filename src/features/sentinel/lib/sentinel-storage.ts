import type { GeofenceZone, WatchlistRule, SentinelIncident } from '../types';
import { DEFAULT_GEOFENCE_ZONES, DEFAULT_WATCHLIST_RULES } from './sentinel-presets';
import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export const SENTINEL_ZONES_KEY = 'adeloopeye:sentinel:zones:v1';
export const SENTINEL_RULES_KEY = 'adeloopeye:sentinel:rules:v1';
export const SENTINEL_INCIDENTS_KEY = 'adeloopeye:sentinel:incidents:v1';

export function loadSentinelZones(): GeofenceZone[] {
  if (typeof window === 'undefined') return DEFAULT_GEOFENCE_ZONES;
  try {
    const raw = localStorage.getItem(SENTINEL_ZONES_KEY);
    if (!raw) return DEFAULT_GEOFENCE_ZONES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GEOFENCE_ZONES;
  } catch {
    return DEFAULT_GEOFENCE_ZONES;
  }
}

export function saveSentinelZones(zones: GeofenceZone[]): void {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return;
  try {
    localStorage.setItem(SENTINEL_ZONES_KEY, JSON.stringify(zones));
    window.dispatchEvent(new CustomEvent('adeloopeye-sentinel-zones-changed'));
  } catch {}
}

export function loadSentinelRules(): WatchlistRule[] {
  if (typeof window === 'undefined') return DEFAULT_WATCHLIST_RULES;
  try {
    const raw = localStorage.getItem(SENTINEL_RULES_KEY);
    if (!raw) return DEFAULT_WATCHLIST_RULES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WATCHLIST_RULES;
  } catch {
    return DEFAULT_WATCHLIST_RULES;
  }
}

export function saveSentinelRules(rules: WatchlistRule[]): void {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return;
  try {
    localStorage.setItem(SENTINEL_RULES_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent('adeloopeye-sentinel-rules-changed'));
  } catch {}
}

export function loadSentinelIncidents(): SentinelIncident[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SENTINEL_INCIDENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function saveSentinelIncidents(incidents: SentinelIncident[]): void {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return;
  try {
    localStorage.setItem(SENTINEL_INCIDENTS_KEY, JSON.stringify(incidents.slice(0, 100)));
  } catch {}
}
