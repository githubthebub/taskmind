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
| 🎲 **Life Board** | The flagship: a roll-and-move board game (30 tiles, serpentine path) where every landing draws from the other modes' decks — Trivial-Pursuit style. Strong answers earn coins, assertive ones grant a spine boost forward, doormat answers slide you back two tiles, bad calls cost hearts. Reach 🏆 before your hearts run out. |
| 🧳 **Workplace Backbone Test** | The shareable front door: ten fixed office standoffs — identical for everyone, so scores compare — producing a **Backbone Index /100** with a tier (Velvet Tank Tier, Boundary Builder, Selective Spine, The Over-Accommodator), a professional result card, and pre-written LinkedIn-voice + group-chat-voice share copy. A quick-start button on the first screen skips culture setup straight into it. |
| 🎭 **Situations** | Real-life dilemmas (pushy boss, flaky friend, credit-stealing coworker…). Every round has doormat, aggressive, avoidant, and assertive options — assertiveness always wins, everywhere. |
| 🔍 **Spot the Distortion** | CBT-style rounds: name the thinking trap (catastrophizing, mind reading, all-or-nothing…) behind an anxious thought, then see the reframe. |
| 🗣️ **Say It With Spine** | Pick the wording that's firm without fangs. Teaches real techniques: broken record, fogging, DESC scripts, saying no without a novel. |
| 🌬️ **Steady Breath** | Box-breathing pacer (4-4-4-4) with a rhythm-tap bonus. Trains the body's calm switch. |
| 💼 **Career Ladder** | A 6-rung campaign: interview → new hire → establishing yourself → **the negotiation table** (labels, mirrors, calibrated questions, holding silence — inspired by publicly taught techniques from Chris Voss and Charisma on Command) → the promotion push → leading people. Clear each rung with 2 of 3 strong moves. |
| ❤️ **Relationships** | Six chapters, romantic **and platonic**, playable in any order — nothing is locked, because you know where you are in life: first dates, friendship, getting real, conflict & repair, worlds collide (in-laws, friends, holidays), the long haul. |
| 🛡️ **Safety Radar** | Defensive awareness rounds: name the manipulation or scam tactic (refusing to hear "no", forced teaming, loan-sharking, typecasting, urgency + authority, romance-scam fast-forwarding, isolation, upfront-fee job scams) and make the safe call. |
| ⚡ **The Gauntlet** | Timed rapid-fire mode built to be watched: ~12-second rounds, 3 lives, combo multipliers, screen shake, confetti — ending in a shareable "the game reads you as…" verdict card (The Velvet Tank, The Recovering Doormat, The Flamethrower…). |
| 📅 **Daily Gauntlet** | Wordle-style: everyone on Earth gets the *same* 10 rounds each day (seeded from the date — still no backend), one scored attempt, and an emoji-grid result (🟩🟩🟥⬛…) built for pasting into group chats. Unlimited practice runs stay available. |
| 🧪 **Perception Lab** | Behavioral-science alchemy inspired by ideas Rory Sutherland popularized: the Uber-map queue fix, costly signaling, the doorman fallacy, certainty-beats-speed, and making the train ride better instead of faster. |

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
- Two persistent campaigns: the Career Ladder (ordered rungs with promotions) and Relationships (unordered chapters — clear them in any order)
- Daily streaks, 26 badges, and a radar chart of you vs. your culture's target
- Fine-grained resets: zero out any single meter, campaign, or record (with double-tap confirm) without touching the rest — earned badges always stay
- A glassmorphism UI: animated aurora backdrop, frosted panels, floating score popups, combo streaks, and confetti where deserved (all effects respect `prefers-reduced-motion`)
- A shareable archetype verdict ("The Velvet Tank", "The Recovering Doormat"…) computed from how you actually play, with one-tap copy

## Honest fine print

Culture profiles are broad-brush averages from cross-cultural research, not boxes for individuals.
The anxiety training is based on real CBT ideas (cognitive reframing, exposure, worry scheduling,
paced breathing), but this is a game, not therapy — if anxiety is seriously interfering with your
life, a professional is the real power-up.

**Disclaimer:** Backbone is for education and entertainment only, provided "as is" with no
warranties. It is not professional advice of any kind — medical, psychological, legal, financial,
career, or personal-security — and no strategy in it guarantees any outcome. Scenarios are
simplified fiction; you are responsible for your own decisions, and the creators accept no
liability for any loss arising from use of the game. In real danger, contact local emergency
services. The negotiation rounds are inspired by publicly taught techniques (e.g., Chris Voss's
tactical empathy, Charisma on Command's delivery principles); Backbone is independent and not
affiliated with or endorsed by them. The full disclaimer is on the in-game "How this works" page.

## Stack

Vanilla HTML/CSS/JS. Three script files, one stylesheet, zero dependencies.

```
index.html      # all screens
styles.css      # theme
js/data.js      # cultures, scenarios, distortion deck, drills, badges
js/engine.js    # state, scoring, leveling, streaks, persistence
js/app.js       # UI, minigames, radar chart, breathing pacer
```

## Also in this repo: Archetype Atlas

A person–culture fit simulator: measure your Big Five temperament, live five days of ordinary dilemmas in one of seven societies (India, London, Japan, China, Germany, Switzerland, USA), and find out which personality archetype you could sustainably lead with there — and what it would cost you.

→ Open [`archetype-atlas/index.html`](archetype-atlas/index.html) in a browser (no build, no dependencies). See [`archetype-atlas/README.md`](archetype-atlas/README.md) for the model and its grounding.
