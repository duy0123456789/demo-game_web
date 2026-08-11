import { createHash } from 'node:crypto';
import { chromium } from 'playwright-core';

const URL = process.argv[2] ?? 'http://localhost:5199/';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function collectErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

async function screenshotHash(page, name) {
  const buf = await page.screenshot({ path: `test-shot-${name}.png` });
  return createHash('sha1').update(buf).digest('hex').slice(0, 16);
}

async function clickPlayDesktop(page) {
  await page.mouse.click(640, 308);
  await wait(1500);
}

async function clickPlayPortrait(page) {
  await page.mouse.click(360, 470);
  await wait(1500);
}

async function main() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true });

  // ---------- Desktop: menu -> play -> WASD movement ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: false });
    const page = await ctx.newPage();
    const errors = collectErrors(page);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await wait(2000);
    const before = await screenshotHash(page, 'desktop-play-before');

    await clickPlayDesktop(page);
    await wait(1000);
    const afterPlay = await screenshotHash(page, 'desktop-play');
    await page.keyboard.down('d');
    await wait(800);
    await page.keyboard.up('d');
    const afterMove = await screenshotHash(page, 'desktop-move');

    const state = await page.evaluate(() => ({
      canvas: (() => {
        const c = document.querySelector('canvas');
        return c ? `${c.width}x${c.height}` : 'none';
      })(),
    }));
    console.log(`DESKTOP: menu=${before !== afterPlay} playChanged=${afterPlay !== afterMove} canvas=${state.canvas} errors=${errors.length}`);
    for (const e of errors.slice(0, 10)) console.log(' ', e);
    await ctx.close();
  }

  // ---------- Mobile portrait: touch joystick drag ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    const errors = collectErrors(page);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await wait(2000);
    await clickPlayPortrait(page);
    await wait(1000);

    const before = await screenshotHash(page, 'portrait-play');
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 100, y: 500, radiusX: 5, radiusY: 5, force: 1, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 200, y: 480, radiusX: 5, radiusY: 5, force: 1, id: 1 }],
    });
    await wait(800);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await wait(500);
    const after = await screenshotHash(page, 'portrait-move');

    const state = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { canvas: c ? `${c.width}x${c.height}` : 'none', touch: navigator.maxTouchPoints };
    });
    console.log(`PORTRAIT: moved=${before !== after} canvas=${state.canvas} touch=${state.touch} errors=${errors.length}`);
    for (const e of errors.slice(0, 10)) console.log(' ', e);
    await ctx.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err.message);
  process.exit(1);
});