import Phaser from 'phaser';
import { isPortrait, SceneKey, UI } from '../config/gameConfig';
import { saveManager } from '../systems/SaveManager';
import { soundManager } from '../systems/SoundManager';
import { PixelButton, BUTTON_STYLE_DEFAULT } from '../ui/PixelButton';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Settings);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const portrait = isPortrait();

    this.add.rectangle(0, 0, width, height, UI.colors.bg).setOrigin(0);
    this.add
      .text(width / 2, portrait ? 80 : 90, 'SETTINGS', {
        fontFamily: UI.fontFallback,
        fontSize: portrait ? '28px' : '34px',
        color: '#e8f6ff',
      })
      .setOrigin(0.5);

    const toggle = new PixelButton(this, {
      x: width / 2,
      y: portrait ? 300 : 260,
      width: 320,
      height: 64,
      label: soundManager.enabled ? 'SOUND: ON' : 'SOUND: OFF',
      fontSize: 15,
      onClick: () => {
        saveManager.setSoundOn(!soundManager.enabled);
        soundManager.setEnabled(saveManager.soundOn);
        toggle.container.destroy();
        this.scene.restart();
      },
    });

    new PixelButton(this, {
      x: width / 2,
      y: portrait ? 420 : 360,
      width: 240,
      height: 56,
      label: 'BACK',
      style: BUTTON_STYLE_DEFAULT,
      onClick: () => this.scene.start(SceneKey.MainMenu),
    });
  }
}