import Phaser from 'phaser';
import { SceneKey, UI } from '../config/gameConfig';
import { saveManager } from '../systems/SaveManager';
import { PixelButton, BUTTON_STYLE_PRIMARY } from '../ui/PixelButton';
import { TEX } from './BootScene';

interface MenuButtonDef {
  label: string;
  run: (scene: MainMenuScene) => void;
}

const MENU_BUTTONS: MenuButtonDef[] = [
  { label: 'PLAY', run: (s) => s.showPlay() },
  { label: 'HEROES', run: (s) => s.toast('COMING SOON', '#ffb020') },
  { label: 'WEAPONS', run: (s) => s.toast('COMING SOON', '#ffb020') },
  { label: 'UPGRADES', run: (s) => s.toast('COMING SOON', '#ffb020') },
  { label: 'SETTINGS', run: (s) => s.toast('COMING SOON', '#ffb020') },
];

interface FloatDot {
  sprite: Phaser.GameObjects.Rectangle;
  speed: number;
}

export class MainMenuScene extends Phaser.Scene {
  private dots: FloatDot[] = [];
  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super(SceneKey.MainMenu);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;

    this.bg = this.add
      .tileSprite(width / 2, height / 2, width, height, TEX.grid)
      .setAlpha(0.55);

    const isPortrait = height > width;

    if (isPortrait) {
      this.buildPortraitLayout(width);
    } else {
      this.buildLandscapeLayout(width, height);
    }

    this.createCurrencyBar(width);
    this.createFloatingDots(width, height);
    this.add
      .text(width / 2, height - 24, 'v0.1.0 - PHASE 1', {
        fontFamily: UI.fontFallback,
        fontSize: '9px',
        color: '#5a6a8c',
      })
      .setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    this.bg.tilePositionY -= delta * 0.01;
    for (const dot of this.dots) {
      dot.sprite.y -= dot.speed * delta * 0.001;
      if (dot.sprite.y < -10) {
        dot.sprite.y = this.scale.gameSize.height + 10;
      }
    }
  }

  private buildLandscapeLayout(width: number, height: number): void {
    const cx = width / 2;
    const title = this.add.text(cx, 120, 'PIXEL GUNNER', {
      fontFamily: UI.fontFallback,
      fontSize: '44px',
      color: '#e8f6ff',
    }).setOrigin(0.5);
    title.setShadow(0, 6, '#2ee6a8', 0);
    this.add.text(cx, 190, 'SURVIVOR', {
      fontFamily: UI.fontFallback,
      fontSize: '30px',
      color: '#ffb020',
    }).setOrigin(0.5);

    const btnW = 380;
    const btnH = 56;
    const gap = 16;
    const startY = 300;
    const btnCount = MENU_BUTTONS.length;
    const totalH = btnCount * btnH + (btnCount - 1) * gap;
    const top = startY + (height - startY - 60 - totalH) / 2;

    MENU_BUTTONS.forEach((def, i) => {
      const y = top + i * (btnH + gap);
      new PixelButton(this, {
        x: cx,
        y,
        width: btnW,
        height: btnH,
        label: def.label,
        style: i === 0 ? BUTTON_STYLE_PRIMARY : undefined,
        onClick: () => def.run(this),
      });
    });
  }

  private buildPortraitLayout(width: number): void {
    const cx = width / 2;
    this.add.text(cx, 130, 'PIXEL GUNNER', {
      fontFamily: UI.fontFallback,
      fontSize: '34px',
      color: '#e8f6ff',
    }).setOrigin(0.5);
    this.add.text(cx, 185, 'SURVIVOR', {
      fontFamily: UI.fontFallback,
      fontSize: '24px',
      color: '#ffb020',
    }).setOrigin(0.5);

    const btnW = 460;
    const btnH = 68;
    const gap = 20;
    const btnCount = MENU_BUTTONS.length;
    const totalH = btnCount * btnH + (btnCount - 1) * gap;
    const top = Math.max(300, (1280 - totalH) / 2 + 40);

    MENU_BUTTONS.forEach((def, i) => {
      const y = top + i * (btnH + gap);
      new PixelButton(this, {
        x: cx,
        y,
        width: btnW,
        height: btnH,
        label: def.label,
        style: i === 0 ? BUTTON_STYLE_PRIMARY : undefined,
        onClick: () => def.run(this),
      });
    });
  }

  private createCurrencyBar(width: number): void {
    const items: Array<{ tex: string; value: number }> = [
      { tex: TEX.coin, value: saveManager.coins },
      { tex: TEX.gem, value: saveManager.gems },
      { tex: TEX.star, value: saveManager.playerLevel },
    ];
    let x = width - 24;
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      const icon = this.add.image(0, 0, item.tex).setDisplaySize(24, 24);
      const label = this.add.text(0, 0, `x${item.value}`, {
        fontFamily: UI.fontFallback,
        fontSize: '14px',
        color: '#e8f6ff',
      }).setOrigin(0, 0.5);
      const textW = label.width;
      this.add.container(x - 12 - textW / 2 - 18, 30, [icon, label]);
      icon.setX(-textW / 2 - 6);
      label.setX(-textW / 2 + 22);
      x -= textW + 64;
    }
  }

  private createFloatingDots(width: number, height: number): void {
    for (let i = 0; i < 40; i += 1) {
      const r = Phaser.Math.Between(1, 3);
      const rect = this.add
        .rectangle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), r, r, 0x4ec9ff)
        .setAlpha(0.18);
      this.dots.push({ sprite: rect, speed: Phaser.Math.FloatBetween(8, 30) });
    }
  }

  showPlay(): void {
    this.scene.start(SceneKey.Game);
  }

  toast(message: string, color: string): void {
    const { width, height } = this.scale.gameSize;
    const t = this.add
      .text(width / 2, height / 2, message, {
        fontFamily: UI.fontFallback,
        fontSize: '20px',
        color,
        backgroundColor: '#141428',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(100);
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: 1400,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }
}