# BetterDecisions ◆

A guided decision-making companion that walks any choice through five voices,
each a distinct way of thinking about a decision:

| Voice | Lens | What it catches |
| --- | --- | --- |
| **The Steady Mind** | Check in | Deciding while hungry/angry/lonely/tired, unnamed emotions, motivated reasoning |
| **The Experimenter** | Triage | Treating reversible experiments like life sentences |
| **The Strategist** | Think it through | Bias, sunk costs, first-order thinking, vague fear |
| **The Straight Talker** | Values | Choices serving status/approval/comfort instead of chosen values — and the pain each option bundles |
| **The Confidant** | Courage check | People-pleasing and fear ghostwriting the decision |

Then it makes you **commit like it's a bet**: pick, state your confidence,
and schedule an honest look back where you grade the *process* separately
from the *outcome* — with calibration stats once you've reviewed a few.

There's also a standalone **gut check**: assign two options to a coin, flip it,
and record what you *felt* when you saw the result. The coin never decides —
your reaction does.

None of the five voices is a real person — each condenses a widely shared,
publicly discussed style of reasoning into a consistent character the app can
speak through. See the Honest footnote below.

## Running it

No build step, no dependencies. It's plain HTML + ES modules, so it needs any
static file server (ES modules don't load over `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

or `npx serve`, or any equivalent.

All data lives in your browser's `localStorage`. Export/import as JSON from the
footer.

## Deploying for free (GitHub Pages)

This repo needs zero build step, so GitHub Pages can serve it directly:

1. On GitHub: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch: `main` (or whichever branch has this code), folder `/ (root)`. Save.
4. GitHub publishes it at `https://<your-username>.github.io/<repo-name>/`
   within a minute or two — no hosting cost, no server to maintain.

Every push to that branch redeploys automatically.

## Tests

Pure logic (store, triage, calibration, brief compilation, content integrity)
is covered with Node's built-in test runner — no dependencies:

```bash
node --test
```

## Structure

```
index.html            shell + nav
css/styles.css         design system
js/app.js              bootstrap + routing + data import/export
js/router.js           tiny hash router
js/store.js            state, persistence, and the pure decision logic
js/ui.js               DOM helpers (XSS-safe by construction)
js/data/content.js     the five voices, principles, frameworks, quotes
js/views/               home, wizard, journal, mentors, coin flip
tests/                  node --test unit tests
```

## Honest footnote

The five voices in this app are original characters, not real people. Each
one is a compact expression of a widely discussed style of decision-making
(an emotional check-in practice, an experiment-first mindset, decision-science
mental models, a values-first worldview, a confidence-and-courage lens) —
none of it is attributed to, endorsed by, or affiliated with any specific
public figure. This is a thinking companion, not therapy, medical, financial,
or legal advice.
