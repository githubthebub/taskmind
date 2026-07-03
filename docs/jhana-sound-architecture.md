# Taskmind — Jhāna & Sleep Sound Conditioning Architecture

**Working title:** *Cymatic* — a non-verbal, sound-based conditioning engine that guides the
listener from alert waking rhythm into Jhāna absorption and, optionally, into deep sleep.

**Design stance:** Written from the perspective of an acoustic neurologist and sound
designer. The system uses no human voice and no spoken language. It communicates entirely
through a compact "sound language" of frequency, spatialization, and rhythm. Text is used
only in the onboarding/legend layer to teach the listener what each sound *means* — never
during a session.

---

## 0. A note on what sound can and cannot do (read this first)

The creative brief asks for sounds that "instantly trigger an involuntary" vagal response
and that "force the brain to produce adenosine." I've kept the ambition but corrected the
mechanism, because a design built on the literal claims would fail in testing and could
mislead users about what they're experiencing. The honest version is still powerful:

- **Audio cannot instantly and involuntarily switch the vagus nerve on.** What it *can* do
  is entrain the breath and provide a rhythmic exteroceptive cue that, through *paced slow
  exhalation* and *low-frequency mechanical resonance in the chest and skull*, reliably
  shifts autonomic balance toward parasympathetic (vagal) dominance over seconds to minutes.
  The sound is the pacer and the conditioned cue; the breath is the actual lever.
- **Binaural beats do not reliably "install" a brain state on demand.** The evidence for
  strong, consistent EEG frequency-following from binaural beats is mixed and effect sizes
  are modest. They work best as a *subjective anchor and pacing scaffold*, and their power
  grows through **classical conditioning** — repeated pairing with a genuinely relaxed state
  until the sound alone evokes the association. That conditioning loop is the real engine of
  this app, and the architecture is built around it.
- **No sound "forces" adenosine.** Adenosine accumulates with time-awake and metabolic
  activity; you cannot command its release acoustically. What the sleep sequence *actually*
  does is remove arousal: it lowers stimulation, slows the breath, reduces spectral
  brightness and event density, and stops giving the cortex anything to track — which lets
  the pre-existing sleep pressure express itself. We market the *outcome* (falling asleep),
  not a false mechanism.

Everywhere below, I mark the honest mechanism as **[Mechanism]** and keep the evocative
design language separate. The app's user-facing copy should make **no medical claims** and
should carry the safety notes in §7.

---

## 1. System overview

```
                         ┌─────────────────────────────────────────┐
                         │            SESSION DIRECTOR               │
                         │  (state machine: phases, morph curves)    │
                         └───────────────┬───────────────────────────┘
                                         │ target params (per frame)
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                 │                                │
┌───────▼────────┐              ┌─────────▼─────────┐            ┌─────────▼────────┐
│ BREATH TRACKER  │  phase +    │   SOUND ENGINE     │  gains,    │  BIOSIGNAL IN     │
│ (mic / IMU /    │  breath rate │ (3 synth voices +  │  filters,  │ (optional: HRV,   │
│  manual pacer)  ├─────────────▶│  3D spatializer +  ◀────────────┤  wearable, or     │
│                 │  inhale/exh  │  master bus)       │  positions │  breath-only)     │
└─────────────────┘  gate        └─────────┬──────────┘            └──────────────────┘
                                            │ stereo / binaural / Ambisonic out
                                   ┌────────▼─────────┐
                                   │  OUTPUT ROUTER    │
                                   │ headphone (req'd) │
                                   │ vs. speaker mode  │
                                   └───────────────────┘
```

### 1.1 Core modules

