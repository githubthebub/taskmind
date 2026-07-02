"""Narrative composition: turns a requested beat shape into concrete prose.

Content packs register ``BeatTemplate``s. Each template declares the shape it
can serve, prerequisites over the world, appetite tags for personalization,
a prose skeleton, sensory fragment banks, and 2–4 choices. The composer:

1. filters templates by shape + prerequisites (falling back to adjacent
   shapes rather than ever stalling),
2. weights candidates by player appetite and picks one,
3. layers in sensory fragments — count scaled to the player's demonstrated
   detail tolerance, with an anti-repetition ring buffer so no fragment
   recurs within its window,
4. returns a ``ComposedBeat`` ready to present.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

from engine import pacing, personalization
from engine.state import GameState

Predicate = Callable[[GameState], bool]
Effect = Callable[[GameState], None]

SENSES = ("sight", "sound", "smell", "touch")

# If no template serves the requested shape, try these instead (in order).
SHAPE_FALLBACKS = {
    pacing.CALM: (pacing.RISING, pacing.REWARD),
    pacing.RISING: (pacing.CALM, pacing.SPIKE),
    pacing.SPIKE: (pacing.RISING, pacing.CALM),
    pacing.REWARD: (pacing.RISING, pacing.CALM),
    pacing.CLIFFHANGER: (pacing.SPIKE, pacing.RISING),
}

ANTI_REPEAT_WINDOW = 12  # sensory fragments remembered for dedup


@dataclass
class BeatChoice:
    text: str
    signals: dict[str, float] = field(default_factory=dict)
    effect: Effect | None = None
    tension_delta: float = 0.0
    condition: Predicate | None = None
    # Name of an NPC whose dialogue tree this choice opens (frontend runs it
    # with DialogueRunner before the beat resolves), or None.
    talk_to: str | None = None

    def available(self, state: GameState) -> bool:
        return self.condition is None or self.condition(state)


@dataclass
class BeatTemplate:
    beat_id: str
    shape: str
    prose: str                                  # skeleton; may contain {senses}
    choices: list[BeatChoice]
    tags: dict[str, float] = field(default_factory=dict)  # appetite tags
    sensory: dict[str, list[str]] = field(default_factory=dict)
    condition: Predicate | None = None
    once: bool = False                          # never repeats within a run
    location: str | None = None                # sets world.location on entry
    on_enter: Effect | None = None

    def available(self, state: GameState, used: set[str]) -> bool:
        if self.once and self.beat_id in used:
            return False
        if self.condition is not None and not self.condition(state):
            return False
        return any(c.available(state) for c in self.choices) or not self.choices


@dataclass
class ComposedBeat:
    template: BeatTemplate
    shape: str
    prose: str
    choices: list[BeatChoice]


class NarrativeEngine:
    def __init__(self, templates: list[BeatTemplate]):
        ids = [t.beat_id for t in templates]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate beat_id in content pack")
        self.templates = templates
        self.used_beats: set[str] = set()
        self.recent_fragments: list[str] = []

    # -- selection ------------------------------------------------------------

    def compose(self, state: GameState, shape: str) -> ComposedBeat:
        template = self._select(state, shape)
        self.used_beats.add(template.beat_id)
        if template.location:
            state.world.location = template.location
        if template.on_enter is not None:
            template.on_enter(state)
        prose = self._layer_senses(state, template)
        choices = [c for c in template.choices if c.available(state)]
        return ComposedBeat(template, template.shape, prose, choices)

    def _select(self, state: GameState, shape: str) -> BeatTemplate:
        for candidate_shape in (shape, *SHAPE_FALLBACKS.get(shape, ())):
            pool = [
                t for t in self.templates
                if t.shape == candidate_shape and t.available(state, self.used_beats)
            ]
            if pool:
                return self._weighted_pick(state, pool)
        # Last resort: any available beat at all. Tests assert we never get here
        # with a well-formed content pack, but a stall must not crash a player.
        pool = [t for t in self.templates if t.available(state, self.used_beats)]
        if not pool:
            raise RuntimeError("content exhausted: no available beats")
        return self._weighted_pick(state, pool)

    def _weighted_pick(self, state: GameState, pool: list[BeatTemplate]) -> BeatTemplate:
        weights = [
            personalization.beat_affinity(state.player, t.tags) for t in pool
        ]
        total = sum(weights)
        mark = state.roll() * total
        acc = 0.0
        for template, weight in zip(pool, weights):
            acc += weight
            if mark <= acc:
                return template
        return pool[-1]

    # -- sensory layering -------------------------------------------------------

    def _layer_senses(self, state: GameState, template: BeatTemplate) -> str:
        budget = personalization.sensory_budget(state.player)
        fragments: list[str] = []
        # Rotate sense order per beat so one sense doesn't dominate.
        order = list(SENSES)
        offset = state.pacing.beat_index % len(order)
        order = order[offset:] + order[:offset]
        for sense in order:
            if len(fragments) >= budget:
                break
            bank = [
                f for f in template.sensory.get(sense, ())
                if f not in self.recent_fragments
            ]
            if bank:
                fragments.append(state.choice(bank))
        self.recent_fragments.extend(fragments)
        del self.recent_fragments[:-ANTI_REPEAT_WINDOW]

        senses_text = " ".join(fragments)
        if "{senses}" in template.prose:
            return template.prose.replace("{senses}", senses_text).strip()
        if senses_text:
            return template.prose.strip() + "\n\n" + senses_text
        return template.prose.strip()
