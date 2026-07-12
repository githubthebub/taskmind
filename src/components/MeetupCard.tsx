import { Link } from 'react-router-dom'
import { Clock, MapPin, Users } from 'lucide-react'
import type { Meetup, PlayerProfile, Store } from '../types'
import { MEETUP_META } from './meetupMeta'
import { AvatarStack } from './AvatarStack'
import { CompatBar } from './CompatBar'
import { formatDate, relativeDay } from '../lib/format'

export function MeetupCard({
  meetup,
  store,
  members,
  score,
}: {
  meetup: Meetup
  store: Store
  members: PlayerProfile[]
  score?: number
}) {
  const meta = MEETUP_META[meetup.type]
  const Icon = meta.icon
  const spotsLeft = meetup.capacity - meetup.memberIds.length

  return (
    <Link
      to={`/meetup/${meetup.id}`}
      className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Header band */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span
          className={`chip border ${meta.chipBg} font-semibold`}
        >
          <Icon className="h-3.5 w-3.5" />
          {meetup.type}
        </span>
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-white/50">
          {relativeDay(meetup.date)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {meetup.featuredGame}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-tight text-white group-hover:text-power-300">
          {meetup.title}
        </h3>

        <div className="mt-3 space-y-1.5 text-sm text-white/60">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-white/40" />
            <span className="truncate">
              {store.name.replace('GameStop · ', '')} · {store.city}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-white/40" />
            {formatDate(meetup.date)} · {meetup.startTime}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <AvatarStack players={members} size={30} />
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/50">
            <Users className="h-3.5 w-3.5" />
            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
          </span>
        </div>

        {typeof score === 'number' && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <CompatBar score={score} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm font-semibold text-white/80">
            {meetup.priceLabel}
          </span>
          <span className="text-sm font-semibold text-power-400 transition-transform group-hover:translate-x-0.5">
            View squad →
          </span>
        </div>
      </div>
    </Link>
  )
}
