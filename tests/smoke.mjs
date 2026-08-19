// End-to-end smoke test for Neon Eclipse. Not part of the shipped game —
// this is a contributor-only tool, so it's the one place in the repo that
// depends on an external package (Playwright), kept out of the zero-dependency
// runtime described in the README.
//
// Usage:
//   npm install -D playwright   (once)
//   node tests/smoke.mjs
//
// Boots its own devserver.py on an open port, drives the game through a
// headless Chromium session covering both run modes plus core UI, and exits
// non-zero with a message on the first assertion that fails. Console/page
// errors during the run also fail the check (aside from the browser's own
// favicon 404, which is expected and ignored).

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = 8834;
const BASE_URL = `http://localhost:${PORT}`;

let failures = 0;
function check(label, cond) {
  if (cond) {
    console.log(`  ok  - ${label}`);
  } else {
    failures++;
    console.log(`FAIL  - ${label}`);
  }
}

async function waitForServer(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not come up within ${timeoutMs}ms`);
}

const server = spawn('python3', ['devserver.py', String(PORT), '.'], { cwd: ROOT, stdio: 'ignore' });
let browser;
try {
  await waitForServer(BASE_URL);

  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) pageErrors.push(m.text());
  });

  console.log('Main menu + settings:');
  await page.goto(BASE_URL);
  await page.waitForSelector('#btn-endless', { state: 'visible' });
  check('main menu renders with Endless Mode button', await page.isVisible('#btn-endless'));

  await page.click('#btn-settings');
  await page.waitForSelector('#screen-settings:not(.hidden)');
  check('settings screen opens', (await page.$$('.settings-row')).length > 0);
  await page.click('#btn-back-settings');
  await page.waitForSelector('#screen-menu:not(.hidden)');

  console.log('Endless Mode run:');
  await page.click('#btn-endless');
  await page.click('.char-card');
  await page.waitForSelector('.choice-card');
  await page.click('.choice-card');
  await page.waitForSelector('#hud:not(.hidden)', { timeout: 10000 });
  check('endless run enters combat', await page.isVisible('#hud'));

  await page.waitForTimeout(500);
  const runLabel = await page.textContent('#run-progress');
  check('HUD shows wave label', /Wave \d+/.test(runLabel || ''));

  await page.evaluate(() => { window.__game.nodeElapsed = window.__game.endless.waveDuration - 0.05; });
  await page.waitForTimeout(300);
  check('wave-clear shop opens', await page.isVisible('#screen-node-shop'));
  await page.click('#btn-node-shop-continue');
  await page.waitForTimeout(200);
  check('returns to combat after the shop', await page.isVisible('#hud'));

  await page.evaluate(() => { window.__game.onPlayerHit(window.__game.player.maxHp * 5, window.__game.player.x, window.__game.player.y); });
  await page.waitForTimeout(300);
  check('death shows the end screen', await page.isVisible('#screen-end'));
  const endStats = (await page.textContent('#end-stats')) || '';
  check('end screen reports a wave reached', /Wave Reached/.test(endStats));

  await page.click('#btn-end-menu');
  await page.waitForSelector('#screen-menu:not(.hidden)');
  const menuStats = (await page.textContent('#menu-stats')) || '';
  check('run history recorded (Best Wave stat updates)', /Best Wave/.test(menuStats));

  check('no unexpected console/page errors', pageErrors.length === 0);
  if (pageErrors.length) console.log('  errors:', pageErrors);
} finally {
  if (browser) await browser.close();
  server.kill();
}

console.log(failures === 0 ? `\nAll checks passed.` : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
