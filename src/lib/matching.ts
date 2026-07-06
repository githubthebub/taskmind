import type { Meetup, PlayerProfile, SquadMatch } from '../types'
import { MEETUPS } from '../data/meetups'
import { PLAYERS, playerById } from '../data/players'
import { storeById } from '../data/stores'

// Weighted overlap helper — Jaccard-ish similarity between two string arrays.
function overlap(a: string[], b: string[]): { shared: string[]; ratio: number } {
  const setB = new Set(b)
  const shared = a.filter((x) => setB.has(x))
  const union = new Set([...a, ...b]).size || 1
  return { shared, ratio: shared.length / union }
}

const VIBE_MEETUP_AFFINITY: Record<string, string[]> = {
  'Hyper-competitive': ['Tournament', 'Speedrun Session'],
  'Chill & friendly': ['Game Night', 'Retro Swap'],
  'Here to learn': ['Speedrun Session', 'Game Night'],
  'Trade & collect': ['TCG Trade Night', 'Retro Swap', 'Midnight Launch'],
  'Meet new people': ['Midnight Launch', 'Game Night'],
}

/**
 * Score how well a single meetup fits a player, 0–100, plus human-readable
 * reasons. Combines platform + genre overlap with the current squad, playstyle
 * fit, vibe/meetup-type affinity, city proximity, and availability.
 */
export function scoreMeetup(profile: PlayerProfile, meetup: Meetup): SquadMatch {
  const store = storeById(meetup.storeId)!
  const members = meetup.memberIds
    .map((id) => playerById(id))
    .filter((p): p is PlayerProfile => Boolean(p))

  const reasons: string[] = []
  let score = 40 // baseline — everyone's welcome

  // --- Platform overlap with the squad ---
  const squadPlatforms = [...new Set(members.flatMap((m) => m.platforms))]
  const plat = overlap(profile.platforms, squadPlatforms)
  score += Math.round(plat.ratio * 18)
  if (plat.shared.length) {
    reasons.push(
      `Shared platform${plat.shared.length > 1 ? 's' : ''}: ${plat.shared.join(', ')}`,
    )
  }

  // --- Genre overlap with the squad ---
  const squadGenres = [...new Set(members.flatMap((m) => m.genres))]
  const gen = overlap(profile.genres, squadGenres)
  score += Math.round(gen.ratio * 18)
  if (gen.shared.length) {
    reasons.push(`You both love ${gen.shared.slice(0, 2).join(' & ')}`)
  }

  // --- Vibe ↔ meetup type affinity ---
  if (VIBE_MEETUP_AFFINITY[profile.vibe]?.includes(meetup.type)) {
    score += 12
    reasons.push(`Matches your "${profile.vibe}" vibe`)
  }
  if (meetup.vibe === profile.vibe) {
    score += 6
  }

  // --- Playstyle fit with the host ---
  const host = playerById(meetup.hostId)
  if (host && host.playStyle === profile.playStyle) {
    score += 6
    reasons.push(`Same play style as host ${host.displayName}`)
  }

  // --- Proximity (same city is a strong signal) ---
  if (store.city === profile.city) {
    score += 8
    reasons.push('In your city')
  } else if (store.distanceMi <= 10) {
    score += 4
    reasons.push(`${store.distanceMi} mi away`)
  }

  // --- Availability heuristic (weekend vs weeknight) ---
  const d = new Date(meetup.date + 'T00:00:00')
  const isWeekend = d.getDay() === 0 || d.getDay() === 6
  const wantsWeekend = profile.availability.includes('Weekends')
  const wantsWeeknight = profile.availability.includes('Weeknights')
  if ((isWeekend && wantsWeekend) || (!isWeekend && wantsWeeknight)) {
    score += 6
    reasons.push(isWeekend ? 'Fits your weekends' : 'Fits your weeknights')
  }

  // --- Roominess bonus so full squads rank slightly lower ---
  const spotsLeft = meetup.capacity - meetup.memberIds.length
  if (spotsLeft <= 1) score -= 6

  score = Math.max(20, Math.min(99, score))

  if (reasons.length === 0) reasons.push('A fresh crowd to meet')

  return { meetup, store, score, reasons, members }
}

/** Rank every upcoming meetup for the player, best first. */
export function rankMatches(profile: PlayerProfile): SquadMatch[] {
  return MEETUPS.map((m) => scoreMeetup(profile, m)).sort(
    (a, b) => b.score - a.score,
  )
}

/** The single best match — used for the hero "your squad is ready" moment. */
export function topMatch(profile: PlayerProfile): SquadMatch {
  return rankMatches(profile)[0]
}

/**
 * Suggest a handful of players (not already in the meetup) who'd vibe with the
 * user — powers the "players you'd click with" rail.
 */
export function suggestedPlayers(
  profile: PlayerProfile,
  limit = 4,
): Array<{ player: PlayerProfile; score: number; reason: string }> {
  return PLAYERS.map((player) => {
    const plat = overlap(profile.platforms, player.platforms)
    const gen = overlap(profile.genres, player.genres)
    let score = plat.ratio * 45 + gen.ratio * 45
    let reason = ''
    if (gen.shared.length) reason = `Also into ${gen.shared[0]}`
    else if (plat.shared.length) reason = `Plays on ${plat.shared[0]}`
    else reason = 'A new connection'
    if (player.city === profile.city) {
      score += 10
      reason = 'In your city · ' + reason
    }
    if (player.vibe === profile.vibe) score += 8
    return { player, score: Math.round(score), reason }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
