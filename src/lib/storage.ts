import type { PlayerProfile } from '../types'

const PROFILE_KEY = 'coop.profile.v1'
const RSVP_KEY = 'coop.rsvps.v1'

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? (JSON.parse(raw) as PlayerProfile) : null
  } catch {
    return null
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(RSVP_KEY)
  } catch {
    /* ignore */
  }
}

export function loadRsvps(): string[] {
  try {
    const raw = localStorage.getItem(RSVP_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveRsvps(ids: string[]): void {
  try {
    localStorage.setItem(RSVP_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}
