# 🧭 SWARAJ — Rule Your Mind

**A mobile-first life-simulation game about the Indian mind — between colonial cringe and hollow bluster.**

Live one Indian life from 2026 to 2047. Every one-thumb choice moves four personal meters
(🪙 Wealth · ❤️ Wellbeing · 🌱 Roots · 📣 Voice), nudges a hidden **Mindset Compass**
(Cringe ◄— SWARAJ —► Bluster), and ripples — with the causal chain shown every time — into
three national meters (🕊 Soft Power · 🛡 Hard Power · 🏠 Jan Jeevan).

> *"Swaraj is when we learn to rule ourselves."* — M.K. Gandhi, Hind Swaraj (1909)

## Play it

Open **`index.html`**. That's it — single file, zero dependencies, no build step, no network,
works offline from `file://`, deploys to any static host (GitHub Pages ready).

```bash
# local
open index.html            # or double-click it
# or serve
python3 -m http.server 8080
```

## What's in the box

| Piece | What it is |
|---|---|
| **Full Life** | 32 cards, 2026 → 15 Aug 2047 (India@100), ~10 minutes |
| **Daily Chai** | 10 date-seeded cards — identical for every player, streak-tracked (Wordle loop) |
| **Forwards** | The signature system: claims land in "the family group" — forward, dismiss, or *verify*. Counterfeits (Vedic aircraft, the fake Macaulay quote) convert on verification into the **real** achievement they were counterfeiting (Sushruta, the actual 1835 Minute) |
| **🧾 Receipts** | 40 collectible, sourced fact cards — Maddison's GDP tables, Dharampal's school surveys, $129B remittances, UPI's 20B/month, the 9.5%-of-GDP air bill. Contested numbers ship with their caveats ("the fight") |
| **16+ endings** | From *The Rooted Builder* to *The Golden Cage* to *The Loud Hollow*, plus an India@2047 state rendered from your externalities |
| **Share artifact** | Spoiler-free emoji grid, built for the very WhatsApp groups the game gently teases |

## The one-sentence thesis

The colonial hangover is real and measurable (a 34% English wage premium, a half-billion-dollar
fairness-cream market, a validated psychometric scale) — but its mirror image, forwarded
pseudo-history and golden-age bluster, is *still the colonized mind* (Nandy, 1983). The game's
only doctrine, argued through mechanics rather than lectures: **discernment**. Real pride needs
no forgery, and reflexive doubt is not rigor.

## Docs

- [`docs/RESEARCH.md`](docs/RESEARCH.md) — the evidence base: six-track research synthesis with sources
  (Indian public sentiment 2023–26, documented colonial-hangover phenomena, the decolonial canon and
  its guardrails, soft/hard-power levers with numbers, persuasive-game meta-analyses, market landscape)
- [`docs/DESIGN.md`](docs/DESIGN.md) — design pillars, systems, content rules, ethical guardrails,
  monetization ladder & go-to-market for the Indian market, technical spec, success metrics

## Design guardrails (binding)

No communal content · non-partisan · exam-stress storylines are support-only (Tele-MANAS 14416
appears in-fiction) · colorism content punches at the market, never the victim · every counterfeit
claim converts to a real, sourced achievement · facts carry their caveats · the diaspora path is a
winning path.

## Privacy

Everything runs on-device. No accounts, no analytics, no network calls. Streaks and the receipt
collection live in `localStorage` only.
