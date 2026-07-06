function tier(score: number): { label: string; color: string; bar: string } {
  if (score >= 85)
    return { label: 'Perfect squad', color: 'text-lime', bar: 'bg-lime' }
  if (score >= 70)
    return { label: 'Great fit', color: 'text-cyber', bar: 'bg-cyber' }
  if (score >= 55)
    return { label: 'Good match', color: 'text-amber-300', bar: 'bg-amber-400' }
  return { label: 'Worth a shot', color: 'text-white/60', bar: 'bg-white/40' }
}

export function CompatBar({
  score,
  showLabel = true,
}: {
  score: number
  showLabel?: boolean
}) {
  const t = tier(score)
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        {showLabel && (
          <span className={`font-semibold ${t.color}`}>{t.label}</span>
        )}
        <span className="font-mono font-bold text-white/80">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${t.bar} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function CompatRing({ score }: { score: number }) {
  const t = tier(score)
  const circ = 2 * Math.PI * 26
  const dash = (score / 100) * circ
  return (
    <div className="relative grid h-20 w-20 place-items-center">
      <svg viewBox="0 0 60 60" className="h-20 w-20 -rotate-90">
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-white/10"
        />
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={t.color}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-lg font-bold text-white">{score}</div>
        <div className="-mt-1 text-[9px] uppercase tracking-wider text-white/50">
          match
        </div>
      </div>
    </div>
  )
}
