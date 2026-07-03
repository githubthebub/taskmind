/**
 * App settings — localStorage-backed, merged over DEFAULT_SETTINGS so new
 * fields added in later versions pick up their defaults automatically.
 * Storage access is guarded; non-browser contexts get plain defaults.
 */

import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants';
import type { AppSettings } from '../types';

function cloneDefaults(): AppSettings {
  return { ...DEFAULT_SETTINGS, trigger: { ...DEFAULT_SETTINGS.trigger } };
}

export function loadSettings(): AppSettings {
  try {
    if (typeof localStorage === 'undefined') return cloneDefaults();
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return cloneDefaults();
    const stored = JSON.parse(raw) as Partial<AppSettings> | null;
    if (!stored || typeof stored !== 'object') return cloneDefaults();
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      trigger: { ...DEFAULT_SETTINGS.trigger, ...(stored.trigger ?? {}) },
    };
  } catch {
    return cloneDefaults();
  }
}

export function saveSettings(s: AppSettings): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(s));
  } catch {
    // Storage unavailable — settings apply for this session only.
  }
}
