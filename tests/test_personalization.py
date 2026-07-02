"""Personalization model: convergence, stability, and floor guarantees."""

import unittest

from engine import personalization
from engine.state import PlayerProfile


class TestSignalFolding(unittest.TestCase):
    def test_repeated_signal_converges_toward_target(self):
        p = PlayerProfile()
        for _ in range(40):
            personalization.apply_choice_signals(p, {"mystery": 1.0})
        self.assertGreater(p.appetite["mystery"], 0.9)

    def test_single_choice_cannot_whipsaw(self):
        p = PlayerProfile()
        before = p.appetite["action"]
        personalization.apply_choice_signals(p, {"action": 1.0})
        self.assertLess(abs(p.appetite["action"] - before), 0.15)

    def test_appetite_stays_bounded(self):
        p = PlayerProfile()
        for _ in range(200):
            personalization.apply_choice_signals(p, {"dread": 1.0, "detail": -1.0})
        self.assertLessEqual(p.appetite["dread"], 1.0)
        self.assertGreaterEqual(p.detail_tolerance, 0.0)

    def test_unknown_signals_ignored(self):
        p = PlayerProfile()
        personalization.apply_choice_signals(p, {"nonsense_axis": 1.0})
        self.assertEqual(p.appetite, PlayerProfile().appetite)

    def test_risk_posture_tracks_both_directions(self):
        p = PlayerProfile()
        for _ in range(30):
            personalization.apply_choice_signals(p, {"risk": 1.0})
        self.assertGreater(p.risk_posture, 0.7)
        for _ in range(60):
            personalization.apply_choice_signals(p, {"risk": -1.0})
        self.assertLess(p.risk_posture, -0.5)


class TestBeatAffinity(unittest.TestCase):
    def test_affinity_never_starves_a_beat(self):
        p = PlayerProfile()
        p.appetite = {axis: 0.0 for axis in p.appetite}
        self.assertGreaterEqual(
            personalization.beat_affinity(p, {"action": 1.0}), 0.1)

    def test_matching_appetite_weighs_heavier(self):
        p = PlayerProfile()
        p.appetite["mystery"] = 0.95
        p.appetite["action"] = 0.05
        self.assertGreater(
            personalization.beat_affinity(p, {"mystery": 1.0}),
            personalization.beat_affinity(p, {"action": 1.0}))

    def test_untagged_beat_is_neutral(self):
        self.assertEqual(personalization.beat_affinity(PlayerProfile(), {}), 1.0)


class TestSensoryBudget(unittest.TestCase):
    def test_budget_scales_with_tolerance(self):
        p = PlayerProfile()
        p.detail_tolerance = 0.1
        low = personalization.sensory_budget(p)
        p.detail_tolerance = 0.9
        high = personalization.sensory_budget(p)
        self.assertEqual((low, high), (1, 3))


if __name__ == "__main__":
    unittest.main()
