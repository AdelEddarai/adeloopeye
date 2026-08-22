import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GeofenceZone, WatchlistRule, SentinelIncident, DrawModeState, SeverityLevel } from '../types';
import { loadSentinelZones, loadSentinelRules, loadSentinelIncidents, saveSentinelZones, saveSentinelRules, saveSentinelIncidents } from '../lib/sentinel-storage';
import { computeBoundingBox } from '../lib/point-in-polygon';

export interface SentinelState {
  zones: GeofenceZone[];
  rules: WatchlistRule[];
  incidents: SentinelIncident[];
  selectedIncident: SentinelIncident | null;
  drawMode: DrawModeState;
  hudOpen: boolean;
  activeTab: 'zones' | 'watchlist' | 'incidents';
  hoveredZoneId: string | null;
  selectedZoneId: string | null;
  breachingZoneIds: string[];
}

const initialDrawMode: DrawModeState = {
  active: false,
  zoneName: 'Custom Surveillance Zone',
  zoneCategory: 'CUSTOM',
  zoneSeverity: 'HIGH',
  zoneColor: '#06b6d4',
  vertices: [],
  triggers: {
    flights: true,
    maritime: true,
    cyber: true,
    disinfo: true,
    news: true,
    events: true,
  },
};

const initialState: SentinelState = {
  zones: loadSentinelZones(),
  rules: loadSentinelRules(),
  incidents: loadSentinelIncidents(),
  selectedIncident: null,
  drawMode: initialDrawMode,
  hudOpen: false,
  activeTab: 'zones',
  hoveredZoneId: null,
  selectedZoneId: null,
  breachingZoneIds: [],
};

