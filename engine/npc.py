"""Layered NPC psychology.

Three timescales per character:

* **Traits** (stable): OCEAN personality + a hidden agenda. Traits bias how
  ambiguous player actions are *appraised* — the same move reads as a threat
  to a neurotic character and as goodwill to an agreeable one.
* **Emotion** (fast): a valence/arousal point pushed by appraisals, decaying
  each beat toward a trait-determined baseline. Mapped to a discrete mood
  label that dialogue uses to select line variants.
* **Relationship** (slow): trust / warmth / fear toward the player. Threshold
  crossings flip *stances* (wary → open → confessional / hostile), which gate
  entire dialogue subtrees.

NPCs also keep episodic memory of salient player actions (with decaying
salience) so later dialogue can call back to what the player actually did —
the single cheapest trick for making characters feel unscripted.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# Stances, ordered roughly from worst to best standing.
HOSTILE = "hostile"
WARY = "wary"
OPEN = "open"
CONFESSIONAL = "confessional"


@dataclass(frozen=True)
class Agenda:
    """A hidden motive. ``concealment`` is how hard the NPC hides it (0–1);
    ``tell`` is the behavioral leak attentive players can catch."""

    goal: str
    concealment: float
    tell: str


@dataclass(frozen=True)
class NPCProfile:
    """Stable identity: never mutated at runtime."""

    name: str
    # OCEAN, each in [0, 1].
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float
    agenda: Agenda
    # Emotional resting point this character decays toward.
    baseline_valence: float = 0.0   # [-1, 1]
    baseline_arousal: float = 0.3   # [0, 1]


@dataclass
class Memory:
    event: str        # e.g. "player_lied", "player_defended_me"
    valence: float    # how it felt to this NPC, [-1, 1]
    salience: float   # decays; below threshold the memory stops surfacing
    beat_index: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "event": self.event,
            "valence": self.valence,
            "salience": self.salience,
            "beat_index": self.beat_index,
        }


class NPCState:
    """Runtime psychological state for one character."""

    def __init__(self, profile: NPCProfile):
        self.profile = profile
        self.valence = profile.baseline_valence
        self.arousal = profile.baseline_arousal
        self.trust = 0.35
        self.warmth = 0.3
        self.fear = 0.1
        self.memories: list[Memory] = []
        self.agenda_exposed = False   # player has uncovered the hidden motive

    # -- appraisal ------------------------------------------------------------

    def appraise(self, event: str, raw_valence: float, intensity: float,
                 beat_index: int, touches_agenda: bool = False) -> None:
        """React to a player action.

        ``raw_valence`` is the action's face value; traits distort it.
        ``touches_agenda`` marks actions that probe what the NPC is hiding —
        those spike arousal and fear regardless of face value.
        """
        p = self.profile
        felt = raw_valence
        # Neurotics amplify negatives; agreeable characters soften them.
        if felt < 0:
            felt *= 1.0 + 0.6 * p.neuroticism
            felt *= 1.0 - 0.3 * p.agreeableness
        else:
            felt *= 0.7 + 0.6 * p.agreeableness

        self.valence = _clamp(self.valence + 0.5 * felt * intensity, -1, 1)
        self.arousal = _clamp(self.arousal + 0.35 * intensity, 0, 1)

        # Slow layer.
        if felt >= 0:
            self.trust = _clamp(self.trust + 0.15 * felt * intensity, 0, 1)
            self.warmth = _clamp(self.warmth + 0.12 * felt * intensity, 0, 1)
            self.fear = _clamp(self.fear - 0.05 * felt * intensity, 0, 1)
        else:
            # Betrayal costs more trust than kindness buys — asymmetry is
            # what makes trust feel earned.
            self.trust = _clamp(self.trust + 0.24 * felt * intensity, 0, 1)
            self.fear = _clamp(self.fear - 0.12 * felt * intensity, 0, 1)

        if touches_agenda and not self.agenda_exposed:
            self.arousal = _clamp(self.arousal + 0.25, 0, 1)
            self.fear = _clamp(self.fear + 0.12 * self.profile.agenda.concealment, 0, 1)

        if abs(raw_valence) * intensity >= 0.3:  # only salient events persist
            self.memories.append(
                Memory(event, raw_valence, min(1.0, abs(raw_valence) * intensity + 0.3),
                       beat_index)
            )

    def decay(self) -> None:
        """Per-beat homeostasis: emotion drifts home, memories fade."""
        p = self.profile
        # High neuroticism = slow return to baseline (they stew).
        rate = 0.25 * (1.0 - 0.5 * p.neuroticism)
        self.valence += rate * (p.baseline_valence - self.valence)
        self.arousal += rate * (p.baseline_arousal - self.arousal)
        for m in self.memories:
            m.salience *= 0.97
        self.memories = [m for m in self.memories if m.salience > 0.15]

    # -- read model -------------------------------------------------------------

    def stance(self) -> str:
        if self.trust < 0.2 or self.fear > 0.75:
            return HOSTILE
        if self.trust < 0.5:
            return WARY
        if self.trust >= 0.8 and self.warmth >= 0.55:
            return CONFESSIONAL
        return OPEN

    def mood(self) -> str:
        """Discrete label for dialogue variant selection."""
        if self.arousal >= 0.65:
            return "threatening" if self.valence < -0.25 else "electric"
        if self.valence <= -0.35:
            return "brittle"
        if self.valence >= 0.35:
            return "warm"
        return "guarded"

    def sharpest_memory(self) -> Memory | None:
        """The grievance or gratitude most likely to surface in dialogue."""
        if not self.memories:
            return None
        return max(self.memories, key=lambda m: m.salience * abs(m.valence))

    def leaks_tell(self, roll: float) -> bool:
        """Hidden agendas leak. Chance rises as concealment cracks under fear."""
        if self.agenda_exposed:
            return False
        base = 0.08 * (1.0 - self.profile.agenda.concealment)
        stress_bonus = 0.10 * self.fear
        return roll < base + stress_bonus

    # -- serialization ---------------------------------------------------------

    def to_dict(self) -> dict[str, Any]:
        return {
            "profile": {
                "name": self.profile.name,
                "openness": self.profile.openness,
                "conscientiousness": self.profile.conscientiousness,
                "extraversion": self.profile.extraversion,
                "agreeableness": self.profile.agreeableness,
                "neuroticism": self.profile.neuroticism,
                "agenda": {
                    "goal": self.profile.agenda.goal,
                    "concealment": self.profile.agenda.concealment,
                    "tell": self.profile.agenda.tell,
                },
                "baseline_valence": self.profile.baseline_valence,
                "baseline_arousal": self.profile.baseline_arousal,
            },
            "valence": self.valence,
            "arousal": self.arousal,
            "trust": self.trust,
            "warmth": self.warmth,
            "fear": self.fear,
            "memories": [m.to_dict() for m in self.memories],
            "agenda_exposed": self.agenda_exposed,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "NPCState":
        pd = d["profile"]
        profile = NPCProfile(
            name=pd["name"],
            openness=pd["openness"],
            conscientiousness=pd["conscientiousness"],
            extraversion=pd["extraversion"],
            agreeableness=pd["agreeableness"],
            neuroticism=pd["neuroticism"],
            agenda=Agenda(**pd["agenda"]),
            baseline_valence=pd.get("baseline_valence", 0.0),
            baseline_arousal=pd.get("baseline_arousal", 0.3),
        )
        npc = cls(profile)
        npc.valence = d.get("valence", profile.baseline_valence)
        npc.arousal = d.get("arousal", profile.baseline_arousal)
        npc.trust = d.get("trust", 0.35)
        npc.warmth = d.get("warmth", 0.3)
        npc.fear = d.get("fear", 0.1)
        npc.memories = [Memory(**m) for m in d.get("memories", [])]
        npc.agenda_exposed = d.get("agenda_exposed", False)
        return npc


def _clamp(x: float, low: float, high: float) -> float:
    return max(low, min(high, x))
