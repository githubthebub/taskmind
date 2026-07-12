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
| S4 "Her Sky" | `88045434-8494-4773-aa80-213127e7dd3a` | completed | Ref: S1 + S3 (Diya's costume continuity) |
| S5 "One Sky" (title) | `91da97c0-54a0-4547-8412-06c76cba6cd8` | completed | Ref: S1 + S4 (both palettes); trilingual title text |

Keyframe stills (CDN):

- S1: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173557_ba43e42b-00f7-46b4-9d82-ca9599ff0171.png
- S2: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173713_2de3a1f6-b885-4d08-8161-93ebf965a9f8.png
- S3: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173718_13d102a8-5e28-4a3b-a23f-414d19383d9c.png
- S4: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173823_88045434-8494-4773-aa80-213127e7dd3a.png
- S5: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173936_91da97c0-54a0-4547-8412-06c76cba6cd8.png

## Shots (video jobs, Kling 3.0 Turbo, 1080p 16:9)

| Shot | Duration | Job ID | Status |
|------|----------|--------|--------|
| S1 | 5 s | `4943ac55-cb07-4572-b4b1-7ce457618465` | completed |
| S2 | 4 s | `d88729d6-b375-4cf3-a5fa-720debd88aff` | completed |
| S3 | 5 s | `faef7bf7-8b32-4146-bfdb-d4cddda22ae0` | completed |
| S4 | 5 s | `0eea54d0-c579-4de4-8588-145d6b44ba42` | completed |
| S5 | 8 s (narration bed, 7.6 s VO) | `e4dbc478-c63c-4843-be72-b8c04d0231da` | completed |

Shot clips (CDN, 1080p MP4):

- S1: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173730_4943ac55-cb07-4572-b4b1-7ce457618465.mp4
- S2: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173842_d88729d6-b375-4cf3-a5fa-720debd88aff.mp4
- S3: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173845_faef7bf7-8b32-4146-bfdb-d4cddda22ae0.mp4
- S4: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173940_0eea54d0-c579-4de4-8588-145d6b44ba42.mp4
- S5: https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_174028_e4dbc478-c63c-4843-be72-b8c04d0231da.mp4

## Audio

| Asset | Job ID | Notes |
|-------|--------|-------|
| Closing narration (EN) | `809b4a85-7177-4c45-8027-e5e386bb31a2` | Seed Audio, preset voice "Hana", −10% rate, 7.6 s — https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260711_173742_809b4a85-7177-4c45-8027-e5e386bb31a2.wav |

## Final master

| Asset | Job ID | URL |
|-------|--------|-----|
| Assembled teaser (27 s, 1080p) | `be2c627f-4a9f-46ed-b7fb-8439788e858c` | https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260712_040637_be2c627f-4a9f-46ed-b7fb-8439788e858c.mp4 |

Cut order: S1 (5 s) → S2 (4 s) → S3 (5 s) → S4 (5 s) → S5 (8 s, closing narration).
Total spend: ≈ 66 credits (5 keyframes, 5 shots, 1 narration; assembly free).
