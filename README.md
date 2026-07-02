# Stillpoint — a jhāna practice companion

A single-file, offline web app designed to get a meditator into meditative
absorption (jhāna) faster than an unstructured sit of chanting and watching
the breath's pleasantness.

**Run it:** open `index.html` in any modern browser. No build step, no server,
no network. All data stays in `localStorage` on the device.

## Why staged practice beats "30 min of aum + pleasant breath"

An unstructured sit asks you to do everything at once, with no feedback.
Stillpoint splits the path into four stages, gives each exactly one
instruction, and then fades its own supports:

| Stage | What happens | Why |
|---|---|---|
| **Settle** (~12%) | Visual breath pacer, ~5–6 breaths/min, exhale longer than inhale | Resonance-frequency breathing raises vagal tone and HRV — a physiological head start unpaced chanting doesn't give (Lehrer & Gevirtz) |
| **Anchor** (~30%) | Pacer fades; natural breath; attention rests where the breath is vivid; soft bells act as wandering probes, spacing out then stopping | External attention checks shorten unnoticed mind-wandering while the skill is still forming (Culadasa, mind-wandering research) |
| **Glow** (~25%) | Prompt to pivot attention from the breath to the most *pleasant* sensation; slight smile; drone warms | The pleasantness pivot is the core of Leigh Brasington's *Right Concentration* method — piti feeds on attention |
| **Absorb** (~33%) | Drone recedes, screen goes near-dark, prompts stop | At this point every external cue pulls you out; absorption comes from letting go, not effort |

After each sit you rate the four classical jhāna factors (stability, piti,
sukha, effortlessness) and the depth reached. That turns each session into
deliberate practice with feedback, tracked as per-factor trend lines.

## Features

- **Om-like drone** synthesized with the Web Audio API (110 Hz fundamental,
  harmonics, slow chant-like swell), optional 6 Hz theta binaural layer
  (honestly labeled experimental — entrainment evidence is mixed), or silence
- **Breath pacer** orb with configurable in/out timing (4:6, 5:5, 4:8)
- **Optional voice guidance** (device TTS) — a few quiet cues at stage changes
- **Attention bells** during Anchor that space out and stop
- **Screen wake lock** during sessions; controls auto-hide; time hidden unless peeked
- **Reflect screen**: jhāna-factor sliders, depth-reached scale, notes
- **Journey screen**: streak, hours, per-factor sparklines with hover tooltips
- **Method screen**: the full rationale, in-app

## Sources

- Leigh Brasington, *Right Concentration: A Practical Guide to the Jhanas*
- Lehrer & Gevirtz, resonance-frequency breathing / HRV biofeedback literature
- Culadasa (John Yates), *The Mind Illuminated*
- Sacchet et al., neuroimaging studies of advanced jhāna practitioners

No app produces jhāna — consistency and unbroken attention do. This one
removes the common failure points: starting tense, wandering unnoticed,
never pivoting to pleasantness, and getting no feedback.
