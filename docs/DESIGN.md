# GREYFALL — Design Document

A text-based psychological mystery simulation built for emotional resonance,
adaptive personalization, and deeply modeled characters.

## Premise

You are an investigator arriving in Greyfall, a fog-locked harbor town where
three people have vanished in eleven days. The radio mast on the cliff
broadcasts a signal nobody admits to sending. Everyone you meet is lying
about something — but not about what you think.

---

## 1. Core Loop

Each turn of play is one pass through five phases:

```
 ┌────────────────────────────────────────────────────────┐
 │                                                        │
 │  PERCEIVE ─► CHOOSE ─► RESOLVE ─► ADAPT ─► ADVANCE ────┘
 │     │           │          │         │         │
 │  scene       player     effects   engine    tension
 │  rendered    picks a    applied   re-tunes  scheduler
 │  through     styled     to world  pacing,   fires
 │  player's    choice     + NPCs    senses,   beats,
 │  sensory              + tension  challenge  rewards,
 │  lens                            to player  cliffhangers
 └────────────────────────────────────────────────────────┘
```

- **PERCEIVE** — The `NarrativeEngine` renders the current scene through a
  `RenderPlan` produced by the `Personalizer`: which sensory channels lead,
  how dense the prose is, how much menace is layered in at current tension.
- **CHOOSE** — Every choice is tagged with a psychological style
  (`bold / cautious / empathic / analytical`). Choices are never filler:
  each one moves trust, fear, tension, or knowledge.
- **RESOLVE** — Effects hit the `WorldState` and each `NPCBrain` reacts
  according to its trait profile — the same act reads differently to
  different minds.
- **ADAPT** — The `PlayerProfile` updates from the micro-choice; the
  `Personalizer` recomputes pacing and sensory emphasis; challenges bend
  toward (and occasionally against) the player's dominant style.
- **ADVANCE** — The `TensionEngine` steps the beat clock: schedules
  variable-magnitude discoveries with a pity timer, forces relief valleys
  after spikes, and arms a cliffhanger when a session nears its natural end.

## 2. Hyper-Personalization

`PlayerProfile` is a running model of the player, learned from micro-choices:

| Signal            | Learned from                        | Drives                          |
|-------------------|-------------------------------------|---------------------------------|
| style weights     | tag on every chosen option          | NPC reactions, challenge bias   |
| sensory affinity  | tags on choices (listen/look/touch) | which sense channels lead prose |
| detail preference | length of options player favors     | prose density                   |
| risk tolerance    | bold vs cautious ratio              | reward variance, spike height   |

The engine leans into the player's style ~70% of the time (flow) and against
it ~30% (growth/tension), so play never becomes an echo chamber.

## 3. Tension & Reward Architecture

`TensionEngine` maintains a 0–100 tension value with momentum:

- **Rising action** — small automatic climb per beat, scaled by act.
- **Spikes & valleys** — big events spike tension; a spike arms a mandatory
  relief valley within 2 beats (breath control).
- **Variable reward schedule** — discoveries (clues, confessions, artifacts)
  fire on a variable-ratio schedule *with a pity timer*: probability rises
  every dry beat and is guaranteed by beat +4, so anticipation compounds but
  never curdles into frustration. Magnitude tiers: minor / major / rare.
- **Cliffhangers** — when a session approaches its end and tension ≥ 60, the
  engine ends the scene on an armed, unresolved hook and writes a recap
  seed for the next session. Sessions always end at a chapter seam — the
  game respects the player's exit rather than fighting it.

## 4. NPC Psychology

Each NPC = static `NPCProfile` + dynamic `NPCState` + `NPCBrain` update rules.

- **Profile** — five-factor traits (0–1), a *hidden motive*, a *secret*, a
  reveal threshold, and per-style sensitivities (how bold/empathic/etc.
  approaches land on this particular psyche).
- **State** — trust, fear, respect, mood (valence/arousal), and an episodic
  memory of what the player actually did.
- **Evolution** — reactions are trait-modulated: pressure raises fear fast in
  a high-neuroticism mind and raises *respect* in a low-agreeableness one.
  Secrets surface only when trust crosses threshold — or fear does, which
  produces a different, damaged kind of confession.

## 5. Testing Protocol

1. **Unit layer** — state round-trips, tension bounds & pity timer, NPC
   trait modulation, dialogue effects.
2. **Structural validation** — `DialogueTree.validate()` proves every node
   is reachable, no dead ends, all `next` targets exist, all effect keys
   are legal. Run in CI and at content-load time.
3. **Simulation bots** — `tests/test_simulation.py` plays hundreds of full
   seeded games with four bot temperaments (random, bold, cautious,
   empathic). Invariants: no crashes, tension always in [0,100], a reward
   never droughts past the pity limit, every ending reachable, saves
   round-trip mid-game to identical continuations.
4. **Prose QA** — anti-repetition buffer asserts no sensory phrase repeats
   within its cooldown window.

Run everything: `python -m unittest discover -s tests -v`
Play: `python main.py`
