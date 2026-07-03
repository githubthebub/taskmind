# Stillpoint 🌙

A somatic wind-down web app, guided by **Maya** — an AI somatic-wellness character who helps you feel seen and heard, release stored tension, quiet self-doubt and survival thinking, and settle into deep, absorbed calm (a jhana-inspired absorption phase).

## How it works

1. **The Attunement (mini-game, ~1 min)** — four playful check-ins that profile your current state:
   - **Your rhythm** — tap a drifting orb at your natural pace; tempo and jitter estimate activation and scatter
   - **Inner weather** — pick the weather that matches your inside world (mood valence and arousal)
   - **Where it lives** — tap a body map wherever tension is being held
   - **The loudest voice** — name what's playing loudest (self-doubt, survival thinking, racing mind, heaviness, tiredness)
2. **The reading** — Maya reflects your state back to you so you feel genuinely seen, with activation / mood / body-load meters.
3. **The session (~9 min, headphones recommended)** — six phases, each adapting to your profile:
   - Arriving → Releasing the body (targeted to *your* tension zones) → The rinse (long-exhale downshift) → Setting it down (tailored to *your* loudest voice) → Absorption (jhana-inspired) → Returning
4. **The return** — a gentle close and a before/after body check.

## The sound

Everything is synthesized live in the browser with the Web Audio API — no samples, no network:

- A warm, slowly-evolving four-voice pad on a descending chord cycle
- A **binaural beat layer** that ramps from alpha (~10 Hz) down through theta (~4.5 Hz) as the session deepens
- **Breath-synced ocean swells** (filtered pink noise) that rise and fall with the on-screen breathing orb
- Soft bell tones marking phase transitions

## Run it

No build step. Just open the file:

```
open index.html          # macOS
xdg-open index.html      # Linux
```

or serve it: `python3 -m http.server` and visit http://localhost:8000.

## A note on care

Maya is an AI wellness character, **not** a licensed therapist or medical professional, and Stillpoint is a relaxation practice — not medical or psychological treatment. If you're struggling, please reach out to a qualified professional or a local helpline.
