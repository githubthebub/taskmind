import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { MEETUPS } from '../data/meetups'
import { STORES, storeById } from '../data/stores'
import { PLAYERS, playerById } from '../data/players'
import { MeetupCard } from '../components/MeetupCard'
import { StoreCard } from '../components/StoreCard'
import { AvatarStack } from '../components/AvatarStack'
import { MEETUP_META } from '../components/meetupMeta'
import type { MeetupType } from '../types'
import { useApp } from '../context/AppContext'

const MARQUEE_GAMES = [
  'Valorant',
  'Mario Kart',
  'Street Fighter 6',
  'Pokémon TCG',
  'Rocket League',
  'Elden Ring',
  'Super Smash Bros.',
  'Tekken 8',
  'Magic: The Gathering',
  'Celeste',
  'Overwatch 2',
  'Forza Horizon 5',
]

const MEETUP_TYPES: {
  type: MeetupType
  blurb: string
}[] = [
  { type: 'Game Night', blurb: 'Low-key couch co-op and casual ladders.' },
  { type: 'Tournament', blurb: 'Bracket play with store-credit prizes.' },
  { type: 'TCG Trade Night', blurb: 'Trade binders and battle in Standard.' },
  { type: 'Midnight Launch', blurb: 'Day-one hype with your new crew.' },
  { type: 'Retro Swap', blurb: 'Cartridge swaps and CRT throwdowns.' },
  { type: 'Speedrun Session', blurb: 'Learn tech from the sub-hour club.' },
]

