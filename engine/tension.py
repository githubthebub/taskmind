"""Tension curve + variable reward scheduling.

The engine keeps a 0-100 tension value with momentum, forces relief
valleys after spikes, and hands out discoveries on a variable-ratio
schedule with a pity timer: probability of a reward rises every dry
beat and is guaranteed at PITY_LIMIT, so anticipation compounds but
never curdles into frustration.
"""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any

PITY_LIMIT = 4          # a reward can never drought longer than this
BASE_REWARD_CHANCE = 0.30
CHANCE_PER_DRY_BEAT = 0.20
RELIEF_WINDOW = 2       # beats after a spike within which relief must land

REWARD_TIERS = (
    ("minor", 0.60),    # a texture, a half-truth, a small connection
    ("major", 0.32),    # a real clue, a confession fragment
    ("rare", 0.08),     # a revelation that recontextualizes an act
)


@dataclass
class Reward:
    tier: str
    beat: int


class TensionEngine:
    def __init__(self, rng: random.Random, state: dict[str, Any] | None = None):
        self.rng = rng
        state = state or {}
        self.value: float = state.get("value", 20.0)
        self.dry_beats: int = state.get("dry_beats", 0)
        self.beats_since_spike: int = state.get("beats_since_spike", 99)
        self.relief_owed: bool = state.get("relief_owed", False)

    # -- persistence ---------------------------------------------------
    def to_dict(self) -> dict[str, Any]:
        return {
            "value": self.value,
            "dry_beats": self.dry_beats,
            "beats_since_spike": self.beats_since_spike,
            "relief_owed": self.relief_owed,
        }

    # -- curve control ---------------------------------------------------
    def apply(self, delta: float) -> None:
        self.value = max(0.0, min(100.0, self.value + delta))
        if delta >= 15:  # that was a spike; the player is owed a breath
            self.relief_owed = True
            self.beats_since_spike = 0

    def step_beat(self, act: int, risk_tolerance: float) -> Reward | None:
        """Advance one beat: rising action, relief control, reward roll."""
        # rising action scales with act; high-risk players get a steeper climb
        self.apply(1.5 * act * (0.7 + 0.6 * risk_tolerance))
        self.beats_since_spike += 1

        if self.relief_owed and self.beats_since_spike >= RELIEF_WINDOW:
            # mandatory valley: let the player breathe before the next climb
            self.apply(-12.0)
            self.relief_owed = False

        return self._roll_reward()

    def _roll_reward(self) -> Reward | None:
        chance = BASE_REWARD_CHANCE + CHANCE_PER_DRY_BEAT * self.dry_beats
        if self.dry_beats >= PITY_LIMIT:
            chance = 1.0
        if self.rng.random() >= chance:
            self.dry_beats += 1
            return None
        self.dry_beats = 0
        roll, cum = self.rng.random(), 0.0
        for tier, weight in REWARD_TIERS:
            cum += weight
            if roll < cum:
                return Reward(tier=tier, beat=self.beats_since_spike)
        return Reward(tier="minor", beat=self.beats_since_spike)

    # -- session shaping ---------------------------------------------------
    def cliffhanger_armed(self) -> bool:
        """High tension at a chapter seam → end on an unresolved hook."""
        return self.value >= 60.0

    def intensity_band(self) -> str:
        if self.value < 34:
            return "calm"
        if self.value < 67:
            return "uneasy"
        return "dread"
