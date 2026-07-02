"""Static integrity checks on the Vane's Hollow content pack."""

import unittest

from engine import pacing
from engine.content.vanes_hollow import build_pack
from engine.narrative import SENSES, SHAPE_FALLBACKS


class TestContentIntegrity(unittest.TestCase):
    def setUp(self):
        self.pack = build_pack()

    def test_beat_ids_unique(self):
        ids = [t.beat_id for t in self.pack.templates]
        self.assertEqual(len(ids), len(set(ids)))

    def test_every_shape_has_a_repeatable_fallback(self):
        """Once-only beats run dry; every shape the director can request must
        keep at least one unconditional repeatable template (or the shape's
        fallback chain must reach one) so composition never stalls."""
        repeatable_shapes = {
            t.shape for t in self.pack.templates
            if not t.once and t.condition is None
        }
        for shape in (pacing.CALM, pacing.RISING, pacing.SPIKE, pacing.REWARD):
            reachable = (shape, *SHAPE_FALLBACKS[shape])
            self.assertTrue(
                any(s in repeatable_shapes for s in reachable),
                f"shape {shape!r} can starve once once-only beats are spent")

    def test_talk_to_targets_exist(self):
        for t in self.pack.templates:
            for c in t.choices:
                if c.talk_to:
                    self.assertIn(c.talk_to, self.pack.npcs)
                    self.assertIn(c.talk_to, self.pack.dialogues)

    def test_all_shapes_are_known(self):
        for t in self.pack.templates:
            self.assertIn(t.shape, pacing.SHAPES, t.beat_id)

    def test_sensory_banks_use_known_senses(self):
        for t in self.pack.templates:
            for sense in t.sensory:
                self.assertIn(sense, SENSES, t.beat_id)

    def test_every_beat_has_choices(self):
        for t in self.pack.templates:
            self.assertTrue(t.choices, f"{t.beat_id} has no choices")
            unconditional = [c for c in t.choices if c.condition is None]
            self.assertTrue(unconditional,
                            f"{t.beat_id} could present zero available choices")

    def test_ending_ids_unique_and_timeout_reserved(self):
        ids = [e.ending_id for e in self.pack.endings]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertNotIn("timeout", ids)

    def test_npc_traits_in_range(self):
        for npc in self.pack.npcs.values():
            p = npc.profile
            for trait in (p.openness, p.conscientiousness, p.extraversion,
                          p.agreeableness, p.neuroticism,
                          p.agenda.concealment):
                self.assertTrue(0.0 <= trait <= 1.0, p.name)


if __name__ == "__main__":
    unittest.main()
