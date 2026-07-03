/**
 * FocusVault — versioned localStorage persistence for all focus metrics.
 * Zero network, zero cloud: the vault never leaves the device.
 * Falls back to an in-memory store when localStorage is unavailable
 * (private-mode browsers, test harness).
 */

const VAULT_KEY = 'shieldmax.vault.v1';
const VAULT_VERSION = 1;

interface VaultBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

class MemoryBackend implements VaultBackend {
  private map: Record<string, string> = {};
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.map, key) ? this.map[key] : null;
  }
  setItem(key: string, value: string): void {
    this.map[key] = value;
  }
}

class FocusVault {
  private backend: VaultBackend;
  private data: FocusVaultSchema;

  constructor(backend?: VaultBackend) {
    this.backend = backend ?? FocusVault.detectBackend();
    this.data = this.load();
  }

  private static detectBackend(): VaultBackend {
    try {
      if (typeof localStorage !== 'undefined') {
        const probe = '__shieldmax_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
        return localStorage;
      }
    } catch {
      /* private mode or storage disabled — degrade to memory */
    }
    return new MemoryBackend();
  }

  static emptySchema(): FocusVaultSchema {
    return {
      version: VAULT_VERSION,
      totalPatternsCleared: 0,
      totalSessions: 0,
      totalFocusMs: 0,
      bestStreak: 0,
      unlockedBundleIds: [],
      sessions: [],
      crucibleEntries: [],
    };
  }

  private load(): FocusVaultSchema {
    const raw = this.backend.getItem(VAULT_KEY);
    if (raw === null) return FocusVault.emptySchema();
    try {
      const parsed = JSON.parse(raw) as Partial<FocusVaultSchema>;
      if (typeof parsed !== 'object' || parsed === null || parsed.version !== VAULT_VERSION) {
        return FocusVault.emptySchema();
      }
      // Rebuild field-by-field: any field of the wrong shape self-heals to
      // its empty value instead of poisoning the vault at runtime.
      const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
      const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
      return {
        version: VAULT_VERSION,
        totalPatternsCleared: count(parsed.totalPatternsCleared),
        totalSessions: count(parsed.totalSessions),
        totalFocusMs: count(parsed.totalFocusMs),
        bestStreak: count(parsed.bestStreak),
        unlockedBundleIds: list<string>(parsed.unlockedBundleIds).filter((id) => typeof id === 'string'),
        sessions: list<SessionRecord>(parsed.sessions),
        crucibleEntries: list<CrucibleEntry>(parsed.crucibleEntries),
      };
    } catch {
      return FocusVault.emptySchema();
    }
  }

  private persist(): void {
    this.backend.setItem(VAULT_KEY, JSON.stringify(this.data));
  }

  snapshot(): FocusVaultSchema {
    return JSON.parse(JSON.stringify(this.data)) as FocusVaultSchema;
  }

  get totalPatternsCleared(): number {
    return this.data.totalPatternsCleared;
  }

  get unlockedBundleIds(): string[] {
    return [...this.data.unlockedBundleIds];
  }

  recordPatternCleared(streak: number): void {
    this.data.totalPatternsCleared += 1;
    if (streak > this.data.bestStreak) this.data.bestStreak = streak;
    this.persist();
  }

  markBundleUnlocked(id: string): void {
    if (!this.data.unlockedBundleIds.includes(id)) {
      this.data.unlockedBundleIds.push(id);
      this.persist();
    }
  }

  recordSession(record: SessionRecord): void {
    this.data.totalSessions += 1;
    this.data.totalFocusMs += Math.max(0, record.endedAt - record.startedAt);
    this.data.sessions.push(record);
    // Keep the vault bounded: retain the 200 most recent sessions.
    if (this.data.sessions.length > 200) {
      this.data.sessions = this.data.sessions.slice(-200);
    }
    this.persist();
  }

  recordCrucibleEntry(entry: CrucibleEntry): void {
    this.data.crucibleEntries.push(entry);
    if (this.data.crucibleEntries.length > 100) {
      this.data.crucibleEntries = this.data.crucibleEntries.slice(-100);
    }
    this.persist();
  }
}
