# Co-Op — meet your players at GameStop 🎮

**Co-Op** is a concept app that does for gamers what Timeleft does for dinners:
it matches you with a small squad of nearby players who love the same games,
then sets you up to actually meet in person — at your local **GameStop** store.
Less endless scrolling and dead Discord servers, more pressing start together
IRL.

> A design/product concept. Not affiliated with or endorsed by GameStop Corp.

---

## The idea

Timeleft's magic is curated small groups + a real place to show up. Co-Op keeps
that formula and rebuilds it for players:

1. **Build a player card** — a 60-second quiz captures your platforms, favorite
   genres, play style, vibe, games, and availability.
2. **Get matched into a squad** — a compatibility engine slots you into a nearby
   GameStop event where the group already forming shares your taste, and shows a
   transparent match score with the reasons behind it.
3. **Meet up & play** — RSVP, meet the squad's profiles ahead of time, unlock the
   group chat, get the store details, and turn a match score into real friends.

Meetups come in six flavors: **Game Night, Tournament, TCG Trade Night, Midnight
Launch, Retro Swap,** and **Speedrun Session** — each hosted at a real store set
up for play (tournament rigs, TCG tables, retro corners, esports stages).

## Features

- 🎯 **Compatibility matching engine** (`src/lib/matching.ts`) — scores every
  meetup 0–100 from platform/genre overlap with the squad, vibe↔event affinity,
  play-style fit, proximity, and availability, and explains *why* you match.
- 🧭 **Discover** — filter meetups by type and city, sort by best-match or
  soonest, with per-meetup match scores once you have a profile.
- 🕹️ **Onboarding quiz** — a polished multi-step wizard that builds and persists
  your player card.
- 👥 **Meetup detail** — see your squad's profiles, open spots, what to bring, a
  squad-chat preview, the store card, and RSVP.
- 📊 **My Co-Op dashboard** — profile, XP/level, badges, upcoming meetups, and a
  personalized "Matched for you" rail.
- 🏬 **Stores directory** — searchable list of GameStop venues with amenities and
  what's coming up at each.
- 💾 Profile + RSVPs persist in `localStorage` — no backend required for the demo.
- 📱 Fully responsive, dark, GameStop-red themed UI.

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **lucide-react** icons
- State via React Context; persistence via `localStorage`

No backend — all data lives in `src/data/` (stores, player personas, meetups)
and the matching logic runs client-side.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # type-check only
```

## Project structure

```
src/
  components/     Reusable UI (Navbar, MeetupCard, StoreCard, CompatBar, …)
  context/        AppContext — profile + RSVP state, persisted to localStorage
  data/           Mock stores, player personas, and meetups
  lib/            matching engine, formatting, storage helpers
  pages/          Landing, Onboarding, Discover, MeetupDetail, Dashboard,
                  Stores, HowItWorks
  types.ts        Shared domain types
```

## How matching works

Each player card feeds a weighted score against every upcoming meetup:

| Signal              | Roughly |
| ------------------- | ------- |
| Genre overlap       | highest |
| Vibe & play style   | high    |
| Platform overlap    | medium  |
| Proximity & timing  | medium  |

The result is a ranked list of squads with human-readable reasons ("You both
love FPS / Shooter & RPG", "Matches your Hyper-competitive vibe", "In your
city"), so matches never feel like a black box. See `src/lib/matching.ts`.
