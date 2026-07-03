# CLINICAL_FLOW_ENGINE

**System blueprint and self-correcting validation log for Stillpoint** — an
offline-first, client-side somatic focus trainer. This document is permanent:
every architectural decision lives in the blueprint section, and every
verification pass (automated or agent-driven) appends to the validation log
with its findings and the fixes that resolved them.

---

## 1. Mission & design stance

Stillpoint is a breath-training companion built to make slow, focused
breathing *feel rewarding enough to choose* over high-arousal media. The
mechanism stack: non-linguistic pacing channels (a visual ring, tactile
pulses, and breath-locked audio), an encouraging animated coach whose growth
is gated behind genuinely verified focus, and sparse text prompts that train
attentional reappraisal — deliberately tagging the felt sensation of the
breath as salient and pleasant (the practice lineage behind "pīti").

**Honesty note (load-bearing, do not remove):** the design draws on
well-supported practices — slow paced breathing (including 4-7-8),
interoceptive attention training, and reinforcement through earned
progression. The app cannot *guarantee* any specific neurochemical event in
any specific user, and its copy must never claim clinical treatment effects.
What it can do is make the practice paced, pleasant, legible, and
self-reinforcing. All claims in UI copy stay at the level of instruction and
encouragement, not medicine.

**Hard constraints:**
- Zero cloud dependencies. No network request exists anywhere in the runtime.
- Local state only: `localStorage`, one versioned key (`taskmind.progress.v1`).
- Zero runtime npm dependencies. Dev toolchain is `tsc` only
  (`playwright-core` is an optional, uncommitted dev aid for the smoke test).
- Offline-first: service worker precaches the entire app shell; the cache
  *is* the application.
- Strict TypeScript (`strict`, `exactOptionalPropertyTypes`,
  `noUnusedLocals/Parameters`, `noImplicitReturns`).

---

## 2. Architecture

Native ES modules, compiled by `tsc` from `src/` to `dist/`, loaded directly
by the browser. All subsystems are decoupled through one typed event bus.

```
                        ┌─────────────────────┐
                        │  BreathEngine (rAF) │  drift-free 4-7-8 clock
                        └──────────┬──────────┘
                 tick / transition │ sessionStart
                        ┌──────────▼──────────┐
                        │   EventBus (typed)  │
                        └┬────┬────┬────┬────┬┘
             ┌───────────┘    │    │    │    └──────────────┐
   ┌─────────▼───────┐ ┌─────▼──┐ ┌▼─────────────┐ ┌────────▼───────┐
   │ HapticGrid      │ │ Oscil- │ │ Milestone    │ │ main.ts UI glue│
   │ vibrate 30/50/30│ │ lator  │ │ Tracker      │ │  AvatarMachine │
   │ at boundaries   │ │ Complex│ │ (focus veri- │ │  AvatarView    │
   └─────────────────┘ │ 110 Hz │ │  fication +  │ │  BreathRing    │
                       │ +432 Hz│ │  gating)     │ │  PromptGrid    │
                       └────────┘ └──────┬───────┘ │  Hud           │
                                         │         └────────────────┘
                                  ┌──────▼───────┐
                                  │ ProgressStore│ localStorage only
                                  └──────────────┘
```

### File map

| Path | Responsibility |
|---|---|
| `src/types.ts` | Every shared contract (phases, ticks, events, machine schema, progress). |
| `src/state/bus.ts` | Typed pub/sub bus; synchronous, registration-ordered dispatch. |
| `src/state/store.ts` | Versioned localStorage persistence with corruption fallback. |
| `src/state/avatarStateMachine.ts` | Pure interpreter for the JSON machine; unknown events are ignored. |
| `src/data/avatarMachine.ts` | The coach's behavior as strict JSON data (states × events → states). |
| `src/data/dialogue.ts` | Micro-dialogue pools (effort-first, no-shame relational protocol) + rotator. |
| `src/data/prompts.ts` | Reframing prompt dictionary, level-gated ("Pīti Matrix") + deck. |
| `src/engine/breath.ts` | 4-7-8 clock; absolute-timestamp boundaries, tab-throttle catch-up. |
| `src/engine/haptics.ts` | Boundary double-pulse `[30,50,30]`; cycle signature `[30,50,30,120,60]`. |
| `src/engine/audio.ts` | 110 Hz grounding layer + 432 Hz spatial focus layer, breath-locked crossfade. |
| `src/engine/milestones.ts` | Focus verification (visibility/blur watch) and milestone/level gating. |
| `src/ui/avatar.ts` | Layered SVG coach; expression switching via one data attribute. |
| `src/ui/breathRing.ts` | SVG progress ring pacer, per-phase color, off the shared tick stream. |
| `src/ui/promptGrid.ts` | One prompt per cycle, crossfaded at inhale start. |
| `src/ui/hud.ts` | Level / verified cycles / best run / next-milestone gauge. |
| `src/main.ts` | Composition root; the ONLY place wiring order is defined (see §6). |
| `sw.js` | Cache-first service worker; precaches the full shell. |
| `server.mjs` | Zero-dependency static server for local hosting. |
| `test/smoke.mjs` | Headless-browser end-to-end gate (real session, real timings). |

