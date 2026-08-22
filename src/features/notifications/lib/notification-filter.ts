import type { EventNotificationCandidate } from '@/types/domain';

import type { NotificationPrefs, NotificationWidgetSources } from './notification-storage';

const SEVERITY_ORDER: Record<EventNotificationCandidate['severity'], number> = {
  CRITICAL: 3,
  HIGH: 2,
  STANDARD: 1,
};

/** Maps conflict event types to the widget source toggle that controls them. */
const EVENT_TYPE_TO_SOURCE: Partial<Record<string, keyof NotificationWidgetSources>> = {
  MILITARY: 'strikes',
  INTELLIGENCE: 'cyber',
  // DIPLOMATIC, ECONOMIC, HUMANITARIAN, POLITICAL → no dedicated toggle, always allowed
};

const MAX_NOTIFICATION_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

export function shouldNotifyEvent(event: EventNotificationCandidate, prefs: NotificationPrefs) {
  if (!prefs.enabled) return false;

  // Check widget source toggle — if the user toggled off this event's category, skip it
  const sourceKey = EVENT_TYPE_TO_SOURCE[event.type];
  if (sourceKey && !prefs.widgetSources[sourceKey]) return false;

  if (prefs.recentNotifiedIds.includes(event.id)) return false;
  if (event.sourceCount < 1) return false;
  if (Date.now() - new Date(event.timestamp).getTime() > MAX_NOTIFICATION_EVENT_AGE_MS) return false;

  return SEVERITY_ORDER[event.severity] >= SEVERITY_ORDER[prefs.minSeverity];
}

export function mergeRecentIds(recentIds: string[], nextId: string) {
  return [...new Set([...recentIds, nextId])].slice(-20);
}

