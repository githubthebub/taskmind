# 🏮 Culture Bridge — The Four Lanterns

A story-driven, top-down adventure across four cultures — **India**, **Japan**,
the **USA** and the **UK (London)**.

**The quest:** a cold **Grey Static** — the chill of people no longer
understanding each other — has dimmed the four **Lanterns** that lit the World
Bridge, and clouds of **Muddles** (misunderstanding) now block the lands. As the
new **Bridgekeeper**, you must travel the four countries, win people over to
befriend folklore companions called **Kindreds**, use your new friends to
**dispel the Muddles**, relight all four **Lanterns**, and reunite the world.

You don't get quizzed; you **play**. You meet locals and **choose how to act** —
bow or shake hands, tip or don't, queue or push in. They react like real people,
so you learn the **dos and don'ts by consequence**, and understanding becomes
the magic you use to beat the Static. Every interaction quietly notes what you
learned in your **Journal**, stamps your **Passport**, and raises your
**rapport**.

> The collectible "Kindreds" are original folklore companions — nothing to do
> with any other game's "Pals" or "-mon".

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
| Move forward / left / right | **W** / **A** / **D** |
| Move down (and all directions) | **Arrow keys** |
| Talk to a local, read a sign | **Space** |
| Choose an action in a scene | **1–4** (or click) |
| Open the **Menu** | **F** or **Enter** |
| **Bicycle** on/off (on 🚲 cycle paths) | **S** |
| Quick-open Friends / Phrasebook / Business / Journal | **C** / **P** / **B** / **J** |

On phones and tablets an on-screen D-pad plus **Talk**, **Menu** and **🚲**
buttons appear automatically.

## 🎯 The quest loop

Four roads lead out from a central crossroads — **India (west)**, **Japan
(east)**, **London (north)** and the **USA (south)**. Gateway flags and passport
stamps make it obvious where you're going. To relight a country's **Lantern**:

1. **Explore** the country (bike the cycle paths to go faster). Your current
   objective is always shown in the banner under the HUD.
2. **Befriend a Kindred.** Wander the tall grass and a curious folklore companion
   appears in a **situation** — a Tokyo shopkeeper bows, a New York colleague
   puts out their hand, a London bus queue forms. **Choose how to act.** Good
   manners charm the Kindred and it joins you; a faux pas gets a gentle, funny
   reaction (nothing is punished harshly). You need at least one local friend to
   fight the Static.
3. **Dispel the Muddles.** Grey **Muddles** of misunderstanding block each land.
   Walk into one and — with your Kindred glowing at your side — show the local
   way to melt it into understanding. Clear all three in a country…
4. **…and its Guardian appears** (Garuda, Ryu, the Red Dragon, the Thunderbird)
   to **relight the Lantern**. 🏮
5. Relight **all four Lanterns** and the World Bridge knits itself whole — you win.

Whatever you choose, the custom is noted in your **Journal**, your **rapport**
rises, and your **Passport** fills. Because you learn by *doing and seeing the
reaction*, the etiquette sticks the way it does when you actually travel.

### What you pick up along the way

- **Greetings** — bow (Japan), Namaste (India), firm handshake (USA), reserved
  handshake + weather chat (UK); when a hug is fine and when it isn't.
- **Dining & tipping** — 18–20% in the US, ~10–12.5% in the UK, *none* in Japan,
  right-hand eating in India, chopstick taboos.
- **Everyday manners** — queue in London, remove your shoes in India/Japan, read
  British understatement, buy your round at the pub.
- **Doing business** — business cards in Tokyo, relationship-first deals in
  Delhi, directness in New York — deepened in the **Business Guide** (menu).

## 🐉 The 24 Kindreds

Original folklore companions you befriend, one set per country.

| 🇮🇳 India | 🇯🇵 Japan | 🇺🇸 USA | 🇬🇧 UK |
| --- | --- | --- | --- |
| 🦅 Garuda | 🦊 Kitsune | 🌩️ Thunderbird | 🦕 Nessie |
| 🐍 Naga | 🦝 Tanuki | 🐇 Jackalope | 🦄 Unicorn |
| 🐘 Airavata | 🐢 Kappa | 👣 Sasquatch | 🐲 Welsh Dragon |
| 🦢 Hamsa | 👺 Tengu | 🦋 Mothman | 🧚 Cornish Pixie |
| 🐊 Makara | 🐉 Ryu | 🐃 Babe the Blue Ox | 🌿 Green Man |
| 🐂 Nandi | 🌙 Baku | 🦫 Groundhog | 🐺 Black Shuck |

## 📖 The Menu — Friends, Passport, Journal & more

Press **F** (or **Enter**) any time for the Menu:

- **🧑‍🤝‍🧑 Friends** — the Kindreds you've befriended (and hints for the rest).
- **🛂 Passport** — which countries you've visited and your rapport with each.
- **📖 Journal** — every custom you've discovered, grouped by country. This fills
  itself as you play — the record of what you learned by doing.
- **🗣️ Phrasebook** — everyday & business phrases side by side across all four
  cultures, with native scripts for Hindi (Devanagari) and Japanese (kana/kanji),
  and the natural register for US vs. UK English (a polite "no": *Nahin* ·
  *Chotto…* · "No, I'll pass" · "I'm not sure that works").
- **💼 Business Guide** — a per-culture cheat sheet of deal-making etiquette:
  greetings, hierarchy, communication style, negotiation, punctuality, tipping.

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
js/data.js                          Content — 24 Kindreds, interaction SCENES, phrasebook, guide
js/game.js                          Engine — 4-region world, movement, bike, scenes, menu, passport
.github/workflows/deploy-pages.yml  Free GitHub Pages deploy on every push to main
```

The overworld is rendered on a `<canvas>`; dialogue, scenes and the menu are
lightweight HTML overlays. Everything is procedurally drawn, so there are no
image assets to load. Progress (friends, passport, rapport, journal) is saved to
`localStorage`.

## 🌱 Extending the game

- Add a companion: append to `KINDREDS` in `js/data.js` (and an emoji in
  `KINDRED_EMOJI` in `js/game.js`).
- Add a situation: append to the right culture in `SCENES` in `js/data.js` — give
  each action a `good` flag, a `reaction`, and the `tip` it teaches.
- Add a phrase or business tip: append to `PHRASEBOOK` / `BUSINESS_GUIDE`.
- Reshape the world (regions, cycle paths, flags): edit `buildWorld()` in
  `js/game.js`.

---

*Learn the world by living in it.* 🌏 Namaste · こんにちは · Howdy · Alright, mate?
