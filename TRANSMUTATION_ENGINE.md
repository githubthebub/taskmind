# TRANSMUTATION ENGINE — System Blueprint

**Version:** 1.0 · **Status:** Implemented (`index.html`) · **Runtime:** Any modern browser, fully offline

A gamified somatic focus platform: an offline-first, client-side web interface that anchors
attention through sustained physical touch, entrains a 4-7-8 respiratory cadence, rewards
*consistency* (never novelty), and — at peak focus — seals itself and pushes that state
outward into real-world execution.

---

## 1. Design constitution

These are the non-negotiables every module was built against:

1. **Zero cloud.** No network calls, no external APIs, no CDN assets, no analytics.
   All state is local (`localStorage`). The entire product is one HTML file.
2. **No dopaminergic spikes.** Rewards are slow crossfades, tone shifts, and warmth —
   never confetti, badges, flashing, or variable-ratio surprise. The reward curve is
   deliberately flat and predictable so the nervous system settles instead of chasing.
3. **Consistency is the only currency.** Progression is gated exclusively on *true cycles* —
   full 19-second breath cycles completed while the tactile anchor was held ≥ 85% of the
   cycle. Nothing else advances the companion.
4. **Exit-driven UX.** The product's win condition is the user leaving it. At peak focus
   index the engine locks gamified progression for 30 minutes and issues one directive:
   take this state to the hardest real task you own.
5. **The body is the controller.** Sessions cannot be started or sustained by intent alone;
   they require continuous physical contact (a two-point mudra on touch devices).

## 2. Architecture

Single-file, zero-dependency, module-sectioned vanilla JS (JSDoc-typed; interfaces below
are the authoritative TypeScript contracts each section implements).

```
┌────────────────────────────────────────────────────────────┐
│                        index.html                          │
│                                                            │
│  ContactAnchor ──▶ SessionController ◀── BreathEngine      │
│   (pointer/key       (idle→arming→        (4·7·8 phase     │
│    contact set)       breathing→peak/      clock, rAF)     │
│                       summary)                             │
│         │                  │                    │          │
│         ▼                  ▼                    ▼          │
│  ConsistencyScorer ──▶ CompanionStateMachine   Renderers   │
│   (per-cycle           (JSON tiers: warmth,    (orb canvas,│
│    coverage, focus      dialogue pools,         companion  │
│    index, streaks)      expressions)            canvas,    │
│         │                                       depth CSS) │
│         ▼                                                  │
│  PersistenceLayer (localStorage `transmutation.v1`)        │
│         │                                                  │
│         ▼                                                  │
│  PeakLock (exit-driven seal, 30-minute progression lock)   │
└────────────────────────────────────────────────────────────┘
```

One `requestAnimationFrame` loop drives the whole system; there are no timers competing
with the frame clock except dialogue crossfades.

## 3. Module specifications

### 3.1 ContactAnchor — the tactile gateway

Sustained physical contact is the session's carrier signal.

```ts
interface ContactAnchor {
  /** coarse pointer (touch) → 2 simultaneous contacts (thumb + forefinger mudra);
      fine pointer (mouse/pen) → 1 sustained press; Space bar = accessibility contact */
  readonly requiredContacts: 1 | 2;
  readonly activeContacts: number;
  readonly satisfied: boolean;   // activeContacts >= requiredContacts
}
```

