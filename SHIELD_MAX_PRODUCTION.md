# SHIELD MAX — Production Blueprint & Self-Correcting Validation Protocol

**System class:** offline-first, zero-dependency, client-side web application
**Domain:** gamified concentration metrics · visuospatial task competition · somatic feedback
**Runtime dependencies:** none. No packages, no CDNs, no fonts, no fetches, no endpoints.
**Persistence:** versioned `localStorage` vault (`shieldmax.vault.v1`), memory fallback.
**Network posture:** enforced by CSP in `index.html` — `default-src 'none'; connect-src 'none'`.
A build that adds any external request is, by definition, broken.

---

## 1. Architecture

Single compiled script (`dist/app.js`) produced from strict TypeScript sources.
One shared scope, no module loader, so the app opens directly from `file://`
with no server and no build tooling on the user's device.

```
src/types.ts      shared interface contracts (the only coupling surface)
src/storage.ts    FocusVault — versioned localStorage schema + memory fallback
src/audio.ts      CalmAudio — WebAudio-synthesized drones & cues (no assets)
src/engine.ts     BehavioralMatrixEngine — Yerkes–Dodson JSON state machine
src/breathing.ts  BreathingOverlay — 4-7-8 guide with capture-phase input trap
src/game.ts       VisuospatialCompanion — block-matching canvas game
src/crucible.ts   CrucibleModule — pre-mortem generator + hedonic decay chart
src/rewards.ts    RewardGate — milestone-gated motivational/audio vault
src/exit.ts       ExitDirector — exit-driven UX terminal state
src/main.ts       bootstrap wiring + globalThis.SHIELD test exports
```

Data flow (one loop, 1 Hz):

```
VisuospatialCompanion ──telemetry──▶ BehavioralMatrixEngine
        ▲                                     │ state entry action
        │                    ┌────────────────┼────────────────┐
   GameDirectives      HYPER│          SLUGGISH│        BALANCED│
 (tempo / contrast /   FREEZE_AND_BREATHE  TEMPO_BOOST     EXIT_PROMPT
  frozen)              BreathingOverlay    2.5× tempo +    ExitDirector
        └──────────────(input seized)      1.35× contrast  (leave the app)
```

## 2. Module contracts

### 2.1 Visuospatial Companion (`game.ts`)
- 8×8 board; target matrix generated from 3–6 randomly rotated polyominoes.
- Pieces steer by keyboard / pointer / touch; rotation is **tweened** (display
  angle chases logical quarter-turns) for fluid geometric motion.
- A placement is valid only onto still-unfilled target cells; invalid attempts
  are errors. Clearing every target cell = **verified block-clearing milestone**.
- **Working-memory saturation:** from level 3 the target matrix is shown only
  as a preview (≤6 s, shrinking with level) and must be reconstructed from
  recall — placement, rotation and recall load co-occupy the visuospatial
  sketchpad, which is the mechanism that crowds out verbal rumination.
- Emits `MetricsSample` (tempo, error rate, first-input latency, idle ratio)
  and obeys `GameDirectives { tempoMultiplier, contrastBoost, frozen }`.

### 2.2 Behavioral Matrix Engine (`engine.ts`)
- Arousal index `∈ [0,1]` = `0.4·tempo + 0.25·errors + 0.2·alacrity + 0.15·engagement`.
- Declarative JSON transition table (audited by test suite for full [0,1]
  coverage with no gaps):

| band | state | dwell | entry action |
|---|---|---|---|
| [0.00, 0.33) | `SLUGGISH` (Low-Tempo) | 4 s | `TEMPO_BOOST` → 2.5× tempo, 1.35× contrast |
| [0.33, 0.70) | `BALANCED` (Deep-Work) | 6 s | `EXIT_PROMPT` |
| [0.70, 1.00] | `HYPER` (Restless) | 2.5 s | `FREEZE_AND_BREATHE` |

- Hysteresis ±0.05 on the current state's band + dwell debouncing prevent
  boundary thrash. Engine is pure (timestamps injected), hence unit-testable.

### 2.3 Somatic feedback (`breathing.ts`, `audio.ts`)
- `HYPER` entry **immediately freezes standard input**: capture-phase listeners
  swallow pointer/wheel/key/touch events; the game surface is frozen in the
  same frame. A cosine-eased circle runs 3 full **4 s inhale / 7 s hold /
  8 s exhale** cycles (~57 s) with soft synthesized phase cues, targeting
  parasympathetic (vagal) down-regulation. Control returns only when the
  cycles complete.
- All audio is oscillator-synthesized on device — there are no audio assets.

### 2.4 Exhaustion Pre-Mortem — Crucible (`crucible.ts`)
- Input: a user milestone (free text). Output: **3 structural failure
  scenarios** drawn from a friction library (time scarcity, motivation decay,
  logistical dependency, social friction, resource constraint, competing
  priorities), deterministically seeded by FNV-1a hash of the milestone.
- Hedonic adaptation model charted over 12 months on canvas:
  `S(t) = B + (P − B)·e^(−λt)`, `B = 0.5`, `P = 0.92`,
  `λ ∈ [0.17, 0.46]/month` (half-life ≈ 1.5–4 months), with baseline and
  half-life markers. Purpose: pre-expose the post-attainment decay so the
  anticipation spike is discounted *before* it drives behavior.

