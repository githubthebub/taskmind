import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  Gift,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
  Users,
} from 'lucide-react'

export function HowItWorks() {
  return (
    <div className="container-app py-14">
      {/* hero */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-eyebrow">How it works</p>
        <h1 className="heading mt-3 text-4xl sm:text-5xl">
          From solo queue to squad, IRL.
        </h1>
        <p className="mt-4 text-lg text-white/60">
          Co-Op borrows the best idea from apps like Timeleft — curated small
          groups that meet in person — and builds it for players. Here’s the
          whole flow.
        </p>
      </div>

      {/* steps */}
      <div className="mx-auto mt-16 max-w-3xl space-y-6">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card flex gap-5 p-6">
            <div className="flex flex-col items-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-power-600/15 text-power-400">
                <s.icon className="h-6 w-6" />
              </span>
              {i < STEPS.length - 1 && (
                <span className="mt-2 h-full w-px flex-1 bg-white/10" />
              )}
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-power-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-lg font-bold text-white">
                  {s.title}
                </h3>
              </div>
              <p className="mt-2 text-white/60">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* matching explainer */}
      <div className="mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-eyebrow">The matchmaking</p>
          <h2 className="heading mt-3 text-3xl">What we match on</h2>
          <p className="mt-3 text-white/55">
            Every player card feeds a compatibility score. Squads are built to
            maximize shared ground while keeping the group fresh.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNALS.map((sig) => (
            <div key={sig.label} className="card p-5">
              <span className="text-2xl">{sig.emoji}</span>
              <h3 className="mt-3 font-display font-bold text-white">
                {sig.label}
              </h3>
              <p className="mt-1 text-sm text-white/55">{sig.body}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-power-500"
                  style={{ width: `${sig.weight}%` }}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-white/40">
                {sig.weight}% weight
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* safety */}
      <div className="mt-20 rounded-3xl border border-white/10 bg-night-800/40 p-8 sm:p-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-lime/15 text-lime">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="heading mt-5 text-2xl">Safe by design</h2>
            <p className="mt-3 text-white/60">
              Meeting new people should feel exciting, not risky. Co-Op keeps
              every meetup public, hosted, and accountable.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SAFETY.map((item) => (
              <li key={item.label} className="flex gap-3">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-lime" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {item.label}
                  </p>
                  <p className="text-xs text-white/50">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* rewards */}
      <div className="mt-8 rounded-3xl border border-power-500/20 bg-gradient-to-br from-power-700/25 to-night-800 p-8 sm:p-12">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-power-300">
              <Gift className="h-6 w-6" />
            </span>
            <div>
              <h2 className="heading text-2xl">Earn PowerUp Rewards</h2>
              <p className="mt-2 max-w-lg text-white/60">
                Every meetup you attend earns XP and PowerUp points — redeemable
                for store credit, exclusive gear, and early tournament seeding.
              </p>
            </div>
          </div>
          <Link to="/onboarding" className="btn-primary shrink-0">
            Start earning <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <h2 className="heading text-3xl">Ready to find your co-op?</h2>
        <Link to="/onboarding" className="btn-primary mx-auto mt-6">
          <Sparkles className="h-4 w-4" /> Build my player card
        </Link>
      </div>
    </div>
  )
}

const STEPS = [
  {
    icon: UserRoundCheck,
    title: 'Build your player card',
    body: 'A quick quiz captures your platforms, favorite genres, play style, and vibe. It takes about a minute and becomes your matchmaking DNA.',
  },
  {
    icon: Sparkles,
    title: 'Get matched into a squad',
    body: 'Our engine finds a nearby GameStop event where the group already forming shares your tastes — then scores the fit so you know why it works.',
  },
  {
    icon: CalendarCheck,
    title: 'RSVP & see who’s coming',
    body: 'Reserve your spot, meet your squad’s profiles ahead of time, and get the store details. No mystery, no flaking.',
  },
  {
    icon: MessageSquare,
    title: 'Break the ice',
    body: 'Unlock the squad chat to sort out who’s bringing what and plan the night before you even arrive.',
  },
  {
    icon: Users,
    title: 'Meet up & play',
    body: 'Show up at your local store, press start together, and turn a match score into real friendships. Rate the meetup to sharpen future matches.',
  },
]

const SIGNALS = [
  {
    emoji: '🎮',
    label: 'Platforms',
    body: 'Shared gear means shared games. Overlap with the squad boosts your score.',
    weight: 20,
  },
  {
    emoji: '🕹️',
    label: 'Genres',
    body: 'The heaviest signal — the kinds of games you actually love to play.',
    weight: 35,
  },
  {
    emoji: '⚡',
    label: 'Vibe & style',
    body: 'Competitive vs chill, learner vs collector. We match the energy of the room.',
    weight: 25,
  },
  {
    emoji: '📍',
    label: 'Proximity & timing',
    body: 'Your city and availability keep meetups genuinely convenient.',
    weight: 20,
  },
]

const SAFETY = [
  {
    icon: ShieldCheck,
    label: 'Public venues only',
    body: 'Every meetup is at a staffed GameStop store.',
  },
  {
    icon: UserRoundCheck,
    label: 'Verified profiles',
    body: 'Real player cards, community hosts, no anon drop-ins.',
  },
  {
    icon: Star,
    label: 'Two-way ratings',
    body: 'Rate every meetup; low-rated members get filtered out.',
  },
  {
    icon: MessageSquare,
    label: 'Easy reporting',
    body: 'One tap to flag anything that feels off, any time.',
  },
]
