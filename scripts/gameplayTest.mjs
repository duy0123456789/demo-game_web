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
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await wait(3200);
  await page.mouse.move(640, 308);
  await page.mouse.down();
  await page.mouse.up();
  await wait(3200);

  const results = await page.evaluate(async () => {
    const scene = window.__pg.scene.getScene('GameScene');
    const out = {};
    const enemy = scene.enemies.getChildren(true)[0];
    if (!enemy) {
      out.noEnemy = true;
      return out;
    }
    enemy.setPosition(scene.player.x + 160, scene.player.y);
    enemy.stats.hp = 5;
    enemy.stats.maxHp = 5;
    const killsBefore = scene.killCount;
    await new Promise((res) => scene.time.delayedCall(1800, res));
    out.killsBefore = killsBefore;
    out.killsAfter = scene.killCount;
    out.projectilesActive = scene.combat.projectilesGroup.countActive(true);
    out.orbsActive = scene.xpOrbs.countActive(true);
    out.orbValue = out.orbsActive > 0 ? scene.xpOrbs.getChildren(true)[0].getData('xpValue') : null;
    out.enemyStillActive = enemy.active;
    out.damageNumbersOnScreen = scene.combat.damageNumbers.length;
    return out;
  });
  console.log('KILL TEST:', JSON.stringify(results));

  const teleportCheck = await page.evaluate(async () => {
    const scene = window.__pg.scene.getScene('GameScene');
    const enemy = scene.enemies.getChildren(true)[0];
    if (!enemy) return { noEnemy: true };
    enemy.setPosition(scene.player.x + 200, scene.player.y);
    await new Promise((res) => scene.time.delayedCall(300, res));
    const ps = scene.combat.projectilesGroup.getChildren(true);
    return {
      projectiles: ps.length,
      proj: ps[0]
        ? {
            x: Math.round(ps[0].x),
            vx: Math.round(ps[0].body.velocity.x),
          }
        : null,
    };
  });
  console.log('FLIGHT TEST:', JSON.stringify(teleportCheck));

  console.log('ORB PICKUP (phase5 stub) — orb magnet not yet active');
  console.log('errors:', errs.length);
  for (const e of errs) console.log('ERR:', e);

  await browser.close();
  if (errs.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});