# attune

**A somatic navigation instrument.** Not a meditation timer — a vehicle:
you tell it where your nervous system is, choose where you want it to be,
and it plans and guides an adaptive somatic journey to get you there in
5, 10, 20, or 40 minutes.

Zero dependencies, zero build step, zero network calls. Open
`index.html` in a browser (or serve the folder with any static server)
and everything — visuals, soundscape, spoken guidance — is generated
live on your machine. Nothing you enter ever leaves it.

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## How a journey works

1. **Check in** — mark sensations on a body map (tension / numbness /
   warmth), set four sliders (activation, ease, groundedness, clarity),
   optionally name the feeling. Answered from the body, not the story.

2. **Choose your destination** — drag a glowing point across a map of
   nervous-system states (activation × ease, the affect circumplex), or
   pick a shore: *Deep Calm, Grounded Focus, Alive & Energized, Soft &
   Open, Ready for Sleep, Release & Reset*. Fine-tune with sliders,
   choose your minutes, and watch the itinerary rebuild in real time —
   the dotted line on the map is the actual planned route.

3. **Travel** — the sequencer builds a four-phase arc:
   *Arrive → Regulate → Deepen → Integrate*, choosing real somatic
   practices to close the gap between where you are and where you're
   going: orienting, physiological sighs, extended-exhale and coherent
   breathing, vagal toning (the low "voo"), pendulation, self-holding,
   progressive release waves, TRE-style shaking, body tapping,
   resourcing, descending scans. A breath pacer, generative soundscape,
   and optional spoken guidance carry you through it.

4. **It listens** — at quiet checkpoints mid-journey, two sliders ask
   what's actually true in your body. If you're still running hot, the
   remaining route is rebuilt with stronger down-regulation; if you've
   overshot into sluggish, it gently re-charges; if you've left your
   body, it grounds. Titration, not a fixed script.

5. **Land** — mark where you actually arrived, see the distance you
   covered toward the state you chose, and save the journey. The log
   remembers the routes your nervous system has traveled.

## Why a practitioner would recognize this

- **Orient before interoception** — every journey begins with eyes-open
  orienting and contact, never a cold plunge into the body.
- **Invitational language throughout** — "you might notice…", "if it's
  comfortable…". The nervous system doesn't settle on demand.
- **The body map drives the plan** — marked tension pulls in targeted
  unwinding for those regions; numbness pulls in boundary-waking work
  (except on the way down to sleep).
- **Direction-aware breath** — exhale-weighted patterns to
  down-regulate, inhale-weighted to lift, coherent/box to steady.
- **Pendulation and resourcing** are first-class practices, and
  discharge (sighs, yawns, trembling) is normalized, not corrected.
- **Integration is a phase, not an afterthought** — states that get
  noticed get remembered; sleep journeys end by *not* bringing you back.
- Trauma-sensitive framing: everything optional, eyes-open always
  allowed, an exit on every screen.

## Code layout

| file | role |
|---|---|
| `js/state.js` | the 4-dimension state model, presets, persistence |
| `js/practices.js` | the practice library — scripts, timings, effect vectors |
| `js/sequencer.js` | plans the journey; replans it mid-session from check-ins |
| `js/audio.js` | WebAudio soundscape, breath cues, spoken guidance |
| `js/visuals.js` | living background field, breath pacer, state map |
| `js/ui.js` | screens, body map, drag interactions, session player |

Append `?fast` to the URL to run session time 12× faster (development
only).

Attune is a practice companion, not medical or psychological care.
