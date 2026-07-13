# 🌏 Culture Bridge — India × Japan

A **Pokémon-inspired** browser game whose goal isn't to be the very best, but to
build **cross-cultural fluency between India and Japan**. You explore two
connected regions — **Bharat** (India) and **Nihon** (Japan) — meet folklore
spirits called **Kotomon** in the tall grass, and *befriend* them by answering
questions about language, food, festivals, and the ancient threads that link
these two great cultures.

No build step, no dependencies, no network. Just open it and play.

![Culture Bridge overworld](docs/screenshot-world.png)

## ▶ How to play

Open `index.html` in any modern browser. If your browser blocks the local
files, serve the folder instead:

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

On phones and tablets an on-screen D-pad and buttons appear automatically.

## 🎯 The idea

Classic monster-catching games reward you for *collecting*. Culture Bridge
rewards you for *understanding*. Every encounter is a small culture-exchange:

1. Walk into the **tall grass** (spice gardens in Bharat, bamboo groves in
   Nihon) to meet a **Kotomon**.
2. Answer its culture question. **Correct** → you befriend it and it joins your
   Culturedex. **Wrong** → it slips away, *but the correct answer and a short
   explanation are always shown*, so you learn either way.
3. Earn **Harmony Points** and fill your **Culturedex** of all twelve spirits to
   become a **Culture Bridge Master**.

### Why India *and* Japan?

The two cultures are more connected than most people realise, and the game
foregrounds those links on purpose:

- Buddhism travelled from **India → China → Japan**, carrying gods, words and art.
- The Hindu eagle **Garuda** became Japan's temple guardian **Karura** (迦楼羅).
- The goddess **Saraswati** became Japan's **Benzaiten**.
- The Indian serpent **Naga** became the East-Asian **dragon / Ryu**.
- The Indian **stupa** evolved into the Japanese **pagoda**.
- Indian **curry** became Japan's beloved **kare raisu**.
- Sanskrit **namas** (as in *Namaste*) is the root of the Buddhist chant **Namu**.

These aren't trivia footnotes — they're woven through the creatures, the quiz
explanations, and the NPC dialogue.

## 🐉 The twelve Kotomon

Each spirit is drawn from real folklore and carries a note about its
cross-cultural cousin.

| Bharat (India) | Nihon (Japan) |
| --- | --- |
| 🦅 **Garuda** — the sky-sovereign | 🦊 **Kitsune** — the clever fox |
| 🐍 **Naga** — the river-keeper | 🦝 **Tanuki** — the jolly shapeshifter |
| 🐘 **Airavata** — the cloud-elephant | 🐢 **Kappa** — the river-child |
| 🦢 **Hamsa** — the wisdom-swan | 👺 **Tengu** — the mountain warrior |
| 🐊 **Makara** — the tide-beast | 🐉 **Ryu** — the wish-dragon |
| 🐂 **Nandi** — the steadfast bull | 🦄 **Baku** — the dream-eater |

## 🗣️ Bilingual phrasebook

Press **P** any time for a quick Hindi ↔ Japanese phrasebook with native
scripts (Devanagari and kana/kanji) and romanisation — from *Namaste* /
*Konnichiwa* to *Dost* / *Tomodachi* ("friend").

## 🛠️ Project structure

```
index.html        Title screen, HUD, overlays, touch controls
css/style.css     A warm-meets-cool retro-game look
js/data.js        All learning content — creatures, questions, phrasebook, signs
js/game.js        The engine — tile world, movement, encounters, quiz, Culturedex
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
