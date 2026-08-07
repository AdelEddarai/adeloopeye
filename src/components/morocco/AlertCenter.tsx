'use client';

import { useEffect, useRef, useState } from 'react';
import type { MoroccoEvent } from '@/server/lib/morocco-intelligence-analyzer';

type AlertItem = {
  id: string;
  event: MoroccoEvent;
  timestamp: number;
  read: boolean;
};

type AlertCenterProps = {
  alerts: AlertItem[];
  unreadCount: number;
  criticalAlerts: number;
  soundMuted: boolean;
  pushGranted: boolean | null;
  onMarkAllRead: () => void;
  onToggleSound: () => void;
  onEnableNotifications: () => void;
};

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const SEVERITY_STYLES: Record<string, { dot: string; label: string; ring: string }> = {
  CRITICAL: { dot: 'bg-red-500', label: 'text-red-300', ring: 'border-red-500/50' },
  HIGH: { dot: 'bg-orange-500', label: 'text-orange-300', ring: 'border-orange-500/40' },
  MEDIUM: { dot: 'bg-amber-400', label: 'text-amber-200', ring: 'border-amber-400/30' },
  LOW: { dot: 'bg-sky-400', label: 'text-sky-300', ring: 'border-sky-400/30' },
};

function getEventIcon(type: string): string {
  switch (type) {
    case 'POLITICAL': return '🏛️';
    case 'DIPLOMATIC': return '🤝';
    case 'ECONOMIC': return '💼';
    case 'INFRASTRUCTURE': return '🏗️';
    case 'WEATHER': return '🌤️';
    case 'FIRE': return '🔥';
    case 'PROTEST': return '📢';
    case 'ACCIDENT': return '⚠️';
    case 'INVESTMENT': return '💰';
    case 'TRADE': return '🚢';
    case 'TOURISM': return '✈️';
    case 'AGRICULTURE': return '🌾';
    case 'ENERGY': return '⚡';
    case 'SECURITY': return '🛡️';
    case 'TRANSPORT': return '🚗';
    case 'HEALTH': return '🏥';
    case 'EDUCATION': return '🎓';
    default: return '📍';
  }
}

export default function AlertCenter({
  alerts,
  unreadCount,
  criticalAlerts,
  soundMuted,
  pushGranted,
  onMarkAllRead,
  onToggleSound,
  onEnableNotifications,
}: AlertCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleAlerts = alerts.slice(0, 30);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-label="Alerts"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-xl transition-all ${
          unreadCount > 0
            ? 'border-red-500/50 bg-red-950/50 hover:bg-red-900/50'
            : 'border-white/10 bg-slate-950/70 hover:bg-slate-900/70'
        }`}
      >
        <span className="text-base leading-none">🔔</span>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.8)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Live pulsing ring when critical alerts exist */}
        {criticalAlerts > 0 && !open && (
          <span className="absolute inset-0 rounded-xl ring-2 ring-red-500/40 animate-ping [animation-duration:2s]" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 z-[300] w-[340px] max-h-[480px] flex flex-col rounded-xl border border-cyan-400/15 bg-slate-950/90 backdrop-blur-2xl shadow-[0_12px_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-[11px]">◈</span>
              <h4 className="font-bold text-[10px] tracking-[0.3em] text-slate-200">ALERT CENTER</h4>
              {unreadCount > 0 && (
                <span className="text-[8px] font-mono bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[9px] text-cyan-400 hover:text-cyan-200 font-mono tracking-wider uppercase transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <button
              onClick={onToggleSound}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-mono tracking-wider uppercase border transition-colors ${
                soundMuted
                  ? 'border-white/10 text-slate-500 hover:text-slate-300'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              }`}
              title="Toggle alert siren"
            >
              {soundMuted ? '🔇 Sound off' : '🔊 Sound on'}
            </button>
            <button
              onClick={() => playNotificationTone()}
              className="flex items-center gap-1 py-1 px-2 rounded-md text-[9px] font-mono tracking-wider uppercase border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 transition-colors hover:bg-cyan-500/20"
              title="Test ring bell sound"
            >
              🔔 Test Ring
            </button>
            {pushGranted !== true && (
              <button
                onClick={() => onEnableNotifications()}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-mono tracking-wider uppercase border border-blue-500/40 bg-blue-500/10 text-blue-300 transition-colors hover:bg-blue-500/20"
                title="Enable browser push notifications"
              >
                Push
              </button>
            )}
            <span className="ml-auto text-[8px] text-slate-500 font-mono tracking-widest">LIVE</span>
          </div>


          {/* Alert list */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {visibleAlerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-2xl mb-2">🛰️</div>
                <div className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                  No active alerts
                </div>
                <div className="text-[9px] text-slate-600 mt-1">
                  Monitoring 70+ sources in real time
                </div>
              </div>
            ) : (
              visibleAlerts.map(alert => {
                const style = SEVERITY_STYLES[alert.event.severity] ?? SEVERITY_STYLES.LOW;
                return (
                  <div
                    key={alert.id}
                    className={`px-4 py-2.5 hover:bg-white/[0.03] transition-colors ${alert.read ? 'opacity-60' : ''} border-l-2 ${style.ring}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${!alert.read ? 'animate-pulse' : ''}`} />
                      <span className={`text-[9px] font-bold tracking-wider ${style.label}`}>
                        {alert.event.severity}
                      </span>
                      <span className="text-[9px] text-slate-400">{getEventIcon(alert.event.type)} {alert.event.type}</span>
                      <span className="ml-auto text-[8px] text-slate-500 font-mono">{timeAgo(alert.timestamp)}</span>
                    </div>
                    <div className="text-[11px] text-slate-200 font-medium leading-snug">{alert.event.title}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                      📍 {alert.event.location} · {alert.event.source}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-[8px] text-slate-500 font-mono tracking-widest">
              {alerts.length} TOTAL · {criticalAlerts} CRITICAL
            </span>
            <span className="text-[8px] text-cyan-500/60 font-mono tracking-widest animate-pulse">● LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}
