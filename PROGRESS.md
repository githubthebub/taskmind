# taskmind — build progress & handoff notes

A Headspace/Calm-style app focused on piti (rapture) cultivation, jhana
absorption, somatic-arousal-as-energy practices, and breathwork. Content is
written in a clinical/contemplative wellness voice, grounded in real lineages
(anapanasati, classical jhana factors, taoist microcosmic orbit, Wim Hof
Method, MBSR body scan, box breathing, metta) — no explicit sexual content.

Stack: Next.js 15 (App Router, TypeScript, Tailwind v4), no backend yet —
progress is stored client-side in localStorage.

## Done

- [x] Scaffold (create-next-app, TS/Tailwind/App Router)
- [x] `lib/techniques.ts` — 8 techniques across 5 categories with staged
      instructions and breath patterns
- [x] `lib/audio.ts` — Web Audio tone + binaural ambience helper
- [x] `lib/progress.ts` — localStorage session log, streak calc,
      `useProgressStats()` hook
- [x] `components/BreathPacer.tsx` — animated breath circle
- [x] `components/SessionPlayer.tsx` — stage runner, timer, completion screen
- [x] `app/page.tsx` — dashboard with streak + technique grid
- [x] `app/session/[id]/page.tsx` — session player route, 404 for bad ids
- [x] `app/progress/page.tsx` — stats page
- [x] PWA manifest + placeholder icons (`public/icon-192.png` /
      `icon-512.png` are 1x1 stand-ins — replace with real artwork)

## Next up (pick the next unchecked item each autonomous pass)

- [ ] Replace placeholder PWA icons with real generated artwork (a calming
      abstract mark — spiral/lotus/breath-ring motif fits the theme)
- [ ] Onboarding flow: brief intro screens explaining piti/jhana in plain
      language before first session, sets expectations (not a quick fix,
      a practice)
- [ ] Settings page: binaural on/off default, voice-guidance toggle stub,
      session reminder time (local notification, no backend)
- [ ] Expand `lib/techniques.ts`: add progressive tracks (e.g. a 21-day
      "piti foundations" program that sequences existing + new techniques
      with increasing duration/subtlety)
- [ ] Improve `BreathPacer` accessibility: respect `prefers-reduced-motion`,
      add text-only mode
- [ ] Add a "why this works" info panel per technique summarizing the
      lineage/mechanism (expandable, cite `groundedIn`)
- [ ] Mobile polish pass: test at 375px width, fix any cramped layouts in
      `SessionPlayer` controls
- [ ] Add unit tests for `lib/progress.ts` streak calculation (date-boundary
      edge cases: midnight rollover, timezone)
- [ ] Consider IndexedDB migration from localStorage if session log grows
      (not urgent at current scale)
- [ ] Write real `app/manifest` icons as actual PNGs (use an image-gen tool
      if available) — current ones are 1x1 placeholders and will look broken
      once actually installed as a PWA

## Autonomous session protocol

Each pass: pick the next unchecked item above (or the most valuable next
step if the list is exhausted — add new items grounded in real technique
research, don't invent explicit content), implement it, run `npm run build`
+ `npm run lint`, fix any errors, commit with a clear message, push to
`origin claude/autonomous-session-runner-owebbr`, check this item off (or
add newly discovered follow-ups). Keep commits small and working — never
leave the tree in a broken/non-building state between passes.
