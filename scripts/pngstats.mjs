import { loadPng, pixelAt } from './pngDecode.mjs';
import {
  createHash,
} from 'node:crypto';

for (const f of process.argv.slice(2)) {
  const png = loadPng(f);
  let nonBlack = 0;
  let bright = 0;
  let total = 0;
  let maxSum = 0;
  let maxPx = null;
  const step = 8;
  for (let y = 0; y < png.height; y += step) {
    for (let x = 0; x < png.width; x += step) {
      const [r, g, b] = pixelAt(png, x, y);
      const s = r + g + b;
      total += 1;
      if (s > 30) nonBlack += 1;
      if (s > 200) bright += 1;
      if (s > maxSum) {
        maxSum = s;
        maxPx = [x, y, r, g, b];
      }
    }
  }
  const center = pixelAt(png, Math.floor(png.width / 2), Math.floor(png.height / 2));
  const hash = createHash('sha1').update(png.data).digest('hex').slice(0, 12);
  console.log(
    f,
    JSON.stringify({
      size: `${png.width}x${png.height}`,
      nonBlackPct: ((100 * nonBlack) / total).toFixed(1),
      bright,
      maxSum,
      maxPx,
      center,
      hash,
    }),
  );
}