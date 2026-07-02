# taskmind — GREYFALL

A text-based psychological mystery simulation. Three people have vanished
from a fog-locked harbor town, the radio mast on the cliff is broadcasting
a signal nobody admits to sending, and every witness is lying about
something — but not about what you think.

Zero dependencies. Python 3.10+.

```bash
python main.py            # play (auto-saves on 'q', auto-resumes)
python main.py 42         # new game with a specific seed
python -m unittest discover -s tests -v   # full test protocol
```

## What's under the hood

| System | Module | What it does |
|---|---|---|
| Core loop | `engine/game.py` | PERCEIVE → CHOOSE → RESOLVE → ADAPT → ADVANCE, one pass per turn |
| State management | `engine/state.py` | Player model, world state, full JSON save/load with deterministic resume |
| Personalization | `engine/personalization.py` | Learns your style + sensory taste from micro-choices; leans with you 70%, against you 30% |
| Tension & rewards | `engine/tension.py` | Momentum curve, forced relief valleys, variable-ratio discoveries with a pity timer, cliffhanger arming |
| NPC minds | `engine/npc.py` | Five-factor psyches with hidden motives; trust-earned vs fear-forced confessions |
| Narrative engine | `engine/narrative.py` | Sensory banks per intensity band, prose density scaling, anti-repetition buffer |
| Dialogue | `engine/dialogue.py` | Gated choice trees + structural validator (reachability, dead ends, soft-locks) |
| Content | `engine/content.py` | The Greyfall scenario: 6 scenes, 3 NPCs, 4 endings |
| Test protocol | `tests/` | Unit layer + 300 full bot playthroughs asserting engine invariants |

Design rationale and the full architecture write-up: [docs/DESIGN.md](docs/DESIGN.md).

A note on the engagement mechanics: the pacing systems (variable rewards,
cliffhangers, tension curves) are tuned for *narrative* momentum, not
compulsion — droughts are capped by a pity timer so anticipation never
becomes frustration, spikes owe the player a breathing valley, and session
seams land on a save-and-stop affordance rather than a hook that fights
the player's exit.
