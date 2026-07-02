# taskmind

A text-based narrative simulation engine built for emotional resonance,
immersive world-building, and deep psychological engagement — plus a complete
sample story, **THE LIGHT AT VANE'S HOLLOW**, that exercises every system.

```
python3 play.py                # play (random seed)
python3 play.py --seed 7       # reproducible run
python3 -m unittest discover -s tests    # 65-test suite
python3 tools/playtest_harness.py        # balance telemetry report
```

No dependencies beyond Python 3.10+.

## What the engine does

- **Hyper-personalization** — every choice carries micro-signals; an EWMA
  player model (appetite for action/mystery/intimacy/lore/dread, sensory
  detail tolerance, risk posture) reshapes beat selection, prose density, and
  chapter pacing without ever collapsing the story's variety.
- **Directed tension** — a pacing director steers each beat toward an
  escalating sawtooth curve, schedules payoffs on a variable-but-fair reward
  schedule (randomized gaps with a hard guarantee window), and rations
  cliffhangers to chapter boundaries where they still mean something.
- **Layered NPC psychology** — characters run three timescales: stable OCEAN
  traits with hidden agendas that leak under stress, fast valence/arousal
  emotion with trait-shaped appraisal and homeostasis, and slow
  trust/warmth/fear relationships whose threshold crossings open and close
  entire dialogue subtrees. NPCs remember what you did and say so.
- **Composed prose** — beat templates carry sensory fragment banks; the
  composer layers sight/sound/smell/touch to the player's demonstrated taste
  with anti-repetition windows.
- **Determinism** — one state-owned RNG; any run is exactly reproducible from
  (seed, choice sequence), and save/resume is bit-identical to playing
  straight through.

A deliberate design stance: engagement through craft, not compulsion. Rewards
are variable but never starved, chapters offer natural stopping points, and
nothing is tuned to exploit the player.

## Layout

| Path | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | Core loop diagram and system design |
| `engine/state.py` | Serializable single source of truth + RNG discipline |
| `engine/personalization.py` | Adaptive player appetite model |
| `engine/pacing.py` | Tension curve, reward scheduler, cliffhanger rules |
| `engine/npc.py` | Trait/emotion/relationship NPC psychology |
| `engine/dialogue.py` | Condition-gated trees with mood-keyed line variants |
| `engine/narrative.py` | Beat selection + sensory composition |
| `engine/engine.py` | Core loop orchestrator (`Game`) |
| `engine/simulate.py` | Automated players (random + persona policies) |
| `engine/content/vanes_hollow.py` | Sample story: beats, NPCs, dialogue, endings |
| `play.py` | Terminal frontend |
| `tests/` | Unit invariants, Monte-Carlo runs, persona divergence, golden paths |
| `tools/playtest_harness.py` | Distribution telemetry for tuning changes |

## Writing new stories

A story is a `StoryPack`: beat templates (shape + prerequisites + tagged
choices + sensory banks), NPC profiles (traits, agenda, tell), dialogue trees
(variants keyed by mood/stance), and endings (predicates over state). The
engine is content-agnostic — see `engine/content/vanes_hollow.py` for the
reference implementation and `tests/test_content.py` for the integrity
checks a pack must satisfy.
