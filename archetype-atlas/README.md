# Archetype Atlas

A single-file browser simulation that answers one question: **which personality archetype should you lead with, in which society — and at what cost to yourself?**

Open `index.html` in any browser. No build, no dependencies, no network. Works in light and dark themes.

## What it does

1. **Measures your temperament** — a 20-item questionnaire over the ten Big Five *aspects* (Intellect, Openness, Industriousness, Orderliness, Enthusiasm, Assertiveness, Compassion, Politeness, Volatility, Withdrawal).
2. **Lets you pick a society** — India, London, Japan, China, Germany, Switzerland, or the United States — each modeled with Hofstede's six cultural dimensions.
3. **Simulates five days of ordinary dilemmas** there (workplace, family, civic life, social scene, conflict). Every choice is a move by one of eight archetypes; the society pays or charges you *Standing*, and your temperament pays or charges you *Alignment*.
4. **Debriefs you** with a ranked archetype recommendation you can bend with a values dial ("fit the culture" ↔ "stay yourself"), commentary from three voices, the full math, and honest epistemic warnings.
5. **The Atlas view** shows the whole matrix at once: your best archetype in each of the seven societies.

## The eight archetypes

| | Archetype | Behavioral strategy (Big Five signature) |
|---|---|---|
| ♔ | Sovereign | takes charge, imposes order (assertive + orderly + industrious) |
| ✦ | Explorer | improvises, seeks novelty (open + spontaneous) |
| ☾ | Sage | analyzes, plays the long game (intellectual + reserved) |
| ❦ | Caregiver | nurtures, serves the group (compassionate + modest) |
| ⚑ | Hero | competes for visible achievement (assertive + industrious) |
| ⚒ | Craftsman | masters detail and procedure (industrious + orderly + polite) |
| ⚡ | Rebel | challenges authority openly (blunt + nonconforming) |
| ⚖ | Diplomat | preserves harmony and face (polite + compassionate) |

## How it's grounded

- **Personality:** the 10-aspect Big Five model of DeYoung, Quilty & Peterson (2007, *JPSP*) — the peer-reviewed core of Jordan Peterson's academic personality work. Archetypes are treated as *named trait strategies*, not metaphysical entities.
- **Culture:** Hofstede's six national-culture dimensions (classic published country scores). These describe institutions and average norms — the incentive weather — not the traits of individuals.
- **Fit:** person–environment fit logic. `score = λ·(temperament affinity) + (1−λ)·(culture payoff)`, where culture payoff blends the Hofstede model (60%) with "street evidence" from the scenario content itself (40%), and λ is the user's own values dial.
- **Three commentary voices** keep it out of la-la land:
  - **The Archetypist** (Jordan Peterson-flavored) supplies the mythic framing — but every claim must cash out in a measurable trait.
  - **The Clinician** (Dr. K / HealthyGamerGG-flavored) tracks the mental-health cost of chronically performing against your temperament (masking vs adaptation).
  - **The Skeptic** (Destiny-flavored) enforces evidence discipline: country scores are averages, within-country variance dwarfs between-country variance, and the mythic framing is marketing.

The voices are stylistic registers written for this game — not quotes from, or endorsements by, those people.

## Honesty box

- The questionnaire is original and unvalidated; treat trait scores as sketches.
- Hofstede scores are decades-old national averages (a 2023 recalibration shifts some individualism values); each society screen ships specific caveats.
- Archetype ↔ culture weights are this game's explicit, inspectable modeling choices (see "Show the math" in-game).
- Nothing here is psychological advice or a diagnostic.

## Data

`data/` holds the generated-and-adversarially-reviewed content that is baked into `index.html`: seven society scenario packs, the archetype codex (all three voices), and the assessment items. Each pack was drafted by one model pass and then revised by a hostile cultural/epistemic review pass checking for caricature, wrong dimension attributions, and overclaiming.
