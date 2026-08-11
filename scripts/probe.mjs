import { writeFileSync } from 'node:fs';
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
  await wait(2000);
  await page.mouse.move(640, 308);
  await page.mouse.down();
  await page.mouse.up();
  await wait(3500);

  const diag = await page.evaluate(() => {
    const g = window.__pg;
    const scene = g.scene.getScene('GameScene');
    if (!scene || !scene.scene.isActive() || !scene.enemies) {
      return { ok: false, reason: 'scene or enemies missing' };
    }
    const children = scene.enemies.getChildren(true);
    const sample = children.slice(0, 5).map((e) => ({
      x: Math.round(e.x),
      y: Math.round(e.y),
      hp: Math.round(e.stats.hp),
      tint: e.tintTopLeft,
    }));
    return {
      ok: true,
      enemyCount: scene.enemies.countActive(true),
      totalInGroup: scene.enemies.getChildren().length,
      playerHp: scene.player.stats.hp,
      sample,
    };
  });
  console.log('enemy diag:', JSON.stringify(diag, null, 1));

  await page.keyboard.down('a');
  await wait(800);
  await page.keyboard.up('a');

  const diag2 = await page.evaluate(() => {
    const g = window.__pg;
    const scene = g.scene.getScene('GameScene');
    return {
      enemyCount: scene.enemies.countActive(true),
      playerHp: scene.player.stats.hp,
      playerPos: { x: Math.round(scene.player.x), y: Math.round(scene.player.y) },
    };
  });
  console.log('after move:', JSON.stringify(diag2));

  await wait(6000);

  const diag3 = await page.evaluate(() => {
    const g = window.__pg;
    const scene = g.scene.getScene('GameScene');
    const children = scene.enemies.getChildren(true) ?? [];
    let nearest = null;
    let minD = Infinity;
    for (const e of children) {
      const d = Math.hypot(e.x - scene.player.x, e.y - scene.player.y);
      if (d < minD) {
        minD = d;
        nearest = { d: Math.round(d), x: Math.round(e.x), y: Math.round(e.y), hp: Math.round(e.stats.hp) };
      }
    }
    return {
      enemyCount: scene.enemies.countActive(true),
      playerHp: scene.player.stats.hp,
      invuln: scene.invulnTimer,
      nearest,
      firstEnemyVel: children[0]
        ? {
            vx: Math.round(children[0].body.velocity.x),
            vy: Math.round(children[0].body.velocity.y),
          }
        : null,
    };
  });
  console.log('after contact wait:', JSON.stringify(diag3));

  const frame = await page.evaluate(async () => {
    const g = window.__pg;
    const img = await new Promise((resolve) => g.renderer.snapshot(resolve));
    const c = document.createElement('canvas');
    c.width = g.canvas.width;
    c.height = g.canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  });
  writeFileSync('frame-enemies.png', Buffer.from(frame.split(',')[1], 'base64'));
  console.log('saved frame-enemies.png');

  await browser.close();
}

main().catch((err) => {
  console.error('PROBE FAILED:', err.message);
  process.exit(1);
});