# TaskMind Narrative Engine — Architecture

A text-based narrative simulation engine built for emotional resonance,
immersive world-building, and deep psychological engagement. The engine is
content-agnostic: stories are data (beats, dialogue trees, NPC profiles)
interpreted by four cooperating systems.

A deliberate design stance: the engine pursues engagement through **craft**
(pacing, consequence, characters that feel alive), not through compulsion
mechanics. Rewards are variable but bounded by fairness windows, sessions have
natural chapter-break stopping points, and nothing is tuned to exploit the
player. Gripping, not sticky.

---

## 1. Core Loop

```
            ┌────────────────────────────────────────────────┐
            │                   CORE LOOP                     │
            │                                                 │
   ┌────────▼────────┐                                        │
   │ 1. DIRECT       │  PacingDirector reads the tension      │
   │    (pacing.py)  │  curve + player profile and requests   │
   └────────┬────────┘  a beat *shape* (calm / rising /       │
            │           spike / cliffhanger / reward)         │
   ┌────────▼────────┐                                        │
   │ 2. COMPOSE      │  NarrativeEngine selects a concrete    │
   │  (narrative.py) │  beat matching the requested shape,    │
   └────────┬────────┘  fills sensory layers per profile,     │
            │           and gates choices on world state      │
   ┌────────▼────────┐                                        │
   │ 3. PRESENT      │  Scene prose + 2–4 consequential       │
   │   (engine.py)   │  choices rendered to the player        │
   └────────┬────────┘                                        │
            │                                                 │
   ┌────────▼────────┐                                        │
   │ 4. CHOOSE       │  Player picks; every choice is a       │
   │                 │  micro-signal, not just a branch       │
   └────────┬────────┘                                        │
            │                                                 │
   ┌────────▼────────┐                                        │
   │ 5. RESOLVE      │  Effects applied: world flags, NPC     │
   │   (state.py)    │  emotions/trust, tension delta,        │
   └────────┬────────┘  clocks advanced, memories recorded    │
            │                                                 │
   ┌────────▼────────┐                                        │
   │ 6. ADAPT        │  PersonalizationModel updates player   │
   │(personalization)│  appetite vector (EWMA over choices);  │
   └────────┬────────┘  NPCs re-appraise the player           │
            └────────────────────────────────────────────────┘
```

One iteration = one **beat**. Beats aggregate into **scenes**, scenes into
**chapters**. Chapter boundaries are where the director is allowed to place
cliffhangers, and where the game auto-saves and offers a natural stop.

---

## 2. State Management (`engine/state.py`)

Single source of truth: `GameState`, a serializable aggregate of:

| Component        | Contents                                                        |
|------------------|-----------------------------------------------------------------|
| `PlayerProfile`  | Appetite vector (action / mystery / intimacy / lore / dread), sensory-detail tolerance, choice history, risk posture |
| `WorldState`     | Flags, numeric clocks (e.g. `storm`, `suspicion`), inventory, current location, discovered clues |
| `NPCState` (×N)  | Personality (OCEAN), hidden agenda + concealment level, emotion (valence/arousal), relationship (trust/warmth/fear), episodic memory of player actions |
| `PacingState`    | Current tension, beat index, chapter, recent beat shapes, reward-scheduler bookkeeping |
| `rng_seed`/`rng_calls` | Deterministic replay: every run is reproducible from (seed, choice list) |

Everything round-trips through `to_dict()`/`from_dict()` (JSON), which powers
saves, replays, and the simulation harness. Determinism is a hard invariant:
**no system may consume randomness outside the state-owned RNG.**

## 3. Personalization (`engine/personalization.py`)

Every choice carries `signals` — small tags like `{"mystery": +0.8,
"intimacy": +0.3}`. The model folds them into the appetite vector with an
exponential moving average (recent choices weigh more, one choice never
whipsaws the profile). Downstream consumers:

