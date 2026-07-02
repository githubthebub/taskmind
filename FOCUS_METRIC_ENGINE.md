# FOCUS METRIC ENGINE — Master Architectural & Self-Verification Log

**Objective:** Offline-first, client-side task accelerator — a gamified state-shifter and
non-linguistic concentration anchoring platform. Zero cloud dependencies, zero external
API hooks, local state only (localStorage). Pure TypeScript → ES2020 modules → static HTML.

---

## 1. Architecture

```
index.html                     Static shell; loads dist/main.js as ES module
styles.css                     Global layout + archetype theming (normal / max-contrast)
src/
  types.ts                     SHARED CONTRACT — all module interfaces (single source of truth)
  main.ts                      Bootstrap: wires store → state engine → UI
  ui/app.ts                    Layout orchestrator, exit-driven UX, breathing-gate interception
  state/stateEngine.ts         Yerkes-Dodson state-transition matrix (local JSON, 3 archetypes)
  puzzle/engine.ts             HTML5 Canvas block-matching grid; rotations + pattern matrices
  somatic/breathing.ts         Unskippable 4-7-8 vector overlay (vagal regulation gate)
  audio/audioEngine.ts         WebAudio-synthesized cues & grounding scripts (zero assets)
  premortem/crucible.ts        Crucible Portal: 3 failure scenarios + hedonic decay chart
  storage/store.ts             localStorage schema: sessions, quotas, milestones
  content/indexer.ts           Quota-gated motivational/grounding content indexer
```

### Subsystem design decisions

1. **Attention Puzzle Archetype** — Canvas-rendered falling-block grid with 4-state
   geometric rotations and row-segment pattern-matching matrices. Working-memory load is
   driven by requiring the player to match *target patterns*, not merely fill rows —
   saturating the visuospatial sketchpad and mechanically displacing verbal rumination
   (visuospatial task competition).
2. **Behavioral State Engine** — Serializable JSON transition matrix over
   `sluggish | balanced | hyper`. `hyper → *` transitions are illegal until
   `notifyBreathingComplete()`; the UI intercepts, locks all interactable entry targets,
   and runs the unskippable 4s/7s/8s overlay. `sluggish` applies `contrastMode: 'max'`
   and `tempoMultiplier: 2.5` for a noradrenergic alerting push.
3. **Exhaustion Premortem** — Deterministic simulation: milestone id is hashed to seed a
   fixed hedonic-adaptation curve (12-month satisfaction decay, peak → baseline regression);
   three pre-programmed structural failure scenarios each demand a logged containment
   strategy before the milestone is marked crucible-complete.
4. **Identity Priming & Acceleration Gate** — `ContentIndexer` withholds bodies of all
   gated items until `totalBlocksCleared >= quotaThreshold`; `AudioEngine` grounding
   scripts pass through the same quota gate. On verified `balanced` state, the exit-driven
   UX takes over: the interface instructs lock-app / close-screen / anchor-to-real-task.

### Constraints enforced
- No `fetch`, no `XMLHttpRequest`, no WebSocket, no CDN imports, no external assets.
- Persistence: `localStorage` only, versioned schema (`schemaVersion`).
- Strict TypeScript (`strict: true`), no placeholders or unimplemented stubs.

---

## 2. Build Loop Plan

| Phase | Work | Executor |
|-------|------|----------|
| P0 | Scaffold + shared type contract (`src/types.ts`) | orchestrator |
| P1 | Parallel module builds: puzzle / somatic+audio / crucible / storage+content | 4 builder subagents |
| P2 | State engine, UI shell, bootstrap, HTML/CSS | orchestrator (concurrent with P1) |
| P3 | Integration + full `tsc` strict compile, fix pass | orchestrator |
| P4 | Independent verification: code review + stub scan + compile/runtime logic check | verifier subagents |
| P5 | Fix findings, final compile, commit, push | orchestrator |

---

## 3. Verification Log

*(appended at each build interval)*

- **P0 complete** — scaffold (`package.json`, `tsconfig.json`, strict mode) and shared
  contract written. Contract defines all cross-module interfaces so parallel builders
  cannot diverge.
- **P1 (parallel builders)** — 4 builder subagents launched concurrently against the
  contract, each self-verifying with a strict `tsc --noEmit` pass over its own files:
  - `storage/store.ts` + `content/indexer.ts` ✅ — runtime schema validator, corrupt-data
    fallback, 200-record session cap, 8 quota tiers with strictly gated bodies.
  - `somatic/breathing.ts` + `audio/audioEngine.ts` ✅ — unskippable 4-7-8 SVG vector
    overlay (16 event types swallowed at capture phase), WebAudio-only synthesis.
  - `premortem/crucible.ts` ✅ — 3 radical-accountability failure scenarios, ≥80-char
    containment enforcement, FNV-1a-seeded deterministic hedonic decay curve, hand-drawn
    DPR-aware canvas chart.
  - `puzzle/engine.ts` — in flight.
