import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from './AvatarStack'
import { useApp } from '../context/AppContext'

const LINKS = [
  { to: '/discover', label: 'Discover' },
  { to: '/stores', label: 'Stores' },
  { to: '/how-it-works', label: 'How it works' },
]

export function Navbar() {
  const { profile, hasProfile } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night-900/80 backdrop-blur-xl">
      <div className="container-app flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white/55 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {hasProfile && profile ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 transition-colors hover:border-white/25"
            >
              <Avatar player={profile} size={30} ring="ring-night-800" />
              <span className="text-sm font-semibold text-white">
                {profile.displayName}
              </span>
            </Link>
          ) : (
            <>
              <Link to="/discover" className="text-sm font-medium text-white/70 hover:text-white">
                Browse
              </Link>
              <Link to="/onboarding" className="btn-primary">
                Get matched
              </Link>
            </>
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-night-800 md:hidden">
          <div className="container-app flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  location.pathname === l.to
                    ? 'bg-white/10 text-white'
                    : 'text-white/70'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
              {hasProfile ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn-ghost"
                >
                  My Co-Op
                </Link>
              ) : (
                <Link
                  to="/onboarding"
                  onClick={() => setOpen(false)}
                  className="btn-primary"
                >
                  Get matched
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
