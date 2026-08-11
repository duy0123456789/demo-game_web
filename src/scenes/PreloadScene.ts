import Phaser from 'phaser';
import { SceneKey, UI } from '../config/gameConfig';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  async create(): Promise<void> {
    const { width, height } = this.scale.gameSize;
    const title = this.add
      .text(width / 2, height / 2 - 30, 'PIXEL GUNNER', {
        fontFamily: UI.fontFallback,
        fontSize: '22px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5);

    await this.waitForPixelFont();

    title.setText('LOADING COMPLETE');
    await this.delay(300);

    this.scene.start(SceneKey.MainMenu);
  }

  private waitForPixelFont(): Promise<void> {
    const doc = document as Document & { fonts?: { load(font: string): Promise<unknown> } };
    if (!doc.fonts) return Promise.resolve();
    const loaded = doc.fonts.load('16px "Press Start 2P"');
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
    return Promise.race([loaded.then(() => undefined), timeout]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}