| Module | Responsibility |
|---|---|
| **Session Director** | The master state machine. Owns the 5-minute (or open-ended) timeline, the morph curves between phases, and the target parameter vector sent to the Sound Engine each frame. |
| **Breath Tracker** | Estimates breath phase (inhale / hold / exhale / pause) and rate. Three tiers: mic-based (breath noise), IMU/chest-strap (motion), or a fixed metronomic pacer the user follows. This is the single most important input — the three signature sounds are all breath-gated. |
| **Sound Engine** | Real-time synthesis of the three signature voices (Anchor, Pīti, Sukha) plus a bed/pad. Handles binaural beat generation, granular/additive texture, sub-bass synthesis, filtering, and the master bus. |
| **3D Spatializer** | HRTF-based binaural spatialization (headphones) or first-order Ambisonics → speaker downmix. Controls perceived distance, elevation, and "thickness" of the Pīti texture. |
| **Biosignal In (optional)** | HRV / heart rate / movement from a wearable, used only to *adapt pacing* and to *log conditioning progress*. Never required. |
| **Conditioning Ledger** | Persists the pairing history that makes the Anchor Trigger work over time (see §6). |
| **Legend / Onboarding** | The only place text appears. Teaches the meaning of each sound before first use. |

### 1.2 Audio signal chain (per frame, ~fixed block size)

```
[Anchor voice]──┐
[Pīti voice]────┼─▶[per-voice gain + EQ]─▶[3D spatializer]─▶[master bus:
[Sukha voice]───┤                                             low-shelf tilt,
[Ambient bed]───┘                                             limiter, dither]─▶ out
                          ▲                     ▲
                          │                     │
                  breath gate            morph curve params
                 (from Tracker)        (from Session Director)
```

**Latency budget.** Breath-gated events (Pīti swell, Sukha pulse) must feel *causal* with
the body. Target end-to-end audio latency < 30 ms and breath-phase detection lag < 150 ms.
Above ~250 ms the coupling feels "laggy" and the somatic illusion breaks.

---

## 2. The Sound Language (design primitives)

Before the three signature mappings, here is the shared vocabulary. Every sound in the app
is built from these so the listener's ear learns one consistent grammar.

| Primitive | Meaning it encodes | Physical parameter |
|---|---|---|
| **Pitch height / spectral centroid** | Arousal level. High = alert, low = descending toward sleep. | Filter cutoff, carrier frequency |
| **Beat frequency (binaural)** | Target rhythm of attention. | L/R frequency difference (Δf) |
| **Spatial spread / distance** | Energy and "fullness" of the body. | HRTF distance, reverb, source count |
| **Amplitude envelope shape** | Breath phase. Rising = inhale, falling = exhale. | Attack/decay coupled to breath gate |
| **Sub-bass presence** | Groundedness / stillness. | 30–80 Hz energy |
| **Event density** | Cognitive load offered to the cortex. High = tracking, low = release. | Grains/onsets per second |

The morph across a session is essentially: **spectral centroid down, event density down,
sub-bass up, spatial motion slowing, beat frequency descending.** Everything else serves that.

---

## 3. Signature Mapping #1 — The Anchor Trigger

**Intent:** A single, instantly recognizable cue that says *"you are safe, drop in now."*
Over repeated use it becomes the conditioned on-ramp to the whole practice.

### 3.1 Specification

| Parameter | Value | Rationale |
|---|---|---|
| Carrier | **110 Hz** sine (root), delivered as L = 108 Hz / R = 112 Hz | 110 Hz is a low, chest-resonant tone historically associated with chant spaces; sits in a warm, non-fatiguing register. |
| Binaural beat | **4 Hz** (Δf), Delta/Theta border | Slow enough to feel like a "pull" toward rest; paces the *attention*, not the breath. |
| Harmonics | +1 octave (220 Hz) at −18 dB, gentle 3rd harmonic at −24 dB | Adds body without brightness; keeps it "round." |
| Envelope | 800 ms attack, long sustain, 2 s release; one soft amplitude "breath" every ~10 s | Never percussive — the anchor *arrives*, it does not strike. |
| Level | −20 LUFS integrated, true-peak ≤ −3 dBTP | Quiet enough to invite leaning-in rather than bracing. |
| Duration on entry | 20–30 s solo before other voices enter | Gives the conditioned association room to fire. |

