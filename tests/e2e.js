/* Velvet end-to-end test.
   Drives the real app in headless Chromium: consent → sessions → practice
   engine → journal → builder → settings → back-button handling.

   Run:  npm install && npm test
   If Playwright's own browser download is unavailable, point CHROMIUM at a
   local binary:  CHROMIUM=/opt/pw-browsers/chromium npm test */

const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
};

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = path.normalize(decodeURIComponent(req.url.split('?')[0]));
      if (p === '/' || p === '\\') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end(); return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

let passed = 0;
function ok(cond, label) {
  assert.ok(cond, label);
  passed++;
  console.log(`  ✓ ${label}`);
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch(
    process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  console.log('consent & home');
  await page.goto(base);
  await page.click('#consent-go');
  await page.waitForSelector('.session-card');
  ok((await page.$$('.session-card')).length === 7, '6 sessions + create card');

  console.log('practice engine');
  await page.click('.session-card');
  await page.waitForSelector('#begin');
  await page.click('#begin');
  await page.waitForSelector('#p-orb');
  await page.waitForTimeout(3000);
  ok((await page.textContent('#p-phase')).includes('Arrive'), 'phase label shows Arrive');
  ok((await page.textContent('#p-cue')).length > 0, 'first cue fired');
  const s1 = await page.$eval('#p-orb', el => el.style.transform);
  await page.waitForTimeout(2200);
  const s2 = await page.$eval('#p-orb', el => el.style.transform);
  ok(s1 !== s2, 'orb animates with breath');
  const amb = await page.$eval('.ambient', c => c.width > 0 && c.height > 0);
  ok(amb, 'ambient canvas sized');

  await page.click('#p-pause');
  ok((await page.textContent('#p-word')) === 'paused', 'pause stops the breath word');
  await page.click('#p-pause');
  const t1 = await page.textContent('#p-time');
  await page.waitForTimeout(2200);
  ok((await page.textContent('#p-time')) !== t1, 'countdown ticks after resume');

  console.log('complete & journal');
  await page.click('#p-exit');
  await page.waitForSelector('.glow-row');
  await page.click('.glow-dot[data-n="4"]');
  await page.fill('#c-note', 'test note');
  await page.click('#c-save');
  await page.waitForSelector('.session-card');
  ok((await page.textContent('.streak-n')) === '1', 'streak starts at 1');
  await page.click('[data-tab="journal"]');
  await page.waitForSelector('.entry');
  ok((await page.textContent('.entry')).includes('test note'), 'journal entry saved with note');

  console.log('length scaling');
  await page.click('[data-tab="home"]');
  await page.waitForSelector('.session-card');
  await page.click('.session-card');
  await page.waitForSelector('#begin');
  const std = await page.textContent('#begin');
  await page.click('.len-opt[data-f="0.7"]');
  ok((await page.textContent('#begin')) !== std, 'length selector changes Begin label');
  await page.click('.back');

  console.log('custom builder');
  await page.waitForSelector('.create-card');
  await page.click('.create-card');
  await page.waitForSelector('#b-seq');
  await page.fill('#b-name', 'Test Practice');
  await page.click('.lib-item[data-id="kindle"]');
  await page.click('#b-save');
  await page.waitForSelector('#begin');
  ok((await page.textContent('h1')).includes('Test Practice'), 'custom session created');
  await page.reload();
  await page.waitForSelector('.session-card');
  ok((await page.textContent('.session-list')).includes('Test Practice'),
    'custom session survives reload');
  await page.$$eval('.session-card',
    els => els.find(e => e.textContent.includes('Test Practice')).click());
  await page.waitForSelector('#d-del');
  page.once('dialog', d => d.accept());
  await page.click('#d-del');
  await page.waitForSelector('.session-card');
  ok(!(await page.textContent('.session-list')).includes('Test Practice'),
    'custom session deleted');

  console.log('corrupted storage tolerance');
  await page.evaluate(() => {
    localStorage.setItem('velvet.custom', JSON.stringify([{ id: 'bad' }, 42]));
    const j = JSON.parse(localStorage.getItem('velvet.journal'));
    j.push({ broken: true });
    localStorage.setItem('velvet.journal', JSON.stringify(j));
  });
  await page.reload();
  await page.waitForSelector('.session-card');
  ok(true, 'home renders despite malformed stored data');
  await page.click('[data-tab="journal"]');
  await page.waitForSelector('.entry');
  ok(true, 'journal renders despite malformed entry');

  console.log('back button');
  await page.click('[data-tab="home"]');
  await page.waitForSelector('.session-card');
  await page.click('.session-card');
  await page.waitForSelector('#begin');
  await page.goBack();
  await page.waitForSelector('.session-list');
  ok(true, 'back from detail returns home');
  await page.click('.session-card');
  await page.waitForSelector('#begin');
  await page.click('#begin');
  await page.waitForSelector('#p-orb');
  await page.waitForTimeout(800);
  await page.goBack();
  await page.waitForSelector('.glow-row');
  ok(true, 'back mid-session lands on completion screen');
  await page.click('#c-save');

  console.log('settings');
  await page.waitForSelector('.tabbar');
  await page.click('[data-tab="settings"]');
  await page.waitForSelector('.switch');
  await page.click('.switch[data-key="voice"]');
  await page.reload();
  await page.waitForSelector('.tabbar');
  await page.click('[data-tab="settings"]');
  await page.waitForSelector('.switch');
  ok(!(await page.$eval('.switch[data-key="voice"]', el => el.classList.contains('on'))),
    'voice toggle persists');
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#set-export'),
  ]);
  ok(dl.suggestedFilename() === 'velvet-journal.json', 'journal export downloads');
  page.once('dialog', d => d.accept());
  await page.click('#set-erase');
  await page.waitForSelector('#consent-go');
  ok(true, 'erase-all returns to consent gate');

  assert.deepStrictEqual(errors, [], 'no console/page errors');
  console.log(`\n${passed} checks passed, no console errors.`);
  await browser.close();
  srv.close();
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
