// Generate ikon PWA dari logo petir (tanpa dependensi eksternal).
// PNG 32-bit ditulis manual (deflate via zlib bawaan Node).
// Pakai: node scripts/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'icons');
fs.mkdirSync(OUT, { recursive: true });

function crc32(buf) {
  let table = crc32.t;
  if (!table) {
    table = crc32.t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([td, data])), 0);
  return Buffer.concat([len, td, data, crc]);
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit truecolor+alpha
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Gambar: bg gelap #050914 rounded-ish + lingkaran amber + petir (polygon)
function draw(size, opts = {}) {
  const { pad = 0, bg = [5, 9, 20, 255] } = opts;
  const S = size;
  const px = Buffer.alloc(S * S * 4);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3] === undefined ? 255 : c[3];
  };
  // bg
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) set(x, y, bg);
  const cx = S / 2, cy = S / 2;
  const R = S * (0.5 - pad);
  // lingkaran amber #fbbf24
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= R) set(x, y, [251, 191, 36, 255]);
  }
  // ring gelap
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d <= R && d >= R - S * 0.02) set(x, y, [146, 64, 14, 255]);
  }
  // petir polygon (koordinat relatif dari index.html)
  const bolt = [[0.56, 0.16], [0.25, 0.56], [0.47, 0.56], [0.31, 0.84], [0.75, 0.44], [0.53, 0.44]];
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = bolt.length - 1; i < bolt.length; j = i++) {
      const xi = bolt[i][0] * S, yi = bolt[i][1] * S, xj = bolt[j][0] * S, yj = bolt[j][1] * S;
      if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) c = !c;
    }
    return c;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (inside(x, y)) set(x, y, [69, 26, 3, 255]); // coklat tua #451a03
  }
  return png(S, S, px);
}

const jobs = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['maskable-512.png', 512, { pad: 0.1 }], // safe zone buat maskable
  ['apple-touch-icon.png', 180, {}],
];
for (const [name, size, opts] of jobs) {
  fs.writeFileSync(path.join(OUT, name), draw(size, opts));
  console.log('wrote', name, size);
}
