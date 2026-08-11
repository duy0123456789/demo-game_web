import { chromium } from 'playwright-core';

const URL = process.argv[2] ?? 'http://localhost:5199/';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 20000 });
  await wait(2500);
  await page.mouse.move(640, 308);
  await page.mouse.down();
  await page.mouse.up();
  await wait(2000);

  // 1) Phaser's own framebuffer readback
  const phaserPixels = await page.evaluate(async () => {
    const g = window.__pg;
    const img = await new Promise((resolve) => g.renderer.snapshot(resolve));
    const c = document.createElement('canvas');
    c.width = g.canvas.width;
    c.height = g.canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const px = (x, y) => {
      const i = (y * c.width + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    return {
      center: px(640, 360),
      sampleBrights: (() => {
        let n = 0;
        for (let y = 0; y < c.height; y += 8) {
          for (let x = 0; x < c.width; x += 8) {
            const i = (y * c.width + x) * 4;
            if (data[i] + data[i + 1] + data[i + 2] > 200) n += 1;
          }
        }
        return n;
      })(),
    };
  });

  // 2) Playwright compositor screenshot, right after
  const pwShot = await page.screenshot({ path: 'test-shot-compare.png' });

  // force a fresh frame and re-capture via playwright
  await wait(300);
  const pwShot2 = await page.screenshot({ path: 'test-shot-compare2.png' });

  console.log('phaser framebuffer:', JSON.stringify(phaserPixels));
  console.log('playwright shot1:', pwShot.length, 'bytes');
  console.log('playwright shot2:', pwShot2.length, 'bytes');
  await browser.close();
}

main().catch((err) => {
  console.error('PROBE FAILED:', err.message);
  process.exit(1);
});