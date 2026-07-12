import { Link } from 'react-router-dom'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="Co-Op home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-power-600 shadow-lg shadow-power-600/30 transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M7 9c-1.1 0-2 .8-2.2 1.9l-.9 5c-.3 1.5.9 2.9 2.4 2.9.9 0 1.7-.5 2.1-1.2l1.2-1.9h4.8l1.2 1.9c.4.7 1.2 1.2 2.1 1.2 1.5 0 2.7-1.4 2.4-2.9l-.9-5C21 9.8 20.1 9 19 9H7Z"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="15.5" cy="12" r="1" fill="#fff" />
          <circle cx="17.5" cy="14" r="1" fill="#fff" />
          <path d="M8 11.5v3M6.5 13h3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Co-Op
      </span>
    </Link>
  )
}
