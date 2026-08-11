import Phaser from 'phaser';
import { createGameConfig, isPortrait } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';

let game: Phaser.Game | null = null;
let lastPortrait = isPortrait();

function boot(): void {
  game = new Phaser.Game(
    createGameConfig([BootScene, PreloadScene, MainMenuScene]),
  );
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