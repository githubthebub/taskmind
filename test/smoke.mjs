/**
 * End-to-end smoke test: boots the static server, loads the app in headless
 * Chromium, runs a real breathing session past the first two phase
 * boundaries, and asserts the engine/UI/persistence actually work.
 *
 * Requires playwright-core (dev-only): npm i --no-save playwright-core
 * Run: node test/smoke.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const PORT = 4198;
const URL = `http://localhost:${PORT}/`;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

try {
  await new Promise((r) => setTimeout(r, 700));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle' });

  // 1. Shell renders.
  for (const sel of ['#avatar svg', '#ring svg', '#hud .hud-stat', '#start-btn']) {
    if (!(await page.$(sel))) fail(`missing element: ${sel}`);
  }

  // 2. Idle state.
  const idleLabel = await page.textContent('.ring-label');
  if (idleLabel?.trim() !== 'Ready') fail(`idle label was "${idleLabel}"`);

  // 3. Start a session; inhale phase begins.
  await page.click('#start-btn');
  await page.waitForTimeout(600);
  if ((await page.textContent('.ring-label'))?.trim() !== 'Breathe in') {
    fail('inhale phase did not start');
  }
  const expr = await page.getAttribute('.avatar-svg-wrap', 'data-expression');
  if (expr !== 'focused') fail(`avatar expression during inhale was "${expr}"`);

  // 4. First boundary (4s): inhale -> hold.
  await page.waitForFunction(
    () => document.querySelector('.ring-label')?.textContent === 'Hold',
    null,
    { timeout: 6000 },
  );

  // 5. Second boundary (11s): hold -> exhale.
  await page.waitForFunction(
    () => document.querySelector('.ring-label')?.textContent === 'Breathe out',
    null,
    { timeout: 9000 },
  );

  // 6. Full cycle (19s): exhale -> inhale, cycle counted + persisted.
  await page.waitForFunction(
    () => document.querySelector('.ring-count')?.textContent?.startsWith('1 cycle'),
    null,
    { timeout: 11000 },
  );
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('taskmind.progress.v1') ?? 'null'),
  );
  if (!persisted || persisted.verifiedCycles < 1) {
    fail(`cycle not persisted: ${JSON.stringify(persisted)}`);
  }
  if (!persisted.milestonesReached?.includes('first-contact')) {
    fail('first-contact milestone not recorded');
  }

  // 7. End session cleanly.
  await page.click('#start-btn');
  await page.waitForTimeout(400);
  if ((await page.textContent('.ring-label'))?.trim() !== 'Ready') {
    fail('session did not return to idle');
  }
  const sessions = await page.evaluate(
    () => JSON.parse(localStorage.getItem('taskmind.progress.v1') ?? '{}').sessionsCompleted,
  );
  if (sessions !== 1) fail(`sessionsCompleted expected 1, got ${sessions}`);

  // 8. Zero console errors across the whole run.
  if (consoleErrors.length) fail(`console errors: ${consoleErrors.join(' | ')}`);

  await browser.close();
  console.log(process.exitCode ? 'SMOKE TEST FAILED' : 'SMOKE TEST PASSED');
} finally {
  server.kill();
}
