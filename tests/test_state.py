"""State invariants: determinism and lossless serialization."""

import unittest

from engine.state import GameState


class TestDeterminism(unittest.TestCase):
    def test_same_seed_same_rolls(self):
        a, b = GameState(seed=42), GameState(seed=42)
        self.assertEqual([a.roll() for _ in range(50)],
                         [b.roll() for _ in range(50)])

    def test_different_seed_different_rolls(self):
        a, b = GameState(seed=1), GameState(seed=2)
        self.assertNotEqual([a.roll() for _ in range(10)],
                            [b.roll() for _ in range(10)])


class TestSerialization(unittest.TestCase):
    def _populated_state(self) -> GameState:
        from engine.content.vanes_hollow import build_npcs

        gs = GameState(seed=7)
        gs.npcs = build_npcs()
        for _ in range(13):
            gs.roll()
        gs.world.set_flag("baited_cask")
        gs.world.add_clue("second_lantern")
        gs.world.advance_clock("storm", 0.4)
        gs.world.location = "the quay"
        gs.player.appetite["mystery"] = 0.83
        gs.pacing.tension = 0.61
        gs.pacing.recent_shapes = ["calm", "rising"]
        gs.npcs["Harrow"].appraise("player_showed_evidence", -0.4, 0.8, 3,
                                   touches_agenda=True)
        gs.transcript.append({"beat": "quay_dusk", "choice": 1})
        return gs

    def test_round_trip_preserves_everything(self):
        gs = self._populated_state()
        restored = GameState.from_json(gs.to_json())
        self.assertEqual(gs.to_dict(), restored.to_dict())

    def test_rng_stream_continues_after_restore(self):
        gs = self._populated_state()
        restored = GameState.from_json(gs.to_json())
        self.assertEqual([gs.roll() for _ in range(20)],
                         [restored.roll() for _ in range(20)])

    def test_npc_psychology_survives_round_trip(self):
        gs = self._populated_state()
        restored = GameState.from_json(gs.to_json())
        original, back = gs.npcs["Harrow"], restored.npcs["Harrow"]
        self.assertEqual(original.stance(), back.stance())
        self.assertEqual(original.mood(), back.mood())
        self.assertEqual(len(original.memories), len(back.memories))
        self.assertEqual(original.profile.agenda, back.profile.agenda)


if __name__ == "__main__":
    unittest.main()
