# CYBERNETIC JHĀNA ENGINE — System Blueprint & Validation Spec

A single-file, **offline-first, client-side** biofeedback application. The camera
estimates your pulse from micro-color changes in skin (remote photoplethysmography,
"rPPG") using an in-browser FFT, and a closed control loop adapts sound, visuals,
haptics, and on-screen text to that live signal. **Zero external cloud or API
dependencies. Nothing leaves the device. No build step.**

Open `index.html` in any modern browser, or run the playable version linked from the
project. Grant camera access and sit still ~30s while it finds your baseline.

---

## ⚠️ Honesty & safety boundary (read this)

This is a **real, working feedback toy — not a medical device.**

- Webcam heart rate is a genuine, published technique but a **rough estimate**; it is
  easily degraded by lighting, motion, and skin tone. **HRV/RMSSD from a webcam is
  especially noisy** and should be read as a coarse trend indicator, not a clinical value.
- The engine does **not** diagnose, treat, or clinically measure your nervous system.
- The "neuro-lexicon" cues are **meditation-style attention prompts** grounded in real,
  boring psychology — *positive reappraisal* and *savoring* (attending to a neutral
  sensation and letting it feel mildly pleasant). They are framed as **invitations**.
  They are **not** commands, and they make **no claim** to force neurotransmitter release,
  override the prefrontal cortex, or guarantee any altered state. Ignore any cue that
  doesn't fit.
- The completion screen suggests carrying a calm state into your next task. That's a
  gentle nudge, not an instruction — the app never locks you out or coerces you.
- If you feel unwell, dizzy, or distressed, **stop.** This is not a substitute for
  professional mental-health or medical care.

---

## Architecture

Signal path, end to end, all in one file:

```
getUserMedia (camera)
      │  video frames
      ▼
ROI mean color        face → green channel (best rPPG SNR)
(central 46% box)      finger-on-lens → red channel (strong perfusion)
      │  scalar sample @ ~30 Hz, timestamped
      ▼
Ring buffer (10 s) ── uniform linear resample @ 30 Hz
      │
      ├── Frequency domain: detrend (moving-avg high-pass) → Hann window
      │        → radix-2 FFT → peak in 0.7–4 Hz (42–240 bpm)
      │        → HR (parabolic-interpolated) + spectral coherence
      │
      └── Time domain: one-pole bandpass → adaptive-threshold beat detect
               → inter-beat intervals → RMSSD (HRV proxy)
      ▼
Autonomic balance  A ∈ [−1,+1]   (+ parasympathetic / − sympathetic)
   A = 0.45·(baselineHR−HR)/8 + 0.30·(coh−0.28)/0.28 + 0.25·(HRV−25)/45
       (down-weighted when signal coherence is poor)
      ▼
JSON state machine (hysteresis + peak-hold)
      ▼
Actuators:  Web Audio  ·  Haptics  ·  Canvas  ·  Generative text
```

### 1. Native camera biometric sensor (rPPG)
- `navigator.mediaDevices.getUserMedia` → hidden `<video>`.
- Each frame is drawn to an 80×60 offscreen canvas; the central ROI's mean color is read.
- A radix-2 iterative FFT (implemented from scratch, no libraries) runs continuously on a
  detrended, Hann-windowed 10-second window. Peak bin in the cardiac band gives HR;
  spectral concentration gives a coherence/SNR score.
- Validated in-repo: FFT recovers a known 1.25 Hz sine, and the full pipeline recovers
  55–120 bpm from synthetic PPG to within a few bpm (see self-tests below).

### 2. Cybernetic biofeedback loop (JSON state-transition engine)
States are **data**, not code (`STATES` + `TRANSITIONS` objects). Each state declares its
actuator targets. Transitions use hysteresis so the loop doesn't chatter, plus a sustained
peak-hold before entering `peak`.

| State | Trigger (balance A) | Carrier tone | Breath pacer | Haptics | Visual field |
|---|---|---|---|---|---|
| `sympathetic` | A < −0.18 (high stress) | **90 Hz deep** | 8.0 s (7.5/min), long exhale | slow double-pulse | active block-matching field |
| `neutral` | −0.10 ≤ A ≤ 0.34 | 120 Hz | 6.5 s | even pulse | settling lattice |
| `parasympathetic` | A > 0.40 (vagal rise) | 150 Hz | 5.5 s (coherent) | soft heartbeat | single-point mandala |
| `peak` | A > 0.72 held ~7 s | 162 Hz pure | 5.5 s | whisper | pure mandala |

On stress the oscillator **glides** (no jump) down to the deep 90 Hz resonant tone and the
haptic/breath pacer slows to gently pull respiration down. As parasympathetic tone rises,
the canvas **crossfades** from the busy block-matching field into a high-purity single-point
mandala (`absorption` parameter eased 0→1), shifting from distraction-blocking to
single-pointed focus.

### 3. Generative neuro-lexicon
Cues are synthesized, not static: per-state phrase templates × a bank of **present-sensation
anchors** (cool air at the nostrils, fingertip pressure, weight of the hands). The current
state selects the register; an anchor is substituted in. Framed as savoring / reappraisal
invitations — never medical claims (see safety boundary).

