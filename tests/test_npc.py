"""NPC psychology: appraisal asymmetry, homeostasis, stances, memory."""

import unittest

from engine.content.vanes_hollow import build_npcs
from engine.npc import NPCState


def fresh(name: str = "Harrow") -> NPCState:
    return build_npcs()[name]


class TestAppraisal(unittest.TestCase):
    def test_kindness_builds_trust(self):
        npc = fresh("Merrit")
        before = npc.trust
        npc.appraise("player_confided", 0.7, 0.8, beat_index=1)
        self.assertGreater(npc.trust, before)

    def test_betrayal_costs_more_than_kindness_buys(self):
        gained = fresh("Merrit")
        gained.appraise("kind_act", 0.5, 0.6, beat_index=1)
        gain = gained.trust - 0.35

        lost = fresh("Merrit")
        lost.appraise("cruel_act", -0.5, 0.6, beat_index=1)
        loss = 0.35 - lost.trust

        self.assertGreater(loss, gain)

    def test_neurotic_amplifies_negative_events(self):
        harrow = fresh("Harrow")   # neuroticism 0.8
        cask = fresh("Cask")       # neuroticism 0.3
        harrow.appraise("slight", -0.5, 0.6, beat_index=1)
        cask.appraise("slight", -0.5, 0.6, beat_index=1)
        self.assertLess(harrow.valence, cask.valence)

    def test_agenda_probe_spikes_fear_and_arousal(self):
        npc = fresh("Harrow")
        fear, arousal = npc.fear, npc.arousal
        npc.appraise("player_asks_light", -0.1, 0.5, beat_index=1,
                     touches_agenda=True)
        self.assertGreater(npc.fear, fear)
        self.assertGreater(npc.arousal, arousal)

    def test_all_dimensions_stay_bounded(self):
        npc = fresh("Cask")
        for i in range(50):
            npc.appraise("hammering", -1.0, 1.0, beat_index=i, touches_agenda=True)
        for value in (npc.valence, npc.trust, npc.warmth, npc.fear, npc.arousal):
            self.assertTrue(-1.0 <= value <= 1.0)


class TestHomeostasis(unittest.TestCase):
    def test_emotion_decays_toward_baseline(self):
        npc = fresh("Merrit")
        npc.appraise("shock", -0.9, 1.0, beat_index=1)
        shocked = npc.valence
        for _ in range(20):
            npc.decay()
        self.assertGreater(npc.valence, shocked)
        self.assertAlmostEqual(npc.valence, npc.profile.baseline_valence, delta=0.1)

    def test_neurotics_stew_longer(self):
        harrow, merrit = fresh("Harrow"), fresh("Merrit")
        for npc in (harrow, merrit):
            npc.valence = -1.0
        harrow.decay()
        merrit.decay()
        # After one decay step Merrit has recovered more of the distance
        # to her (higher) baseline than Harrow has to his.
        merrit_progress = (merrit.valence - -1.0) / (merrit.profile.baseline_valence - -1.0)
        harrow_progress = (harrow.valence - -1.0) / (harrow.profile.baseline_valence - -1.0)
        self.assertGreater(merrit_progress, harrow_progress)

    def test_memories_fade_but_sharp_ones_persist(self):
        npc = fresh("Cask")
        npc.appraise("player_threatened", -0.8, 0.9, beat_index=1)
        npc.appraise("small_thing", -0.35, 0.9, beat_index=2)
        for _ in range(55):
            npc.decay()
        events = [m.event for m in npc.memories]
        self.assertIn("player_threatened", events)
        self.assertNotIn("small_thing", events)


class TestStancesAndMoods(unittest.TestCase):
    def test_stance_ladder(self):
        npc = fresh("Merrit")
        self.assertEqual(npc.stance(), "wary")
        for i in range(20):
            npc.appraise("kindness", 0.7, 0.7, beat_index=i)
        self.assertEqual(npc.stance(), "confessional")

    def test_sustained_hostility_turns_hostile(self):
        npc = fresh("Cask")
        for i in range(15):
            npc.appraise("player_threatened", -0.7, 0.8, beat_index=i)
        self.assertEqual(npc.stance(), "hostile")

    def test_mood_reflects_arousal_and_valence(self):
        npc = fresh("Harrow")
        npc.valence, npc.arousal = -0.5, 0.8
        self.assertEqual(npc.mood(), "threatening")
        npc.valence, npc.arousal = 0.5, 0.2
        self.assertEqual(npc.mood(), "warm")

    def test_tell_leaks_more_under_fear(self):
        calm_npc, scared_npc = fresh("Harrow"), fresh("Harrow")
        scared_npc.fear = 0.9
        # Same roll: the frightened NPC must leak at least as readily.
        threshold_roll = 0.05
        self.assertLessEqual(
            calm_npc.leaks_tell(threshold_roll),
            scared_npc.leaks_tell(threshold_roll))
        self.assertTrue(scared_npc.leaks_tell(0.02))


class TestMemoryCallbacks(unittest.TestCase):
    def test_sharpest_memory_prefers_salient_and_charged(self):
        npc = fresh("Merrit")
        npc.appraise("mild_thing", 0.35, 0.9, beat_index=1)
        npc.appraise("player_confided", 0.9, 0.9, beat_index=2)
        self.assertEqual(npc.sharpest_memory().event, "player_confided")


if __name__ == "__main__":
    unittest.main()
