'use client';

import { useEffect, useSyncExternalStore } from 'react';

import {
  applyUiScale,
  applyTheme,
  DEFAULT_APPEARANCE_PREFS,
  getAppearancePrefsSnapshot,
  getServerAppearancePrefsSnapshot,
  readAppearancePrefs,
  subscribeToAppearancePrefs,
} from '@/features/settings/lib/appearance-storage';

export function SettingsRuntime() {
  const prefsSnapshot = useSyncExternalStore(
    subscribeToAppearancePrefs,
    getAppearancePrefsSnapshot,
    getServerAppearancePrefsSnapshot,
  );

  useEffect(() => {
    const prefs = prefsSnapshot ? readAppearancePrefs() : DEFAULT_APPEARANCE_PREFS;
    applyUiScale(prefs.uiScale);
    applyTheme(prefs.theme);
  }, [prefsSnapshot]);

  // Apply theme on initial mount
  useEffect(() => {
    const prefs = readAppearancePrefs();
    applyTheme(prefs.theme);
  }, []);

  return null;
}
