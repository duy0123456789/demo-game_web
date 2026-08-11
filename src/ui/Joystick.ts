import Phaser from 'phaser';
import { UI } from '../config/gameConfig';

export interface JoystickVector {
  x: number;
  y: number;
}

export class Joystick {
  private readonly scene: Phaser.Scene;
  private readonly radius: number;
  private readonly base: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Graphics;
  private activePointer: Phaser.Input.Pointer | null = null;
  private originX = 0;
  private originY = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(scene: Phaser.Scene, radius = 70) {
    this.scene = scene;
    this.radius = radius;
    this.base = scene.add.graphics().setScrollFactor(0).setDepth(900);
    this.knob = scene.add.graphics().setScrollFactor(0).setDepth(900);
    this.setVisible(false);

    scene.input.on('pointerdown', this.handleDown, this);
    scene.input.on('pointermove', this.handleMove, this);
    scene.input.on('pointerup', this.handleUp, this);
    scene.input.on('pointerupoutside', this.handleUp, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get vector(): JoystickVector {
    if (!this.activePointer) return { x: 0, y: 0 };
    const maxLen = this.radius;
    const dist = Math.hypot(this.offsetX, this.offsetY);
    const scale = dist > maxLen ? maxLen / dist : 1;
    return { x: (this.offsetX / maxLen) * scale, y: (this.offsetY / maxLen) * scale };
  }

  get active(): boolean {
    return this.activePointer !== null;
  }

  private handleDown(pointer: Phaser.Input.Pointer): void {
    if (this.activePointer || !pointer.isDown) return;
    this.activePointer = pointer;
    this.originX = pointer.x;
    this.originY = pointer.y;
    this.offsetX = 0;
    this.offsetY = 0;
    this.setVisible(true);
    this.draw();
  }

  private handleMove(pointer: Phaser.Input.Pointer): void {
    if (pointer !== this.activePointer) return;
    this.offsetX = pointer.x - this.originX;
    this.offsetY = pointer.y - this.originY;
    this.draw();
  }

  private handleUp(pointer: Phaser.Input.Pointer): void {
    if (pointer !== this.activePointer) return;
    this.activePointer = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.setVisible(false);
    this.draw();
  }

  private draw(): void {
    const sx = UI.colors.accent;
    this.base.clear();
    this.base.fillStyle(0x0b0b16, 0.35);
    this.base.fillCircle(this.originX, this.originY, this.radius);
    this.base.lineStyle(4, sx, 0.8);
    this.base.strokeCircle(this.originX, this.originY, this.radius);

    const maxLen = this.radius;
    const dist = Math.hypot(this.offsetX, this.offsetY);
    const scale = Math.min(1, dist / maxLen);
    const kx = this.originX + this.offsetX * scale;
    const ky = this.originY + this.offsetY * scale;

    this.knob.clear();
    this.knob.fillStyle(sx, 0.9);
    this.knob.fillCircle(kx, ky, 26);
    this.knob.fillStyle(0x0b0b16, 0.4);
    this.knob.fillCircle(kx, ky, 12);
  }

  private setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.knob.setVisible(visible);
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.handleDown, this);
    this.scene.input.off('pointermove', this.handleMove, this);
    this.scene.input.off('pointerup', this.handleUp, this);
    this.scene.input.off('pointerupoutside', this.handleUp, this);
    this.base.destroy();
    this.knob.destroy();
  }
}