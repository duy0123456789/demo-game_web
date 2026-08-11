import Phaser from 'phaser';
import { isPortrait, SceneKey, UI, WORLD } from '../config/gameConfig';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { EnemySpawner } from '../systems/EnemySpawner';
import { CombatSystem } from '../systems/CombatSystem';
import {
  applyUpgrade,
  buildUpgradeOption,
  canStack,
  rollRarity,
  xpRequiredForLevel,
} from '../systems/UpgradeSystem';
import type { UpgradeKind, UpgradeOption } from '../systems/UpgradeSystem';
import { weaponById } from '../data/weapons';
import { saveManager } from '../systems/SaveManager';
import { Joystick } from '../ui/Joystick';
import { UpgradePanel } from '../ui/UpgradePanel';
import { TEX } from './BootScene';

const GRID_ALPHA = 0.5;
const ROCK_COUNT = 140;
const PATCH_COUNT = 26;
const ENEMY_MAX = 70;
const INVULN_MS = 900;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private joystick: Joystick | null = null;
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  };
  private enemies!: Phaser.Physics.Arcade.Group;
  private spawner!: EnemySpawner;
  private combat!: CombatSystem;
  private xpOrbs!: Phaser.Physics.Arcade.Group;
  private killCount = 0;
  private invulnTimer = 0;
  private xp = 0;
  private xpToNext = xpRequiredForLevel(1);
  private level = 1;
  private upgradeCounts = new Map<UpgradeKind, number>();
  private upgradePanel: UpgradePanel | null = null;
  private levelUpSequence = false;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private elapsedMs = 0;
  private isTouchDevice = false;
  private useJoystick = false;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const worldW = WORLD.width;
    const worldH = WORLD.height;
    this.isTouchDevice = this.sys.game.device.input.touch;
    this.useJoystick = this.isTouchDevice && isPortrait();

    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.createGround(worldW, worldH);
    this.createDecorations(worldW, worldH);

    this.player = new Player(this, worldW / 2, worldH / 2);

    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false });
    this.spawner = new EnemySpawner(this, this.enemies, this.player, ENEMY_MAX);
    this.xpOrbs = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      allowGravity: false,
    });
    this.combat = new CombatSystem(
      this,
      this.player,
      this.enemies,
      weaponById(this.registry.get('weaponId') as string | undefined ?? 'pistol'),
      {
        onEnemyKilled: (enemy, xpValue, x, y) => this.onEnemyKilled(enemy, xpValue, x, y),
      },
    );
    this.upgradePanel = new UpgradePanel(this, (opt) => this.onUpgradePicked(opt));

    this.setupCamera(width, height, worldW, worldH);
    this.setupInput();
    this.createHud(width);
    this.createHint(width, height);
  }

  update(time: number, delta: number): void {
    if (!this.player || !this.player.active) return;
    if (this.levelUpSequence) return;

    this.player.move(this.computeMoveInput());
    this.spawner.update(delta);
    this.combat.update(delta);
    this.updateXpOrbs(delta);

    const target = { x: this.player.x, y: this.player.y };
    const children = this.enemies.getChildren() as Enemy[];
    for (const enemy of children) {
      if (enemy.active) enemy.update(time, delta, target);
    }

    this.handleEnemyContact(time, delta);
    this.updateHud();
  }

  private createGround(worldW: number, worldH: number): void {
    this.add
      .tileSprite(worldW / 2, worldH / 2, worldW, worldH, TEX.grid)
      .setAlpha(GRID_ALPHA)
      .setDepth(-20);
  }

  private createDecorations(worldW: number, worldH: number): void {
    for (let i = 0; i < PATCH_COUNT; i += 1) {
      const w = Phaser.Math.Between(240, 900);
      const h = Phaser.Math.Between(240, 900);
      this.add
        .rectangle(
          Phaser.Math.Between(0, worldW - w),
          Phaser.Math.Between(0, worldH - h),
          w,
          h,
          0x0f0f22,
        )
        .setAlpha(0.55)
        .setDepth(-19);
    }

    for (let i = 0; i < ROCK_COUNT; i += 1) {
      const scale = Phaser.Math.FloatBetween(1.2, 3.2);
      this.add
        .image(Phaser.Math.Between(40, worldW - 40), Phaser.Math.Between(40, worldH - 40), TEX.rock)
        .setScale(scale)
        .setAlpha(Phaser.Math.FloatBetween(0.5, 0.95))
        .setDepth(-18);
    }

    const border = 60;
    const borderColor = 0x1b2a4a;
    this.add.rectangle(worldW / 2, -border / 2, worldW + border * 2, border, borderColor).setDepth(-15);
    this.add.rectangle(worldW / 2, worldH + border / 2, worldW + border * 2, border, borderColor).setDepth(-15);
    this.add.rectangle(-border / 2, worldH / 2, border, worldH + border * 2, borderColor).setDepth(-15);
    this.add.rectangle(worldW + border / 2, worldH / 2, border, worldH + border * 2, borderColor).setDepth(-15);
  }

  private setupCamera(viewW: number, viewH: number, worldW: number, worldH: number): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setDeadzone(viewW * 0.28, viewH * 0.28);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.roundPixels = true;
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      cursors: kb.createCursorKeys(),
    };
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.scene.start(SceneKey.MainMenu);
    });

    if (this.isTouchDevice) {
      this.joystick = new Joystick(this, this.useJoystick ? 90 : 70);
    }
  }

  private computeMoveInput(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    const keys = this.keys;

    const up = keys.w.isDown || keys.cursors.up.isDown;
    const down = keys.s.isDown || keys.cursors.down.isDown;
    const left = keys.a.isDown || keys.cursors.left.isDown;
    const right = keys.d.isDown || keys.cursors.right.isDown;
    if (up) y -= 1;
    if (down) y += 1;
    if (left) x -= 1;
    if (right) x += 1;

    if (this.joystick && this.joystick.active) {
      const joy = this.joystick.vector;
      x += joy.x;
      y += joy.y;
    }

    const pointer = this.input.activePointer;
    if (!this.useJoystick && !this.isTouchDevice && pointer.primaryDown) {
      const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y, new Phaser.Math.Vector2());
      const dx = worldPt.x - this.player.x;
      const dy = worldPt.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 24) {
        x += dx / dist;
        y += dy / dist;
      }
    }

    return { x, y };
  }

  private onEnemyKilled(_enemy: Enemy, xpValue: number, x: number, y: number): void {
    this.killCount += 1;
    saveManager.addCoins(1);
    const orb = this.xpOrbs.get(x, y, TEX.xp) as Phaser.Physics.Arcade.Image | null;
    if (orb) {
      orb.setActive(true);
      orb.setVisible(true);
      orb.setData('xpValue', xpValue);
    }
  }

