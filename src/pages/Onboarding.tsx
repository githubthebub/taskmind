import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
import type {
  Genre,
  PlayStyle,
  PlayerProfile,
  Platform,
  Vibe,
} from '../types'
import { useApp } from '../context/AppContext'
import { topMatch } from '../lib/matching'
import { MEETUP_META } from '../components/meetupMeta'
import { AvatarStack } from '../components/AvatarStack'
import { CompatRing } from '../components/CompatBar'
import { formatDateLong } from '../lib/format'

const AVATARS = ['🦊', '🐼', '👾', '🤖', '🐉', '🦄', '🐙', '🦖', '🌟', '🔥', '🍄', '🎮']
const PLATFORMS: Platform[] = ['PlayStation', 'Xbox', 'Switch', 'PC', 'Retro', 'Mobile']
const GENRES: Genre[] = [
  'FPS / Shooter',
  'Fighting',
  'RPG',
  'MOBA',
  'Racing',
  'Sports',
  'Party / Co-op',
  'Horror',
  'Strategy',
  'TCG / Tabletop',
  'Speedrun',
  'Retro / Arcade',
]
const PLAY_STYLES: { value: PlayStyle; label: string; emoji: string; desc: string }[] = [
  { value: 'competitive', label: 'Competitive', emoji: '🏆', desc: 'I’m here to win.' },
  { value: 'casual', label: 'Casual', emoji: '🍿', desc: 'Just here for fun.' },
  { value: 'social', label: 'Social', emoji: '🎉', desc: 'The people > the score.' },
  { value: 'completionist', label: 'Completionist', emoji: '💯', desc: '100% or nothing.' },
]
const VIBES: Vibe[] = [
  'Chill & friendly',
  'Hyper-competitive',
  'Here to learn',
  'Trade & collect',
  'Meet new people',
]
const AVAILABILITY = ['Weeknights', 'Weekends', 'Weekday mornings']
const CITIES = ['San Francisco', 'Oakland', 'Berkeley', 'San Jose', 'Daly City']
const GAME_SUGGESTIONS = [
  'Valorant',
  'Elden Ring',
  'Mario Kart',
  'Street Fighter 6',
  'Pokémon TCG',
  'Rocket League',
  'Overwatch 2',
  'Zelda: TotK',
  'Celeste',
  'Baldur’s Gate 3',
  'Magic: The Gathering',
  'FC 25',
]

const STEPS = ['You', 'Platforms', 'Genres', 'Style', 'Games', 'Match'] as const

