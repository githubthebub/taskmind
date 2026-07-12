import {
  Gamepad2,
  Trophy,
  Layers,
  Moon,
  Joystick,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import type { MeetupType } from '../types'

interface Meta {
  icon: LucideIcon
  accent: string // text color
  chipBg: string // background tint for chips
  ring: string
  label: string
}

export const MEETUP_META: Record<MeetupType, Meta> = {
  'Game Night': {
    icon: Gamepad2,
    accent: 'text-cyber',
    chipBg: 'bg-cyan/10 border-cyan/30 text-cyber',
    ring: 'ring-cyan/40',
    label: 'Game Night',
  },
  Tournament: {
    icon: Trophy,
    accent: 'text-power-400',
    chipBg: 'bg-power-600/10 border-power-500/30 text-power-300',
    ring: 'ring-power-500/40',
    label: 'Tournament',
  },
  'TCG Trade Night': {
    icon: Layers,
    accent: 'text-grape',
    chipBg: 'bg-grape/10 border-grape/30 text-grape',
    ring: 'ring-grape/40',
    label: 'TCG Trade Night',
  },
  'Midnight Launch': {
    icon: Moon,
    accent: 'text-amber-300',
    chipBg: 'bg-amber-400/10 border-amber-400/30 text-amber-300',
    ring: 'ring-amber-400/40',
    label: 'Midnight Launch',
  },
  'Retro Swap': {
    icon: Joystick,
    accent: 'text-lime',
    chipBg: 'bg-lime/10 border-lime/30 text-lime',
    ring: 'ring-lime/40',
    label: 'Retro Swap',
  },
  'Speedrun Session': {
    icon: Timer,
    accent: 'text-sky-300',
    chipBg: 'bg-sky-400/10 border-sky-400/30 text-sky-300',
    ring: 'ring-sky-400/40',
    label: 'Speedrun Session',
  },
}
