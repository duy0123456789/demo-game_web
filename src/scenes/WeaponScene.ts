import Phaser from 'phaser';
import { isPortrait, SceneKey, UI } from '../config/gameConfig';
import { WEAPONS, rarityLabel } from '../data/weapons';
import type { WeaponData } from '../data/weapons';
import { saveManager } from '../systems/SaveManager';
import { PixelButton, BUTTON_STYLE_DEFAULT } from '../ui/PixelButton';

const RARITY_COLORS: Record<string, string> = {
  common: '#9aa4b8',
  rare: '#4ec9ff',
  epic: '#c84dff',
  legendary: '#ffd23c',
};

export class WeaponScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Weapons);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const portrait = isPortrait();

    this.add.rectangle(0, 0, width, height, UI.colors.bg).setOrigin(0);
    this.add
      .text(width / 2, portrait ? 80 : 90, 'ARMORY', {
        fontFamily: UI.fontFallback,
        fontSize: portrait ? '28px' : '34px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5);
    this.coinText = this.add
      .text(width / 2, portrait ? 130 : 140, '', {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#ffc832',
      })
      .setOrigin(0.5);

    const rowH = portrait ? 150 : 96;
    const gap = portrait ? 18 : 14;
    const top = portrait ? 210 : 210;
    const left = portrait ? 60 : width / 2 - 420;
    const rowW = portrait ? width - 120 : 840;

    WEAPONS.forEach((w, i) => {
      const y = top + i * (rowH + gap);
      this.buildRow(left, y, rowW, rowH, w);
    });

    new PixelButton(this, {
      x: width / 2,
      y: top + WEAPONS.length * (rowH + gap) + 44,
      width: 240,
      height: 56,
      label: 'BACK',
      style: BUTTON_STYLE_DEFAULT,
      onClick: () => this.scene.start(SceneKey.MainMenu),
    });

    this.refreshCoins();
  }

  private buildRow(x: number, y: number, w: number, h: number, weapon: WeaponData): void {
    const owned = saveManager.ownsWeapon(weapon.id);
    const equipped = saveManager.weaponEquipped === weapon.id;
    const bg = this.add
      .rectangle(0, 0, w, h, 0x141428, 0.96)
      .setStrokeStyle(equipped ? 3 : 1, equipped ? 0x2ee6a8 : 0x27406e);

    const name = this.add
      .text(-w / 2 + 24, -h / 2 + 20, `${weapon.name}  [${rarityLabel(weapon.rarity)}]`, {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: RARITY_COLORS[weapon.rarity],
      })
      .setOrigin(0, 0);
    const stats = this.add
      .text(
        -w / 2 + 24,
        -h / 2 + 44,
        `DMG ${weapon.damage}  RATE ${weapon.attackSpeed}/s  RNG ${weapon.range}  SPREAD ${weapon.spreadAngle}deg`,
        {
          fontFamily: UI.fontFallback,
          fontSize: '9px',
          color: '#8a97b5',
        },
      )
      .setOrigin(0, 0);

    const row = this.add.container(x, y, [bg, name, stats]);

    if (!owned) {
      const btn = new PixelButton(this, {
        x: w / 2 - 130,
        y: 0,
        width: 190,
        height: 44,
        label: `BUY $ ${weapon.price}`,
        fontSize: 11,
        onClick: () => this.tryBuy(weapon),
      });
      row.add(btn.container);
    } else if (!equipped) {
      const btn = new PixelButton(this, {
        x: w / 2 - 130,
        y: 0,
        width: 190,
        height: 44,
        label: 'EQUIP',
        fontSize: 11,
        onClick: () => {
          saveManager.equipWeapon(weapon.id);
          this.scene.restart();
        },
      });
      row.add(btn.container);
    } else {
      const tag = this.add
        .text(w / 2 - 130, 0, 'EQUIPPED', {
          fontFamily: UI.fontFallback,
          fontSize: '13px',
          color: '#2ee6a8',
        })
        .setOrigin(0.5);
      row.add(tag);
    }
  }

  private tryBuy(weapon: WeaponData): void {
    if (saveManager.coins < weapon.price) {
      this.flashCoins();
      return;
    }
    saveManager.addCoins(-weapon.price);
    saveManager.unlockWeapon(weapon.id);
    saveManager.equipWeapon(weapon.id);
    this.scene.restart();
  }

  private refreshCoins(): void {
    this.coinText.setText(`COINS $ ${saveManager.coins}`);
  }

  private flashCoins(): void {
    this.coinText.setColor('#ff5c5c');
    this.refreshCoins();
    this.tweens.add({
      targets: this.coinText,
      scale: 1.2,
      yoyo: true,
      duration: 120,
      onComplete: () => this.coinText.setColor('#ffc832'),
    });
  }
}