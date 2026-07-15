# Pokémon Sevii Adventures 🌋

A **FireRed/LeafGreen-style fan game demo** that starts where the FRLG post-game begins: the **Sevii Islands**. You arrive on One Island with a veteran team — Blastoise, Pidgeot, Gengar, Nidoking, Snorlax and Jolteon — and get pulled into Celio's hunt for the Ruby of Mt. Ember.

Built entirely in vanilla JavaScript + Canvas. **All graphics, music and dialogue are original, drawn/composed in code** — no ripped assets.

## ▶️ Play

Open `index.html` in any browser (or serve the folder: `python3 -m http.server` → `localhost:8000`).
A pre-built single-file version can be produced with `./build.sh` → `dist/pokemon-sevii.html`.

## 🎮 Controls

| Key | Action |
|---|---|
| Arrow keys / WASD | Move |
| `Z` / `Space` | A — confirm, talk, advance text |
| `X` / `Esc` | B — cancel (hold to run, too) |
| `Shift` (hold) | Run |
| `Enter` | START — pause menu (Pokémon, Bag, Save, Sound) |
| `M` | Toggle sound |

On-screen touch controls appear on mobile.

## 🗺️ The quest

**Sevii Islands (start)**
1. **One Island** — Bill walks you off the Seagallop ferry. Meet **Celio** in the Pokémon Center.
2. **Kindle Road** — coastal route north: tall-grass wilds (Spearow, Meowth, Ponyta, Psyduck, Geodude, Fearow) and three trainers.
3. **Mt. Ember** — two Team Rocket grunts guard a cave. Deal with them.
4. **Ruby Chamber** — take the Ruby back to Celio to link the island network… roll credits.
5. **Summit** — something with very hot wings waits on the perch. Bring Ultra Balls (the grandma in the island house has spares).

**Kanto mainland** — once you've met Celio, the harbor **Seagallop sailor** ferries you to the mainland (the canon Sevii→Vermilion route):
6. **Vermilion City** — Gym Leader **Lt. Surge** (Electric — bring Nidoking!). A sailor gifts **HM CUT**.
7. **Route 5** — a slim tree blocks the way north; **CUT** it. Wild Pidgey/Rattata/Oddish/Bellsprout, a hidden Pikachu, and a pond item reachable only by **SURF**.
8. **Cerulean City** — Gym Leader **Misty** (Water — bring Gengar/Jolteon). A hiker gifts **HM STRENGTH**; a river you can **SURF**.
9. **Nugget Bridge (Route 24)** → **Route 25** — a gauntlet of trainers and a Team Rocket ambush, leading to **Bill's Seaside Cottage**, where Bill gifts **HM SURF**.
10. **Cerulean Bay** — **SURF** out to open water: Tentacool, Staryu, a Swimmer, and buried treasure.

Two gym badges (Thunder, Cascade), 18 new Kanto Pokémon to catch, and every HM put to use.

## 🕹️ Everything-Allowed (Free Roam) mode

Pick **FREE ROAM** on the title screen to start with **all HMs, both gym badges, and a fully stocked bag** — no gates, no story required. From the START menu:
- **FLY** — teleport instantly between every town and route (Pallet, Viridian, One Island, Kindle Road, Mt. Ember, Vermilion, Route 5, Cerulean, Route 25). Go wherever you want, whenever you want.
- **ENCOUNTERS: ON/OFF** — switch off wild battles to explore in peace, or back on to hunt.

The whole western half of Kanto is now walkable end to end:
**Pallet Town** (Prof. Oak's Lab) ↔ Route 1 ↔ **Viridian City** ↔ Route 2 ↔ **Viridian Forest** ↔ **Pewter City** (Gym: **Brock**) ↔ Route 3 ↔ **Mt. Moon** ↔ Route 4 ↔ **Cerulean City** — which joins the eastern arc (Vermilion, Nugget Bridge, Bill's cottage) and the Sevii ferry. You can stroll from Pallet all the way to Vermilion, or Fly.

## ⚙️ Features

- Two connected regions — the **Sevii Islands** and a large, walkable slice of **Kanto** (Pallet Town all the way to Vermilion, via Viridian Forest, Pewter, Mt. Moon and Cerulean), linked by the Seagallop ferry
- **HM field mechanics**: **Surf** (ride across water, with water encounters + a rideable mount sprite), **Cut** (chop small trees), **Strength** (push boulders) — each gates real content
- **3 gyms & badges**: Brock (Pewter/Rock), Lt. Surge (Vermilion/Electric) and Misty (Cerulean/Water), each with junior trainers and a leader
- **Cave + forest zones**: Viridian Forest (bug maze) and Mt. Moon (tunnels with on-floor encounters + a Team Rocket ambush)
- **40+ Pokémon** including the Kanto starters' racks in Oak's Lab, Viridian Forest bugs (Caterpie/Weedle/Metapod/Kakuna), and Mt. Moon's Zubat/Paras/Clefairy
- Grid-based overworld with warps, NPCs (wandering, flag-driven), signs, interiors
- Full turn-based battle engine: gen-3 type chart, physical/special split by type, STAB, crits, accuracy, priority, stat stages, multi-hit, flinch, recoil, and status (PSN/BRN/PAR/SLP)
- Trainer battles (multi-Pokémon), wild encounters, a legendary static encounter
- Catching with the gen-3 shake formula, EXP + level-ups, party switching, full bag (potions, Full Heal, Revive, Ultra Balls)
- Pokémon Center healing, blackout-and-respawn
- **3 save slots** — START → SAVE picks a slot (with overwrite confirmation); the title screen's CONTINUE opens a slot picker showing each save's location, party, playtime and date. Saved to `localStorage`; the post-credits autosave writes to your current slot
- Original chiptune soundtrack (WebAudio sequencer): 9 tracks + full SFX set
- GBA-feel UI: typewriter dialogue, FRLG-style boxes, HP/EXP bar animations, location banners, ending credits

## 🧱 Code layout

```
index.html      shell + touch controls
css/            page chrome + embedded pixel fonts (OFL-licensed)
js/data.js      type chart, moves, species, trainers, items
js/sprites.js   ALL art, drawn procedurally (tiles, characters, 18 battle sprites + 6 backs)
js/maps.js      maps (built with carve helpers), NPCs, dialogue scripts
js/audio.js     chiptune sequencer + SFX
js/ui.js        text boxes, menus, bars, fades
js/engine.js    input, overworld, script runner, party/bag/save
js/battle.js    battle engine
js/main.js      title screen, ending, main loop
```

Debug helpers: `?debug=sprites` (sprite sheet), `?map=kindle&x=9&y=30` (teleport).

## ⚖️ Disclaimer

This is a free, non-commercial **fan homage** for personal/educational use. Pokémon © Nintendo / Creatures Inc. / GAME FREAK Inc. This project is not affiliated with or endorsed by them. All code, artwork, music and text here are original.
