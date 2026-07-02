"""GREYFALL — scenario content.

Three people have vanished from a fog-locked harbor town in eleven days,
and the radio mast on the cliff broadcasts a signal nobody admits to
sending. Three witnesses, three locked psyches, three ways it can end.
"""
from __future__ import annotations

from .dialogue import Choice, DialogueTree, Node
from .narrative import SceneTemplate
from .npc import NPCProfile

# ---------------------------------------------------------------- NPCs

NPC_PROFILES = {
    "mara": NPCProfile(
        id="mara", name="Mara Voss", role="harbormaster",
        openness=0.4, conscientiousness=0.85, extraversion=0.5,
        agreeableness=0.25, neuroticism=0.3,
        hidden_motive="protect her brother, whatever he has become",
        secret=("Mara has been falsifying the harbor manifests. The night "
                "boat that 'doesn't exist' is her brother's, and she has "
                "known its cargo for months."),
        reveal_trust=60.0, reveal_fear=75.0,
    ),
    "ellis": NPCProfile(
        id="ellis", name="Dr. Ellis Thorn", role="town physician",
        openness=0.7, conscientiousness=0.6, extraversion=0.35,
        agreeableness=0.8, neuroticism=0.7,
        hidden_motive="bury a professional failure before it buries him",
        secret=("The first man to vanish came to Ellis that evening, "
                "terrified, asking for something to sleep. Ellis doubled "
                "the dose to quiet him and sent him home along the cliff "
                "road — toward the mast."),
        reveal_trust=55.0, reveal_fear=70.0,
    ),
    "wren": NPCProfile(
        id="wren", name="Wren", role="ferryman's kid",
        openness=0.8, conscientiousness=0.3, extraversion=0.45,
        agreeableness=0.6, neuroticism=0.85,
        hidden_motive="stay invisible to the man from the night boat",
        secret=("Wren was on the shingle when the second one vanished. "
                "There was a boat with no lamp, a light answering from the "
                "mast, and a voice Wren knew — the harbormaster's brother, "
                "counting names."),
        reveal_trust=50.0, reveal_fear=65.0,
    ),
}

# ------------------------------------------------------------- rewards

REWARD_DETAILS = {
    "minor": [
        "a tide table with one night circled twice.",
        "fresh rope on a bollard nobody uses.",
        "a child's chalk mark, an arrow, pointing up the cliff.",
        "the smell of diesel where no engine should have idled.",
    ],
    "major": [
        "a page torn from the harbor manifest — the entries don't sum.",
        "a pharmacy label with the dosage struck through and rewritten.",
        "a lamp lens, cracked, half-buried above the tide line.",
    ],
    "rare": [
        "The signal isn't a signal. It's a count — three pulses, "
        "one for each of the missing, and tonight there are four.",
    ],
}

# -------------------------------------------------------------- scenes

