"""Narrative generation: assemble prose from scene templates through the
player's RenderPlan and the current tension band.

Sensory description lives in per-sense, per-intensity banks. The engine
leads with the player's preferred senses, scales density to their
demonstrated taste, and keeps an anti-repetition buffer so no phrase
repeats within its cooldown window.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field

from .personalization import RenderPlan

PHRASE_COOLDOWN = 6  # a sensory phrase may not repeat within this many renders


@dataclass
class SceneTemplate:
    id: str
    location: str
    base: str                                   # the scene's narrative spine
    # sensory banks: sense -> intensity band -> phrases
    senses: dict[str, dict[str, list[str]]] = field(default_factory=dict)
    hook: str = ""                              # cliffhanger line for this scene


class NarrativeEngine:
    def __init__(self, rng: random.Random):
        self.rng = rng
        self._recent: list[str] = []

    def _fresh(self, candidates: list[str]) -> str | None:
        pool = [c for c in candidates if c not in self._recent]
        if not pool:
            return None
        phrase = self.rng.choice(pool)
        self._recent.append(phrase)
        if len(self._recent) > PHRASE_COOLDOWN:
            self._recent.pop(0)
        return phrase

    def render(self, scene: SceneTemplate, plan: RenderPlan,
               band: str) -> str:
        parts = [scene.base]
        budget = {"terse": 1, "standard": 2, "lush": 3}[plan.verbosity]
        for sense in plan.lead_senses:
            if budget <= 0:
                break
            bank = scene.senses.get(sense, {})
            candidates = bank.get(band) or bank.get("uneasy") or []
            phrase = self._fresh(candidates)
            if phrase:
                parts.append(phrase)
                budget -= 1
        return " ".join(parts)

    def render_reward(self, tier: str, detail: str) -> str:
        frames = {
            "minor": f"A small thing snags your attention: {detail}",
            "major": f"There it is — the thread you've been pulling for: {detail}",
            "rare": (f"The floor of the case drops out from under you. "
                     f"{detail} Everything you thought you knew rearranges."),
        }
        return frames[tier]

    def render_cliffhanger(self, scene: SceneTemplate) -> str:
        return scene.hook or ("Somewhere above the town, the mast begins "
                              "to broadcast again.")
