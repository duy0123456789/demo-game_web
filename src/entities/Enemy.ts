import Phaser from 'phaser';
import { TEX } from '../scenes/BootScene';

export interface EnemyStats {
  maxHp: number;
  hp: number;
  damage: number;
  speed: number;
  xpValue: number;
}

export interface EnemyOptions {
  stats: EnemyStats;
  radius: number;
  color: number;
  spriteScale: number;
  xpValue: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly stats: EnemyStats;
  readonly radius: number;
  readonly xpValue: number;
  private hitFlashTimer = 0;
  private readonly baseColor: number;
  private readonly hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: EnemyOptions) {
    super(scene, x, y, TEX.enemyCircle);
    this.stats = opts.stats;
    this.radius = opts.radius;
    this.xpValue = opts.xpValue;
    this.baseColor = opts.color;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(opts.radius * opts.spriteScale * 0.33);
    body.setOffset(0, 0);
    body.setMaxVelocity(400, 400);

    this.setScale(opts.spriteScale);
    this.setTint(opts.color);
    this.setDepth(5);

    this.hpBar = scene.add.graphics().setDepth(6);
    this.setActive(true);
  }

  get alive(): boolean {
    return this.active;
  }

  update(time: number, delta: number, target: { x: number; y: number }): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      body.setVelocity(0, 0);
    } else {
      body.setVelocity((dx / dist) * this.stats.speed, (dy / dist) * this.stats.speed);
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= delta;
      if (this.hitFlashTimer <= 0) {
        this.hitFlashTimer = 0;
        this.setTint(this.baseColor);
      }
    }
    void time;
    this.drawHpBar();
  }

  takeDamage(amount: number): void {
    this.stats.hp -= amount;
    this.hitFlashTimer = 100;
    this.setTint(0xffffff);
    this.drawHpBar();
  }

  get hpRatio(): number {
    return Math.max(0, this.stats.hp / this.stats.maxHp);
  }

  private drawHpBar(): void {
    const g = this.hpBar;
    g.clear();
    if (this.hpRatio >= 1) {
      g.setVisible(false);
      return;
    }
    g.setVisible(true);
    const w = this.radius * 1.8;
    const h = 4;
    const x = this.x - w / 2;
    const y = this.y - this.radius - 10;
    g.fillStyle(0x0b0b16, 0.8);
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(0xff5c5c, 1);
    g.fillRect(x, y, w * this.hpRatio, h);
  }

  destroy(fromScene?: boolean): void {
    this.hpBar.destroy();
    super.destroy(fromScene);
  }
}