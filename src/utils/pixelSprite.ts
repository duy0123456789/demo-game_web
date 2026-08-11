import Phaser from 'phaser';

export type PixelPalette = Record<string, number>;

export function buildPixelSprite(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  palette: PixelPalette,
  scale = 1,
): void {
  const width = rows[0].length * scale;
  const height = rows.length * scale;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  g.generateTexture(key, width, height);
  g.destroy();
}