# Stillpoint

A breath-and-meditation web app built around a shared trigger stage and four
divergent continuation paths.

```
[ONBOARDING: contraindication gate — hard requirement, every session]
        ↓
[STAGE 0: TRIGGER — shared by all paths]
   Bhastrika/Tummo breathwork → kumbhaka retention
   User self-report tap: "Rapture Onset" (pīti)
        ↓
[PATH SELECTOR — shown AFTER the trigger]
   ┌─────────────┬──────────────────┬───────────────────┬─────────────┐
   │ Fast Settle │ Full Ānāpānasati │ Extended Tantric   │ Combo       │
   │ (soft jhāna)│ (16-step, slow)  │ (bandhas/chakras)  │             │
   └─────────────┴──────────────────┴───────────────────┴─────────────┘
```

The trigger mechanism (breath → pīti) is a distinct, shared physiological
pipeline; what the user does with the generated pīti/sukha is where the
traditions genuinely diverge, so the choice happens *after* the trigger,
when the user knows how that stage felt today.

## Design commitments

- **Self-report only.** "Rapture Onset" and "Settled" are user taps. No code
  or copy claims physiological detection of pīti, sukha, or jhāna.
- **Safety gate first, every session, no bypass.** Contraindication checklist
  (pregnancy, high blood pressure, cardiovascular conditions, epilepsy, panic
  disorder, hernia, recent abdominal surgery, glaucoma) plus environment
  affirmations (seated/lying only, never near water, never driving) precede
  Stage 0. Contraindicated users are offered gentle classic practice with no
  forceful breathing and no retention.
- **No pressure mechanics.** Retention has no countdown; a soft cap plays a
  gentle cue and a calm release prompt. Nothing auto-escalates retention
  duration or bandha intensity — changes are explicit user settings only.
  The soft cap value (`SOFT_RETENTION_CAP_SECONDS`) is a deliberately
  conservative placeholder pending clinician/teacher sign-off.
- **Stimulation tapers during settling.** Path A dims visuals, softens and
  spaces out audio, and stills the figure as the user progresses — the app
  steps back, never adds more to track.
- **Practice-gated progression.** Longer mudra chains, brisk cue tempo, and
  eyes-closed/audio-only mode unlock through demonstrated practice (sessions
  completed, learn-mode walkthroughs), never payment.
- **Private by default.** The session log (time-to-rapture-onset,
  time-to-settled, path, mudra set) lives in localStorage only, exportable as
  JSON by explicit user action. No network calls, no social features.

## The four paths

| Path | What it is |
| --- | --- |
| **A — Fast Settle** | Soft-jhāna settling (Brasington-style): pīti → sukha → ekaggatā → upekkhā, with the "Settled" self-report tap. Static dhyāna mudrā; stimulation tapers. |
| **B — Full Ānāpānasati** | The 16 steps across four tetrads, breath-cycle-paced. Post-trigger arrivals get a "start at step 5" shortcut; classic mode runs 1–16 with no trigger. Optional post-session jhāna-factor *reflection* (educational, not a detector). |
| **C — Extended Tantric** | Lock & Rise → Anchor → Launch: bandhas in traditional engagement order (jalandhara → uddiyana → mula), chakra visualization targets, and the full mudra-chain engine. Traditional-practice framing throughout. |
| **D — Combo** | Path C's engine annotated with Path B's tetrad/jhāna-factor correspondences where genuine — and explicitly labeled "personal synthesis" where not. |

## Code map

```
src/
  types.ts              shared contracts (all interfaces + component props)
  constants.ts          safety caps, defaults, tier thresholds
  data/                 spec data: 16 steps, soft-jhāna factors, bandhas,
                        chakras, tantric stages, mudra shapes, sound cues,
                        contraindications
  engine/               trigger state machine, session log, progression,
                        settings persistence
  audio/soundEngine.ts  WebAudio synthesis of the cue table (no assets)
  components/           SafetyGate, TriggerStage, PathSelector, FastSettle,
                        Anapanasati, TantricPath, ComboPath, MudraLegend,
                        SessionLogView, SettingsScreen
  components/figure/    SeatedBody / HandMudra / FaceBlob (morphing SVG figure)
  App.tsx               top-level session state machine
```

## Development

```bash
npm install
npm run dev        # vite dev server
npm run typecheck  # tsc, strict
npm run build      # typecheck + production build
```

## Safety review status

This is a development build. Before any release: the retention soft cap,
breath-pacing tempo bands, and all safety copy require review by a clinician
and an experienced teacher. The contraindication list is a hard gate, not
advice — the app never suggests overriding it.
