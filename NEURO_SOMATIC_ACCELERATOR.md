# NEURO_SOMATIC_ACCELERATOR

**System blueprint & validation log — Somatic Accelerator (“The Focus Mandala”)**

An offline-first, client-side breath-training web application: a 4–7–8 respiratory pacer
whose visual, auditory, and haptic channels are driven by one local state machine, with
interface progression gated on verified breath-gesture cadence. Zero network calls, zero
external endpoints, zero dependencies, zero build step. One file: `index.html`.

> Framing note: the neuro-language in this project brief (nucleus accumbens triggering,
> vagal downregulation via 110 Hz, 432 Hz effects) is treated here as *experience-design
> metaphor*, not clinical claim. What the app actually implements is well-trodden and
> benign: paced 4-7-8 breathing, single-point visual focus, sensory anchoring, and
> attention-reframing prompts in the style of absorption/flow meditation instruction.

---

## 1 · Architecture

```
index.html  (single file, self-contained)
├── <style>            visual system (tokens in :root)
├── markup             status bar · canvas · HUD · prompt band · overlays
└── <script> (IIFE)
    ├── MACHINE        strict JSON state machine (JSON.parse'd literal)
    ├── PROMPTS        local text dictionary (neuro-reindexing grid)
    ├── Session state  S{} — complete local state, no external persistence needed
    ├── Audio complex  Web Audio graph (built lazily on user gesture)
    ├── Haptic driver  navigator.vibrate([30,50,30]) at phase boundaries
    ├── Cadence verifier  gesture timing + conformity scoring
    ├── Mandala renderer  Canvas 2D, tier-parameterized
    └── Main loop      requestAnimationFrame; DOM writes only on change
```

**Offline-first guarantee.** The file references no URLs of any kind — no fonts, no CDNs,
no fetch/XHR/WebSocket, no analytics. It runs from `file://`, from any static host, or
inside a sandboxed iframe. Optional stats persistence uses `localStorage` behind a
try/catch so sandboxed contexts degrade gracefully to session-only state.

## 2 · The JSON state machine

Phases, haptic pattern, coherence thresholds, and all seven mandala tiers are defined in
a single `JSON.parse`'d literal (`MACHINE`) — literally JSON, so the response profile is
data, not code:

| Phase  | Duration | Gesture expected | Color |
|--------|---------:|------------------|-------|
| inhale | 4000 ms  | press & hold     | `#F0B060` amber |
| hold   | 7000 ms  | keep holding     | `#A08CF0` violet |
| exhale | 8000 ms  | released         | `#58C8B4` teal |

Tiers (`Ember → Ring → Bloom → Lattice → Halo → Corona → Aurora`) parameterize mandala
folds, ring count, particle count, and pulse cadence. Tier is the only progression axis
and it is **exclusively** reachable through the cadence verifier — there is no time-based
or click-based path to a higher tier.

## 3 · Sub-system implementation map

### 3.1 Dynamic Focus Mandala (Canvas)
- Single-point luminous core (radial gradient) pulsing at the tier's cadence, slowed
  during HOLD; petal rings drawn with quadratic curves in n-fold symmetry, counter-rotating
  per ring; golden-angle particle orbits from tier Bloom upward (deterministic — no RNG).
- Breath geometry: mandala scale eases 0.60 → 1.00 across inhale, shimmers at full bloom
  through hold, eases back down across exhale. A perimeter arc is the phase clock.
- Relational schema: high-encouragement, collaborative voice in all copy; descent copy is
  re-anchoring, never punitive ("re-anchor and rebuild", not "failed").
- `prefers-reduced-motion` honored: rotation and pulse amplitude are disabled/flattened.

### 3.2 Tactile Haptic Sequence Generator
- `navigator.vibrate([30, 50, 30])` — 30 ms pulse · 50 ms gap · 30 ms pulse — fired at
  **every** phase-transition boundary of the 4-7-8 loop, from the same `enterPhase()`
  call that swaps color, cue, and audio envelope, so all channels land on one boundary.
- Guarded and toggleable; desktop browsers without vibration hardware no-op silently.

### 3.3 Client-Side Oscillator Complex (Web Audio)
- **110 Hz sub-bass fundamental**: sine → gain → 320 Hz low-pass → master. Swells on the
  exhale (0.06 → 0.105), recedes on the inhale — the downshift channel.
