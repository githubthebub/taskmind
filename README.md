# 🌏 Culture Bridge — India × Japan × USA × London

A **Pokémon-inspired** browser game whose goal isn't to be the very best, but to
build **practical cross-cultural fluency** across four cultures — **India**,
**Japan**, the **USA** and the **UK (London)**. You explore four connected
regions around a central hub, meet folklore spirits called **Kotomon** in the
tall grass, and *befriend* them by answering questions about **everyday life and
business** — greetings, negotiation, meetings, dining, tipping, and how each
culture really says "no."

It's built to be genuinely useful for **day-to-day interactions and business
negotiations**, with a dedicated **Business Guide** of deal-making etiquette and
a four-way **Phrasebook**.

No build step, no dependencies, no network. Just open it and play.

![Culture Bridge overworld](docs/screenshot-world.png)

## 🚀 Play it

**Online (free hosting):** once this lives in its own public repo (e.g.
`culture-bridge`), it is published with **GitHub Pages** at

> **https://githubthebub.github.io/culture-bridge/**

Every push to the default branch redeploys it automatically via the workflow in
`.github/workflows/deploy-pages.yml` — GitHub Pages is free for public repos, so
there are no hosting fees. (See *Publishing* below for the one-time setup.)

**Locally — no server needed:** the game is a fully self-contained static site
(plain `<script>` tags, no modules, no network), so you can simply
**double-click `index.html`** to open it in any browser. It works offline. If a
browser restricts `file://` access, serve the folder instead:

```bash
# from the project root
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys / **WASD** |
| Talk to people, read signs | **Space** |
| Answer a question | **1–4** (or click) |
| Open **Culturedex** | **C** |
| Open **Phrasebook** | **P** |
| Open **Business Guide** | **B** |

On phones and tablets an on-screen D-pad and buttons appear automatically.

## 🎯 The idea

Classic monster-catching games reward you for *collecting*. Culture Bridge
rewards you for *understanding*. Four roads lead out from a central hub — **India
(west)**, **Japan (east)**, **London (north)** and the **USA (south)** — and each
encounter is a small culture-exchange:

1. Walk into the **tall grass** of any region to meet a **Kotomon**.
2. Answer its question — most are about **real everyday and business situations**:
   handing over a business card in Tokyo, reading British understatement, tipping
   in New York, building trust before a deal in Delhi. **Correct** → you befriend
   it. **Wrong** → it slips away, *but the correct answer and a short explanation
   are always shown*, so you learn either way.
3. Earn **Harmony Points** and fill your **Culturedex** of all 24 spirits to
   become a **Culture Bridge Master**.

### Useful for real life

The content targets the things that actually trip people up abroad and in
negotiations:

- **Communication style** — direct (USA) vs. indirect (Japan, British
  understatement, India's relationship-first approach), and how each says "no."
- **Meetings & hierarchy** — punctuality, business cards, consensus
  ("nemawashi"), seniority, decision-making.
- **Dining & tipping** — 18–20% in the US, ~10–12.5% in the UK, *none* in Japan,
  right-hand dining in India.
- **The connections** — Buddhism's road from India to Japan (Garuda → Karura,
  Saraswati → Benzaiten, stupa → pagoda), so it teaches bridges, not just facts.

## 🐉 The 24 Kotomon

Each spirit is drawn from real folklore and carries a note about its
cross-cultural cousin.

| 🇮🇳 India | 🇯🇵 Japan | 🇺🇸 USA | 🇬🇧 UK |
| --- | --- | --- | --- |
| 🦅 Garuda | 🦊 Kitsune | 🌩️ Thunderbird | 🦕 Nessie |
| 🐍 Naga | 🦝 Tanuki | 🐇 Jackalope | 🦄 Unicorn |
| 🐘 Airavata | 🐢 Kappa | 👣 Sasquatch | 🐲 Welsh Dragon |
| 🦢 Hamsa | 👺 Tengu | 🦋 Mothman | 🧚 Cornish Pixie |
| 🐊 Makara | 🐉 Ryu | 🐃 Babe the Blue Ox | 🌿 Green Man |
| 🐂 Nandi | 🌙 Baku | 🦫 Groundhog | 🐺 Black Shuck |

## 💼 Business Guide & 🗣️ Phrasebook

Press **B** for the **Business Guide** — a quick per-culture cheat sheet of
greetings, hierarchy, communication style, negotiation, punctuality and
dining/tipping etiquette for closing deals and daily life.

Press **P** for the four-way **Phrasebook** — everyday and business phrases side
by side across all four cultures, with native scripts for Hindi (Devanagari) and
Japanese (kana/kanji), and the natural register for US vs. UK English (e.g. a
polite "no": *Nahin* · *Chotto…* · "No, I'll pass" · "I'm not sure that works").

## 🌐 Publishing (one-time setup)

The included workflow deploys to GitHub Pages automatically. To turn Pages on
the first time, pick whichever is easier:

- **Easiest — merge to the default branch.** When this branch's PR merges into
  `main`, the deploy workflow runs and (thanks to `enablement: true`) switches
  Pages on for you. Give it a minute, then open the URL above.
- **Or enable it by hand:** repo **Settings → Pages → Build and deployment →
  Source: GitHub Actions**. Then run the workflow once from the **Actions** tab
  (*Deploy Culture Bridge to GitHub Pages → Run workflow*).

Because the whole game is a static site, it also drops cleanly onto any other
free static host if you ever want an alternative — e.g. **Cloudflare Pages**,
**Netlify** (drag-and-drop the folder), **Vercel**, **Surge**, or **itch.io**.
No server-side code, no database, nothing to pay for.

## 🛠️ Project structure

```
index.html                          Title screen, HUD, overlays, touch controls
css/style.css                       Per-culture retro-game palette (warm/cool/temperate/prairie)
js/data.js                          Content — 24 creatures, questions, phrasebook, Business Guide
js/game.js                          Engine — 4-region world, movement, encounters, quiz, menus
.github/workflows/deploy-pages.yml  Free GitHub Pages deploy on every push to main
```

The overworld is rendered on a `<canvas>`; dialogue, the quiz and the menus are
lightweight HTML overlays. Everything is procedurally drawn, so there are no
image assets to load. Progress is saved to `localStorage`.

## 🌱 Extending the game

- Add a creature: append to `KOTOMON` in `js/data.js` (and an emoji in
  `KOTO_EMOJI` in `js/game.js`).
- Add a question: append to `QUESTIONS` in `js/data.js`. Set `link: true` for
  questions about the India ↔ Japan connection (they're worth more points).
- Add a phrase: append to `PHRASEBOOK` in `js/data.js`.
- Reshape the world: edit `buildWorld()` in `js/game.js`.

---

*Two lanterns, one flame.* 🪔🏮 Made to celebrate the friendship between India
and Japan — **दोस्ती** / **友情**.
