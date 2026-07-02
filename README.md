# Stillpoint 🕉️

A playable, self-contained somatic meditation app — a guided descent toward jhana-like absorption, designed to unwind full-body tension and replace the doomscroll reflex with genuine stillness.

**Open `index.html` in any browser. No build, no dependencies, no network.**
Serve it over http(s) and it becomes an **installable PWA** — put it on your phone home screen right where the feeds used to live, and it works fully offline.

## The four practices

| Practice | Length | What it does |
|---|---|---|
| **The Full Descent** | ~14 min | Grounding → progressive full-body release → resonance-breath absorption → contentment → objectless equanimity, structured on the four classical jhana factors |
| **Body Release** | ~7 min | Progressive muscle relaxation only (Jacobson tense–hold–release), region by region from feet to face |
| **Urge Surf** | 90 sec | For the moment you feel the pull to scroll — ride the craving wave until it crests and passes, instead of feeding it |
| **Focus Lock** | 15–90 min | Spend the stillness: one goal, one unbroken block with a progress ring and a slow peripheral breathing orb. Tab away >10s and it gently logs a "drift" and guides you back — no shame, returning is the skill. Chains directly from the end of any meditation. |

## What's inside

- **Paced-breathing orb** — animated at settle (4-in / 6-out), resonance frequency (~5.5 breaths/min), and deep-absorption cadences
- **Spoken guidance** (optional) — SpeechSynthesis reads every cue aloud so you can practice eyes-closed
- **Haptic breath pacing** (mobile) — distinct vibration signatures for inhale / hold / exhale, so the phone breathes with you face-down
- **Body map** — an SVG figure that lights each region as you tense it and cools it as you release
- **Generative ambient audio** — Web Audio API drone with slow theta-range beating and bell chimes; the drone drops in pitch as absorption deepens. No audio files.
- **Craving-curve wave visual** — the urge-surf wave literally rises, crests (~45% in), and falls, mirroring how cravings behave
- **Screen wake lock** — the display stays on through a session, and re-arms if you switch back
- **Streak, still-minutes, focus-minutes, urges-surfed + a 7-day practice trail** — localStorage, fully private
- **PWA** — manifest, offline-first service worker, generated icons; auto-pauses meditation if you leave the tab; space bar pauses/resumes

## Grounding

Techniques drawn from the evidence base a somatic clinician would actually reach for: progressive muscle relaxation (Jacobson), resonance-frequency / HRV breathing, body-scan interoception, urge surfing (Marlatt), and the classical jhana factor progression (vitakka-vicāra → pīti → sukha → upekkhā). This is a training tool for attention, not medical advice.