- **NarrativeEngine** weights beat selection toward high-appetite axes and
  scales sensory density to the player's demonstrated tolerance.
- **PacingDirector** shortens calm segments for action-leaning players and
  lengthens dread build-ups for players who linger in mystery.
- **Dialogue** unlocks introspective branches for players who consistently
  choose interiority.

## 4. Pacing Director (`engine/pacing.py`)

Maintains a target tension curve — an escalating sawtooth (each peak higher
than the last, each valley shallower) ending in a climax plateau. Each beat it
computes `error = target - current` and requests a beat shape:

- `CALM` (recover, character moments) · `RISING` (complication) ·
  `SPIKE` (danger/confrontation) · `REWARD` (payoff/discovery) ·
  `CLIFFHANGER` (chapter-end only)

**Variable reward schedule with a fairness window:** payoffs (clues, secrets,
relationship breakthroughs) arrive on a randomized interval, but a
guarantee counter forces a reward before the drought exceeds `max_gap` beats.
Anticipation without slot-machine starvation.

**Cliffhanger placement:** only at chapter boundaries, only when tension ≥
threshold, and never twice in a row — a cliffhanger that fires every chapter
stops being one.

## 5. NPC Psychology (`engine/npc.py`)

Each NPC is three layered models:

1. **Trait layer (stable):** OCEAN personality floats + a *hidden agenda*
   (goal, concealment level, tell). Traits bias appraisal — a high-neuroticism
   NPC reads an ambiguous player move as a threat; an agreeable one reads it
   as goodwill.
2. **Emotion layer (fast):** valence/arousal point that appraisal events push
   around and that decays toward a trait-determined baseline. Mapped to a
   discrete mood label (guarded, warm, brittle, threatening…) that dialogue
   uses to pick line variants.
3. **Relationship layer (slow):** trust / warmth / fear toward the player,
   moved by choices and by whether the player's behavior touches the NPC's
   agenda. Crossing thresholds flips *stances* (ally, wary, hostile,
   confessional) which gate entire dialogue subtrees.

NPCs keep **episodic memory**: salient player actions with decaying salience,
referenced in later dialogue ("You lied to me on the pier. I remember.") —
this is what makes them feel unscripted.

Hidden agendas leak: each beat there is a small, concealment-scaled chance the
NPC emits its *tell*. Attentive players can read it; the reveal is earned.

## 6. Narrative Generation (`engine/narrative.py`, `engine/dialogue.py`)

- **Beat templates** declare: shape, location, prerequisites, prose skeleton
  with sensory slots, choices (with signals + effects), and once-only flags.
- **Sensory layering:** each template carries banks of sight/sound/smell/touch
  fragments. The composer draws 1–3 per beat scaled by the player's detail
  tolerance, with an anti-repetition ring buffer so no fragment recurs within
  a window.
- **Dialogue trees:** nodes hold *variants* keyed by NPC mood/stance; edges
  are condition-gated (trust ≥ x, flag set, clue held). The same tree plays
  differently against a warm ally vs. a cornered liar.

## 7. Testing Protocols (`tests/`, `tools/playtest_harness.py`)

1. **Unit invariants** — per-system property tests (tension bounded, EWMA
   convergence, serialization round-trip, dialogue reachability).
2. **Monte-Carlo playthroughs** — hundreds of seeded random players run to
   completion; assert: no crashes, no dead-end beats (always ≥1 valid
   choice), every ending reachable across the corpus, reward droughts never
   exceed the fairness window, no sensory fragment repeats inside its window.
3. **Persona sweeps** — scripted archetype players (rusher, empath,
   completionist, paranoid) verify the personalization model actually
   differentiates their experiences (beat-mix divergence metric).
4. **Balance telemetry** — the harness prints tension trajectories, reward
   gap histograms, stance-flip counts, and ending distribution; regressions
   in these distributions are treated as bugs even when tests pass.

Run: `python3 -m unittest discover -s tests -v` · `python3 tools/playtest_harness.py`
