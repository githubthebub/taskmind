# TaskMind — Lead Generation Engine

A self-contained lead-generation funnel for TaskMind, built on the playbook
Ali Abdaal actually uses and teaches: **give genuine value first, capture the
email second, nurture with a newsletter.**

## What's in the funnel

1. **Quiz lead magnet** — a 2-minute "What's your productivity style?" quiz
   (Architect / Explorer / Connector / Visionary). Quizzes convert far better
   than plain opt-in forms because visitors get a *personalised* result — but
   the result is shown only after they enter their email.
2. **Downloadable lead magnet** — the *Feel-Good Productivity Starter Kit*
   (`public/starter-kit.md`): four genuinely useful templates (Weekly Reset,
   Eat-the-Frog planner, Energy Audit, Distraction Firewall). Value first —
   it's useful even if the reader never buys anything.
3. **Newsletter opt-in** — "TaskMind Weekly", a secondary capture path for
   visitors who skip the quiz. The newsletter is the long-term relationship;
   the quiz is just the front door.
4. **Landing page** (`public/index.html`) — single benefit-driven headline,
   one primary CTA, social proof, and a no-spam promise.

## Run it

Requires Node 18+, no dependencies:

```bash
node server.js
# → http://localhost:3000
```

## Where the leads go

Leads are stored in `data/leads.json` (gitignored). Each lead records email,
optional name, capture source (`quiz` or `newsletter`), and quiz result — so
you can segment your email list by productivity style from day one.

- **Export for your email tool:** `GET /api/leads.csv`
- **Quick stats by source:** `GET /api/stats`
- **Capture endpoint:** `POST /api/leads` with `{email, name?, source, quizResult?}`

When you're ready to scale, swap `saveLead()` in `server.js` for an API call
to Kit (ConvertKit), Beehiiv, or Mailchimp — the rest stays the same.

## The principles behind it (why it's built this way)

- **Value first.** The lead magnet must be worth paying for, given away free.
- **Quiz > form.** Personalisation is the hook; the email gate sits right
  before the payoff, when motivation peaks.
- **One CTA per screen.** No nav bar, no competing links above the fold.
- **Segment from the start.** Quiz results tag every lead, so future emails
  can speak to each style specifically.
- **The list is the asset.** Social platforms rent you an audience; the email
  list is the only channel you own.
