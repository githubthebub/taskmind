#!/usr/bin/env python3
"""GREYFALL — a psychological mystery in the fog. Terminal client."""
from __future__ import annotations

import os
import sys
import textwrap

from engine.game import Game
from engine.state import GameState

SAVE_PATH = os.environ.get("GREYFALL_SAVE", "greyfall.save.json")
WIDTH = 76


def wrap(text: str) -> str:
    return "\n".join(
        textwrap.fill(line, WIDTH) if line.strip() else line
        for line in text.splitlines()
    )


def main() -> int:
    if os.path.exists(SAVE_PATH):
        game = Game.from_state(GameState.load(SAVE_PATH))
        print("— resuming your investigation —\n")
    else:
        seed = int(sys.argv[1]) if len(sys.argv) > 1 else 1
        game = Game.new(seed)
        print(wrap("G R E Y F A L L\n"))

    while not game.over:
        v = game.view()
        for event in v.events:
            print(wrap(event) + "\n")
        print(f"· {v.location} ·")
        print(wrap(v.text) + "\n")
        print(wrap(v.speaker_line) + "\n")
        for i, choice in enumerate(v.choices, 1):
            print(wrap(f"  {i}. {choice}"))
        if v.session_break:
            print(wrap("\n  (This is a natural place to stop — 'q' saves "
                       "and the story will remember exactly where the "
                       "dread left off.)"))
        raw = input("\n> ").strip().lower()
        print()
        if raw in ("q", "quit", "exit"):
            game.state.save(SAVE_PATH)
            print("Saved. Greyfall will keep.")
            return 0
        try:
            index = int(raw) - 1
            if not 0 <= index < len(v.choices):
                raise ValueError
        except ValueError:
            print("(choose a listed number, or 'q' to save and stop)\n")
            continue
        game.choose(index)

    final = game.view()
    for event in final.events:
        print(wrap(event) + "\n")
    print(wrap(final.ending_text or ""))
    if os.path.exists(SAVE_PATH):
        os.remove(SAVE_PATH)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyboardInterrupt, EOFError):
        print("\n(Greyfall will keep.)")
        sys.exit(0)
