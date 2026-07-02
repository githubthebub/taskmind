"""Multilayered NPC minds.

Static NPCProfile (traits, hidden motive, secret) + dynamic NPCState
(trust / fear / respect, mood, episodic memory) + NPCBrain update rules.

The core idea: the same player act lands differently on different
psyches. Pressure terrifies a high-neuroticism mind and quietly earns
respect from a hardened one. Secrets surface when *trust* crosses the
reveal threshold — or when *fear* does, which produces a different,
damaged kind of confession the story treats as a moral cost.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

CLAMP = lambda v: max(0.0, min(100.0, v))  # noqa: E731


@dataclass(frozen=True)
class NPCProfile:
    id: str
    name: str
    role: str
    # five-factor traits, 0..1
    openness: float
    conscientiousness: float
    extraversion: float
    agreeableness: float
    neuroticism: float
    hidden_motive: str
    secret: str
    reveal_trust: float = 65.0   # trust needed for a willing confession
    reveal_fear: float = 80.0    # fear that forces a broken one


@dataclass
class NPCState:
    trust: float = 30.0
    fear: float = 10.0
    respect: float = 30.0
    mood_valence: float = 0.0    # -1 bleak .. +1 warm
    mood_arousal: float = 0.3    # 0 flat .. 1 charged
    revealed: bool = False
    revealed_by_fear: bool = False
    memory: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "trust": self.trust, "fear": self.fear, "respect": self.respect,
            "mood_valence": self.mood_valence, "mood_arousal": self.mood_arousal,
            "revealed": self.revealed, "revealed_by_fear": self.revealed_by_fear,
            "memory": list(self.memory),
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "NPCState":
        return cls(
            trust=d["trust"], fear=d["fear"], respect=d["respect"],
            mood_valence=d["mood_valence"], mood_arousal=d["mood_arousal"],
            revealed=d["revealed"], revealed_by_fear=d["revealed_by_fear"],
            memory=list(d["memory"]),
        )


@dataclass
class Reaction:
    """What an interaction did to this mind, and how it shows."""

    tone: str                 # "opens" | "hardens" | "frays" | "steadies"
    trust_delta: float
    fear_delta: float
    respect_delta: float
    reveal: str | None = None  # the secret, if this was the moment it surfaced


class NPCBrain:
    def __init__(self, profile: NPCProfile, state: NPCState):
        self.profile = profile
        self.state = state

    def react(self, style: str, tension: float) -> Reaction:
        p, s = self.profile, self.state
        trust_d = fear_d = respect_d = 0.0

        if style == "bold":
            # pressure: frightens fragile minds, earns respect from hard ones
            fear_d = 6.0 + 14.0 * p.neuroticism
            respect_d = 8.0 * (1.0 - p.agreeableness)
            trust_d = -4.0 * p.agreeableness
        elif style == "empathic":
            trust_d = 5.0 + 10.0 * p.agreeableness + 4.0 * p.neuroticism
            fear_d = -5.0
            respect_d = 2.0
        elif style == "analytical":
            # being *seen accurately* comforts open minds, unnerves guarded ones
            trust_d = 7.0 * p.openness
            fear_d = 6.0 * (1.0 - p.openness) * p.neuroticism
            respect_d = 6.0 * p.conscientiousness
        elif style == "cautious":
            trust_d = 3.0
            fear_d = -2.0
            respect_d = 1.0 + 3.0 * p.conscientiousness

        # ambient dread bleeds into every exchange
        fear_d += 2.0 * (tension / 100.0)

        s.trust = CLAMP(s.trust + trust_d)
        s.fear = CLAMP(s.fear + fear_d)
        s.respect = CLAMP(s.respect + respect_d)

        # mood evolves toward the emotional weather of the moment
        s.mood_valence = max(-1.0, min(1.0, s.mood_valence
                             + 0.02 * trust_d - 0.015 * fear_d))
        s.mood_arousal = max(0.0, min(1.0, s.mood_arousal
                             + 0.01 * abs(fear_d) + 0.005 * abs(trust_d)))

        reveal = self._check_reveal()
        tone = self._tone(trust_d, fear_d)
        s.memory.append(f"{style}:{tone}")
        if len(s.memory) > 12:
            s.memory.pop(0)

        return Reaction(tone=tone, trust_delta=trust_d, fear_delta=fear_d,
                        respect_delta=respect_d, reveal=reveal)

    def _check_reveal(self) -> str | None:
        p, s = self.profile, self.state
        if s.revealed:
            return None
        if s.trust >= p.reveal_trust:
            s.revealed = True
            return p.secret
        if s.fear >= p.reveal_fear:
            s.revealed = True
            s.revealed_by_fear = True
            return p.secret
        return None

    @staticmethod
    def _tone(trust_d: float, fear_d: float) -> str:
        if fear_d > 8:
            return "frays"
        if trust_d > 6:
            return "opens"
        if trust_d < 0:
            return "hardens"
        return "steadies"

    def disposition(self) -> str:
        """One-word read of where this relationship stands."""
        s = self.state
        if s.revealed_by_fear:
            return "broken"
        if s.trust >= 65:
            return "ally"
        if s.fear >= 60:
            return "afraid"
        if s.trust <= 15:
            return "closed"
        return "guarded"
