import type { SessionLogEntry } from '../types';

/**
 * Gentle, descriptive practice summary computed from the local log.
 *
 * Deliberately NOT included, per the no-pressure design commitment:
 * streaks, bests, averages of time-to-onset, or any trend that could read
 * as a score to beat. These numbers describe the practice; they never
 * evaluate it.
 */
export interface PracticeInsights {
  totalSits: number;
  /** Sum of wall-clock session durations, ms. */
  totalPracticeMs: number;
  /** Sessions started in the trailing 7 x 24h window. */
  sitsLast7Days: number;
  /** The path walked most often, or null when no path was ever chosen. */
  favoritePath: string | null;
}

const PATH_LABELS: Record<string, string> = {
  'fast-settle': 'Fast Settle',
  anapanasati: 'Full Ānāpānasati',
  tantric: 'Extended Tantric',
  combo: 'Combo',
  'classic-anapanasati': 'Classic Ānāpānasati',
};

export function computeInsights(
  entries: SessionLogEntry[],
  now: number = Date.now(),
): PracticeInsights {
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let totalPracticeMs = 0;
  let sitsLast7Days = 0;
  const pathCounts = new Map<string, number>();

  for (const e of entries) {
    const duration = e.endedAt - e.startedAt;
    if (Number.isFinite(duration) && duration > 0) totalPracticeMs += duration;
    if (e.startedAt >= weekAgo && e.startedAt <= now) sitsLast7Days += 1;
    if (e.path) pathCounts.set(e.path, (pathCounts.get(e.path) ?? 0) + 1);
  }

  let favoritePath: string | null = null;
  let favoriteCount = 0;
  for (const [path, count] of pathCounts) {
    if (count > favoriteCount) {
      favoritePath = PATH_LABELS[path] ?? path;
      favoriteCount = count;
    }
  }

  return {
    totalSits: entries.length,
    totalPracticeMs,
    sitsLast7Days,
    favoritePath,
  };
}

/** "3h 24m" / "18m" / "under a minute" — friendly, non-precise by design. */
export function formatPracticeTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return 'under a minute';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
