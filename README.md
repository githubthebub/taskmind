# Stillpoint

A free, local-first wellness web app: evidence-based breathwork, body-scan
meditation, and sensory grounding — built as the substantive alternative to
algorithmic "wellness influencer" content. No accounts, no ads, no server;
everything runs and stays in your browser.

## Features

- **Breathing studio** — four paced techniques with an animated visual pacer
  and optional audio cues:
  - *Coherence 5.5* — ~5.5 breaths/min, the pace most associated with
    increased heart-rate variability
  - *Cyclic sighing* — double inhale + long exhale (Stanford, 2023)
  - *Box breathing* — 4-4-4-4, for acute stress
  - *4–7–8* — long-exhale pattern for winding down
- **Body scan** — a ~6-minute guided pass of attention through ten body
  regions, building interoceptive awareness
- **5–4–3–2–1 grounding** — an interactive sensory anchor for racing thoughts
- **Progress tracking** — day streak, weekly sessions, total minutes, and a
  7-day practice chart, stored only in `localStorage`

## Running it

It's a static site with no build step or dependencies — open `index.html`
directly, or serve the repo root:

```sh
npx serve .
```

It also works as-is on GitHub Pages or any static host.

## Disclaimer

Stillpoint is a self-care tool, not medical care. If you're struggling with
your mental or physical health, please talk to a qualified professional.
