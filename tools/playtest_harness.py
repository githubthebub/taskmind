#!/usr/bin/env python3
"""Balance telemetry: run simulated playthroughs and print the distributions
a designer needs to eyeball after any tuning change.

Usage:
    python3 tools/playtest_harness.py [--runs 200]

Regressions in these distributions are treated as bugs even when the unit
tests pass — e.g. an ending that stops appearing, reward gaps bunching at the
fairness cap (means the scheduler starves and the guarantee is doing all the
work), or persona profiles converging (means personalization went decorative).
"""

from __future__ import annotations

import argparse
import random
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine.content.vanes_hollow import build_pack
from engine.simulate import PERSONAS, persona_policy, simulate


def bar(count: int, total: int, width: int = 40) -> str:
    filled = round(width * count / total) if total else 0
    return "█" * filled + "·" * (width - filled)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=200)
    args = parser.parse_args()

    print(f"Simulating {args.runs} random playthroughs...")
    runs = [simulate(build_pack, seed) for seed in range(args.runs)]

    print("\n── ENDING DISTRIBUTION " + "─" * 40)
    endings = Counter(r.ending for r in runs)
    for ending, count in endings.most_common():
        print(f"  {ending:16} {count:4}  {bar(count, args.runs)}")

    print("\n── RUN LENGTH (beats) " + "─" * 41)
    lengths = sorted(r.beats for r in runs)
    mean = sum(lengths) / len(lengths)
    print(f"  min {lengths[0]}  median {lengths[len(lengths)//2]}  "
          f"mean {mean:.1f}  max {lengths[-1]}")

    print("\n── REWARD GAP HISTOGRAM " + "─" * 39)
    gaps = Counter(g for r in runs for g in r.reward_gaps)
    total_gaps = sum(gaps.values())
    for gap in sorted(gaps):
        print(f"  {gap:2} beats {gaps[gap]:5}  {bar(gaps[gap], total_gaps)}")

    print("\n── BEAT SHAPE MIX " + "─" * 45)
    shapes = Counter(s for r in runs for s in r.shapes)
    total_shapes = sum(shapes.values())
    for shape, count in shapes.most_common():
        print(f"  {shape:12} {count:5}  {100*count/total_shapes:5.1f}%")

    print("\n── TENSION ENVELOPE (mean by beat index) " + "─" * 22)
    by_index: dict[int, list[float]] = {}
    for r in runs:
        for i, t in enumerate(r.tensions):
            by_index.setdefault(i, []).append(t)
    for i in range(0, max(by_index) + 1, 5):
        if i in by_index:
            m = sum(by_index[i]) / len(by_index[i])
            print(f"  beat {i:3}  {m:4.2f}  {bar(round(m*100), 100)}")

    print("\n── NPC STANCE FLIPS PER RUN " + "─" * 35)
    flips = sorted(r.stance_flips for r in runs)
    print(f"  min {flips[0]}  median {flips[len(flips)//2]}  max {flips[-1]}")

    print("\n── PERSONA DIVERGENCE (mean final profile) " + "─" * 20)
    print(f"  {'persona':10} {'action':>7} {'mystery':>8} {'intimacy':>9} "
          f"{'dread':>6} {'detail':>7} {'risk':>6}  endings")
    for name, prefs in PERSONAS.items():
        persona_runs = [
            simulate(build_pack, seed, persona_policy(prefs, random.Random(seed)))
            for seed in range(30)
        ]
        n = len(persona_runs)
        def m(key, sub=None):
            if sub:
                return sum(r.final_profile[sub][key] for r in persona_runs) / n
            return sum(r.final_profile[key] for r in persona_runs) / n
        persona_endings = Counter(r.ending for r in persona_runs)
        ending_str = ", ".join(f"{e}:{c}" for e, c in persona_endings.most_common(3))
        print(f"  {name:10} {m('action', 'appetite'):7.2f} "
              f"{m('mystery', 'appetite'):8.2f} {m('intimacy', 'appetite'):9.2f} "
              f"{m('dread', 'appetite'):6.2f} {m('detail_tolerance'):7.2f} "
              f"{m('risk_posture'):6.2f}  {ending_str}")

    print("\nDone. Compare against the last committed run before shipping tuning changes.")


if __name__ == "__main__":
    main()