SCENES = {
    "arrival": SceneTemplate(
        id="arrival", location="the ferry landing",
        base=("The ferry sets you down at Greyfall an hour before dark. "
              "Eleven days, three people gone, and a town that watches "
              "you from behind salt-scoured glass."),
        senses={
            "sight": {
                "calm": ["The fog sits offshore, patient as a debt.",
                         "Gulls stitch slow circles over the breakwater."],
                "uneasy": ["Every curtain on the front street is drawn, "
                           "but none of them hang still.",
                           "The mast on the cliff shows its red eye "
                           "through the murk."],
                "dread": ["The fog has come in over the seawall like "
                          "something feeding."],
            },
            "sound": {
                "calm": ["Halyards tick against masts, unhurried."],
                "uneasy": ["Somewhere a door closes with great care, "
                           "which is worse than a slam.",
                           "Under the harbor noise there is a hum you "
                           "feel in your teeth before you hear it."],
                "dread": ["The town has gone so quiet you can hear the "
                          "mast humming from here."],
            },
            "smell": {
                "uneasy": ["Salt, tar, and under it something sweetly "
                           "chemical that doesn't belong."],
                "dread": ["The air tastes of copper and cold iron."],
            },
        },
        hook="On the cliff, the mast's red light blinks twice — then, for "
             "the first time all evening, a third time.",
    ),
    "quay": SceneTemplate(
        id="quay", location="the quay",
        base=("The quay is Greyfall's one honest artery: harbor office to "
              "the north, the clinic's green lamp up the lane, and south, "
              "the shingle where a kid skips stones at nothing."),
        senses={
            "sight": {
                "calm": ["Low tide has laid the mudflats bare and shining."],
                "uneasy": ["A trawler rides at anchor with no lights on, "
                           "though you can see someone aboard.",
                           "Chalk arrows, child-height, mark three of the "
                           "lamp posts."],
                "dread": ["Every window facing the water is dark now, "
                          "and you did not see them go out."],
            },
            "sound": {
                "calm": ["Water slaps the pilings in easy time."],
                "uneasy": ["The hum from the mast comes and goes with the "
                           "wind, like breathing."],
                "dread": ["Three pulses ride the air, pause, and come "
                          "again. You've started counting along."],
            },
            "touch": {
                "uneasy": ["The handrail is wet where nothing has "
                           "splashed it."],
                "dread": ["The cold finds the gap at your collar and "
                          "stays."],
            },
        },
        hook="From the harbor office, through the glass, Mara Voss is "
             "watching you decide.",
    ),
    "office": SceneTemplate(
        id="office", location="the harbormaster's office",
        base=("Mara Voss keeps her office the way she keeps her face: "
              "squared away, nothing loose, nothing offered."),
        senses={
            "sight": {
                "calm": ["Manifests sit in ruled stacks, edges true."],
                "uneasy": ["One drawer of the cabinet wears a newer lock "
                           "than the rest.",
                           "Her eyes go once to the window, once to the "
                           "cliff, and back to you."],
                "dread": ["Behind her the harbor chart has been re-inked "
                          "so many times the paper has gone thin as skin."],
            },
            "sound": {
                "uneasy": ["The VHF set mutters channel static she has "
                           "chosen not to silence."],
                "dread": ["When the mast pulses, the windowpane buzzes "
                          "in its frame, and she talks through it."],
            },
        },
        hook="As you leave, you hear the newer lock click open behind you.",
    ),
    "clinic": SceneTemplate(
        id="clinic", location="the clinic",
        base=("Dr. Ellis Thorn's clinic smells of iodine and burnt "
              "coffee. He greets you with the particular warmth of a man "
              "who is glad you are not someone else."),
        senses={
            "sight": {
                "calm": ["The waiting room's chairs are worn kind."],
                "uneasy": ["His prescription ledger lies closed under a "
                           "coffee cup, dead center, like a paperweight "
                           "arrangement he rehearsed.",
                           "His hands are steady; it's his mouth that "
                           "isn't."],
                "dread": ["He has the look of a man doing arithmetic "
                          "that never comes out even."],
            },
            "smell": {
                "uneasy": ["Under the iodine: valerian, and a lot of it."],
                "dread": ["The back room breathes ether when the door "
                          "swings."],
            },
        },
        hook="'If you go up to the mast,' Ellis says to your back, "
             "'go before full dark. Please.'",
    ),
    "shore": SceneTemplate(
        id="shore", location="the shingle beach",
        base=("Wren skips stones side-arm at the fog, hood up, and "
              "clocks you the moment your boots hit shingle — but "
              "doesn't run, which on this beach counts as an invitation."),
        senses={
            "sound": {
                "calm": ["Stone after stone: three skips, four."],
                "uneasy": ["Wren talks at the water, never at you, voice "
                           "pitched under the surf.",
                           "When the mast pulses, the stone-skipping "
                           "stops, every time, exactly."],
                "dread": ["'Hear it?' Wren says. 'It's counting. It "
                          "never used to count.'"],
            },
            "sight": {
                "uneasy": ["Wren's chalk is worn to a stub; you've seen "
                           "the arrows it drew.",
                           "Out past the breakwater sits a mooring buoy "
                           "with fresh chafe and no boat on it."],
                "dread": ["Wren keeps the seawall at their back, always, "
                          "and both exits in view."],
            },
            "touch": {
                "uneasy": ["The shingle shifts underfoot like something "
                           "turning over in sleep."],
            },
        },
        hook="Wren presses a stone into your hand: flat, warm, and marked "
             "with a chalk arrow pointing up the cliff.",
    ),
    "mast": SceneTemplate(
        id="mast", location="the mast on the cliff",
        base=("The cliff path ends at a chain-link gate that stands "
              "open. The mast rises out of the fog above you, its red "
              "eye pulsing, and at its base the equipment shed door is "
              "ajar on a warm yellow light. Everything you've gathered "
              "comes up the path with you."),
        senses={
            "sound": {
                "uneasy": ["The hum is a body-feeling now, in the ribs."],
                "dread": ["Three pulses. Pause. Four. The count has "
                          "changed since you started climbing."],
            },
            "sight": {
                "uneasy": ["Fresh bootprints, two sets in, one set out."],
                "dread": ["Below, Greyfall has gone dark to the last "
                          "window, as if the town has closed its eyes."],
            },
            "touch": {
                "dread": ["The chain-link is warm. Metal has no business "
                          "being warm tonight."],
            },
        },
        hook="",
    ),
}

