"""Dialogue trees with conditions, effects, and a structural validator.

Nodes carry text *variants* (anti-staleness), gated choices, and effect
specs. `DialogueTree.validate()` is run at content-load time and in CI:
it proves every node is reachable, nothing dead-ends silently, every
`next` target exists, and every effect key is legal — the "optimize the
dialogue trees / check for bugs" pass is a permanent, automated gate.
"""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Any

LEGAL_EFFECTS = {
    "tension",        # float delta
    "flag",           # str flag name to set
    "clue",           # str clue to add
    "trust", "fear",  # float delta applied to the node's speaker
    "goto_scene",     # str scene id to jump to
    "end",            # str ending id
}

STYLES = ("bold", "cautious", "empathic", "analytical")


@dataclass
class Choice:
    text: str
    style: str
    next: str | None                     # next node id, or None = exit dialogue
    effects: dict[str, Any] = field(default_factory=dict)
    requires_flag: str | None = None     # world flag gate
    min_trust: float | None = None       # speaker trust gate
    senses: tuple[str, ...] = ()         # sensory affinity signals


@dataclass
class Node:
    id: str
    speaker: str                          # npc id or "narrator"
    variants: list[str]                   # rendered round-robin via rng
    choices: list[Choice]

    def pick_text(self, rng: random.Random) -> str:
        return rng.choice(self.variants)


class DialogueTree:
    def __init__(self, tree_id: str, entry: str, nodes: list[Node]):
        self.id = tree_id
        self.entry = entry
        self.nodes: dict[str, Node] = {n.id: n for n in nodes}

    def node(self, node_id: str) -> Node:
        return self.nodes[node_id]

    def available_choices(self, node: Node, flags: dict[str, bool],
                          speaker_trust: float) -> list[Choice]:
        out = []
        for c in node.choices:
            if c.requires_flag and not flags.get(c.requires_flag):
                continue
            if c.min_trust is not None and speaker_trust < c.min_trust:
                continue
            out.append(c)
        return out

    # -- structural validation ------------------------------------------
    def validate(self) -> list[str]:
        """Returns a list of structural problems; empty list = clean."""
        problems: list[str] = []
        if self.entry not in self.nodes:
            problems.append(f"{self.id}: entry '{self.entry}' does not exist")
            return problems

        # every next target must exist
        for node in self.nodes.values():
            if not node.variants:
                problems.append(f"{self.id}/{node.id}: no text variants")
            if not node.choices:
                problems.append(f"{self.id}/{node.id}: dead end (no choices)")
            for c in node.choices:
                if c.next is not None and c.next not in self.nodes:
                    problems.append(
                        f"{self.id}/{node.id}: choice '{c.text[:30]}' "
                        f"targets missing node '{c.next}'")
                if c.style not in STYLES:
                    problems.append(
                        f"{self.id}/{node.id}: illegal style '{c.style}'")
                for key in c.effects:
                    if key not in LEGAL_EFFECTS:
                        problems.append(
                            f"{self.id}/{node.id}: illegal effect '{key}'")
                # a gated choice must never be a node's only way forward
            ungated = [c for c in node.choices
                       if c.requires_flag is None and c.min_trust is None]
            if node.choices and not ungated:
                problems.append(
                    f"{self.id}/{node.id}: all choices gated — soft-lock risk")

        # reachability from entry
        seen: set[str] = set()
        stack = [self.entry]
        while stack:
            nid = stack.pop()
            if nid in seen:
                continue
            seen.add(nid)
            stack.extend(c.next for c in self.nodes[nid].choices
                         if c.next is not None and c.next in self.nodes)
        for nid in self.nodes:
            if nid not in seen:
                problems.append(f"{self.id}/{nid}: unreachable node")
        return problems
