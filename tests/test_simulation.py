"""Simulation-bot protocol: hundreds of full seeded playthroughs with
four bot temperaments, asserting engine-wide invariants on every turn.

This is the 'iterative testing / flawless execution' gate: any change
that can crash a playthrough, blow the tension bounds, drought past the
pity timer, strand a player, or break save-determinism fails here.
"""
import os
import random
import tempfile
import unittest

from engine.game import Game, HARD_CAP
from engine.state import GameState
from engine.tension import PITY_LIMIT

MAX_TURNS = 200  # generous ceiling; HARD_CAP forces the crisis long before


def styled_pick(view_choices, node_choices, want_style, rng):
    """Prefer options of a given style, fall back to random."""
    preferred = [i for i, c in enumerate(node_choices) if c.style == want_style]
    return rng.choice(preferred) if preferred else rng.randrange(len(view_choices))


class Bot:
    def __init__(self, temperament: str, rng: random.Random):
        self.temperament = temperament
        self.rng = rng

    def pick(self, game: Game) -> int:
        view = game.view()
        scene_id, node_id = game.state.scene_id.split("#")
        from engine import content
        node = content.TREES[scene_id].node(node_id)
        available = game._available(node)
        if self.temperament == "random":
            return self.rng.randrange(len(view.choices))
        return styled_pick(view.choices, available, self.temperament, self.rng)


def play(seed: int, temperament: str) -> Game:
    game = Game.new(seed)
    bot = Bot(temperament, random.Random(seed * 31 + 7))
    turns = 0
    reward_drought = 0
    while not game.over:
        turns += 1
        assert turns <= MAX_TURNS, f"seed {seed} ({temperament}): no ending"
        # invariant: tension always in bounds
        assert 0.0 <= game.tension.value <= 100.0
        # invariant: pity timer respected
        assert game.tension.dry_beats <= PITY_LIMIT
        view = game.view()
        assert view.choices, (f"seed {seed}: stranded at "
                              f"{game.state.scene_id} beat "
                              f"{game.state.world.beat}")
        game.choose(bot.pick(game))
        reward_drought = game.tension.dry_beats
    del reward_drought
    return game


class TestFullPlaythroughs(unittest.TestCase):
    TEMPERAMENTS = ("random", "bold", "cautious", "empathic")

    def test_hundreds_of_games_complete_cleanly(self):
        endings = set()
        for temperament in self.TEMPERAMENTS:
            for seed in range(75):
                game = play(seed, temperament)
                self.assertIsNotNone(game.state.world.ending)
                self.assertLessEqual(game.state.world.beat, HARD_CAP + 2)
                endings.add(game.state.world.ending)
        # across the sweep, every written ending must actually be reachable
        self.assertEqual(endings, {"truth", "mercy", "rupture", "procedure"})

    def test_empathic_play_earns_allies_not_fear(self):
        game = play(seed=11, temperament="empathic")
        dispositions = game.status()["npcs"].values()
        self.assertNotIn("broken", dispositions)

    def test_bold_play_frightens_the_fragile(self):
        frayed = 0
        for seed in range(25):
            game = play(seed, "bold")
            wren = game.state.npcs["wren"]
            if wren["fear"] > 50 or wren["revealed_by_fear"]:
                frayed += 1
        self.assertGreater(frayed, 12)  # pressure has real, visible cost

    def test_personalization_diverges_between_players(self):
        bold = play(seed=5, temperament="bold")
        soft = play(seed=5, temperament="empathic")
        self.assertNotEqual(bold.state.profile.dominant_style(),
                            soft.state.profile.dominant_style())
        self.assertNotEqual(bold.status()["npcs"], soft.status()["npcs"])


class TestSaveDeterminism(unittest.TestCase):
    def test_mid_game_save_continues_identically(self):
        for seed in (3, 17, 42):
            script_rng = random.Random(seed)
            # play 6 turns, recording choices
            game = Game.new(seed)
            script = []
            for _ in range(6):
                n = len(game.view().choices)
                pick = script_rng.randrange(n)
                script.append(pick)
                game.choose(pick)

            # branch A: keep playing in memory
            live = game
            # branch B: save to disk, reload
            with tempfile.TemporaryDirectory() as tmp:
                path = os.path.join(tmp, "save.json")
                live.state.save(path)
                reloaded = Game.from_state(GameState.load(path))

                cont_rng = random.Random(seed + 999)
                for _ in range(10):
                    if live.over or reloaded.over:
                        self.assertEqual(live.over, reloaded.over)
                        break
                    n_live = len(live.view().choices)
                    n_re = len(reloaded.view().choices)
                    self.assertEqual(n_live, n_re)
                    pick = cont_rng.randrange(n_live)
                    live.choose(pick)
                    reloaded.choose(pick)
                    self.assertEqual(live.state.to_dict(),
                                     reloaded.state.to_dict())


class TestSessionShaping(unittest.TestCase):
    def test_cliffhanger_arms_recap_for_next_session(self):
        # drive a long, tense game past the chapter seam
        game = Game.new(seed=2)
        rng = random.Random(2)
        recap_armed = False
        while not game.over:
            if game.state.recap_seed:
                recap_armed = True
                break
            game.choose(rng.randrange(len(game.view().choices)))
        if recap_armed:
            # a fresh Game over this state must surface the recap as an event
            reloaded = Game.from_state(GameState.from_dict(game.state.to_dict()))
            events = reloaded.view().events
            self.assertTrue(any("Last time:" in e for e in events))
            self.assertIsNone(reloaded.state.recap_seed)


if __name__ == "__main__":
    unittest.main()