### 3.2 [Mechanism] What actually happens

- The 110 Hz carrier produces **mechanical resonance the listener feels in the sternum and
  throat**, especially on headphones with good low-mid response or with a bone-conduction /
  transducer accessory. That interoceptive "hum in the chest" is the real somatic hook — it
  mimics the felt sense of one's own hummed chant.
- The 4 Hz binaural beat provides a slow subjective pulse to rest attention on. We do **not**
  claim guaranteed 4 Hz cortical entrainment; we claim a reliable *subjective* slow anchor.
- The vagal shift is produced by what the user *does* on hearing it: a trained, single **long
  slow exhale** (the app teaches this pairing in onboarding). Slow exhalation is the
  best-established acoustic-adjacent route to increased vagal tone / RSA. The sound is the
  trigger for the behavior; the behavior moves the nervous system.
- Its "instant" quality is **conditioned, not innate.** See §6 — the Conditioning Ledger is
  what turns this from "a nice tone" into "the sound that drops me in."

### 3.3 Engineering notes
- Generate the two carriers as phase-continuous sines; ramp Δf changes over ≥ 500 ms to avoid
  audible zipper artifacts.
- **Headphones required** for the binaural component; detect mono/speaker output and fall back
  to a monaural 110 Hz + a 4 Hz amplitude tremolo (isochronic-style) so the pacing survives.
- Keep the Anchor available as a re-centering cue on demand throughout any session.

---

## 4. Signature Mapping #2 — The Pīti Accelerator

**Intent:** During deep inhalation, a rising, thickening 3D texture that *amplifies the
subjective tingle of gathered energy* (pīti). It expands outward and upward with the breath.

### 4.1 Specification

| Parameter | Value | Rationale |
|---|---|---|
| Source | Granular/additive shimmer built from the 110 Hz series (partials 4–16), plus filtered noise "air" | Harmonically bonded to the Anchor so it feels like the same world blooming. |
| Trigger | **Inhale gate** from Breath Tracker; amplitude & spread follow inhale envelope | The texture *is* the inhale. |
| Spatial behavior | Sources start near/center; over the inhale they **fan outward and rise in elevation** (front-height in Ambisonics / HRTF), radius growing ~0.4 m → ~1.5 m | Creates the felt sense of expansion and "filling." |
| Spectral motion | Low-pass cutoff sweeps up ~400 Hz → ~4 kHz across the inhale; resonance nudged up for a subtle "sparkle" | Rising centroid = rising energy. Kept below harshness. |
| Density | Grain rate ramps with inhale depth (e.g., 8 → 40 grains/s) | More "particles" at the top of the breath = more perceived tingle. |
| Cadence | Fully retriggered each inhale; decays during hold/exhale so the Sukha pulse has room | Breath-locked, never free-running. |

### 4.2 [Mechanism] What actually happens
- Pīti tingling is largely an **interoceptive/attentional phenomenon**: focused attention on
  the body during arousal amplifies felt tactile sensation. A texture that *rises exactly with
  the inhale* uses **cross-modal congruence** (rising sound ↔ rising body energy) to direct and
  intensify that attention. This is a real, well-supported perceptual effect (auditory-tactile
  interaction, "sensory facilitation"), not a claim that sound generates nerve tingles.
- Spatial *expansion* congruent with lung expansion strengthens the embodiment illusion — the
  soundfield behaves like the breath, so the breath feels bigger.
- Because the Accelerator is **only** present on the inhale, it also becomes a covert breath
  pacer: to get more shimmer, the user naturally inhales more slowly and fully.

### 4.3 Engineering notes
- Requires reliable inhale/exhale segmentation. If only a metronomic pacer is available, gate
  off the pacer's inhale window instead of live breath.
- Ambisonics (at least 1st order) or HRTF with dynamic distance is needed for the "expansion."
  On plain stereo, fall back to a widening stereo image + rising reverb send (weaker but valid).
- Cap the ceiling of the sweep and grain density per user sensitivity setting — this voice is
  the one most likely to feel "too much" for anxiety-prone listeners.

