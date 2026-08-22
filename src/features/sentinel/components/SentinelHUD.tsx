'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/state';
import {
  setHudOpen,
  toggleHud,
  setActiveTab,
  toggleZone,
  deleteZone,
  toggleRule,
  deleteRule,
  startDrawing,
  clearIncidents,
  setSelectedZoneId,
} from '../state/sentinel-slice';
import { flyToCoordinates } from '@/shared/state/event-selection-slice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ShieldAlert,
  Pentagon,
  Eye,
  Crosshair,
  AlertTriangle,
  FileDown,
  Plus,
  Trash2,
  Navigation,
  CheckCircle2,
  ChevronRight,
  X,
  Radar,
  Radio,
  Layers,
  Plane,
  Anchor,
  Globe2,
} from 'lucide-react';
import type { GeofenceZone, WatchlistRule, SentinelIncident } from '../types';

export function SentinelHUD() {
  const dispatch = useAppDispatch();
  const { zones, rules, incidents, hudOpen, activeTab, breachingZoneIds, drawMode } = useAppSelector(
    state => state.sentinel
  );

  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleLabel, setNewRuleLabel] = useState('');

  const activeBreachesCount = incidents.filter(i => !i.acknowledged).length;

  const handleFlyToZone = (zone: GeofenceZone) => {
    // Fly to center of bbox
    const centerLng = (zone.bbox[0] + zone.bbox[2]) / 2;
    const centerLat = (zone.bbox[1] + zone.bbox[3]) / 2;
    dispatch(
      flyToCoordinates({
        coordinates: [centerLng, centerLat],
        zoom: 9,
      })
    );
    dispatch(setSelectedZoneId(zone.id));
  };

  const handleFlyToIncident = (incident: SentinelIncident) => {
    dispatch(
      flyToCoordinates({
        coordinates: [incident.coordinates[0], incident.coordinates[1]],
        zoom: 11,
      })
    );
  };

  const handleExportSITREP = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      classification: 'RESTRICTED // OSINT PERIMETER ASSESSMENT',
      totalActiveZones: zones.filter(z => z.enabled).length,
      totalActiveRules: rules.filter(r => r.enabled).length,
      totalIncidentsLogged: incidents.length,
      activeBreaches: incidents.map(inc => ({
        timestamp: new Date(inc.timestamp).toISOString(),
        severity: inc.severity,
        target: inc.targetName,
        targetType: inc.targetType,
        location: inc.coordinates,
        zone: inc.zoneName || 'N/A',
        rule: inc.ruleLabel || 'N/A',
        details: inc.details,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENTINEL_SITREP_BREACH_REPORT_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If in draw mode, hide HUD
  if (drawMode.active) return null;

  return (
    <>
      {/* ── Floating Launcher HUD Button on Map ── */}
      <div className="absolute top-3 left-3 z-40">
        <Button
          size="sm"
          onClick={() => dispatch(toggleHud())}
          className={`h-7 px-2.5 font-mono text-[11px] font-bold rounded-sm border shadow-2xl backdrop-blur-xl transition-all ${
            hudOpen
              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-300 shadow-cyan-950/60 ring-1 ring-cyan-400'
              : activeBreachesCount > 0
              ? 'bg-red-950/95 border-red-500 text-red-300 animate-pulse shadow-red-950/60'
              : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:text-cyan-300 hover:border-zinc-700'
          }`}
        >
          <Radar size={13} className={`mr-1.5 ${activeBreachesCount > 0 ? 'text-red-400 animate-spin' : 'text-cyan-400'}`} />
          <span>SENTINEL</span>
          {activeBreachesCount > 0 && (
            <Badge variant="destructive" className="ml-1.5 text-[8px] px-1 py-0 h-3.5 bg-red-600 font-mono">
              {activeBreachesCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* ── Main Sentinel Command Center Slide-Over / Window ── */}
      {hudOpen && (
        <div className="absolute top-12 left-3 z-40 w-96 max-h-[calc(100vh-100px)] flex flex-col bg-zinc-950/95 border border-zinc-800 rounded-md shadow-2xl backdrop-blur-2xl font-mono text-xs overflow-hidden">
          {/* Title Header */}
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-cyan-400" />
              <div>
                <div className="font-bold text-zinc-100 tracking-wider">ADELOOP SENTINEL</div>
                <div className="text-[10px] text-zinc-400">PERIMETER SURVEILLANCE & WATCHLISTS</div>
              </div>
            </div>
            <button
              onClick={() => dispatch(setHudOpen(false))}
              className="text-zinc-500 hover:text-zinc-200 p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-900/30 text-[11px]">
            <button
              onClick={() => dispatch(setActiveTab('zones'))}
              className={`py-2 text-center font-bold transition-all border-b-2 ${
                activeTab === 'zones'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ZONES ({zones.length})
            </button>
            <button
              onClick={() => dispatch(setActiveTab('watchlist'))}
              className={`py-2 text-center font-bold transition-all border-b-2 ${
                activeTab === 'watchlist'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              WATCHLIST ({rules.length})
            </button>
            <button
              onClick={() => dispatch(setActiveTab('incidents'))}
              className={`py-2 text-center font-bold transition-all border-b-2 relative ${
                activeTab === 'incidents'
                  ? 'border-red-400 text-red-300 bg-red-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              BREACHES ({incidents.length})
              {activeBreachesCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block ml-1 animate-ping" />
              )}
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[550px]">
            {/* ── TAB 1: GEOFENCE ZONES ── */}
            {activeTab === 'zones' && (
              <div className="space-y-3">
                {/* Action: Draw Zone */}
                <Button
                  onClick={() => dispatch(startDrawing())}
                  className="w-full h-8 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Pentagon size={14} />
                  + DRAW NEW GEOFENCE POLYGON
                </Button>

                {/* Zones List */}
                <div className="space-y-2">
                  {zones.map(zone => {
                    const isBreaching = breachingZoneIds.includes(zone.id);
                    return (
                      <div
                        key={zone.id}
                        className={`p-2.5 rounded border transition-all ${
                          isBreaching
                            ? 'bg-red-950/40 border-red-500/60 ring-1 ring-red-500'
                            : zone.enabled
                            ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                            : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: zone.color }}
                            />
                            <span className="font-bold text-zinc-100 truncate max-w-[190px]">
                              {zone.name}
                            </span>
                          </div>
                          <Switch
                            checked={zone.enabled}
                            onCheckedChange={() => dispatch(toggleZone(zone.id))}
                          />
                        </div>

                        {zone.description && (
                          <p className="text-[10px] text-zinc-400 mb-2 line-clamp-2">
                            {zone.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 h-4 ${
                                zone.severity === 'CRITICAL'
                                  ? 'border-red-500 text-red-400'
                                  : 'border-cyan-500 text-cyan-400'
                              }`}
                            >
                              {zone.severity}
                            </Badge>
                            <span>
                              {zone.breachCount} breach{zone.breachCount === 1 ? '' : 'es'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFlyToZone(zone)}
                              className="h-6 px-1.5 text-zinc-300 hover:text-cyan-300 text-[10px]"
                              title="Fly Camera to Zone"
                            >
                              <Navigation size={11} className="mr-1" /> Focus
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dispatch(deleteZone(zone.id))}
                              className="h-6 px-1 text-zinc-500 hover:text-red-400"
                              title="Delete Zone"
                            >
                              <Trash2 size={11} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 2: TARGET WATCHLIST ── */}
            {activeTab === 'watchlist' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className={`p-2.5 rounded border transition-all ${
                        rule.enabled
                          ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                          : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Radio size={13} className="text-cyan-400" />
                          <span className="font-bold text-zinc-100">{rule.label}</span>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => dispatch(toggleRule(rule.id))}
                        />
                      </div>

                      {/* Keywords Chips */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {rule.keywords.map(kw => (
                          <span
                            key={kw}
                            className="bg-zinc-800 text-zinc-300 text-[9px] px-1.5 py-0.5 rounded border border-zinc-700 font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800/80">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 border-zinc-700 text-zinc-300"
                        >
                          {rule.category}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span>{rule.matchCount} matches</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dispatch(deleteRule(rule.id))}
                            className="h-5 px-1 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 3: REAL-TIME INCIDENT BREACHES ── */}
            {activeTab === 'incidents' && (
              <div className="space-y-3">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-bold">
                    {incidents.length} INCIDENTS LOGGED
                  </span>
                  <div className="flex items-center gap-1.5">
                    {incidents.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleExportSITREP}
                          className="h-6 px-2 text-[10px] border-zinc-700 text-zinc-300 hover:text-cyan-300"
                        >
                          <FileDown size={11} className="mr-1" /> SITREP
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dispatch(clearIncidents())}
                          className="h-6 px-1.5 text-[10px] text-zinc-500 hover:text-red-400"
                        >
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Incidents Feed */}
                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 space-y-1">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500/60" />
                    <p className="font-bold text-zinc-400">NO ACTIVE BREACHES</p>
                    <p className="text-[10px]">All perimeters and watchlists are clear.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incidents.map(inc => (
                      <div
                        key={inc.id}
                        className={`p-2.5 rounded border ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-red-950/30 border-red-800/80'
                            : 'bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {inc.targetType === 'AIRCRAFT' && <Plane size={13} className="text-purple-400" />}
                            {inc.targetType === 'VESSEL' && <Anchor size={13} className="text-blue-400" />}
                            {inc.targetType === 'NEWS_EVENT' && <Globe2 size={13} className="text-emerald-400" />}
                            {inc.targetType === 'WATCHLIST_KEYWORD' && <Radio size={13} className="text-amber-400" />}
                            <span className="font-bold text-zinc-100 truncate max-w-[170px]">
                              {inc.targetName}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(inc.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-[10px] text-zinc-300 mb-2 leading-relaxed">
                          {inc.details}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                          <Badge
                            variant="outline"
                            className={`text-[8px] px-1 py-0 h-3.5 ${
                              inc.severity === 'CRITICAL'
                                ? 'border-red-500 text-red-400'
                                : 'border-amber-500 text-amber-400'
                            }`}
                          >
                            {inc.zoneName ? `ZONE: ${inc.zoneName}` : `RULE: ${inc.ruleLabel}`}
                          </Badge>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFlyToIncident(inc)}
                            className="h-5 px-1.5 text-cyan-400 hover:text-cyan-300 text-[10px] font-bold"
                          >
                            <Navigation size={10} className="mr-1" /> LOCATE
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
