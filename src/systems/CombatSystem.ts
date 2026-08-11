import Phaser from 'phaser';
import type { WeaponData } from '../data/weapons';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { TEX } from '../scenes/BootScene';
import { UI } from '../config/gameConfig';

export interface CombatCallbacks {
  onEnemyKilled: (enemy: Enemy, xpValue: number, x: number, y: number) => void;
}

const MAX_DAMAGE_NUMBERS = 36;

export class CombatSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemies: Phaser.Physics.Arcade.Group;
  private readonly projectiles: Phaser.Physics.Arcade.Group;
  private readonly callbacks: CombatCallbacks;
  private readonly weapon: WeaponData;
  private fireCooldown = 0;
  private damageNumbers: Phaser.GameObjects.Text[] = [];
  private muzzleFlashes: Phaser.GameObjects.Arc[] = [];
  private muzzleTimer = 0;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemies: Phaser.Physics.Arcade.Group,
    weapon: WeaponData,
    callbacks: CombatCallbacks,
  ) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.callbacks = callbacks;
    this.weapon = weapon;

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      maxSize: 140,
      allowGravity: false,
      runChildUpdate: false,
    });
  }

  get projectilesGroup(): Phaser.Physics.Arcade.Group {
    return this.projectiles;
  }

  update(delta: number): void {
    this.fireCooldown -= delta;
    this.autoAimAndFire();
    this.updateProjectiles(delta);
    this.checkProjectileHits();
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= delta;
      if (this.muzzleTimer <= 0) {
        for (const m of this.muzzleFlashes) m.setVisible(false);
      }
    }
  }

  private autoAimAndFire(): void {
    const nearest = this.findNearestEnemy(this.player.stats.attackRange);
    if (!nearest || this.fireCooldown > 0) return;

    this.fireCooldown = 1000 / this.player.stats.attackSpeed;
    const px = this.player.x;
    const py = this.player.y;
    const dx = nearest.x - px;
    const dy = nearest.y - py;
    const dir = Math.atan2(dy, dx);

    const count = this.player.stats.projectileCount;
    const spread = Phaser.Math.DegToRad(this.weapon.spreadAngle);
    for (let i = 0; i < count; i += 1) {
      const offset = count > 1 ? (i - (count - 1) / 2) * spread : 0;
      this.spawnProjectile(px, py, dir + offset);
    }
    this.spawnMuzzleFlash(px + Math.cos(dir) * 22, py + Math.sin(dir) * 22);
  }

  private spawnProjectile(x: number, y: number, angle: number): void {
    const p = this.projectiles.get(x, y, TEX.bullet) as Projectile | null;
    if (!p) return;
    p.fire(x, y, angle, {
      damage: this.player.stats.damage,
      speed: this.player.stats.projectileSpeed,
      maxRange: this.player.stats.attackRange,
      pierceLeft: this.weapon.specialEffect === 'pierce' ? this.weapon.pierceCount : 0,
      knockback: this.weapon.specialEffect === 'knockback' ? this.weapon.knockback : 0,
      bulletColor: this.weapon.bulletColor,
    });
  }

  private findNearestEnemy(range: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = range * range;
    const children = this.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active) continue;
      const dx = e.x - this.player.x;
      const dy = e.y - this.player.y;
      const d = dx * dx + dy * dy;
      if (d <= bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private updateProjectiles(delta: number): void {
    const children = this.projectiles.getChildren() as Projectile[];
    for (const p of children) {
      if (p.active) p.update(0, delta);
    }
  }

  private checkProjectileHits(): void {
    const children = this.projectiles.getChildren() as Projectile[];
    const enemies = this.enemies.getChildren() as Enemy[];
    for (const p of children) {
      if (!p.active) continue;
      for (const e of enemies) {
        if (!e.active) continue;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const hitDist = e.radius + 6;
        if (dx * dx + dy * dy <= hitDist * hitDist) {
          p.hitEnemy();
          this.applyDamageToEnemy(e, p);
          if (!p.active) break;
        }
      }
    }
  }

  private applyDamageToEnemy(enemy: Enemy, projectile: Projectile): void {
    const crit = Math.random() < this.player.stats.criticalChance;
    let dmg = projectile.getDamage();
    if (crit) {
      dmg *= this.player.stats.criticalMultiplier;
    }
    enemy.takeDamage(dmg);
    this.showDamageNumber(enemy.x, enemy.y - enemy.radius, dmg, crit);

    const kb = projectile.getKnockback();
    if (kb > 0) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      const dx = projectile.getSpeedX();
      const dy = projectile.getSpeedY();
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        body.setVelocity(body.velocity.x + (dx / len) * kb, body.velocity.y + (dy / len) * kb);
      }
    }

    if (enemy.stats.hp <= 0) {
      enemy.destroy();
      this.callbacks.onEnemyKilled(enemy, enemy.xpValue, enemy.x, enemy.y);
    }
  }

  private showDamageNumber(x: number, y: number, value: number, crit: boolean): void {
    if (this.damageNumbers.length >= MAX_DAMAGE_NUMBERS) {
      const oldest = this.damageNumbers.shift();
      if (oldest) oldest.destroy();
    }
    const text = this.scene.add
      .text(x, y, String(Math.round(value)), {
        fontFamily: UI.fontFallback,
        fontSize: crit ? '13px' : '10px',
        color: crit ? '#ffd23c' : '#ffffff',
        stroke: '#0b0b16',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);
    text.setScale(crit ? 1.35 : 1);
    this.damageNumbers.push(text);
    this.scene.tweens.add({
      targets: text,
      y: y - 34,
      alpha: 0,
      duration: 620,
      onComplete: () => {
        text.destroy();
        const idx = this.damageNumbers.indexOf(text);
        if (idx >= 0) this.damageNumbers.splice(idx, 1);
      },
    });
  }

  private spawnMuzzleFlash(x: number, y: number): void {
    let flash = this.muzzleFlashes.find((m) => !m.visible);
    if (!flash) {
      flash = this.scene.add.circle(0, 0, 5, 0xffe08a, 0.9).setDepth(11);
      this.muzzleFlashes.push(flash);
    }
    flash.setPosition(x, y);
    flash.setVisible(true);
    this.muzzleTimer = 70;
  }

  destroy(): void {
    for (const t of this.damageNumbers) t.destroy();
    for (const m of this.muzzleFlashes) m.destroy();
  }
}