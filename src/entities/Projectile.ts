import Phaser from 'phaser';
import { TEX } from '../scenes/BootScene';

export interface ProjectileFireOptions {
  damage: number;
  speed: number;
  maxRange: number;
  pierceLeft: number;
  knockback: number;
  bulletColor: number;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private damage = 0;
  private maxRange = 400;
  private travelled = 0;
  private alive = false;
  private pierceLeft = 0;
  private knockback = 0;
  private speed = 500;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.bullet);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(4);
    body.setAllowGravity(false);
    this.setVisible(false);
    this.disableBody(true, true);
  }

  fire(
    x: number,
    y: number,
    angle: number,
    opts: ProjectileFireOptions,
  ): void {
    this.damage = opts.damage;
    this.speed = opts.speed;
    this.maxRange = opts.maxRange;
    this.pierceLeft = opts.pierceLeft;
    this.knockback = opts.knockback;
    this.travelled = 0;
    this.alive = true;

    this.setPosition(x, y);
    this.setAngle(Phaser.Math.RadToDeg(angle));
    this.setTint(opts.bulletColor);
    this.setActive(true);
    this.setVisible(true);
    this.enableBody(true, x, y, true, true);

    const dirA = Math.cos(angle) * this.speed;
    const dirB = Math.sin(angle) * this.speed;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(dirA, dirB);
  }

  update(_time: number, delta: number): void {
    if (!this.alive) return;
    this.travelled += (this.speed * delta) / 1000;
    if (this.travelled >= this.maxRange) {
      this.killProjectile();
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body || !body.enable) {
      this.alive = false;
      return;
    }
  }

  hitEnemy(): void {
    if (this.pierceLeft > 0) {
      this.pierceLeft -= 1;
      return;
    }
    this.killProjectile();
  }

  getDamage(): number {
    return this.damage;
  }

  getKnockback(): number {
    return this.knockback;
  }

  getSpeedX(): number {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.velocity.x;
  }

  getSpeedY(): number {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.velocity.y;
  }

  killProjectile(): void {
    if (!this.alive) return;
    this.alive = false;
    this.setActive(false);
    this.setVisible(false);
    this.disableBody(true, true);
  }
}