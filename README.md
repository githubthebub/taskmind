# taskmind · somatic

Voice-guided somatic sessions in the browser. A slow, calm voice walks your
attention through your body — breath, weight, warmth, the room — using the
same mechanisms a good somatic practitioner uses in a talk session:

- **Physiological sighs & extended exhales** — direct lever on heart rate
- **Guided interoception** (body scanning, NSDR-style rotation of attention)
- **Urge surfing** — riding out a craving instead of feeding it
- **Grounding / orienting** (5-4-3-2-1, pressing into the floor, scanning the room)
- **Warmth induction** — half-smile, remembered connection, spreading heat

## Sessions

| Session | Length | For |
|---|---|---|
| Urge Surf | 3 min | The exact moment your hand reaches for the phone |
| Slow Tide | 8 min | Full-body down-shift: heaviness, warmth, long exhales |
| Deep Rest | 12 min | NSDR-style body rotation for deep recovery |
| Back to the Room | 5 min | Grounding after a scroll-hole, eyes open |
| Glow | 6 min | The warm full-body state the feed only imitates |

## Running it

It's a static page — no build, no dependencies:

```sh
open index.html            # or just double-click it
# or serve it:
python3 -m http.server 8000
```

Voice comes from your device's built-in speech synthesis
(`window.speechSynthesis`). Nothing is recorded, sent, or stored beyond
three localStorage keys (chosen voice, speed, mute). If the device has no
voices, sessions run as timed captions with the breath pacer.

## Design principles

This exists as a counterweight to attention-extraction apps, so it refuses
their tricks on purpose:

- No account, no tracking, no analytics
- No streaks, badges, or notifications
- No autoplay, no recommendations, no infinite anything
- Sessions **end**, tell you they ended, and suggest a dark screen
- Urge Surf teaches a portable skill so you eventually need the app less

A tool for your nervous system should behave like a tool: you pick it up,
it works, you put it down.

## Anatomy

- `index.html` — the three screens (menu, player, done)
- `styles.css` — dark theme, breathing orb, per-session hue
- `sessions.js` — the session scripts (spoken lines, pauses, breath patterns)
- `app.js` — the player: speech pacing, breath pacer, pause/resume, wake lock