# ------------------------------------------------------ dialogue trees
# Scene transitions use the 'goto_scene' effect; endings use 'end'.

TREES = {
    "arrival": DialogueTree("arrival", "start", [
        Node("start", "narrator",
             ["Night is coming on. Where does the investigation begin?"],
             [
                 Choice("March straight up the front street and let the "
                        "town see you arrive.", "bold", None,
                        effects={"tension": 6, "goto_scene": "quay"},
                        senses=("sight",)),
                 Choice("Take the back lane, unhurried, reading the town "
                        "before it reads you.", "cautious", None,
                        effects={"tension": 2, "goto_scene": "quay",
                                 "clue": "curtains that move"},
                        senses=("sight", "sound")),
                 Choice("Stop at the tied-up ferry crew first — grief "
                        "talks to strangers sometimes.", "empathic", None,
                        effects={"tension": 3, "goto_scene": "quay",
                                 "clue": "the crew won't sail after dusk"},
                        senses=("sound",)),
                 Choice("Stand a moment. Time the pulses of the light on "
                        "the cliff against your watch.", "analytical", None,
                        effects={"tension": 4, "goto_scene": "quay",
                                 "clue": "the signal repeats in threes"},
                        senses=("sight", "sound")),
             ]),
    ]),

    "quay": DialogueTree("quay", "hub", [
        Node("hub", "narrator",
             ["The quay waits. Three doors, three keepers of it.",
              "Back on the quay. The fog has moved; the choices haven't."],
             [
                 Choice("The harbor office — the manifests will know what "
                        "the harbormaster won't say.", "analytical", None,
                        effects={"goto_scene": "office"}, senses=("sight",)),
                 Choice("The clinic — whoever saw the missing last saw "
                        "them frightened.", "empathic", None,
                        effects={"goto_scene": "clinic"}, senses=("smell",)),
                 Choice("The shingle — the kid who chalks arrows has been "
                        "trying to tell someone.", "empathic", None,
                        effects={"goto_scene": "shore"}, senses=("sound",)),
                 Choice("The mast. Enough circling — climb to the thing "
                        "itself.", "bold", None,
                        effects={"tension": 10, "goto_scene": "mast"},
                        requires_flag="mast_open", senses=("touch",)),
                 Choice("You have what you came for. Take the cliff path "
                        "while the count is still climbing.", "analytical",
                        None,
                        effects={"tension": 8, "goto_scene": "mast"},
                        requires_flag="well_informed", senses=("sound",)),
                 Choice("Someone in this town finally trusts you. Finish "
                        "it for them — take the climb now.", "empathic",
                        None,
                        effects={"tension": 8, "goto_scene": "mast"},
                        requires_flag="ally_made", senses=("touch",)),
             ]),
    ]),

    "office": DialogueTree("office", "meet", [
        Node("meet", "mara",
             ["'Investigator.' Mara says the word like a weather report. "
              "'Ask what you're going to ask.'",
              "Mara doesn't look up. 'Still here. Ask, then.'"],
             [
                 Choice("Put the tide table on her desk and ask why one "
                        "night is circled twice.", "analytical", "press",
                        effects={"tension": 6}, senses=("sight",)),
                 Choice("'Three people, Mara. You log every hull in this "
                        "harbor. Where's the boat?'", "bold", "press",
                        effects={"tension": 8}, senses=("sound",)),
                 Choice("'You've been carrying this harbor alone for "
                        "eleven days. I'm not here for you.'",
                        "empathic", "press",
                        effects={"tension": 2}, senses=("sound",)),
                 Choice("Ask small, harmless questions and watch which "
                        "ones make her hands stop.", "cautious", "press",
                        effects={"tension": 3}, senses=("sight",)),
             ]),
        Node("press", "mara",
             ["Something crosses her face and is put away. 'There is no "
              "night boat,' she says, in the exact voice of a woman "
              "reading it off a card."],
             [
                 Choice("Hold the silence and let it cost her.",
                        "cautious", None,
                        effects={"tension": 4, "goto_scene": "quay",
                                 "clue": "Mara's rehearsed denial"},
                        senses=("sound",)),
                 Choice("'A man is dead or worse, and you're reciting.' "
                        "Lean on her, hard.", "bold", None,
                        effects={"tension": 9, "fear": 6,
                                 "goto_scene": "quay"},
                        senses=("sight",)),
                 Choice("'Whoever you're protecting — they're on that "
                        "list of missing next. You know that.'",
                        "empathic", None,
                        effects={"tension": 6, "trust": 6,
                                 "goto_scene": "quay"},
                        senses=("sound",)),
                 Choice("Note the newer lock on the cabinet aloud, "
                        "mildly, and watch her eyes.", "analytical", None,
                        effects={"tension": 5, "goto_scene": "quay",
                                 "clue": "the drawer with the new lock"},
                        senses=("sight",)),
             ]),
    ]),

    "clinic": DialogueTree("clinic", "meet", [
        Node("meet", "ellis",
             ["'You'll want the files on the missing,' Ellis says, "
              "already reaching for the wrong drawer.",
              "Ellis pours a coffee you didn't ask for. 'Anything new?' "
              "he asks, too quickly."],
             [
                 Choice("'You saw one of them that last evening. It's in "
                        "your intake book or it's in your face.'",
                        "analytical", "press",
                        effects={"tension": 6}, senses=("sight",)),
                 Choice("'Doctor. What did you give him?'", "bold", "press",
                        effects={"tension": 9}, senses=("sound",)),
                 Choice("'Whatever happened, you've been alone with it "
                        "for eleven days. That's long enough.'",
                        "empathic", "press",
                        effects={"tension": 3}, senses=("sound",)),
                 Choice("Accept the coffee. Talk about the fog. Let him "
                        "fill the silences himself.", "cautious", "press",
                        effects={"tension": 2}, senses=("smell",)),
             ]),
        Node("press", "ellis",
             ["His cup stops halfway. 'I did my job,' he says, and the "
              "sentence has clearly been to court in his head every "
              "night since."],
             [
                 Choice("'Then your ledger will say so. Show me the "
                        "page.'", "analytical", None,
                        effects={"tension": 7, "goto_scene": "quay",
                                 "clue": "the ledger page under the cup"},
                        senses=("sight",)),
                 Choice("'I'm not the tribunal, Ellis. I'm the one "
                        "chance to make it matter.'", "empathic", None,
                        effects={"tension": 4, "trust": 7,
                                 "goto_scene": "quay"},
                        senses=("sound",)),
                 Choice("Stand up slowly. 'We'll do this at the mast, "
                        "then, in front of what's left.'", "bold", None,
                        effects={"tension": 10, "fear": 7,
                                 "goto_scene": "quay"},
                        senses=("sound",)),
                 Choice("Thank him, leave your card, and clock which "
                        "window he watches you from.", "cautious", None,
                        effects={"tension": 3, "goto_scene": "quay",
                                 "clue": "Ellis watches the cliff road"},
                        senses=("sight",)),
             ]),
    ]),

    "shore": DialogueTree("shore", "meet", [
        Node("meet", "wren",
             ["'You're the one they sent,' Wren says to the fog. 'Took "
              "long enough.'",
              "Wren doesn't turn. 'Counted the pulses yet? You should.'"],
             [
                 Choice("Sit on the cold shingle at a careful distance "
                        "and skip a stone yourself.", "empathic", "trust",
                        effects={"tension": 2, "trust": 6},
                        senses=("touch", "sound")),
                 Choice("'You chalked the arrows. You want this found. "
                        "So show me.'", "bold", "trust",
                        effects={"tension": 8, "fear": 5},
                        senses=("sight",)),
                 Choice("Ask about the mooring buoy with fresh chafe and "
                        "no boat on it.", "analytical", "trust",
                        effects={"tension": 6, "clue": "the bare mooring buoy"},
                        senses=("sight",)),
                 Choice("Talk about anything else — ferries, stones, the "
                        "best chip shop on the coast.", "cautious", "trust",
                        effects={"tension": 1, "trust": 4},
                        senses=("sound",)),
             ]),
        Node("trust", "wren",
             ["Wren finally looks at you, and it's the look of someone "
              "checking whether you float. 'If I say a name,' Wren says, "
              "'I have to be gone by morning. So you'd better be worth "
              "a name.'"],
             [
                 Choice("'Nobody touches you. That's the first promise. "
                        "The name is the second thing.'", "empathic", None,
                        effects={"tension": 5, "trust": 8,
                                 "goto_scene": "quay"},
                        senses=("sound",)),
                 Choice("'Then be gone by morning. But say it.'",
                        "bold", None,
                        effects={"tension": 9, "fear": 8,
                                 "goto_scene": "quay"},
                        senses=("sound",)),
                 Choice("Don't push. Ask instead what the pulses count.",
                        "analytical", None,
                        effects={"tension": 6, "goto_scene": "quay",
                                 "clue": "the pulses count the missing"},
                        senses=("sound",)),
                 Choice("Leave your coat on the stones beside them and "
                        "go. Some doors open later for not being forced.",
                        "cautious", None,
                        effects={"tension": 2, "trust": 5,
                                 "goto_scene": "quay"},
                        senses=("touch",)),
             ]),
    ]),

    "mast": DialogueTree("mast", "gate", [
        Node("gate", "narrator",
             ["The shed door swings at a touch. Inside: the transmitter, "
              "rewired by a careful amateur hand, and a ledger of names "
              "in two different inks. Footsteps grind on the path below "
              "you. This is the moment the whole town has been holding "
              "its breath around."],
             [
                 Choice("Lay it all out — manifests, dosages, the count "
                        "in the signal — and name what happened here.",
                        "analytical", None,
                        effects={"end": "truth"},
                        requires_flag="well_informed",
                        senses=("sight",)),
                 Choice("Step out and meet whoever is climbing, open "
                        "hands, and offer them the way back.",
                        "empathic", None,
                        effects={"end": "mercy"},
                        requires_flag="ally_made",
                        senses=("sound",)),
                 Choice("Kill the transmitter. Rip the wiring out at the "
                        "root, whatever it costs.", "bold", None,
                        effects={"end": "rupture"},
                        senses=("touch",)),
                 Choice("Photograph everything, touch nothing, and walk "
                        "back down to radio the mainland.",
                        "cautious", None,
                        effects={"end": "procedure"},
                        senses=("sight",)),
             ]),
    ]),
}

