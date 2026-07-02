"""The core loop orchestrator.

PERCEIVE -> CHOOSE -> RESOLVE -> ADAPT -> ADVANCE, one pass per turn.

Determinism contract: the per-step RNG is derived from
(seed, beat, choices_made), so a game saved mid-scene and reloaded
continues *identically* for the same choice sequence.
"""
from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass, field
from typing import Any

from . import content
from .dialogue import Choice
from .narrative import NarrativeEngine
from .npc import NPCBrain, NPCState
from .personalization import Personalizer
from .state import GameState
from .tension import TensionEngine

SESSION_BEATS = 12   # soft chapter seam: cliffhanger + recap seed arm here
MAST_OPENS_AT = 6    # the signal makes the climb unavoidable by this beat
HARD_CAP = 30        # narrative failsafe: the story *will* reach the mast


@dataclass
class View:
    """Everything the presentation layer needs for one turn."""

    location: str
    text: str
    speaker_line: str
    choices: list[str]
    events: list[str] = field(default_factory=list)
    ending_text: str | None = None
    session_break: bool = False


class Game:
    def __init__(self, state: GameState):
        self.state = state
        rng = self._step_rng()
        self.tension = TensionEngine(rng, state.tension or None)
        self.narrator = NarrativeEngine(rng)
        self.personalizer = Personalizer(rng)
        self._pending_events: list[str] = []
        if state.recap_seed:
            self._pending_events.append(state.recap_seed)
            state.recap_seed = None

    # -- construction --------------------------------------------------
    @classmethod
    def new(cls, seed: int = 0) -> "Game":
        state = GameState(seed=seed, scene_id="arrival#start")
        state.npcs = {nid: NPCState().to_dict() for nid in content.NPC_PROFILES}
        problems = content.validate_all()
        if problems:
            raise ValueError("content failed validation: " + "; ".join(problems))
        return cls(state)

    @classmethod
    def from_state(cls, state: GameState) -> "Game":
        return cls(state)

    # -- deterministic randomness ---------------------------------------
    def _step_rng(self, channel: str = "mechanics") -> random.Random:
        # mechanics and presentation draw from separate streams: view() can
        # be called any number of times without perturbing game outcomes,
        # and a reloaded save continues identically.
        key = (f"{self.state.seed}:{self.state.world.beat}:"
               f"{self.state.profile.choices_made}:{channel}")
        digest = hashlib.sha256(key.encode()).digest()
        return random.Random(int.from_bytes(digest[:8], "big"))

    def _retune(self) -> None:
        self.tension.rng = self._step_rng()

    # -- current position ------------------------------------------------
    def _position(self) -> tuple[str, str]:
        scene_id, _, node_id = self.state.scene_id.partition("#")
        return scene_id, node_id

    def _brain(self, npc_id: str) -> NPCBrain:
        return NPCBrain(content.NPC_PROFILES[npc_id],
                        NPCState.from_dict(self.state.npcs[npc_id]))

    def _speaker_trust(self, speaker: str) -> float:
        if speaker == "narrator":
            return 100.0
        return self.state.npcs[speaker]["trust"]

    # -- PERCEIVE ---------------------------------------------------------
    def view(self) -> View:
        if self.over:
            return View(location="", text="", speaker_line="", choices=[],
                        ending_text=content.ENDINGS[self.state.world.ending])
        scene_id, node_id = self._position()
        scene = content.SCENES[scene_id]
        node = content.TREES[scene_id].node(node_id)
        view_rng = self._step_rng("presentation")
        self.personalizer.rng = view_rng
        self.narrator.rng = view_rng
        plan = self.personalizer.plan(self.state.profile)
        text = self.narrator.render(scene, plan, self.tension.intensity_band())
        speaker_line = node.pick_text(view_rng)
        choices = self._available(node)
        events, self._pending_events = self._pending_events, []
        return View(
            location=scene.location, text=text, speaker_line=speaker_line,
            choices=[c.text for c in choices], events=events,
            session_break=(self.state.world.beat >= SESSION_BEATS
                           and self.tension.cliffhanger_armed()),
        )

    def _available(self, node) -> list[Choice]:
        return content.TREES[self._position()[0]].available_choices(
            node, self.state.world.flags,
            self._speaker_trust(node.speaker))

    # -- CHOOSE + RESOLVE + ADAPT + ADVANCE --------------------------------
    def choose(self, index: int) -> None:
        if self.over:
            raise RuntimeError("the story has ended")
        scene_id, node_id = self._position()
        node = content.TREES[scene_id].node(node_id)
        options = self._available(node)
        choice = options[index]
        world, profile = self.state.world, self.state.profile

        # ADAPT: learn from the micro-choice before anything else
        profile.record_choice(choice.style, choice.senses, len(choice.text))
        self.state.history.append(f"{scene_id}/{node_id}:{choice.style}")

        # RESOLVE: the speaker's mind reacts to *how* you did it
        if node.speaker != "narrator":
            brain = self._brain(node.speaker)
            reaction = brain.react(choice.style, self.tension.value)
            if reaction.reveal:
                self._pending_events.append(
                    f"— {brain.profile.name} {'breaks' if brain.state.revealed_by_fear else 'decides to trust you'} —\n"
                    f"{reaction.reveal}")
                world.add_clue(f"confession:{node.speaker}")
                self.tension.apply(18.0 if brain.state.revealed_by_fear else 12.0)
            self.state.npcs[node.speaker] = brain.state.to_dict()

        # RESOLVE: explicit effects
        self._apply_effects(choice, node.speaker)

        # ADVANCE: beat clock, auto-flags, rewards, cliffhangers
        if world.ending is None:
            self._advance(choice)

        # persist tension + retune rng for the next step
        self.state.tension = self.tension.to_dict()
        self._retune()

    def _apply_effects(self, choice: Choice, speaker: str) -> None:
        world = self.state.world
        fx = choice.effects
        if "tension" in fx:
            self.tension.apply(float(fx["tension"]))
        if "flag" in fx:
            world.set_flag(fx["flag"])
        if "clue" in fx and world.add_clue(fx["clue"]):
            self._pending_events.append(f"◇ Noted: {fx['clue']}")
        for stat in ("trust", "fear"):
            if stat in fx and speaker != "narrator":
                npc = self.state.npcs[speaker]
                npc[stat] = max(0.0, min(100.0, npc[stat] + float(fx[stat])))
        if "end" in fx:
            world.ending = fx["end"]
        elif "goto_scene" in fx:
            target = fx["goto_scene"]
            self.state.scene_id = f"{target}#{content.TREES[target].entry}"
        elif choice.next is not None:
            scene_id, _ = self._position()
            self.state.scene_id = f"{scene_id}#{choice.next}"

    def _advance(self, choice: Choice) -> None:
        world, profile = self.state.world, self.state.profile
        scene_changed = "goto_scene" in choice.effects
        if not scene_changed:
            return  # beats tick at scene seams; within a scene, no clock

        world.beat += 1
        world.act = 1 if world.beat < 5 else (2 if world.beat < 12 else 3)

        # auto-flags that shape what the world offers
        if len(world.clues) >= 3 and not world.has("well_informed"):
            world.set_flag("well_informed")
            self._pending_events.append(
                "◇ The pieces are starting to hold each other up. "
                "You could name this thing now.")
        if any(NPCBrain(content.NPC_PROFILES[nid],
                        NPCState.from_dict(s)).disposition() == "ally"
               for nid, s in self.state.npcs.items()) \
                and not world.has("ally_made"):
            world.set_flag("ally_made")
            self._pending_events.append(
                "◇ Someone in this town is on your side now. That changes "
                "what's possible at the end.")
        if world.beat >= MAST_OPENS_AT and not world.has("mast_open"):
            world.set_flag("mast_open")
            self._pending_events.append(
                "◇ The signal shifts — the count has changed. Whatever is "
                "happening at the mast is happening *now*. The climb is open.")

        # variable-reward beat: anticipation with a pity timer
        reward = self.tension.step_beat(world.act, profile.risk_tolerance())
        if reward:
            detail = self.tension.rng.choice(content.REWARD_DETAILS[reward.tier])
            self._pending_events.append(
                self.narrator.render_reward(reward.tier, detail))
            if reward.tier in ("major", "rare"):
                world.add_clue(f"found:{detail[:40]}")
                self.tension.apply(8.0)

        # chapter seam: arm the cliffhanger + recap for the next session
        if world.beat >= SESSION_BEATS and self.tension.cliffhanger_armed():
            scene_id, _ = self._position()
            scene = content.SCENES[scene_id]
            hook = self.narrator.render_cliffhanger(scene)
            self._pending_events.append(f"※ {hook}")
            self.state.recap_seed = content.RECAP_LINES.get(scene_id)

        # narrative failsafe: the story always reaches its crisis
        scene_id, _ = self._position()
        if world.beat >= HARD_CAP and scene_id != "mast":
            world.set_flag("mast_open")
            self.state.scene_id = f"mast#{content.TREES['mast'].entry}"
            self._pending_events.append(
                "※ The signal drags at you like an undertow. There is no "
                "more town to ask — only the climb.")

    # -- terminal state ---------------------------------------------------
    @property
    def over(self) -> bool:
        return self.state.world.ending is not None

    def status(self) -> dict[str, Any]:
        """Diagnostic snapshot (also used by the test harness)."""
        return {
            "beat": self.state.world.beat,
            "act": self.state.world.act,
            "tension": round(self.tension.value, 1),
            "band": self.tension.intensity_band(),
            "clues": len(self.state.world.clues),
            "style": self.state.profile.dominant_style(),
            "npcs": {nid: self._brain(nid).disposition()
                     for nid in self.state.npcs},
        }
