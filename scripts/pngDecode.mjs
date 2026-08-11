import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function loadPng(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG: ' + path);
  let pos = 8;
  let idat = Buffer.alloc(0);
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat = Buffer.concat([idat, data]);
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(idat);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const bpp = Math.max(1, Math.floor((channels * bitDepth) / 8));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const dst = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? dst[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (filter === 1) v = v + a;
      else if (filter === 2) v = v + b;
      else if (filter === 3) v = v + Math.floor((a + b) / 2);
      else if (filter === 4) v = v + paeth(a, b, c);
      dst[x] = v & 0xff;
    }
    prev.set(dst);
  }
  return { width, height, data: out, channels };
}

export function pixelAt(png, x, y) {
  const i = (y * png.width + x) * png.channels;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
}