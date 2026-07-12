import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-night-900/60">
      <div className="container-app grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-white/50">
            Co-Op matches you with nearby players and brings you together IRL at
            your local GameStop. Less scrolling, more playing.
          </p>
          <p className="mt-4 text-xs text-white/30">
            A concept experience. Not affiliated with or endorsed by GameStop
            Corp.
          </p>
        </div>

        <FooterCol
          title="Explore"
          links={[
            { to: '/discover', label: 'Discover meetups' },
            { to: '/stores', label: 'Find a store' },
            { to: '/onboarding', label: 'Get matched' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: '/how-it-works', label: 'How it works' },
            { to: '/how-it-works', label: 'Safety' },
            { to: '/how-it-works', label: 'PowerUp Rewards' },
          ]}
        />
        <FooterCol
          title="Play"
          links={[
            { to: '/discover', label: 'This week' },
            { to: '/discover', label: 'Tournaments' },
            { to: '/discover', label: 'TCG nights' },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/40 sm:flex-row">
          <p>© 2026 Co-Op. Press Start.</p>
          <p className="font-mono">Built for the GameStop community 🎮</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { to: string; label: string }[]
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l, i) => (
          <li key={i}>
            <Link
              to={l.to}
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
