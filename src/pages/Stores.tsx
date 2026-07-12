import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Search, Star, Users } from 'lucide-react'
import { STORES, STORE_GRADIENTS } from '../data/stores'
import { MEETUPS } from '../data/meetups'
import { MEETUP_META } from '../components/meetupMeta'
import { relativeDay } from '../lib/format'

export function Stores() {
  const [query, setQuery] = useState('')

  const stores = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? STORES.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.region.toLowerCase().includes(q),
        )
      : STORES
    return [...filtered].sort((a, b) => a.distanceMi - b.distanceMi)
  }, [query])

  return (
    <div className="container-app py-12">
      <div className="max-w-2xl">
        <p className="label-eyebrow">Stores</p>
        <h1 className="heading mt-2 text-4xl">Find your home store</h1>
        <p className="mt-2 text-white/55">
          Every Co-Op meetup happens at a real GameStop set up for play. Find the
          one closest to you.
        </p>
      </div>

      {/* search */}
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-white/15 bg-night-800 px-4 focus-within:border-power-500 sm:max-w-md">
        <Search className="h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by city or store…"
          className="w-full bg-transparent py-3 text-white outline-none placeholder:text-white/30"
        />
      </div>

      {/* list */}
      <div className="mt-10 space-y-4">
        {stores.map((store) => {
          const gradient = STORE_GRADIENTS[store.image] ?? STORE_GRADIENTS.ember
          const upcoming = MEETUPS.filter((m) => m.storeId === store.id)
          return (
            <div
              key={store.id}
              className="card flex flex-col gap-5 overflow-hidden p-5 md:flex-row md:items-center"
            >
              {/* thumb */}
              <div
                className={`relative grid h-32 w-full shrink-0 place-items-center rounded-xl bg-gradient-to-br ${gradient} md:h-28 md:w-44`}
              >
                <div className="absolute inset-0 rounded-xl opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:16px_16px]" />
                <span className="relative font-display text-3xl font-bold text-white/90">
                  {store.city
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </span>
              </div>

              {/* info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-white">
                    {store.name}
                  </h3>
                  <span className="chip border-amber-400/25 bg-amber-400/10 text-amber-300">
                    <Star className="h-3 w-3 fill-amber-300" /> {store.rating}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
                  <MapPin className="h-3.5 w-3.5" /> {store.address},{' '}
                  {store.city}, {store.region} · {store.distanceMi} mi
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {store.amenities.map((a) => (
                    <span key={a} className="chip">
                      {a}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-white/45">
                  <Users className="h-3.5 w-3.5" /> {store.activeMembers} active
                  members
                </p>
              </div>

              {/* upcoming at this store */}
              <div className="shrink-0 border-t border-white/10 pt-4 md:w-56 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Upcoming
                </p>
                <div className="space-y-2">
                  {upcoming.slice(0, 2).map((m) => {
                    const meta = MEETUP_META[m.type]
                    const Icon = meta.icon
                    return (
                      <Link
                        key={m.id}
                        to={`/meetup/${m.id}`}
                        className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${meta.accent}`} />
                        <span className="truncate">{m.title}</span>
                        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase text-white/40">
                          {relativeDay(m.date)}
                        </span>
                      </Link>
                    )
                  })}
                  {upcoming.length === 0 && (
                    <p className="text-sm text-white/35">Nothing scheduled yet</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {stores.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-4 text-white/60">No stores match “{query}”.</p>
          </div>
        )}
      </div>
    </div>
  )
}