- **432 Hz spatial layer**: sine → gain → `StereoPanner` → master, with a 0.13 Hz LFO
  (±1.4 Hz) for ambient vibrato. Cross-fades against the sub per phase; frequency ramps
  432 → 439 Hz across the inhale, suspends at 439 through the hold, resolves home to
  432 across the exhale; stereo pan sweeps L→R on inhale, centers on hold, R→L on exhale.
- Soft boundary chimes (330/262/196 Hz, 300 ms exponential envelope) mark transitions.
- Context is created only on the begin gesture (autoplay-policy safe), suspended on
  pause/tab-hide, closed on end. `StereoPanner` absence is feature-detected.

### 3.4 Neuro-Reindexing Text Grid
- `PROMPTS` — a local dictionary of 14 cycle prompts + ascent/descent/calibration lines,
  rendered bold serif in the prompt band, rotated once per completed cycle.
- Content strategy: authoritative second-person instructions that direct attention to the
  cool-air sensation at the nostril rim and reframe it as a deliberately fired,
  high-salience reward cue ("You are the one pressing the lever"), escalating toward
  full-body absorption framing.

## 4 · Respiratory cadence verification (the progression gate)

The user breathes *into* the interface: **press and hold** (pointer or space bar) at the
start of the inhale, keep holding through the hold, **release** at the start of the exhale.

Two independent signals are scored per cycle:
1. **Boundary timing** — each press is scored against the nearest inhale-start and each
   release against the nearest exhale-start (past or upcoming, so early gestures count),
   linearly decaying to 0 at ±1500 ms error.
2. **Conformity** — every animation frame checks whether the current gesture state matches
   the phase's expected state; the cycle's ratio is its conformity score.

`cycleScore = 0.5·timing + 0.5·conformity`. Displayed coherence is an exponential moving
average. Gate rules (from `MACHINE.coherence`): cycle 1 is a no-judgment calibration
cycle; `score ≥ 0.70` builds a streak, **2 consecutive** coherent cycles ascend one tier
(gold flash + ascent prompt); `score < 0.35` descends one tier with a re-anchoring
prompt. Steady cadence is therefore the *only* path to visual complexity.

## 5 · Validation log (self-correcting audit record)

All audits executed against the real build in this repository. Runtime audits ran in
headless Chromium 1194 via Playwright with simulated breath gestures.

| # | Audit | Method | Result |
|---|-------|--------|--------|
| V1 | Script parses cleanly | `new Function(src)` + `node --check` on extracted 476-line script | ✅ PASS |
| V2 | Zero external endpoints | Source contains no `http(s)://`, `fetch`, `XMLHttpRequest`, `WebSocket`, `import`, or URL references | ✅ PASS |
| V3 | Boot & idle render | Load `file://` page, screenshot idle attract state | ✅ PASS, 0 console errors |
| V4 | State transitions | INHALE→HOLD→EXHALE→cycle-complete→INHALE observed via HUD text across 3+ full cycles | ✅ PASS |
| V5 | Cadence verifier | Coherent simulated gesture (press ≈ inhale start, release ≈ exhale start) scored 91% / 89% coherence | ✅ PASS |
| V6 | Progression gating | Tier stayed `1 · Ember` after calibration cycle; ascended to `2 · Ring` exactly at cycle 3 (2-streak rule); ascent prompt rendered | ✅ PASS |
| V7 | High-tier render | Forced tier `7 · Aurora`: 18-fold lattice + 64 particles rendered, 0 errors | ✅ PASS |
| V8 | Lifecycle | Pause→Resume (phase clock shift verified), End→summary stats (cycles/tier/coherence/minutes), Re-enter | ✅ PASS |
| V9 | Audio graph availability | `AudioContext` constructed post-gesture in test browser | ✅ PASS |
| V10 | Zero placeholders | No TODO/FIXME/lorem/stub markers in shipped source | ✅ PASS |

**Corrections applied during the loop:** the Playwright harness initially targeted a
mismatched browser build (env pins Chromium 1194); repointed `executablePath` and re-ran —
an audit-harness fix, no app-code defect found in any pass.

Known platform boundaries (by design, all guarded in code): `navigator.vibrate` is
mobile-only; iOS Safari ignores it. `localStorage` may be unavailable in sandboxed
iframes (stats then live for the session only). Audio requires the begin tap per
browser autoplay policy.

## 6 · How to run

Open `index.html`. That's the whole deployment story — no server, no build, no network.