export const sentinelSlice = createSlice({
  name: 'sentinel',
  initialState,
  reducers: {
    // ── Zone Management ──
    addZone(state, action: PayloadAction<Omit<GeofenceZone, 'id' | 'createdAt' | 'breachCount' | 'bbox'>>) {
      const bbox = computeBoundingBox(action.payload.coordinates);
      const newZone: GeofenceZone = {
        ...action.payload,
        id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        bbox,
        createdAt: new Date().toISOString(),
        breachCount: 0,
      };
      state.zones.unshift(newZone);
      saveSentinelZones(state.zones);
    },
    updateZone(state, action: PayloadAction<Partial<GeofenceZone> & { id: string }>) {
      const idx = state.zones.findIndex(z => z.id === action.payload.id);
      if (idx !== -1) {
        if (action.payload.coordinates) {
          action.payload.bbox = computeBoundingBox(action.payload.coordinates);
        }
        state.zones[idx] = {
          ...state.zones[idx],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        saveSentinelZones(state.zones);
      }
    },
    deleteZone(state, action: PayloadAction<string>) {
      state.zones = state.zones.filter(z => z.id !== action.payload);
      if (state.selectedZoneId === action.payload) state.selectedZoneId = null;
      saveSentinelZones(state.zones);
    },
    toggleZone(state, action: PayloadAction<string>) {
      const zone = state.zones.find(z => z.id === action.payload);
      if (zone) {
        zone.enabled = !zone.enabled;
        saveSentinelZones(state.zones);
      }
    },
    setSelectedZoneId(state, action: PayloadAction<string | null>) {
      state.selectedZoneId = action.payload;
    },
    setHoveredZoneId(state, action: PayloadAction<string | null>) {
      state.hoveredZoneId = action.payload;
    },
    setBreachingZoneIds(state, action: PayloadAction<string[]>) {
      const current = state.breachingZoneIds;
      const next = action.payload;
      if (current.length === next.length && current.every((id, i) => id === next[i])) {
        return;
      }
      state.breachingZoneIds = action.payload;
    },

    // ── Watchlist Rules ──
    addRule(state, action: PayloadAction<Omit<WatchlistRule, 'id' | 'createdAt' | 'matchCount'>>) {
      const newRule: WatchlistRule = {
        ...action.payload,
        id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        matchCount: 0,
      };
      state.rules.unshift(newRule);
      saveSentinelRules(state.rules);
    },
    updateRule(state, action: PayloadAction<Partial<WatchlistRule> & { id: string }>) {
      const idx = state.rules.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) {
        state.rules[idx] = { ...state.rules[idx], ...action.payload };
        saveSentinelRules(state.rules);
      }
    },
    deleteRule(state, action: PayloadAction<string>) {
      state.rules = state.rules.filter(r => r.id !== action.payload);
      saveSentinelRules(state.rules);
    },
    toggleRule(state, action: PayloadAction<string>) {
      const rule = state.rules.find(r => r.id === action.payload);
      if (rule) {
        rule.enabled = !rule.enabled;
        saveSentinelRules(state.rules);
      }
    },

    // ── Incident Management ──
    addIncident(state, action: PayloadAction<Omit<SentinelIncident, 'id' | 'timestamp' | 'acknowledged'>>) {
      const incident: SentinelIncident = {
        ...action.payload,
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        acknowledged: false,
      };
      state.incidents.unshift(incident);
      if (state.incidents.length > 100) state.incidents.pop();

      // Increment breach count on zone/rule
      if (incident.zoneId) {
        const zone = state.zones.find(z => z.id === incident.zoneId);
        if (zone) {
          zone.breachCount += 1;
          zone.lastBreachTimestamp = incident.timestamp;
          if (!state.breachingZoneIds.includes(zone.id)) {
            state.breachingZoneIds.push(zone.id);
          }
        }
      }
      if (incident.ruleId) {
        const rule = state.rules.find(r => r.id === incident.ruleId);
        if (rule) {
          rule.matchCount += 1;
          rule.lastMatchTimestamp = incident.timestamp;
        }
      }

      saveSentinelIncidents(state.incidents);
    },
    acknowledgeIncident(state, action: PayloadAction<string>) {
      const inc = state.incidents.find(i => i.id === action.payload);
      if (inc) {
        inc.acknowledged = true;
        saveSentinelIncidents(state.incidents);
      }
    },
    clearIncidents(state) {
      state.incidents = [];
      state.breachingZoneIds = [];
      saveSentinelIncidents(state.incidents);
    },
    setSelectedIncident(state, action: PayloadAction<SentinelIncident | null>) {
      state.selectedIncident = action.payload;
    },

    // ── Drawing Mode ──
    startDrawing(state, action: PayloadAction<{ name?: string; severity?: SeverityLevel; color?: string } | undefined>) {
      state.drawMode = {
        ...initialDrawMode,
        active: true,
        zoneName: action?.payload?.name || `Zone Alpha-${state.zones.length + 1}`,
        zoneSeverity: action?.payload?.severity || 'HIGH',
        zoneColor: action?.payload?.color || '#06b6d4',
        vertices: [],
      };
      state.hudOpen = false; // Close HUD so user can see map
    },
    addDrawVertex(state, action: PayloadAction<[number, number]>) {
      if (state.drawMode.active) {
        state.drawMode.vertices.push(action.payload);
      }
    },
    undoDrawVertex(state) {
      if (state.drawMode.active && state.drawMode.vertices.length > 0) {
        state.drawMode.vertices.pop();
      }
    },
    cancelDrawing(state) {
      state.drawMode = initialDrawMode;
    },
    finishDrawing(state) {
      if (state.drawMode.active && state.drawMode.vertices.length >= 3) {
        const bbox = computeBoundingBox(state.drawMode.vertices);
        const newZone: GeofenceZone = {
          id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: state.drawMode.zoneName,
          category: state.drawMode.zoneCategory,
          severity: state.drawMode.zoneSeverity,
          color: state.drawMode.zoneColor,
          coordinates: [...state.drawMode.vertices],
          bbox,
          triggers: { ...state.drawMode.triggers },
          enabled: true,
          createdAt: new Date().toISOString(),
          breachCount: 0,
        };
        state.zones.unshift(newZone);
        saveSentinelZones(state.zones);
        state.drawMode = initialDrawMode;
        state.hudOpen = true; // Re-open HUD to show the new zone
      }
    },
    updateDrawConfig(state, action: PayloadAction<Partial<DrawModeState>>) {
      state.drawMode = { ...state.drawMode, ...action.payload };
    },

    // ── UI Controls ──
    setHudOpen(state, action: PayloadAction<boolean>) {
      state.hudOpen = action.payload;
    },
    toggleHud(state) {
      state.hudOpen = !state.hudOpen;
    },
    setActiveTab(state, action: PayloadAction<'zones' | 'watchlist' | 'incidents'>) {
      state.activeTab = action.payload;
    },
  },
});

export const {
  addZone,
  updateZone,
  deleteZone,
  toggleZone,
  setSelectedZoneId,
  setHoveredZoneId,
  setBreachingZoneIds,
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  addIncident,
  acknowledgeIncident,
  clearIncidents,
  setSelectedIncident,
  startDrawing,
  addDrawVertex,
  undoDrawVertex,
  cancelDrawing,
  finishDrawing,
  updateDrawConfig,
  setHudOpen,
  toggleHud,
  setActiveTab,
} = sentinelSlice.actions;

export default sentinelSlice.reducer;
