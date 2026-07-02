# The Waystone — Design Specification

**A ~5-minute offline text RPG for somatic stress release**

Status: design spec only (no implementation).
Audience: somatic practitioners and developers evaluating the design; written to be reviewable by a clinician before any build.

---

## 1. Purpose and design stance

The Waystone is a short, text-only, offline interactive experience intended as a *between-session tool* — something a somatic therapist or psychosomatic practitioner could hand a client dealing with everyday stress or anxiety. It guides one complete physiological arc:

> **tension → body awareness → release → settled state**

It is deliberately **not** gamified for engagement. There are:

- **No** points, scores, streaks, achievements, or daily reminders.
- **No** fail states. Every branch is a valid path; choices route the player to a better-fitting technique, never to a "worse" outcome.
- **No** open loops at the end. The experience closes fully so the nervous system isn't left in anticipation (the opposite of engagement-loop design).
- **One** complete arc per play. Replay is allowed but never prompted.

The fiction is a thin, warm wrapper — a traveler setting down a heavy pack at a wayside shelter at dusk — whose only job is to give each somatic technique a concrete, sensory image and a reason to move to the next beat.

### What this is not

- Not therapy, and not a substitute for it. The framing text says so plainly.
- Not a crisis tool. It targets everyday stress/anxiety, not acute panic or trauma processing.
- Not a claim machine. On-screen language never promises physiological outcomes ("this will calm you") — it invites ("see what you notice").

---

## 2. The arc and the room structure

Six beats ("rooms"), each built around exactly one somatic technique. Target total time: **4.5–6 minutes** (~40–60 seconds per room, longer in rooms 2 and 4).

| # | Room | Technique | Arc stage |
|---|------|-----------|-----------|
| 1 | The Path at Dusk | Orienting / external grounding | Tension → arriving |
| 2 | The Hearth | Paced breathing, extended exhale | Down-shifting |
| 3 | The Well | Interoceptive attention (noticing without fixing) | Body awareness |
| 4 | Setting Down the Pack | Progressive muscle release (branched) | Release |
| 5 | The Warm Cloak | Self-soothing touch + warmth imagery | Soothing |
| 6 | The Quiet Before the Stars | Savoring + consolidation + gentle re-orienting | Settled close |

The player's real body is the game controller. Every room pairs a line of fiction with one plain-language physical prompt, then waits for a single low-effort input ("press any key when you're ready", or a two-option choice).

### Branching philosophy

Branches exist for two reasons only:

1. **State-matching.** Bodies hold stress differently. Room 4 asks whether tension feels more "buzzy and restless" or "heavy and clenched" and routes to a matching release technique. Both branches rejoin at Room 5.
2. **Consent and safety.** Interoceptive attention can be uncomfortable or activating for some people (including trauma histories). Room 3 always offers an *exteroceptive* alternative — attending to an object or sound in the real room instead of inward sensation. Choosing it is framed as equally valid, not as skipping.

No branch is hidden, punished, or "better." The branch diagram:

```
[1 Path] → [2 Hearth] → [3 Well] ─ inward ──────────┐
                              └─ outward (object) ──┤
                                                    ▼
                        [4 Setting Down the Pack]
                          ├─ "buzzy/restless"  → shake-out & long-exhale variant
                          └─ "heavy/clenched"  → tense-and-release variant
                                                    ▼
                              [5 Warm Cloak] → [6 Quiet]
```

---

## 3. Room-by-room specification

Each room below gives: fiction snippet (illustrative, not final copy), the somatic prompt as it would appear on screen, mechanism rationale, timing, and input.

### Room 1 — The Path at Dusk (orienting / grounding)

**Fiction.** *You've been walking a long time. The pack is heavy. Ahead, a low stone shelter — a waystone — with a light in the window. You stop at the edge of its clearing.*

**On-screen prompt.**
> Before you go in: let your eyes wander around the room you're actually in. Slowly. Find three things you hadn't noticed today — a color, a shadow, the way light falls on something. There's no hurry.

**Mechanism.** Orienting responses — slow visual scanning of the real environment — are used in Somatic Experiencing to signal safety and interrupt threat-focused attention. Related "grounding" techniques (e.g., naming things you can see) are widely used clinically.

**Evidence flag: partially supported / theory-forward.** Grounding is standard clinical practice and low-risk, but the specific claim that orienting shifts autonomic state has thin direct experimental support; it's derived from SE theory, and the SE evidence base overall is modest (a small number of RCTs for PTSD, not for single-session micro-doses). Treat as plausible, not proven.

**Timing/input.** ~40s. "Press any key when your eyes have had a look around."

---

