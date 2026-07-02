"""Condition-gated dialogue trees with psychology-driven line variants.

A tree is a dict of nodes. Each node holds *variants* of its line keyed by
NPC mood and/or stance, so the same structural conversation plays completely
differently against a warm ally versus a cornered liar. Edges (replies) carry
predicates over the full game state — trust gates, flags, clues held — plus
signals for the personalization model and effects for the world/NPC.

Memory callbacks: a node can set ``recall_memory`` and its line will be
prefixed with the NPC's sharpest memory of the player, rendered through
``MEMORY_LINES`` — the "you lied to me on the pier, I remember" moment.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

from engine.npc import NPCState
from engine.state import GameState

Predicate = Callable[[GameState, NPCState], bool]
Effect = Callable[[GameState, NPCState], None]


@dataclass
class Reply:
    text: str
    next_node: str | None            # None ends the conversation
    condition: Predicate | None = None
    signals: dict[str, float] = field(default_factory=dict)
    effect: Effect | None = None

    def available(self, state: GameState, npc: NPCState) -> bool:
        return self.condition is None or self.condition(state, npc)


@dataclass
class Node:
    # Variants keyed by mood or stance name; "default" is required.
    variants: dict[str, str]
    replies: list[Reply] = field(default_factory=list)
    recall_memory: bool = False

    def line_for(self, npc: NPCState) -> str:
        # Most specific first: exact mood, then stance, then default.
        for key in (npc.mood(), npc.stance()):
            if key in self.variants:
                return self.variants[key]
        return self.variants["default"]


# How remembered player actions surface in speech, by memory valence.
MEMORY_LINES = {
    "positive": '"I haven\'t forgotten what you did — {event}. That counted for something."',
    "negative": '"Before you say anything: {event}. I remember. Choose your words."',
}

# Human-readable renderings of memory event codes. Content packs extend this.
EVENT_PHRASES: dict[str, str] = {}


def render_line(node: Node, npc: NPCState) -> str:
    line = node.line_for(npc)
    if node.recall_memory:
        memory = npc.sharpest_memory()
        if memory is not None and abs(memory.valence) >= 0.4:
            phrase = EVENT_PHRASES.get(memory.event, memory.event.replace("_", " "))
            template = MEMORY_LINES["positive" if memory.valence > 0 else "negative"]
            line = template.format(event=phrase) + "\n" + line
    return line


class DialogueRunner:
    """Walks one conversation tree. The caller renders lines and picks replies."""

    def __init__(self, tree: dict[str, Node], start: str = "start"):
        if start not in tree:
            raise ValueError(f"dialogue tree missing start node {start!r}")
        self.tree = tree
        self.current: str | None = start

    def node(self) -> Node:
        assert self.current is not None
        return self.tree[self.current]

    def open_replies(self, state: GameState, npc: NPCState) -> list[Reply]:
        return [r for r in self.node().replies if r.available(state, npc)]

    def choose(self, reply: Reply, state: GameState, npc: NPCState) -> None:
        from engine import personalization  # local import to avoid a cycle

        if reply.effect is not None:
            reply.effect(state, npc)
        personalization.apply_choice_signals(state.player, reply.signals)
        self.current = reply.next_node

    @property
    def finished(self) -> bool:
        return self.current is None


def validate_tree(tree: dict[str, Node], start: str = "start") -> list[str]:
    """Static checks used by tests: every node needs a default variant, every
    edge must point at a real node, every node must be reachable, and no
    node may strand the player with zero replies unless it's terminal by
    design (a node with no replies ends the conversation)."""
    problems = []
    for name, node in tree.items():
        if "default" not in node.variants:
            problems.append(f"node {name!r} has no default variant")
        for reply in node.replies:
            if reply.next_node is not None and reply.next_node not in tree:
                problems.append(f"node {name!r} reply -> missing node {reply.next_node!r}")
    # Reachability from start.
    seen: set[str] = set()
    frontier = [start]
    while frontier:
        current = frontier.pop()
        if current in seen or current not in tree:
            continue
        seen.add(current)
        for reply in tree[current].replies:
            if reply.next_node is not None:
                frontier.append(reply.next_node)
    unreachable = set(tree) - seen
    for name in sorted(unreachable):
        problems.append(f"node {name!r} unreachable from {start!r}")
    return problems
