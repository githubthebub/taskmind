# SENSORY REWIRE SYSTEM — Blueprint & Execution Log

**Project:** Sensory Rewire — offline-first sensory re-indexing grid and neuro-somatic focus accelerator
**Constraints:** 100% client-side. Zero cloud services, zero external APIs, zero runtime dependencies. Works with the network cable pulled.
**Stack:** TypeScript (strict) → ES2020 modules, Web Audio API, Vibration API, Service Worker (offline-first PWA). No framework, no bundler.

---

## 1. Architecture Overview

```
index.html ──► dist/main.js (compiled from src/)
                 │
                 ├─ portal.ts    ── Highest-State Selection Portal (dashboard UI)
                 ├─ session.ts   ── Live session view (breath orb, prompts, controls)
                 │
                 ├─ breath.ts    ── 4-7-8 breath clock (single source of truth for phase)
                 ├─ audio.ts     ── Oscillator Frequency Engine (Web Audio graph)
                 ├─ haptics.ts   ── Tactile haptic sequencing grid (navigator.vibrate)
                 ├─ lexicon.ts   ── Re-indexing prompt dictionary (local, per state × phase)
                 │
                 ├─ states.ts    ── Global state configuration matrix (the "global JSON")
                 └─ types.ts     ── Shared contracts
sw.js            ── cache-first service worker (offline-first)
manifest.webmanifest ── installable PWA (mobile)
styles.css       ── design system
```

**Data flow.** `states.ts` holds one `StateConfig` object per target state. Selecting a state in the portal passes that single config object to every engine — sound, tactile, and text modules all read from the same JSON-shaped structure, so one selection adjusts all three modalities. `breath.ts` is the master clock: it emits `phasechange` events (`inhale` → `hold` → `exhale`) and per-frame `progress` ticks. Audio, haptics, lexicon, and the UI orb are all subscribers; nothing else keeps time.

## 2. Target Consciousness States (Selection Portal)

| Key | Label | Character |
|-----|-------|-----------|
| `piti` | Somatic Rapture (Pīti Matrix) | Energetic full-body absorption; densest haptic grid, widest binaural offsets, euphoric re-indexing scripts |
| `sukha` | Deep Equanimity (Sukha Base) | Settled contentment; soft slow panning, sparse gentle haptics, spacious equanimity scripts |
| `flow` | Peak Cognitive Acceleration (Flow State) | Task-ready focus; tighter modulation, crisp metronomic haptics, executive-focus scripts |

Each card in the portal renders directly from `STATE_MATRIX`, so adding a fourth state is a data change, not a UI change.

## 3. Module Specifications

### 3.1 Breath Clock (`src/breath.ts`)
- 4-7-8 protocol: inhale 4s, hold 7s, exhale 8s (per-state overridable in `BreathProfile`).
- Drift-free scheduling from `performance.now()` deltas inside a `requestAnimationFrame` loop — no accumulating `setTimeout` error.
- Emits: `phasechange {phase, cycle}` at each transition and `progress {phase, t∈[0,1], remainingSec}` every frame.

### 3.2 Oscillator Frequency Engine (`src/audio.ts`)
- **Fundamental layer:** continuous 110 Hz sine pair, panned hard left/right, with a per-phase binaural beat offset (e.g. Pīti inhale: L=110 Hz, R=110+7 Hz). Designed as a low, steady "floor" for parasympathetic settling.
- **Spatial layer:** 432 Hz sine routed through a `StereoPanner` driven by a slow LFO (per-phase pan rate), plus a frequency-modulation LFO whose depth and rate re-target on every breath phase transition (inhale = brighter/faster FM, hold = near-still, exhale = slow deep FM).
- **Crossfades:** every parameter change rides `setTargetAtTime` / linear ramps — zero clicks, zero hard steps. Master gain fades in over 2s on start and out on stop.
- All synthesis is local `OscillatorNode`/`GainNode`/`StereoPannerNode` graph work: no samples, no fetches.

