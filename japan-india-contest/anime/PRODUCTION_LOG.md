# *Two Lights, One Sky* — production log

AI-assisted production record (full disclosure per the contest's AI policy, §6.3 of the
proposal). Pipeline: Nano Banana (Google) for keyframes → Kling 3.0 Turbo for
image-to-video animation (1080p, 16:9) → Seed Audio for the closing narration →
server-side assembly into the final master.

Asset URLs are the platform's CDN links (also viewable in the Higgsfield library under this
account's generation history by job ID).

## Keyframes (image jobs)

| Shot | Job ID | Status | Notes |
|------|--------|--------|-------|
| S1 "The Wish" | `ba43e42b-00f7-46b4-9d82-ca9599ff0171` | completed | Style/palette anchor for all later frames |
| S2 "The Flutter" | `2de3a1f6-b885-4d08-8161-93ebf965a9f8` | completed | Ref: S1 |
| S3 "The Flame" | `13d102a8-5e28-4a3b-a23f-414d19383d9c` | completed | Ref: S1; match-cut twin of S2 |
| S4 "Her Sky" | `88045434-8494-4773-aa80-213127e7dd3a` | — | Ref: S1 + S3 (Diya's costume continuity) |
| S5 "One Sky" (title) | — | — | Ref: S1 + S4 (both palettes) |

## Shots (video jobs, Kling 3.0 Turbo, 1080p 16:9)

| Shot | Duration | Job ID | Status |
|------|----------|--------|--------|
| S1 | 5 s | `4943ac55-cb07-4572-b4b1-7ce457618465` | — |
| S2 | 4 s | `d88729d6-b375-4cf3-a5fa-720debd88aff` | — |
| S3 | 5 s | `faef7bf7-8b32-4146-bfdb-d4cddda22ae0` | — |
| S4 | 5 s | — | — |
| S5 | 8 s (narration bed, 7.6 s VO) | — | — |

## Audio

| Asset | Job ID | Notes |
|-------|--------|-------|
| Closing narration (EN) | `809b4a85-7177-4c45-8027-e5e386bb31a2` | Seed Audio, preset voice "Hana", −10% rate |

## Final master

| Asset | Job ID | URL |
|-------|--------|-----|
| Assembled teaser (~25 s) | — | — |
