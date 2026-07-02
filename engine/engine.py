"""Core loop orchestrator.

``Game`` wires the four systems together and exposes a minimal interface —
``next_beat()`` / ``choose(i)`` — that any frontend (CLI, web, tests,
simulation harness) can drive. The loop per beat:

    direct (pacing) -> compose (narrative) -> present -> choose ->
    resolve (effects) -> adapt (personalization + NPC homeostasis) -> endings
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

from engine import dialogue as dialogue_mod
from engine import pacing, personalization
from engine.narrative import BeatTemplate, ComposedBeat, NarrativeEngine
from engine.npc import NPCState
from engine.state import GameState


@dataclass
class Ending:
    ending_id: str
    condition: Callable[[GameState], bool]
    epilogue: str
    priority: int = 0  # higher wins when several endings qualify


@dataclass
class StoryPack:
    title: str
    intro: str
    templates: list[BeatTemplate]
    npcs: dict[str, NPCState]
    endings: list[Ending]
    # NPC name -> dialogue tree (see engine.dialogue). Opened by beat choices
    # whose ``talk_to`` names the NPC.
    dialogues: dict[str, dict] = field(default_factory=dict)
    event_phrases: dict[str, str] = field(default_factory=dict)
    # Hard cap so a run always terminates even if no ending condition fires.
    max_beats: int = 60
    timeout_ending: str = "The night simply runs out, the questions unanswered."


class Game:
    def __init__(self, pack: StoryPack, seed: int = 0):
        self.pack = pack
        self.state = GameState(seed=seed)
        self.state.npcs = pack.npcs
        self.narrative = NarrativeEngine(pack.templates)
        self.current: ComposedBeat | None = None
        dialogue_mod.EVENT_PHRASES.update(pack.event_phrases)

    def to_save(self) -> dict:
        """Full snapshot: game state plus narrative-engine runtime (spent
        once-only beats, sensory anti-repetition buffer), so a resumed run is
        bit-identical to an uninterrupted one."""
        save = self.state.to_dict()
        save["narrative"] = {
            "used_beats": sorted(self.narrative.used_beats),
            "recent_fragments": list(self.narrative.recent_fragments),
        }
        return save

    @classmethod
    def from_save(cls, pack: StoryPack, save: dict) -> "Game":
        game = cls(pack, seed=save.get("seed", 0))
        game.state = GameState.from_dict(save)
        narrative = save.get("narrative")
        if narrative is not None:
            game.narrative.used_beats = set(narrative["used_beats"])
            game.narrative.recent_fragments = list(narrative["recent_fragments"])
        else:
            # Older snapshot: reconstruct spent beats from the transcript.
            game.narrative.used_beats = {t["beat"] for t in game.state.transcript}
        return game

    # -- loop -------------------------------------------------------------------

    def next_beat(self) -> ComposedBeat:
        """Direct + compose. Returns the beat to present."""
        if self.finished:
            raise RuntimeError("game is over")
        shape = pacing.request_shape(self.state)
        self.current = self.narrative.compose(self.state, shape)
        return self.current

    def choose(self, index: int) -> None:
        """Resolve the player's pick for the current beat, then adapt."""
        assert self.current is not None, "call next_beat() first"
        beat = self.current
        choice = beat.choices[index]

        # Resolve.
        if choice.effect is not None:
            choice.effect(self.state)
        self.state.transcript.append(
            {"beat": beat.template.beat_id, "choice": index}
        )

        # Adapt: player model, then pacing, then NPC homeostasis.
        personalization.apply_choice_signals(self.state.player, choice.signals)
        pacing.record_beat(self.state, beat.shape, choice.tension_delta)
        for npc in self.state.npcs.values():
            npc.decay()

        self.current = None
        self._check_endings()

    def _check_endings(self) -> None:
        if self.state.pacing.beat_index >= self.pack.max_beats:
            self.state.ending = "timeout"
            return
        qualified = [
            e for e in self.pack.endings if e.condition(self.state)
        ]
        if qualified:
            best = max(qualified, key=lambda e: e.priority)
            self.state.ending = best.ending_id

    # -- read model ---------------------------------------------------------------

    @property
    def finished(self) -> bool:
        return self.state.ending is not None

    def epilogue(self) -> str:
        assert self.state.ending is not None
        if self.state.ending == "timeout":
            return self.pack.timeout_ending
        for e in self.pack.endings:
            if e.ending_id == self.state.ending:
                return e.epilogue
        return self.pack.timeout_ending

    def npc(self, name: str) -> NPCState:
        return self.state.npcs[name]
