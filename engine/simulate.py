"""Automated playthroughs for testing and balance telemetry.

A *policy* stands in for the player: given the choice texts and signal dicts,
it returns an index. ``simulate()`` drives a full run — beats and dialogue —
and returns a ``RunStats`` snapshot the harness and tests can assert against.

Personas are deliberately simple maximizers; their job is not to play well
but to be *different from each other*, so tests can verify the engine
actually differentiates player experiences.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field

from engine.dialogue import DialogueRunner
from engine.engine import Game, StoryPack

MAX_DIALOGUE_STEPS = 30


@dataclass
class RunStats:
    seed: int
    ending: str = ""
    beats: int = 0
    shapes: list[str] = field(default_factory=list)
    tensions: list[float] = field(default_factory=list)
    reward_gaps: list[int] = field(default_factory=list)
    clues: int = 0
    stance_flips: int = 0
    final_profile: dict = field(default_factory=dict)


def random_policy(rng: random.Random):
    def pick(texts: list[str], signals: list[dict]) -> int:
        return rng.randrange(len(texts))
    return pick


def persona_policy(preferences: dict[str, float], rng: random.Random):
    """Pick the option whose signals best match the persona's preferences;
    small random jitter breaks ties without making runs identical."""
    def pick(texts: list[str], signals: list[dict]) -> int:
        def score(sig: dict) -> float:
            return sum(preferences.get(axis, 0.0) * value
                       for axis, value in sig.items()) + rng.random() * 0.05
        return max(range(len(texts)), key=lambda i: score(signals[i]))
    return pick


PERSONAS = {
    "rusher": {"action": 1.0, "risk": 0.6, "detail": -0.8},
    "empath": {"intimacy": 1.0, "detail": 0.4},
    "sleuth": {"mystery": 1.0, "lore": 0.5, "detail": 0.3},
    "paranoid": {"risk": -1.0, "dread": 0.4},
}


def _run_dialogue(game: Game, npc_name: str, policy) -> None:
    npc = game.npc(npc_name)
    runner = DialogueRunner(game.pack.dialogues[npc_name])
    for _ in range(MAX_DIALOGUE_STEPS):
        if runner.finished:
            return
        replies = runner.open_replies(game.state, npc)
        if not replies:
            return
        idx = policy([r.text for r in replies], [r.signals for r in replies])
        runner.choose(replies[idx], game.state, npc)
    # Step cap reached (cyclic wandering): take any exit if one is open.
    if not runner.finished:
        replies = runner.open_replies(game.state, npc)
        exits = [r for r in replies if r.next_node is None]
        if exits:
            runner.choose(exits[0], game.state, npc)


def simulate(pack_factory, seed: int, policy=None) -> RunStats:
    """One full playthrough. ``pack_factory`` builds a fresh StoryPack so
    runs never share mutable content state."""
    pack: StoryPack = pack_factory()
    game = Game(pack, seed=seed)
    if policy is None:
        policy = random_policy(random.Random(seed ^ 0x5EED))

    stats = RunStats(seed=seed)
    last_reward = 0
    prev_stances = {name: npc.stance() for name, npc in game.state.npcs.items()}

    while not game.finished:
        beat = game.next_beat()
        assert beat.choices, f"beat {beat.template.beat_id} presented no choices"
        idx = policy([c.text for c in beat.choices],
                     [c.signals for c in beat.choices])
        chosen = beat.choices[idx]
        if chosen.talk_to:
            _run_dialogue(game, chosen.talk_to, policy)
        game.choose(idx)

        stats.shapes.append(beat.shape)
        stats.tensions.append(game.state.pacing.tension)
        if beat.shape == "reward":
            stats.reward_gaps.append(stats.beats - last_reward)
            last_reward = stats.beats
        stats.beats += 1
        for name, npc in game.state.npcs.items():
            stance = npc.stance()
            if stance != prev_stances[name]:
                stats.stance_flips += 1
                prev_stances[name] = stance

    stats.ending = game.state.ending or ""
    stats.clues = len(game.state.world.clues)
    stats.final_profile = game.state.player.to_dict()
    return stats