### Room 2 — The Hearth (paced breathing, extended exhale)

**Fiction.** *Inside, a small fire. The keeper is out, but the kettle is warm. The fire brightens gently as you breathe in, and settles as you breathe out.*

**On-screen prompt.**
> Breathe with the fire. In through your nose while it brightens — about four counts. Out slowly, like you're cooling tea, while it settles — about six counts. If those counts feel wrong for your body, use your own. We'll do six rounds together.

The text itself paces the player: an ASCII flame (or simple line of text, e.g., `~ in . . . . ~` / `~ out . . . . . . ~`) animates the count. Player can repeat the set once with one keypress; never nagged to.

**Mechanism.** Slow breathing (~5–6 breaths/min) with exhalation longer than inhalation increases vagally mediated heart-rate variability and shifts autonomic balance toward parasympathetic dominance; exhalation is when vagal influence on the heart is greatest.

**Evidence flag: well supported.** Slow-paced breathing is among the best-evidenced brief interventions for acute physiological down-regulation (HRV biofeedback literature; meta-analyses of slow-breathing effects on anxiety and autonomic markers; recent work on brief exhale-emphasized breathing, e.g., cyclic sighing, showing mood/arousal effects in ~5 min/day). This room is the physiological anchor of the whole experience — if the player only truly does one room, it should be this one, which is why it comes early.

**Design note.** Counts are offered, not enforced ("if those counts feel wrong, use your own") — forced breath pacing can cause air hunger or anxiety in some people. Nasal breathing suggested, not required.

**Timing/input.** ~75s (6 breaths at ~10s each, plus copy). Auto-advances after the set; optional "once more" key.

---

### Room 3 — The Well (interoceptive attention)

**Fiction.** *Behind the shelter, a stone well. Travelers pause here to look in — not to draw water, just to see what the water is doing today.*

**On-screen prompt (choice point).**
> Time to check the water. You can look inward or outward — both count.
>
> **[A] Inward:** Close your eyes or soften your gaze. Ask your body: where is today sitting in me? Maybe the jaw, the shoulders, the belly. Just find it and keep it company for a few breaths. Nothing to fix.
>
> **[B] Outward:** Pick up something nearby — a cup, a key, the edge of your sleeve. Explore it with your fingers like you've never felt it before. Temperature, weight, texture.

**Mechanism.** Option A is interoceptive attention: non-judgmental noticing of internal sensation, the core move of body-scan practice — attention *to* sensation without an agenda to change it. Option B is deliberate exteroceptive grounding for players for whom inward attention is unpleasant or activating.

**Evidence flag: moderately supported, with a known caveat.** Brief body-scan/mindful-attention exercises reliably shift self-reported state and show modest effects on arousal in meta-analyses of brief mindfulness inductions; effects of a single 45-second dose are real but small. The caveat is well documented: interoceptive focus can *increase* distress in a minority of users (anxiety sensitivity, trauma history) — hence the built-in, equally-weighted outward branch. The claim that noticing "keeps a sensation company" changes the sensation is phenomenological, not physiological — the copy is careful to promise nothing.

**Timing/input.** ~50s. One choice (A/B), then "press any key when you're ready to head back in."

---

### Room 4 — Setting Down the Pack (progressive muscle release, branched)

**Fiction.** *Your pack is still on. You'd forgotten it was there — that's how long you've carried it. The keeper's bench is wide enough to set it down, one strap at a time.*

**On-screen prompt (branch question).**
> How does the weight feel right now?
>
> **[A] Buzzy — restless, like it wants to move.**
> **[B] Heavy — clenched, like it's gripping on.**

**Branch A — shake and sigh (for restless activation).**
> Stand up if you can. Shake out your hands like you're flicking off water — ten seconds, looser than feels dignified. Then let your arms hang, take one big breath in, and let it fall out of you with a sound if you like. Twice more.

**Branch B — tense and release (classic progressive release).**
> Squeeze both fists hard — really grip, like the pack straps — and hold while the screen counts five. Then let go all at once and feel the difference travel up your arms. Now the same with your shoulders: lift them to your ears, hold... and drop. Last, scrunch your face tight... and let it go soft.

Both branches end with the same line: *The pack is on the bench. It'll keep. You don't have to carry it while you're here.*

**Mechanism.** Branch B is abbreviated progressive muscle relaxation: deliberate tension followed by release produces a contrast effect that deepens muscular relaxation and reduces sympathetic arousal. Branch A pairs gross motor discharge (shaking) with physiological sighs (double-inhale/long exhale or big-breath variants).

