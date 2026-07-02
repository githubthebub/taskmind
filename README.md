# Jhana Guide

A real-time, adaptive meditation engine that guides a practitioner from
breath-focused **access concentration (upacāra samādhi)** through the
cultivation of **pīti** (rapture) and **sukha** (bliss) into the **first and
second jhānas**, following the progression described in the Visuddhimagga and
modern breath-energy pedagogy (whole-body breathing in the style of Ajaan Lee
/ Thanissaro Bhikkhu).

The core is a zero-dependency TypeScript library: a deterministic state
machine plus streaming signal analysis, designed for O(1) per-event cost so
feedback latency stays constant for the whole sit. A self-contained browser
demo shows it working end to end.

## The phase graph

```
                     progress ─────────────────────────────►
SETTLING ─► ACCESS ─► PITI_CULTIVATION ─► TRANSITION ─► JHANA_1 ─► JHANA_2
              ▲              ▲    ▲            │            │          │
              │              │    └────────────┴────────────┘          │
              │              │      regression / grasping collapse     │
              │              └─────────────────────────────────────────┘
              └── stability loss                (any phase) ─► EMERGENCE
```

| Phase | Practice | Advance when |
|---|---|---|
| `SETTLING` | Arriving, posture, letting go | attention minimally stable |
| `ACCESS` | Exclusive focus on breath sensations at the nostril rims / upper lip; noticing the breath's *inherent pleasantness* (cool inhale, releasing exhale) | stability high **and** breath has become pleasant |
| `PITI_CULTIVATION` | The breath re-perceived as an energy field; whole-body breathing invites tingling, warmth, waves | stability high **and** pīti present |
| `TRANSITION` | Attention pivots **off the breath** and **onto the pleasantness itself** — held lightly, without grasping | pīti strong, sukha present, effort low, grasping risk low |
| `JHANA_1` | Absorption with vitakka/vicāra, pīti + sukha born of seclusion | very stable, effort released |
| `JHANA_2` | Vitakka/vicāra released; inner confidence; joy born of concentration | — |
| `EMERGENCE` | Gentle exit and review | terminal |

Three properties keep the transitions seamless and non-oscillating:

- **Dwell minimums** — samādhi needs marination time; the machine never
  advances before a per-phase minimum, however good the signals look.
- **Hysteresis** — every advance threshold has a *lower* regression
  threshold, so signals sitting near a boundary never cause flapping.
- **Grasping handling** — the most common failure mode near the first jhāna
  is over-excitement: reaching for pīti collapses it. A dedicated detector
  (rate-of-rise of pīti + effort + cardiovascular arousal) first **freezes
  progression and issues a soften cue**; only sustained severe grasping in a
  deep phase steps the machine back one phase — always paired with
  reassuring, non-failure-framed guidance.

## Signals

The engine fuses three input classes into one smoothed `SignalSnapshot`
(`stability`, `pleasantness`, `piti`, `sukha`, `effort`, `graspingRisk`,
breath metrics):

- **Breath marks** — timestamps of inhale/exhale onsets from tap input, a
  microphone envelope, or a respiration belt. A streaming analyzer derives
  bpm, rhythm regularity (an attention-stability proxy), and exhale/inhale
  ratio using EMAs only — no buffers, O(1) per breath.
- **Self-reports** — sparse one-tap check-ins (any subset of dimensions).
  A report snaps the signal most of the way to the reported value; between
  reports signals relax exponentially, because absorption factors fade when
  not refreshed.
- **Biometrics (optional)** — heart rate (spikes above a slow baseline read
  as arousal and feed effort/grasping), HRV, and respiration rate from a
  chest strap.

Every input path and the `tick()` path are constant-time and allocation-light,
so the engine adds no perceptible latency at any tick rate from 1 Hz to 120 Hz.

## Guidance

`GuidanceEngine` decides what to say and — just as important — when to stay
silent. The minimum interval between cues **grows** with depth (20 s while
settling → 4 min in the second jhāna) and suggested delivery intensity
**shrinks**, because absorption deepens in the gaps. Cues are prioritized
(corrective ≻ phase-entry ≻ deepening ≻ ambient), phase-entry cues always
land, deepening cues rotate to avoid habituation, and dedicated corrective
banks handle grasping ("soften"), dullness ("brighten"), and regressions
(reassurance, never failure).

## Usage

```ts
import { MeditationSession } from './src/index.js';

const session = new MeditationSession(performance.now(), {
  sessionBudgetMs: 45 * 60 * 1000,
  listener: (event) => {
    if (event.type === 'cue') say(event.cue.text, event.cue.intensity);
    if (event.type === 'phaseChange') render(event.change.to);
    if (event.type === 'signals') updateMeters(event.signals);
  },
});

// Drive it from any loop (rAF, interval — cadence doesn't matter):
setInterval(() => session.tick(performance.now()), 100);

// Feed it:
session.breathMark({ t: performance.now(), kind: 'inhaleStart' });
session.selfReport(performance.now(), { piti: 0.7, effort: 0.1 });
session.biometric(performance.now(), { heartRate: 58, hrvRmssd: 65 });
```

The engine holds no internal timers and never reads the clock itself — time
is always injected — so every component is deterministic and fully testable.
All thresholds and dwell times are tunable via the `config` option
(see `MachineConfig` in `src/machine.ts`).

## Demo

```sh
npm install
npm run demo   # builds and serves; open the printed URL at /demo/
```

Tap **space** at the start of each in-breath and out-breath, check in with the
sliders occasionally, and watch the engine walk you down the phase graph. Cues
are spoken via the Web Speech API (toggleable).

## Development

```sh
npm test       # vitest: 31 tests across analyzer, fusion, machine, session
npm run build  # tsc -> dist/
```

Layout:

| Path | Contents |
|---|---|
| `src/types.ts` | Shared vocabulary: phases, signals, cues, events |
| `src/breath.ts` | Streaming breath-mark analyzer |
| `src/signals.ts` | Signal fusion + grasping detector |
| `src/machine.ts` | The phase state machine and its tunable config |
| `src/guidance.ts` | Cue banks, pacing, and priority logic |
| `src/session.ts` | `MeditationSession` facade wiring it all together |
| `demo/index.html` | Self-contained browser demo |

## A note on scope

Software can pace, remind, and stay out of the way; it cannot concentrate for
you. Jhāna arises from sustained, kind attention — this engine is scaffolding
for that, and its guidance deliberately gets quieter the better you do.
