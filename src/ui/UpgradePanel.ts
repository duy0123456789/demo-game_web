import Phaser from 'phaser';
import { UI } from '../config/gameConfig';
import type { UpgradeOption } from '../systems/UpgradeSystem';

const RARITY_COLORS: Record<string, string> = {
  common: '#9aa4b8',
  rare: '#4ec9ff',
  epic: '#c84dff',
  legendary: '#ffd23c',
};

const RARITY_LABEL: Record<string, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
};

export class UpgradePanel {
  private readonly scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private readonly onPick: (opt: UpgradeOption) => void;

  constructor(scene: Phaser.Scene, onPick: (opt: UpgradeOption) => void) {
    this.scene = scene;
    this.onPick = onPick;
  }

  show(options: UpgradeOption[], level: number): void {
    const { width, height } = this.scene.scale.gameSize;
    this.container = this.scene.add.container(0, 0).setDepth(2000);

    this.scene.add.rectangle(0, 0, width, height, 0x0b0b16, 0.82).setOrigin(0).setDepth(2000).setScrollFactor(0);

    const title = this.scene.add
      .text(width / 2, height * 0.12, 'LEVEL UP!', {
        fontFamily: UI.fontFallback,
        fontSize: '30px',
        color: '#2ee6a8',
      })
      .setOrigin(0.5);
    const sub = this.scene.add
      .text(width / 2, height * 0.12 + 44, `YOU REACHED LEVEL ${level}`, {
        fontFamily: UI.fontFallback,
        fontSize: '12px',
        color: '#8a97b5',
      })
      .setOrigin(0.5);
    this.container.add([title, sub]);

    const cardW = Math.min(300, width * 0.26);
    const cardH = Math.min(180, height * 0.3);
    const gap = Math.min(24, width * 0.02);
    const totalW = 3 * cardW + 2 * gap;
    let x0 = width / 2 - totalW / 2 + cardW / 2;
    const y0 = height * 0.5;

    options.forEach((opt, i) => {
      const x = x0 + i * (cardW + gap);
      const card = this.buildCard(x, y0, cardW, cardH, opt);
      this.container.add(card);
    });
  }

  private buildCard(x: number, y: number, w: number, h: number, opt: UpgradeOption): Phaser.GameObjects.Container {
    const bg = this.scene.add.rectangle(0, 0, w, h, 0x141428, 0.96).setStrokeStyle(3, 0x27406e);
    const rarityColor = RARITY_COLORS[opt.rarity];
    const rarityLabel = RARITY_LABEL[opt.rarity];
    const rarity = this.scene.add
      .text(0, -h / 2 + 24, rarityLabel, {
        fontFamily: UI.fontFallback,
        fontSize: '9px',
        color: rarityColor,
      })
      .setOrigin(0.5);
    const name = this.scene.add
      .text(0, -12, opt.name, {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5);
    const label = this.scene.add
      .text(0, 24, opt.label, {
        fontFamily: UI.fontFallback,
        fontSize: '10px',
        color: '#8a97b5',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5);

    const c = this.scene.add.container(x, y, [bg, rarity, name, label]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => {
      bg.setStrokeStyle(3, 0x4ec9ff);
      c.setScale(1.04);
    });
    c.on('pointerout', () => {
      bg.setStrokeStyle(3, 0x27406e);
      c.setScale(1);
    });
    c.on('pointerup', () => {
      this.onPick(opt);
    });
    return c;
  }

  hide(): void {
    this.container.destroy();
  }
}