"""THE LIGHT AT VANE'S HOLLOW — sample content pack.

Your sister Ida, a wreck-surveyor, went silent three weeks ago on a fog-bound
island station. Three people knew her. All three are lying about something —
but not about the same thing, and not for the same reasons.

The truth (spoilers, obviously): a mainland salvage firm has been running a
false light off the cliffs to ground ships on the shoals. Harrow, the keeper,
was blackmailed into dousing the tower the night the *Corvette* struck. Ida
photographed the second lantern. She is alive, hiding in the sea caves, and
Merrit the archivist has been quietly feeding her — waiting to see whether
the stranger asking questions can be trusted, or is the company's next set
of eyes, like Cask.
"""

from __future__ import annotations

from engine.dialogue import Node, Reply
from engine.engine import Ending, StoryPack
from engine.narrative import BeatChoice, BeatTemplate
from engine.npc import Agenda, NPCProfile, NPCState
from engine.state import GameState

# --------------------------------------------------------------------------
# NPCs
# --------------------------------------------------------------------------

def build_npcs() -> dict[str, NPCState]:
    harrow = NPCProfile(
        name="Harrow",
        openness=0.3, conscientiousness=0.8, extraversion=0.2,
        agreeableness=0.45, neuroticism=0.8,
        agenda=Agenda(
            goal="conceal that he doused the tower light the night the Corvette struck",
            concealment=0.85,
            tell="his hands go looking for something to polish whenever the light is mentioned",
        ),
        baseline_valence=-0.2, baseline_arousal=0.4,
    )
    merrit = NPCProfile(
        name="Merrit",
        openness=0.85, conscientiousness=0.7, extraversion=0.5,
        agreeableness=0.8, neuroticism=0.35,
        agenda=Agenda(
            goal="protect Ida's hiding place until the stranger proves trustworthy",
            concealment=0.6,
            tell="she answers questions you haven't asked yet",
        ),
        baseline_valence=0.15, baseline_arousal=0.3,
    )
    cask = NPCProfile(
        name="Cask",
        openness=0.4, conscientiousness=0.5, extraversion=0.85,
        agreeableness=0.25, neuroticism=0.3,
        agenda=Agenda(
            goal="report the stranger's movements to the salvage company for pay",
            concealment=0.45,
            tell="he always, always asks where you'll be tomorrow",
        ),
        baseline_valence=0.1, baseline_arousal=0.35,
    )
    return {p.name: NPCState(p) for p in (harrow, merrit, cask)}


EVENT_PHRASES = {
    "player_shared_photo": "you showed me her photograph instead of interrogating me",
    "player_lied_about_ida": "you lied about why you came",
    "player_defended_harrow": "you spoke up for the old man on the pier",
    "player_threatened": "you put a threat on the table",
    "player_gave_flask": "you handed over your own flask in that cold",
    "player_accused": "you called me a liar to my face",
    "player_confided": "you trusted me with the worst of it",
}

# --------------------------------------------------------------------------
# Effect / predicate helpers
# --------------------------------------------------------------------------

def _flag(name: str):
    def effect(state: GameState) -> None:
        state.world.set_flag(name)
    return effect


def _clue(name: str):
    def effect(state: GameState) -> None:
        state.world.add_clue(name)
    return effect


def _appraise(npc_name: str, event: str, valence: float, intensity: float,
              touches_agenda: bool = False):
    """Beat-choice effect: the named NPC reacts to the player's action."""
    def effect(state: GameState) -> None:
        state.npcs[npc_name].appraise(
            event, valence, intensity, state.pacing.beat_index,
            touches_agenda=touches_agenda,
        )
    return effect


def _all(*effects):
    def effect(state: GameState) -> None:
        for e in effects:
            e(state)
    return effect


def _has_clues(n: int):
    return lambda state: len(state.world.clues) >= n


def _has_flag(name: str):
    return lambda state: state.world.has(name)


def _press_harrow_with_film(state: GameState) -> None:
    """Showing Harrow the film forces the question. Unless the player has
    already made an enemy of him, he chooses confession."""
    harrow = state.npcs["Harrow"]
    if harrow.stance() == "hostile":
        state.world.set_flag("confronted_harrow")
    else:
        state.world.set_flag("harrow_confessed")
        state.world.add_clue("harrow_testimony")
    harrow.appraise("player_showed_evidence", -0.2, 0.9,
                    state.pacing.beat_index, touches_agenda=True)


def _not_flag(name: str):
    return lambda state: not state.world.has(name)


# Dialogue-effect helpers (signature: state, npc).

def _d_appraise(event: str, valence: float, intensity: float,
                touches_agenda: bool = False):
    def effect(state: GameState, npc) -> None:
        npc.appraise(event, valence, intensity, state.pacing.beat_index,
                     touches_agenda=touches_agenda)
    return effect


def _d_flag(name: str):
    def effect(state: GameState, npc) -> None:
        state.world.set_flag(name)
    return effect


def _d_clue(name: str):
    def effect(state: GameState, npc) -> None:
        state.world.add_clue(name)
    return effect


def _d_all(*effects):
    def effect(state: GameState, npc) -> None:
        for e in effects:
            e(state, npc)
    return effect


# --------------------------------------------------------------------------
# Beat templates
# --------------------------------------------------------------------------

