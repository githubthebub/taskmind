import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  Gamepad2,
  LogOut,
  Pencil,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { meetupById } from '../data/meetups'
import { storeById } from '../data/stores'
import { playerById } from '../data/players'
import { MeetupCard } from '../components/MeetupCard'
import { MEETUP_META } from '../components/meetupMeta'
import { rankMatches } from '../lib/matching'
import { formatDate, relativeDay } from '../lib/format'
import type { PlayerProfile } from '../types'

export function Dashboard() {
  const { profile, rsvps, resetProfile } = useApp()

  const matches = useMemo(
    () => (profile ? rankMatches(profile) : []),
    [profile],
  )

  if (!profile) return null

  const goingMeetups = rsvps
    .map((id) => meetupById(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort((a, b) => a.date.localeCompare(b.date))

  const recommended = matches
    .filter((m) => !rsvps.includes(m.meetup.id))
    .slice(0, 3)

  const xp = profile.level * 40 + rsvps.length * 25
  const xpToNext = 100
  const xpProgress = Math.min(100, ((xp % xpToNext) / xpToNext) * 100)

  return (
    <div className="container-app py-12">
      {/* ---------- PROFILE HEADER ---------- */}
      <div className="card overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-power-700/50 via-grape/30 to-night-700">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.25)_1px,transparent_0)] [background-size:18px_18px]" />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-night-700 bg-night-500 text-4xl">
                {profile.avatar}
              </span>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold text-white">
                  {profile.displayName}
                </h1>
                <p className="text-sm text-white/50">
                  @{profile.handle} · {profile.city}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/onboarding" className="btn-ghost text-sm">
                <Pencil className="h-4 w-4" /> Edit card
              </Link>
              <button
                onClick={resetProfile}
                className="btn-ghost text-sm text-white/50 hover:text-white"
                title="Sign out & reset demo"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* stat row */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Level" value={String(profile.level)} icon={Trophy} />
            <Stat
              label="Meetups"
              value={String(rsvps.length)}
              icon={CalendarClock}
            />
            <Stat
              label="Play style"
              value={cap(profile.playStyle)}
              icon={Gamepad2}
            />
            <Stat label="Vibe" value={profile.vibe.split(' ')[0]} icon={Sparkles} />
          </div>

          {/* xp bar */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-white/70">
                Level {profile.level} → {profile.level + 1}
              </span>
              <span className="font-mono text-white/50">
                {xp % xpToNext} / {xpToNext} XP
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-power-500 to-grape transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* interests */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {profile.platforms.map((p) => (
              <span key={p} className="chip">
                {p}
              </span>
            ))}
            {profile.genres.map((g) => (
              <span key={g} className="chip border-grape/25 bg-grape/10 text-grape">
                {g}
              </span>
            ))}
          </div>

          {(profile.badges?.length ?? 0) > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.badges!.map((b) => (
                <span
                  key={b}
                  className="chip border-amber-400/25 bg-amber-400/10 text-amber-300"
                >
                  🏅 {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- UPCOMING ---------- */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="heading text-2xl">Your upcoming meetups</h2>
          <Link
            to="/discover"
            className="text-sm font-semibold text-power-400 hover:text-power-300"
          >
            Find more →
          </Link>
        </div>

        {goingMeetups.length > 0 ? (
          <div className="mt-6 space-y-3">
            {goingMeetups.map((m) => {
              const store = storeById(m.storeId)!
              const meta = MEETUP_META[m.type]
              const Icon = meta.icon
              return (
                <Link
                  key={m.id}
                  to={`/meetup/${m.id}`}
                  className="group card flex items-center gap-4 p-4 transition-all hover:border-white/25"
                >
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border ${meta.chipBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-bold text-white group-hover:text-power-300">
                      {m.title}
                    </p>
                    <p className="truncate text-sm text-white/50">
                      {store.name.replace('GameStop · ', '')} · {m.startTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs uppercase tracking-wide text-power-400">
                      {relativeDay(m.date)}
                    </p>
                    <p className="text-xs text-white/40">{formatDate(m.date)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mt-6 card flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-4xl">🕹️</p>
            <div>
              <p className="font-display font-semibold text-white">
                No meetups on your calendar yet
              </p>
              <p className="mt-1 text-sm text-white/50">
                Reserve a spot and your squad shows up here.
              </p>
            </div>
            <Link to="/discover" className="btn-primary">
              Browse meetups
            </Link>
          </div>
        )}
      </section>

      {/* ---------- RECOMMENDED ---------- */}
      {recommended.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-power-400" />
            <h2 className="heading text-2xl">Matched for you</h2>
          </div>
          <p className="mt-1 text-white/50">
            Ranked by how well the squad fits your player card.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((m) => (
              <MeetupCard
                key={m.meetup.id}
                meetup={m.meetup}
                store={m.store}
                members={m.members.filter(
                  (p): p is PlayerProfile => Boolean(p),
                )}
                score={m.score}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- FRIENDS ROW ---------- */}
      <section className="mt-12">
        <h2 className="heading text-2xl">Your network</h2>
        <p className="mt-1 text-white/50">
          Players you’ve met through Co-Op meetups.
        </p>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {['p-nova', 'p-vector', 'p-pixel', 'p-mochi', 'p-glitch']
            .map((id) => playerById(id)!)
            .map((p) => (
              <div
                key={p.id}
                className="card flex w-40 shrink-0 flex-col items-center gap-2 p-5 text-center"
              >
                <span className="text-3xl">{p.avatar}</span>
                <p className="text-sm font-semibold text-white">
                  {p.displayName}
                </p>
                <p className="text-xs text-white/40">Lvl {p.level}</p>
                <span className="chip mt-1">{p.genres[0]}</span>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Trophy
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
      <Icon className="h-4 w-4 text-power-400" />
      <p className="mt-2 truncate font-display text-lg font-bold text-white">
        {value}
      </p>
      <p className="text-xs text-white/45">{label}</p>
    </div>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
