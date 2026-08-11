import Phaser from 'phaser';
import { SceneKey } from '../config/gameConfig';
import { buildPixelSprite } from '../utils/pixelSprite';
import { soundManager } from '../systems/SoundManager';

export const TEX = {
  pixel: 'tex-pixel',
  grid: 'tex-grid',
  coin: 'tex-coin',
  gem: 'tex-gem',
  star: 'tex-star',
  player: 'sprite-player',
  rock: 'sprite-rock',
  enemyCircle: 'sprite-enemy',
  boss: 'sprite-boss',
  bullet: 'tex-bullet',
  xp: 'tex-xp',
} as const;

const PLAYER_ROWS: string[] = [
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '..HHHHHHHHHHHH..',
  '..SSSSSSSSSSSS..',
  '..SSEESSSSEESS..',
  '.AAAAAAAAAAAAAA.',
  '.A..GGGGGGGG..A.',
  '.A..GGGGGGGG..A.',
  '.A..LLLLLLLL..A.',
  '.AAAAAAAAAAAAAA.',
  '..AADDDDDDDDAA..',
  '...BBBBBBBBBB...',
  '...BBBBBBBBBB...',
];

const PLAYER_PALETTE: Record<string, number> = {
  H: 0x27406e,
  S: 0xe8b878,
  E: 0x0b0b16,
  A: 0x1f7a5c,
  L: 0x2ea97f,
  G: 0x9fb3c8,
  D: 0x0f3d2e,
  B: 0x5a4630,
};

const ROCK_ROWS: string[] = [
  '....GGGG....',
  '...GGGGGG...',
  '..GGGGGGGG..',
  '..GGWWGGGG..',
  '..GGGGGDDD..',
  '...GGGGDD...',
];

const ROCK_PALETTE: Record<string, number> = {
  G: 0x4a5878,
  W: 0x6b7c9e,
  D: 0x333c55,
};

const ENEMY_ROWS: string[] = [
  '....FFFFFF....',
  '..FFFFFFFF....',
  '..FFFFFFFFF...',
  '.F.FFFFFFFF..F',
  '.FFFFFFFFFFFF.',
  '.FF.FFFFFF.FF.',
  '.FFFFFFFFFFFF.',
  '...FFFF.FFF...',
  '....FFF.FFF...',
  '.....FF..FF...',
];

const ENEMY_PALETTE: Record<string, number> = {
  F: 0xffffff,
};

const BOSS_ROWS: string[] = [
  '...W....W....W...',
  '..WWW..WWW..WWW..',
  '.BBBBBBBBBBBBBBB.',
  'BVBBBBBBBBBBBBVB.',
  'BVBBBBBBBBBBBBVB.',
  'BVVVVYYVVVYYVVVVB',
  'BVVVYKKYVVYKKYVVB',
  'BVVVVYYVVVYYVVVVB',
  'BVVVVVVVVVVVVVVVB',
  '.BBBBBBBBBBBBBBB.',
  '..BBBBBBBBBBBBB..',
];

const BOSS_PALETTE: Record<string, number> = {
  B: 0x4a1c6e,
  V: 0x8c4acf,
  W: 0xf0f0f8,
  Y: 0xffd23c,
  K: 0x0b0b16,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    soundManager.init(this.game);
    this.createPixelTexture();
    this.createGridTexture();
    this.createCoinTexture();
    this.createGemTexture();
    this.createStarTexture();
    buildPixelSprite(this, TEX.player, PLAYER_ROWS, PLAYER_PALETTE);
    buildPixelSprite(this, TEX.rock, ROCK_ROWS, ROCK_PALETTE);
    buildPixelSprite(this, TEX.enemyCircle, ENEMY_ROWS, ENEMY_PALETTE);
    buildPixelSprite(this, TEX.boss, BOSS_ROWS, BOSS_PALETTE);
    this.createBulletTexture();
    this.createXpTexture();
    this.scene.start(SceneKey.Preload);
  }

  private createPixelTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture(TEX.pixel, 1, 1);
    g.destroy();
  }

  private createGridTexture(): void {
    const size = 32;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x101024, 1);
    g.fillRect(0, 0, size, size);
    g.fillStyle(0x12122a, 1);
    g.fillRect(0, 0, size / 2, size / 2);
    g.fillRect(size / 2, size / 2, size / 2, size / 2);
    g.generateTexture(TEX.grid, size, size);
    g.destroy();
  }

  private createCoinTexture(): void {
    const size = 28;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7a4a00, 1);
    g.fillCircle(14, 14, 14);
    g.fillStyle(0xffc832, 1);
    g.fillCircle(14, 14, 12);
    g.fillStyle(0xffe08a, 1);
    g.fillRect(7, 6, 15, 5);
    g.fillStyle(0xffb020, 1);
    g.fillRect(7, 18, 15, 4);
    g.generateTexture(TEX.coin, size, size);
    g.destroy();
  }

  private createGemTexture(): void {
    const size = 28;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7a1c8a, 1);
    g.setAlpha(0.4);
    g.fillPoints(
      [
        new Phaser.Geom.Point(14, 2),
        new Phaser.Geom.Point(26, 14),
        new Phaser.Geom.Point(14, 26),
        new Phaser.Geom.Point(2, 14),
      ],
      true,
    );
    g.setAlpha(1);
    g.fillStyle(0xc84dff, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(14, 5),
        new Phaser.Geom.Point(23, 14),
        new Phaser.Geom.Point(14, 23),
        new Phaser.Geom.Point(5, 14),
      ],
      true,
    );
    g.fillStyle(0xe8a8ff, 1);
    g.fillPoints(
      [
        new Phaser.Geom.Point(14, 5),
        new Phaser.Geom.Point(23, 14),
        new Phaser.Geom.Point(14, 14),
      ],
      true,
    );
    g.generateTexture(TEX.gem, size, size);
    g.destroy();
  }

  private createStarTexture(): void {
    const size = 28;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffd23c, 1);
    g.fillPoints(starPoints(14, 14, 13, 6, 5), true);
    g.fillStyle(0xfff0b0, 1);
    g.fillPoints(starPoints(14, 12, 6, 3, 5), true);
    g.generateTexture(TEX.star, size, size);
    g.destroy();
  }

  private createBulletTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 2, 7, 2);
    g.fillRect(1, 1, 6, 4);
    g.fillRect(7, 1, 3, 1);
    g.fillRect(7, 4, 3, 1);
    g.generateTexture(TEX.bullet, 12, 6);
    g.destroy();
  }

  private createXpTexture(): void {
    const size = 9;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2ee6a8, 1);
    g.fillCircle(4.5, 4.5, 4.5);
    g.fillStyle(0x9dffdf, 1);
    g.fillCircle(3, 3, 2.2);
    g.generateTexture(TEX.xp, size, size);
    g.destroy();
  }
}

function starPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  spikes: number,
): Phaser.Geom.Point[] {
  const points: Phaser.Geom.Point[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = i * step - Math.PI / 2;
    points.push(new Phaser.Geom.Point(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
  }
  return points;
}