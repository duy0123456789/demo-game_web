import Phaser from 'phaser';
import { Enemy } from './Enemy';

export const BOSS_MAX_HP = 1500;
const CHARGE_COOLDOWN = 3800;
const CHARGE_TIME = 380;
const CHARGE_SPEED = 1300;
const CHARGE_RANGE = 340;

export class Boss extends Enemy {
  private chargeCooldown = CHARGE_COOLDOWN / 2;
  private charging = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      stats: {
        maxHp: BOSS_MAX_HP,
        hp: BOSS_MAX_HP,
        damage: 18,
        speed: 80,
        xpValue: 150,
      },
      radius: 40,
      color: 0xffffff,
      spriteScale: 3,
      xpValue: 150,
    });
  }

  update(time: number, delta: number, target: { x: number; y: number }): void {
    super.update(time, delta, target);
    this.chargeCooldown -= delta;

    if (this.charging > 0) {
      this.charging -= delta;
      const body = this.body as Phaser.Physics.Arcade.Body;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      body.setVelocity((dx / dist) * CHARGE_SPEED, (dy / dist) * CHARGE_SPEED);
      return;
    }

    if (this.chargeCooldown <= 0) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      if (Math.hypot(dx, dy) < CHARGE_RANGE) {
        this.chargeCooldown = CHARGE_COOLDOWN;
        this.charging = CHARGE_TIME;
        this.scene.cameras.main.shake(60, 0.002);
      }
    }
    void time;
  }
}