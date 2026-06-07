"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const size = 256;
const root = path.join(__dirname, "..");
const outputPath = path.join(root, "assets", "icon.png");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function setPixel(buffer, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }
  const index = y * (size * 4 + 1) + 1 + x * 4;
  buffer[index] = r;
  buffer[index + 1] = g;
  buffer[index + 2] = b;
  buffer[index + 3] = a;
}

function fillRect(buffer, x, y, width, height, color) {
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      setPixel(buffer, col, row, ...color);
    }
  }
}

function drawGlyph(buffer, glyph, x, y, scale, color) {
  for (let row = 0; row < glyph.length; row += 1) {
    for (let col = 0; col < glyph[row].length; col += 1) {
      if (glyph[row][col] !== "1") {
        continue;
      }
      fillRect(buffer, x + col * scale, y + row * scale, scale, scale, color);
    }
  }
}

const pixels = Buffer.alloc(size * (size * 4 + 1));
for (let y = 0; y < size; y += 1) {
  pixels[y * (size * 4 + 1)] = 0;
}

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
    const inCorner =
      (x < 28 && y < 28 && (x - 28) ** 2 + (y - 28) ** 2 > 28 ** 2) ||
      (x > size - 29 && y < 28 && (x - (size - 29)) ** 2 + (y - 28) ** 2 > 28 ** 2) ||
      (x < 28 && y > size - 29 && (x - 28) ** 2 + (y - (size - 29)) ** 2 > 28 ** 2) ||
      (x > size - 29 && y > size - 29 && (x - (size - 29)) ** 2 + (y - (size - 29)) ** 2 > 28 ** 2);
    if (inCorner) {
      setPixel(pixels, x, y, 0, 0, 0, 0);
      continue;
    }
    const shade = Math.max(0, Math.min(32, 22 + Math.floor((x + y) / 32)));
    setPixel(pixels, x, y, shade, shade + 5, shade + 14, 255);
    if (edge < 3) {
      setPixel(pixels, x, y, 55, 65, 81, 255);
    }
  }
}

fillRect(pixels, 42, 172, 172, 12, [56, 189, 248, 255]);
fillRect(pixels, 42, 192, 120, 12, [45, 212, 191, 255]);
fillRect(pixels, 42, 212, 72, 12, [167, 139, 250, 255]);

const tGlyph = ["1111111", "0011100", "0011100", "0011100", "0011100", "0011100", "0011100"];
const sGlyph = ["0111110", "1100000", "1100000", "0111100", "0000110", "0000110", "1111100"];
drawGlyph(pixels, tGlyph, 44, 44, 14, [248, 250, 252, 255]);
drawGlyph(pixels, sGlyph, 138, 44, 14, [248, 250, 252, 255]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(size, 0);
ihdr.writeUInt32BE(size, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(pixels)),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, png);
console.log(outputPath);
