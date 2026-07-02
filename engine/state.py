"""State management: the player model, the world, and the full game state.

Everything here is plain data + JSON round-tripping so a game can be
checkpointed mid-scene and resumed to an identical continuation.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

STYLES = ("bold", "cautious", "empathic", "analytical")
SENSES = ("sight", "sound", "smell", "touch")


@dataclass
class PlayerProfile:
    """A running psychological model of the player, learned from micro-choices."""

    style_counts: dict[str, int] = field(
        default_factory=lambda: {s: 0 for s in STYLES}
    )
    sense_counts: dict[str, int] = field(
        default_factory=lambda: {s: 1 for s in SENSES}  # laplace prior
    )
    # rolling preference for prose density, 0 = terse .. 1 = lush
    detail_preference: float = 0.5
    choices_made: int = 0

    def record_choice(self, style: str, senses: tuple[str, ...] = (),
                      option_length: int = 40) -> None:
        if style in self.style_counts:
            self.style_counts[style] += 1
        for sense in senses:
            if sense in self.sense_counts:
                self.sense_counts[sense] += 1
        # players who consistently pick longer, more descriptive options
        # are telling us they want denser prose; nudge with a slow EMA.
        target = min(1.0, option_length / 80.0)
        self.detail_preference += 0.15 * (target - self.detail_preference)
        self.choices_made += 1

    def style_weights(self) -> dict[str, float]:
        total = sum(self.style_counts.values()) or 1
        return {s: c / total for s, c in self.style_counts.items()}

    def dominant_style(self) -> str:
        return max(STYLES, key=lambda s: (self.style_counts[s], -STYLES.index(s)))

    def risk_tolerance(self) -> float:
        """0..1 — how much variance this player has signed up for."""
        w = self.style_weights()
        return max(0.0, min(1.0, 0.5 + w["bold"] - w["cautious"]))

    def top_senses(self, n: int = 2) -> list[str]:
        return sorted(SENSES, key=lambda s: -self.sense_counts[s])[:n]


@dataclass
class WorldState:
    """Objective facts about the world: where we are, what has happened."""

    location: str = "quay"
    act: int = 1
    beat: int = 0
    flags: dict[str, bool] = field(default_factory=dict)
    clues: list[str] = field(default_factory=list)
    ending: str | None = None

    def set_flag(self, name: str) -> None:
        self.flags[name] = True

    def has(self, name: str) -> bool:
        return self.flags.get(name, False)

    def add_clue(self, clue: str) -> bool:
        """Returns True if the clue was new."""
        if clue in self.clues:
            return False
        self.clues.append(clue)
        return True


@dataclass
class GameState:
    """The complete serializable state of one playthrough."""

    seed: int = 0
    profile: PlayerProfile = field(default_factory=PlayerProfile)
    world: WorldState = field(default_factory=WorldState)
    # dynamic NPC state, keyed by npc id (static profiles live in content)
    npcs: dict[str, dict[str, Any]] = field(default_factory=dict)
    tension: dict[str, Any] = field(default_factory=dict)
    scene_id: str = "arrival"
    history: list[str] = field(default_factory=list)
    recap_seed: str | None = None  # cliffhanger hook for next session

    # -- serialization ------------------------------------------------
    def to_dict(self) -> dict[str, Any]:
        return {
            "seed": self.seed,
            "profile": {
                "style_counts": dict(self.profile.style_counts),
                "sense_counts": dict(self.profile.sense_counts),
                "detail_preference": self.profile.detail_preference,
                "choices_made": self.profile.choices_made,
            },
            "world": {
                "location": self.world.location,
                "act": self.world.act,
                "beat": self.world.beat,
                "flags": dict(self.world.flags),
                "clues": list(self.world.clues),
                "ending": self.world.ending,
            },
            "npcs": {k: dict(v) for k, v in self.npcs.items()},
            "tension": dict(self.tension),
            "scene_id": self.scene_id,
            "history": list(self.history),
            "recap_seed": self.recap_seed,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "GameState":
        profile = PlayerProfile(
            style_counts=dict(data["profile"]["style_counts"]),
            sense_counts=dict(data["profile"]["sense_counts"]),
            detail_preference=data["profile"]["detail_preference"],
            choices_made=data["profile"]["choices_made"],
        )
        w = data["world"]
        world = WorldState(
            location=w["location"], act=w["act"], beat=w["beat"],
            flags=dict(w["flags"]), clues=list(w["clues"]), ending=w["ending"],
        )
        return cls(
            seed=data["seed"], profile=profile, world=world,
            npcs={k: dict(v) for k, v in data["npcs"].items()},
            tension=dict(data["tension"]),
            scene_id=data["scene_id"], history=list(data["history"]),
            recap_seed=data.get("recap_seed"),
        )

    def save(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, path: str) -> "GameState":
        with open(path, encoding="utf-8") as f:
            return cls.from_dict(json.load(f))
