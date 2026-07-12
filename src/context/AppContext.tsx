import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PlayerProfile } from '../types'
import {
  clearProfile,
  loadProfile,
  loadRsvps,
  saveProfile,
  saveRsvps,
} from '../lib/storage'

interface AppState {
  profile: PlayerProfile | null
  rsvps: string[]
  hasProfile: boolean
  setProfile: (p: PlayerProfile) => void
  resetProfile: () => void
  toggleRsvp: (meetupId: string) => void
  isGoing: (meetupId: string) => boolean
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<PlayerProfile | null>(() =>
    loadProfile(),
  )
  const [rsvps, setRsvps] = useState<string[]>(() => loadRsvps())

  useEffect(() => {
    if (profile) saveProfile(profile)
  }, [profile])

  useEffect(() => {
    saveRsvps(rsvps)
  }, [rsvps])

  const setProfile = useCallback((p: PlayerProfile) => {
    setProfileState(p)
  }, [])

  const resetProfile = useCallback(() => {
    clearProfile()
    setProfileState(null)
    setRsvps([])
  }, [])

  const toggleRsvp = useCallback((meetupId: string) => {
    setRsvps((prev) =>
      prev.includes(meetupId)
        ? prev.filter((id) => id !== meetupId)
        : [...prev, meetupId],
    )
  }, [])

  const isGoing = useCallback(
    (meetupId: string) => rsvps.includes(meetupId),
    [rsvps],
  )

  const value = useMemo<AppState>(
    () => ({
      profile,
      rsvps,
      hasProfile: profile !== null,
      setProfile,
      resetProfile,
      toggleRsvp,
      isGoing,
    }),
    [profile, rsvps, setProfile, resetProfile, toggleRsvp, isGoing],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
