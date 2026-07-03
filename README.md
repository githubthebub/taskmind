# taskmind — Stillpoint

An offline-first, client-side somatic focus trainer. A 2D animated coach
paces you through 4-7-8 breathing with haptic boundary pulses, breath-locked
resonant audio (110 Hz grounding + 432 Hz focus layers), and level-gated
attentional-reappraisal prompts. Companion progression is earned exclusively
through verified, uninterrupted focus — and everything stays on your device.

- **Zero cloud dependencies** — no network request exists in the runtime.
- **Local state only** — one versioned `localStorage` key.
- **Zero runtime npm dependencies** — the browser loads native ES modules.

## Quick start

```
npm run build    # tsc -> dist/
npm run serve    # http://localhost:4173
```

Optional end-to-end gate (headless Chromium):

```
npm i --no-save playwright-core
node test/smoke.mjs
```

## Documentation

The permanent system blueprint, architecture map, validation protocol, and
append-only validation log live in [CLINICAL_FLOW_ENGINE.md](./CLINICAL_FLOW_ENGINE.md).
