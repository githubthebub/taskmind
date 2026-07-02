"""TaskMind narrative engine.

A content-agnostic engine for text-based narrative simulations, built around
four cooperating systems: state (single serializable source of truth),
personalization (adaptive player appetite model), pacing (tension direction
with fair variable rewards), and NPC psychology (trait/emotion/relationship
layers with hidden agendas).
"""

from engine.state import GameState, PlayerProfile, WorldState, PacingState
from engine.npc import NPCState, NPCProfile
from engine.engine import Game

__all__ = [
    "GameState",
    "PlayerProfile",
    "WorldState",
    "PacingState",
    "NPCState",
    "NPCProfile",
    "Game",
]
