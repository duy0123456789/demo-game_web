import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const URL = process.argv[2] ?? 'http://localhost:5199/';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function grabFrame(page, name) {
  const dataUrl = await page.evaluate(async () => {
    const g = window.__pg;
    const img = await new Promise((resolve) => g.renderer.snapshot(resolve));
    const c = document.createElement('canvas');
    c.width = g.canvas.width;
    c.height = g.canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  });
  const base64 = dataUrl.split(',')[1];
  writeFileSync(`${name}.png`, Buffer.from(base64, 'base64'));
  console.log(`saved ${name}.png`);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  });

  // Menu frame
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await wait(1800);
    await grabFrame(page, 'frame-menu-landscape');
    await page.setViewportSize({ width: 390, height: 844 });
    await wait(2500);
    await grabFrame(page, 'frame-menu-portrait');
    await page.close();
  }

  // Game frames (landscape)
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await wait(1800);
    await page.mouse.move(640, 308);
    await page.mouse.down();
    await page.mouse.up();
    await wait(1500);
    await grabFrame(page, 'frame-game-landscape');
    await page.keyboard.down('a');
    await wait(900);
    await page.keyboard.up('a');
    await grabFrame(page, 'frame-game-moved');
    await page.close();
  }

  // Game frame (portrait + joystick)
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
    await wait(1800);
    await page.mouse.click(360, 470);
    await wait(1500);
    await grabFrame(page, 'frame-game-portrait');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 100, y: 500, radiusX: 5, radiusY: 5, force: 1, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 210, y: 470, radiusX: 5, radiusY: 5, force: 1, id: 1 }],
    });
    await wait(800);
    await grabFrame(page, 'frame-game-portrait-joystick');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});