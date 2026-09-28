// Genera los iconos PNG sin dependencias: `npm run icons`.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel((x + 0.5) / size, (y + 0.5) / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t))));

// Fondo azul noche con un anillo luminoso: sencillo y legible a 29 px.
function art(scale) {
  return (u, v) => {
    const dx = (u - 0.5) / scale;
    const dy = (v - 0.5) / scale;
    const r = Math.hypot(dx, dy);
    let c = mix([22, 30, 48], [8, 11, 20], r * 1.6);
    const ring = Math.exp(-(((r - 0.3) / 0.035) ** 2));
    const glow = Math.exp(-(((r - 0.3) / 0.11) ** 2)) * 0.45;
    const core = Math.exp(-((r / 0.09) ** 2));
    c = mix(c, [64, 150, 255], glow);
    c = mix(c, [150, 215, 255], ring);
    c = mix(c, [220, 245, 255], core);
    return c;
  };
}

const out = new URL('../icons/', import.meta.url);
writeFileSync(new URL('icon-192.png', out), png(192, art(1)));
writeFileSync(new URL('icon-512.png', out), png(512, art(1)));
writeFileSync(new URL('apple-touch-icon.png', out), png(180, art(1)));
writeFileSync(new URL('icon-maskable-512.png', out), png(512, art(0.8)));
