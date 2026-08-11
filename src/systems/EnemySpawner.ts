import Phaser from 'phaser';
import { getEnemyTypesAtTime } from '../data/enemies';
import type { EnemyTypeData } from '../data/enemies';
import { Enemy } from '../entities/Enemy';
import { WORLD } from '../config/gameConfig';

interface SpawnWave {
  intervalMs: number;
  perSpawn: number;
}

const HP_FACTOR = 1 / 3;
const SPEED_FACTOR = 0.7;

export class EnemySpawner {
  private readonly scene: Phaser.Scene;
  private readonly group: Phaser.Physics.Arcade.Group;
  private readonly player: Phaser.Physics.Arcade.Sprite;
  private spawnTimer = 2500;
  private timeSeconds = 0;
  private readonly maxAlive: number;

  constructor(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    player: Phaser.Physics.Arcade.Sprite,
    maxAlive: number,
  ) {
    this.scene = scene;
    this.group = group;
    this.player = player;
    this.maxAlive = maxAlive;
  }

  update(delta: number): void {
    this.timeSeconds += delta / 1000;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      const wave = this.currentWave();
      this.spawnTimer = wave.intervalMs;
      const alive = this.group.countActive(true);
      const budget = Math.max(0, this.maxAlive - alive);
      const count = Math.min(wave.perSpawn, budget);
      for (let i = 0; i < count; i += 1) {
        this.spawnOne();
      }
    }
  }

  get elapsedSeconds(): number {
    return this.timeSeconds;
  }

  private currentWave(): SpawnWave {
    const t = this.timeSeconds;
    if (t < 60) return { intervalMs: 1500, perSpawn: 1 };
    if (t < 120) return { intervalMs: 1150, perSpawn: 2 };
    if (t < 180) return { intervalMs: 950, perSpawn: 2 };
    return { intervalMs: 750, perSpawn: 3 };
  }

  private spawnOne(): void {
    const t = this.timeSeconds;
    const available = getEnemyTypesAtTime(t);
    const type = pickWeighted(available);

    const viewW = this.scene.scale.gameSize.width;
    const viewH = this.scene.scale.gameSize.height;
    const minDist = Math.hypot(viewW, viewH) / 2 + 220;
    const maxDist = minDist + 420;

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.FloatBetween(minDist, maxDist);
    let x = this.player.x + Math.cos(angle) * dist;
    let y = this.player.y + Math.sin(angle) * dist;
    x = Phaser.Math.Clamp(x, 30, WORLD.width - 30);
    y = Phaser.Math.Clamp(y, 30, WORLD.height - 30);

    const scale = this.difficultyMultiplier();
    const enemy = new Enemy(this.scene, x, y, {
      stats: {
        maxHp: Math.max(1, Math.round(type.maxHp * scale.hp * HP_FACTOR)),
        hp: Math.max(1, Math.round(type.maxHp * scale.hp * HP_FACTOR)),
        damage: Math.round(type.damage * scale.damage),
        speed: type.speed * scale.speed * SPEED_FACTOR,
        xpValue: type.xpValue,
      },
      radius: type.radius,
      color: type.color,
      spriteScale: type.spriteScale,
      xpValue: type.xpValue,
    });
    this.group.add(enemy);
  }

  private difficultyMultiplier(): { hp: number; damage: number; speed: number } {
    const t = this.timeSeconds;
    const hp = 1 + t / 60 * 0.12;
    const damage = 1 + t / 60 * 0.06;
    const speed = 1 + Math.min(0.25, t / 60 * 0.03);
    return { hp, damage, speed };
  }
}

function pickWeighted(types: readonly EnemyTypeData[]): EnemyTypeData {
  let total = 0;
  for (const t of types) total += t.spawnWeight;
  let roll = Math.random() * total;
  for (const t of types) {
    roll -= t.spawnWeight;
    if (roll <= 0) return t;
  }
  return types[types.length - 1];
}