# ☸ Blisswheel

**Build the personality your goals deserve — and the bliss to enjoy the journey.**

Blisswheel is a self-contained wellness web app organized around the classic **Wheel of Life**
assessment. It helps you see where your life is out of round, decide who you'd need to become
to fix it, and then trains that personality with daily micro-actions, nervous-system practices,
and structured introspection.

## The five lenses

Every problem in the app can be viewed through five coaching perspectives, each inspired by a
public thinker or tradition (original interpretations — not affiliated with or endorsed by them):

| Lens | Inspired by | Emphasis |
|---|---|---|
| 🧘 The Healer | Dr. K / HealthyGamerGG | Meditation, emotional processing, finding *your* goals |
| 🏛️ The Architect | Jordan Peterson | Responsibility, order, incremental aims, Big Five growth |
| 🎯 The Rationalist | Destiny | Systems over motivation, honest accounting, debating excuses |
| 🧠 The Neuropsychologist | Dr. Judy Ho | Self-sabotage triggers, CBT, values-based commitment |
| 🌿 The Somatic Guide | psychosomatic / mind-body practice | Breath, body scans, tension as information |

## Features

- **Wheel of Life** — rate 8 life areas, set targets, save snapshots, attach goals to gaps
- **Personality Studio** — pick Big Five-based target traits; each feeds 3 daily micro-actions
- **Daily practice checklist** — streaks, trait-building actions, completion tracking
- **Practices** — guided breathwork (physiological sigh, box, 4-7-8, coherent), a 6-minute
  body scan, and a meditation timer
- **Journal** — lens-specific prompts that ask different questions of the same life
- **The Council** — describe a struggle, get all five perspectives side by side, plus a synthesis
- **Bliss Check-in** — track mood, energy, and body tension over time with trend charts

## Running it

No build step, no dependencies. Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

All data is stored locally in your browser (`localStorage`). Nothing leaves your machine.

## Disclaimer

Blisswheel is an educational self-development tool. It is **not** medical or psychological
advice, and the lenses are interpretive homages, not the words of the people who inspired
them. If you're struggling with your mental health, please talk to a qualified professional.