export function Landing() {
  const { hasProfile } = useApp()
  const featured = MEETUPS.slice(0, 3)

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-power-600/10 blur-3xl" />

        <div className="container-app relative pb-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="animate-fade-up chip mx-auto border-power-500/30 bg-power-600/10 text-power-300">
              <Sparkles className="h-3.5 w-3.5" />
              Now matching players in the Bay Area
            </span>

            <h1 className="animate-fade-up mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              Find your{' '}
              <span className="text-gradient-power">co-op.</span>
              <br />
              Meet up at GameStop.
            </h1>

            <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg text-white/60">
              Co-Op matches you with a small squad of nearby players who love the
              same games — then sets you up to actually meet at your local
              GameStop. Real people, real controllers, one tap away.
            </p>

            <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={hasProfile ? '/dashboard' : '/onboarding'} className="btn-primary w-full text-base sm:w-auto">
                {hasProfile ? 'Go to my Co-Op' : 'Get matched free'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/discover" className="btn-ghost w-full text-base sm:w-auto">
                Browse this week
              </Link>
            </div>

            {/* social proof */}
            <div className="animate-fade-up mt-10 flex items-center justify-center gap-4">
              <AvatarStack players={PLAYERS.slice(0, 6)} size={38} max={6} />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  1,200+ players matched
                </p>
                <p className="text-xs text-white/50">
                  across 6 stores · 4.8★ avg meetup rating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-y border-white/10 bg-night-800/50 py-4">
          <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex shrink-0 animate-marquee items-center gap-3 pr-3">
              {[...MARQUEE_GAMES, ...MARQUEE_GAMES].map((g, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/60"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="container-app py-20">
        <SectionHead
          eyebrow="How it works"
          title="Three taps to your next squad"
          sub="No endless group chats. No flaking. Co-Op does the matchmaking; you just show up and play."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              step: '01',
              title: 'Build your player card',
              body: 'A 60-second quiz — platforms, genres, play style, vibe. That’s your matchmaking profile.',
            },
            {
              icon: Users,
              step: '02',
              title: 'Get matched into a squad',
              body: 'Our engine slots you with 4–8 compatible players at a nearby store event that fits your taste.',
            },
            {
              icon: CalendarCheck,
              step: '03',
              title: 'Meet up & play IRL',
              body: 'RSVP, see who’s coming, get the store details, and press start together in real life.',
            },
          ].map((s) => (
            <div
              key={s.step}
              className="card relative p-6 transition-transform hover:-translate-y-1"
            >
              <span className="absolute right-5 top-5 font-mono text-4xl font-bold text-white/5">
                {s.step}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-power-600/15 text-power-400">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- MEETUP TYPES ---------- */}
      <section className="border-y border-white/10 bg-night-800/30 py-20">
        <div className="container-app">
          <SectionHead
            eyebrow="Something for every player"
            title="Pick your kind of night"
            sub="Whatever “fun” means to you, there’s a table for it."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEETUP_TYPES.map(({ type, blurb }) => {
              const meta = MEETUP_META[type]
              const Icon = meta.icon
              return (
                <Link
                  to="/discover"
                  key={type}
                  className="group card flex items-start gap-4 p-5 transition-all hover:-translate-y-1 hover:border-white/25"
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${meta.chipBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-white">
                      {type}
                    </h3>
                    <p className="mt-1 text-sm text-white/55">{blurb}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- FEATURED MEETUPS ---------- */}
      <section className="container-app py-20">
        <div className="flex items-end justify-between gap-4">
          <SectionHead
            align="left"
            eyebrow="Happening soon"
            title="This week at your stores"
            sub="A peek at squads forming right now."
          />
          <Link
            to="/discover"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-power-400 hover:text-power-300 sm:flex"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.map((m) => (
            <MeetupCard
              key={m.id}
              meetup={m}
              store={storeById(m.storeId)!}
              members={m.memberIds
                .map((id) => playerById(id)!)
                .filter(Boolean)}
            />
          ))}
        </div>
      </section>

      {/* ---------- FEATURED STORES ---------- */}
      <section className="border-y border-white/10 bg-night-800/30 py-20">
        <div className="container-app">
          <SectionHead
            eyebrow="Your local arena"
            title="Stores built for meeting up"
            sub="Tournament rigs, TCG tables, retro corners — these aren’t just shelves."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STORES.slice(0, 3).map((s) => (
              <StoreCard key={s.id} store={s} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/stores" className="btn-ghost">
              Explore all stores <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- WHY / TRUST ---------- */}
      <section className="container-app py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'Matched, not left scrolling',
              body: 'We do the awkward part. You get a curated squad, not a 200-person Discord.',
            },
            {
              icon: ShieldCheck,
              title: 'Safe by design',
              body: 'Public store venues, staff-hosted events, verified profiles, and easy reporting.',
            },
            {
              icon: MapPin,
              title: 'Always nearby',
              body: 'Every meetup is at a real GameStop close to you — no random addresses.',
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-power-400">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-white/55">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="border-t border-white/10 bg-night-800/30 py-20">
        <div className="container-app">
          <SectionHead
            eyebrow="From the community"
            title="Players who found their people"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => {
              const p = playerById(t.playerId)!
              return (
                <figure key={t.playerId} className="card p-6">
                  <blockquote className="text-[15px] leading-relaxed text-white/80">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-night-500 text-xl">
                      {p.avatar}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {p.displayName}
                      </p>
                      <p className="text-xs text-white/45">
                        @{p.handle} · Lvl {p.level}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="container-app py-20">
        <div className="relative overflow-hidden rounded-3xl border border-power-500/30 bg-gradient-to-br from-power-700/40 via-night-700 to-night-800 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:22px_22px]" />
          <div className="relative">
            <h2 className="heading text-3xl sm:text-4xl">
              Your squad is one quiz away.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/60">
              Join the players already leveling up their weekends at GameStop.
              It’s free, and matching takes about a minute.
            </p>
            <Link
              to={hasProfile ? '/dashboard' : '/onboarding'}
              className="btn-primary mx-auto mt-8 text-base"
            >
              {hasProfile ? 'Go to my Co-Op' : 'Press Start'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

const TESTIMONIALS = [
  {
    playerId: 'p-nova',
    quote:
      'I moved here knowing nobody. Two Co-Op tournament nights later I’ve got a five-stack I queue with every week.',
  },
  {
    playerId: 'p-mochi',
    quote:
      'The TCG trade nights are unreal. Matched me with collectors who actually had the cards on my wishlist.',
  },
  {
    playerId: 'p-glitch',
    quote:
      'Found my speedrun crew through Co-Op. We meet at the Berkeley store every other week now. Best thing ever.',
  },
]

function SectionHead({
  eyebrow,
  title,
  sub,
  align = 'center',
}: {
  eyebrow: string
  title: string
  sub?: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="label-eyebrow">{eyebrow}</p>
      <h2 className="heading mt-3 text-3xl sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-white/55">{sub}</p>}
    </div>
  )
}
