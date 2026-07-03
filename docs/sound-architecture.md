# TaskMind Audio: A Non-Verbal Sound Language for Jhana Absorption & Sleep

**Discipline:** Acoustic neurology × sound design × contemplative phenomenology
**Status:** Architecture specification, v0.1
**Author role:** Acoustic Neurologist / Lead Sound Designer

---

## 1. Design Philosophy

Spoken guidance is the single largest obstacle to deep absorption. Language activates
the brain's semantic and self-referential networks — precisely the machinery that must
go quiet for Jhana and for sleep onset. This system therefore replaces the human voice
with a **conditioned sound lexicon**: a small vocabulary of non-verbal acoustic events,
each paired (through repetition) with a specific somatic response.

Three principles govern everything below:

1. **Condition, don't instruct.** Each sound acquires meaning the way a bell acquired
   meaning for Pavlov's dogs: by consistent pairing with a physical state the user is
   already producing (a long exhale, a breath-hold, a body scan). After ~10–20 sessions
   the sound alone evokes the state. Text appears only in onboarding, as a "legend" that
   explains what each sound means — never during a session.
2. **The breath is the clock.** No sound is placed on a metronomic grid. Every event is
   gated to the user's respiratory phase (measured or paced), so the soundscape feels
   like a mirror of the body rather than an external demand.
3. **One-way morphology.** Across a session, every parameter moves monotonically in the
   direction of stillness: tempo only decelerates, spectral centroid only falls, space
   only widens, dynamics only decay. The brain learns that this soundscape never asks
   for re-arousal, which is what lets vigilance networks stand down.

### A note on scientific honesty (read before implementing marketing copy)

This spec uses mechanistic language as *design intent*, and the app should too. The
evidence base, stated plainly:

- **Binaural beats** produce a genuine perceptual beat and there is moderate evidence
  for relaxation/anxiolytic effects, but "brainwave entrainment" to the beat frequency
  is contested. We use the 4 Hz beat as a *conditioned stimulus* and a masking/attention
  anchor — the conditioning does the heavy lifting, not the entrainment.
- **Vagal tone** is most reliably driven by slow exhalation-dominant breathing
  (~4.5–6 breaths/min). The Anchor Trigger works because it is *trained during* that
  breathing, then triggers it by association. Sound alone does not "operate" the vagus
  nerve; sound + conditioned breath response does.
- **Adenosine** accumulates from waking metabolic activity and is cleared by sleep; no
  sound "forces" its production. What the 5-minute sequence actually does is remove the
  obstacles to the sleep pressure that already exists: it lowers cortical arousal,
  reduces sensory prediction error, and drops heart rate — so the adenosine the user has
  already built up can express itself as sleep onset. In-app text must not claim
  otherwise.

The subjective result the user experiences — "this sound drops me instantly" — is real
and reproducible. The mechanism is associative learning riding on genuinely cal