# taskmind

Three small, dependency-free web apps live in this repo.

## BetterDecisions ◆

A guided decision-making companion that walks any choice through five voices,
each a distinct way of thinking about a decision:

| Voice | Lens | What it catches |
| --- | --- | --- |
| **The Steady Mind** | Check in | Deciding while hungry/angry/lonely/tired, unnamed emotions, motivated reasoning |
| **The Experimenter** | Triage | Treating reversible experiments like life sentences |
| **The Strategist** | Think it through | Bias, sunk costs, narrow framing, vague fear |
| **The Straight Talker** | Values | Choices serving counterfeit motives (approval, status, comfort) instead of chosen values |
| **The Confidant** | Courage check | People-pleasing and fear ghostwriting the decision |

Then it makes you **commit like it's a bet**: pick, state your confidence,
set an if-then plan and a tripwire, and schedule an honest look back where you
grade the *process* separately from the *outcome* — with calibration stats
once you've reviewed a few. There's also a coin-flip **gut check** that can
log itself as a journal entry.

**Live app:** https://githubthebub.github.io/legendary-carnival/ (canonical
deployment repo: [`legendary-carnival`](https://github.com/githubthebub/legendary-carnival)).

Run locally: any static server from the repo root (`python3 -m http.server 8000`),
then open `http://localhost:8000` — the root `index.html` is BetterDecisions.
Tests: `node --test` (no dependencies). All user data stays in the browser's
`localStorage`; export/import as JSON from the footer.

The five voices are original characters, not real people — each condenses a
widely discussed style of decision-making, unattributed to and unaffiliated
with any public figure. A thinking companion, not therapy, medical, financial,
or legal advice.

```
index.html            BetterDecisions shell + nav
css/, js/, tests/     BetterDecisions design system, app code, unit tests
```

## Pokémon Sevii Adventures 🌋

A **FireRed/LeafGreen-style fan game** in vanilla JS + Canvas: the Sevii Islands' Ruby quest plus nine walkable Kanto towns, five gyms, HM field moves (Surf/Cut/Strength/Fly), catching, saves, an original chiptune soundtrack, and Free-Roam / Master extra modes. All art, music, and dialogue are original and generated in code.

→ Open [`pokemon-sevii/index.html`](pokemon-sevii/index.html) in a browser (no build, no dependencies), or run `pokemon-sevii/build.sh` for a single-file version. See [`pokemon-sevii/README.md`](pokemon-sevii/README.md) for controls and the full feature list.

## Archetype Atlas

A person–culture fit simulator: measure your Big Five temperament, live five days of ordinary dilemmas in one of seven societies (India, London, Japan, China, Germany, Switzerland, USA), and find out which personality archetype you could sustainably lead with there — and what it would cost you.

→ Open [`archetype-atlas/index.html`](archetype-atlas/index.html) in a browser (no build, no dependencies). See [`archetype-atlas/README.md`](archetype-atlas/README.md) for the model and its grounding.

This repo's GitHub Pages site is owned by Archetype Atlas (`.github/workflows/deploy-pages.yml`);
BetterDecisions deploys from its own repo, and its workflow here (`tests.yml`) only runs tests.
