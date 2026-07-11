# taskmind

## Jhana Trainer

A single-file, zero-dependency web app (`index.html`) that structures meditation
sessions around the most direct known protocol for reaching first jhana:
access concentration on the breath, then shifting attention to a pleasant
sensation and letting pīti build (the method taught in Leigh Brasington's
*Right Concentration*).

**Use it:** open `index.html` in any browser. Everything runs locally;
session history is stored in your browser's localStorage.

### Features

- **Staged session timer** — settle → count the breath → sustain attention →
  shift to pleasantness → absorption, with a soft synthesized bell at every
  transition so you never need to open your eyes or check a clock.
- **Breath pacer** — optional 4s-in / 6s-out visual pacer for the settling stage.
- **Session presets** — 20 / 30 / 45 / 60-minute sits with proportionally
  scaled stages.
- **Practice log** — post-sit stability rating, pīti flag, and notes;
  day-streak, total sits, and cushion-hours stats.
- **Milestone checklist** — the ordered signposts between "first sit" and
  "first-jhana territory".
- **Condensed guide** — what jhana is, the fastest realistic path, the
  protocol explained, the three classic blockers, and further reading.

No build step, no server, no dependencies. Screen wake-lock is requested
during sits where the browser supports it.
