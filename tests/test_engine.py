"""Unit layer: state round-trips, tension bounds, NPC trait modulation,
personalization, narrative freshness, dialogue validation."""
import random
import unittest

from engine import content
from engine.dialogue import Choice, DialogueTree, Node
from engine.narrative import NarrativeEngine, PHRASE_COOLDOWN
from engine.npc import NPCBrain, NPCState
from engine.personalization import Personalizer
from engine.state import GameState, PlayerProfile
from engine.tension import PITY_LIMIT, TensionEngine


class TestState(unittest.TestCase):
    def test_round_trip(self):
        state = GameState(seed=42)
        state.profile.record_choice("bold", ("sight",), 55)
        state.world.set_flag("mast_open")
        state.world.add_clue("the bare mooring buoy")
        state.npcs["mara"] = NPCState(trust=61.0).to_dict()
        clone = GameState.from_dict(state.to_dict())
        self.assertEqual(clone.to_dict(), state.to_dict())

    def test_profile_learns_style(self):
        p = PlayerProfile()
        for _ in range(5):
            p.record_choice("empathic", ("sound",), 60)
        p.record_choice("cautious", (), 30)
        p.record_choice("cautious", (), 30)
        p.record_choice("bold", (), 30)
        self.assertEqual(p.dominant_style(), "empathic")
        self.assertIn("sound", p.top_senses(1))
        # 1 bold vs 2 cautious picks -> below-baseline risk appetite
        self.assertLess(p.risk_tolerance(), 0.5)

    def test_detail_preference_tracks_option_length(self):
        p = PlayerProfile()
        for _ in range(20):
            p.record_choice("cautious", (), 100)
        self.assertGreater(p.detail_preference, 0.65)


class TestTension(unittest.TestCase):
    def test_bounds_hold_under_abuse(self):
        t = TensionEngine(random.Random(1))
        for _ in range(200):
            t.apply(50)
            t.apply(-90)
            t.step_beat(act=3, risk_tolerance=1.0)
            self.assertTrue(0.0 <= t.value <= 100.0)

    def test_pity_timer_guarantees_reward(self):
        for seed in range(50):
            t = TensionEngine(random.Random(seed))
            drought = 0
            for _ in range(60):
                reward = t.step_beat(act=1, risk_tolerance=0.5)
                drought = 0 if reward else drought + 1
                self.assertLessEqual(drought, PITY_LIMIT)

    def test_spike_forces_relief_valley(self):
        t = TensionEngine(random.Random(3))
        t.apply(30)  # spike
        peak = t.value
        t.step_beat(1, 0.5)
        t.step_beat(1, 0.5)
        self.assertLess(t.value, peak)  # the valley landed
        self.assertFalse(t.relief_owed)

    def test_round_trip(self):
        t = TensionEngine(random.Random(4))
        t.apply(25)
        t.step_beat(2, 0.7)
        clone = TensionEngine(random.Random(4), t.to_dict())
        self.assertEqual(clone.to_dict(), t.to_dict())


class TestNPC(unittest.TestCase):
    def brain(self, npc_id, **state):
        return NPCBrain(content.NPC_PROFILES[npc_id], NPCState(**state))

    def test_same_act_lands_differently_on_different_minds(self):
        fragile = self.brain("wren")     # neuroticism .85
        hardened = self.brain("mara")    # neuroticism .30, agreeableness .25
        fr = fragile.react("bold", tension=50)
        hr = hardened.react("bold", tension=50)
        self.assertGreater(fr.fear_delta, hr.fear_delta)
        self.assertGreater(hr.respect_delta, 0)

    def test_trust_reveal_vs_fear_reveal(self):
        willing = self.brain("ellis", trust=54.0)
        r = None
        while r is None or r.reveal is None:
            r = willing.react("empathic", tension=20)
        self.assertFalse(willing.state.revealed_by_fear)

        broken = self.brain("wren", fear=64.0)
        r = broken.react("bold", tension=80)
        self.assertIsNotNone(r.reveal)
        self.assertTrue(broken.state.revealed_by_fear)
        self.assertEqual(broken.disposition(), "broken")

    def test_secret_reveals_once(self):
        b = self.brain("ellis", trust=90.0)
        first = b.react("empathic", tension=10)
        second = b.react("empathic", tension=10)
        self.assertIsNotNone(first.reveal)
        self.assertIsNone(second.reveal)

    def test_memory_is_bounded(self):
        b = self.brain("mara")
        for _ in range(40):
            b.react("cautious", tension=10)
        self.assertLessEqual(len(b.state.memory), 12)


class TestPersonalization(unittest.TestCase):
    def test_flow_vs_growth_ratio(self):
        rng = random.Random(7)
        p = PlayerProfile()
        for _ in range(30):
            p.record_choice("analytical", ("sight",), 50)
        planner = Personalizer(rng)
        plans = [planner.plan(p) for _ in range(600)]
        with_grain = sum(1 for pl in plans if pl.with_grain)
        self.assertAlmostEqual(with_grain / 600, 0.7, delta=0.08)
        # growth beats must test a *non*-dominant muscle
        for pl in plans:
            if not pl.with_grain:
                self.assertNotEqual(pl.challenge_style, "analytical")

    def test_lead_senses_follow_affinity(self):
        p = PlayerProfile()
        for _ in range(10):
            p.record_choice("cautious", ("smell", "touch"), 40)
        plan = Personalizer(random.Random(1)).plan(p)
        self.assertEqual(set(plan.lead_senses), {"smell", "touch"})


class TestNarrative(unittest.TestCase):
    def test_no_phrase_repeats_within_cooldown(self):
        eng = NarrativeEngine(random.Random(2))
        seen: list[str] = []
        bank = [f"phrase {i}" for i in range(PHRASE_COOLDOWN + 2)]
        for _ in range(100):
            phrase = eng._fresh(bank)
            if phrase is not None:
                window = seen[-(PHRASE_COOLDOWN - 1):]
                self.assertNotIn(phrase, window)
                seen.append(phrase)

    def test_verbosity_budget(self):
        eng = NarrativeEngine(random.Random(3))
        scene = content.SCENES["quay"]
        from engine.personalization import RenderPlan
        terse = eng.render(scene, RenderPlan(["sight", "sound"], "terse",
                                             "bold", True), "uneasy")
        lush = eng.render(scene, RenderPlan(["sight", "sound"], "lush",
                                            "bold", True), "uneasy")
        self.assertLess(len(terse), len(lush))


class TestDialogueValidation(unittest.TestCase):
    def test_shipped_content_is_structurally_clean(self):
        self.assertEqual(content.validate_all(), [])

    def test_validator_catches_broken_trees(self):
        broken = DialogueTree("t", "a", [
            Node("a", "narrator", ["hi"], [
                Choice("go", "bold", "missing"),
                Choice("locked", "weird_style", None,
                       requires_flag="never_set"),
            ]),
            Node("orphan", "narrator", ["lost"], []),
        ])
        problems = broken.validate()
        text = "\n".join(problems)
        self.assertIn("missing node", text)
        self.assertIn("illegal style", text)
        self.assertIn("unreachable", text)
        self.assertIn("dead end", text)


if __name__ == "__main__":
    unittest.main()