### 3b. Breath-key game + reading confidence (validation loop)
The user follows the on-screen breath pacer with **W = inhale, S = hold, D = exhale, A = aum/rest**
(or taps the four phase buttons on mobile). This does two honest jobs:

- **Cross-checks the optical signal.** Heart rate rises on inhalation and falls on exhalation
  (*respiratory sinus arrhythmia*, RSA). The engine tags every HR sample with the user's reported
  phase and computes mean HR during reported inhale vs exhale. A positive swing (inhale HR > exhale HR)
  is independent evidence the pulse read is real — and the swing magnitude is itself a genuine vagal-tone
  indicator, folded into the autonomic-balance estimate.
- **Powers a confidence bar + error range.** A `Reading confidence` value (0–100%) blends spectral SNR
  (0.42), HR temporal stability (0.24), buffer warm-up (0.14), and RSA coupling once the game is engaged
  (0.20). Every reading is shown as a **probable range** (e.g. `HR likely 68–76, ±4`) whose width grows as
  confidence drops. Low confidence is stated plainly ("low — noisy signal"), so a bad read never masquerades
  as a good one. RMSSD carries an intentionally wide band because webcam HRV is inherently noisy.

A **clinical read-out** narrates the state in a grounded psychologist / neurochemistry voice — naming
mechanisms as *associations* ("states like this are associated with…"), never as measured claims, and always
restating how much to trust the current signal.

**Input modes (you choose how the loop closes):**
- **Lead — Guided vs Detect.** *Guided:* the app prescribes the phase on a pacer clock and scores how well you
  match it. *Detect:* the app follows you — it shows the phase it believes you're in, inferred from your inputs,
  and drops the scoring.
- **Pace — Adaptive vs Manual.** Adaptive lets the state machine slow you down under stress (the original
  cybernetic behavior). Manual pins the breath cadence to a slider (3–10 breaths/min).
- **Mic (optional).** A separate `getUserMedia` audio stream + `AnalyserNode`. It detects a sustained **aum**
  hum via autocorrelation pitch + low spectral flatness (recovered 90–300 Hz in tests), and **breath airflow**
  via broadband energy (audible airflow ⇒ exhale, the quiet after ⇒ inhale — a labeled heuristic). Detected
  phases feed the same RSA coupling check, so a wrong guess just lowers confidence rather than lying.
- **Camera-derived respiration (bonus).** Breathing modulates the pulse baseline, so the low-frequency band
  (0.1–0.5 Hz) of the optical signal yields a breaths/min estimate with no keys or mic — shown in the loop panel.

### 4. Full local data integration
`localStorage` schema (`cje.v1`): baseline HR, and per session — duration, avg HR,
peak coherence, whether peak was reached, and **time-to-first-calm** (shift velocity).
Graceful **in-memory fallback** when storage is sandboxed/blocked (e.g. some embedded
frames), reported in the UI. On sustained peak coherence the app surfaces an
**exit-driven completion screen** inviting you to carry the steadiness into your next
real-world action, then saves the session.

---

## Self-testing & validation

The app ships an in-browser validation suite (bottom of the page, "Re-run self-tests")
that audits the DSP and state machine against known inputs — no placeholders, real assertions:

1. FFT recovers a known 1.25 Hz sine (→75 bpm)
2. Full pipeline detects ~66 bpm from synthetic PPG
3. RMSSD computes correctly on a known IBI series
4. Balance −0.5 → `sympathetic`
5. Balance +0.6 → `parasympathetic`
6. Lower HR + high HRV → positive balance
7. Lexicon substitutes its sensation anchor (no `{…}` left)
8. Storage layer persists a session record (and reports mode)
9. Resampler yields a finite uniform grid from a sparse buffer
10. No stray template placeholders anywhere in the lexicon corpus
11. Breath cycle maps fractions to inhale→hold→exhale→aum in order
12. Game accuracy rises on a correct key, falls on a wrong one
13. Low confidence widens the HR ± error band
14. RSA coupling detects inhale-HR > exhale-HR
15. Autocorrelation pitch recovers a known hum (aum detection)
16. Manual pace maps breaths/min → seconds/breath
17. Detect mode logs the phase without scoring

The frequency-domain math is additionally validated headless in Node
(`node scratch dsp_test.js` reproduces 55–120 bpm detection within a few bpm).

**Design choice:** implemented as dependency-free vanilla JS (not a TypeScript build) so it
runs with **zero install and zero build step** — the honest way to hit the "offline,
zero-dependency, just open it" requirement. Types are enforced by the runtime self-tests
rather than a compiler.

---

## Files
- `index.html` — the complete standalone app (open directly; works offline).
- `app_body.html` — body-only source (same code) used to publish the hosted playable version.
- `CYBERNETIC_JHANA_ENGINE.md` — this blueprint.

## Run it
- **Locally:** open `index.html`. For camera access some browsers require a secure context —
  `https://`, or `localhost` (e.g. `python3 -m http.server` then visit `http://localhost:8000`).
  `file://` works for the visuals/audio/sim but may block the camera.
- **No camera?** The app auto-falls back to a simulation that drives the full loop, so it's
  always playable.
