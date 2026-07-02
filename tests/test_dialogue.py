"""Dialogue trees: structural validity, variant selection, memory callbacks."""

import unittest

from engine import dialogue as dialogue_mod
from engine.content.vanes_hollow import EVENT_PHRASES, build_dialogues, build_npcs
from engine.dialogue import DialogueRunner, Node, Reply, render_line, validate_tree
from engine.state import GameState

# Normally installed by Game.__init__; these tests bypass Game.
dialogue_mod.EVENT_PHRASES.update(EVENT_PHRASES)


class TestTreeValidity(unittest.TestCase):
    def test_all_story_trees_are_well_formed(self):
        for npc_name, tree in build_dialogues().items():
            problems = validate_tree(tree)
            self.assertEqual(problems, [], f"{npc_name}: {problems}")

    def test_validator_catches_broken_trees(self):
        broken = {
            "start": Node(variants={"default": "hi"},
                          replies=[Reply("go", "nowhere")]),
            "orphan": Node(variants={}, replies=[]),
        }
        problems = validate_tree(broken)
        self.assertTrue(any("missing node" in p for p in problems))
        self.assertTrue(any("no default variant" in p for p in problems))
        self.assertTrue(any("unreachable" in p for p in problems))


class TestVariantSelection(unittest.TestCase):
    def test_mood_variant_beats_default(self):
        npcs = build_npcs()
        harrow = npcs["Harrow"]
        tree = build_dialogues()["Harrow"]
        harrow.valence, harrow.arousal = -0.5, 0.9  # -> "threatening"
        line = tree["start"].line_for(harrow)
        self.assertIn("mind the stairs", line)

    def test_stance_variant_used_when_no_mood_variant(self):
        npcs = build_npcs()
        harrow = npcs["Harrow"]
        tree = build_dialogues()["Harrow"]
        harrow.trust, harrow.fear = 0.05, 0.2      # -> stance "hostile"
        harrow.valence, harrow.arousal = 0.0, 0.3  # mood "guarded" (no variant)
        line = tree["start"].line_for(harrow)
        self.assertIn("done talking", line)


class TestMemoryCallback(unittest.TestCase):
    def test_grievance_surfaces_in_dialogue(self):
        npcs = build_npcs()
        cask = npcs["Cask"]
        cask.appraise("player_threatened", -0.8, 0.9, beat_index=2)
        tree = build_dialogues()["Cask"]
        line = render_line(tree["start"], cask)
        self.assertIn("threat on the table", line)

    def test_no_callback_without_salient_memory(self):
        npcs = build_npcs()
        merrit = npcs["Merrit"]
        tree = build_dialogues()["Merrit"]
        line = render_line(tree["start"], merrit)
        self.assertNotIn("I remember", line)


class TestConditionGating(unittest.TestCase):
    def test_trust_gate_locks_and_unlocks(self):
        state = GameState(seed=1)
        state.npcs = build_npcs()
        merrit = state.npcs["Merrit"]
        tree = build_dialogues()["Merrit"]
        runner = DialogueRunner(tree, start="whose_side")

        gated = [r for r in runner.node().replies if r.condition is not None][0]
        self.assertFalse(gated.available(state, merrit))
        merrit.trust = 0.7
        self.assertTrue(gated.available(state, merrit))

    def test_runner_walks_to_terminal(self):
        state = GameState(seed=2)
        state.npcs = build_npcs()
        harrow = state.npcs["Harrow"]
        runner = DialogueRunner(build_dialogues()["Harrow"])
        steps = 0
        while not runner.finished and steps < 30:
            replies = runner.open_replies(state, harrow)
            self.assertTrue(replies, f"stranded at node {runner.current!r}")
            # Always take the last reply; content convention keeps an exit
            # (or a short path to one) late in each reply list.
            runner.choose(replies[-1], state, harrow)
            steps += 1
        self.assertTrue(runner.finished)


if __name__ == "__main__":
    unittest.main()
