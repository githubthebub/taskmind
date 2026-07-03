# स्वराज Svaraj — self-rule, practiced daily

> “It is Swaraj when we learn to rule ourselves.” — M. K. Gandhi, *Hind Swaraj* (1909)

A single-file personal training app for the two halves of independence:
the **outer half** (money, skill, a rounded life) and the **inner half**
(a mind that stays yours — calm on demand, in love with the process,
un-bossed by guilt or by gold).

Open `index.html` in any browser. No build, no server, no account.
Everything you enter stays in your browser's local storage; there is an
export/import block under **Mind** for backups.

## The four rooms

| Room | What it trains |
|---|---|
| **Today** | The daily loop: one sit, one mind rep, one evening line ("what did you enjoy about the process today?"), a 14-day practice trail and streak. |
| **Sit** | A jhāna trainer: configurable timer with a breath-paced lamp, singing-bowl bells (WebAudio, no assets), one whispered line per stage (Settle → Anchor → Access → Pleasure → Let go), a hold-to-end control, and a post-sit log (depth reached, pīti 0–5). Progress renders as a depth-over-sits chart with a table view. Includes an honest "fast path" — continuity, runway, gladdening the mind, hunting the pleasant, effort-then-release — after the Leigh Brasington school of accessible jhāna. |
| **Wheel** | A wheel-of-life instrument: eight domains × ten rings, tap to rate (or use the accessible − / + steppers). Weekly check-ins, deltas per domain, the lowest spoke auto-nominated as the week's focus with one tiny process-flavored action, and a balance-over-time line. |
| **Mind** | Three muscles, one rep a day. **Process** (the Alysa Liu move): rewrite one gripped outcome as a process you'd enjoy. **Boundary** (for homes where love and control grew tangled): rotating micro-reps plus kind-but-firm scripts to rehearse. **Money** (the Michael Jackson lesson): decision-rights rules and a freedom calculator — months-of-"no" runway, 25× freedom number, ₹/$/€/£ with Indian-system formatting. |
| **Path** | The game layer. Every rep earns **light**; levels climb from Spark toward Sunrise. A character sheet with five stats (Calm, Joy, Spine, Rights, Balance) leveled purely from real logged reps; weekly **trials** (boss fights on the honor system); fifteen **sigils** (achievements); **lamp oil** that auto-burns to save a streak on a missed day; and the **dawn card** — one variable-reward draw a day, unlocked only by closing the daily loop. Sits begun between 4 and 7 am earn ×1.5 (the brahmamuhūrta multiplier), and a 2-minute "ember" sit keeps zero-motivation days alive. |

## Design notes

- Pre-dawn visual world: indigo grounds with a marigold "lamp" accent; full
  light and dark themes driven by CSS tokens (`prefers-color-scheme` +
  `data-theme` overrides).
- Type: [Eczar](https://fonts.google.com/specimen/Eczar) (display; includes a
  Devanagari subset for the wordmark) and
  [Karla](https://fonts.google.com/specimen/Karla) (text), both embedded as
  data-URI `@font-face` — the file is fully self-contained and works offline.
- Chart colors validated for lightness band, chroma, color-vision-deficiency
  separation, and contrast against both surfaces (marigold `#B87709`/`#BB851C`,
  periwinkle `#5A6BC7`/`#7080D6`).
- Reduced-motion support (the breath lamp becomes a text cue), keyboard-visible
  focus states, tooltips that enhance but never gate (every chart has a
  table/list twin), screen wake-lock during sits.