def build_templates() -> list[BeatTemplate]:
    return [
        # ---- CALM: texture, character, recovery --------------------------------
        BeatTemplate(
            beat_id="quay_dusk",
            shape="calm",
            location="the quay",
            prose=(
                "The ferry that brought you is already a smudge on the grey water. "
                "Vane's Hollow gathers itself around its one crooked street, and "
                "above everything, the tower — dark, though the dusk is coming on.\n\n{senses}"
            ),
            tags={"lore": 0.6, "mystery": 0.4},
            sensory={
                "sight": ["Gulls hang motionless in the wind, like things pinned to the sky.",
                          "Every window on the street has its curtain drawn back an inch."],
                "sound": ["Halyards tick against masts, irregular, like a clock losing time.",
                          "Somewhere uphill a door bangs, and bangs, and no one shuts it."],
                "smell": ["Tar, salt, and under it something sweeter — kelp rotting below the tideline."],
                "touch": ["The cold finds the gap between your collar and your neck immediately."],
            },
            choices=[
                BeatChoice("Stand a while and take the measure of the place.",
                           signals={"detail": 0.8, "lore": 0.5}),
                BeatChoice("Head straight for the keeper's cottage. Ida's last letter mentioned Harrow.",
                           signals={"action": 0.6, "detail": -0.4}, tension_delta=0.03),
                BeatChoice("Find whoever runs the archive. Paper remembers what people won't say.",
                           signals={"mystery": 0.7, "lore": 0.4}),
                BeatChoice("Enough. Board the supply boat when it calls, and let the sea keep its own.",
                           signals={"risk": -0.8, "action": -0.3},
                           condition=lambda s: s.pacing.chapter >= 2,
                           effect=_flag("took_the_boat")),
            ],
        ),
        BeatTemplate(
            beat_id="keepers_kitchen",
            shape="calm",
            location="the keeper's cottage",
            prose=(
                "Harrow's kitchen is scrubbed to the grain of the wood, everything "
                "squared away — a room kept by a man who needs his hands busy. He "
                "sets tea in front of you without asking.\n\n{senses}"
            ),
            tags={"intimacy": 0.6, "mystery": 0.3},
            sensory={
                "sight": ["A brass lamp-fitting sits on newspaper, half polished; he has been at it a long time.",
                          "Above the door, a photograph of a crew posed before a hull — one face inked out."],
                "sound": ["The kettle's leftover heat ticks out of the stove like something settling."],
                "smell": ["Coal smoke, strong tea, and metal polish sharp enough to sting."],
                "touch": ["The mug is too hot to hold; you hold it anyway."],
            },
            choices=[
                BeatChoice("Talk with Harrow.", talk_to="Harrow",
                           signals={"intimacy": 0.7, "mystery": 0.6}),
                BeatChoice("Ask nothing. Drink the tea. Let the silence do the asking.",
                           signals={"intimacy": 0.5, "detail": 0.6},
                           effect=_appraise("Harrow", "player_respected_silence", 0.5, 0.5)),
                BeatChoice("Study the room while he's at the stove.",
                           signals={"mystery": 0.7, "risk": 0.3}, tension_delta=0.04),
            ],
        ),
        BeatTemplate(
            beat_id="shore_path",
            shape="calm",
            location="the shore path",
            prose=(
                "The path to the north cliffs runs between drystone walls furred "
                "with lichen. Ida walked this every morning — her letters said the "
                "light out here made the mainland feel like a rumor.\n\n{senses}"
            ),
            tags={"lore": 0.5, "intimacy": 0.5, "dread": 0.2},
            sensory={
                "sight": ["The shoals show as a paler bruise under the water, half a mile out.",
                          "Sheep watch you pass with their strange sideways patience."],
                "sound": ["The sea works at the base of the cliffs, patient as bookkeeping."],
                "smell": ["Wet wool and gorse; when the wind turns, cold stone."],
                "touch": ["Spray reaches you even up here, fine as breath."],
            },
            choices=[
                BeatChoice("Walk it slowly, the way she would have.",
                           signals={"intimacy": 0.7, "detail": 0.8}),
                BeatChoice("Scan the tideline below for anything the sea gave back.",
                           signals={"mystery": 0.8}, tension_delta=0.03),
                BeatChoice("Press on quickly — daylight is a resource.",
                           signals={"action": 0.6, "detail": -0.5}),
            ],
        ),
        BeatTemplate(
            beat_id="archive_stacks",
            shape="calm",
            location="the archive",
            prose=(
                "The island archive is one long room above the chandlery: wreck "
                "reports, tide tables, a century of light-station logs in brown "
                "ink. Merrit works here among the paper like a heron in shallows.\n\n{senses}"
            ),
            tags={"lore": 0.8, "mystery": 0.5},
            sensory={
                "sight": ["Dust turns slowly in the one blade of window light.",
                          "The shelf of station logs has a gap in it, recent, the dust unbroken elsewhere."],
                "sound": ["Paper breathes when the draft moves through the stacks."],
                "smell": ["Foxed paper, beeswax, the ghost of pipe smoke soaked into the beams."],
                "touch": ["The ledger bindings are cold and slightly damp, like everything here."],
            },
            choices=[
                BeatChoice("Talk with Merrit.", talk_to="Merrit",
                           signals={"intimacy": 0.6, "mystery": 0.7, "lore": 0.5}),
                BeatChoice("Pull the wreck reports for the last five years.",
                           signals={"mystery": 0.8, "lore": 0.6}, tension_delta=0.03),
                BeatChoice("Note the gap in the log shelf and say nothing. Yet.",
                           signals={"mystery": 0.6, "detail": 0.7}),
            ],
        ),
        BeatTemplate(
            beat_id="tavern_evening",
            shape="calm",
            location="the Anchor & Hope",
            prose=(
                "Evening fills the Anchor & Hope with fishermen and lamplight. "
                "Cask holds court at the bar, generous with everyone's names. He "
                "waves you over like an old friend, which you are not.\n\n{senses}"
            ),
            tags={"intimacy": 0.4, "action": 0.3},
            sensory={
                "sight": ["Cask's smile arrives a half-second before his eyes agree to it.",
                          "Condensation maps little coastlines down the window glass."],
                "sound": ["Dominoes click; the room laughs at something and then checks who else laughed."],
                "smell": ["Beer, oilskins drying, woodsmoke with the sweetness of driftwood in it."],
                "touch": ["The bench is worn smooth as a thwart by a hundred years of the same shoulders."],
            },
            choices=[
                BeatChoice("Talk with Cask.", talk_to="Cask",
                           signals={"intimacy": 0.4, "mystery": 0.6, "risk": 0.3}),
                BeatChoice("Buy a round and just listen to the room.",
                           signals={"lore": 0.6, "detail": 0.6},
                           effect=_appraise("Cask", "player_bought_round", 0.4, 0.4)),
                BeatChoice("Watch who leaves when you mention Ida's name.",
                           signals={"mystery": 0.8, "risk": 0.4}, tension_delta=0.05),
            ],
        ),

        # ---- RISING: complication, unease ---------------------------------------
        BeatTemplate(
            beat_id="room_searched",
            shape="rising",
            once=True,
            prose=(
                "Your room above the tavern is exactly as you left it — except "
                "that it isn't. Your bag's straps are buckled one hole tighter. "
                "Ida's letters are in the wrong order. Whoever did this was "
                "careful, and wanted to be careful more than they managed it.\n\n{senses}"
            ),
            tags={"dread": 0.7, "mystery": 0.6},
            sensory={
                "sight": ["The candle stub has been moved and put back a thumb's width off its ring of old wax."],
                "sound": ["Downstairs the tavern laughs at something; up here the quiet has texture."],
                "smell": ["Under your own soap-and-travel smell, faintly: someone else's tobacco."],
                "touch": ["The latch gives differently now — oiled, recently, by someone who needed it silent."],
            },
            choices=[
                BeatChoice("Say nothing to anyone. Set a thread across the door and wait.",
                           signals={"mystery": 0.8, "risk": -0.3}, tension_delta=0.05),
                BeatChoice("Go down and announce it to the whole tavern, watching faces.",
                           signals={"action": 0.7, "risk": 0.6}, tension_delta=0.1,
                           effect=_appraise("Cask", "player_made_scene", -0.3, 0.5, touches_agenda=True)),
                BeatChoice("Re-read Ida's letters for what a stranger would have found in them.",
                           signals={"intimacy": 0.7, "mystery": 0.5}),
            ],
        ),
        BeatTemplate(
            beat_id="fog_comes_in",
            shape="rising",
            prose=(
                "By afternoon the fog arrives like a decision. The tower vanishes "
                "to the waist. Voices carry strangely — you hear two men arguing "
                "about money somewhere, close, and then nothing at all.\n\n{senses}"
            ),
            tags={"dread": 0.8, "mystery": 0.4},
            sensory={
                "sight": ["The world ends ten feet away in every direction, politely."],
                "sound": ["A foghorn, but wrong — a beat late, or a beat early, each time, somewhere it shouldn't be."],
                "smell": ["The fog tastes of iron and old rope."],
                "touch": ["Beads of it collect on your sleeves like the day sweating."],
            },
            choices=[
                BeatChoice("Follow the argument before the fog swallows it.",
                           signals={"action": 0.7, "risk": 0.7}, tension_delta=0.08),
                BeatChoice("Get indoors. Nothing good hunts in this.",
                           signals={"risk": -0.6, "dread": 0.4}),
                BeatChoice("Stand still and listen — map the island by its sounds.",
                           signals={"detail": 0.9, "mystery": 0.5}, tension_delta=0.04),
            ],
        ),
        BeatTemplate(
            beat_id="cask_tomorrow",
            shape="rising",
            prose=(
                "Cask falls in beside you on the street, all weather-talk and "
                "elbow-room, and then — lightly, the way a man flicks a line into "
                "a pool — asks where you'll be tomorrow. It is the third time "
                "he has asked you that.\n\n{senses}"
            ),
            tags={"mystery": 0.6, "dread": 0.5},
            sensory={
                "sight": ["He watches your mouth when you answer, not your eyes."],
                "sound": ["His boots keep your pace exactly; it takes effort to walk that precisely."],
                "smell": ["Fresh tobacco. The same leaf you smelled in your room, or near enough to make your neck prickle."],
                "touch": ["His hand lands friendly on your shoulder and weighs more than it should."],
            },
            choices=[
                BeatChoice("Tell him somewhere you will absolutely not be — and be there watching who shows up.",
                           signals={"mystery": 0.9, "risk": 0.5}, tension_delta=0.08,
                           effect=_all(_flag("baited_cask"),
                                       _appraise("Cask", "player_evasive", -0.2, 0.4, touches_agenda=True))),
                BeatChoice("Answer honestly. Let him think you suspect nothing.",
                           signals={"risk": 0.3, "intimacy": 0.2},
                           effect=_appraise("Cask", "player_seems_trusting", 0.3, 0.4)),
                BeatChoice("Ask him, pleasantly, why he keeps needing to know.",
                           signals={"action": 0.6, "risk": 0.6}, tension_delta=0.1,
                           effect=_appraise("Cask", "player_pressed_cask", -0.4, 0.6, touches_agenda=True)),
            ],
        ),
        BeatTemplate(
            beat_id="light_on_cliffs",
            shape="rising",
            once=True,
            prose=(
                "You wake past midnight to a line of light under your curtain — "
                "but it moves. Out on the north cliffs, well away from the tower, "
                "a lantern swings slow arcs. Signal-steady. Whoever holds it "
                "knows exactly what they are saying, and it is not being said "
                "to anyone on this island.\n\n{senses}"
            ),
            tags={"mystery": 0.9, "dread": 0.6},
            sensory={
                "sight": ["The tower itself stands dark against the star-field — the real light, dead, while the false one talks."],
                "sound": ["The wind carries one clank of metal on stone, then discipline reasserts itself."],
                "touch": ["Window glass cold as pond ice against your forehead."],
            },
            choices=[
                BeatChoice("Go. Now. Cliffs, dark, alone — but the lantern is *there*.",
                           signals={"action": 0.9, "risk": 0.9}, tension_delta=0.12,
                           effect=_clue("second_lantern")),
                BeatChoice("Mark the bearing and the time. Evidence beats heroics.",
                           signals={"mystery": 0.8, "risk": -0.4}, tension_delta=0.05,
                           effect=_clue("second_lantern")),
                BeatChoice("Wake no one, tell no one, and watch until it stops.",
                           signals={"detail": 0.7, "dread": 0.6}, tension_delta=0.06,
                           effect=_clue("second_lantern")),
            ],
        ),

        # ---- SPIKE: danger, confrontation ---------------------------------------
        BeatTemplate(
            beat_id="cliff_stairs",
            shape="spike",
            once=True,
            prose=(
                "The cliff stairs to the tower are cut into living rock, and the "
                "fourth step from the top is gone — not worn, not fallen. Sawn. "
                "You know this because you are hanging from the fifth by both "
                "hands, feet swinging over sixty feet of nothing, having trusted "
                "it in the dark.\n\n{senses}"
            ),
            tags={"action": 0.9, "dread": 0.7},
            sensory={
                "sight": ["Below, the shoals breathe white in the black water, unhurried, ready."],
                "sound": ["Your own blood is louder than the sea."],
                "touch": ["Granite bites your fingers; your grip is a countdown."],
            },
            choices=[
                BeatChoice("Haul yourself up. Arms, will, nothing else.",
                           signals={"action": 0.9, "risk": 0.4}, tension_delta=0.1),
                BeatChoice("Swing sideways to the gully — longer fall, softer landing, your choice to make it.",
                           signals={"action": 0.6, "risk": 0.9}, tension_delta=0.12),
                BeatChoice("Shout. Someone lit that lamp in the cottage below.",
                           signals={"risk": -0.2, "intimacy": 0.4}, tension_delta=0.08,
                           effect=_appraise("Harrow", "player_needed_help", 0.3, 0.5)),
            ],
        ),
        BeatTemplate(
            beat_id="pier_confrontation",
            shape="spike",
            condition=_has_clues(2),
            prose=(
                "It comes to a head on the pier: Cask, no tavern-smile now, "
                "between you and the street, asking what exactly you think "
                "you're going to do with what you've been collecting. Behind "
                "him, two men you don't know study the water.\n\n{senses}"
            ),
            tags={"action": 0.8, "dread": 0.6},
            sensory={
                "sight": ["The two strangers wear mainland boots. No one fishes in boots like that."],
                "sound": ["A wave slaps the pilings; nobody looks at it."],
                "touch": ["Salt wind pushes at your back, toward the edge, helpful as an enemy."],
            },
            choices=[
                BeatChoice("Tell him the truth: you're not leaving without Ida.",
                           signals={"intimacy": 0.7, "risk": 0.6}, tension_delta=0.1,
                           effect=_appraise("Cask", "player_stood_ground", 0.1, 0.6)),
                BeatChoice("Bluff — the evidence is already in the mail to the mainland.",
                           signals={"mystery": 0.5, "risk": 0.8}, tension_delta=0.12,
                           effect=_all(_flag("bluffed_company"),
                                       _appraise("Cask", "player_threatened", -0.5, 0.7, touches_agenda=True))),
                BeatChoice("Laugh it off. You're a grieving relative, nothing more. Walk through them.",
                           signals={"risk": 0.5, "action": 0.4}, tension_delta=0.08,
                           effect=_appraise("Cask", "player_lied_about_ida", -0.3, 0.5)),
            ],
        ),
        BeatTemplate(
            beat_id="tower_dark",
            shape="spike",
            once=True,
            condition=_has_clues(1),
            prose=(
                "That night the tower light goes out. Not flickers — goes out, "
                "clean, like a held breath, and stays out for eleven minutes "
                "while somewhere beyond the shoals a ship's horn asks its "
                "question twice and gets no answer. When the light returns, "
                "you are already running for the cliff path.\n\n{senses}"
            ),
            tags={"action": 0.7, "dread": 0.9},
            sensory={
                "sight": ["The beam swings back so steady it feels like being lied to."],
                "sound": ["Eleven minutes of horn and sea and your own counting."],
                "touch": ["Dew-slick grass; twice the dark almost takes your footing."],
            },
            choices=[
                BeatChoice("Reach the lamp room before Harrow can compose himself.",
                           signals={"action": 0.8, "risk": 0.7}, tension_delta=0.1,
                           effect=_appraise("Harrow", "player_saw_the_dark", -0.4, 0.8, touches_agenda=True)),
                BeatChoice("Stop. Note the exact times. Eleven minutes is a fact, and facts are weapons.",
                           signals={"mystery": 0.9, "risk": -0.3}, tension_delta=0.06,
                           effect=_clue("darkness_timed")),
                BeatChoice("Check the harbor first — was anyone *expecting* the dark?",
                           signals={"mystery": 0.7, "lore": 0.4}, tension_delta=0.07),
            ],
        ),
        BeatTemplate(
            beat_id="lamp_room_reckoning",
            shape="spike",
            once=True,
            condition=lambda s: (
                len(s.world.clues) >= 3 and not s.world.has("harrow_confessed")
            ),
            prose=(
                "You climb the tower at dusk with everything you have — the "
                "timings, the ghost-written page, all of it — and lay it out "
                "across the lamp-room bench while the great lens turns "
                "overhead, throwing its slow blade of light across Harrow's "
                "face, and dark, and light again. He looks at the papers. He "
                "does not pretend not to understand them.\n\n{senses}"
            ),
            tags={"action": 0.7, "dread": 0.7, "mystery": 0.6},
            sensory={
                "sight": ["Each pass of the beam shows you a different man: keeper, culprit, mourner, keeper again."],
                "sound": ["The clockwork of the lens grinds its patient teeth; somewhere below, the sea keeps its own count."],
                "touch": ["The lamp-room air is blood-warm from the burner, and still you're cold."],
            },
            choices=[
                BeatChoice("'Names, Harrow. Now. Or the mainland reads every page of this tomorrow.'",
                           signals={"action": 0.9, "risk": 0.9}, tension_delta=0.1,
                           effect=_all(_flag("confronted_harrow"),
                                       _appraise("Harrow", "player_threatened", -0.7, 0.9,
                                                 touches_agenda=True))),
                BeatChoice("Say nothing at all. Square the papers' edges and let the evidence do the shouting.",
                           signals={"mystery": 0.6, "detail": 0.6, "dread": 0.5},
                           tension_delta=0.06,
                           effect=_appraise("Harrow", "player_showed_evidence", -0.3, 0.8,
                                            touches_agenda=True)),
                BeatChoice("'I'm not the mainland, Harrow. I'm her family. Help me carry this.'",
                           signals={"intimacy": 0.9, "risk": 0.3},
                           effect=_all(_flag("harrow_ready"),
                                       _appraise("Harrow", "player_knows_and_stayed_kind",
                                                 0.6, 0.8, touches_agenda=True))),
            ],
        ),
        BeatTemplate(
            beat_id="followed_in_fog",
            shape="spike",
            prose=(
                "Footsteps behind you in the fog match yours step for step — "
                "stop when you stop, move when you move, close enough that you "
                "can hear wet wool. The path ahead forks: the open beach, or "
                "the black mouth of the boat-shed.\n\n{senses}"
            ),
            tags={"dread": 0.9, "action": 0.6},
            sensory={
                "sound": ["When you hold your breath, someone else is breathing."],
                "sight": ["The fog gives you a shape and takes it back, generous and cruel."],
                "touch": ["Your palm finds the knife you told yourself you wouldn't need."],
            },
            choices=[
                BeatChoice("Turn and walk straight at the footsteps.",
                           signals={"action": 0.9, "risk": 0.9}, tension_delta=0.12),
                BeatChoice("The boat-shed. Narrow door. Make them come to you one at a time.",
                           signals={"mystery": 0.4, "risk": 0.5}, tension_delta=0.1),
                BeatChoice("The open beach — room to run, and witnesses in the cottages above.",
                           signals={"risk": -0.5, "action": 0.3}, tension_delta=0.06),
            ],
        ),

        # ---- REWARD: payoffs -----------------------------------------------------
        BeatTemplate(
            beat_id="find_camera",
            shape="reward",
            once=True,
            prose=(
                "Low tide bares the rock pools north of the quay, and in one of "
                "them, wedged under a shelf as if placed there by someone in a "
                "hurry who meant to come back: Ida's camera. Her initials are "
                "scratched in the base plate. The film door hangs open. "
                "The film is gone — taken, or saved.\n\n{senses}"
            ),
            tags={"mystery": 0.8, "intimacy": 0.7},
            sensory={
                "sight": ["Barnacles have only just begun on the strap buckle: weeks, not months."],
                "touch": ["The metal is sea-cold, and your thumb finds the worn patch where hers rested."],
                "smell": ["Brine and old leather, and for a second, unfairly, her darkroom."],
            },
            choices=[
                BeatChoice("Pocket it quietly. Someone on this island knows where the film went.",
                           signals={"mystery": 0.8}, effect=_clue("idas_camera")),
                BeatChoice("Sit down right there on the rocks with it. Give the moment what it costs.",
                           signals={"intimacy": 0.9, "detail": 0.7}, effect=_clue("idas_camera")),
                BeatChoice("Show it to Merrit within the hour — watch her face when she sees it.",
                           signals={"mystery": 0.6, "intimacy": 0.5},
                           effect=_all(_clue("idas_camera"),
                                       _appraise("Merrit", "player_shared_photo", 0.6, 0.7, touches_agenda=True))),
            ],
        ),
        BeatTemplate(
            beat_id="torn_logbook",
            shape="reward",
            once=True,
            prose=(
                "In the archive's newest station log, the pages for the third "
                "week of March are gone — razored close to the spine by someone "
                "neat. But paper remembers: the next leaf carries the ghost of "
                "pressure from a pen. Tilted to the window light, one line "
                "rises: *...light extinguished per instruction, God forgive—*\n\n{senses}"
            ),
            tags={"lore": 0.8, "mystery": 0.9},
            sensory={
                "sight": ["The razored edge is neat for a page and a half, then hurried."],
                "touch": ["You rub the ghost-writing like Braille, afraid of wearing it away."],
                "sound": ["A stair creaks below the stacks, and stops creaking mid-step."],
            },
            choices=[
                BeatChoice("Per *instruction*. Copy the ghost-line exactly and hide the copy off your person.",
                           signals={"mystery": 0.9, "risk": -0.3}, effect=_clue("torn_logbook_page")),
                BeatChoice("Take the whole logbook. Possession is leverage.",
                           signals={"risk": 0.7, "action": 0.5}, tension_delta=0.06,
                           effect=_all(_clue("torn_logbook_page"), _flag("stole_logbook"))),
                BeatChoice("Leave it exactly as found and ask Merrit who else reads these.",
                           signals={"intimacy": 0.4, "mystery": 0.5},
                           effect=_all(_clue("torn_logbook_page"),
                                       _appraise("Merrit", "player_came_honest", 0.4, 0.5))),
            ],
        ),
        BeatTemplate(
            beat_id="casks_ledger",
            shape="reward",
            once=True,
            condition=_has_flag("baited_cask"),
            prose=(
                "Your trap on the false meeting-place catches exactly one man: "
                "Cask, arriving early to watch a spot you never intended to be. "
                "And while he waits there, his sea-chest at the tavern gives up "
                "its bottom drawer — bank slips, mainland-stamped, monthly, "
                "each one dated two days after a wreck report. Salvage money. "
                "Watching money.\n\n{senses}"
            ),
            tags={"mystery": 0.9, "action": 0.4},
            sensory={
                "sight": ["The slips are ordered and clipped. He is proud of them, or scared of them."],
                "smell": ["The drawer breathes out tobacco — *that* tobacco."],
                "touch": ["Cheap paper, greasy at one corner where a thumb has counted it many times."],
            },
            choices=[
                BeatChoice("Take one slip from the middle of the stack. He won't dare mention it.",
                           signals={"mystery": 0.7, "risk": 0.6}, effect=_clue("cask_payments")),
                BeatChoice("Photograph nothing, steal nothing, memorize everything.",
                           signals={"detail": 0.8, "risk": -0.4}, effect=_clue("cask_payments")),
                BeatChoice("Put it all back wrong, deliberately. Let him wonder who knows.",
                           signals={"risk": 0.8, "dread": 0.4}, tension_delta=0.08,
                           effect=_all(_clue("cask_payments"),
                                       _appraise("Cask", "player_toying", -0.4, 0.6, touches_agenda=True))),
            ],
        ),
        BeatTemplate(
            beat_id="merrits_letter",
            shape="reward",
            once=True,
            condition=lambda s: s.npcs["Merrit"].trust >= 0.5,
            prose=(
                "Merrit closes the archive door, listens to the street, and "
                "takes an envelope from inside a tide-table where no one would "
                "ever look. Ida's hand. Unsent. *If I don't come back for this, "
                "give it to no one in a uniform and no one smiling.* Inside: a "
                "sketch of the north cliffs with a lantern marked in red, and "
                "the words UNDER THE HOLLOW.\n\n{senses}"
            ),
            tags={"intimacy": 0.9, "mystery": 0.8},
            sensory={
                "sight": ["Ida's handwriting deteriorates across the page — written fast, checked over a shoulder."],
                "touch": ["The paper has been folded and unfolded so often it's soft as cloth. Merrit has read this many times."],
                "sound": ["Merrit breathes like someone setting down something heavy."],
            },
            choices=[
                BeatChoice("'Under the hollow.' Ask Merrit what Ida meant — and why she waited to show you.",
                           signals={"intimacy": 0.8, "mystery": 0.6},
                           effect=_all(_clue("merrit_letter"),
                                       _appraise("Merrit", "player_gentle_with_secret", 0.6, 0.6))),
                BeatChoice("Thank her — and notice she knew exactly which tide-table to reach for.",
                           signals={"mystery": 0.8, "detail": 0.6},
                           effect=_all(_clue("merrit_letter"),
                                       _appraise("Merrit", "player_sees_through_me", 0.2, 0.6, touches_agenda=True))),
                BeatChoice("Read it twice, memorize the sketch, and hand it back to its hiding place.",
                           signals={"risk": -0.4, "lore": 0.5}, effect=_clue("merrit_letter")),
            ],
        ),
        BeatTemplate(
            beat_id="harrow_draft",
            shape="reward",
            once=True,
            condition=lambda s: s.npcs["Harrow"].fear >= 0.4 or s.world.has("saw_harrow_burning"),
            prose=(
                "The cottage stove has gone out badly, and in its cold grate a "
                "half-burned page keeps its shape like a leaf of ash. Enough "
                "survives: *...they said one dark night, one, and the insurance "
                "men would do the rest. They did not say a surveyor would be "
                "out on the water. I have written it all in case—* The rest is "
                "smoke.\n\n{senses}"
            ),
            tags={"mystery": 0.9, "dread": 0.6, "intimacy": 0.4},
            sensory={
                "sight": ["The ash-page holds until your breath touches it, then loses a corner."],
                "smell": ["Burnt paper and, absurdly, the tea he made you the first day."],
                "touch": ["Cold iron stove-door, and your own pulse in your fingertips."],
            },
            choices=[
                BeatChoice("*I have written it all in case.* The full confession exists. Find it.",
                           signals={"mystery": 0.9, "action": 0.5}, effect=_clue("confession_draft")),
                BeatChoice("Leave it and carry the knowledge to Harrow himself, gently.",
                           signals={"intimacy": 0.8, "risk": 0.4},
                           effect=_all(_clue("confession_draft"),
                                       _appraise("Harrow", "player_knows_and_stayed_kind", 0.5, 0.8, touches_agenda=True))),
                BeatChoice("Preserve the fragment between two tide-tables. Evidence, whatever comes.",
                           signals={"mystery": 0.6, "risk": -0.3}, effect=_clue("confession_draft")),
            ],
        ),
        BeatTemplate(
            beat_id="small_kindness",
            shape="reward",
            prose=(
                "Not every gift on this island is a clue. Tonight the fog lifts "
                "for an hour and the real light — the tower's honest beam — "
                "swings its slow arm over the water, and you understand for a "
                "moment why Ida stayed. The island is only terrible the way "
                "beautiful things are.\n\n{senses}"
            ),
            tags={"intimacy": 0.7, "lore": 0.6},
            sensory={
                "sight": ["The beam crosses the fog-bank ceiling like a hand smoothing a sheet."],
                "sound": ["Someone in a cottage is playing a fiddle, badly, happily."],
                "smell": ["Clean cold; the rot and tar scoured off the wind for one hour."],
                "touch": ["You realize your shoulders have been up around your ears for days, and let them down."],
            },
            choices=[
                BeatChoice("Let yourself have the hour. Ida would have.",
                           signals={"intimacy": 0.8, "detail": 0.7}),
                BeatChoice("Use the clear air: fix every cliff, cave, and current in your memory.",
                           signals={"mystery": 0.5, "detail": 0.8}),
                BeatChoice("Beauty is a distraction someone might be counting on. Keep working.",
                           signals={"action": 0.5, "dread": 0.4, "detail": -0.3}),
            ],
        ),

        BeatTemplate(
            beat_id="harrow_at_your_door",
            shape="reward",
            once=True,
            condition=lambda s: s.world.has("harrow_ready") and not s.world.has("harrow_confessed"),
            prose=(
                "Harrow is at your door before the gulls are up, dressed as if "
                "for church or a court, holding a sea-stained oilcloth packet "
                "with both hands like a man carrying his own heart. 'You said "
                "when I was ready,' he says. 'I have been ready since March. "
                "I only lacked the witness.' Inside the oilcloth: eleven pages, "
                "dated, signed — the whole of it, in a lightkeeper's careful "
                "hand.\n\n{senses}"
            ),
            tags={"intimacy": 0.9, "mystery": 0.7},
            sensory={
                "sight": ["His collar is buttoned to the throat; his hands are steady the way a decided man's are steady."],
                "sound": ["Below the window the tide is coming in, indifferent and clean."],
                "touch": ["The oilcloth packet is heavier than paper has any right to be."],
            },
            choices=[
                BeatChoice("'Testimony for testimony, Harrow. We finish this together.'",
                           signals={"action": 0.6, "intimacy": 0.7},
                           effect=_all(_flag("harrow_confessed"), _clue("harrow_testimony"),
                                       _appraise("Harrow", "player_offered_alliance", 0.7, 0.8))),
                BeatChoice("Read all eleven pages while he stands there, because being witnessed is the point.",
                           signals={"intimacy": 0.9, "detail": 0.8},
                           effect=_all(_flag("harrow_confessed"), _clue("harrow_testimony"),
                                       _appraise("Harrow", "player_confided", 0.8, 0.8))),
            ],
        ),

        # ---- CLIFFHANGER: chapter-enders ------------------------------------------
        BeatTemplate(
            beat_id="note_under_door",
            shape="cliffhanger",
            once=True,
            prose=(
                "You are halfway to sleep when paper whispers under your door. "
                "By the time you reach the hall, it is empty in both directions "
                "— no footsteps, no candle, only cold air with the door's shape "
                "in it. The note is five words, block capitals, written by a "
                "hand pressing far too hard:\n\n"
                "STOP ASKING ABOUT THE LIGHT.\n\n"
                "Below the words, smaller, in different ink — added later, "
                "added *afraid*:\n\n"
                "*please*"
            ),
            tags={"dread": 0.9, "mystery": 0.8},
            sensory={},
            choices=[
                BeatChoice("Two hands wrote this. One ordering. One begging. Sleep on that, if you can.",
                           signals={"mystery": 0.8, "dread": 0.6}, tension_delta=0.05),
                BeatChoice("Pocket it. Tomorrow, compare the inks against every hand on this island.",
                           signals={"mystery": 0.9, "detail": 0.6}, tension_delta=0.05,
                           effect=_clue("threatening_note")),
            ],
        ),
        BeatTemplate(
            beat_id="figure_on_rocks",
            shape="cliffhanger",
            once=True,
            prose=(
                "At the last grey of dusk you see her. Below the north cliffs, "
                "on the rocks the tide is already taking back: a figure in a "
                "surveyor's coat, standing still, looking up — looking, you "
                "would swear on everything, directly at your window. You get "
                "the casement open, the cold flooding in, your heart doing "
                "something dangerous—\n\n"
                "The rocks are empty. The tide continues its work. And on the "
                "sill outside the glass, weighted with a pebble, is a strip of "
                "photographic film."
            ),
            tags={"intimacy": 0.9, "mystery": 0.9, "dread": 0.5},
            sensory={},
            choices=[
                BeatChoice("IDA. Out the door, down the stairs, shortest line to the rocks, *now*.",
                           signals={"action": 0.9, "intimacy": 0.8, "risk": 0.8}, tension_delta=0.1,
                           effect=_flag("saw_ida")),
                BeatChoice("Hold the film to the lamp with shaking hands.",
                           signals={"mystery": 0.9, "intimacy": 0.5}, tension_delta=0.06,
                           effect=_all(_flag("saw_ida"), _clue("idas_film"))),
            ],
        ),
        BeatTemplate(
            beat_id="boat_slips_mooring",
            shape="cliffhanger",
            once=True,
            prose=(
                "The morning ferry does not come. By noon the word is engine "
                "trouble; by dusk you find the truth at the slipway — your own "
                "hired boat, the one guarantee you could always just *leave*, "
                "riding low and wrong. Someone has pulled the bung and let the "
                "sea in overnight, unhurried, thorough.\n\n"
                "You are not investigating an island anymore. You are on a "
                "piece of rock, in the sea's weather, with everyone who did this."
            ),
            tags={"dread": 0.9, "action": 0.5},
            sensory={},
            choices=[
                BeatChoice("Good. Now nobody expects you to run — so nothing you do next will be predicted.",
                           signals={"risk": 0.7, "action": 0.6}, tension_delta=0.08),
                BeatChoice("Raise it quietly with Merrit. Someone on this island still owns an honest boat.",
                           signals={"intimacy": 0.5, "risk": -0.3}, tension_delta=0.05,
                           effect=_appraise("Merrit", "player_turned_to_me", 0.4, 0.5)),
            ],
        ),

        # ---- STORY SPINE: the caves ------------------------------------------------
        BeatTemplate(
            beat_id="under_the_hollow",
            shape="reward",
            once=True,
            condition=lambda s: (
                len(s.world.clues) >= 4
                and s.npcs["Merrit"].trust >= 0.6
                and not s.world.has("found_ida")
            ),
            prose=(
                "Merrit meets you at the tide-gate with a storm lantern and no "
                "preamble. 'Under the hollow,' she says. 'You were always going "
                "to be told. I had to be sure you weren't another Cask.' The sea "
                "cave under the north cliff opens like a listening ear, and in "
                "its throat, past a cold hearth and a surveyor's kit stacked "
                "with military neatness — a light, and a shape that stands, and "
                "a voice you have heard in your head every day for three weeks:\n\n"
                "'You took your *time*.'\n\n"
                "Ida. Thinner. Alive. Furious and crying and alive."
            ),
            tags={"intimacy": 1.0, "mystery": 0.6},
            sensory={},
            on_enter=_flag("found_ida"),
            choices=[
                BeatChoice("Cross the cave. Words later.",
                           signals={"intimacy": 1.0},
                           effect=_appraise("Merrit", "player_confided", 0.7, 0.8)),
                BeatChoice("'The film. The lantern. The Corvette. Tell me everything, and then we end this.'",
                           signals={"action": 0.7, "mystery": 0.8},
                           effect=_flag("ida_briefing")),
            ],
        ),
        BeatTemplate(
            beat_id="the_tide_gate",
            shape="rising",
            condition=_has_flag("found_ida"),
            prose=(
                "The fishing boat Merrit trusts goes out on the morning tide, "
                "and its skipper asks no questions of cargo that keeps its "
                "hood up. Ida waits at the tide-gate with the film sewn into "
                "her coat and three weeks of patience worn to wire. 'We can "
                "be gone by noon,' she says. 'Or—' and she doesn't finish it, "
                "because you're both looking up at the tower.\n\n{senses}"
            ),
            tags={"intimacy": 0.7, "action": 0.5, "dread": 0.4},
            sensory={
                "sight": ["The tower's honest light pales as the sky comes up grey and ordinary."],
                "sound": ["Down at the slip, the skipper coils rope with the loud patience of a man being paid to wait."],
                "touch": ["Ida's shoulder against yours — real, breathing, restless."],
            },
            choices=[
                BeatChoice("Take the tide. Ida, the film, the open sea — the island can keep its ghosts.",
                           signals={"intimacy": 0.8, "risk": -0.3},
                           effect=_flag("left_with_ida")),
                BeatChoice("First, Harrow. Walk the film to his kitchen and let him choose who he is.",
                           signals={"action": 0.6, "intimacy": 0.6, "mystery": 0.5},
                           condition=_not_flag("harrow_confessed"),
                           tension_delta=0.08,
                           effect=_press_harrow_with_film),
                BeatChoice("Not yet. One more day — there are threads still loose, and she's safest where she is.",
                           signals={"mystery": 0.5, "detail": 0.4, "dread": 0.3}),
            ],
        ),
    ]


