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

  const pickup = await page.evaluate(async () => {
    const scene = window.__pg.scene.getScene('GameScene');
    const out = {};
    const orb = scene.xpOrbs.getChildren(true)[0];
    if (!orb) return { noOrb: true };
    scene.xp = scene.xpToNext - 1;
    orb.setPosition(scene.player.x + 40, scene.player.y);
    out.orbDistBefore = Math.round(Math.hypot(orb.x - scene.player.x, orb.y - scene.player.y));
    await new Promise((res) => scene.time.delayedCall(900, res));
    out.xp = scene.xp;
    out.level = scene.level;
    out.levelUpSequence = scene.levelUpSequence;
    out.panelShown = !!scene.upgradePanel && !!scene.upgradePanel.container;
    out.worldPaused = scene.physics.world.isPaused;
    return out;
  });
  console.log('PICKUP TEST:', JSON.stringify(pickup));

  const pickUpgrade = await page.evaluate(async () => {
    const scene = window.__pg.scene.getScene('GameScene');
    const out = {};
    const cards = scene.upgradePanel.container.list.filter((g) => g.type === 'Container');
    out.cardCount = cards.length;
    out.countsBefore = Object.fromEntries(scene.upgradeCounts);
    out.damageBefore = scene.player.stats.damage;
    if (cards.length > 0) cards[0].emit('pointerup');
    await new Promise((res) => scene.time.delayedCall(200, res));
    out.levelUpSequence = scene.levelUpSequence;
    out.worldPaused = scene.physics.world.isPaused;
    out.countsAfter = Object.fromEntries(scene.upgradeCounts);
    out.damageAfter = scene.player.stats.damage;
    return out;
  });
  console.log('UPGRADE PICK TEST:', JSON.stringify(pickUpgrade));

  const hud = await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('GameScene');
    return {
      levelText: scene.levelText.text,
      xpBarWidth: Math.round(scene.xpBarFill.width),
      coinText: scene.coinText.text,
      timerText: scene.timerText.text,
    };
  });
  console.log('HUD TEST:', JSON.stringify(hud));

  await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('GameScene');
    scene.elapsedMs = 4 * 60 * 1000;
  });
  await wait(500);
  const bossSpawn = await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('GameScene');
    const out = {
      bossExists: !!scene.boss,
      bossHp: scene.boss ? scene.boss.stats.maxHp : null,
      hpBarVisible: scene.bossHpBarFill.visible,
      bossX: scene.boss ? Math.round(scene.boss.x) : null,
    };
    if (scene.boss) scene.boss.stats.hp = 1;
    return out;
  });
  console.log('BOSS TEST:', JSON.stringify(bossSpawn));

  await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('GameScene');
    if (scene.boss) scene.boss.setPosition(scene.player.x + 130, scene.player.y);
  });
  await wait(1800);
  const bossDead = await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('GameScene');
    return { bossAlive: scene.boss ? scene.boss.active : null, runOver: scene.runOver };
  });
  console.log('BOSS KILL TEST:', JSON.stringify(bossDead));

  await wait(900);
  const victory = await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('ResultScene');
    const out = { sceneActive: scene.scene.isActive() };
    if (scene.scene.isActive()) {
      const r = scene.result;
      out.victory = r.victory;
      out.level = r.level;
      out.kills = r.kills;
      out.coinsEarned = r.coinsEarned;
      const titles = scene.children.list.filter((g) => g.type === 'Text' && /VICTORY|DEFEATED/.test(g.text));
      out.title = titles.length > 0 ? titles[0].text : null;
    }
    return out;
  });
  console.log('VICTORY TEST:', JSON.stringify(victory));

  await page.evaluate(() => {
    window.__pg.scene.getScene('ResultScene').scene.start('GameScene');
  });
  await wait(4500);
  const defeat = await page.evaluate(() => {
    const scene = window.__pg.scene.getScene('GameScene');
    const enemy = scene.enemies.getChildren(true)[0];
    if (!enemy) return { noEnemy: true };
    scene.invulnTimer = 0;
    scene.player.stats.hp = 1;
    enemy.setPosition(scene.player.x, scene.player.y);
    return { playerHp: scene.player.stats.hp, enemyPlaced: true };
  });
  console.log('DEFEAT SETUP TEST:', JSON.stringify(defeat));
  await wait(1300);
  const defeatResult = await page.evaluate(() => {
    const resultScene = window.__pg.scene.getScene('ResultScene');
    return {
      resultActive: resultScene.scene.isActive(),
      victory: resultScene.result ? resultScene.result.victory : null,
    };
  });
  console.log('DEFEAT TEST:', JSON.stringify(defeatResult));

  console.log('errors:', errs.length);
  for (const e of errs) console.log('ERR:', e);

  await browser.close();
  if (errs.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});