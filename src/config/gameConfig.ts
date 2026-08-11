import Phaser from 'phaser';

export const LANDSCAPE_SIZE = { width: 1280, height: 720 } as const;
export const PORTRAIT_SIZE = { width: 720, height: 1280 } as const;

export const SceneKey = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  MainMenu: 'MainMenuScene',
  Heroes: 'HeroScene',
  Weapons: 'WeaponScene',
  Upgrades: 'UpgradeScene',
  Game: 'GameScene',
  Result: 'ResultScene',
  Settings: 'SettingsScene',
} as const;

export function isPortrait(): boolean {
  return typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
}

export function gameSize(): { width: number; height: number } {
  return isPortrait() ? { ...PORTRAIT_SIZE } : { ...LANDSCAPE_SIZE };
}

const FONT_PIXEL = 'Press Start 2P';

export const UI = {
  fontPixel: FONT_PIXEL,
  fontFallback: '"Press Start 2P", "Courier New", monospace',
  colors: {
    bg: 0x0b0b16,
    panel: 0x141428,
    primary: 0x2ee6a8,
    accent: 0x4ec9ff,
    warn: 0xffb020,
    danger: 0xff5c5c,
    text: 0xe8f6ff,
    textDim: 0x8a97b5,
  },
} as const;

export function createGameConfig(
  scenes: Phaser.Types.Scenes.SceneType[],
): Phaser.Types.Core.GameConfig {
  const { width, height } = gameSize();
  const dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio : 1));
  return {
    type: Phaser.AUTO,
    parent: 'app',
    width,
    height,
    backgroundColor: '#0b0b16',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      zoom: dpr,
    },
    render: {
      powerPreference: 'high-performance',
    },
    input: {
      activePointers: 3,
    },
    scene: scenes,
  };
}