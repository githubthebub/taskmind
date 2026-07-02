"""End-to-end protocols: Monte-Carlo playthroughs, persona divergence,
sensory anti-repetition, and save/resume."""

import unittest

from engine import pacing, personalization
from engine.content.vanes_hollow import build_pack
from engine.engine import Game
from engine.simulate import PERSONAS, persona_policy, simulate
import random

RUNS = 120


class TestMonteCarlo(unittest.TestCase):
    """Hundreds of random players; structural guarantees must hold for all."""

    @classmethod
    def setUpClass(cls):
        cls.runs = [simulate(build_pack, seed) for seed in range(RUNS)]

    def test_every_run_terminates_with_an_ending(self):
        for run in self.runs:
            self.assertTrue(run.ending, f"seed {run.seed} never ended")
            self.assertLessEqual(run.beats, build_pack().max_beats)

    def test_tension_always_bounded(self):
        for run in self.runs:
            self.assertTrue(all(0.0 <= t <= 1.0 for t in run.tensions),
                            f"seed {run.seed}")

    def test_reward_droughts_respect_fairness_window(self):
        # +1: a cliffhanger-capped chapter may not itself be a reward beat.
        for run in self.runs:
            for gap in run.reward_gaps:
                self.assertLessEqual(gap, pacing.REWARD_MAX_GAP + 1,
                                     f"seed {run.seed} starved {gap} beats")

    def test_corpus_reaches_multiple_endings(self):
        endings = {run.ending for run in self.runs}
        self.assertGreaterEqual(
            len(endings), 2,
            f"random players all funnel into one ending: {endings}")

    def test_tension_actually_escalates_over_a_run(self):
        """Averaged over the corpus, late-game tension must exceed early-game:
        the sawtooth may dip locally but the envelope rises."""
        early, late = [], []
        for run in self.runs:
            if len(run.tensions) >= 12:
                early.extend(run.tensions[:6])
                late.extend(run.tensions[-6:])
        self.assertGreater(sum(late) / len(late), sum(early) / len(early))

    def test_npcs_actually_move(self):
        """Across the corpus, relationships must not be static scenery."""
        total_flips = sum(run.stance_flips for run in self.runs)
        self.assertGreater(total_flips / len(self.runs), 0.5)


class TestPersonaDivergence(unittest.TestCase):
    """The personalization loop must produce measurably different experiences
    for different player types — otherwise it's decorative."""

    @classmethod
    def setUpClass(cls):
        cls.by_persona = {}
        for name, prefs in PERSONAS.items():
            cls.by_persona[name] = [
                simulate(build_pack, seed,
                         persona_policy(prefs, random.Random(seed)))
                for seed in range(25)
            ]

    def _mean_appetite(self, persona: str, axis: str) -> float:
        runs = self.by_persona[persona]
        return sum(r.final_profile["appetite"][axis] for r in runs) / len(runs)

    def _mean_detail(self, persona: str) -> float:
        runs = self.by_persona[persona]
        return sum(r.final_profile["detail_tolerance"] for r in runs) / len(runs)

    def test_profiles_diverge_by_persona(self):
        # Compare each persona's dominant axis against the persona least
        # drawn to it — bold choices in the content often pair action with
        # mystery, so e.g. rusher-vs-sleuth on mystery would be correlated,
        # not discriminating.
        self.assertGreater(self._mean_appetite("rusher", "action"),
                           self._mean_appetite("paranoid", "action"))
        self.assertGreater(self._mean_appetite("empath", "intimacy"),
                           self._mean_appetite("sleuth", "intimacy"))
        self.assertGreater(self._mean_appetite("sleuth", "mystery"),
                           self._mean_appetite("paranoid", "mystery"))

    def test_detail_tolerance_diverges(self):
        self.assertLess(self._mean_detail("rusher"), self._mean_detail("empath"))

    def test_risk_posture_diverges(self):
        rusher = self.by_persona["rusher"]
        paranoid = self.by_persona["paranoid"]
        mean = lambda runs: sum(r.final_profile["risk_posture"] for r in runs) / len(runs)
        self.assertGreater(mean(rusher), mean(paranoid))


