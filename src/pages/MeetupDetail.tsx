import { useMemo } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Gamepad2,
  MapPin,
  PackageCheck,
  Star,
  Ticket,
  Users,
} from 'lucide-react'
import { meetupById } from '../data/meetups'
import { storeById, STORE_GRADIENTS } from '../data/stores'
import { playerById } from '../data/players'
import { MEETUP_META } from '../components/meetupMeta'
import { Avatar } from '../components/AvatarStack'
import { CompatRing } from '../components/CompatBar'
import { useApp } from '../context/AppContext'
import { scoreMeetup, suggestedPlayers } from '../lib/matching'
import { formatDateLong } from '../lib/format'
import type { PlayerProfile } from '../types'

export function MeetupDetail() {
  const { id } = useParams<{ id: string }>()
  const meetup = id ? meetupById(id) : undefined
  const { profile, isGoing, toggleRsvp, hasProfile } = useApp()

  const store = meetup ? storeById(meetup.storeId) : undefined

  const match = useMemo(
    () => (meetup && profile ? scoreMeetup(profile, meetup) : null),
    [meetup, profile],
  )
  const suggestions = useMemo(
    () => (profile ? suggestedPlayers(profile, 4) : []),
    [profile],
  )

  if (!meetup || !store) return <Navigate to="/discover" replace />

  const meta = MEETUP_META[meetup.type]
  const Icon = meta.icon
  const gradient = STORE_GRADIENTS[store.image] ?? STORE_GRADIENTS.ember
  const host = playerById(meetup.hostId)
  const members = meetup.memberIds
    .map((mid) => playerById(mid))
    .filter((p): p is PlayerProfile => Boolean(p))
  const going = isGoing(meetup.id)
  const spotsLeft = meetup.capacity - meetup.memberIds.length - (going ? 1 : 0)

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <div className={`relative overflow-hidden border-b border-white/10 bg-gradient-to-br ${gradient}`}>
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-night-900 via-night-900/40 to-transparent" />
        <div className="container-app relative py-10">
          <Link
            to="/discover"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to discover
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`chip border bg-black/30 ${meta.accent} backdrop-blur`}>
              <Icon className="h-3.5 w-3.5" /> {meetup.type}
            </span>
            <span className="chip border-white/20 bg-black/30 text-white/80 backdrop-blur">
              <Gamepad2 className="h-3.5 w-3.5" /> {meetup.featuredGame}
            </span>
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            {meetup.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> {formatDateLong(meetup.date)} ·{' '}
              {meetup.startTime}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {store.name.replace('GameStop · ', '')}, {store.city}
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" /> {members.length + (going ? 1 : 0)}/
              {meetup.capacity} going
            </span>
          </div>
        </div>
      </div>

      {/* ---------- BODY ---------- */}
      <div className="container-app grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="space-y-8">
          {/* match callout */}
          {match && (
            <div className="card flex flex-col items-center gap-5 p-6 sm:flex-row">
              <CompatRing score={match.score} />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-display text-lg font-bold text-white">
                  You’re a strong fit for this squad
                </h3>
                <ul className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {match.reasons.slice(0, 4).map((r) => (
                    <li
                      key={r}
                      className="chip border-lime/20 bg-lime/5 text-lime"
                    >
                      <Check className="h-3 w-3" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* about */}
          <Section title="The plan">
            <p className="leading-relaxed text-white/70">{meetup.description}</p>
          </Section>

          {/* squad */}
          <Section title={`Your squad · ${members.length + (going ? 1 : 0)} players`}>
            <div className="space-y-3">
              {going && profile && (
                <MemberRow player={profile} isYou host={false} />
              )}
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  player={m}
                  host={m.id === meetup.hostId}
                />
              ))}
              {Array.from({ length: Math.max(0, spotsLeft) })
                .slice(0, 3)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 px-4 py-3"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-white/15 text-white/30">
                      ?
                    </span>
                    <span className="text-sm text-white/40">
                      Open spot — could be you
                    </span>
                  </div>
                ))}
            </div>
            {host && (
              <p className="mt-4 text-xs text-white/45">
                Hosted by {host.avatar} {host.displayName} · a Co-Op community
                host.
              </p>
            )}
          </Section>

          {/* what to bring */}
          <Section title="What to bring">
            <ul className="grid gap-2 sm:grid-cols-2">
              {meetup.bring.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
                >
                  <PackageCheck className="h-4 w-4 shrink-0 text-power-400" />
                  {b}
                </li>
              ))}
            </ul>
          </Section>

          {/* group chat preview */}
          <Section title="Squad chat">
            <div className="card space-y-4 p-5">
              {CHAT_PREVIEW.map((c, i) => {
                const p = playerById(c.playerId)
                return (
                  <div key={i} className="flex gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-night-500 text-base">
                      {p?.avatar ?? '🎮'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white/60">
                        {p?.displayName ?? 'Player'}
                      </p>
                      <p className="mt-0.5 rounded-2xl rounded-tl-sm bg-white/5 px-3 py-2 text-sm text-white/80">
                        {c.text}
                      </p>
                    </div>
                  </div>
                )
              })}
              <p className="pt-1 text-center text-xs text-white/35">
                RSVP to unlock the full squad chat
              </p>
            </div>
          </Section>

          {/* suggested players */}
          {suggestions.length > 0 && (
            <Section title="Players you’d click with">
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map(({ player, reason }) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <Avatar player={player} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {player.displayName}{' '}
                        <span className="font-normal text-white/40">
                          @{player.handle}
                        </span>
                      </p>
                      <p className="truncate text-xs text-lime">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* RSVP card */}
          <div className="card p-6">
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5 font-display text-lg font-bold text-white">
                <Ticket className="h-4 w-4 text-power-400" />
                {meetup.priceLabel}
              </span>
              <span className="text-sm text-white/50">
                {Math.max(0, spotsLeft)} spots left
              </span>
            </div>

            {hasProfile ? (
              <button
                onClick={() => toggleRsvp(meetup.id)}
                className={`mt-5 w-full ${going ? 'btn-ghost' : 'btn-primary'}`}
              >
                {going ? (
                  <>
                    <Check className="h-4 w-4" /> You’re going — tap to cancel
                  </>
                ) : (
                  <>Reserve my spot</>
                )}
              </button>
            ) : (
              <Link to="/onboarding" className="btn-primary mt-5 w-full">
                Get matched to RSVP
              </Link>
            )}

            {going && (
              <p className="mt-3 rounded-lg bg-lime/10 px-3 py-2 text-center text-xs font-medium text-lime">
                🎉 See you there! Added to your Co-Op.
              </p>
            )}

            <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm text-white/60">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/40" />
                {formatDateLong(meetup.date)}
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/40" />
                {meetup.durationMin} min · groups of {meetup.capacity}
              </p>
            </div>
          </div>

          {/* store card */}
          <div className="card overflow-hidden">
            <div className={`relative h-24 bg-gradient-to-br ${gradient}`}>
              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:14px_14px]" />
              <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                {store.rating} · {store.distanceMi} mi
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display font-bold text-white">
                {store.name}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
                <MapPin className="h-3.5 w-3.5" />
                {store.address}, {store.city}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {store.amenities.map((a) => (
                  <span key={a} className="chip">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

const CHAT_PREVIEW = [
  { playerId: 'p-nova', text: 'lock in — who’s bringing a spare controller?' },
  { playerId: 'p-vector', text: 'got two, I’ll bring em 🎮' },
  { playerId: 'p-pixel', text: 'first timer here, is it beginner friendly? 😅' },
  { playerId: 'p-nova', text: 'totally, we mix teams so you’re never stuck. see you all there!' },
]

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

function MemberRow({
  player,
  host,
  isYou = false,
}: {
  player: PlayerProfile
  host: boolean
  isYou?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <Avatar player={player} size={44} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          {player.displayName}
          {isYou && (
            <span className="chip border-power-500/30 bg-power-600/15 text-power-300">
              You
            </span>
          )}
          {host && (
            <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-300">
              Host
            </span>
          )}
        </p>
        <p className="truncate text-xs text-white/45">
          @{player.handle} · {player.genres.slice(0, 2).join(', ')}
        </p>
      </div>
      <span className="hidden font-mono text-xs text-white/40 sm:block">
        Lvl {player.level}
      </span>
    </div>
  )
}