ENDINGS = {
    "truth": (
        "You say it plainly, into the hum: the brother's boat, the cooked "
        "manifests, the doubled dose, the signal counting what the town "
        "would not. The footsteps on the path stop — and then, from below, "
        "Mara's voice, steady at last: 'All right. All of it. But I say it "
        "sitting down.' By morning the fog lifts off Greyfall like a held "
        "breath let go, and the mast stands silent for the first time in "
        "eleven days. Not everyone is coming home. But now every name "
        "will be spoken aloud.\n\n◆ ENDING: THE WHOLE ACCOUNT — the rarest "
        "way out. You earned every thread of it."
    ),
    "mercy": (
        "You step into the path light with your hands open, and the figure "
        "climbing toward you stops being a shadow and becomes somebody's "
        "exhausted brother. What you offer him isn't forgiveness — it's a "
        "way down the cliff that doesn't end in the water. He takes it. "
        "Some of the truth will stay buried in the shingle, and you will "
        "think about that on quiet nights. But nobody else goes missing "
        "from Greyfall.\n\n◆ ENDING: THE WAY BACK — bought with trust you "
        "built one careful kindness at a time."
    ),
    "rupture": (
        "The wiring comes away in your fists and the hum dies mid-pulse — "
        "and the whole town seems to flinch awake. Doors open. Voices "
        "climb the cliff. In the sudden silence everyone must finally "
        "look at everyone else, and what spills out is ugly, overdue, and "
        "true. It will take Greyfall years to forgive you for the mercy "
        "of it.\n\n◆ ENDING: THE SILENCE — decisive, costly, yours."
    ),
    "procedure": (
        "You do it by the book: photographs, coordinates, the call to the "
        "mainland. The launch arrives at dawn with people whose job this "
        "now is. You watch from the ferry rail as Greyfall becomes a case "
        "file — solved, probably, eventually, by someone. The mast pulses "
        "behind you all the way out of the bay, and you find yourself "
        "counting.\n\n◆ ENDING: THE HANDOFF — clean hands, and the "
        "question of what the town does tonight."
    ),
}

