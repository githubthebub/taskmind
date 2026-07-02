"""Pacing director: curve shape, reward fairness, cliffhanger discipline."""

import unittest

from engine import pacing
from engine.state import GameState, PacingState


class TestTensionCurve(unittest.TestCase):
    def test_peaks_escalate_across_chapters(self):
        p = PacingState()
        peaks = []
        for chapter in (1, 3, 5):
            p.chapter = chapter
            p.beats_in_chapter = pacing.CHAPTER_LENGTH - 1
            peaks.append(pacing.target_tension(p))
        self.assertEqual(peaks, sorted(peaks))
        self.assertLessEqual(peaks[-1], 0.95)

    def test_curve_rises_within_a_chapter(self):
        p = PacingState(chapter=2)
        p.beats_in_chapter = 0
        start = pacing.target_tension(p)
        p.beats_in_chapter = pacing.CHAPTER_LENGTH - 1
        end = pacing.target_tension(p)
        self.assertGreater(end, start)


class TestRewardFairness(unittest.TestCase):
    def test_drought_never_exceeds_guarantee(self):
        """Whatever the RNG does, the director must request REWARD before the
        gap exceeds REWARD_MAX_GAP."""
        for seed in range(30):
            state = GameState(seed=seed)
            gap = 0
            for _ in range(120):
                shape = pacing.request_shape(state)
                if shape == pacing.REWARD:
                    gap = 0
                else:
                    gap += 1
                self.assertLessEqual(gap, pacing.REWARD_MAX_GAP,
                                     f"reward drought at seed {seed}")
                pacing.record_beat(state, shape)

    def test_rewards_are_not_metronomic(self):
        """Variable schedule: gaps between rewards should show variance."""
        state = GameState(seed=11)
        gaps, gap = [], 0
        for _ in range(200):
            shape = pacing.request_shape(state)
            if shape == pacing.REWARD:
                gaps.append(gap)
                gap = 0
            else:
                gap += 1
            pacing.record_beat(state, shape)
        self.assertGreater(len(set(gaps)), 2, "reward schedule is metronomic")


class TestCliffhangerDiscipline(unittest.TestCase):
    def test_no_consecutive_chapter_cliffhangers(self):
        state = GameState(seed=3)
        state.pacing.tension = 0.9  # keep tension eligible throughout
        chapter_endings = []
        for _ in range(200):
            shape = pacing.request_shape(state)
            before = state.pacing.chapter
            pacing.record_beat(state, shape, tension_delta=0.2)
            state.pacing.tension = max(state.pacing.tension, 0.8)
            if state.pacing.chapter != before:
                chapter_endings.append(shape)
        for a, b in zip(chapter_endings, chapter_endings[1:]):
            self.assertFalse(a == b == pacing.CLIFFHANGER,
                             "two consecutive chapters ended on cliffhangers")
        self.assertIn(pacing.CLIFFHANGER, chapter_endings,
                      "cliffhangers never fire at all")

    def test_low_tension_chapter_never_cliffhangs(self):
        state = GameState(seed=5)
        state.pacing.tension = 0.1
        state.pacing.beats_in_chapter = pacing.CHAPTER_LENGTH - 1
        state.pacing.beats_since_reward = 0
        state.pacing.next_reward_gap = 6
        self.assertNotEqual(pacing.request_shape(state), pacing.CLIFFHANGER)


class TestMonotony(unittest.TestCase):
    def test_never_three_identical_shapes(self):
        for seed in range(20):
            state = GameState(seed=seed)
            shapes = []
            for _ in range(100):
                shape = pacing.request_shape(state)
                shapes.append(shape)
                pacing.record_beat(state, shape)
            for i in range(len(shapes) - 2):
                self.assertFalse(
                    shapes[i] == shapes[i + 1] == shapes[i + 2] != pacing.REWARD,
                    f"seed {seed}: three consecutive {shapes[i]!r} at beat {i}")

    def test_tension_always_bounded(self):
        state = GameState(seed=9)
        for _ in range(300):
            shape = pacing.request_shape(state)
            pacing.record_beat(state, shape, tension_delta=0.3)
            self.assertTrue(0.0 <= state.pacing.tension <= 1.0)


if __name__ == "__main__":
    unittest.main()
