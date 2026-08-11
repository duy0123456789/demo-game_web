import Phaser from 'phaser';
import { SceneKey } from '../config/gameConfig';

export const TEX = {
  pixel: 'tex-pixel',
  grid: 'tex-grid',
  coin: 'tex-coin',
  gem: 'tex-gem',
  star: 'tex-star',
} as const;

function starPoints(cx: number, cy: number, outer: number, inner: number, spikes: number): Phaser.Geom.Point[] {
  const points: Phaser.Geom.Point[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = i * step - Math.PI / 2;
    points.push(new Phaser.Geom.Point(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
  }
  return points;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    this.createPixelTexture();
    this.createGridTexture();
    this.createCoinTexture();
    this.createGemTexture();
    this.createStarTexture();
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
}