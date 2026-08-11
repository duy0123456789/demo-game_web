import Phaser from 'phaser';
import { UI } from '../config/gameConfig';

export interface PixelButtonStyle {
  fill: number;
  fillHover: number;
  stroke: number;
  strokeHover: number;
  topLight: number;
  bottomShade: number;
  textColor: string;
}

export const BUTTON_STYLE_PRIMARY: PixelButtonStyle = {
  fill: 0x1f7a5c,
  fillHover: 0x2ea97f,
  stroke: 0x2ee6a8,
  strokeHover: 0x9dffdf,
  topLight: 0x45c795,
  bottomShade: 0x0f3d2e,
  textColor: '#eafff7',
};

export const BUTTON_STYLE_DEFAULT: PixelButtonStyle = {
  fill: 0x1b2a4a,
  fillHover: 0x294a6c,
  stroke: 0x4ec9ff,
  strokeHover: 0xa8e4ff,
  topLight: 0x33588e,
  bottomShade: 0x0d1526,
  textColor: '#e8f6ff',
};

export interface PixelButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: number;
  style?: PixelButtonStyle;
  onClick: () => void;
}

export class PixelButton {
  readonly container: Phaser.GameObjects.Container;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;
  private readonly style: PixelButtonStyle;
  private isOver = false;

  constructor(scene: Phaser.Scene, opts: PixelButtonOptions) {
    this.style = opts.style ?? BUTTON_STYLE_DEFAULT;
    this.graphics = scene.add.graphics();
    this.text = scene.add
      .text(opts.x, opts.y, opts.label, {
        fontFamily: UI.fontFallback,
        fontSize: `${opts.fontSize ?? 16}px`,
        color: this.style.textColor,
      })
      .setOrigin(0.5);
    this.container = scene.add.container(opts.x, opts.y, [this.graphics, this.text]);

    const draw = (over: boolean): void => {
      this.graphics.clear();
      const w = opts.width;
      const h = opts.height;
      const x = -w / 2;
      const y = -h / 2;
      const stroke = over ? this.style.strokeHover : this.style.stroke;
      const fill = over ? this.style.fillHover : this.style.fill;
      this.graphics.lineStyle(4, stroke, 1);
      this.graphics.strokeRect(x, y, w, h);
      this.graphics.fillStyle(fill, 1);
      this.graphics.fillRect(x + 4, y + 4, w - 8, h - 8);
      this.graphics.fillStyle(this.style.topLight, 0.55);
      this.graphics.fillRect(x + 4, y + 4, w - 8, 4);
      this.graphics.fillStyle(this.style.bottomShade, 0.7);
      this.graphics.fillRect(x + 4, y + h - 8, w - 8, 4);
      if (over) {
        this.graphics.fillStyle(0xffffff, 0.08);
        this.graphics.fillRect(x + 4, y + 8, w - 8, h - 16);
      }
    };

    draw(false);

    this.container.setSize(opts.width, opts.height);
    this.container.setInteractive({ useHandCursor: true });

    this.container.on('pointerover', () => {
      this.isOver = true;
      draw(true);
    });
    this.container.on('pointerout', () => {
      this.isOver = false;
      draw(false);
    });
    this.container.on('pointerup', () => {
      if (this.isOver) opts.onClick();
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}