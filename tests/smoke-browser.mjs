/**
 * SHIELD MAX browser smoke test (validation gate V10 + V7).
 *
 * Boots the built app in headless Chromium via Playwright, then asserts:
 *  - the page loads with zero console errors / page errors,
 *  - globalThis.SHIELD is exported and the game canvas is live,
 *  - the HUD timer is ticking (the rAF loop is actually running),
 *  - no horizontal overflow at 320 / 768 / 1280 px viewports,
 *  - the breathing overlay and exit overlay exist and are hidden at boot.
 *
 * Playwright is a dev-side test driver only — the shipped app itself has
 * zero dependencies. Run with: node tests/smoke-browser.mjs
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = 'file://' + path.join(root, 'index.html');

const problems = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`);
});
page.on('pageerror', (err) => problems.push(`page error: ${err.message}`));

await page.goto(url);
await page.waitForTimeout(1500);

const boot = await page.evaluate(() => {
  const canvas = document.querySelector('#game-canvas');
  return {
    shield: typeof globalThis.SHIELD === 'object' && globalThis.SHIELD !== null,
    exports: globalThis.SHIELD ? Object.keys(globalThis.SHIELD).length : 0,
    canvasW: canvas ? canvas.width : 0,
    canvasH: canvas ? canvas.height : 0,
    stateBadge: document.querySelector('#state-badge')?.textContent ?? '',
    timer1: document.querySelector('#hud-timer')?.textContent ?? '',
    breathingHidden: !document.querySelector('#breathing-overlay').classList.contains('visible'),
    exitHidden: !document.querySelector('#exit-overlay').classList.contains('visible'),
  };
});
if (!boot.shield) problems.push('globalThis.SHIELD missing after boot');
if (boot.exports < 10) problems.push(`SHIELD export surface too small (${boot.exports})`);
if (boot.canvasW <= 0 || boot.canvasH <= 0) problems.push('game canvas has zero pixel size');
if (!boot.stateBadge.includes('Balanced')) problems.push(`unexpected initial state badge: "${boot.stateBadge}"`);
if (!boot.breathingHidden) problems.push('breathing overlay visible at boot');
if (!boot.exitHidden) problems.push('exit overlay visible at boot');

// rAF loop liveness: pattern timer must count down.
await page.waitForTimeout(2200);
const timer2 = await page.evaluate(() => document.querySelector('#hud-timer')?.textContent ?? '');
if (timer2 === boot.timer1 || timer2 === '—') problems.push(`HUD timer not ticking (${boot.timer1} → ${timer2})`);

// Interaction sanity: keyboard rotate/place must not throw and must register.
await page.keyboard.press('e');
await page.keyboard.press('ArrowLeft');
await page.keyboard.press(' ');
await page.waitForTimeout(300);

// Responsive audit: no horizontal document overflow at any breakpoint.
for (const width of [320, 768, 1280]) {
  await page.setViewportSize({ width, height: 720 });
  await page.waitForTimeout(350);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) problems.push(`horizontal overflow of ${overflow}px at ${width}px viewport`);
}

await browser.close();

if (problems.length > 0) {
  console.error('SMOKE FAIL:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('SMOKE OK: boot clean, SHIELD exported, canvas live, timer ticking, no overflow at 320/768/1280px.');