class TestGoldenPath(unittest.TestCase):
    """The best ending must stay reachable by a player who plays for it.

    A 'devoted' persona (relationship-building + clue-hunting) must reach
    'reunion' — Ida found AND Harrow's confession secured before departure —
    on a meaningful fraction of seeds. If a tuning change breaks this, the
    game's emotional summit has silently fallen off the map.
    """

    def test_reunion_is_reachable(self):
        devoted = {"mystery": 1.0, "intimacy": 1.0, "lore": 0.3, "detail": 0.2}
        endings = {
            simulate(build_pack, seed,
                     persona_policy(devoted, random.Random(seed))).ending
            for seed in range(15)
        }
        self.assertIn("reunion", endings)

    def test_hostile_path_reaches_the_truth_costs(self):
        """Aggression must also lead somewhere real, not to a dead zone."""
        bully = {"action": 1.0, "risk": 1.0, "mystery": 0.6, "detail": -0.5}
        endings = {
            simulate(build_pack, seed,
                     persona_policy(bully, random.Random(seed))).ending
            for seed in range(25)
        }
        self.assertTrue(endings & {"the_truth_costs", "reunion", "found_her"},
                        f"aggressive play only ever produced {endings}")


class TestSensoryAntiRepetition(unittest.TestCase):
    def test_no_fragment_repeats_within_window(self):
        """Compose many beats; a sensory fragment must never appear in two
        beats while still inside the anti-repeat window."""
        from engine.narrative import ANTI_REPEAT_WINDOW

        pack = build_pack()
        game = Game(pack, seed=99)
        all_fragments = {
            frag
            for t in pack.templates
            for bank in t.sensory.values()
            for frag in bank
        }
        recent: list[str] = []
        for _ in range(40):
            if game.finished:
                break
            beat = game.next_beat()
            used_here = [f for f in all_fragments if f in beat.prose]
            for frag in used_here:
                self.assertNotIn(frag, recent,
                                 f"fragment reused inside window: {frag!r}")
            recent.extend(used_here)
            # Track a slightly smaller window than the engine's: fragments
            # within one beat land in the buffer in unspecified order, so a
            # 3-fragment margin avoids false failures at the boundary.
            del recent[:-(ANTI_REPEAT_WINDOW - 3)]
            game.choose(0)


class TestSaveResume(unittest.TestCase):
    def test_resume_preserves_once_beats_and_rng(self):
        pack = build_pack()
        game = Game(pack, seed=1234)
        for _ in range(10):
            if game.finished:
                break
            game.next_beat()
            game.choose(0)
        snapshot = game.to_save()
        spent_once = {
            b for b in game.narrative.used_beats
            if any(t.beat_id == b and t.once for t in pack.templates)
        }

        resumed = Game.from_save(build_pack(), snapshot)
        self.assertEqual(resumed.state.pacing.beat_index,
                         game.state.pacing.beat_index)
        # Once-only beats must stay spent across the resume.
        for _ in range(25):
            if resumed.finished:
                break
            beat = resumed.next_beat()
            self.assertNotIn(beat.template.beat_id, spent_once)
            resumed.choose(0)

    def test_resumed_run_matches_uninterrupted_run(self):
        """(seed, choice-sequence) is the whole identity of a run: playing 20
        beats straight equals playing 10, saving, resuming, playing 10 more."""
        def drive(game: Game, n: int) -> list[str]:
            seen = []
            for _ in range(n):
                if game.finished:
                    break
                beat = game.next_beat()
                seen.append(beat.template.beat_id)
                game.choose(0)
            return seen

        straight = Game(build_pack(), seed=777)
        full = drive(straight, 20)

        split = Game(build_pack(), seed=777)
        first = drive(split, 10)
        resumed = Game.from_save(build_pack(), split.to_save())
        second = drive(resumed, 10)

        self.assertEqual(full, first + second)


if __name__ == "__main__":
    unittest.main()