### Sub-system 1 — Avatar-driven somatic coach

- Behavior is a **strict local JSON state machine** (`data/avatarMachine.ts`):
  9 states, transitions only via declared edges; the interpreter throws on a
  route to an undefined state and silently ignores undeclared events.
- Expression layers (6) are SVG groups toggled by CSS from a single
  `data-expression` attribute — the DOM is built once, never re-created.
- The coach **breathes with the user**: body scale follows the live tick.
- Relational protocol: validates effort before outcome ("You noticed you
  left. That noticing IS the skill."), never shames a lapse, celebrates in
  proportion to what was earned.
- **Progression is gated, not granted**: leaf/spark growth stages and deeper
  dialogue arrive only via verified milestones (§ sub-system below). There is
  no path to level the companion except accumulated verified cycles.

### Sub-system 2 — Tactile haptic sequence generator

- `navigator.vibrate` grid, feature-detected (toggle disabled when absent).
- Distinct double-pulse micro-sequence — **30 ms pulse, 50 ms gap, 30 ms
  pulse** — at *every* phase boundary of the 4-7-8 loop, so the transition
  moment lands on a single tactile point without visual attention.
- Cycle completion gets a longer signature (`30,50,30,120,60`) so completed
  cycles are countable eyes-closed.
- Guaranteed silent on session stop (idle transitions never pulse; `sessionEnd`
  cancels any in-flight pattern).

### Sub-system 3 — Client-side oscillator complex

- Single persistent Web Audio graph, built lazily inside the first user
  gesture (autoplay-safe), reused across sessions.
- **Grounding layer**: 110 Hz sine → low-pass (220 Hz) → gain. Slow 0.05 Hz
  amplitude drift keeps it organic; swells gently on the long exhale.
- **Focus layer**: 432 Hz sine → gain → stereo panner wandering at 0.08 Hz.
  Envelope is breath-locked: rises across the inhale, settles through the
  hold, releases across the exhale.
- All parameter motion via `setTargetAtTime` (click-free); time constants
  verified against phase durations (94–98% settle within phase, see log).

### Sub-system 4 — Neuro-reindexing text grid

- Local prompt dictionary, 15 prompts across 6 unlock levels; rendered bold
  and sparse (one per cycle, at inhale start) so text supports the anchor
  instead of competing with it.
- Progression of instruction: **establish the anchor** (find the cool edge of
  the air at the nostril rim) → **tag it as salient and pleasant** → **give
  explicit permission to enjoy** → **spread the pleasantness** (pīti work,
  levels 4+, unlocked only after the basic anchor is stable).
- Deliberate framing: "you are teaching your own reward system what to want"
  — instruction-level, honest, and self-referential rather than clinical.

### Focus verification & gating (cross-cutting)

- A cycle **verifies** only if the tab stayed visible and focused for its
  entire duration (`visibilitychange` + `blur` watchers). Interruption resets
  the current run; post-interruption cycles in the same session complete but
  do not verify — attention is the currency, and it cannot be minted.
- Milestones: 1 / 5 / 15 / 40 / 90 / 180 verified cycles → companion levels
  1–6. Stored locally; never granted by any other path.

---

## 3. Build & run

```
npm run build       # tsc -> dist/ (only build step)
npm run serve       # zero-dep static server at :4173
npm run typecheck   # tsc --noEmit
# optional e2e gate:
npm i --no-save playwright-core && node test/smoke.mjs
```

---

## 4. Validation protocol (the self-correcting loop)

Every change passes four gates before merge. Failures are logged in §5 with
their fixes — the log is append-only.

| Gate | Mechanism | What it proves |
|---|---|---|
| G1 Compile | `tsc -p tsconfig.json` (strict) | Interface integrity, zero `any` leaks. |
| G2 Runtime | `test/smoke.mjs` headless Chromium | Real session past all three phase boundaries: shell renders, phases advance on true 4/7/8 timings, cycle persists to localStorage, milestone recorded, clean stop, **zero console errors**. |
| G3 Verifier agents | Independent audit subagents, one per failure surface (timing/state logic, audio graph, UI/CSS cross-consistency, interface contracts) | Defects a compiler can't see: event ordering, unreachable states, envelope math, selector drift. |
| G4 Re-verify | Re-run G1+G2 after every fix from G3 | No fix regresses another surface. |

---

## 5. Validation log (append-only)

### Pass 1 — 2026-07-03 · initial build

- **G1 compile**: PASS (0 errors, first compile).
- **G2 smoke**: **FAIL** → 2 defects:
  - **D1 — avatar machine unreachable.** `resting`'s only exit is
    `SESSION_START`, and nothing sent it: the machine ignored every event for
    the app's lifetime (coach stuck warm/idle during practice). *Fix:*
    `sessionStart` is now emitted by `BreathEngine.start()` **before** the
    first phase transition, and `main.ts` forwards it to the machine.
    (Independently confirmed by the timing-audit agent in G3.)
  - **D2 — favicon 404.** Console error on load. *Fix:* inline SVG data-URI
    icon in `index.html`.
- **G3 verifier fan-out** (4 parallel audit agents):
  - *Timing/state auditor*: confirmed D1; found **D3 — milestone states
    unreachable by listener ordering.** `MilestoneTracker` registered its
    `transition` listener before `main.ts`, so `MILESTONE_REACHED`/`LEVEL_UP`
    reached the machine while still in `guiding-exhale` (no such edges) —
    `milestone`/`leveling-up` states could never render. *Fix:*
    `MilestoneTracker` is constructed after the transition wiring in
    `main.ts`; ordering constraint documented at the construction site.
    Also verified clean: boundary catch-up math, cycle counting, haptic
    idle-guard, verification flag lifecycle, bus unsubscribe.
  - *Audio auditor*: **NO DEFECTS.** Verified: LFO summing stays positive
    (0.13–0.27, no clipping at master 0.5); envelope time constants settle
    94–98% within their phases; no discontinuous param moves (click-free);
    graph build + resume happen synchronously inside the user gesture;
    no double-build or silent-after-toggle path; single persistent graph.
    Noted (non-defect): context is not `suspend()`ed between sessions —
    battery nicety, tracked as future work.
  - *UI/CSS auditor & interface auditor*: first run interrupted by session
    limits — re-covered by a consolidated agent in Pass 2.
- **G4 re-verify**: `tsc` PASS · smoke **PASS** (full cycle, zero console
  errors, persistence + first-contact milestone verified).

### Pass 2 — 2026-07-03 · consolidated re-audit

- Scope: UI/CSS cross-consistency (expression/level/phase selector coverage,
  ID/type-cast agreement, service-worker shell manifest vs `dist/` tree,
  320px/700px responsive sanity) + interface contracts (cast safety, emit
  ordering at session stop, dist ES-module specifiers).
- Result: **1 defect found.**
  - **D4 — PromptGrid timeout resurrects prompt after session end.**
    `showFor()` scheduled an untracked 350 ms fade-in timeout; `clear()` only
    removed the `.visible` class. Ending a session within 350 ms of an inhale
    start (two rapid clicks: Begin → End) let the pending timeout fire on the
    idle screen, leaving a reframing prompt visible indefinitely. *Fix:*
    timer id is tracked; both `showFor()` and `clear()` cancel any pending
    fade before proceeding.
  - Verified clean: all 6 expression layers, level 2–6 growth reveals, and
    ring phase colors have matching CSS with correct specificity; all 7
    element IDs and casts agree with the HTML; all 16 service-worker shell
    paths exist in `dist/`; 320px layout fits (bubble ~286px in a 296px
    content box, all SVG geometry inside the viewBox); stop-path emit
    ordering sound, `SESSION_END` reachable from every state; all dist import
    specifiers end in `.js`.
- **G4 re-verify**: `tsc` PASS · smoke PASS after fix.

### Pass 3 — 2026-07-03 · modeled neurochemical state profile

- **Feature:** `src/ui/neuroPanel.ts` — four gauges (GABA, Serotonin/5-HT,
  Dopamine/DA, Norepinephrine/NE) drift from an alert-arousal baseline
  (3/5/6/7) toward the target sleep-onset profile across the first five
  minutes of a session, landing exactly on **GABA 9/10 (Sleep Onset),
  5-HT 4/10, DA 2/10 (Inactive Reward), NE 1/10 (Minimal Arousal)** at
  5:00 and holding. Panel freezes (dimmed) at session end, resets on the
  next start. Ease-out trajectory so early minutes show visible movement.
- **Invariant #6 compliance:** the panel header carries a permanent qualifier
  — "modeled trajectory — illustrative, not a measurement". The app measures
  nothing; the gauges visualize the state the practice targets. Any change
  that drops this qualifier violates invariant #6.
- Service-worker shell updated (`dist/ui/neuroPanel.js` added, cache bumped
  to `stillpoint-v2`); smoke test extended: panel hidden at boot, visible in
  session, and the pure trajectory function verified to land exactly on the
  target profile at `PROFILE_TARGET_MS`.
- **G1 compile**: PASS · **G2 smoke (extended)**: PASS.

### Pass 4 — 2026-07-03 · per-phase sound, phase-locked animation, orbit tracer, mudra mode

- **Audio — distinct sound per phase** (`engine/audio.ts`): added Layer C, a
  triangle "phase voice" that glides UP a fifth (264→396Hz) across the whole
  inhale, holds its plateau through the hold, and glides DOWN a full octave
  (396→198Hz) across the whole exhale — pitch direction alone identifies the
  phase. Each boundary also rings a soft one-shot chime on a descending
  A-major triad (E5 inhale / C#5 hold / A4 exhale). Glide durations come from
  the active protocol via the `sessionStart` payload, not hardcoded timing.
- **Phase-locked animation** (`ui/avatar.ts`): body scale and aura brightness
  now follow one shared "fullness" curve (0 = exhaled, 1 = inhaled) driven by
  the live tick; during a session the aura's free-running idle animation is
  disabled (`.live`) and replaced by the phase-locked value. `setIdle()`
  restores the idle look on session end.
- **Orbit tracer**: a dot orbits the coach on a dashed track, completing
  exactly one lap per phase (rotation = phaseProgress × 360°), colored by the
  current phase. Visible only while live.
- **Mudra mode** (`data/mudras.ts`, `ui/mudraPanel.ts`, hand layers in
  `ui/avatar.ts`): the coach demonstrates hand positions the user mimics —
  Gyan (classic Kundalini/meditation seat), Dhyāna (traditional jhāna
  absorption posture), Añjali (centering), Prāṇa (vitality). Each entry pairs
  a stylized hand-layer on the avatar (single `data-mudra` attribute, CSS
  reveal) with a concrete physical cue and its traditional association.
  Selection + mode persist locally (`mudraMode`/`mudraId`, merged
  backward-compatibly into the v1 schema defaults).
  **Invariant #6 compliance:** associations are worded as tradition
  ("classically used for…", "traditional posture for…"), never as promised
  effects — no "awakening guaranteed" claims anywhere in copy.
- Service-worker shell updated (+`mudras.js`, +`mudraPanel.js`; cache v3).
- Smoke test extended: mudra toggle shows/cycles/hides hand layers; live
  phase-locked mode engages on session start; orbit tracer measurably
  advances between frames.
- **G1 compile**: PASS · **G2 smoke (extended)**: PASS.

### Pass 5 — 2026-07-03 · feet, clear mudra diagrams, and the three-founder voice system

- **Design lens:** the coach was re-imagined as if co-founded by three
  sensibilities — a compassionate psychiatrist-coach (already the default
  voice), a blunt numbers-first debater, and a behavioral economist who
  treats calm as the most underpriced luxury in the world. Personas are
  *inspired-by* archetypes; no real person is named in-app.
- **Persona system** (`ui/personaPicker.ts`, `data/dialogue.ts` restructured
  to persona × pool): three switchable coach voices with identical protocol,
  gating, and honesty rules — only the register changes.
  - *Sage*: warm, steady, effort-first (previous voice, unchanged).
  - *Challenger*: blunt and numbers-driven — "partial reps don't count",
    "the counter doesn't lie", "no cope — reset and go again".
  - *Alchemist*: psycho-logic reframes — "compound interest, but for your
    nervous system", "a milestone you couldn't buy — which is precisely why
    it's worth something".
  Selection persists locally (`personaId`); switching re-greets in the new
  voice immediately.
- **Session debrief**: ending a session with ≥1 cycle now reports hard
  numbers (cycles, verified, clock time) phrased in the active voice's
  register — the "real numbers" instinct applied to all three personas.
- **Feet**: the coach has feet (peeking from under the body, hopping with
  the celebrate animation).
- **Clear mudras**: the panel now renders a schematic palm-up finger diagram
  per mudra — touching fingertips curl to the thumb with a dashed contact
  ring, extended fingers are highlighted straight, bowl/palms variants for
  Dhyāna/Añjali, plus an orientation caption. The coach's own hand layers
  were enlarged (~30%) with thicker strokes and clearer loops.
- Service-worker shell +`personaPicker.js`, cache v4.
- Smoke test extended: feet present; gyan diagram shows exactly one curled
  finger + contact ring; persona chips ×3, switch persists to localStorage;
  debrief line verified after a 1-cycle session (with pluralization fix
  caught by the first run: "1 cycles" → "1 cycle").
- **G1 compile**: PASS · **G2 smoke (extended)**: PASS.

### Pass 6 — 2026-07-03 · the coach holds its breath too

- During the hold phase the coach now visibly holds: puffed cheeks pop in
  (spring animation, disabled under reduced-motion) and the expression's
  mouth is replaced by a small pressed-shut mouth. Both release the instant
  the exhale begins. Implemented purely in CSS off the existing
  `data-phase` attribute — no new state, no new events.
- Smoke test extended: cheeks + pressed mouth visible during hold, expression
  mouth hidden, everything released on exhale. First run caught a real
  subtlety: the pressed mouth was authored as a perfectly flat path, whose
  zero-height bounding box registers as invisible — fixed by giving it a
  slight curve (which also reads better).
- **G1 compile**: PASS · **G2 smoke (extended)**: PASS.

### Pass 7 — 2026-07-03 · emotional phase colors, scene-wide

- **Palette decision:** phase colors now follow felt temperature — cool blue
  (`#79c4ff`) for the inhaled air, warm happy pink (`#ff97a8`, replacing the
  old violet) for the full held breath, releasing green (`#74e6b6`) for the
  exhale. Blue and green brightened slightly for presence on the dark ground.
- **Made obvious:** the live phase is stamped on `<body>` (`data-phase`),
  resolving one `--phase` token that tints the whole scene — the ring stroke,
  the instruction label, a soft radial glow behind the pacer, the orbit
  tracer, and the coach's aura (level-colored when idle, phase-colored while
  live) all draw from it, so coach and pacer read as one system. Tint clears
  on session end.
- Smoke test extended: `body[data-phase]` present during hold and cleared
  after stop; ring label's computed color verified equal to `--hold` during
  the hold phase.
- **G1 compile**: PASS · **G2 smoke (extended)**: PASS.

<!-- Append new passes above this line; never rewrite history. -->

---

## 6. Invariants for future contributors

1. **Wiring order in `main.ts` is semantic.** The bus dispatches in
   registration order; the avatar's transition handling must precede
   `MilestoneTracker` construction (see D3).
2. **`sessionStart` precedes the first `transition`.** Subscribers may assume
   session state is initialized when the first inhale event lands (see D1).
3. **The machine definition is data.** New coach behavior = new states/edges
   in `data/avatarMachine.ts` + CSS layers; never branch on state ids in code.
4. **No network. Ever.** Any PR introducing a fetch, CDN link, font import,
   or analytics beacon is rejected on sight.
5. **Progression stays earned.** No code path may grant levels or milestones
   outside `MilestoneTracker`'s verified-cycle accounting.
6. **Copy stays honest.** Encouragement and instruction, yes; clinical or
   guaranteed-neurochemistry claims, no.