# --------------------------------------------------------------------------
# Dialogue trees
# --------------------------------------------------------------------------

def build_dialogues() -> dict[str, dict[str, Node]]:
    harrow = {
        "start": Node(
            recall_memory=True,
            variants={
                "default": '"Ask what you came to ask," Harrow says, not unkindly, polishing brass that is already bright.',
                "brittle": 'Harrow\'s hands don\'t stop moving on the brass. "Whatever it is, be quick."',
                "warm": 'Harrow pours before you sit. "You have her way of standing in a doorway. Ask, then."',
                "threatening": 'Harrow sets the brass down with terrible care. "You should mind the stairs at night. This island eats the careless."',
                "hostile": '"We\'re done talking, I think." He says it to the lamp fitting, not to you.',
            },
            replies=[
                Reply("Ask about Ida's last weeks — what she photographed, where she walked.",
                      "about_ida", signals={"intimacy": 0.5, "mystery": 0.4}),
                Reply("Ask why the tower light and the wreck reports don't line up.",
                      "about_light", signals={"mystery": 0.8, "risk": 0.5},
                      effect=_d_appraise("player_asks_light", -0.2, 0.6, touches_agenda=True)),
                Reply("Say nothing about the island. Ask about him — forty years on the light.",
                      "about_him", signals={"intimacy": 0.7, "lore": 0.6},
                      effect=_d_appraise("player_asked_about_him", 0.5, 0.5)),
                Reply("(Leave.)", None, signals={"detail": -0.2}),
            ],
        ),
        "about_ida": Node(
            variants={
                "default": '"She walked the north path every morning. Photographed the water more than the land — said the shoals had a pattern to them. I told her patterns out there belong to God and the Trinity House chart." He stops polishing. "She said this one belonged to neither."',
                "warm": '"She sat where you\'re sitting. Argued with me about everything and I looked forward to it. The shoals, she kept on about the shoals — a pattern in the wrecks. I should have listened harder." His voice goes somewhere private. "I should have done a great many things."',
                "hostile": '"She asked too many questions. Runs in the family, it seems."',
            },
            replies=[
                Reply("'A pattern in the wrecks.' Press him: what pattern?",
                      "wreck_pattern", signals={"mystery": 0.9},
                      effect=_d_appraise("player_pressed_pattern", -0.1, 0.5, touches_agenda=True)),
                Reply("'I should have done a great many things' — sit with that. Wait.",
                      "the_silence", signals={"intimacy": 0.8, "detail": 0.7},
                      condition=lambda s, n: n.stance() in ("open", "confessional")),
                Reply("Thank him and let it rest for now.", None, signals={"risk": -0.3}),
            ],
        ),
        "about_light": Node(
            variants={
                "default": '"The light has kept forty years without complaint from any soul but you." The polishing cloth works harder. "Wrecks happen on shoals. That\'s what shoals are for."',
                "brittle": '"Who\'s been talking to you?" The cloth stops. "Cask? The archive woman? People here tell strangers stories."',
                "threatening": '"The last person who stood in my kitchen asking about that light," he says quietly, "is why you\'re here at all. Think on what that means before you ask again."',
            },
            replies=[
                Reply("Put the torn logbook page on the table between you. Say nothing.",
                      "logbook_reveal", signals={"risk": 0.7, "mystery": 0.6},
                      condition=lambda s, n: "torn_logbook_page" in s.world.clues,
                      effect=_d_appraise("player_showed_evidence", -0.3, 0.9, touches_agenda=True)),
                Reply("Back off gently — 'Forty years is a long watch. I meant no accusation.'",
                      "start", signals={"intimacy": 0.4, "risk": -0.4},
                      effect=_d_appraise("player_backed_off", 0.3, 0.4)),
                Reply("(Leave — you've rattled him enough for one day.)", None,
                      signals={"mystery": 0.3}),
            ],
        ),
        "about_him": Node(
            variants={
                "default": '"Forty-one years. Two keepers before me went mad from the quiet; I made an ally of it." He almost smiles. "The light asks one thing only: that it never goes out. Simple men do well here."',
                "warm": 'He talks for a while — storms named like old enemies, the year the relief boat couldn\'t land for six weeks, the comet. It costs him visibly when he stops. "Nobody has asked me a thing about myself in four years. Ida did. Now you. Her family, all right."',
            },
            replies=[
                Reply("'That it never goes out.' And has it? Ever? — ask it like it's still small talk.",
                      "the_silence", signals={"mystery": 0.8, "risk": 0.6},
                      effect=_d_appraise("player_gentle_trap", -0.2, 0.7, touches_agenda=True)),
                Reply("Share your own quiet — the three weeks of not knowing, the letters read to rags.",
                      "shared_grief", signals={"intimacy": 0.9},
                      effect=_d_appraise("player_opened_up", 0.6, 0.7)),
                Reply("Let the evening end well. Leave him the peace.", None,
                      signals={"intimacy": 0.4, "risk": -0.3},
                      effect=_d_appraise("player_left_kindly", 0.3, 0.3)),
            ],
        ),
        "shared_grief": Node(
            variants={
                "default": 'He listens the way the island listens — completely, without hurry. "Hope is heavier than grief," he says at last. "Grief sets down. Hope you carry." His eyes go to the window, to the north cliffs, and come back too quickly.',
            },
            replies=[
                Reply("His eyes went north. To the cliffs. Note it, say nothing, love him a little anyway.",
                      None, signals={"mystery": 0.7, "detail": 0.8, "intimacy": 0.5}),
                Reply("'You looked north just now. Why north, Harrow?'",
                      "the_silence", signals={"mystery": 0.9, "risk": 0.5},
                      effect=_d_appraise("player_caught_glance", -0.1, 0.6, touches_agenda=True)),
            ],
        ),
        "wreck_pattern": Node(
            variants={
                "default": '"Ships strike the Hollow shoals in bad weather. Always have." But his hands have gone to the brass again, hunting for a tarnish that isn\'t there. "Only... lately it\'s the well-insured ones. She noticed that. Out loud. In the tavern." He looks at you fully for the first time. "Do not do the thing she did, which is notice things out loud."',
                "hostile": '"There is no pattern. There is the sea and there are fools." The conversation is over; his shoulders say so.',
            },
            replies=[
                Reply("'Who was in the tavern when she said it?' — quietly, like a door closing.",
                      None, signals={"mystery": 0.9},
                      effect=_d_all(_d_clue("tavern_witnesses"),
                                    _d_appraise("player_asks_right_question", 0.3, 0.6))),
                Reply("Promise him you'll be careful — and mean it where he can see you mean it.",
                      None, signals={"intimacy": 0.6, "risk": -0.5},
                      effect=_d_appraise("player_promised_care", 0.5, 0.5)),
            ],
        ),
        "logbook_reveal": Node(
            variants={
                "default": 'He reads the ghost-line without touching the paper. The room\'s clock gets very loud. "Per instruction," he repeats. "Yes. That is my hand." He sits down like a tower coming down. "Ask me tomorrow. Tonight I need to decide who I am."',
                "threatening": '"You bring a dead man\'s words into my kitchen." He stands. He is between you and the door and then, deliberately, he is not. "Get out. Not for my sake. Get out because the people who instructed me will want to know who reads old logbooks."',
            },
            replies=[
                Reply("Leave him the night he asked for. Some confessions need a run-up.",
                      None, signals={"intimacy": 0.7, "risk": -0.3},
                      effect=_d_all(_d_flag("harrow_ready"),
                                    _d_appraise("player_gave_mercy", 0.6, 0.8))),
                Reply("'No. Now. Ida ran out of tomorrows three weeks ago.'",
                      "confession", signals={"action": 0.8, "risk": 0.7},
                      condition=lambda s, n: n.stance() in ("open", "confessional"),
                      effect=_d_appraise("player_forced_it", -0.2, 0.7)),
                Reply("'The people who instructed you. Names, Harrow.'",
                      None, signals={"action": 0.9, "risk": 0.9},
                      effect=_d_all(_d_flag("confronted_harrow"),
                                    _d_appraise("player_threatened", -0.6, 0.9, touches_agenda=True))),
            ],
        ),
        "the_silence": Node(
            variants={
                "default": 'The silence stretches until it becomes a kind of speech. Harrow polishes. The clock ticks. "Eleven minutes," he says finally, to no one, to the brass. "A man can hold his breath a long time in eleven minutes." He will say no more today — but he said *that*.',
            },
            replies=[
                Reply("Eleven minutes. Log it in your bones and go gently.",
                      None, signals={"mystery": 0.8, "detail": 0.6},
                      effect=_d_clue("eleven_minutes")),
                Reply("Put your hand flat on the table — not a threat, an anchor. 'When you're ready, I'll be here.'",
                      None, signals={"intimacy": 0.9},
                      effect=_d_all(_d_clue("eleven_minutes"),
                                    _d_flag("harrow_ready"),
                                    _d_appraise("player_knows_and_stayed_kind", 0.7, 0.8, touches_agenda=True))),
            ],
        ),
        "confession": Node(
            variants={
                "default": '"They came in January. Photographs of my brother\'s debts, my niece\'s address on the mainland. One dark night, they said — the insurance men would do the rest, no crew aboard, an old hull they wanted paid for twice." His voice is a flat calm worse than weeping. "No one told me a surveyor had taken a skiff out to shoot the shoals by moonlight. Your sister saw the tower go dark and the cliff lantern answer it. And I have spent every night since praying she is alive and terrified she will prove it."',
                "confessional": '"I doused the light. Me. Forty-one years, and I put my hand on the switch because I was afraid — and your sister was on the water when the false lantern called the *Corvette* onto the stones." He finally looks up. "She lived. I believe she lived. Find her, and I will stand up in whatever court will have me and burn them all down."',
            },
            replies=[
                Reply("'Then help me end it. Testimony for testimony — I find Ida, you name the company.'",
                      None, signals={"action": 0.7, "intimacy": 0.6},
                      effect=_d_all(_d_flag("harrow_confessed"), _d_clue("harrow_testimony"),
                                    _d_appraise("player_offered_alliance", 0.7, 0.8))),
                Reply("Say nothing. Take his hand. Some things are done before they're spoken.",
                      None, signals={"intimacy": 1.0},
                      effect=_d_all(_d_flag("harrow_confessed"),
                                    _d_appraise("player_confided", 0.8, 0.9))),
            ],
        ),
    }

    merrit = {
        "start": Node(
            recall_memory=True,
            variants={
                "default": 'Merrit marks her page with a dried grass-stem. "The stranger with Ida\'s jaw. I wondered when you\'d find the archive." She does not say: *everyone finds me last.* She thinks it loudly.',
                "warm": '"Sit. Mind the tide-tables, they outrank both of us." Merrit clears the good chair. "You\'ve the look of someone with a specific question. Those are my favorite kind."',
                "electric": 'Merrit is already moving when you come in, pulling a folio, talking fast. "Good. You. I found something and I\'ve been arguing with myself about showing you."',
                "hostile": '"The archive closes early today." It doesn\'t. You both know it doesn\'t.',
            },
            replies=[
                Reply("Ask what Ida was researching in her last weeks.",
                      "ida_research", signals={"mystery": 0.6, "intimacy": 0.4}),
                Reply("Ask about the gap on the log shelf — the missing volume.",
                      "missing_log", signals={"mystery": 0.8, "detail": 0.5},
                      effect=_d_appraise("player_notices_things", 0.3, 0.5, touches_agenda=True)),
                Reply("Ask her, plainly: 'Whose side are you on, Merrit?'",
                      "whose_side", signals={"risk": 0.6, "action": 0.5},
                      effect=_d_appraise("player_direct_challenge", -0.1, 0.6, touches_agenda=True)),
                Reply("(Leave.)", None),
            ],
        ),
        "ida_research": Node(
            variants={
                "default": '"Wreck insurance. Loss registries. Which hulls were worth more drowned than floating." Merrit aligns the folio edges precisely. "She requested the same ledger eleven days running. The twelfth day she didn\'t come, and the ledger was gone by the weekend." A beat. "You\'ll want to know who else used the archive that week. I keep a visitors\' book."',
                "hostile": '"Old weather. Tide patterns. Nothing that concerns the mainland." She has decided you might be dangerous, and she is a bad liar in a way that seems almost deliberate.',
            },
            replies=[
                Reply("The visitors' book. Yes.",
                      "visitors_book", signals={"mystery": 0.9},
                      condition=lambda s, n: n.stance() in ("open", "confessional")),
                Reply("'Worth more drowned than floating.' Ask her to walk you through how that fraud works.",
                      "fraud_explained", signals={"lore": 0.9, "mystery": 0.6}),
                Reply("Notice: she answered the question you were saving for last. Again.",
                      None, signals={"detail": 0.8, "mystery": 0.6},
                      effect=_d_appraise("player_sees_through_me", 0.2, 0.5, touches_agenda=True)),
            ],
        ),
        "missing_log": Node(
            variants={
                "default": '"You counted the shelf." Something shifts in how she looks at you — a recalibration. "The March log went missing the week Ida did. I reported it to exactly no one, because the person you report missing logs to on this island is the person I believe took it." She lets that sit. "Check the current log instead. Razors are hasty things."',
                "guarded": '"Volumes go for rebinding." The grass-stem bookmark turns over and over in her fingers.',
            },
            replies=[
                Reply("Take her advice — go razor-hunting in the current log.",
                      None, signals={"mystery": 0.8},
                      effect=_d_appraise("player_took_counsel", 0.4, 0.4)),
                Reply("'The person you report to... you mean Cask? Or the keeper?'",
                      "whose_side", signals={"risk": 0.5, "mystery": 0.6}),
            ],
        ),
        "fraud_explained": Node(
            variants={
                "default": 'She teaches the way some people play music. "Buy a tired hull cheap. Insure it precious. Sail it in weather with a paper cargo — then a dark tower, a false light, and the shoals write you a cheque. The crew rows home. The underwriters pay. The only witnesses are fish." Her jaw sets. "Unless a surveyor with a camera is doing moonlight bathymetry, in which case the witnesses are *photographs*."',
            },
            replies=[
                Reply("'And the photographs are where, Merrit?' — watch her hands, not her face.",
                      None, signals={"mystery": 0.9, "detail": 0.7},
                      effect=_d_appraise("player_sees_through_me", 0.3, 0.7, touches_agenda=True)),
                Reply("'Who on this island collects the cheque?'",
                      None, signals={"action": 0.6, "mystery": 0.7},
                      effect=_d_clue("fraud_mechanism")),
            ],
        ),
        "visitors_book": Node(
            variants={
                "default": 'The visitors\' book, opened to March, turned to face you: Ida\'s tight signature eleven days running — and twice, in the same week, a name in a round complacent hand. *T. Cask.* "He has never," Merrit says, with the driest voice in the Atlantic, "in nine years, read anything in this room but the racing post."',
            },
            replies=[
                Reply("Cask, in the archive, the week she vanished. Add it to the pile growing against him.",
                      None, signals={"mystery": 0.8},
                      effect=_d_all(_d_clue("cask_in_archive"),
                                    _d_appraise("player_trusted_with_book", 0.5, 0.6))),
                Reply("Ask why she's kept this quiet — and whether she's protecting someone.",
                      "whose_side", signals={"risk": 0.4, "intimacy": 0.5}),
            ],
        ),
        "whose_side": Node(
            variants={
                "default": 'Merrit considers the question with genuine seriousness, which is itself a kind of answer. "I\'m on the side of the record," she says. "Of what actually happened, written down where money can\'t revise it." A pause, and then, more quietly: "And I was on Ida\'s side. That tense is a wound, not an admission."',
                "confessional": 'She closes the archive door. "Sit down. I\'m going to tell you the two things I know that I haven\'t told you, and you\'re going to forgive me the delay, because you\'ve been on this island five minutes and I\'ve been keeping a secret with teeth in it for three weeks."',
                "hostile": '"The side that\'s still alive when the mainland loses interest in us. Come back when you can say the same."',
            },
            replies=[
                Reply("'Was on Ida's side. Or *is*, Merrit?' — gently. Watch what hope does to her face.",
                      "the_two_things", signals={"intimacy": 0.8, "mystery": 0.9},
                      condition=lambda s, n: n.trust >= 0.55,
                      effect=_d_appraise("player_heard_the_tense", 0.5, 0.8, touches_agenda=True)),
                Reply("Give her your own answer first: why you're really here, all of it, the whole weight.",
                      "your_confession", signals={"intimacy": 0.9},
                      effect=_d_appraise("player_opened_up", 0.6, 0.7)),
                Reply("Nod and let it go. Trust ripens; it doesn't force.",
                      None, signals={"risk": -0.4, "intimacy": 0.3},
                      effect=_d_appraise("player_patient", 0.3, 0.4)),
            ],
        ),
        "your_confession": Node(
            variants={
                "default": 'You give it to her unedited: the last letter, the three weeks, the harbor-master\'s shrug that made you buy the ferry ticket. Merrit listens without once tidying anything, which you suspect is how she looks shaken. "All right," she says finally. "All right." A decision happens behind her eyes. "Keep collecting what you\'re collecting. When you have enough that I know you\'re serious — and careful — come find me. There\'s a walk we\'ll need to take."',
            },
            replies=[
                Reply("'A walk.' Don't push. Just — 'I'll hold you to it.'",
                      None, signals={"intimacy": 0.6, "mystery": 0.7},
                      effect=_d_appraise("player_confided", 0.7, 0.8)),
                Reply("Push now: 'Where, Merrit? A walk *where*?'",
                      None, signals={"action": 0.7, "risk": 0.6},
                      effect=_d_appraise("player_pushed_too_soon", -0.3, 0.6, touches_agenda=True)),
            ],
        ),
        "the_two_things": Node(
            variants={
                "default": '"Is," she says, and the word costs her the whole three weeks of carrying it. "Thing one: Ida is alive, or was nine days ago when the bread I leave at the tide-gate stopped being for the gulls. Thing two—" her voice drops to archive-quiet "—someone else has started watching the tide-gate. So the bread stays home now, and I lie awake, and then you arrived, and I have been deciding ever since whether you are the rescue or the trap." She looks at you. "Convince me."',
            },
            replies=[
                Reply("Don't perform. Just empty your pockets: every clue, every note, everything you know, on her desk.",
                      None, signals={"intimacy": 0.9, "risk": 0.7, "mystery": 0.6},
                      effect=_d_all(_d_flag("merrit_convinced"),
                                    _d_appraise("player_confided", 0.9, 0.9))),
                Reply("'The trap wouldn't have grieved. You've watched me grieve for days.'",
                      None, signals={"intimacy": 0.8, "detail": 0.5},
                      effect=_d_all(_d_flag("merrit_convinced"),
                                    _d_appraise("player_heard_the_tense", 0.7, 0.8))),
            ],
        ),
    }

    cask = {
        "start": Node(
            recall_memory=True,
            variants={
                "default": '"The mainlander!" Cask\'s arm is around the conversation before you\'ve sat down. "Terrible thing, your sister. Terrible. Anything Cask can do — boats, introductions, a word in the right ear — you only ask." The generosity is real. That\'s the unsettling part.',
                "electric": 'Cask talks faster tonight, laughs harder, buys quicker. A man performing ease. "Ask me anything! Cask\'s an open book!" An open book with pages razored out, you think.',
                "threatening": 'Cask\'s smile stays exactly where it is while everything behind it leaves. "Careful on the cliff paths, friend. Weather\'s turning. Be a shame — after coming all this way."',
                "hostile": '"Buy your own drinks tonight, mainlander." The room has gone quiet on his behalf.',
            },
            replies=[
                Reply("Play his game — swap stories, match his warmth, see what generosity shakes loose.",
                      "his_game", signals={"intimacy": 0.4, "risk": 0.3},
                      effect=_d_appraise("player_plays_along", 0.4, 0.5)),
                Reply("Ask him straight about the wrecks — a fisherman knows the shoals better than any chart.",
                      "the_shoals", signals={"mystery": 0.7, "lore": 0.5}),
                Reply("Mention, idly, that you found something of Ida's on the tideline. Watch his pupils.",
                      "the_bait", signals={"mystery": 0.9, "risk": 0.7},
                      condition=lambda s, n: "idas_camera" in s.world.clues,
                      effect=_d_appraise("player_baited_me", -0.3, 0.7, touches_agenda=True)),
                Reply("(Leave.)", None),
            ],
        ),
        "his_game": Node(
            variants={
                "default": 'An hour of stories: the winter of the three wrecks, the mainland buyers who pay cash for salvage rights, the — he catches himself, so smoothly it\'s almost invisible, and finishes a different sentence about herring. "But listen to me, talking wrecks to the grieving. Where are you off to tomorrow? I\'ll walk you."',
                "warm": 'He\'s genuinely funny, is the trouble. Twice you forget to be careful. Somewhere in the third story he mentions "the company men" and taps the table twice, like a man knocking on wood — or counting.',
            },
            replies=[
                Reply("'Mainland buyers who pay cash.' Circle back to it like you barely care.",
                      None, signals={"mystery": 0.8, "detail": 0.6},
                      effect=_d_all(_d_clue("salvage_buyers"),
                                    _d_appraise("player_caught_slip", -0.2, 0.6, touches_agenda=True))),
                Reply("Answer his 'tomorrow' with something false and specific.",
                      None, signals={"risk": 0.5, "mystery": 0.7},
                      effect=_d_all(_d_flag("baited_cask"),
                                    _d_appraise("player_evasive", -0.2, 0.5, touches_agenda=True))),
                Reply("Just enjoy the hour. Even informers are people; even wakes need laughter.",
                      None, signals={"intimacy": 0.6},
                      effect=_d_appraise("player_bought_round", 0.5, 0.5)),
            ],
        ),
        "the_shoals": Node(
            variants={
                "default": '"The Hollow shoals?" He builds you the reef in beer-rings and match-sticks, and for ten minutes he is only and entirely a fisherman, and brilliant. "Deep channel *here*, always. A sober skipper with a working light never touches stone. Never." He hears what he\'s said. The match-stick lighthouse gets knocked flat by a big casual thumb. "Unless he\'s a fool, of course. Plenty of fools at sea."',
                "threatening": '"Why would a grieving relative need to know the shoals?" He signals the barman by not signaling — the room reads him like weather. "Stick to the paths, mainlander."',
            },
            replies=[
                Reply("'A working light.' Repeat it back to him, softly, and let the silence hold the knife.",
                      None, signals={"mystery": 0.9, "risk": 0.8},
                      effect=_d_all(_d_clue("working_light_slip"),
                                    _d_appraise("player_pressed_cask", -0.5, 0.8, touches_agenda=True))),
                Reply("Buy the next round and change the subject yourself — deposit the slip in the bank.",
                      None, signals={"mystery": 0.6, "risk": -0.4},
                      effect=_d_clue("working_light_slip")),
            ],
        ),
        "the_bait": Node(
            variants={
                "default": '"On the tideline?" The bonhomie doesn\'t crack — it *pauses*, a film skipping one frame. "Sea gives things back, they say. What was it, then?" He wants the answer more than he has wanted anything all evening, and he asks it exactly as lightly as everything else.',
            },
            replies=[
                Reply("'A shoe,' you say. The wrong answer. His shoulders drop a quarter-inch: relief. Log it forever.",
                      None, signals={"mystery": 0.9, "detail": 0.8},
                      effect=_d_all(_d_clue("cask_relief_tell"),
                                    _d_appraise("player_toying", -0.3, 0.6, touches_agenda=True))),
                Reply("Tell the truth — the camera — and watch what fear does to a professional smile.",
                      None, signals={"risk": 0.9, "action": 0.6},
                      effect=_d_all(_d_clue("cask_knows_camera"),
                                    _d_appraise("player_showed_evidence", -0.6, 0.9, touches_agenda=True))),
            ],
        ),
    }

    return {"Harrow": harrow, "Merrit": merrit, "Cask": cask}


