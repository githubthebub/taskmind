#!/usr/bin/env python3
"""Play THE LIGHT AT VANE'S HOLLOW in the terminal.

Usage:
    python3 play.py [--seed N]

The frontend is deliberately thin: it renders what the engine composes,
collects numbered choices, and runs dialogue trees when a beat choice opens
one. All story logic lives behind the Game interface.
"""

from __future__ import annotations

import argparse
import os
import sys
import textwrap

from engine.content.vanes_hollow import build_pack
from engine.dialogue import DialogueRunner, render_line
from engine.engine import Game

WIDTH = 76


def wrap(text: str) -> str:
    out = []
    for paragraph in text.split("\n\n"):
        lines = paragraph.split("\n")
        out.append("\n".join(textwrap.fill(l, WIDTH) if l else "" for l in lines))
    return "\n\n".join(out)


def rule(char: str = "─") -> str:
    return char * WIDTH


def ask_choice(n: int) -> int:
    while True:
        raw = input(f"\n> ").strip()
        if raw.isdigit() and 1 <= int(raw) <= n:
            return int(raw) - 1
        if raw.lower() in ("q", "quit"):
            print("\n(The island will keep. Your progress won't — this is a single sitting.)")
            sys.exit(0)
        print(f"  (choose 1–{n}, or q to quit)")


def run_dialogue(game: Game, npc_name: str) -> None:
    npc = game.npc(npc_name)
    tree = game.pack.dialogues[npc_name]
    runner = DialogueRunner(tree)
    print(f"\n{rule('·')}")
    while not runner.finished:
        node = runner.node()
        print("\n" + wrap(render_line(node, npc)))
        replies = runner.open_replies(game.state, npc)
        if not replies:
            break
        for i, reply in enumerate(replies, 1):
            print(f"  {i}. {reply.text}")
        pick = ask_choice(len(replies))
        runner.choose(replies[pick], game.state, npc)
    print(f"\n{rule('·')}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=None,
                        help="seed for a reproducible run")
    args = parser.parse_args()

    seed = args.seed if args.seed is not None else int.from_bytes(os.urandom(4), "big")
    pack = build_pack()
    game = Game(pack, seed=seed)

    print(rule("═"))
    print(pack.title.center(WIDTH))
    print(f"(seed {seed})".center(WIDTH))
    print(rule("═"))
    print("\n" + wrap(pack.intro))

    while not game.finished:
        beat = game.next_beat()
        chapter = game.state.pacing.chapter
        print(f"\n{rule()}\n  Chapter {chapter} · {game.state.world.location or 'Vane’s Hollow'}\n{rule()}")
        print("\n" + wrap(beat.prose))
        for i, choice in enumerate(beat.choices, 1):
            print(f"  {i}. {choice.text}")
        pick = ask_choice(len(beat.choices))
        chosen = beat.choices[pick]
        if chosen.talk_to:
            run_dialogue(game, chosen.talk_to)
        game.choose(pick)

    print(f"\n{rule('═')}\n")
    print(wrap(game.epilogue()))
    print(f"\n{rule('═')}")
    clues = game.state.world.clues
    print(f"\nClues gathered: {len(clues)} — {', '.join(clues) if clues else 'none'}")
    print(f"Beats lived: {game.state.pacing.beat_index} · Ending: {game.state.ending}")


if __name__ == "__main__":
    main()