- Implemented with Pointer Events + `setPointerCapture`, `touch-action: none`.
- Each live contact renders a soft ring at the touch point (proprioceptive confirmation).
- **Arming:** from idle, the anchor must be held continuously for 2.6 s (a stroke ring
  traces the pad's perimeter) before a session begins — this filters accidental touches.
- **Grace:** during a session, full release starts a 6 s countdown; re-contact within it
  resumes silently, otherwise the session closes with a summary.

### 3.2 BreathEngine — the respiratory feedback loop

```ts
type PhaseKey = 'inhale' | 'hold' | 'exhale';
interface BreathPhase { key: PhaseKey; label: string; ms: number }
const PHASES: BreathPhase[] = [
  { key: 'inhale', label: 'Inhale', ms: 4000 },
  { key: 'hold',   label: 'Hold',   ms: 7000 },
  { key: 'exhale', label: 'Exhale', ms: 8000 },
]; // CYCLE_MS = 19_000
```

- The orb's radius follows the cadence with an ease-in-out curve, smoothed through an
  exponential follower so phase boundaries never snap.
- Exhale shifts the orb hue toward the deeper seafoam — a parasympathetic "descent" cue.
- A thin arc traces cycle progress around the orb's track ring; a per-phase countdown
  digit sits at the center.
- `prefers-reduced-motion` collapses easing and disables the resting pulse.
- A screen Wake Lock is requested for the session's duration (best-effort, guarded).

### 3.3 ConsistencyScorer — focus index

```ts
interface CycleResult { coverage: number /* 0..1 anchored fraction */; true: boolean }
interface FocusModel {
  CONSISTENT_COVERAGE: 0.85;   // anchored ≥85% of the 19 s cycle → "true cycle"
  GAIN_BASE: 8;                // index per true cycle
  GAIN_STREAK_CAP: 6;          // + min(streak, 6) — bounded, so no runaway reward
  DECAY_BROKEN: 6;             // index lost on a broken cycle
  PEAK_INDEX: 100;             // triggers PeakLock
}
```

- Anchored milliseconds accumulate per frame; each cycle closes with a coverage score.
- UI depth reacts to the focus index: a vignette deepens, orb halo brightens, meter fills —
  all on multi-second transitions. Broken cycles decay quietly (no red, no alarm).
- Recent cycles render as a dot row: filled = true, hollow = broken. Information, not judgment.

### 3.4 CompanionStateMachine — the reward matrix

A pure-data JSON state machine (`COMPANION` constant). No logic lives in the data; no
data lives in the logic.

```ts
interface CompanionTier {
  id: number;
  title: string;
  minCycles: number;        // lifetime true cycles gate — the ONLY ascension input
  warmth: number;           // 0..1 → drives body color mix toward ember, aura alpha,
                            //         eye crescent curvature, dialogue register
  dialogue: Record<
    'greeting' | 'anchored' | 'cycleGood' | 'cycleBroken' |
    'deepStreak' | 'tierUp' | 'peak' | 'locked' | 'farewell',
    string[]
  >;
}
```

| Tier | Title            | Gate (lifetime true cycles) | Warmth |
|------|------------------|-----------------------------|--------|
| 0    | The Stranger     | 0                           | 0.12   |
| 1    | The Acquaintance | 12                          | 0.32   |
| 2    | The Companion    | 35                          | 0.55   |
| 3    | The Confidant    | 80                          | 0.80   |
| 4    | The Kindred      | 160                         | 1.00   |

- The companion ("Ember") is canvas-rendered: a cool slate body that literally warms
  toward ember amber as tiers ascend; eyes flatten to serenity during holds, close on
  slow blinks, and curve with warmth.
- Dialogue is serif-italic, crossfaded over 450 ms. Lines fire only at cycle boundaries
  and state transitions — never mid-breath.
- Deep-streak lines fire every 4 consecutive true cycles; tier-up lines replace the
  cycle line exactly once at ascension. No fanfare beyond words and warmth.

### 3.5 PersistenceLayer — offline schema

```ts
interface SessionRecord {
  startedAt: string;        // ISO 8601
  durationMs: number;
  trueCycles: number;
  brokenCycles: number;
  avgCoverage: number;      // 0..1
  peakReached: boolean;
  focusAttained: number;    // 0..100
}
interface Store {            // localStorage key: "transmutation.v1"
  lifetimeCycles: number;    // companion ascension input
  bestStreak: number;
  lockUntil: number;         // epoch ms; PeakLock seal
  sessions: SessionRecord[]; // ring buffer, last 50
}
```

Writes are wrapped in try/catch so private-browsing modes degrade to an ephemeral run.
A discreet "reset progress" affordance (with confirmation) erases everything.

### 3.6 PeakLock — identity priming & the exit ramp

When the focus index reaches 100:

1. The session is recorded with `peakReached: true`.
2. `lockUntil = now + 30 min` is persisted — progression is sealed across reloads.
3. A full-screen directive appears: *the charge decays whether you spend it or not;
   take it to the single hardest real task in front of you, now.* One button:
   **"Channel it into the work."**
4. While sealed, the anchor pad is inert and shows a live countdown
   (`Engine sealed · 27:41 · progression resumes after the work is done`).

The lock is time-based only, by design: the interface must never become the place
where the amplified state gets spent.

## 4. Visual identity

| Token          | Value                          | Role |
|----------------|--------------------------------|------|
| `--bg`         | `#0a1014`                      | deep teal-black ground |
| `--surface`    | `#10191f`                      | anchor pad, raised planes |
| `--text`       | `#d7e3e4`                      | primary cool text |
| `--dim`/`--faint` | `#778e95` / `#4a5d64`       | secondary / structural |
| `--breath`     | `#93d0c6` (`#4e9e96` deep)     | the system: orb, meter, contact rings |
| `--ember`      | `#e2a65b`                      | the companion: warmth, tier chip, peak CTA |

**Color story:** the machine is cool seafoam; the relationship is warm ember. Warmth is
earned — the amber literally grows with the tier system.

**Type:** companion dialogue in a humanist serif italic (Iowan/Palatino stack); UI in the
system grotesque; every metric in tabular-numeral monospace. System stacks are deliberate:
no font network requests exist.

**Motion budget:** spent entirely on the breath. Everything else moves on 1–2.5 s eases.

## 5. Verification protocol

Every build must pass, in order:

1. **Compilation integrity** — extracted `<script>` passes `node --check` (strict mode).
2. **Boot integrity** — headless Chromium loads the file with zero console errors or
   uncaught exceptions.
3. **End-to-end state walk** — via the read-only `window.__engine` introspection hook:
   `idle` → (pointer held 2.6 s) → `arming` → `breathing` → (19 s) → first cycle scored,
   focus index > 0 → (release 6 s) → `summary`. Persistence round-trips through reload.
4. **Responsive sweep** — no horizontal scroll and no element collision at 360×640,
   390×844, 768×1024, 1440×900; `100dvh` column holds on short viewports (≤620 px height
   triggers the compact companion layout).
5. **Reduced-motion audit** — `prefers-reduced-motion` collapses transitions and the
   resting pulse; phase information remains fully legible as text.

## 6. Extension roadmap (not yet built)

- Optional microphone-free cadence verification via touch micro-pressure variance
  (`PointerEvent.pressure`) on devices that report it.
- SQLite-over-WASM (OPFS) store for long-horizon metrics once session history outgrows
  the localStorage ring buffer.
- Export/import of the store as a JSON file (still fully offline).
- A "morning seal" variant with a shorter 4-4-6 onboarding cadence for new practitioners.