# --------------------------------------------------------------------------
# Endings
# --------------------------------------------------------------------------

def build_endings() -> list[Ending]:
    return [
        Ending(
            ending_id="reunion",
            priority=3,
            condition=lambda s: s.world.has("left_with_ida") and s.world.has("harrow_confessed"),
            epilogue=(
                "THE LIGHT KEPT\n\n"
                "It takes the mainland court two years, Harrow's testimony, "
                "Ida's photographs, and one strip of film that spent a night "
                "on your windowsill — but the company's men learn what the "
                "sea already knew: everything surfaces.\n\n"
                "Harrow serves his time and returns to a light the Trinity "
                "House lets him keep until his hands give out; he polishes it "
                "like an apology. Merrit's archive gains a locked drawer, and "
                "the visitors' book gains your name, eleven days running, "
                "every summer after.\n\n"
                "Ida never photographs the sea again. She photographs you, "
                "the harbor, the fiddle player, the bread at the tide-gate. "
                "'Patterns,' she says, when you ask why. 'I only shoot "
                "patterns I like now.'"
            ),
        ),
        Ending(
            ending_id="found_her",
            priority=2,
            condition=lambda s: s.world.has("left_with_ida"),
            epilogue=(
                "UNDER THE HOLLOW\n\n"
                "You leave on a fishing boat before dawn, Ida under a "
                "borrowed oilskin, the film sewn into your coat. The company "
                "is never named in any court — some patterns are owned by "
                "people who own courts too — but the false lantern never "
                "swings again on Vane's Hollow; too many eyes now, too many "
                "people who stood on the quay and watched you go.\n\n"
                "Harrow keeps his light and his silence. Some nights, Ida "
                "still wakes counting to eleven minutes. You hold her hand "
                "until she stops. It is enough. It is not everything, but it "
                "is enough."
            ),
        ),
        Ending(
            ending_id="the_truth_costs",
            priority=2,
            condition=lambda s: (
                s.world.has("confronted_harrow")
                and s.npcs["Harrow"].stance() == "hostile"
                and not s.world.has("found_ida")
            ),
            epilogue=(
                "NOTICE THINGS QUIETLY\n\n"
                "You get the truth. You get it the hard way — names demanded, "
                "doors closed, an old man's fear turned to flint — and the "
                "truth, obtained that way, is a document nobody will sign.\n\n"
                "Harrow reports your 'harassment' to the company men, "
                "because frightened people feed the thing that frightens "
                "them. The last ferry of the season takes you off the island "
                "with your evidence and no witnesses, and the case dies in a "
                "solicitor's drawer on the mainland.\n\n"
                "The bread at the tide-gate goes uncollected after October. "
                "You tell yourself she moved on, moved deeper, moved "
                "somewhere the watchers tired of watching. Some nights you "
                "believe it. The sea keeps the rest."
            ),
        ),
        Ending(
            ending_id="left_early",
            priority=1,
            condition=lambda s: s.world.has("took_the_boat"),
            epilogue=(
                "THE MAINLAND\n\n"
                "The island lets you go the way the sea lets go of a swimmer "
                "— without comment, closing behind you. On the mainland the "
                "file stays open a year, then a clerk's stamp closes it.\n\n"
                "You keep the letters. You do not reread them. And on certain "
                "foggy evenings, in the city where nothing is further away "
                "than the horizon, you could swear you hear a foghorn a beat "
                "late, or a beat early, asking its question somewhere it "
                "shouldn't be."
            ),
        ),
    ]


def build_pack() -> StoryPack:
    return StoryPack(
        title="THE LIGHT AT VANE'S HOLLOW",
        intro=(
            "Three weeks ago your sister Ida — wreck-surveyor, letter-writer, "
            "the family's stubborn streak given a camera — went silent on "
            "Vane's Hollow, a light-station island two hours off the coast. "
            "The harbor-master shrugged. The company that chartered her "
            "sent a form. So you bought a ferry ticket.\n\n"
            "The island knows why you've come. Three people knew her well. "
            "All three are lying to you — but not about the same thing, and "
            "not for the same reasons. The tide goes out twice a day, the "
            "fog comes in without asking, and somewhere above the north "
            "cliffs a light burns where no light should be."
        ),
        templates=build_templates(),
        npcs=build_npcs(),
        endings=build_endings(),
        dialogues=build_dialogues(),
        event_phrases=EVENT_PHRASES,
        max_beats=60,
        timeout_ending=(
            "THE SEASON TURNS\n\n"
            "Winter closes the ferry route, and the island keeps its secrets "
            "one more year. You have pieces — you will always have pieces — "
            "but the tide-gate, the caves, the eleven minutes: they wait for "
            "a spring you'll have to earn all over again."
        ),
    )
