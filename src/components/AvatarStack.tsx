import type { PlayerProfile } from '../types'

export function Avatar({
  player,
  size = 40,
  ring = 'ring-night-700',
}: {
  player: Pick<PlayerProfile, 'avatar' | 'displayName'>
  size?: number
  ring?: string
}) {
  return (
    <span
      title={player.displayName}
      className={`grid place-items-center rounded-full bg-night-500 ring-2 ${ring}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      <span aria-hidden>{player.avatar}</span>
    </span>
  )
}

export function AvatarStack({
  players,
  max = 5,
  size = 36,
}: {
  players: PlayerProfile[]
  max?: number
  size?: number
}) {
  const shown = players.slice(0, max)
  const extra = players.length - shown.length
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <Avatar key={p.id} player={p} size={size} />
        ))}
        {extra > 0 && (
          <span
            className="grid place-items-center rounded-full bg-night-600 text-xs font-semibold text-white/70 ring-2 ring-night-700"
            style={{ width: size, height: size }}
          >
            +{extra}
          </span>
        )}
      </div>
    </div>
  )
}
