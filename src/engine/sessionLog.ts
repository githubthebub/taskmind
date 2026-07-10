/**
 * Session log — PRIVATE BY DEFAULT.
 *
 * Entries live only in this browser's localStorage. Nothing in this module
 * (or anywhere else in Stillpoint) sends session data over the network.
 * The only way data leaves the device is `downloadLog()`, which the user
 * invokes explicitly from the log screen.
 *
 * All storage access is guarded: in a non-browser context, with storage
 * disabled, or with a corrupt payload, functions degrade to no-ops /
 * empty results rather than throwing.
 */

import { STORAGE_KEYS } from '../constants';
import type { SessionLogEntry } from '../types';

/** Read all logged sessions. Returns [] when storage is unavailable or empty. */
export function loadLog(): SessionLogEntry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.sessionLog);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionLogEntry[]) : [];
  } catch {
    return [];
  }
}

/** Append one entry. Silently no-ops if storage is unavailable or full. */
export function appendEntry(e: SessionLogEntry): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const entries = loadLog();
    entries.push(e);
    localStorage.setItem(STORAGE_KEYS.sessionLog, JSON.stringify(entries));
  } catch {
    // Storage unavailable — the session simply goes unlogged. Never a crash.
  }
}

/**
 * Erase every logged session from this device. User-initiated only, behind
 * an explicit confirmation in the log screen — never called automatically.
 */
export function clearLog(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.sessionLog);
  } catch {
    // Storage unavailable — nothing to erase.
  }
}

/** Pretty JSON of every entry — used only by the explicit export action. */
export function exportLogAsJson(): string {
  return JSON.stringify(loadLog(), null, 2);
}

/**
 * Explicit, user-initiated export: builds a Blob and clicks a temporary
 * download link. This is the ONLY path by which log data leaves the device.
 */
export function downloadLog(): void {
  try {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    const blob = new Blob([exportLogAsJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stillpoint-sessions.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    // Non-browser or blocked download — nothing to do.
  }
}

/** New session id via crypto.randomUUID, with a non-crypto fallback. */
export function newSessionId(): string {
  try {
    const c = globalThis.crypto as unknown as
      | { randomUUID?: () => string }
      | undefined;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    // fall through to the fallback below
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
