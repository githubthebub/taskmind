# 🦴 Backbone — The Big Five Training Game

A game that trains the **Big Five personality traits your culture actually rewards** — and, most
importantly, trains you to **never be a doormat** and to **stop anxiety and negative emotion from
running your life**.

No AI. No backend. No accounts. No network calls. Just a static web page — your progress lives in
your browser's localStorage.

## Play it

Open `index.html` in any modern browser. That's it.

Or serve it locally if you prefer:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's in the game

| Mode | What it trains |
|---|---|
| 🎭 **Situations** | Real-life dilemmas (pushy boss, flaky friend, credit-stealing coworker…). Every round has doormat, aggressive, avoidant, and assertive options — assertiveness always wins, everywhere. |
| 🔍 **Spot the Distortion** | CBT-style rounds: name the thinking trap (catastrophizing, mind reading, all-or-nothing…) behind an anxious thought, then see the reframe. |
| 🗣️ **Say It With Spine** | Pick the wording that's firm without fangs. Teaches real techniques: broken record, fogging, DESC scripts, saying no without a novel. |
| 🌬️ **Steady Breath** | Box-breathing pacer (4-4-4-4) with a rhythm-tap bonus. Trains the body's calm switch. |

## The culture system

Pick your country (28 included) or a general culture style (Direct Individualist, Harmony
Collectivist, Honor Culture, Nordic Egalitarian, Latin Expressive, Startup Hustle). Each profile has:

- **Trait weights** — which of the Big Five that culture especially rewards. XP for those traits is
  boosted, and the radar chart shows your training vs. the culture's target profile.
- **A directness rating** — which *style* of assertiveness scores best. Blunt-and-brief wins the
  style bonus in Germany or the Netherlands; firm-but-face-saving wins it in Japan or Thailand.

The invariant: **doormat and blow-up answers lose points in every culture.** Only the wrapping of
assertiveness changes, never the spine.

## Progression

- XP and levels for all five traits (Neuroticism is trained *down*, shown as its mirror,
  **Emotional Stability**)
- 🦴 **Backbone Meter** — your assertive share when someone pushes on you
- 😌 **Calm Meter** — built from distortions caught, anxiety rounds won, and breathing sessions
- Daily streaks, 12 badges, and a radar chart of you vs. your culture's target

## Honest fine print

Culture profiles are broad-brush averages from cross-cultural research, not boxes for individuals.
The anxiety training is based on real CBT ideas (cognitive reframing, exposure, worry scheduling,
paced breathing), but this is a game, not therapy — if anxiety is seriously interfering with your
life, a professional is the real power-up.

## Stack

Vanilla HTML/CSS/JS. Three script files, one stylesheet, zero dependencies.

```
index.html      # all screens
styles.css      # theme
js/data.js      # cultures, scenarios, distortion deck, drills, badges
js/engine.js    # state, scoring, leveling, streaks, persistence
js/app.js       # UI, minigames, radar chart, breathing pacer
```
