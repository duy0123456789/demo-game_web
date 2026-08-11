import Phaser from 'phaser';
import { isPortrait, SceneKey, UI } from '../config/gameConfig';
import { PERM_UPGRADES, permCost } from '../data/permanentUpgrades';
import type { PermUpgradeDef } from '../data/permanentUpgrades';
import { saveManager } from '../systems/SaveManager';
import { PixelButton, BUTTON_STYLE_DEFAULT } from '../ui/PixelButton';

export class UpgradeScene extends Phaser.Scene {
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Upgrades);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const portrait = isPortrait();

    this.add.rectangle(0, 0, width, height, UI.colors.bg).setOrigin(0);
    this.add
      .text(width / 2, portrait ? 80 : 90, 'PERMANENT UPGRADES', {
        fontFamily: UI.fontFallback,
        fontSize: portrait ? '22px' : '30px',
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

    const rowH = portrait ? 130 : 90;
    const gap = portrait ? 18 : 14;
    const top = portrait ? 200 : 200;
    const rowW = portrait ? width - 120 : 840;
    const left = portrait ? 60 : width / 2 - 420;

    PERM_UPGRADES.forEach((def, i) => {
      const y = top + i * (rowH + gap);
      this.buildRow(left, y, rowW, rowH, def);
    });

    new PixelButton(this, {
      x: width / 2,
      y: top + PERM_UPGRADES.length * (rowH + gap) + 44,
      width: 240,
      height: 56,
      label: 'BACK',
      style: BUTTON_STYLE_DEFAULT,
      onClick: () => this.scene.start(SceneKey.MainMenu),
    });

    this.refreshCoins();
  }

  private buildRow(x: number, y: number, w: number, h: number, def: PermUpgradeDef): void {
    const level = saveManager.permLevel(def.id);
    const maxed = level >= def.maxLevel;
    const cost = permCost(def, level);

    const bg = this.add
      .rectangle(0, 0, w, h, 0x141428, 0.96)
      .setStrokeStyle(1, maxed ? 0x2ee6a8 : 0x27406e);
    const name = this.add
      .text(-w / 2 + 24, -h / 2 + 20, def.name, {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#e8f6ff',
      })
      .setOrigin(0, 0);
    const desc = this.add
      .text(-w / 2 + 24, -h / 2 + 46, def.desc, {
        fontFamily: UI.fontFallback,
        fontSize: '9px',
        color: '#8a97b5',
      })
      .setOrigin(0, 0);
    const levelText = this.add
      .text(-w / 2 + 24, h / 2 - 22, `LV ${level}/${def.maxLevel}`, {
        fontFamily: UI.fontFallback,
        fontSize: '11px',
        color: level > 0 ? '#2ee6a8' : '#5a6a8c',
      })
      .setOrigin(0, 0.5);

    const row = this.add.container(x, y, [bg, name, desc, levelText]);

    if (maxed) {
      row.add(
        this.add
          .text(w / 2 - 130, 0, 'MAX', {
            fontFamily: UI.fontFallback,
            fontSize: '13px',
            color: '#2ee6a8',
          })
          .setOrigin(0.5),
      );
      return;
    }

    const btn = new PixelButton(this, {
      x: w / 2 - 130,
      y: 0,
      width: 190,
      height: 44,
      label: `BUY $ ${cost}`,
      fontSize: 11,
      onClick: () => this.tryBuy(def),
    });
    row.add(btn.container);
  }

  private tryBuy(def: PermUpgradeDef): void {
    const level = saveManager.permLevel(def.id);
    const cost = permCost(def, level);
    if (level >= def.maxLevel || saveManager.coins < cost) {
      this.flashCoins();
      return;
    }
    saveManager.addCoins(-cost);
    saveManager.setPermLevel(def.id, level + 1);
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