- **P2 (orchestrator modules)** — `state/stateEngine.ts` (transition matrix + breathing
  interception + balanced verification), `ui/app.ts` (gate lockdown, exit-driven UX,
  vault, HUD), `main.ts`, `index.html`, `styles.css` written. Strict typecheck over all
  completed modules: **PASS** (`TYPECHECK_OK`).
- **P1 complete** — `puzzle/engine.ts` landed (988 lines): 7 tetromino shapes, 4-state
  rotation with wall-kick table, pattern-matrix side panel, contrast palettes, rolling
  matches/min window, endless top-out reset. Export surface matches contract exactly
  across all 4 builder deliverables (grep-verified).
- **P3 (integration) — PASS**
  - Full project strict compile: `tsc -p tsconfig.json` → 0 errors, dist/ emitted.
  - Headless-Chromium runtime smoke test (Playwright, served from `127.0.0.1`):
    **18/18 PASS**, including: canvas renders non-blank pixels; sluggish engages
    max-contrast; hyper triggers the breathing overlay with ALL interactable targets
    disabled; overlay swallows Escape and persists mid-cycle (unskippable verified);
    full crucible walkthrough (milestone → 3 containment logs → rendered chart);
    hedonic curve determinism (bitwise-identical repeat computation, 13 points, clamped);
    vault withholds all 8 bodies at zero quota and tier 0 opens at exactly 10 clears;
    state matrix rejects `quota-verified` with insufficient focus seconds and intercepts
    hyper entry without committing state until `notifyBreathingComplete()`;
    **zero external network requests; zero console/page errors**.
- **P4 (independent verification) — complete.** 3 parallel independent verifier
  subagents (none authored the code they audited):
  - **Stub/purity auditor — PASS (5/5 checks).** Zero TODOs/stubs/`any` types; all 7
    interface contracts fully implemented; strict compile clean and dist/ emit
    byte-current; offline purity confirmed (only "URL" in the codebase is the SVG XML
    namespace constant); localStorage is the sole persistence mechanism.
  - **Spec-conformance verifier — PASS (9/9 requirements)** with file:line evidence,
    verified in both source and the compiled output index.html loads: 4000/7000/8000 ms
    phases, 2.5x sluggish tempo + max contrast, 0.6x high-precision hyper, exactly 3
    failure scenarios with 80-char containment enforcement, deterministic 0–12 month
    hedonic chart, strict quota gating, exit-driven UX, zero cloud hooks.
  - **Adversarial code reviewer — 8 confirmed findings** (also explicitly cleared:
    gate-bypass paths, pending-gate wedge, rotation OOB, division-by-zero, quota
    recomputation, corrupt-JSON fallback).

## 4. Fix Pass (P5) — all 8 findings resolved

| # | Severity | Defect | Fix |
|---|----------|--------|-----|
| 1 | HIGH | Quota counted clear *events*, not cells — vault tiers cost 4–10x the advertised blocks | `App.handleBlockCleared` now advances quota by the engine's cumulative-cell delta |
| 2 | MED/HIGH | `FocusStore.load()` re-read storage each call, clobbering the in-memory fallback when writes fail | cache is authoritative after the constructor's single read |
| 3 | MED | Crucible intake overwrote an existing milestone's logged containments | intake resumes a known milestone id (at next scenario or verdict) instead of overwriting |
| 4 | MED-LOW | `recordSession` double-fired (lock + pagehide / bfcache), duplicating ids and zeroing counters | `sessionRecorded` guard; bfcache `pageshow` starts a fresh session record |
| 5 | LOW | Breathing gate failed *open* on overlay error; commit skipped source re-validation | fail-closed `cancelPendingGate()` on rejection; commit drops if state moved under the gate |
| 6 | LOW | `lockApplication` leaked the puzzle rAF loop, keydown listener, crucible styles | calls `puzzle.destroy()` and `crucible.unmount()` |
| 7 | LOW | Hedonic chart squished on <640px viewports | `height: auto` + `aspect-ratio` |
| 8 | LOW | Game-over sample double-fed the state engine's rolling window | `onGameOver` renders HUD only; dirty-flag emit delivers the sample once |

**Post-fix re-verification:** full strict compile clean; Playwright runtime smoke suite
re-run: **18/18 PASS**, zero external requests, zero console errors.

## 5. Final Status: BUILD VERIFIED ✅

All four core system directives implemented without placeholders, independently
reviewed, adversarially verified, and runtime-tested offline.
