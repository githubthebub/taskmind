# SWARAJ — Rule Your Mind
### Game design document · v1.0 · July 2026

> *"Swaraj is when we learn to rule ourselves."* — M.K. Gandhi, Hind Swaraj (1909)

A mobile-first life-simulation card game in which you live one Indian life from 2026 to 2047 —
and discover, through play, that the strongest decolonial act is neither cringe nor bluster,
but building with open eyes. Evidence base: [RESEARCH.md](RESEARCH.md).

---

## 1. The thesis (stated once here, never lectured in-game)

Colonialism's longest-lived export was a *mentality* — measurable today in a 34% English wage premium,
a half-billion-dollar fairness-cream market, and a validated psychometric scale (CMS-AI). But the mirror
image — hollow supremacism, golden-age fantasy, forwarded pseudo-history — is, per Ashis Nandy, *still
the colonized mind*, just wearing a different mask.

**The game's procedural argument:** a life (and a nation) compounds best from the narrow middle path —
confident, rooted, evidence-hungry, open to the world without needing its approval. We call that state
**Swaraj**: self-rule.

The player is never told this. The rules make them discover it.

## 2. Design pillars (each traces to research)

| Pillar | Research basis |
|---|---|
| **P1. The argument lives in the mechanics** | Bogost's procedural rhetoric; September 12th; Papers Please |
| **P2. Two failure axes, one virtue: discernment** | Nandy's mirror-trap; Táíwò's decolonization-2; Vaimanika Shastra fiasco |
| **P3. Real trade-offs, never strawmen** | English premium is real (34%); sarkari security is rational (80:1 odds); the game respects the player's constraints |
| **P4. ≤40% on-message content** | Kaufman & Flanagan embedded design (45% beat 75%) |
| **P5. Transparent causality** | Democracy 3 focus groups; "why did India change?" shown after every card |
| **P6. Daily ritual, streaks, shareable artifact** | Meta-analyses: multi-session >> one-shot; Wordle; Duolingo identity streaks |
| **P7. One thumb, two minutes, zero install** | Reigns; Google NBU; 5–10 min Indian session pattern |
| **P8. Constraint must be felt** | Spent's agency trap — some cards offer no good option, by design |
| **P9. Cross-communal, non-partisan, careful with pain** | Pew (95% of Muslims very proud Indians); FAU-G's failure; NCRB student-suicide data handled as support-not-depiction |

## 3. Core loop

```
draw card → one-thumb choice (2 options) → consequences ripple:
  YOU   (₹ Wealth · ❤️ Wellbeing · 🌱 Roots · 📣 Voice)
  MIND  (Compass: Cringe ◄— SWARAJ —► Bluster, hidden needle)
  BHARAT(🕊 Soft Power · 🛡 Hard Power · 🏠 Jan Jeevan/QoL)
→ occasional RECEIPT drops (collectible sourced fact)
→ occasional FORWARD arrives (claim to verify — real or counterfeit?)
→ life stage advances (2026 student → 2047 elder) → ENDING + share grid
```

**A full life ≈ 32 cards ≈ 8–12 minutes. Daily Chai mode = 10 cards, date-seeded, same for everyone, streak-tracked.**

### 3.1 Personal meters (Reigns-style: hitting 0 or 100 has consequences)

- **₹ Wealth** — income, debt, security. Zero → debt spiral ending.
- **❤️ Wellbeing** — health, stress, family bonds. Zero → burnout arc (handled as recovery-with-support, never harm; Tele-MANAS 14416 surfaced in-fiction).
- **🌱 Roots** — language, craft, food, festivals, elders; the Coomaraswamy meter. Zero → "a stranger at your grandmother's table."
- **📣 Voice** — agency, civic weight, credibility. Zero → decisions get made *about* you.

### 3.2 The Mindset Compass (the heart)

