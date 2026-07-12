// ---- Core domain types for Co-Op ----

export type Platform =
  | 'PlayStation'
  | 'Xbox'
  | 'Switch'
  | 'PC'
  | 'Retro'
  | 'Mobile'

export type Genre =
  | 'FPS / Shooter'
  | 'Fighting'
  | 'RPG'
  | 'MOBA'
  | 'Racing'
  | 'Sports'
  | 'Party / Co-op'
  | 'Horror'
  | 'Strategy'
  | 'TCG / Tabletop'
  | 'Speedrun'
  | 'Retro / Arcade'

export type PlayStyle = 'competitive' | 'casual' | 'social' | 'completionist'

export type Vibe =
  | 'Chill & friendly'
  | 'Hyper-competitive'
  | 'Here to learn'
  | 'Trade & collect'
  | 'Meet new people'

export type MeetupType =
  | 'Game Night'
  | 'Tournament'
  | 'TCG Trade Night'
  | 'Midnight Launch'
  | 'Retro Swap'
  | 'Speedrun Session'

export interface PlayerProfile {
  id: string
  handle: string
  displayName: string
  avatar: string // emoji avatar
  level: number
  city: string
  platforms: Platform[]
  genres: Genre[]
  playStyle: PlayStyle
  vibe: Vibe
  favoriteGames: string[]
  availability: string[] // e.g. ['Weeknights', 'Weekends']
  bio?: string
  badges?: string[]
}

export interface Store {
  id: string
  name: string
  address: string
  city: string
  region: string
  distanceMi: number
  rating: number
  amenities: string[]
  image: string // gradient key
  activeMembers: number
}

export interface Meetup {
  id: string
  type: MeetupType
  title: string
  storeId: string
  date: string // ISO
  startTime: string
  durationMin: number
  capacity: number
  memberIds: string[] // persona ids attending
  hostId: string
  featuredGame: string
  vibe: Vibe
  description: string
  bring: string[]
  priceLabel: string
}

export interface SquadMatch {
  meetup: Meetup
  store: Store
  score: number // 0-100 compatibility
  reasons: string[]
  members: PlayerProfile[]
}
