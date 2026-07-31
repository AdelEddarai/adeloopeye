/**
 * Alert Notification System
 * Monitors new events and triggers visual/audio alerts for critical/alert events
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { MoroccoEvent } from '@/server/lib/morocco-intelligence-analyzer';

type AlertNotification = {
  id: string;
  event: MoroccoEvent;
  timestamp: number;
};

export function useAlertNotifications(events: MoroccoEvent[], enabled: boolean = true) {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const processedEventIds = useRef(new Set<string>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCheckRef = useRef<number>(Date.now());

  // Initialize audio
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create audio element for alert sound
    const audio = new Audio();
    audio.preload = 'auto';
    
    // Use browser-native alert sound or create simple beep
    // You can replace this with a custom MP3/WAV file
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGJ0fPTgjMGHm7A7+OZSA0PVKnn77BZFgpCm+H0wXAiBTaP0/PYhzYGGGu87OSXRw0NUqzm7rVeGAo+mN70xnQlBTuU1/PdizUGHGnA7+CcSg0OVLLK7rpgGgo7ld/zy3cpBUCY2vbgji4GImzB7tyeTA0LWrfn77FgGQg5k970y3kpBUKa2/bigS8GJnDB7t6eTQ0KXLbn7rRgGQg2k9/0zH0qBUWa2/bihC4GJnHB7t2gTg0IXLTH7rFgGQgzkd70zn4rBUia2/blhS0GKHLh8d+gTQ0GWrPE7rBgGQgxj971z4ArBkqZ2/bmhi0GKHPi8eCfTA0GWLHx7rBgGQgvjt71z4ErBkqX2/bnhy0GKnXi8uCeSw0FU6/A7bBfGQgtjN/10IIsBk2Z3Pfohy0GLHbj8uGdSg0FUazE7bBfGAkrjN/10YMsBk6X2/bpiC0GK3jj8+GcSQ0EUKvB7a9fGAkpiN/10oMrBk+X2/fqiC0GK3nk8+KbSAwEUKfE7a9fGAgniN/104MrBk+W2/fqiSwGK3rk8+KaSQwET6PE7a9fGAgmhd/11IQsBlCW2/fqiSwGLH3k8+KYSAwETZ/E7a9fFwgkht/11IQrBlCW2/fqiSwGLH3k8+KXRwwETJ7B7bBfFwgjhd/11YQrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBfFwgihd/11YUrBlCW2/fpiSwGLH7k8+KXRgwETJ3E7bBf';
    
    audioRef.current = audio;
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Monitor events for new critical/alert events
  useEffect(() => {
    if (!enabled || !events || events.length === 0) return;

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
        }
      }
    });

    // Play alert sound if new alerts
    if (newAlerts.length > 0 && audioRef.current) {
      // Play sound (respect browser autoplay policies)
      audioRef.current.play().catch(err => {
        console.warn('Alert sound blocked by browser:', err);
      });
    }

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
