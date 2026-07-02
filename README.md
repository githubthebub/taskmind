# lull.

**For the moment you're actually in.**

A silent, 60–120 second intervention for the moments meditation apps miss.
No account, no audio, no course, no streak, no subscription. One HTML file.

Open `index.html` in any browser — phone or desktop. Everything runs and stays
on the device.

---

## Why this beats Headspace (the Rory Sutherland argument)

Give an engineer $100M and he'll make the train faster. Give it to a marketer
and he'll put beautiful people and champagne on board, and passengers will ask
for the train to *slow down*. And if you want to beat a 7-star restaurant,
don't compete on what it does brilliantly — find what it and all its rivals
are bad at, and become the best in the world at *that*.

Headspace, Calm, Balance and Waking Up all compete on the same axis: more
content, better narrators, prettier animations, longer courses. A faster
train. So Lull doesn't race them. It's built entirely on the four things the
whole category is bad at:

### 1. They're bad at the actual bad moment
Meditation apps require you to *plan to be calm*: headphones, a quiet room,
ten free minutes, a decision made in advance. But nobody's problem is the
quiet room. The problem is the 90 seconds **before the scary meeting**, the
**2am spiral**, the **furious reply you're about to send**. Lull's home
screen isn't a content library — it's the question *"Right now —?"* with six
bad moments, one tap deep:

| The moment | The intervention | Time |
|---|---|---|
| Something scary is coming | Physiological sigh ×3, then the fear→excitement relabel | 90s |
| My head won't stop (2am) | The Worry Vault: park it until 10am, then a wind-down breath | 2min |
| I'm about to snap | Ten breaths, one disarming line per breath | 100s |
| Everything is too much | Extended exhales, then one-thing triage | 2min |
| I can't start | The sixty-second contract: the smallest move, done badly on purpose | 60s |
| I'm stuck waiting | Found Time: the wait becomes the session | open-ended |

Every technique ships with a one-line **receipt** — the evidence it rests on
(Stanford's physiological sigh work, Harvard's anxiety-reappraisal studies,
CBT-I worry postponement) — shown *after* the session, never as homework
before it.

### 2. They're bad at silence
Every competitor is audio-first, which makes them useless exactly where bad
moments happen: open-plan offices, meetings, trains, the queue, next to a
sleeping partner. Lull is **silent by design** — a breathing orb you follow
with your eyes, text you read, a vibration you feel. Champagne for the
context they all ignore.

### 3. They're bad at people who lapse
Streaks convert a missed day into guilt, and guilt into churn — punishing
precisely the users who need help most. Lull has **no streaks**. Your record
only counts up and never expires, and a gap in it is read out loud as what it
is: *you were fine, which was always the goal.* The Worry Vault even turns
your own history into the product: it remembers what fraction of your parked
worries you dismissed in daylight — personal, accumulating proof that the 2am
brain is a liar.

### 4. They're bad at the time you already have
The category asks for *new* minutes from people who feel they have none —
while everyone stands in queues, sits on delayed trains, and listens to hold
music every single week. **Found Time** is the Sutherland special: it doesn't
shorten the wait, it changes who owns it. A count-up clock of "time
reclaimed" and a rotating line of reframes. The delay doesn't shrink; it
stops being theirs.

### And one thing they're bad at that nobody says out loud
They monetise anxiety about your own anxiety: a $70/year subscription and an
account before you've exhaled once. Lull is a single file. No sign-up, no
paywall, no analytics. *"Nothing you type here ever leaves this device"* is
printed on the front page, because for an app that hears your 2am worries,
privacy isn't a policy — it's the feature.

---

## Tech

- One self-contained `index.html` — zero dependencies, zero network calls
- Vanilla JS state machine; screens are template functions
- Breathing engine drives the orb with per-phase CSS transforms; falls back to
  static guidance under `prefers-reduced-motion`
- All state (lifetime minutes, moment counts, parked worries) in `localStorage`
- Haptic phase cues via the Vibration API where available
- Night-first palette — the app assumes it will be opened in the dark