export function Onboarding() {
  const navigate = useNavigate()
  const { setProfile, profile } = useApp()

  const [step, setStep] = useState(0)
  const [matching, setMatching] = useState(false)

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [handle, setHandle] = useState(profile?.handle ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[0])
  const [city, setCity] = useState(profile?.city ?? CITIES[0])
  const [platforms, setPlatforms] = useState<Platform[]>(profile?.platforms ?? [])
  const [genres, setGenres] = useState<Genre[]>(profile?.genres ?? [])
  const [playStyle, setPlayStyle] = useState<PlayStyle | null>(
    profile?.playStyle ?? null,
  )
  const [vibe, setVibe] = useState<Vibe | null>(profile?.vibe ?? null)
  const [favoriteGames, setFavoriteGames] = useState<string[]>(
    profile?.favoriteGames ?? [],
  )
  const [availability, setAvailability] = useState<string[]>(
    profile?.availability ?? [],
  )

  const builtProfile = useMemo<PlayerProfile>(
    () => ({
      id: 'me',
      handle: (handle || displayName || 'player').toLowerCase().replace(/\s+/g, '_'),
      displayName: displayName || 'Player One',
      avatar,
      level: 1,
      city,
      platforms,
      genres,
      playStyle: playStyle ?? 'social',
      vibe: vibe ?? 'Meet new people',
      favoriteGames,
      availability: availability.length ? availability : ['Weekends'],
      badges: ['New player'],
    }),
    [
      handle,
      displayName,
      avatar,
      city,
      platforms,
      genres,
      playStyle,
      vibe,
      favoriteGames,
      availability,
    ],
  )

  const match = useMemo(
    () => (step === 5 ? topMatch(builtProfile) : null),
    [step, builtProfile],
  )

  const canAdvance = [
    displayName.trim().length > 1,
    platforms.length > 0,
    genres.length > 0,
    playStyle !== null && vibe !== null,
    favoriteGames.length > 0 && availability.length > 0,
    true,
  ][step]

  const toggle = <T,>(arr: T[], v: T, setter: (a: T[]) => void, cap = 99) => {
    if (arr.includes(v)) setter(arr.filter((x) => x !== v))
    else if (arr.length < cap) setter([...arr, v])
  }

  function next() {
    if (step === 4) {
      // run "matchmaking"
      setMatching(true)
      setProfile(builtProfile)
      window.setTimeout(() => {
        setMatching(false)
        setStep(5)
      }, 1600)
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  return (
    <div className="container-app max-w-3xl py-12">
      {/* progress */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-eyebrow">
            Step {Math.min(step + 1, STEPS.length)} / {STEPS.length}
          </p>
          <p className="text-sm font-medium text-white/50">{STEPS[step]}</p>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                i <= step ? 'bg-power-600' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 0 — identity */}
      {step === 0 && (
        <StepShell
          title="Create your player card"
          sub="This is what the squad sees first. Make it yours."
        >
          <div className="space-y-6">
            <Field label="Display name">
              <input
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Nova"
                className="input"
                maxLength={20}
              />
            </Field>
            <Field label="Handle" hint="optional">
              <div className="flex items-center rounded-xl border border-white/15 bg-night-800 focus-within:border-power-500">
                <span className="pl-3.5 text-white/40">@</span>
                <input
                  value={handle}
                  onChange={(e) =>
                    setHandle(e.target.value.replace(/\s+/g, '_').toLowerCase())
                  }
                  placeholder="your_handle"
                  className="w-full bg-transparent px-2 py-3 text-white outline-none placeholder:text-white/30"
                  maxLength={20}
                />
              </div>
            </Field>
            <Field label="Pick an avatar">
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`grid h-12 w-12 place-items-center rounded-xl border text-2xl transition-all ${
                      avatar === a
                        ? 'border-power-500 bg-power-600/15 scale-105'
                        : 'border-white/10 bg-white/5 hover:border-white/25'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Home city">
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <Pill key={c} active={city === c} onClick={() => setCity(c)}>
                    {c}
                  </Pill>
                ))}
              </div>
            </Field>
          </div>
        </StepShell>
      )}

      {/* STEP 1 — platforms */}
      {step === 1 && (
        <StepShell
          title="What do you play on?"
          sub="Select all your platforms. We match squads with gear in common."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <SelectTile
                key={p}
                active={platforms.includes(p)}
                onClick={() => toggle(platforms, p, setPlatforms)}
                label={p}
                emoji={PLATFORM_EMOJI[p]}
              />
            ))}
          </div>
        </StepShell>
      )}

      {/* STEP 2 — genres */}
      {step === 2 && (
        <StepShell
          title="Pick your genres"
          sub="Choose up to 5. These weigh heaviest in matchmaking."
        >
          <div className="flex flex-wrap gap-2.5">
            {GENRES.map((g) => (
              <Pill
                key={g}
                active={genres.includes(g)}
                onClick={() => toggle(genres, g, setGenres, 5)}
              >
                {g}
              </Pill>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/40">
            {genres.length}/5 selected
          </p>
        </StepShell>
      )}

      {/* STEP 3 — style + vibe */}
      {step === 3 && (
        <StepShell
          title="How do you play?"
          sub="Your style and vibe shape which squads feel right."
        >
          <p className="mb-3 text-sm font-semibold text-white/70">Play style</p>
          <div className="grid grid-cols-2 gap-3">
            {PLAY_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setPlayStyle(s.value)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  playStyle === s.value
                    ? 'border-power-500 bg-power-600/15'
                    : 'border-white/10 bg-white/5 hover:border-white/25'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="font-semibold text-white">{s.label}</p>
                  <p className="text-xs text-white/50">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="mb-3 mt-8 text-sm font-semibold text-white/70">
            Your vibe
          </p>
          <div className="flex flex-wrap gap-2.5">
            {VIBES.map((v) => (
              <Pill key={v} active={vibe === v} onClick={() => setVibe(v)}>
                {v}
              </Pill>
            ))}
          </div>
        </StepShell>
      )}

      {/* STEP 4 — games + availability */}
      {step === 4 && (
        <StepShell
          title="Almost there"
          sub="Tag the games you’d show up for, and when you’re free."
        >
          <p className="mb-3 text-sm font-semibold text-white/70">
            Games you’re into
          </p>
          <div className="flex flex-wrap gap-2.5">
            {GAME_SUGGESTIONS.map((g) => (
              <Pill
                key={g}
                active={favoriteGames.includes(g)}
                onClick={() => toggle(favoriteGames, g, setFavoriteGames)}
              >
                {g}
              </Pill>
            ))}
          </div>

          <p className="mb-3 mt-8 text-sm font-semibold text-white/70">
            When can you meet up?
          </p>
          <div className="flex flex-wrap gap-2.5">
            {AVAILABILITY.map((a) => (
              <Pill
                key={a}
                active={availability.includes(a)}
                onClick={() => toggle(availability, a, setAvailability)}
              >
                {a}
              </Pill>
            ))}
          </div>
        </StepShell>
      )}

      {/* STEP 5 — result */}
      {step === 5 && match && (
        <div className="animate-fade-up">
          <div className="text-center">
            <span className="chip mx-auto border-lime/30 bg-lime/10 text-lime">
              <Sparkles className="h-3.5 w-3.5" /> Match found
            </span>
            <h2 className="heading mt-4 text-3xl sm:text-4xl">
              {match.members.length ? "You've got a squad, " : 'Welcome, '}
              {displayName || 'player'}!
            </h2>
            <p className="mx-auto mt-3 max-w-md text-white/55">
              Based on your card, here’s the meetup we’d slot you into first.
            </p>
          </div>

          <div className="card mt-8 overflow-hidden">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <CompatRing score={match.score} />
              <div className="flex-1">
                <span
                  className={`chip border ${MEETUP_META[match.meetup.type].chipBg}`}
                >
                  {match.meetup.type}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold text-white">
                  {match.meetup.title}
                </h3>
                <p className="mt-1 text-sm text-white/55">
                  {match.store.name.replace('GameStop · ', '')} ·{' '}
                  {formatDateLong(match.meetup.date)} · {match.meetup.startTime}
                </p>
                <div className="mt-3">
                  <AvatarStack players={match.members} size={30} />
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/5 px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Why you match
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {match.reasons.slice(0, 4).map((r) => (
                  <li key={r} className="chip border-lime/20 bg-lime/5 text-lime">
                    <Check className="h-3 w-3" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate(`/meetup/${match.meetup.id}`)}
              className="btn-primary flex-1"
            >
              See the squad & RSVP <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-ghost flex-1"
            >
              Go to my Co-Op
            </button>
          </div>
        </div>
      )}

      {/* nav buttons */}
      {step < 5 && (
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canAdvance || matching}
            className="btn-primary min-w-[9rem]"
          >
            {matching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Matching…
              </>
            ) : step === 4 ? (
              <>
                Find my squad <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

const PLATFORM_EMOJI: Record<Platform, string> = {
  PlayStation: '🎮',
  Xbox: '🟢',
  Switch: '🔴',
  PC: '💻',
  Retro: '👾',
  Mobile: '📱',
}

/* ---------- small building blocks ---------- */

function StepShell({
  title,
  sub,
  children,
}: {
  title: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div className="animate-fade-up">
      <h2 className="heading text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-2 text-white/55">{sub}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/80">
        {label}
        {hint && <span className="text-xs font-normal text-white/35">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

function Pill({
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
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? 'border-power-500 bg-power-600/20 text-white'
          : 'border-white/12 bg-white/5 text-white/65 hover:border-white/30 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function SelectTile({
  active,
  onClick,
  label,
  emoji,
}: {
  active: boolean
  onClick: () => void
  label: string
  emoji: string
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-6 transition-all ${
        active
          ? 'border-power-500 bg-power-600/15'
          : 'border-white/10 bg-white/5 hover:border-white/25'
      }`}
    >
      {active && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-power-600 text-white">
          <Check className="h-3 w-3" />
        </span>
      )}
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm font-semibold text-white">{label}</span>
    </button>
  )
}
