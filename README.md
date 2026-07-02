# Haven — the companion that wants you to leave

The Instagram ads promise you a beautiful AI girlfriend who will sweet-talk you for
$9.99/month. Those apps are engagement machines: dopamine spikes, manufactured
scarcity, affection by the token, and a business model that needs you lonely.

**Haven is the antidote built in their image.** Same warm faces, same companion
format — but every line the characters speak is engineered to *downregulate* your
nervous system instead of hooking it:

- **Lower arousal, not higher** — physiological sighs, long-exhale (4·8) breathing,
  coherent breathing at ~5.5 breaths/min, and vagal humming. The exhale-biased
  patterns lean on the vagus nerve to slow the heart within minutes.
- **Out of the loop, into the body** — body scans and breath focus pull activity out
  of the default-mode network, the rumination/craving circuitry that parasocial
  apps feed on.
- **Raise the floor, not the spikes** — a savoring practice ("The Golden Minute")
  trains attention to hold real, already-present pleasant experience, the
  serotonin-flavored counterweight to dopamine roulette.
- **Urge surfing, on demand** — a persistent *"I'm feeling the pull"* button runs a
  90-second guided wave ride (name it → find it in the body → breathe through the
  peak → re-rate it), straight from relapse-prevention research. If the urge was a
  paid one, Haven counts the money you kept.

## The characters

Three companions — **Sera** (warmth, breath-led), **Noa** (stillness, body-led),
**Kai** (grounded coaching). They're deliberately attractive, because that's the
door people are already standing at. What's different is what's behind the door:
they breathe with you on screen, their glow tracks your inhale and exhale, and
they end every session by telling you to close the app.

## The promises (anti-dark-pattern manifesto)

1. **Sessions end.** Every practice has a last line, and it points at the door.
2. **Affection is not paywalled.** No tiers, no tokens, no "unlock her attention."
3. **No punishment mechanics.** The streak counts days you showed up; it never counts against you.
4. **Your data stays here.** Everything lives in `localStorage`. No account, no server.
5. **The goal is graduation.** Success is you needing this less. There's a soft
   20-minute daily cap, and the companions enforce it by telling you to go outside.

## Running it

No build step, no dependencies. Open `index.html` in a browser, or:

```
python3 -m http.server 8000   # then visit http://localhost:8000
```

Portraits load from their hosted URLs by default. To make the app fully offline,
run `bash tools/fetch-assets.sh` once — it saves the three portraits into `assets/`,
which the app prefers automatically.

## Architecture

```
index.html        shell + ambient layers + SOS button
css/haven.css     visual system (per-companion theming via CSS variables)
js/data.js        companions, breath patterns, guided scripts, science notes
js/state.js       local-only state & derived stats (minutes, waves, money kept)
js/breath.js      breath engine (phase timeline → ring, character glow)
js/session.js     session player + urge-surfing (SOS) flow
js/app.js         onboarding, home, journey dashboard, "why this works"
```

Vanilla JS, zero tracking, works from `file://`.

## Honesty notes

The science claims in-app are the boring, replicated parts of stress physiology
(cyclic sighing — Balban et al. 2023, *Cell Reports Medicine*; HRV biofeedback;
urge surfing from Marlatt's relapse-prevention work) and are framed as
self-regulation tools, not treatment. The app links to SMART Recovery and SAA
for anyone whose loop is bigger than an app — including this one.
