'use client';

import { useState, useSyncExternalStore } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import {
  registerNotificationWorker,
  requestNotificationPermission,
  showSystemNotification,
} from '@/features/notifications/lib/browser-notifications';
import { playNotificationSound } from '@/features/notifications/lib/notification-sound';
import {
  getNotificationPrefsSnapshot,
  getServerNotificationPrefsSnapshot,
  type NotificationSeverity,
  parseNotificationPrefs,
  patchNotificationPrefs,
  subscribeToNotificationPrefs,
} from '@/features/notifications/lib/notification-storage';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export function NotificationSettingsCard() {
  const prefsSnapshot = useSyncExternalStore(
    subscribeToNotificationPrefs,
    getNotificationPrefsSnapshot,
    getServerNotificationPrefsSnapshot,
  );
  const prefs = parseNotificationPrefs(prefsSnapshot);
  const canPersistPreferences = hasPreferencesConsent();
  const [isWorking, setIsWorking] = useState(false);

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      patchNotificationPrefs({ enabled: false });
      return;
    }

    if (!canPersistPreferences) return;

    setIsWorking(true);
    const permission = await requestNotificationPermission();
    patchNotificationPrefs({
      enabled: permission === 'granted',
      permission,
    });
    setIsWorking(false);
  };

  const playTestSound = () => {
    const success = playNotificationSound();
    if (success) {
      toast.success('🔔 Ring Bell sound played', {
        description: 'Web Audio chime triggered successfully.',
      });
    } else {
      toast.error('Could not play sound', {
        description: 'Click anywhere on the page to unlock audio playback in your browser.',
      });
    }
  };

  const sendTestNotification = async () => {
    setIsWorking(true);
    // Play sound immediately on test trigger if sound enabled
    if (prefs.playSound) {
      playNotificationSound();
    }

    try {
      const registration = await registerNotificationWorker();
      const delivered = await showSystemNotification({
        body: 'This is a test notification from Adeloopeye.',
        eventId: 'test-notification',
        registration,
        title: 'Adeloopeye notifications enabled',
        url: '/dashboard/settings',
      });

      if (delivered) {
        toast.success('Test notification sent', {
          description: 'You should see a system notification and hear the ring bell.',
        });
      } else {
        toast.info('In-app alert triggered', {
          description: 'System notification blocked by OS/browser, but in-app sound and toast succeeded.',
        });
      }
    } catch {
      toast.error('System notification error', {
        description: 'In-app notification sound was played.',
      });
    }

    setIsWorking(false);
  };

  return (
    <Card className="border-[var(--bd)] bg-[var(--bg-1)] py-0 shadow-none">
      <CardHeader className="border-b border-[var(--bd)] px-5 py-4">
        <CardTitle className="text-[var(--t1)]">Browser notifications</CardTitle>
        <CardDescription className="text-[var(--t3)]">
          Alerts arrive in real time while Adeloopeye is open in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--t1)]">Enable notifications</span>
            <span className="text-sm text-[var(--t3)]">
              Visible dashboard tabs show in-app alerts. Hidden tabs show system notifications.
            </span>
          </div>
          <Switch
            checked={prefs.enabled}
            disabled={!canPersistPreferences || prefs.permission === 'unsupported' || isWorking}
            onCheckedChange={toggleNotifications}
            aria-label="Enable browser notifications"
            className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--t1)]">Play notification sound</span>
            <span className="text-sm text-[var(--t3)]">
              Plays a short alert sound when a new notification is delivered while Adeloopeye is open.
            </span>
          </div>
          <Switch
            checked={prefs.playSound}
            disabled={!canPersistPreferences || !prefs.enabled || isWorking}
            onCheckedChange={value => patchNotificationPrefs({ playSound: value })}
            aria-label="Play notification sound"
            className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
          />
        </div>

        {/* Widget Notification Sources Selection */}
        <div className="flex flex-col gap-3 rounded-sm border border-[var(--bd)] bg-[var(--bg-2)] p-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--t1)] font-mono">
              NOTIFICATION BELL WIDGET SOURCES
            </span>
            <span className="text-xs text-[var(--t3)]">
              Choose which widget updates trigger the ring bell chime and notification toasts.
            </span>
          </div>

          <div className="flex flex-col gap-2.5 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--t1)] flex items-center gap-1.5">
                🇲🇦 Morocco Live News &amp; Regional Updates (Default)
              </span>
              <Switch
                checked={prefs.widgetSources.moroccoNews}
                disabled={!canPersistPreferences || !prefs.enabled}
                onCheckedChange={val =>
                  patchNotificationPrefs({
                    widgetSources: { ...prefs.widgetSources, moroccoNews: val },
                  })
                }
                className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--t1)] flex items-center gap-1.5">
                💥 Kinetic Strikes &amp; Tactical Events
              </span>
              <Switch
                checked={prefs.widgetSources.strikes}
                disabled={!canPersistPreferences || !prefs.enabled}
                onCheckedChange={val =>
                  patchNotificationPrefs({
                    widgetSources: { ...prefs.widgetSources, strikes: val },
                  })
                }
                className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--t1)] flex items-center gap-1.5">
                💻 Disinformation &amp; Bot Network Alerts
              </span>
              <Switch
                checked={prefs.widgetSources.disinfo}
                disabled={!canPersistPreferences || !prefs.enabled}
                onCheckedChange={val =>
                  patchNotificationPrefs({
                    widgetSources: { ...prefs.widgetSources, disinfo: val },
                  })
                }
                className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--t1)] flex items-center gap-1.5">
                🛡 Cyber Security &amp; Data Breach Alerts
              </span>
              <Switch
                checked={prefs.widgetSources.cyber}
                disabled={!canPersistPreferences || !prefs.enabled}
                onCheckedChange={val =>
                  patchNotificationPrefs({
                    widgetSources: { ...prefs.widgetSources, cyber: val },
                  })
                }
                className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--t1)] flex items-center gap-1.5">
                ✈️ ADS-B Air Traffic &amp; Flight Alerts
              </span>
              <Switch
                checked={prefs.widgetSources.flights}
                disabled={!canPersistPreferences || !prefs.enabled}
                onCheckedChange={val =>
                  patchNotificationPrefs({
                    widgetSources: { ...prefs.widgetSources, flights: val },
                  })
                }
                className="data-[state=checked]:bg-[var(--blue)] data-[state=unchecked]:bg-[var(--bg-3)]"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t4)]">Permission</span>
            <span className="mono rounded border border-[var(--bd)] bg-[var(--bg-2)] px-3 py-2 text-[length:var(--text-body-sm)] text-[var(--t2)]">
              {prefs.permission.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--t4)]">Severity threshold</span>
            <Select
              value={prefs.minSeverity}
              disabled={!canPersistPreferences}
              onValueChange={value => patchNotificationPrefs({ minSeverity: value as NotificationSeverity })}
            >
              <SelectTrigger className="w-full border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[var(--bd)] bg-[var(--bg-1)] text-[var(--t1)]">
                <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="CRITICAL">Critical only</SelectItem>
                <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="HIGH">High + Critical</SelectItem>
                <SelectItem className="focus:bg-[var(--bg-3)] focus:text-[var(--t1)]" value="STANDARD">All new events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            onClick={playTestSound}
          >
            🔔 Test Ring Bell Sound
          </Button>
          <Button
            variant="outline"
            className="border-[var(--bd)] bg-[var(--bg-2)] text-[var(--t1)] hover:bg-[var(--bg-3)]"
            onClick={sendTestNotification}
            disabled={!canPersistPreferences || prefs.permission !== 'granted' || isWorking}
          >
            Test system notification
          </Button>
          <span className="text-xs text-[var(--t4)]">
            {!canPersistPreferences
              ? 'Notifications require preference storage to be enabled in this browser.'
              : 'If permission is denied, enable notifications again through your browser settings.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

