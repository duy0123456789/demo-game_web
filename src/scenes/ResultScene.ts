import Phaser from 'phaser';
import { isPortrait, SceneKey, UI } from '../config/gameConfig';
import { PixelButton, BUTTON_STYLE_PRIMARY, BUTTON_STYLE_DEFAULT } from '../ui/PixelButton';

export interface ResultData {
  victory: boolean;
  level: number;
  kills: number;
  coinsEarned: number;
  timeMs: number;
}

export class ResultScene extends Phaser.Scene {
  private data_: ResultData | null = null;

  constructor() {
    super(SceneKey.Result);
  }

  init(data: ResultData): void {
    this.data_ = data;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const data = this.data_ ?? { victory: false, level: 1, kills: 0, coinsEarned: 0, timeMs: 0 };

    this.add.rectangle(0, 0, width, height, UI.colors.bg, 0.92).setOrigin(0).setDepth(-10);
    this.add.rectangle(0, 0, width, height, 0x000000, 0.4).setOrigin(0).setDepth(-11);

    const title = data.victory ? 'VICTORY!' : 'DEFEATED';
    const color = data.victory ? '#2ee6a8' : '#ff5c5c';
    this.add
      .text(width / 2, height * 0.16, title, {
        fontFamily: UI.fontFallback,
        fontSize: isPortrait() ? '40px' : '52px',
        color,
      })
      .setOrigin(0.5);

    const sec = Math.floor(data.timeMs / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const lines = [
      `LEVEL ${data.level}`,
      `KILLS ${data.kills}`,
      `EARNED $ ${data.coinsEarned}`,
      `TIME ${m}:${s.toString().padStart(2, '0')}`,
    ];
    const text = this.add
      .text(width / 2, height * 0.4, lines, {
        fontFamily: UI.fontFallback,
        fontSize: isPortrait() ? '16px' : '18px',
        color: '#e8f6ff',
        align: 'center',
        lineSpacing: 24,
      })
      .setOrigin(0.5);

    new PixelButton(this, {
      x: width / 2,
      y: height * 0.68,
      width: 260,
      height: 64,
      label: 'PLAY AGAIN',
      fontSize: 16,
      style: BUTTON_STYLE_PRIMARY,
      onClick: () => this.scene.start(SceneKey.Game),
    });

    new PixelButton(this, {
      x: width / 2,
      y: height * 0.68 + 92,
      width: 260,
      height: 64,
      label: 'MAIN MENU',
      fontSize: 16,
      style: BUTTON_STYLE_DEFAULT,
      onClick: () => this.scene.start(SceneKey.MainMenu),
    });

    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SceneKey.MainMenu));
    void text;
  }

  get result(): ResultData | null {
    return this.data_;
  }
}