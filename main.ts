// news-image-20261122: a program that writes one image summing up the world's
// news of Sunday 22 November 2026 to /output/entry.png. The image is drawn
// once, held in this repository as entry.png, and copied out verbatim, so the
// two grader runs write the same bytes. No network, no clock, no randomness.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, 'entry.png');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const target = join(outDir, 'entry.png');

// Check the held image against the gate before copying: a whole PNG, at most
// 1 MiB, at most 1024 by 1024 pixels.
const bytes = readFileSync(source);
if (!PNG_MAGIC.every((b, i) => bytes[i] === b)) {
  throw new Error('entry.png is not a PNG file');
}
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
if (bytes.toString('ascii', 12, 16) !== 'IHDR') {
  throw new Error('entry.png has no IHDR chunk');
}
// A whole PNG ends with an IEND chunk: the last 12 bytes are its length (0),
// the type 'IEND' and its CRC.
const tail = bytes.subarray(bytes.length - 12);
if (tail.toString('ascii', 4, 8) !== 'IEND' || tail.readUInt32BE(0) !== 0) {
  throw new Error('entry.png has no IEND chunk');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024 pixel limit`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log(`wrote ${target}: ${width}x${height} PNG, ${bytes.length} bytes`);