RECAP_LINES = {
    "arrival": "Last time: Greyfall took your measure as you stepped off "
               "the ferry, and something on the cliff blinked three times.",
    "quay": "Last time: three doors on the quay, and behind the glass, "
            "Mara Voss watching you decide.",
    "office": "Last time: a rehearsed denial in the harbor office, and a "
              "lock that clicked open behind you.",
    "clinic": "Last time: Ellis Thorn's steady hands, unsteady mouth, and "
              "a warning about full dark.",
    "shore": "Last time: Wren's chalk arrow, pressed warm into your palm, "
             "pointing up the cliff.",
    "mast": "Last time: the shed door ajar, the ledger in two inks, and "
            "footsteps on the path below.",
}


def validate_all() -> list[str]:
    """Run structural validation over every dialogue tree in the game."""
    problems: list[str] = []
    for tree in TREES.values():
        problems.extend(tree.validate())
    # cross-checks: every goto_scene / end target must exist
    for tree in TREES.values():
        for node in tree.nodes.values():
            for c in node.choices:
                target = c.effects.get("goto_scene")
                if target and target not in SCENES:
                    problems.append(f"{tree.id}/{node.id}: goto_scene "
                                    f"'{target}' has no scene")
                if target and target not in TREES:
                    problems.append(f"{tree.id}/{node.id}: goto_scene "
                                    f"'{target}' has no dialogue tree")
                ending = c.effects.get("end")
                if ending and ending not in ENDINGS:
                    problems.append(f"{tree.id}/{node.id}: ending "
                                    f"'{ending}' is not written")
    for scene_id in SCENES:
        if scene_id not in TREES:
            problems.append(f"scene '{scene_id}' has no dialogue tree")
    return problems
