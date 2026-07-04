# 🧭 Better Decisions

A private, fully offline **decision coach**. No AI backend, no account, no
tracking — just open `index.html` in any browser.

## What it is

You pick a life area from an interactive wheel (Relationships, Career, Money,
Habits, Mind, Purpose), and the app walks you through a **chat-style guided
conversation**. It feels like talking to a coach, but every reply is a
hand-authored node in a decision tree — there is no text input and no model;
you navigate by choosing from response chips. That's a feature: the content is
deterministic, curated, and works with zero network access.

## The knowledge base

Pathways are built from evidence-based frameworks and popular educators:

| Source | What it contributes |
|---|---|
| **CBT** | Cognitive distortions, thought records, decatastrophising, exposure ladders |
| **DBT** | Wise Mind, DEARMAN, opposite action, TIPP, urge surfing |
| **Psychosomatic / somatic work** | Body-first checks, vagal breathing, interoception before big decisions |
| **HealthyGamerGG (Dr. K)** | Dopamine & purpose, rumination, burnout vs. exhaustion, attachment |
| **Dr. Judy Ho** | Self-sabotage, approach vs. avoidance goal framing |
| **Ali Abdaal** | Feel-good productivity, regret minimisation, energy audits |
| **Charisma on Command** | Sub-communication, covert contracts, social confidence |
| **Big Think** | Dan Gilbert (hedonic adaptation), Barry Schwartz (paradox of choice), Cal Newport (career capital), Suzy Welch (10/10/10) |

Example pathways:

- **Money → big purchase** — why you hedonically adapt to the Ferrari, and
  what to buy instead (experiences, anticipation, time).
- **Relationships → dating** — covert contracts ("kindness is the baseline,
  not the offer") and partner selection ("'boring' is what safety feels like
  to a nervous system trained on chaos").
- **Career → should I quit?** — regret minimisation, fear-setting, and the
  dread-vs-flatness diagnostic.

## Features

- 🎡 Interactive SVG life wheel + card grid
- 💬 Chat UI with typing indicator and tappable response chips (no free text — by design)
- 🧠 34 saveable **insight cards** with technique tags, sources, and concrete action steps
- 🧰 **Toolbox** view teaching the 10 core frameworks standalone
- 🔖 **Saved insights** persisted to `localStorage` only
- 🌗 Dark/light theme, responsive down to phone widths, reduced-motion support

## Running

No build step, no dependencies:

```sh
open better-decisions/index.html        # or just double-click it
# — or serve it —
npx http-server better-decisions
```

## Files

```
index.html   app shell (4 views: wheel, chat, toolbox, saved)
styles.css   theming + layout
data.js      AREAS, TOOLBOX, and TREE — the entire conversation graph
app.js       deterministic chat engine, SVG wheel builder, persistence
```

To extend the coach, add nodes to `TREE` in `data.js`. Node shape:

```js
node_id: {
  coach: ["message 1", "message 2"],          // sent with typing animation
  insight: { title, technique, source, body, actions: [] },  // optional card
  options: [ { label: "chip text", next: "other_node_id" } ] // "wheel" = home
}
```

A validation one-liner exists in the repo history (checks for dangling `next`
targets and unreachable nodes) — run it after editing the tree.

## Disclaimer

Better Decisions is psycho-education, not therapy or medical advice. If you're
in crisis, please contact a professional or a local helpline.
