import Phaser from 'phaser';
import { TEX } from '../scenes/BootScene';

export interface PlayerStats {
  maxHp: number;
  hp: number;
  damage: number;
  moveSpeed: number;
  attackSpeed: number;
  attackRange: number;
  criticalChance: number;
  criticalMultiplier: number;
  projectileCount: number;
  projectileSpeed: number;
  pickupRange: number;
  xpMultiplier: number;
  lifesteal: number;
}

export function basePlayerStats(): PlayerStats {
  return {
    maxHp: 100,
    hp: 100,
    damage: 10,
    moveSpeed: 220,
    attackSpeed: 1.5,
    attackRange: 420,
    criticalChance: 0.1,
    criticalMultiplier: 1.5,
    projectileCount: 1,
    projectileSpeed: 520,
    pickupRange: 70,
    xpMultiplier: 1,
    lifesteal: 0,
  };
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  stats: PlayerStats;
  facing: 'left' | 'right' = 'right';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.player);
    this.stats = basePlayerStats();
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 12);
    body.setOffset(3, 1);
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(this.stats.moveSpeed, this.stats.moveSpeed);

    this.setScale(2);
    this.setDepth(10);
  }

  move(direction: { x: number; y: number }): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = this.stats.moveSpeed;
    const len = Math.hypot(direction.x, direction.y);
    if (len > 1) {
      direction.x /= len;
      direction.y /= len;
    }
    body.setMaxVelocity(speed, speed);
    body.setVelocity(direction.x * speed, direction.y * speed);

    if (direction.x < 0) {
      this.facing = 'left';
    } else if (direction.x > 0) {
      this.facing = 'right';
    }
    this.setFlipX(this.facing === 'left');
  }
}