private updateXpOrbs(delta: number): void {
    const orbs = this.xpOrbs.getChildren() as Phaser.Physics.Arcade.Image[];
    if (orbs.length === 0) return;
    const px = this.player.x;
    const py = this.player.y;
    const magnet = this.player.stats.pickupRange;
    for (const orb of orbs) {
      if (!orb.active) continue;
      const dx = px - orb.x;
      const dy = py - orb.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= magnet && dist > 14) {
        const pull = Math.min(1, (magnet - dist) / magnet + 0.25);
        const step = 340 * pull * (delta / 1000);
        orb.setPosition(orb.x + (dx / dist) * step, orb.y + (dy / dist) * step);
      }
      orb.angle += delta * 0.04;
      if (dist < 14) {
        const value = (orb.getData('xpValue') as number) ?? 1;
        orb.setActive(false);
        orb.setVisible(false);
        this.gainXp(value);
      }
    }
  }

  private gainXp(rawValue: number): void {
    this.xp += Math.round(rawValue * this.player.stats.xpMultiplier);
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = xpRequiredForLevel(this.level);
      leveled = true;
    }
    if (leveled) this.triggerLevelUp();
  }

  private triggerLevelUp(): void {
    if (this.levelUpSequence) return;
    this.levelUpSequence = true;
    this.time.delayedCall(90, () => {
      if (!this.scene.isActive()) return;
      const options = this.rollUpgradeOptions();
      this.upgradePanel?.show(options, this.level);
      this.physics.pause();
    });
  }

  private rollUpgradeOptions(): UpgradeOption[] {
    const available = this.availableKinds();
    const options: UpgradeOption[] = [];
    for (let i = 0; i < 3 && available.length > 0; i += 1) {
      const idx = Math.floor(Math.random() * available.length);
      const kind = available.splice(idx, 1)[0];
      const stacked = this.upgradeCounts.get(kind) ?? 0;
      options.push(buildUpgradeOption(kind, rollRarity(), stacked));
    }
    return options;
  }

  private availableKinds(): UpgradeKind[] {
    const all = [
      'damage',
      'attackSpeed',
      'maxHp',
      'moveSpeed',
      'criticalChance',
      'projectile',
      'attackRange',
      'xpGain',
      'pickupRange',
      'bulletSpeed',
      'lifesteal',
      'criticalDamage',
    ] as const;
    const out: UpgradeKind[] = [];
    for (const k of all) {
      if (canStack(k, this.upgradeCounts.get(k) ?? 0)) out.push(k);
    }
    return out;
  }

  private onUpgradePicked(opt: UpgradeOption): void {
    applyUpgrade(this.player, opt);
    this.upgradeCounts.set(opt.kind, (this.upgradeCounts.get(opt.kind) ?? 0) + 1);
    this.upgradePanel?.hide();
    this.levelUpSequence = false;
    this.physics.resume();
    this.player.move({ x: 0, y: 0 });
  }

  private handleEnemyContact(time: number, delta: number): void {
    this.invulnTimer = Math.max(0, this.invulnTimer - delta);
    if (this.invulnTimer > 0) return;

    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (!playerBody || !playerBody.enable) return;
    const children = this.enemies.getChildren() as Enemy[];
    for (const enemy of children) {
      if (!enemy.active) continue;
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (!enemyBody.enable) continue;
      const dx = playerBody.center.x - enemyBody.center.x;
      const dy = playerBody.center.y - enemyBody.center.y;
      const minDist = playerBody.halfWidth + enemy.radius;
      if (dx * dx + dy * dy <= minDist * minDist) {
        this.hurtPlayer(enemy.stats.damage);
        break;
      }
    }
    void time;
  }

  private hurtPlayer(damage: number): void {
    this.player.stats.hp = Math.max(0, this.player.stats.hp - damage);
    this.invulnTimer = INVULN_MS;
    this.player.setTint(0xff8888);
    this.cameras.main.shake(120, 0.004);
    this.time.delayedCall(INVULN_MS, () => {
      if (this.player && this.player.active) this.player.clearTint();
    });

    if (this.player.stats.hp <= 0) {
      this.player.disableBody(true, true);
    }
  }

  private createHud(viewW: number): void {
    const x0 = 20;
    const y0 = 18;
    const w = viewW * 0.3;
    const h = 16;
    this.hpBarBg = this.add.rectangle(x0 + w / 2, y0, w, h, 0x0b0b16, 0.8).setScrollFactor(0).setDepth(1000);
    this.hpBarFill = this.add
      .rectangle(x0 + 2, y0, w - 4, h - 4, 0x2ee6a8)
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0, 0.5);
    this.hpText = this.add
      .text(x0, y0 + h + 8, '', {
        fontFamily: UI.fontFallback,
        fontSize: '11px',
        color: '#e8f6ff',
      })
      .setScrollFactor(0)
      .setDepth(1001);

    this.xpBarBg = this.add
      .rectangle(x0 + w / 2, y0 + h + 34, w, 10, 0x0b0b16, 0.8)
      .setScrollFactor(0)
      .setDepth(1000);
    this.xpBarFill = this.add
      .rectangle(x0 + 2, y0 + h + 34, w - 4, 6, 0x4ec9ff)
      .setScrollFactor(0)
      .setDepth(1001)
      .setOrigin(0, 0.5);

    this.levelText = this.add
      .text(viewW - 20, 14, '', {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#ffd23c',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1001);
    this.coinText = this.add
      .text(viewW - 20, 36, '', {
        fontFamily: UI.fontFallback,
        fontSize: '11px',
        color: '#ffc832',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1001);
    this.timerText = this.add
      .text(viewW / 2, 14, '', {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1001);
  }

  private updateHud(): void {
    this.elapsedMs += this.game.loop.delta;
    const ratio = Phaser.Math.Clamp(this.player.stats.hp / this.player.stats.maxHp, 0, 1);
    this.hpBarFill.width = (this.hpBarBg.width - 4) * ratio;
    const color = ratio > 0.5 ? 0x2ee6a8 : ratio > 0.25 ? 0xffb020 : 0xff5c5c;
    this.hpBarFill.setFillStyle(color);
    this.hpText.setText(`HP ${this.player.stats.hp}/${this.player.stats.maxHp}`);

    this.xpBarFill.width = (this.xpBarBg.width - 4) * Phaser.Math.Clamp(this.xp / this.xpToNext, 0, 1);
    this.levelText.setText(`LV ${this.level}`);
    this.coinText.setText(`$ ${saveManager.coins}`);
    const sec = Math.floor(this.elapsedMs / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`);
  }

  private createHint(viewW: number, viewH: number): void {
    const msg = this.isTouchDevice
      ? 'TOUCH TO MOVE'
      : 'WASD / ARROWS TO MOVE -- HOLD MOUSE TO WALK';
    const t = this.add
      .text(viewW / 2, viewH - 90, msg, {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#8a97b5',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(950);
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: 5000,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }
}