/**
 * Alert Notification System for Morocco OSINT
 * Monitors new events and triggers visual/audio alerts for critical events
 * Integrates with existing notification system
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { MoroccoEvent } from '@/server/lib/morocco-intelligence-analyzer';
import { playNotificationSound } from '@/features/notifications/lib/notification-sound';
import { getNotificationPrefsSnapshot, parseNotificationPrefs } from '@/features/notifications/lib/notification-storage';

type AlertNotification = {
  id: string;
  event: MoroccoEvent;
  timestamp: number;
};

export function useAlertNotifications(events: MoroccoEvent[], enabled: boolean = true) {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const processedEventIds = useRef(new Set<string>());
  const lastCheckRef = useRef<number>(Date.now());

  // Monitor events for new critical/alert events
  useEffect(() => {
    if (!enabled || !events || events.length === 0) return;

    // Check notification settings
    const prefsSnapshot = getNotificationPrefsSnapshot();
    const prefs = parseNotificationPrefs(prefsSnapshot);
    const soundEnabled = prefs.enabled && prefs.playSound;

    const now = Date.now();
    const newAlerts: AlertNotification[] = [];

    events.forEach(event => {
      // Skip if already processed
      if (processedEventIds.current.has(event.id)) return;

      // Check if event is critical or high severity
      const isCritical = event.severity === 'CRITICAL' || event.severity === 'HIGH';
      
      // Check if event has alert keywords
      const alertKeywords = [
        'alert', 'urgent', 'emergency', 'critical', 'breaking',
        'warning', 'danger', 'severe', 'crisis', 'evacuation'
      ];
      const hasAlertKeyword = alertKeywords.some(keyword => 
        event.title.toLowerCase().includes(keyword) || 
        (event.description?.toLowerCase().includes(keyword) || false)
      );

      // Only alert for critical/high events or events with alert keywords
      if (isCritical || hasAlertKeyword) {
        // Check if event is recent (within last 5 minutes)
        const eventTime = new Date(event.timestamp).getTime();
        const isRecent = (now - eventTime) < 5 * 60 * 1000; // 5 minutes

        if (isRecent) {
          newAlerts.push({
            id: event.id,
            event,
            timestamp: now,
          });

          processedEventIds.current.add(event.id);

          // Show toast notification
          const severity = event.severity === 'CRITICAL' ? '🚨' : '⚠️';
          const icon = getEventIcon(event.type);
          
          toast.error(
            `${severity} ${event.location} - ${icon} ${event.type}: ${event.title}`,
            {
              duration: event.severity === 'CRITICAL' ? 10000 : 6000,
              position: 'top-right',
              className: event.severity === 'CRITICAL' 
                ? 'border-red-500 border-2 bg-red-950/90' 
                : 'border-orange-500 border bg-orange-950/80',
              description: event.description?.substring(0, 100),
            }
          );

          // Play sound using existing notification system (respects user settings)
          if (soundEnabled) {
            playNotificationSound();
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
    }

    lastCheckRef.current = now;
  }, [events, enabled]);

  // Clean up old alerts (older than 1 hour)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setAlerts(prev => prev.filter(alert => alert.timestamp > oneHourAgo));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => a.event.severity === 'CRITICAL').length,
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
    default: return '📍';
  }
}
