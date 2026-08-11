import Phaser from 'phaser';
import { createGameConfig, isPortrait } from './config/gameConfig';
import { saveManager } from './systems/SaveManager';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { HeroScene } from './scenes/HeroScene';
import { WeaponScene } from './scenes/WeaponScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

let game: Phaser.Game | null = null;
let lastPortrait = isPortrait();

function boot(): void {
  game = new Phaser.Game(
    createGameConfig([BootScene, PreloadScene, MainMenuScene, HeroScene, WeaponScene, UpgradeScene, SettingsScene, GameScene, ResultScene]),
  );
  (window as unknown as { __pg?: Phaser.Game; __save?: typeof saveManager }).__pg = game;
  (window as unknown as { __save?: typeof saveManager }).__save = saveManager;
}

function handleOrientationChange(): void {
  const portrait = isPortrait();
  if (portrait !== lastPortrait) {
    lastPortrait = portrait;
    if (game) {
      game.destroy(true);
      game = null;
    }
    boot();
  }
}

window.addEventListener('resize', handleOrientationChange);
window.addEventListener('orientationchange', handleOrientationChange);

boot();