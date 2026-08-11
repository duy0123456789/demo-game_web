import Phaser from 'phaser';
import { saveManager } from './SaveManager';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;

  init(game: Phaser.Game): void {
    this.enabled = saveManager.soundOn;
    const sound = game.sound as Phaser.Sound.WebAudioSoundManager | null;
    this.ctx = sound && 'context' in sound ? sound.context : null;
    if (this.ctx) {
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (on && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    slideTo?: number,
    startDelay = 0,
  ): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime + startDelay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur);
  }

  private noise(dur: number, vol: number, startDelay = 0): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime + startDelay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(gain);
    gain.connect(this.master);
    src.start(t);
  }

  shoot(): void {
    this.noise(0.06, 0.12);
    this.tone(880, 0.05, 'square', 0.05, 300);
  }

  hit(): void {
    this.tone(220, 0.06, 'square', 0.07, 120);
  }

  kill(): void {
    this.tone(160, 0.18, 'sawtooth', 0.09, 60);
    this.noise(0.12, 0.08);
  }

  pickup(): void {
    this.tone(660, 0.06, 'sine', 0.07);
    this.tone(990, 0.08, 'sine', 0.07, undefined, 0.05);
  }

  levelUp(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.12, 'square', 0.07, undefined, i * 0.07));
  }

  hurt(): void {
    this.tone(140, 0.15, 'sawtooth', 0.12, 70);
  }

  bossSpawn(): void {
    this.tone(90, 0.5, 'sawtooth', 0.13, 45);
    this.noise(0.3, 0.09);
  }

  victory(): void {
    const notes = [392, 523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.2, 'square', 0.08, undefined, i * 0.09));
  }

  defeat(): void {
    const notes = [300, 240, 180, 120];
    notes.forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.09, undefined, i * 0.12));
  }
}

export const soundManager = new SoundManager();
