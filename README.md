# BetterDecisions ◆

A guided decision-making companion that walks any choice through five lenses,
built from the recurring ideas of five schools of thought:

| Lens | Source | What it catches |
| --- | --- | --- |
| **Check in** | Dr. K (HealthyGamerGG) | Deciding while hungry/angry/lonely/tired, unnamed emotions, motivated reasoning |
| **Triage** | Ali Abdaal (+ Bezos's doors) | Treating reversible experiments like life sentences |
| **Values** | Mark Manson | Choices serving status/approval/comfort instead of chosen values — and the pain each option bundles |
| **Think it through** | Big Think (Annie Duke, Kahneman, Klein, Munger) + Ali's bookshelf (Ferriss, Welch, Burkeman, McKeown) | Bias, sunk costs, first-order thinking, vague fear |
| **Courage check** | Charlie Houpert (Charisma on Command) | People-pleasing and fear ghostwriting the decision |

Then it makes you **commit like it's a bet** (Annie Duke): pick, state your
confidence, and schedule an honest look back where you grade the *process*
separately from the *outcome* — with calibration stats once you've reviewed a few.

There's also a standalone **gut check**: assign two options to a coin, flip it,
and record what you *felt* when you saw the result. The coin never decides —
your reaction does.

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

## Tests

Pure logic (store, triage, calibration, brief compilation, content integrity)
is covered with Node's built-in test runner — no dependencies:

```bash
node --test
```

## Structure

```
index.html            shell + nav
css/styles.css        design system
js/app.js             bootstrap + routing + data import/export
js/router.js          tiny hash router
js/store.js           state, persistence, and the pure decision logic
js/ui.js              DOM helpers (XSS-safe by construction)
js/data/content.js    mentors, principles, Ali's bookshelf, frameworks, quotes
js/views/             home, wizard, journal, mentors, coin flip
tests/                node --test unit tests
```

## Honest footnote

This is a thinking companion inspired by public work of the people named above.
It is not affiliated with or endorsed by any of them, and it is not therapy,
medical, financial, or legal advice.
