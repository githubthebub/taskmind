import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { MEETUPS } from '../data/meetups'
import { STORES, storeById } from '../data/stores'
import { playerById } from '../data/players'
import { MeetupCard } from '../components/MeetupCard'
import { MEETUP_META } from '../components/meetupMeta'
import { useApp } from '../context/AppContext'
import { scoreMeetup } from '../lib/matching'
import type { MeetupType } from '../types'

const TYPES = Object.keys(MEETUP_META) as MeetupType[]
const CITIES = [...new Set(STORES.map((s) => s.city))]

type SortKey = 'match' | 'date'

export function Discover() {
  const { profile, hasProfile } = useApp()
  const [typeFilter, setTypeFilter] = useState<MeetupType | 'all'>('all')
  const [cityFilter, setCityFilter] = useState<string | 'all'>('all')
  const [sort, setSort] = useState<SortKey>(hasProfile ? 'match' : 'date')

  const items = useMemo(() => {
    let list = MEETUPS.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false
      if (cityFilter !== 'all' && storeById(m.storeId)?.city !== cityFilter)
        return false
      return true
    }).map((m) => {
      const store = storeById(m.storeId)!
      const members = m.memberIds.map((id) => playerById(id)!).filter(Boolean)
      const score = profile ? scoreMeetup(profile, m).score : undefined
      return { meetup: m, store, members, score }
    })

    list = list.sort((a, b) => {
      if (sort === 'match' && a.score != null && b.score != null)
        return b.score - a.score
      return a.meetup.date.localeCompare(b.meetup.date)
    })
    return list
  }, [typeFilter, cityFilter, sort, profile])

  return (
    <div className="container-app py-12">
      {/* header */}
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="label-eyebrow">Discover</p>
          <h1 className="heading mt-2 text-4xl">Squads forming near you</h1>
          <p className="mt-2 text-white/55">
            {items.length} meetups across {CITIES.length} cities this month.
          </p>
        </div>
        {!hasProfile && (
          <Link to="/onboarding" className="btn-primary shrink-0">
            <Sparkles className="h-4 w-4" /> Get matched
          </Link>
        )}
      </div>

      {/* match banner */}
      {hasProfile && profile && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 text-sm text-lime">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Showing your personal match scores, {profile.displayName}. Sorted
            best-fit first.
          </span>
        </div>
      )}

      {/* filters */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Type
          </span>
          <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>
            All
          </FilterChip>
          {TYPES.map((t) => (
            <FilterChip
              key={t}
              active={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-white/40">
            City
          </span>
          <FilterChip active={cityFilter === 'all'} onClick={() => setCityFilter('all')}>
            All
          </FilterChip>
          {CITIES.map((c) => (
            <FilterChip
              key={c}
              active={cityFilter === c}
              onClick={() => setCityFilter(c)}
            >
              {c}
            </FilterChip>
          ))}
        </div>

        {hasProfile && (
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-white/40">
              Sort
            </span>
            <FilterChip active={sort === 'match'} onClick={() => setSort('match')}>
              Best match
            </FilterChip>
            <FilterChip active={sort === 'date'} onClick={() => setSort('date')}>
              Soonest
            </FilterChip>
          </div>
        )}
      </div>

      {/* grid */}
      {items.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ meetup, store, members, score }) => (
            <MeetupCard
              key={meetup.id}
              meetup={meetup}
              store={store}
              members={members}
              score={score}
            />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center">
          <p className="text-5xl">🎮</p>
          <p className="mt-4 font-display text-lg font-semibold text-white">
            No meetups match those filters.
          </p>
          <button
            onClick={() => {
              setTypeFilter('all')
              setCityFilter('all')
            }}
            className="btn-ghost mt-5"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? 'border-power-500 bg-power-600/20 text-white'
          : 'border-white/12 bg-white/5 text-white/60 hover:border-white/25 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
