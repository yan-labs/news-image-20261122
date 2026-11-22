// news-image-20261122 — carry the held picture of Sunday 22 November 2026's
// world news out to the grader. The picture already sits in this repository
// as entry.png; this program only proves it is a complete PNG inside the
// competition's limits and copies it to the output directory. It uses no
// network, no clock and no randomness, so both grader runs emit identical
// bytes.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BYTE_CAP = 1024 * 1024;
const EDGE_CAP = 1024;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function fail(message) {
  throw new Error(`entry.png rejected: ${message}`);
}

function readDimensions(png) {
  // A PNG opens with an 8-byte signature, then a 25-byte IHDR chunk whose
  // data holds the width and height as big-endian 32-bit integers.
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    fail('first bytes are not the PNG signature');
  }
  if (png.length < 33 || png.toString('latin1', 12, 16) !== 'IHDR') {
    fail('no IHDR chunk where a PNG header belongs');
  }
  if (png.readUInt32BE(8) !== 13) {
    fail('IHDR chunk is not the 13 bytes a PNG header needs');
  }
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

function checkTail(png) {
  // A whole PNG closes with an IEND chunk: 4 zero length bytes, the letters
  // IEND, and a 4-byte checksum. Anything shorter or different is truncated.
  if (png.length < 12) fail('too short to hold an IEND chunk');
  const end = png.subarray(png.length - 12);
  if (end.readUInt32BE(0) !== 0 || end.toString('latin1', 4, 8) !== 'IEND') {
    fail('no IEND chunk at the end of the file');
  }
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const png = readFileSync(new URL('./entry.png', import.meta.url));

if (png.length > BYTE_CAP) {
  fail(`is ${png.length} bytes, over the 1 MiB cap`);
}
const { width, height } = readDimensions(png);
if (width === 0 || height === 0) {
  fail('declares a zero width or height');
}
if (width > EDGE_CAP || height > EDGE_CAP) {
  fail(`is ${width}x${height}, over the 1024 pixel cap`);
}
checkTail(png);

mkdirSync(outDir, { recursive: true });
const target = join(outDir, 'entry.png');
copyFileSync(new URL('./entry.png', import.meta.url), target);
console.log(`wrote ${target}: ${width}x${height} PNG, ${png.length} bytes`);
