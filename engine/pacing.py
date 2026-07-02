"""Pacing director: tension curve, variable rewards, cliffhanger placement.

The director never writes prose. Each beat it inspects the pacing state and
requests a *shape* — the narrative engine then finds concrete content matching
that shape. This split keeps dramatic structure testable independently of any
particular story.

Fairness stance: reward timing is randomized (anticipation) but bounded by a
guarantee window (never starved), and cliffhangers are rationed so they keep
meaning something. Tension always gets recovery valleys — sustained max
tension reads as noise, not drama.
"""

from __future__ import annotations

from engine.state import GameState, PacingState, PlayerProfile

# Beat shapes the director can request.
CALM = "calm"                # recovery, character moments, world texture
RISING = "rising"            # complication, pressure, unease
SPIKE = "spike"              # danger, confrontation, revelation-as-threat
REWARD = "reward"            # payoff: clue, secret, relationship breakthrough
CLIFFHANGER = "cliffhanger"  # chapter-end suspension

SHAPES = (CALM, RISING, SPIKE, REWARD, CLIFFHANGER)

# Reward scheduler: uniform roll in [MIN_GAP, MAX_GAP] beats between payoffs.
# MAX_GAP is the fairness guarantee — droughts beyond it are a bug.
REWARD_MIN_GAP = 2
REWARD_MAX_GAP = 6

CHAPTER_LENGTH = 8            # beats per chapter (before personalization nudges)
CLIFFHANGER_TENSION = 0.55    # min tension for a chapter to end on a cliffhanger
RECENT_WINDOW = 4             # shapes remembered for anti-monotony checks

# How each shape moves tension when it lands (before beat-specific deltas).
SHAPE_TENSION_DELTA = {
    CALM: -0.12,
    RISING: 0.08,
    SPIKE: 0.18,
    REWARD: -0.05,
    CLIFFHANGER: 0.15,
}


def target_tension(pacing: PacingState) -> float:
    """Escalating sawtooth: each chapter climbs to a higher peak.

    Chapter n climbs from a valley toward a peak; peaks rise ~0.12/chapter
    toward a 0.95 ceiling, valleys rise more slowly, so late-game "calm" is
    still tenser than early-game danger.
    """
    peak = min(0.95, 0.45 + 0.12 * pacing.chapter)
    valley = min(0.6, 0.10 + 0.06 * pacing.chapter)
    progress = min(1.0, pacing.beats_in_chapter / max(1, CHAPTER_LENGTH - 1))
    return valley + (peak - valley) * progress


def chapter_length(profile: PlayerProfile) -> int:
    """Action-hungry players get slightly shorter chapters (faster peaks)."""
    if profile.appetite.get("action", 0.5) > 0.7:
        return CHAPTER_LENGTH - 2
    if profile.appetite.get("dread", 0.5) > 0.7:
        return CHAPTER_LENGTH + 2  # dread players want the slow climb
    return CHAPTER_LENGTH


def request_shape(state: GameState) -> str:
    """Pick the next beat shape. Called once per beat, before composition."""
    pacing = state.pacing
    profile = state.player

    if pacing.next_reward_gap == 0:
        _roll_reward_gap(state)

    # Fairness guarantee first — it's a hard bound, so not even a chapter
    # boundary may stretch the drought past MAX_GAP.
    if pacing.beats_since_reward >= REWARD_MAX_GAP:
        return REWARD

    at_chapter_end = pacing.beats_in_chapter >= chapter_length(profile) - 1

    # Chapter boundary: cliffhanger if earned, otherwise let the chapter
    # close on whatever the curve wants (a quiet chapter end is fine).
    if at_chapter_end:
        if (
            pacing.tension >= CLIFFHANGER_TENSION
            and not pacing.last_chapter_cliffhanger
        ):
            return CLIFFHANGER

    # Scheduled reward window reached?
    if pacing.beats_since_reward >= pacing.next_reward_gap:
        return REWARD

    # Otherwise steer tension toward the curve.
    error = target_tension(pacing) - pacing.tension
    if error > 0.15:
        shape = SPIKE if error > 0.22 else RISING
    elif error < -0.15:
        shape = CALM
    else:
        shape = RISING if state.roll() < 0.6 else CALM

    return _break_monotony(state, shape)


def _break_monotony(state: GameState, shape: str) -> str:
    """Never three identical shapes in a row; drama needs contrast."""
    recent = state.pacing.recent_shapes
    if len(recent) >= 2 and recent[-1] == recent[-2] == shape:
        if shape == CALM:
            return RISING
        if shape in (RISING, SPIKE):
            return CALM if state.roll() < 0.5 else REWARD
    return shape


def _roll_reward_gap(state: GameState) -> None:
    state.pacing.next_reward_gap = state.roll_int(REWARD_MIN_GAP, REWARD_MAX_GAP)


def record_beat(state: GameState, shape: str, tension_delta: float = 0.0) -> None:
    """Update pacing bookkeeping after a beat resolves."""
    pacing = state.pacing
    pacing.tension = _clamp01(
        pacing.tension + SHAPE_TENSION_DELTA.get(shape, 0.0) + tension_delta
    )
    pacing.beat_index += 1
    pacing.beats_in_chapter += 1
    pacing.recent_shapes.append(shape)
    del pacing.recent_shapes[:-RECENT_WINDOW]

    if shape == REWARD:
        pacing.beats_since_reward = 0
        _roll_reward_gap(state)
    else:
        pacing.beats_since_reward += 1

    if shape == CLIFFHANGER or pacing.beats_in_chapter >= chapter_length(state.player):
        pacing.last_chapter_cliffhanger = shape == CLIFFHANGER
        pacing.chapter += 1
        pacing.beats_in_chapter = 0


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))
