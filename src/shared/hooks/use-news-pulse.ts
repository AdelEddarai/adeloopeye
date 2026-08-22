'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/shared/state';
import { addPulses } from '@/shared/state/news-pulse-slice';

import { publicConflictId } from '@/shared/lib/env';

import { playNotificationSound } from '@/features/notifications/lib/notification-sound';
import { readNotificationPrefs } from '@/features/notifications/lib/notification-storage';
import { toast } from 'sonner';

const PULSE_URL = `/api/v1/news/pulse?limit=15`;
const POLL_INTERVAL_MS = 30_000;
const SEEN_KEY = 'adeloopeye:news-pulses:seen:v1';
const MAX_TOASTS = 3;

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // quota exceeded — drop oldest
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-100)));
    } catch {
      /* silent */
    }
  }
}

export function useNewsPulse() {
  const dispatch = useAppDispatch();
  const seenRef = useRef(loadSeen());
  const toastCountRef = useRef(0);
  const conflictId = publicConflictId;

  const fetchAndDispatch = useCallback(async () => {
    try {
      const res = await fetch(PULSE_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return;
      const json = await res.json();
      const now = new Date().toISOString();
      const pulses = (json.pulses ?? []) as {
        id: string;
        title: string;
        description: string;
        url: string;
        source: string;
        publishedAt: string;
        timestamp: string;
        position: [number, number] | null;
        receivedAt: string;
      }[];

      const newOnes = pulses.filter((p) => !seenRef.current.has(p.id));
      if (newOnes.length === 0) return;

      // Track seen
      for (const p of newOnes) seenRef.current.add(p.id);
      saveSeen(seenRef.current);

      // Dispatch to redux for map rendering (always — needed for map layer regardless of notification prefs)
      dispatch(addPulses(newOnes));

      // Read notification preferences — gate toasts and sounds on user settings
      const prefs = readNotificationPrefs();

      if (prefs.enabled && toastCountRef.current < MAX_TOASTS) {
        const latest = newOnes[newOnes.length - 1];
        toast(latest.title, {
          description: `${latest.source} · ${new Date(latest.publishedAt).toLocaleTimeString()}`,
          action: {
            label: 'Open',
            onClick: () => {
              window.open(latest.url, '_blank', 'noopener');
            },
          },
          duration: 6000,
        });
        toastCountRef.current += 1;
        if (prefs.playSound) {
          try { playNotificationSound(); } catch { /* silent */ }
        }
        // Reset toast counter after a burst cooldown
        setTimeout(() => { toastCountRef.current = 0; }, 30_000);
      }
    } catch {
      // silent — network or parse error
    }
  }, [dispatch]);

  useEffect(() => {
    void fetchAndDispatch();
    const id = setInterval(fetchAndDispatch, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchAndDispatch]);

  // Prune stale pulses on mount and periodically
  useEffect(() => {
    dispatch({ type: 'newsPulses/prunePulses' });
    const id = setInterval(() => dispatch({ type: 'newsPulses/prunePulses' }), 60_000);
    return () => clearInterval(id);
  }, [dispatch]);
}
