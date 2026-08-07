/**
 * Alert Notification System for Morocco OSINT
 * Monitors new events and triggers visual/audio/browser alerts for critical events
 * Real monitoring-center behavior: sound on by default, unread badge, bell panel.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { MoroccoEvent } from '@/server/lib/morocco-intelligence-analyzer';
import { playMonitoringAlert, playNotificationTone } from '@/features/notifications/lib/monitoring-sound';
import {
  registerNotificationWorker,
  requestNotificationPermission,
  showSystemNotification,
} from '@/features/notifications/lib/browser-notifications';

type AlertNotification = {
  id: string;
  event: MoroccoEvent;
  timestamp: number;
  read: boolean;
};

export function useAlertNotifications(events: MoroccoEvent[], enabled: boolean = true) {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundMuted, setSoundMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = window.localStorage.getItem('adeloopeye_sound_muted');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [pushGranted, setPushGranted] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    return 'Notification' in window && window.Notification.permission === 'granted';
  });
  const processedEventIds = useRef(new Set<string>());
  const swRef = useRef<ServiceWorkerRegistration | null>(null);
  const initializedRef = useRef(false);


  // Preload notification worker so system alerts are possible
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    registerNotificationWorker()
      .then(registration => {
        if (active && registration) swRef.current = registration;
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);

  // Monitor events for new events — every newly-arriving event triggers an alert.
  // The first batch seen on mount is seeded silently (no spam of existing news);
  // only events that appear AFTER that initial load ring a bell.
  useEffect(() => {
    if (!enabled || !events || events.length === 0) return;

    // First data arrival: seed the processed set so old news doesn't spam alerts
    if (!initializedRef.current) {
      events.forEach(event => processedEventIds.current.add(event.id));
      initializedRef.current = true;
      return;
    }

    const soundEnabled = !soundMuted;

    const now = Date.now();
    const newAlerts: AlertNotification[] = [];

    events.forEach(event => {
      // Skip if already processed
      if (processedEventIds.current.has(event.id)) return;

      processedEventIds.current.add(event.id);

      const alert: AlertNotification = {
        id: event.id,
        event,
        timestamp: now,
        read: false,
      };

      newAlerts.push(alert);

      // Show toast notification
      const severity = event.severity === 'CRITICAL' ? '🚨' : event.severity === 'HIGH' ? '⚠️' : '📰';
      const icon = getEventIcon(event.type);

      toast.error(
        `${severity} ${event.location} - ${icon} ${event.type}: ${event.title}`,
        {
          duration: event.severity === 'CRITICAL' ? 12000 : event.severity === 'HIGH' ? 8000 : 5000,
          position: 'top-right',
          className: event.severity === 'CRITICAL'
            ? 'border-red-500 border-2 bg-red-950/90'
            : event.severity === 'HIGH'
              ? 'border-orange-500 border bg-orange-950/80'
              : 'border-blue-500 border bg-blue-950/80',
          description: event.description?.substring(0, 100),
        }
      );

      // Ring for every new event (siren for critical/high, tone for the rest)
      if (soundEnabled) {
        if (event.severity === 'CRITICAL') {
          playMonitoringAlert('CRITICAL');
        } else if (event.severity === 'HIGH') {
          playMonitoringAlert('HIGH');
        } else {
          playNotificationTone();
        }
      }

      // Fire a native browser notification for critical events
      if (event.severity === 'CRITICAL' && pushGranted) {
        void showSystemNotification({
          title: `🚨 CRITICAL — ${event.location}`,
          body: `${event.type}: ${event.title}`,
          eventId: event.id,
          registration: swRef.current,
          url: '/morocco-map',
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const merged = [...newAlerts, ...prev].slice(0, 100); // Keep last 100 alerts
        setUnreadCount(prevUnread => prevUnread + newAlerts.length);
        return merged;
      });
    }
  }, [events, enabled, soundMuted, pushGranted]);

  // Clean up old alerts (older than 1 hour)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setAlerts(prev => {
        const filtered = prev.filter(alert => alert.timestamp > oneHourAgo);
        if (filtered.length !== prev.length) {
          setUnreadCount(prevUnread => Math.max(0, filtered.filter(a => !a.read).length));
        }
        return filtered;
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundMuted(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem('adeloopeye_sound_muted', String(next));
      } catch {}
      if (!next) playMonitoringAlert('MEDIUM'); // preview tone on unmute
      return next;
    });
  }, []);


  const enableNotifications = useCallback(async () => {
    const permission = await requestNotificationPermission();
    setPushGranted(permission === 'granted');
    return permission === 'granted';
  }, []);

  return {
    alerts,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.event.severity === 'CRITICAL').length,
    unreadCount,
    soundMuted,
    pushGranted,
    markAllRead,
    toggleSound,
    enableNotifications,
    playNotificationTone,
  };
}

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
    case 'EARTHQUAKE': return '🌋';
    case 'NATURAL_DISASTER': return '🌪️';
    case 'CONFLICT': return '⚔️';
    default: return '📍';
  }
}