---

## 5. Signature Mapping #3 — The Sukha Stabilizer

**Intent:** At the very bottom of the exhale, a deep resonant sub-bass pulse that "lands" the
system into stillness — the felt vibration of an AUM at rest.

### 5.1 Specification

| Parameter | Value | Rationale |
|---|---|---|
| Fundamental | **55 Hz** (one octave below the 110 Hz Anchor) with content down to ~40 Hz | An octave relationship makes it feel like the Anchor "settling" rather than a new event. |
| Character | Sine fundamental + soft even harmonics; slow ~6–8 Hz amplitude beating to imitate the throb of a sustained hum | The AUM feeling comes from slow amplitude modulation + low fundamental, not from words. |
| Trigger | **Exhale-bottom gate**: fires as the exhale completes and the natural pause begins | Rewards the *end* of the out-breath — the moment of maximal parasympathetic influence. |
| Envelope | 300 ms attack, 3–5 s decay tail bleeding into the pause | Long tail carries the listener into the silence between breaths. |
| Level | The loudest low-end moment in the mix, but centered and warm; sidechain-duck other voices under it | It should feel like the floor of the world briefly rising to hold you. |
| Spatial | Mono/centered, low or "below" elevation, minimal reverb | Grounded, close, stable — the opposite of the Pīti expansion. |

### 5.2 [Mechanism] What actually happens
- **Slow exhalation + a breath pause is the strongest lever for vagal/parasympathetic tone**
  in this whole design. The Sukha pulse *marks and rewards* that moment, reinforcing longer
  exhales and a relaxed post-exhale pause.
- Low-frequency energy (40–60 Hz) at moderate level is felt as **whole-body/bone-conducted
  vibration**, subjectively "grounding" and calming for many listeners — echoing the chest
  buzz of humming/chanting, which itself is associated with extended exhalation and vagal
  activation.
- The octave-down relationship to the Anchor gives a musical sense of *arrival and rest*
  (tension → resolution), which the brain reads as closure.

### 5.3 Engineering notes
- Sub-bass reproduction varies wildly across headphones/phone speakers. Detect capability;
  on bass-poor devices, add a low-mid "ghost" harmonic (110–165 Hz) so the *event* is still
  perceived even when 55 Hz isn't reproduced (missing-fundamental effect).
- Hard true-peak limit and DC-blocking filter; sub-bass transients are the main clipping risk.
- Fire at most once per breath; suppress if the exhale was very short (avoid rewarding rushed
  breathing).

---

## 6. The Conditioning Ledger (why the Anchor works)

The single most important architectural idea: **the signature sounds gain their power through
repeated pairing with a genuinely settled state.** This is classical conditioning, and it is
what the "instant trigger" language really refers to.

- Each session logs: sounds presented → breath slowing achieved → (optional) HRV rise →
  self-reported settledness at the end.
- The **Anchor Trigger is only introduced once the user has completed guided sessions where it
  co-occurred with real down-regulation.** Early on it's "a tone"; after N pairings it's "the
  sound that means drop in." The app tracks this and can tell the user their anchor is
  "strengthening."
- This also protects against overclaiming: the app never promises the sound *causes* the
  state on day one. It builds the association honestly and measurably.

---

## 7. Safety, contraindications, and honest UX copy

Non-negotiable, and baked into the architecture (a `SafetyGate` module that all sessions pass
through):

- **Photic/auditory stimulation & seizures.** Rhythmic low-frequency stimulation can be a
  concern for people with epilepsy. Screen at onboarding; provide a non-rhythmic "gentle" mode.
- **Sub-bass levels.** Enforce a conservative loudness ceiling; sleep/sub-bass at high SPL is
  both a hearing and a sleep-fragmentation risk. Default to quiet; require a deliberate action
  to raise the ceiling.
- **Sleep-mode auto-fade.** In sleep sequences, everything must decay to true silence — never
  loop a bed all night (arousal risk, and it disrupts sleep architecture).
