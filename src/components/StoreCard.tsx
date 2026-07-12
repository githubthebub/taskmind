import { MapPin, Star, Users } from 'lucide-react'
import type { Store } from '../types'
import { STORE_GRADIENTS } from '../data/stores'

export function StoreCard({ store }: { store: Store }) {
  const gradient = STORE_GRADIENTS[store.image] ?? STORE_GRADIENTS.ember
  return (
    <div className="group card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-white/25">
      <div
        className={`relative h-28 bg-gradient-to-br ${gradient} p-4`}
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:16px_16px]" />
        <span className="relative inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
          {store.rating}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-base font-bold leading-tight text-white">
          {store.name.replace('GameStop · ', '')}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
          <MapPin className="h-3.5 w-3.5" />
          {store.address}, {store.city}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {store.amenities.slice(0, 3).map((a) => (
            <span key={a} className="chip">
              {a}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
          <span className="flex items-center gap-1.5 text-white/60">
            <Users className="h-4 w-4" />
            {store.activeMembers} members
          </span>
          <span className="font-mono text-xs text-white/45">
            {store.distanceMi} mi
          </span>
        </div>
      </div>
    </div>
  )
}