### 3.3 Tactile Haptic Grid (`src/haptics.ts`)
- Built on `navigator.vibrate` with capability detection and a graceful no-op fallback (desktop browsers).
- **Transition anchor:** on every breath phase change fires the state's transition pattern. Pīti uses the cascading micro-pulse `[30, 60, 30]` (30ms pulse, 60ms gap, 30ms pulse) — a physical anchor for attention at the exact moment the breath turns.
- **Phase grid:** each state × phase cell defines an optional repeating pattern + interval, scheduled against the breath clock and cancelled cleanly at every transition (`vibrate(0)` before re-arming). Pīti inhale runs a cascading micro-pulse loop; sukha keeps hold/exhale silent; flow uses crisp single ticks.

### 3.4 Re-indexing Prompt Lexicon (`src/lexicon.ts`)
- Local dictionary: `prompts[state][phase]` → rotating array of bold, imperative attention-direction scripts, rendered on each phase change.
- Pīti scripts direct attention to the coolness of the breath at the nostril rim and instruct the practitioner to deliberately tag that sensation as intrinsically rewarding — the classic pleasure-conditioning move of pīti practice, phrased in the requested top-down/reward-circuit register.
- Deterministic rotation (cycle-indexed), so a session is reproducible and no prompt repeats back-to-back.

### 3.5 Offline Shell (`sw.js`, `manifest.webmanifest`)
- Cache-first service worker precaches the full asset list on install and serves from cache thereafter; versioned cache name for clean upgrades.
- Manifest makes the app installable to a phone home screen (standalone display, theme-colored).

## 4. Design Notes & Honest Framing

The prompt scripts use vivid neuro-language ("reward center", "re-indexing") as *practice framing* — the app is a meditation/attention-training tool in the pragmatic-dharma tradition (pīti/sukha cultivation, 4-7-8 breathing), not a medical device. Specific frequency choices (110 Hz, 432 Hz) are aesthetic/traditional selections; the app makes no clinical claims. Haptic and audio intensity are user-toggleable at all times.

---

## 5. Execution Log

| # | Timestamp (UTC) | Event |
|---|-----------------|-------|
| 1 | 2026-07-02 | Session start. Branch `claude/sensory-reindex-app-qbxftq` confirmed clean. Node v22, tsc 6.0.2 available. |
| 2 | 2026-07-02 | Blueprint authored (this file). Scaffold: `package.json`, `tsconfig.json` (strict mode, `noUncheckedIndexedAccess`). |
| 3 | 2026-07-02 | Core modules generated: `types.ts`, `states.ts`, `breath.ts`, `audio.ts`, `haptics.ts`, `lexicon.ts`, `portal.ts`, `session.ts`, `main.ts`. |
| 4 | 2026-07-02 | App shell written: `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest`. |
| 5 | 2026-07-02 | Compile gate: one strict-mode error (`audio.ts` dead `panDepth` field) fixed; `tsc` clean, `dist/` emitted; all emitted import specifiers verified against `dist/` contents. |
| 6 | 2026-07-02 | Verifier subagents deployed in parallel (workflow `sensory-rewire-verify`, 3 agents): (a) compile/offline-asset audit — **clean, 0 findings**; (b) cross-module state-transition audit — **2 critical races + 2 minor**; (c) placeholder/dead-code audit — 1 dead export + log reminders. |
| 7 | 2026-07-02 | Findings resolved: `OscillatorEngine.start()` made fully synchronous (no await window between context creation and `_enabled`, killing the stop-during-start race and the dropped-phasechange desync); `Session.teardown()` now sets an `ended` flag and freezes both control buttons before awaiting the audio fade, so nothing can re-arm audio/haptics after exit; `toggleAudio` gained failure handling (button no longer bricks if `AudioContext` creation fails); dead `configFor` export removed. |
| 8 | 2026-07-02 | Re-verified: `tsc` clean after fixes. `dist/` rebuilt, full tree committed and pushed to `claude/sensory-reindex-app-qbxftq`. |
