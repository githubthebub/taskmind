# Stillpoint

A breath-first calm app — 4-7-8 breathing with a coach you can watch, hear, and mimic.

Open `index.html` in a browser. No build, no dependencies, works offline.

## What's in it

- **Breathing coach** — a blob (with feet) that inflates on the inhale, holds its breath with puffed cheeks through the hold, and deflates on the exhale.
- **Emotional phase colors** — cool blue inhale, warm pink hold, fresh green exhale, carried through the label, glow, aura, orbit tracer, and legend.
- **Per-phase sound** — a glide voice rises a fifth across the inhale and descends an octave across the exhale as a clean single line; the holds get their own texture — a slow ~0.9 Hz shimmer plus a quiet second voice a fifth below, turning the sustain into a soft chord. Boundary chimes descend E5 / C♯5 / A4 / E4 over a soft 110 Hz / 432 Hz bed.
- **Practice library** — four breath practices named by benefit, tradition credited in the subtitle and source: Fall Asleep Faster (4·7·8), Calm Clear Focus (6·6 — Ānāpānasati Sutta, MN 118 first tetrad, anchored on the cool touch of air at the nose), Melt Tension (4·2·10 — MN 118 step four), Steady Under Pressure (4·4·4·4 box with a hold on empty lungs).
- **Orbit tracer** — a phase-colored dot completes exactly one lap around the coach per phase.
- **Mudra mode** — the coach gets hands; schematic diagrams show exactly which fingertips touch (Gyan, Dhyāna, Añjali, Prāṇa). Associations are worded as tradition, not promised effects.
- **Coach personas** — Sage (warm, effort-first), Challenger (blunt, numbers-driven), Alchemist (psycho-logic reframes). Choice persists.
- **Session debrief** — hard numbers: cycles completed and clock time.
- **State profile panel** — four gauges (GABA, 5-HT, DA, NE) drifting from an alert baseline toward the selected practice's target profile at the 5-minute mark, with target tick marks on each gauge and a fill-up progress readout ("2:13 / 5:00 · 71% to profile"). Permanently labeled *modeled trajectory — illustrative, not a measurement*: the app cannot measure neurotransmitters and does not pretend to.

## Design invariants

1. Honesty over theater: anything the app cannot measure is labeled as modeled/illustrative.
2. Personas are inspired-by archetypes; no real names appear in-app.
3. Phase state drives everything through one `data-phase` attribute — sound, color, face, and motion cannot drift out of sync.

## Testing

Browser smoke test (Playwright) covers boot state, the pure neuro trajectory landing exactly on 9/4/2/1 at 300 s, phase colors, the hold face, orbit motion, debrief pluralization, mudra geometry, and persona persistence. Test hooks live on `window.__sp`.
