import Phaser from 'phaser';
import { isPortrait, SceneKey, UI } from '../config/gameConfig';
import { HEROES } from '../data/heroes';
import type { HeroData } from '../data/heroes';
import { saveManager } from '../systems/SaveManager';
import { PixelButton, BUTTON_STYLE_DEFAULT } from '../ui/PixelButton';

export class HeroScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Heroes);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const portrait = isPortrait();

    this.add.rectangle(0, 0, width, height, UI.colors.bg).setOrigin(0);
    this.add
      .text(width / 2, portrait ? 80 : 90, 'CHOOSE HERO', {
        fontFamily: UI.fontFallback,
        fontSize: portrait ? '28px' : '34px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, portrait ? 130 : 140, `COINS $ ${saveManager.coins}`, {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#ffc832',
      })
      .setOrigin(0.5);

    const cardW = portrait ? Math.min(560, width * 0.86) : 300;
    const cardH = portrait ? 240 : 340;
    const gap = portrait ? 26 : 32;
    const totalW = HEROES.length * cardW + (HEROES.length - 1) * gap;
    const x0 = width / 2 - totalW / 2 + cardW / 2;
    const y0 = portrait ? 300 : height * 0.56;

    HEROES.forEach((hero, i) => {
      const x = x0 + i * (cardW + gap);
      this.buildCard(x, y0, cardW, cardH, hero);
    });

    new PixelButton(this, {
      x: width / 2,
      y: portrait ? height - 110 : height - 90,
      width: 240,
      height: 56,
      label: 'BACK',
      style: BUTTON_STYLE_DEFAULT,
      onClick: () => this.scene.start(SceneKey.MainMenu),
    });
  }

  private buildCard(x: number, y: number, w: number, h: number, hero: HeroData): void {
    const selected = saveManager.heroId === hero.id;
    const bg = this.add
      .rectangle(0, 0, w, h, 0x141428, 0.96)
      .setStrokeStyle(selected ? 3 : 1, selected ? 0x2ee6a8 : 0x27406e);
    const name = this.add
      .text(0, -h / 2 + 36, hero.name, {
        fontFamily: UI.fontFallback,
        fontSize: '16px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5);
    const desc = this.add
      .text(0, -h / 2 + 66, hero.desc, {
        fontFamily: UI.fontFallback,
        fontSize: '9px',
        color: '#8a97b5',
      })
      .setOrigin(0.5);
    const stats = this.add
      .text(
        0,
        10,
        `HP ${hero.maxHp}\nSPD ${hero.moveSpeed}\nDMG ${hero.damage}\nCRIT ${Math.round(hero.criticalChance * 100)}%`,
        {
          fontFamily: UI.fontFallback,
          fontSize: '11px',
          color: '#b8c7e8',
          align: 'center',
          lineSpacing: 14,
        },
      )
      .setOrigin(0.5);
    const status = this.add
      .text(0, h / 2 - 34, selected ? 'SELECTED' : 'SELECT', {
        fontFamily: UI.fontFallback,
        fontSize: '11px',
        color: selected ? '#2ee6a8' : '#4ec9ff',
      })
      .setOrigin(0.5);

    const c = this.add.container(x, y, [bg, name, desc, stats, status]);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      saveManager.setHero(hero.id);
      this.scene.restart();
    });
    c.on('pointerover', () => bg.setStrokeStyle(3, 0x4ec9ff));
    c.on('pointerout', () =>
      bg.setStrokeStyle(selected ? 3 : 1, selected ? 0x2ee6a8 : 0x27406e),
    );
  }
}