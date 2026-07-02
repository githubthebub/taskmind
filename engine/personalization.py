"""Hyper-personalization: turn the learned PlayerProfile into a RenderPlan.

The engine leans into the player's demonstrated style ~70% of the time
(flow) and deliberately against it ~30% (growth), so the story adapts
without becoming an echo chamber.
"""
from __future__ import annotations

import random
from dataclasses import dataclass

from .state import PlayerProfile, STYLES

FLOW_RATIO = 0.7


@dataclass
class RenderPlan:
    """Everything the narrative renderer needs to speak this player's language."""

    lead_senses: list[str]      # which sensory channels carry the scene
    verbosity: str              # "terse" | "standard" | "lush"
    challenge_style: str        # which psychological muscle this beat tests
    with_grain: bool            # True = flow beat, False = growth beat


class Personalizer:
    def __init__(self, rng: random.Random):
        self.rng = rng

    def plan(self, profile: PlayerProfile) -> RenderPlan:
        with_grain = self.rng.random() < FLOW_RATIO
        dominant = profile.dominant_style()
        if with_grain or profile.choices_made < 3:
            challenge = dominant
        else:
            # push against the grain: test the style the player avoids
            others = [s for s in STYLES if s != dominant]
            weights = profile.style_weights()
            challenge = min(others, key=lambda s: (weights[s], STYLES.index(s)))

        d = profile.detail_preference
        verbosity = "terse" if d < 0.35 else ("lush" if d > 0.65 else "standard")

        return RenderPlan(
            lead_senses=profile.top_senses(2),
            verbosity=verbosity,
            challenge_style=challenge,
            with_grain=with_grain,
        )
