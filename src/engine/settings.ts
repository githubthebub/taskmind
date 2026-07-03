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

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Persisted values are re-validated against the same bands the UI enforces,
 * so hand-edited or corrupted storage can never raise breathwork dosing
 * (rounds, breaths, tempo) beyond what the settings screen allows.
 */
function sanitize(stored: Partial<AppSettings>): AppSettings {
  const d = DEFAULT_SETTINGS;
  const t: Partial<AppSettings['trigger']> = stored.trigger ?? {};
  return {
    trigger: {
      technique: t.technique === 'tummo' ? 'tummo' : 'bhastrika',
      rounds: clamp(t.rounds, 1, 5, d.trigger.rounds),
      breathsPerRound: clamp(t.breathsPerRound, 15, 40, d.trigger.breathsPerRound),
      retentionAfterRound: typeof t.retentionAfterRound === 'boolean' ? t.retentionAfterRound : d.trigger.retentionAfterRound,
    },
    maxRoundsBeforePrompt: clamp(stored.maxRoundsBeforePrompt, 1, 6, d.maxRoundsBeforePrompt),
    breathsPerStep: clamp(stored.breathsPerStep, 2, 10, d.breathsPerStep),
    autoAdvanceSteps: typeof stored.autoAdvanceSteps === 'boolean' ? stored.autoAdvanceSteps : d.autoAdvanceSteps,
    advancedMudraChains: typeof stored.advancedMudraChains === 'boolean' ? stored.advancedMudraChains : d.advancedMudraChains,
    eyesClosedMode: typeof stored.eyesClosedMode === 'boolean' ? stored.eyesClosedMode : d.eyesClosedMode,
    soundEnabled: typeof stored.soundEnabled === 'boolean' ? stored.soundEnabled : d.soundEnabled,
    cueTempo: stored.cueTempo === 'brisk' ? 'brisk' : 'standard',
  };
}

export function loadSettings(): AppSettings {
  try {
    if (typeof localStorage === 'undefined') return cloneDefaults();
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return cloneDefaults();
    const stored = JSON.parse(raw) as Partial<AppSettings> | null;
    if (!stored || typeof stored !== 'object') return cloneDefaults();
    return sanitize(stored);
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
