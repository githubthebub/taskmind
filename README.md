# Stillpoint

A breath-first calm app — 4-7-8 breathing with a coach you can watch, hear, and mimic.

Open `index.html` in a browser. No build, no dependencies, works offline.

## What's in it

- **Breathing coach** — a blob (with feet) that inflates on the inhale, holds its breath with puffed cheeks through the hold, and deflates on the exhale.
- **Emotional phase colors** — cool blue inhale, warm pink hold, fresh green exhale, carried through the label, glow, aura, orbit tracer, and legend.
- **Per-phase sound** — a glide voice rises a fifth across the inhale, holds its note, then descends an octave across the exhale, with boundary chimes on a descending A-major triad (E5 / C♯5 / A4) over a soft 110 Hz / 432 Hz bed.
- **Orbit tracer** — a phase-colored dot completes exactly one lap around the coach per phase.
- **Mudra mode** — the coach gets hands; schematic diagrams show exactly which fingertips touch (Gyan, Dhyāna, Añjali, Prāṇa). Associations are worded as tradition, not promised effects.
- **Coach personas** — Sage (warm, effort-first), Challenger (blunt, numbers-driven), Alchemist (psycho-logic reframes). Choice persists.
- **Session debrief** — hard numbers: cycles completed and clock time.
- **State profile panel** — four gauges (GABA, 5-HT, DA, NE) drifting from an alert baseline to a rest profile at the 5-minute mark. Permanently labeled *modeled trajectory — illustrative, not a measurement*: the app cannot measure neurotransmitters and does not pretend to.

## Design invariants

1. Honesty over theater: anything the app cannot measure is labeled as modeled/illustrative.
2. Personas are inspired-by archetypes; no real names appear in-app.
3. Phase state drives everything through one `data-phase` attribute — sound, color, face, and motion cannot drift out of sync.

## Testing

Browser smoke test (Playwright) covers boot state, the pure neuro trajectory landing exactly on 9/4/2/1 at 300 s, phase colors, the hold face, orbit motion, debrief pluralization, mudra geometry, and persona persistence. Test hooks live on `window.__sp`.