One axis. Left: **Cringe** (Fanon/CMS-AI internalized inferiority — the accent apology, the fairness cream, the foreign-stamp hunger). Right: **Bluster** (Nandy's mirror — the WhatsApp forward, the golden-age fantasy, the purity-purge). Center: **Swaraj** — discernment.

- Choices nudge the needle. The needle back-pressures the game: deep-Cringe unlocks worse "approval" cards and quietly taxes Roots and Voice; deep-Bluster inflates pride events but crashes credibility (Voice) when forgeries are exposed, and blocks learning cards.
- The needle is **shown but never named as a score** — players see a compass, not a judgment.
- **Both rails are engineered to *feel good short-term***: Cringe pays Wealth early (the premium is real!), Bluster pays Pride early. The compounding penalty arrives later — procedural rhetoric, not punishment copy.

### 3.3 Bharat meters and visible causality

Soft Power, Hard Power, Jan Jeevan start at 2026 baselines (42/38/45). Player choices emit externalities with a one-line **"because" receipt**: *"You bought the Indian-brand earbuds → 2M others did too → the brand funds R&D → 🕊+1"* — always the real documented chain (Mintel's 2:1 shift, PLI, UPI's vendor-adoption story). India@2047 is rendered from these meters at the end.

### 3.4 Receipts (collection layer)

Sourced fact cards that drop from relevant choices — Maddison's 24.4%→4.2%, Naoroji's Rs 20 vs 34, Dharampal's 11,575 schools, UPI's 20B/month, $129B remittances, 34x defense exports, the 9.5%-of-GDP air bill. ~40 in v1. Each card: fact, number, source line, one-tap "how solid is this?" nuance note (e.g. Tirthankar Roy's caveat lives *inside* the Maddison card — the game teaches the fight, not just the flag).

### 3.5 Forwards (the discernment mechanic — the signature system)

Periodically a **forward arrives from the family group**: a claim, real or counterfeit.
- *Counterfeit example*: "NASA confirms Vedic-era interplanetary craft" → **Forward it**: instant Bluster+pride, and 2–5 cards later the debunk lands (IISc 1974) → Voice crashes, a niece stops asking you questions. **Verify first**: costs a turn, reveals the truth, and *converts* into the real receipt the forgery was counterfeiting (you lose the aircraft, you gain Sushruta's rhinoplasty or Madhava's series — documented and better).
- *Real example*: "UPI does half the world's real-time payments" → verifying pays double; dismissing real achievements as "WhatsApp propaganda" is a **Cringe** move — skepticism itself can be a colonial reflex when it only points one way.
- Procedural lesson: **real pride needs no forgery, and reflexive doubt is not rigor.** Bonus payload: general misinformation hygiene.

### 3.6 Content mix (P4 discipline)

~55 life cards in v1: ≈35% mindset-loaded, ≈25% structural/economic (jobs, exams, migration — where constraint is felt), ≈40% pure life (cricket, monsoon, weddings, chai, traffic, in-laws) that move meters without compass weight. Humor is load-bearing: the register is Hinglish, affectionate, never sneering.

## 4. A life in cards (structure)

Four stages, cards drawn from stage-tagged decks with light adjacency logic:

1. **Student (2026–2031)** — stream choice, language pride vs. accent shame at the debate club, coaching pressure (support-a-friend framing), the fairness-cream aunty, first vote.
2. **Builder (2031–2038)** — sarkari vs. startup vs. abroad (all three genuinely viable — the game models odds and remittances honestly), UPI QR for the family shop, the foreign-degree interview surprise (45% say it didn't help), buying Indian vs. imported.
3. **Householder (2038–2044)** — matrimonial "fair bride demanded" pushback, daughter's language, sister's job (LFPR chain), rooftop solar, stubble/crackers airshed choices, teaching yoga abroad vs. licensing it (the 4%-capture problem).
4. **Elder (2044–2047)** — what you fund, what you archive (Dharampal-style document hunting), what the niece inherits: your library or your grievances. Final card lands on 15 Aug 2047.

**Endings** = compass zone × meter profile × Bharat state. Sixteen title cards, e.g. *The Rooted Builder* (Swaraj, balanced), *The Golden Cage* (Cringe, rich, unrooted), *The Loud Hollow* (Bluster, high pride, no credibility), *The Bridge* (diaspora path done well — remittances + return knowledge), *The Quiet Repairwoman* (low wealth, massive Jan Jeevan externalities — the game honors the unglamorous plumbing).

## 5. Share artifact (spoiler-free)

```
SWARAJ · Life #217 · 🧭 centred
🪙🪙🪙⬜ ❤️❤️❤️❤️ 🌱🌱🌱🌱 📣📣📣⬜
🇮🇳 2047 → 🕊▲9 🛡▲6 🏠▲11 · 🧾 23/40 receipts
swaraj.game
```
Reveals shape, not choices — Wordle's status-ritual logic.

## 6. Product & business (the "make money" answer)

**Positioning**: "educational/social game" under the 2025 Online Gaming Act — the state-blessed, 18%-GST category (RMG's 40% sin-tax and ban don't touch us). Rides Lumikai's named "digital decolonisation" consumer trend. The niche — mobile-first mass-market mindset game — is empty worldwide (§6, RESEARCH.md).

**Ladder** (each rung validated by an existing Indian success):
1. **v1 (this repo)**: free single-file web game, zero-install, <200KB, offline-capable — distribution via link-sharing in the same WhatsApp channels the Forwards mechanic satirizes. KPI: daily-return rate, share rate.
2. **Ads-light** (Ludo King model, ~80% of Indian game revenue is ads): opt-in rewarded video only — "watch to unlock yesterday's Daily Chai." Never interstitials mid-life.
3. **Micro-IAP ₹29–₹299** (UPI two-tap): cosmetic life-skins (Chennai 1997 start, Kota aspirant, NRI return), extra life-slots, receipt-deck themes. No pay-to-win — the compass can't be bought, which is itself on-message.
4. **Season pass ₹99/quarter** (STAGE's 4.4M-subscriber proof that Bharat pays for identity content): monthly card-pack drops — new states, new decades (play 1991, play 1947), vernacular narrative layers (Hindi/Tamil/Telugu audio first — 70% prefer English UI, but story wants mother tongue).
5. **B2B/institutional**: school & civics editions (When Rivers Were Trails' classroom path, PhysicsWallah pricing), CSR partnerships (financial-literacy cards already map to Jan Dhan/DBT content), state AVGC-XR grants (TN ₹1-crore startup grants; Maharashtra policy) for vernacular expansion.
6. **IP flywheel**: the Receipts deck is a licensable fact-checked content library (creators, quiz shows, textbooks).

**Deliberately excluded**: real-money anything (banned + against thesis), engagement-bait notifications beyond one daily nudge, data harvesting (localStorage only in v1), dark-pattern streak guilt (Duolingo's streak *wager* yes, shame copy no).

## 7. Ethical guardrails (binding)

1. **No communal content.** Pride events are cross-communal by sourcing (Pew: 95% of Muslims very proud Indians). No religion-vs-religion card, ever.
2. **Non-partisan.** Policies appear by documented outcome (UPI, Swachh Bharat, PLI), never by party framing. Both civic pushback and civic building are rewarded paths.
3. **Exam stress = support, never depiction.** The Kota arc is about helping a friend and surviving a year; Tele-MANAS 14416 appears diegetically.
4. **Colorism content punches at the market, not the victim.**
5. **The Bluster rail never mocks faith or heritage** — it targets *forgery and hollowness*, and every counterfeit converts to a real, sourced achievement.
6. **Facts carry their fights**: contested numbers ($45T) ship with their caveats. Discernment is the product.
7. **Emigration is not treason in-game**: the Bridge ending honors the diaspora chain ($129B remittances, MOSIP, CEO soft power). Decolonial ≠ closed.

## 8. Technical spec (v1, this repo)

- **Single self-contained `index.html`**: vanilla JS + CSS, zero dependencies, zero network calls, works from `file://`, deploys as GitHub Pages / any static host. Target <200KB.
- Mobile-first 390px layout scaling to desktop; one-thumb hit-targets ≥48px; dark/light via `prefers-color-scheme` + toggle.
- `localStorage`: streaks, receipt collection, best endings, settings. No accounts, no analytics in v1.
- Deterministic PRNG (mulberry32) — Daily Chai seeds from the date (Asia/Kolkata), Life mode seeds from run counter; identical daily deck for all players.
- Share: `navigator.share` with clipboard fallback, emoji grid as in §5.
- Accessibility: semantic buttons, `aria-live` meter announcements, reduced-motion respect, WCAG-AA contrast in both themes.
- Roadmap after v1: service-worker offline pin, Hindi narrative layer, Capacitor wrap for Play Store (<20MB), remote daily-card CMS.

## 9. Success metrics

- **Engagement**: D1/D7 return, mean sessions/week (target ≥3 — the meta-analytic multi-session threshold), share-rate per completed life.
- **Persuasion proxy** (v2, opt-in): 6-item pre/post CMS-AI-derived micro-survey after 2 weeks of play — the rare case where a validated instrument exists for the exact construct.
- **The real KPI**: verify-rate on Forwards rising over a player's lifetime. The game succeeds when checking becomes the reflex.
