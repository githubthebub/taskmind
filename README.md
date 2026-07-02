# Velvet 🌒

**Guided somatic breathwork for full-body aliveness.**

Velvet is a self-contained web app that guides breath-based somatic practice —
the family of techniques (tantric, Taoist, and modern somatic) that use nothing
but breath, gentle movement, pelvic-floor engagement and attention to build
waves of warmth, tingling and full-body release. No accounts, no tracking,
no dependencies: everything runs and stays in your browser.

## Run it

Any static file server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(It uses ES modules, so open it via a server rather than `file://`.)

## What's inside

- **Five guided sessions** — from a 5-minute *Quick Glow* reset to the
  25-minute flagship *Full-Body Wave*, each a scripted journey of phases
  with timed guidance cues.
- **Breath pacer** — an animated orb that grows and softens with the phase's
  breath pattern (inhale / hold / exhale / rest), with per-phase pacing that
  builds and releases intensity across the session.
- **Synthesized soundscape** — a warm Web Audio drone whose brightness and
  energy track the session's intensity curve, plus soft tones on breath turns
  and a completion chime. No audio files.
- **Spoken guidance** — each cue read aloud via the Speech Synthesis API
  (toggleable).
- **Haptics** — gentle vibration on breath transitions, on devices that
  support it.
- **Journal** — every session logs locally with a "glow" rating and notes;
  streaks and mindful minutes accumulate. Stored in `localStorage` only.
- **Learn tab** — plain-language explanations of how and why the practices
  work, plus safety guidance.
- Screen wake-lock during practice, keyboard controls (space to pause,
  esc to end), reduced-motion mode, safe-area aware mobile layout.

## Architecture

Vanilla ES modules, zero build step, zero dependencies:

```
index.html        shell
css/style.css     design system (dark, warm, per-session tint)
js/data.js        sessions: phases → breath patterns + timed cues
js/audio.js       Web Audio soundscape + cue tones + speech
js/app.js         screens, practice engine, journal, settings
```

The practice engine is a single `requestAnimationFrame` state machine:
phase clock → cue scheduler → breath-cycle segmenter → orb/ring render.

## A note on care

Sessions involve strong circular breathing. Practice seated or lying down,
never while driving or in water; skip intense breathwork during pregnancy or
with cardiovascular, seizure or panic conditions. Velvet is a wellbeing
practice for adults, not medical advice.