### 2.5 Identity priming & exit-driven UX (`rewards.ts`, `exit.ts`, `storage.ts`)
- `FocusVault` schema v1 persists: lifetime clears, sessions (bounded 200),
  best streak, unlocked bundle ids, crucible entries (bounded 100),
  time-in-state accounting. Corrupt or foreign payloads self-heal to empty.
- `RewardGate` bundles unlock **only** when persisted lifetime clears meet the
  threshold (1 / 5 / 15 / 40); the gate re-verifies against the vault at
  render time *and* again at audio-play time — no DOM-side bypass.
- `ExitDirector` prompts when `BALANCED` has been held ≥ 45 s **and** ≥ 1
  pattern was cleared this session: the overlay explicitly instructs the user
  to lock the device and move to a real-world task. Dismissal triggers a 120 s
  cooldown; confirmation ends the session, banks it to the vault, and blanks
  the app. Balance is never converted into more screen time by default.

## 3. Build & test protocol

```
tsc                      # strict compile → dist/app.js (must be warning-free)
node tests/run-tests.mjs # 17 logic tests (engine, vault, crucible math,
                         # gating, exit eligibility, geometry, 4-7-8 timing)
```

Serve locally with any static server (`python3 -m http.server`) or open
`index.html` directly — there is no dev-server dependency.

**Known migration point:** the single-file bundle uses `module: "none"` +
`outFile`, deprecated in TS 6 (silenced via `ignoreDeprecations: "6.0"`) and
removed in TS 7. Before adopting TS 7, swap to any bundler or a trivial
concat script; source files contain no `import`/`export` and are order-listed
in `tsconfig.json → files`.

## 4. Self-correcting validation checklist

Run every item on every change. A failing row blocks merge; the fix is applied
and the entire checklist re-runs from the top (the loop, not the pass, is the
protocol).

| # | Gate | Verification | Status |
|---|---|---|---|
| V1 | Compilation integrity | `tsc` exits 0 with zero diagnostics under `strict` | ✅ |
| V2 | Logic correctness | `node tests/run-tests.mjs` → all tests pass | ✅ 17/17 |
| V3 | Zero-dependency audit | no `package.json` deps; grep for `http://`, `https://`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `import(` in `src/` returns nothing; CSP pins `connect-src 'none'` | ✅ |
| V4 | State-machine coverage | transition table covers [0,1] gap-free; each state entry maps to exactly one somatic action (asserted in tests) | ✅ |
| V5 | Input-freeze guarantee | while `BreathingOverlay.isActive`, capture-phase traps swallow all pointer/key/wheel/touch events and `GameDirectives.frozen` gates every game input path | ✅ |
| V6 | Gating integrity | every reward bundle locked at `requiredClears − 1`, unlocked at threshold; re-verified at render and play time | ✅ |
| V7 | Responsive layout | grid collapses ≤ 860 px; compact spacing ≤ 480 px; canvas is DPR-aware and resize-safe; overlays clamp via `vmin`/`ch`; no horizontal scroll at 320 px | ✅ |
| V8 | Persistence integrity | vault round-trips across instances, survives corruption, bounds growth (200 sessions / 100 crucible entries) | ✅ |
| V9 | Interface cleanliness | all cross-module coupling flows through `src/types.ts` interfaces; `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` enforced | ✅ |
| V10 | Browser boot smoke | headless Chromium loads `index.html`, `globalThis.SHIELD` present, canvas renders, no console errors | ✅ |

### Verifier fleet (run per release)

Independent review agents, each with a single lens, executed in parallel;
findings are adversarially confirmed before any fix lands:

1. **Compile/test verifier** — re-runs V1–V2 from a clean checkout.
2. **Layout verifier** — audits V7 across 320 / 768 / 1280 px reasoning.
3. **Interface auditor** — hunts `any`-leaks, dead exports, contract drift (V9).
4. **Logic red-team** — attacks engine thresholds, gating (V6), freeze paths (V5).

Confirmed findings are fixed, then the full checklist re-runs from V1.

## 5. Clinical design rationale (summary)

- **Visuospatial loading** (block rotation + matrix recall) competes for the
  same working-memory substrate as intrusive imagery/rumination; sustained
  saturation reduces background chatter during and shortly after play.
- **Yerkes–Dodson steering:** performance telemetry approximates arousal;
  the app pushes the user toward the mid-band optimum — stimulating up out of
  the sluggish tail (tempo/contrast), braking down out of the hyper tail
  (extended-exhale breathing, which biases vagal tone and lowers heart rate).
- **Pre-mortem + hedonic decay curve** counters affective forecasting error:
  visualizing realistic friction and post-attainment adaptation deflates
  dopaminergic anticipation loops that fuel compulsive novelty-seeking.
- **Exit-driven design** is the ethical core: the reinforcement schedule pays
  out in *departure*, not engagement. The app's success metric is time **not**
  spent in it while balanced-state work happens elsewhere.

*This file is the system of record. Any behavioral change to a module updates
its contract here in the same commit, or the change is invalid.*
