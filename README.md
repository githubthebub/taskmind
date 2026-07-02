# Sukha — an instrument for savoring the breath

A single-file, zero-dependency web app for hyperfocusing on the **pleasantness of breath** —
the concentration practice of finding whatever is even faintly enjoyable in breathing and
dwelling there until the mind wants to stay.

Open `index.html` in any browser. That's the whole install.

## How it works

A warm ember of light breathes with you. **When any part of a breath feels good — the cool
at the nostrils, the settling of an exhale — press and hold, anywhere on screen** (or hold
the space bar). The ember warms and blooms while you savor; let go when the feeling fades,
then go looking for it again. That hunt is the practice.

- **Paces** — Natural (unpaced), Coherent 5½·5½, Soften 4·6, Box 4·4·4·4, and 4·7·8.
- **Whispers** — sparse serif prompts that point attention toward the pleasant
  ("Where in the body does this breath feel nicest?"). Set to often, sparse, or none.
- **Sound** — a synthesized breath-tide that swells with the inhale, an airy shimmer that
  opens while you savor, an optional warm drone, and struck-bowl bells to open and close
  the sit. All generated with the Web Audio API; no audio files, no network.
- **Afterglow** — each sit ends with a savoring trace (how warm you were, moment by
  moment), savor-hold stats, and a plain-numbers table.
- **Keepsakes** — sits, minutes, and day-streak are kept in `localStorage`. Nothing
  leaves your device.

Also: screen wake-lock during sits, a subtle haptic tick on savor (where supported),
keyboard control (space to savor, Esc to end), and `prefers-reduced-motion` support.

## Why "Sukha"

*Sukha* is the Pali word for the quality of ease and gladness that concentration practice
cultivates by deliberately attending to what is pleasant in the breath — the approach
taught in breath-meditation traditions and modern jhāna instruction. The app is a small
biofeedback loop for exactly that move: notice pleasantness → mark it → watch it grow.