- **No medical claims.** UI copy describes *experiences* ("many people feel a settling in the
  chest"), never diagnoses or guarantees. Include a "this is not medical treatment" note.
- **Not while driving/operating machinery**, standard for anything designed to induce drowsiness.
- **Binaural requires headphones**; detect and inform rather than silently degrading.

---

## 8. The 5-Minute Progressive Sequence (Alert → Absorption → Sleep onset)

A continuous morph, no hard cuts. All times approximate; the Session Director stretches or
compresses phases based on breath rate (a fast, agitated breather gets a longer Phase A).

**Global morph vector across the 5 minutes:**
`spectral centroid ↓ · event density ↓ · sub-bass ↑ · binaural Δf ↓ (from breath-capture down toward delta) · spatial motion ↓ · overall level ↓ toward silence`

### Phase A — Capture & Entrain (0:00–1:00) · *"meet the listener where they are"*
- **Sound:** Anchor enters solo (110 Hz / 4 Hz beat), but with a slightly *brighter*, more
  present bed and a gentle, clearly audible pulse at **~12–14 breaths/min** — near a typical
  resting-alert rate. Pīti shimmer is faint and quick.
- **Goal:** *Rhythm capture.* The pacing pulse starts close to the user's actual breath, so
  they lock on without effort ([Mechanism]: entrainment works by starting near the current
  rate, then leading — the "iso principle").
- **Morph:** centroid high-ish, density moderate, motion lively.

### Phase B — Lead & Deepen (1:00–2:30) · *"slow the breath, gather energy"*
- **Sound:** The pacing pulse and the Pīti/inhale coupling **slow gradually to ~6 breaths/min**
  (~0.1 Hz, the classic resonance-breathing / RSA-maximizing rate). Pīti Accelerator becomes
  prominent: each inhale blooms wider and rises. Sukha Stabilizer begins landing softly at each
  exhale bottom. Binaural Δf drifts from ~8 Hz toward ~4–5 Hz.
- **Goal:** Establish resonance breathing; build pīti on the in-breath, sukha on the out-breath.
- **Morph:** centroid falling, sub-bass rising, spatial expansion at its most dramatic.

### Phase C — Absorption / Jhāna Basin (2:30–3:45) · *"one thing, steady"*
- **Sound:** Event density drops hard — the busy shimmer thins to a **single sustained,
  slowly-breathing pad** around the 110/55 Hz world. Pīti expansion softens (energy is now
  "settled" rather than "gathering"). Sukha pulse becomes the main event, deep and regular.
  Binaural Δf sits at ~4 Hz. Spatial motion nearly stops — the field becomes a still, enclosing
  dome.
- **Goal:** A low-load, unchanging soundscape that offers the cortex *almost nothing to track* —
  the acoustic analog of unified, absorbed attention. This is the "Jhāna basin": stable,
  monotonous-in-a-good-way, spacious.
- **Morph:** centroid low, density minimal, sub-bass dominant, level beginning to ease down.

### Phase D — Decay & Heaviness (3:45–4:40) · *"let it get heavy"*
- **Sound:** Everything **decays and darkens.** Low-pass cutoff descends further (muffled,
  "underwater/blanket" quality), reverb tails lengthen, the pacing cue fades so the breath is
  now self-sustaining. Sukha pulses grow farther apart and quieter. Binaural component gently
  lowers toward the delta region and then **fades out entirely** (we don't rely on delta
  entrainment — we rely on *removing stimulation*).
- **Goal:** Remove arousal. [Mechanism] There is no adenosine "trigger"; instead we withdraw
  every cortical foothold — brightness, motion, novelty, pacing — so accumulated sleep pressure
  can take over. Heaviness is simulated by falling pitch, lengthening decay, and reduced density.
- **Morph:** centroid very low, density near zero, level low.

### Phase E — Dissolve to Silence (4:40–5:00) · *"disappear"*
- **Sound:** A final, very long Sukha tail. All voices fade below audibility on a smooth curve;
  the last thing present is the faint 55 Hz warmth, then nothing. In sleep mode this is the
  hand-off to true silence (or, if configured, an ultra-quiet pink-noise floor that itself
  fades over a further 10–20 min and stops — never loops all night).
- **Goal:** Clean exit. No loop, no re-brightening, nothing that would re-arouse a nearly-asleep
  brain.
- **Morph:** everything → 0.

**Two exit modes:** *Jhāna practice mode* ends Phase C/D with the Anchor available for
re-centering and a soft chime-free return; *Sleep mode* runs all the way through E to silence.

### 8.1 Morph curve summary (targets for the Session Director)

| Time | Phase | Breath cue (bpm) | Binaural Δf | Spectral centroid | Event density | Sub-bass | Level |
|---|---|---|---|---|---|---|---|
| 0:00 | A Capture | ~12–14 | ~8 Hz | high-mid | moderate | low | 0 dB ref |
| 1:00 | B Lead | 12→6 | 8→5 Hz | falling | high (Pīti) | rising | −2 |
| 2:30 | C Absorb | ~6 | ~4 Hz | low | minimal | dominant | −4 |
| 3:45 | D Decay | ~6→5, cue fading | 4→2, then out | very low | near zero | fading | −8 |
| 4:40 | E Dissolve | self / none | none | — | zero | long tail→0 | → −∞ |

---

## 9. Implementation recommendations (build order)

1. **Prototype the three voices** in a real-time audio environment (Web Audio API for a PWA;
   or a native engine — JUCE / SuperCollider / Pure Data — for lowest latency). Validate that
   Anchor chest-resonance, Pīti expansion, and Sukha landing are *felt*, not just heard.
2. **Breath Tracker MVP = metronomic pacer** (no sensors). Ship this first; it makes all three
   voices work without permissions. Add mic and IMU tiers later.
3. **Session Director as a data-driven state machine** — the morph table in §8.1 is literally
   the config; keep phase timings and curves in editable data, not code, so sound design can
   iterate without rebuilds.
4. **Conditioning Ledger + Legend/Onboarding** before any "instant anchor" claim reaches users.
5. **SafetyGate wraps everything** from day one (§7).
6. **Measure.** Even breath-rate-only logging lets you A/B morph curves against
   time-to-settle and self-report. Add HRV later for stronger signal.

### 9.1 Suggested tech stack (thin, ships anywhere)
- **Audio:** Web Audio API + an HRTF library (e.g. an Ambisonic/binaural renderer) for a
  cross-platform PWA; fall back to native (JUCE) if latency/DSP needs exceed the browser.
- **Spatial:** 1st-order Ambisonics internally → binaural decode for headphones, stereo/mono
  downmix otherwise.
- **State/config:** morph curves and phase tables as JSON; Session Director interpolates.
- **Persistence:** local-first ledger; optional sync. No audio of the user's breath ever leaves
  the device by default.

---

## 10. Summary

The design delivers exactly the three requested sound-to-somatic mappings and the 5-minute
Alert→Sleep morph — but grounded so it will survive contact with real listeners and real
nervous systems:

- **Anchor Trigger** — 110 Hz / 4 Hz binaural chest-resonant cue; power comes from *conditioned
  pairing* with a trained long exhale, not from an innate vagal switch.
- **Pīti Accelerator** — inhale-gated, upward/outward-expanding 3D shimmer that uses cross-modal
  congruence to *amplify attention to* bodily tingle.
- **Sukha Stabilizer** — exhale-bottom 55 Hz (AUM-like) pulse that marks and rewards the
  vagally-potent end-of-exhale pause.
- **5-minute sequence** — capture → lead to resonance breathing → low-load absorption basin →
  darkening decay → dissolve to silence; sleep is invited by *removing arousal*, not by forcing
  a neurotransmitter.

The whole system is really one loop: **pace the breath, pair the sound with settling, and let
the association deepen** — with a hard safety gate around all of it.