**Evidence flag: mixed by branch.**
- **Branch B: well supported.** PMR has decades of clinical evidence for reducing state anxiety and physiological arousal, including in abbreviated single-session forms.
- **Branch A: partially supported.** The sigh/long-exhale component is well supported (same literature as Room 2). Therapeutic "shaking"/neurogenic tremor as a release mechanism (as in TRE and some SE practice) is popular but weakly evidenced — small studies, no solid mechanism data. It's included because it's low-risk, matches restless states better than stillness does, and users subjectively report relief; the spec flags it honestly as the least-evidenced mechanic in the game.

**Timing/input.** ~70s. One choice, then screen-paced counts, auto-advance.

---

### Room 5 — The Warm Cloak (self-soothing touch + warmth imagery)

**Fiction.** *By the fire hangs a cloak, kept warm for whoever arrives. You pull it around your shoulders. It smells faintly of woodsmoke.*

**On-screen prompt.**
> If it feels okay, place one hand flat on the center of your chest, or one hand on each upper arm — whichever feels more natural. Let the hand be heavy and warm. Notice the rise and fall underneath it. If touch isn't comfortable right now, imagine warmth spreading across your shoulders instead, like sun through a window. Stay here for three slow breaths.

**Mechanism.** Self-soothing touch (hand on chest/heart, self-hug) and warmth/safety imagery are used in compassion-focused and somatic approaches to evoke felt safety and affiliative calm. Proposed mediators include oxytocin and endocannabinoid signaling associated with warmth, touch, and social safety.

**Evidence flag: emerging / speculative — worded accordingly.**
- Self-soothing touch has *some* direct experimental support: at least one controlled study found self-touch comparable to receiving a hug in blunting cortisol response to a stressor. Promising but thin.
- The **oxytocin/endocannabinoid framing is speculative at the level of this app** and must never appear in user-facing copy. Those systems respond to touch and warmth in some paradigms, but no one has shown that a text prompt to place a hand on one's chest "delivers" them. The spec permits this framing only in practitioner-facing docs, clearly labeled as hypothesized mechanism.
- Warmth imagery: supported as a relaxation/imagery technique at the subjective level; the physiological pathway is not established.

**Boundary note (non-negotiable copy rule).** Touch prompts are limited to hands, arms, shoulders, chest-as-sternum, and are written in flat, sensory language (pressure, warmth, weight, rise-and-fall). Nothing romantic, nothing arousing, no second-person body commentary beyond neutral anatomy, and always an opt-out ("if touch isn't comfortable right now...") with an imagery alternative of equal standing.

**Timing/input.** ~45s. "Press any key when the third breath is done."

---

### Room 6 — The Quiet Before the Stars (consolidation and close)

**Fiction.** *You step outside. The sky is doing that thing it does between dusk and dark. The pack is inside on the bench; you can pick it up again whenever you choose — and you'll choose how much of it to carry.*

**On-screen prompt.**
> Before you go: take stock, gently. Compared to when you arrived, is anything even a little different — shoulders, jaw, breath, the space behind your eyes? Whatever you find, let yourself actually feel it for a few seconds. Small counts. Then let your eyes wander the real room around you one more time, and when you're ready, you're done. Nothing else is asked of you.

Final screen: *The waystone stays where it is. — [end]*. No "come back tomorrow," no share button, no summary stats. The program simply ends.

**Mechanism.** Two moves: (1) **savoring/registering the shifted state** — deliberately attending to a positive or relieved state for several seconds, drawn from savoring research and from "taking in the good"-style consolidation practice; (2) **re-orienting outward** so the player leaves connected to their real environment rather than snapping abruptly from an inward state (mirrors Room 1, closing the loop).

**Evidence flag: partially supported.** Savoring interventions have decent evidence for improving momentary affect; the stronger claim popular in some somatic literature — that dwelling on a state "installs" it via memory consolidation — is speculative. The copy claims nothing beyond "let yourself actually feel it."

**Timing/input.** ~45s. Any key to end.

---

## 4. Language and tone guide

- **Plain, warm, unhurried.** Grade-6 reading level. Short sentences. No clinical vocabulary in user-facing text: never "parasympathetic," "interoception," "regulation," "nervous system," "somatic." Say "settle," "notice," "let go," "keep it company."
- **Invitational, never imperative about the body.** "If it feels okay...", "you might notice...", "if those counts feel wrong, use your own." The player can decline any prompt and still progress.
- **No outcome promises.** Banned phrases in copy: "this will calm you," "release your trauma," "activate your vagus nerve," "boost oxytocin," and any chemical or diagnostic claim.
- **Non-sexual, non-romantic by construction.** Sensory adjectives limited to weight, warmth, texture, breath, light, sound. Touch prompts follow the Room 5 boundary note. Copy review checklist includes an explicit pass for this.
- **Trauma-aware defaults.** Eyes-open always allowed; inward attention always has an outward alternative; every screen reachable with "skip" (fiction covers it: "you pass the well without looking in — that's allowed here").

