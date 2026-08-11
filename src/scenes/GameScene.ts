import Phaser from 'phaser';
import { isPortrait, SceneKey, UI, WORLD } from '../config/gameConfig';
import { Player } from '../entities/Player';
import { Joystick } from '../ui/Joystick';
import { TEX } from './BootScene';

const GRID_ALPHA = 0.5;
const ROCK_COUNT = 140;
const PATCH_COUNT = 26;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private joystick: Joystick | null = null;
  private keys!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  };
  private isTouchDevice = false;
  private useJoystick = false;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const worldW = WORLD.width;
    const worldH = WORLD.height;
    this.isTouchDevice = this.sys.game.device.input.touch;
    this.useJoystick = this.isTouchDevice && isPortrait();

    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.createGround(worldW, worldH);
    this.createDecorations(worldW, worldH);

    this.player = new Player(this, worldW / 2, worldH / 2);

    this.setupCamera(width, height, worldW, worldH);
    this.setupInput();
    this.createHint(width, height);
  }

  update(): void {
    if (!this.player || !this.player.active) return;
    this.player.move(this.computeMoveInput());
  }

  private createGround(worldW: number, worldH: number): void {
    this.add
      .tileSprite(worldW / 2, worldH / 2, worldW, worldH, TEX.grid)
      .setAlpha(GRID_ALPHA)
      .setDepth(-20);
  }

  private createDecorations(worldW: number, worldH: number): void {
    for (let i = 0; i < PATCH_COUNT; i += 1) {
      const w = Phaser.Math.Between(240, 900);
      const h = Phaser.Math.Between(240, 900);
      this.add
        .rectangle(
          Phaser.Math.Between(0, worldW - w),
          Phaser.Math.Between(0, worldH - h),
          w,
          h,
          0x0f0f22,
        )
        .setAlpha(0.55)
        .setDepth(-19);
    }

    for (let i = 0; i < ROCK_COUNT; i += 1) {
      const scale = Phaser.Math.FloatBetween(1.2, 3.2);
      this.add
        .image(Phaser.Math.Between(40, worldW - 40), Phaser.Math.Between(40, worldH - 40), TEX.rock)
        .setScale(scale)
        .setAlpha(Phaser.Math.FloatBetween(0.5, 0.95))
        .setDepth(-18);
    }

    const border = 60;
    const borderColor = 0x1b2a4a;
    this.add.rectangle(worldW / 2, -border / 2, worldW + border * 2, border, borderColor).setDepth(-15);
    this.add.rectangle(worldW / 2, worldH + border / 2, worldW + border * 2, border, borderColor).setDepth(-15);
    this.add.rectangle(-border / 2, worldH / 2, border, worldH + border * 2, borderColor).setDepth(-15);
    this.add.rectangle(worldW + border / 2, worldH / 2, border, worldH + border * 2, borderColor).setDepth(-15);
  }

  private setupCamera(viewW: number, viewH: number, worldW: number, worldH: number): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setDeadzone(viewW * 0.28, viewH * 0.28);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.roundPixels = true;
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.keys = {
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      cursors: kb.createCursorKeys(),
    };
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.scene.start(SceneKey.MainMenu);
    });

    if (this.isTouchDevice) {
      this.joystick = new Joystick(this, this.useJoystick ? 90 : 70);
    }
  }

  private computeMoveInput(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    const keys = this.keys;

    const up = keys.w.isDown || keys.cursors.up.isDown;
    const down = keys.s.isDown || keys.cursors.down.isDown;
    const left = keys.a.isDown || keys.cursors.left.isDown;
    const right = keys.d.isDown || keys.cursors.right.isDown;
    if (up) y -= 1;
    if (down) y += 1;
    if (left) x -= 1;
    if (right) x += 1;

    if (this.joystick && this.joystick.active) {
      const joy = this.joystick.vector;
      x += joy.x;
      y += joy.y;
    }

    const pointer = this.input.activePointer;
    if (!this.useJoystick && !this.isTouchDevice && pointer.primaryDown) {
      const worldPt = this.cameras.main.getWorldPoint(pointer.x, pointer.y, new Phaser.Math.Vector2());
      const dx = worldPt.x - this.player.x;
      const dy = worldPt.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 24) {
        x += dx / dist;
        y += dy / dist;
      }
    }

    return { x, y };
  }

  private createHint(viewW: number, viewH: number): void {
    const msg = this.isTouchDevice
      ? 'TOUCH TO MOVE'
      : 'WASD / ARROWS TO MOVE -- HOLD MOUSE TO WALK';
    const t = this.add
      .text(viewW / 2, viewH - 90, msg, {
        fontFamily: UI.fontFallback,
        fontSize: '13px',
        color: '#8a97b5',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(950);
    this.tweens.add({
      targets: t,
      alpha: 0,
      delay: 5000,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }
}