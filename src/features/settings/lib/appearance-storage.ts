'use client';

import { hasPreferencesConsent } from '@/shared/lib/analytics/consent';

export const APPEARANCE_PREFS_STORAGE_KEY = 'adeloopeye:appearance:v1';

export type UiScale = 'compact' | 'default' | 'large';
export type Theme = 'light' | 'dark' | 'system';

export type AppearancePrefs = {
  version: 1;
  uiScale: UiScale;
  theme: Theme;
};

export const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  version: 1,
  uiScale: 'default',
  theme: 'system',
};

export function readAppearancePrefs(): AppearancePrefs {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) {
    return DEFAULT_APPEARANCE_PREFS;
  }

  try {
    return parseAppearancePrefs(window.localStorage.getItem(APPEARANCE_PREFS_STORAGE_KEY));
  } catch {
    return DEFAULT_APPEARANCE_PREFS;
  }
}

export function parseAppearancePrefs(raw: string | null): AppearancePrefs {
  if (!raw) return DEFAULT_APPEARANCE_PREFS;

  try {
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    return {
      version: 1,
      uiScale: isUiScale(parsed.uiScale) ? parsed.uiScale : 'default',
      theme: isTheme(parsed.theme) ? parsed.theme : 'system',
    };
  } catch {
    return DEFAULT_APPEARANCE_PREFS;
  }
}

export function writeAppearancePrefs(next: AppearancePrefs) {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return;

  window.localStorage.setItem(APPEARANCE_PREFS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('adeloopeye-appearance-prefs-changed'));
}

export function patchAppearancePrefs(patch: Partial<AppearancePrefs>) {
  writeAppearancePrefs({
    ...readAppearancePrefs(),
    ...patch,
    version: 1,
  });
}

export function subscribeToAppearancePrefs(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener('adeloopeye-appearance-prefs-changed', handleChange);
  window.addEventListener('adeloopeye-cookie-consent-changed', handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('adeloopeye-appearance-prefs-changed', handleChange);
    window.removeEventListener('adeloopeye-cookie-consent-changed', handleChange);
  };
}

export function getAppearancePrefsSnapshot() {
  if (typeof window === 'undefined' || !hasPreferencesConsent()) return null;
  return window.localStorage.getItem(APPEARANCE_PREFS_STORAGE_KEY);
}

export function getServerAppearancePrefsSnapshot() {
  return null;
}

export function applyUiScale(uiScale: UiScale) {
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.uiScale = uiScale;
}

function isUiScale(value: unknown): value is UiScale {
  return value === 'compact' || value === 'default' || value === 'large';
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  if (theme === 'system') {
    // Remove explicit theme classes and let CSS media query handle it
    document.documentElement.classList.remove('light', 'dark');
    
    // Apply based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  } else {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }
}

// Listen for system theme changes when in system mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const prefs = readAppearancePrefs();
    if (prefs.theme === 'system') {
      applyTheme('system');
    }
  });
}
