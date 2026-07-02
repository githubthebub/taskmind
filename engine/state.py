"""Single source of truth for a running game.

Design invariants:

* Everything round-trips through ``to_dict``/``from_dict`` (plain JSON types),
  which powers saves, replays, and the simulation harness.
* All randomness flows through ``GameState.rng``. Replaying the same seed with
  the same choice sequence reproduces the run exactly, so every bug report is
  a (seed, choices) pair.
"""

from __future__ import annotations

import json
import random
from dataclasses import dataclass, field
from typing import Any

# Appetite axes the personalization model tracks. Values in [0, 1].
APPETITE_AXES = ("action", "mystery", "intimacy", "lore", "dread")


@dataclass
class PlayerProfile:
    """What kind of story this player keeps choosing."""

    appetite: dict[str, float] = field(
        default_factory=lambda: {axis: 0.5 for axis in APPETITE_AXES}
    )
    # How much sensory detail the player has shown they want, in [0, 1].
    # Raised when they pick "linger / examine" choices, lowered when they rush.
    detail_tolerance: float = 0.5
    # Rolling risk posture in [-1, 1]: cautious .. reckless.
    risk_posture: float = 0.0
    choices_made: int = 0

    def dominant_axes(self, n: int = 2) -> list[str]:
        return sorted(self.appetite, key=self.appetite.get, reverse=True)[:n]

    def to_dict(self) -> dict[str, Any]:
        return {
            "appetite": dict(self.appetite),
            "detail_tolerance": self.detail_tolerance,
            "risk_posture": self.risk_posture,
            "choices_made": self.choices_made,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "PlayerProfile":
        p = cls()
        p.appetite.update(d.get("appetite", {}))
        p.detail_tolerance = d.get("detail_tolerance", 0.5)
        p.risk_posture = d.get("risk_posture", 0.0)
        p.choices_made = d.get("choices_made", 0)
        return p


@dataclass
class WorldState:
    """Flags, clocks, and concrete facts about the story world."""

    location: str = ""
    flags: set[str] = field(default_factory=set)
    # Named numeric pressures that beats can advance (e.g. "storm", "suspicion").
    clocks: dict[str, float] = field(default_factory=dict)
    inventory: list[str] = field(default_factory=list)
    clues: list[str] = field(default_factory=list)

    def has(self, flag: str) -> bool:
        return flag in self.flags

    def set_flag(self, flag: str) -> None:
        self.flags.add(flag)

    def advance_clock(self, name: str, delta: float) -> float:
        self.clocks[name] = max(0.0, self.clocks.get(name, 0.0) + delta)
        return self.clocks[name]

    def add_clue(self, clue: str) -> bool:
        """Record a clue; returns True if it was new."""
        if clue in self.clues:
            return False
        self.clues.append(clue)
        return True

    def to_dict(self) -> dict[str, Any]:
        return {
            "location": self.location,
            "flags": sorted(self.flags),
            "clocks": dict(self.clocks),
            "inventory": list(self.inventory),
            "clues": list(self.clues),
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "WorldState":
        w = cls()
        w.location = d.get("location", "")
        w.flags = set(d.get("flags", []))
        w.clocks = dict(d.get("clocks", {}))
        w.inventory = list(d.get("inventory", []))
        w.clues = list(d.get("clues", []))
        return w


@dataclass
class PacingState:
    """Bookkeeping the PacingDirector needs between beats."""

    tension: float = 0.15          # current felt tension in [0, 1]
    beat_index: int = 0
    chapter: int = 1
    beats_in_chapter: int = 0
    recent_shapes: list[str] = field(default_factory=list)  # last N beat shapes
    beats_since_reward: int = 0
    next_reward_gap: int = 0       # rolled by the reward scheduler
    last_chapter_cliffhanger: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "tension": self.tension,
            "beat_index": self.beat_index,
            "chapter": self.chapter,
            "beats_in_chapter": self.beats_in_chapter,
            "recent_shapes": list(self.recent_shapes),
            "beats_since_reward": self.beats_since_reward,
            "next_reward_gap": self.next_reward_gap,
            "last_chapter_cliffhanger": self.last_chapter_cliffhanger,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "PacingState":
        p = cls()
        for key, value in d.items():
            if hasattr(p, key):
                setattr(p, key, value)
        return p


class GameState:
    """Aggregate root. Owns the RNG; nothing else may create randomness."""

    def __init__(self, seed: int = 0):
        self.seed = seed
        self.rng = random.Random(seed)
        self.rng_calls = 0
        self.player = PlayerProfile()
        self.world = WorldState()
        self.pacing = PacingState()
        self.npcs: dict[str, "NPCState"] = {}
        self.transcript: list[dict[str, Any]] = []  # (beat_id, choice_id) log
        self.ending: str | None = None

    # -- randomness ---------------------------------------------------------

    def roll(self) -> float:
        """The one sanctioned source of randomness."""
        self.rng_calls += 1
        return self.rng.random()

    def roll_int(self, low: int, high: int) -> int:
        self.rng_calls += 1
        return self.rng.randint(low, high)

    def choice(self, seq):
        self.rng_calls += 1
        return self.rng.choice(seq)

    # -- serialization ------------------------------------------------------

    def to_dict(self) -> dict[str, Any]:
        return {
            "seed": self.seed,
            "rng_state": _encode_rng(self.rng),
            "rng_calls": self.rng_calls,
            "player": self.player.to_dict(),
            "world": self.world.to_dict(),
            "pacing": self.pacing.to_dict(),
            "npcs": {name: npc.to_dict() for name, npc in self.npcs.items()},
            "transcript": list(self.transcript),
            "ending": self.ending,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "GameState":
        from engine.npc import NPCState  # local import to avoid a cycle

        gs = cls(seed=d.get("seed", 0))
        if "rng_state" in d:
            gs.rng.setstate(_decode_rng(d["rng_state"]))
        gs.rng_calls = d.get("rng_calls", 0)
        gs.player = PlayerProfile.from_dict(d.get("player", {}))
        gs.world = WorldState.from_dict(d.get("world", {}))
        gs.pacing = PacingState.from_dict(d.get("pacing", {}))
        gs.npcs = {
            name: NPCState.from_dict(nd) for name, nd in d.get("npcs", {}).items()
        }
        gs.transcript = list(d.get("transcript", []))
        gs.ending = d.get("ending")
        return gs

    @classmethod
    def from_json(cls, blob: str) -> "GameState":
        return cls.from_dict(json.loads(blob))


def _encode_rng(rng: random.Random) -> list:
    version, internal, gauss = rng.getstate()
    return [version, list(internal), gauss]


def _decode_rng(encoded: list) -> tuple:
    version, internal, gauss = encoded
    return (version, tuple(internal), gauss)
