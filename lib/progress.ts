// Client-side, localStorage-backed progress store. No external deps.
// Safe to import from client components only (guards against SSR access).

export type SessionLogEntry = {
  techniqueId: string;
  completedAt: string; // ISO timestamp
  durationMinutes: number;
};

const STORAGE_KEY = "taskmind.progress.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLog(): SessionLogEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SessionLogEntry[];
  } catch {
    return [];
  }
}

function writeLog(entries: SessionLogEntry[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function logSession(entry: Omit<SessionLogEntry, "completedAt"> & { completedAt?: string }): void {
  const log = readLog();
  log.push({
    techniqueId: entry.techniqueId,
    durationMinutes: entry.durationMinutes,
    completedAt: entry.completedAt ?? new Date().toISOString(),
  });
  writeLog(log);
}

export function getSessionLog(): SessionLogEntry[] {
  return readLog().sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

function dayKey(dateIso: string): string {
  const d = new Date(dateIso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Consecutive-day streak ending today or yesterday (a streak "survives" one day of grace). */
export function getCurrentStreak(): number {
  const log = readLog();
  if (log.length === 0) return 0;

  const daysWithSessions = new Set(log.map((e) => dayKey(e.completedAt)));

  const today = new Date();
  const cursor = new Date(today);

  // If there's no session today, the streak can still count if there was one yesterday;
  // otherwise the streak is broken (0).
  const todayKey = dayKey(cursor.toISOString());
  if (!daysWithSessions.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
    const yesterdayKey = dayKey(cursor.toISOString());
    if (!daysWithSessions.has(yesterdayKey)) {
      return 0;
    }
  }

  let streak = 0;
  while (daysWithSessions.has(dayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTotalSessions(): number {
  return readLog().length;
}

export function getTotalMinutes(): number {
  return readLog().reduce((sum, e) => sum + e.durationMinutes, 0);
}

export function getMostRecentSession(): SessionLogEntry | undefined {
  return getSessionLog()[0];
}

export function getStats() {
  return {
    streak: getCurrentStreak(),
    totalSessions: getTotalSessions(),
    totalMinutes: getTotalMinutes(),
    recent: getSessionLog().slice(0, 10),
    mostRecent: getMostRecentSession(),
  };
}