---

## 5. Mechanics and technical notes (for the eventual build)

- **Format.** Pure text; runs offline. Reference implementations could be: terminal/CLI, a single self-contained HTML file, or even a printed card deck — nothing in the design requires more than text, keypress input, and a way to pace counts (which can be lines of text appearing on a timer).
- **Input.** Single keypress or A/B choice only. No typing, no puzzles, no inventory. Cognitive load is the enemy of down-regulation.
- **Pacing engine.** Timed text reveal is the only "engine" needed: breath counts and tense-hold counts render as slowly appearing characters. All timers are generous and skippable.
- **Session length guardrail.** Total copy per playthrough ≈ 700–900 words. If a draft exceeds this, cut fiction before cutting prompts.
- **Accessibility.** All body prompts include a "in whatever way your body does this" clause (e.g., shaking can be hands-only, seated; standing never required). Screen-reader friendly by nature of being text.
- **Optional practitioner mode.** A build flag that appends the pre/post rating (Section 6) and stores results locally as a plain CSV the client can share with their practitioner. Off by default; no network anywhere.

---

## 6. Evidence summary and how to test before claiming anything

### Claim ledger

| Mechanic | Physiological claim | Support level |
|---|---|---|
| Extended-exhale paced breathing (Room 2) | Increases vagal tone / parasympathetic shift, reduces state anxiety | **Well supported** |
| Progressive muscle release (Room 4B) | Reduces muscular tension and state anxiety | **Well supported** |
| Interoceptive attention (Room 3A) | Shifts subjective state; modest arousal effects | **Moderately supported**; can backfire for a minority — mitigated by outward branch |
| Orienting/grounding (Rooms 1, 6) | Signals safety, interrupts threat attention | **Partially supported / theory-forward** (SE-derived, low risk, thin direct evidence) |
| Shake-out discharge (Room 4A) | "Discharges" activation | **Weakly supported** — included for state-matching; the sigh component carries the evidence |
| Self-soothing touch (Room 5) | Blunts stress response; felt safety | **Emerging** (small controlled literature) |
| Oxytocin/endocannabinoid mediation (Room 5 rationale) | Touch/warmth engage affiliative neurochemistry | **Speculative at app level** — practitioner-docs only, never user-facing |
| Savoring/consolidation (Room 6) | Improves momentary affect; "installs" state | Affect: **moderately supported**. "Installing": **speculative** |
| The 5-minute dose overall | A single ~5-min session measurably reduces subjective stress | **Plausible but unproven for this artifact** — this is exactly what the pilot below tests |

### Minimum honest test plan

Before any efficacy language ("reduces stress") appears anywhere:

1. **Pre/post subjective rating (primary).** Single-item 0–10 "How stressed/tense do you feel right now?" immediately before Room 1 and after Room 6 (SUDS-style). Within-subject change across ≥20–30 users and multiple sessions each. This is cheap, honest, and matches the app's actual claim ceiling.
2. **A control condition.** Compare against 5 minutes of reading a pleasant but non-somatic short story in the same text interface. If The Waystone doesn't beat quiet reading, the somatic framing isn't earning anything.
3. **Optional physiology (secondary, not required).** For users with a wearable, pre/post HRV or resting heart rate. Underpowered small-sample HRV data should never be marketed; treat it as a directional sanity check only.
4. **Adverse-response item.** Post-session: "Did any part of this feel uncomfortable or make things worse? Which room?" — with special attention to Room 3A (interoception) and Room 5 (touch). Branch-level analytics (which options users pick, where they quit) are stored locally only.
5. **Practitioner review loop.** Before user testing, the full copy deck is reviewed by at least one somatic/clinical practitioner for trauma-sensitivity and the non-sexual-language checklist.
6. **Claim discipline.** Until (1) and (2) show a reliable effect: the app describes itself only as "a short guided pause" — not a stress-reduction tool.

---

## 7. Open design questions

- Should Room 2's breath count adapt (offer 4-in/6-out vs. "breathe at whatever slow pace feels easy") based on a first-run question? Simpler is likely better; test both.
- Whether Room 4's branch question ("buzzy vs. heavy") is answerable by most users, or needs example language. Pilot with think-aloud sessions.
- Whether the fiction helps or distracts. A stripped "prompts-only" variant is worth including as a third arm in testing if resources allow.
