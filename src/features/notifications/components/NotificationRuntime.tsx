'use client';

import { useNotificationMonitor } from '@/features/notifications/hooks/use-notification-monitor';
import { useNewsPulse } from '@/shared/hooks/use-news-pulse';

export function NotificationRuntime() {
  useNotificationMonitor();
  useNewsPulse();

  return null;
}
