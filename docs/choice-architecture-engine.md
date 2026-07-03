# Choice Architecture Engine — Design Blueprint

**Role stack:** Interface Design × Behavioral Psychology × Meditation Architecture
**Function:** An interactive triage center that intercepts high-arousal mental triggers and converts a limbic impulse into a deliberate, forecasted choice.
**Target user profile:** ~90 days of strict celibacy; high sympathetic baseline; strong incentive salience attached to sexual cues; stated goal of transmuting arousal energy into absorption practice (jhāna).

---

## 0. Design Thesis: Why Choice Architecture, Not Willpower

Three findings anchor the entire system:

1. **The hot–cold empathy gap (Loewenstein).** Decisions made in a cold state do not survive contact with a hot state unless they are *externalized*. The user cannot be trusted to re-derive his values mid-surge; the app must present decisions he already made, at the moment he can no longer make them.
2. **The deliberation interrupt.** An urge executes as limbic autopilot. Forcing a *comparative evaluation* — reading forecasts, weighing scores — recruits prefrontal circuitry and dissolves the automaticity. The Assessment Matrix is not a menu; it is the intervention. By the time the user has read three Outcome Forecasts, 30–90 seconds have passed and the initial noradrenergic spike has already begun to decay.
3. **Reactance avoidance.** Forbidden options gain salience ("don't think of a white bear"). Therefore the indulgence path is *always displayed as a legitimate option*, fully costed. The app never says no. It says: *here is exactly what each door costs, choose with your eyes open.* This converts suppression (which rebounds) into decision (which doesn't).

A calibration note, stated once and honored everywhere: the physiological forecasts below are **mechanistic hypothesis models, not universal claims**. The app presents them as predictions and then *scores itself* against the user's own logged outcomes (§4), tightening or correcting the numbers over time. Clinical precision includes being honest about error bars.

---

## 1. The Dynamic Assessment Matrix

### 1.1 Trigger Intake (≤ 5 seconds, two taps)

Speed is non-negotiable: every second of friction is a second the fantasy loop runs unopposed.

- **Tap 1 — Intensity:** a vertical thermometer, 1–10. (Interoceptive labeling alone is a micro-intervention: affect labeling measurably dampens amygdala response — "name it to tame it," Lieberman et al.)
- **Tap 2 — Vector:** `Visual cue` / `Memory` / `Spontaneous-somatic` / `Boredom-drift`. The vector matters because it changes which exit works (§1.4).

Optional passive inputs, if granted: time of day, hours since sleep, wearable HRV, days-into-practice, and the user's own outcome history. These drive the *dynamic* in Dynamic Assessment Matrix — the scores below are recomputed per-episode, not static copy.

### 1.2 The Dashboard

Four cards, presented in randomized order (position bias would otherwise become a hidden nudge, and the system's credibility depends on the user believing the numbers, not the layout):

---

**PATH 1 — THE FANTASY LOOP** *(indulgence path, fully costed, never hidden)*

- **Outcome Forecast (2–12h):**
  - *0–20 min:* steep phasic dopamine climb with narrative elaboration; each imagery "scene change" is a fresh prediction-reward hit — this is why the loop self-extends.
  - *If it terminates in orgasm:* prolactin/oxytocin release, acute sympathetic discharge, then a refractory trough — subjectively: lethargy, motivation dip, and (for this user, 90 days in) a sharp identity-consistency violation that reads as low mood for 12–48h. Cue-reactivity to similar triggers measurably *increases* over the following days (each completion re-consolidates the cue→reward association).
  - *If it doesn't terminate:* sustained elevated arousal with no discharge — sleep latency worsens, restlessness climbs, and the fantasy is rehearsed, i.e., *strengthened* for next time.
  - *Mental clarity:* working memory is occupied for the duration; expect 30–60 min of degraded focus post-loop even without completion.
- **Utility Rating:** **1.5 / 10** (non-zero, honestly: it does deliver short-term relief and the forecast says so — a rating of 0 would read as propaganda and cost the app its authority).
- **Jhāna Accessibility Probability (next 12h):** **≤ 5%.** Absorption requires a unified, energetically stable mind; both the discharge trough and the non-discharge restlessness preclude it.

---

**PATH 2 — THE SOMATIC PIVOT** *(interoceptive redirect — urge surfing, weaponized)*

- **Mechanism:** arousal is ~80% body sensation narrated by ~20% imagery. Drop the narration, and what remains is heat, pressure, tingling — raw energy with no storyline. Attention is moved *into* the sensation field (pelvis, spine, chest) with the instruction to observe location, temperature, and movement, never content. This is classical urge-surfing (Marlatt) fused with body-scan mechanics.
- **Outcome Forecast (2–12h):** urge peak passes in 90 s–4 min without reinforcement; no trough, no rebound. The cue→reward association receives an *extinction trial* instead of a consolidation trial — compounding value across weeks. Clarity returns within ~10 min; the retained arousal typically reads afterward as usable energy (alert, warm, motivated).
- **Utility Rating:** **8 / 10** when intensity ≤ 7. Degrades at intensity 8–10, where attention placed *in* the pelvis can amplify rather than defuse — the matrix knows this and demotes the card at high intensity (§1.4).
- **Jhāna Accessibility Probability:** **40–60%** — the pivot itself is samādhi training; a successfully surfed urge often leaves the mind *more* collectible than baseline.

---

**PATH 3 — THE VISUAL GUIDE CORE** *(externally anchored breath entrainment → §2, §3)*

- **Mechanism:** at high intensity, the mind will not hold a subtle internal object; it needs an external anchor with enough salience to *win the bidding war* against fantasy imagery. This path deploys the Visual Engine (§2): a generated visual anchor whose salience is deliberately matched to urge intensity, coupled to a fixed breath protocol.
- **Outcome Forecast (2–12h):** 10–20 min to down-shift; respiratory pacing at 4–6 breaths/min drives vagal tone up (measurable RSA/HRV increase); arousal is not discharged but *re-bound* to a new object. Expect elevated pleasant affect (pīti conditions) for 1–3 h post-session.
- **Utility Rating:** **9 / 10** at intensity 7–10. Overkill below 5 (session cost ~15 min).
- **Jhāna Accessibility Probability:** **55–75%**, the highest on the board — this path *is* jhāna practice with training wheels. Carries the board's only relapse-vector warning if Option A is selected (§2.3), which the card states explicitly.

---

**PATH 4 — THE KINETIC DISCHARGE** *(somatic override: cold exposure / high-intensity movement)*

- **Mechanism:** state change by brute physiology — 90 s cold water or 3 min of maximal-effort squats/burpees. Cold triggers a large catecholamine release that *overwrites* the arousal signature; intense exertion redirects blood flow and consumes the sympathetic charge.
- **Outcome Forecast (2–12h):** fastest urge-kill on the board (< 3 min); mild fatigue; no extinction learning (the cue was escaped, not defused — attention was trained on nothing).
- **Utility Rating:** **7 / 10** as an emergency brake; **4 / 10** as a habit (pure avoidance builds no capacity).
- **Jhāna Accessibility Probability:** **25–35%** — body is settled but attention is scattered post-exertion.

### 1.3 Card Anatomy

Every card renders: sparkline of the 12-h forecast trajectory · Utility /10 · Jhāna % · **"last 5 times you chose this"** (the user's own logged outcomes — self-confrontation with one's own data is more persuasive than any generated number) · single large SELECT target.

### 1.4 Dynamic Score Modulation

The matrix re-weights per episode. Selected rules:

| Signal | Adjustment |
|---|---|
| Intensity ≥ 8 | Somatic Pivot −2 utility; Visual Guide Core promoted to top emphasis; Kinetic Discharge surfaced as "first, then—" chain option |
| < 6 h sleep last night | All jhāna probabilities −15 pts (absorption under sleep debt is rare); forecast copy notes it |
| Trigger vector = Visual cue | Visual Guide Core Option A **locked out** for this episode (like-for-like visual substitution is highest-risk when the trigger was itself visual — §2.3) |
| Trigger vector = Boredom-drift | Fantasy Loop forecast appends: "this urge is a boredom proxy — 70% of your boredom-vector episodes dissolved in < 2 min" (if the user's data supports it) |
| 22:00–02:00 local | All utility ratings recalculated for sleep-adjacency; Kinetic Discharge demoted (pre-sleep catecholamines) |
| User's trailing outcome log | Bayesian update: forecasts drift toward *his* measured response, not the population prior (§4) |

---

## 2. Visual Engine Configurator — The Higgsfield Asset Matrix

Invoked when Path 2 or 3 is selected. Conceptualized as pre-generated, high-fidelity cinematic video loops (Higgsfield-class text-to-video), cached on device — generation latency at trigger-time would be fatal to the intervention window.

### 2.1 The Attention Physics Problem This Solves

A mind at intensity 8 given a subtle object (breath at the nostrils) will lose it in seconds: fantasy imagery has orders of magnitude more incentive salience, and salience determines what wins the attentional bidding war. You do not beat a high-salience stimulus with a low-salience instruction. You beat it with a **competitively salient stimulus that is structurally incapable of narrative** — then you taper the salience once entrainment is established. That is the entire design logic of the two options and the bridge between them.

### 2.2 Option A — The Grounded Aesthetic

A photorealistic female guide delivering direct, rhythmic breathing instruction. The pleasant aesthetic is the *hook* — it captures the salience network that fantasy was about to occupy — and every generation parameter is engineered to make that hook narratively inert:

**Asset generation constraints (the anti-fantasy spec):**

1. **Framing:** head-and-shoulders only, centered, fixed camera. No body framing, no camera moves, no cut-ins. Zoom and reframing are narrative grammar; deny the grammar.
2. **Wardrobe/context:** composed, professional-neutral (instructor coding, not intimacy coding). Setting: flat, softly lit, contextless — no bedroom, no location that affords a storyline.
3. **Direct gaze, metronomic address.** Second-person imperative only ("Breathe in — two — three — four"). No self-disclosure, no name, no reactive dialogue, no smile-escalation across the loop. Parasocial narrative requires a *character arc*; the guide is granted none.
4. **Loop architecture:** 8–12 s segments, seamlessly looped, with **zero progression** between loops. Fantasy is fundamentally *sequential* — scene A leads to scene B. A perfect loop is sequence-proof: there is no "next," so elaboration has nothing to grip. This single constraint does more anti-relapse work than any content filter.
5. **Voice:** cadence locked to the session's breath protocol (e.g., 4-4-6-2), pitch flat-warm, no breathiness. The voice is a metronome wearing a timbre.
6. **Breath-visible animation:** the guide visibly breathes the protocol — shoulders, nostrils — so the user has a *modeling* target (mirror-system entrainment), not just an auditory count.

**Why this works (stated clinically):** an attractive face is among the highest-priority stimuli the visual system processes. Option A doesn't fight that; it *conscripts* it. The face holds exogenous attention effortlessly (zero effort cost during the hardest minutes), while the rhythmic instruction attaches that captured attention to a motor-respiratory task. Arousal energy is not suppressed — it is re-bound to breath at the moment of maximum capture.

### 2.3 Option A Risk Register (displayed to the user, not hidden)

- **Relapse vector:** the bridge can become the destination. Mitigations, all enforced in software:
  - **Dose ceiling:** guide visible for a maximum of 5 minutes per session, then mandatory crossfade to Option B or black (§3, Phase 4). The fade is non-negotiable and the user is told so at selection time (pre-commitment beats in-session negotiation).
  - **Compliance gating:** loop playback continues only while breath compliance is detected (mic-based breath sensing or camera chest-rise detection). Watching without breathing = the screen dims to 20% within two breath cycles. The asset is a *payment for entrainment*, never on-demand content.
  - **Vector lockout:** unavailable when the trigger was a visual cue (§1.4).
  - **Habituation rotation:** guide appearance is rotated across a generated set per session-count, preventing single-figure parasocial attachment.
- **Escalation telltale monitoring:** if post-session logs show rising "fantasy-fork" counts (§3, Phase 3) across sessions, the configurator auto-biases toward Option B and says why.

### 2.4 Option B — The Cosmic Abstract

Fluid, high-resolution cosmic geometry / galaxy matrix / luminous amorphous form, pulsing in strict synchrony with the breath protocol.

**Spec:**

1. **Breath mapping:** radial expansion on inhale, contraction on exhale, luminosity plateau on retention. The mapping is *causal in feel* — the user's breath appears to drive the cosmos. (With mic sensing it literally does: closed-loop, ±150 ms latency budget.)
2. **Palette trajectory:** session opens in deep blues/violets (low arousal-color association), migrates toward white-gold as the session progresses — a deliberate analog of **nimitta development**, pre-training the mind's expectation that stability brightens.
3. **No figurative content, no symmetry breaks, no event moments.** Events invite meaning-making; meaning-making invites narrative; narrative is the enemy.
4. **Frequency:** pulse locked to 4–6 breaths/min protocols (peak HRV resonance band, ~0.1 Hz).

**Role:** Option B is both the low-intensity default and the *destination* of every Option A session. It is the kasina of the system — the object subtle enough that concentrating on it is real samādhi training, not stimulus-assisted holding.

### 2.5 Configurator Selection Logic

| Episode state | Serve |
|---|---|
| Intensity ≥ 7, vector ≠ visual | **A → B bridge** (salience-matched capture, then taper) |
| Intensity ≥ 7, vector = visual | **B**, preceded by Kinetic Discharge offer |
| Intensity ≤ 6 | **B** directly |
| Rising fantasy-fork trend across sessions | **B**, with explanation |
| User override | Always available — agency is the product; but the override is logged and its outcomes are shown to him next time |

---

## 3. The Step-by-Step Interactive Transition (Selection → Execution)

State machine: `SELECT → COMMIT → PRE-LOAD → INDUCTION → COUPLING → INTEROCEPTIVE PIVOT → ABSORPTION TAPER → FADE-OUT → LOG`.

### Phase 0 — COMMIT (10 s)

One screen, one sentence, one tap. An **implementation intention** in if–then grammar (Gollwitzer — if–then plans outperform goal intentions by pre-loading the response into the cue):

> *"If imagery or storyline arises, then I return to the count on the very next inhale."*

Tap = commitment. The screen also states the Option A dose ceiling ("the guide fades at minute 5 regardless") so the taper is a kept promise, not an in-session surprise.

### Phase 1 — PRE-LOAD (60 s, screen dark, audio only)

Somatic staging before any visual appears — the visual must land on a body already tilting parasympathetic:

1. Posture cue: sit tall, sternum lifted (upright posture is bidirectional with arousal regulation).
2. **Three physiological sighs** (double-inhale, long exhale) — the fastest known voluntary down-shift of sympathetic tone.
3. Jaw, tongue, pelvic-floor release cue, in that order. The pelvic-floor cue is deliberate and clinical: at high arousal the user is guarding there, and guarding *is* attention pinned to the pelvis.

### Phase 2 — INDUCTION (minutes 0–2): capture

Option A fades in. Instructions to the user, verbatim from the app:

1. **Fix the gaze at the glabella / eye region of the guide. Soft focus. Do not scan.** Visual scanning is the gateway drug of fantasy — elaboration begins with the eyes wandering to a new region and the mind asking a question about it. One fixation point, held, forecloses the question. Peripheral vision stays wide open (wide periphery is itself parasympathetic-leaning; tunnel vision is a threat posture).
2. **Adopt the breath on the second cycle.** No preparation, no getting-ready — the guide is already breathing; join in progress. (Joining an ongoing rhythm entrains faster than initiating one.)
3. Count silently on her cadence, exhale-weighted (4 in, 6 out). The count is the *task*; the face is the *metronome*. The app's phrasing: **"She is a clock, not a character."**

### Phase 3 — COUPLING → INTEROCEPTIVE PIVOT (minutes 2–5): the Ekaggata maneuver

This is the core of the blueprint — the exact mechanism by which a pleasant visual becomes a jhāna factor instead of a fantasy seed.

**Step 3a — Locate the pleasantness in the body, not on the screen.**
The instruction, delivered once by the guide's voice at minute 2: *"Something in this is pleasant. Find where the pleasantness registers in your body — chest, face, hands — and rest your attention there while the count continues."*
This is the pivot from **exteroceptive to interoceptive**: the visual generated a pleasant affect; the affect has a somatic address (typically diffuse chest warmth, facial softening); attention now takes the *sensation* as object. The image demotes itself from object to background trigger. In jhāna terms: the meditation object is migrating from the anchor to the arising **pīti**, which is exactly the canonical progression.

**Step 3b — Amplify by attention, not by imagery.**
Attention is a gain amplifier: whatever sensation is attended to intensifies. The user is instructed to *widen* the pleasant warmth on each exhale — spread it across the chest, down the arms — without adding any pictures to it. Spreading practice converts localized pīti toward diffuse sukha and, critically, keeps the energy *moving and dispersing* rather than pooling.

**Step 3c — The fantasy-fork detector (taught as a discrimination skill).**
The user must be able to tell, in under one second, which side of the line he is on. Two clinical telltales, both taught in onboarding and printed on the commit screen:

- **The time signature.** The anchor is *present-tense and static*: a face, a count, a warmth, now. Fantasy is *narrative*: it has sequence, a next moment, a "she then—". **The instant anything has a plot, it is fantasy.** Detection phrase: "Is there a *next*? Then fork."
- **The body signature.** Anchor-generated pīti is *diffuse and rising* (chest, face, crown). Fantasy arousal is *localized and descending* (pelvic pooling, genital focus). The location of the energy is a hardware-level readout that cannot lie.

**Fork response protocol (no drama, no self-report, no penalty):** on detecting a fork — exhale fully, drop attention to the palms for one full breath cycle (maximally distal from the pelvis, high receptor density, affectively neutral), then return to the count. One motion, rehearsed. If **three forks occur within 90 seconds**, the app auto-crossfades to Option B without comment: the bridge has been outbid and salience-matching has failed for this episode; continuing to fight on that terrain reinforces the loop. If arousal has localized pelvically and stays localized for two consecutive check-ins, same auto-switch, plus exhale-lengthening (4-8) for one minute.

**Step 3d — Compliance is the currency.** Throughout Phases 2–3, breath sensing gates the display (§2.3). The engineered contingency: *the pleasant stimulus is only available to a breathing, counting mind.* This is straight operant architecture — the reinforcer is delivered contingent on the target behavior, so the target behavior (entrained breath + single-pointed attention) is what gets strengthened, not the viewing.

### Phase 4 — ABSORPTION TAPER (minute 5 onward)

By now either pīti has a stable somatic foothold or it doesn't; both cases have a defined path:

1. **Guide fade:** over 60 s, Option A crossfades into Option B (the abstract inherits the exact pulse cadence — the rhythm survives the object swap, so entrainment carries across). Over the following minutes, if attention remains stable, Option B itself dims toward black. Object hierarchy: **face → abstract → breath+pīti alone**. Training wheels come off in the same order every session, so the mind learns the corridor.
2. **The handoff instruction:** *"The warmth no longer needs the screen. Close your eyes and let the warmth be the whole object."* Ekaggatā (one-pointedness) is now on an internal object with pleasant affect — the access-concentration doorway. The app goes fully silent and dark; a session timer runs; the user sits.
3. **If stability was not reached:** the session ends at minute 12 in Option B with slow-taper audio, and the log records an honest partial. A settled, non-relapsed nervous system is a full success at the behavioral layer even when the meditative layer didn't open — and the forecast engine records it exactly that way.

### Phase 5 — LOG (15 s, two taps)

Post-state (1–10 calm, 1–10 clarity) + one binary: *did the urge return within the hour?* (push-prompted at T+60 min). This feeds §4.

---

## 4. The Feedback Spine (What Makes Every Number Honest)

Every forecast, utility rating, and jhāna probability is a **prior**; every logged episode is **evidence**; the matrix runs a per-user Bayesian update nightly.

- Forecast lines gain confidence intervals that *narrow with n*: "clarity at +2h: 7.1 ± 0.8 (your last 14 Somatic Pivots)."
- Jhāna Accessibility Probability converges to the user's measured base rates per path × intensity × time-of-day cell.
- The Fantasy Loop card's forecast is populated by *his own* logged aftermaths, quoted back verbatim where he wrote free-text ("felt foggy all morning — you, March 12"). Nothing the app generates will ever be as persuasive as his own handwriting.
- Weekly review surfaces one metric above all others: **fantasy-fork count per Option A session, trending**. Falling = the discrimination skill is consolidating and the bridge is working. Rising = the configurator biases to Option B and the app says so plainly.

**Termination by design:** success is measured by *decreasing reliance on Option A* and, ultimately, decreasing app opens per week. The engine is scaffolding. A choice architecture that the user still needs at month 12 has failed; the corridor it trains — trigger → deliberate choice → somatic pivot → absorption — is meant to run, eventually, on bare attention with no screen at all.

---

*Blueprint v1.0 — conceptual design document. Forecast figures are mechanism-derived design priors intended for per-user calibration, not medical claims.*
