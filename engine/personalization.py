"""Adaptive player model.

Every choice a player makes carries ``signals`` — small tags describing what
kind of experience that choice reaches for (``{"mystery": 0.8}`` means "this
was a mystery-seeking move"). The model folds signals into the profile with an
exponential moving average: recent behavior dominates, but no single choice
can whipsaw the profile. The rest of the engine reads the profile; it never
writes it.
"""

from __future__ import annotations

from engine.state import APPETITE_AXES, PlayerProfile

# EWMA blend factor per observed signal. 0.18 ≈ the last ~10 relevant choices
# carry most of the weight; early choices fade but never vanish.
ALPHA = 0.18

# Signals outside appetite axes with dedicated handling.
DETAIL_SIGNAL = "detail"   # +ve: lingered/examined, -ve: rushed/skipped
RISK_SIGNAL = "risk"       # +ve: reckless move, -ve: cautious move


def apply_choice_signals(profile: PlayerProfile, signals: dict[str, float]) -> None:
    """Fold one choice's signals into the profile (in place)."""
    for axis, value in signals.items():
        if axis in APPETITE_AXES:
            # Signal value is a target in [-1, 1]; map to [0, 1] appetite space.
            target = _clamp01(0.5 + value / 2.0)
            profile.appetite[axis] += ALPHA * (target - profile.appetite[axis])
        elif axis == DETAIL_SIGNAL:
            target = _clamp01(0.5 + value / 2.0)
            profile.detail_tolerance += ALPHA * (target - profile.detail_tolerance)
        elif axis == RISK_SIGNAL:
            clamped = max(-1.0, min(1.0, value))
            profile.risk_posture += ALPHA * (clamped - profile.risk_posture)
    profile.choices_made += 1


def beat_affinity(profile: PlayerProfile, beat_tags: dict[str, float]) -> float:
    """Score how well a beat's content tags match this player's appetite.

    Returns a multiplicative weight >= 0.1 so no beat is ever fully starved —
    personalization biases the mix, it must not collapse the story's variety.
    """
    if not beat_tags:
        return 1.0
    score = 0.0
    total = 0.0
    for axis, weight in beat_tags.items():
        if axis in profile.appetite:
            score += weight * profile.appetite[axis]
            total += weight
    if total == 0:
        return 1.0
    return max(0.1, 0.4 + 1.2 * (score / total))


def sensory_budget(profile: PlayerProfile) -> int:
    """How many sensory fragments to layer into a beat (1–3)."""
    if profile.detail_tolerance < 0.35:
        return 1
    if profile.detail_tolerance < 0.7:
        return 2
    return 3


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))
