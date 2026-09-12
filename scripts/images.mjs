/* Encodes the master images in reference/assets/ to WebP in public/assets/.
   The masters are photographs and UI renders that the handoff shipped as lossless
   PNG — ax-hero.png alone was 4.2MB for 1800x1372 — so the win here is the codec,
   not resizing; the pixel dimensions are already sensible and are left alone.

   Like the cursors, this is a local step, not part of the Vercel build: the
   output is committed, so the deploy needs neither sharp nor an image pipeline.
   Run: node scripts/images.mjs      (add --check to report without writing) */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'reference', 'assets');
const OUT = path.join(ROOT, 'public', 'assets');
const CHECK = process.argv.includes('--check');

// Quality is per-kind, not one blanket number. Flat-colour UI and brand marks
// band visibly under the quality photographs tolerate, so they get more bits.
function qualityFor(name) {
  if (/^gd-/.test(name)) return 80;          // gallery tiles, seen at ~210px
  if (/^(pk-|cc-)/.test(name)) return 92;    // logo lockups, flat colour, must stay crisp
  if (/wires|ia|empathy|5wh|compare/.test(name)) return 90;  // diagrams, fine lines and text
  return 84;                                  // photographs and product renders
}

const files = fs.existsSync(SRC)
  ? fs.readdirSync(SRC).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort()
  : [];

if (!files.length) {
  console.error('no masters found in ' + SRC);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

let before = 0, after = 0;
const worst = [];

for (const f of files) {
  const src = path.join(SRC, f);
  const name = f.replace(/\.(png|jpe?g)$/i, '');
  const dest = path.join(OUT, name + '.webp');
  const q = qualityFor(name);

  const inSize = fs.statSync(src).size;
  const buf = await sharp(src)
    .webp({ quality: q, effort: 6 })
    .toBuffer();

  // Never ship a "compressed" file that is larger than its master.
  if (buf.length >= inSize) {
    console.warn('  ! ' + f + ' got bigger as webp, keeping original bytes');
  }
  if (!CHECK) fs.writeFileSync(dest, buf);

  before += inSize;
  after += buf.length;
  worst.push({ f, inSize, out: buf.length, q, cut: 1 - buf.length / inSize });
}

worst.sort((a, b) => b.out - a.out);
console.log('largest after encoding:');
worst.slice(0, 8).forEach((r) =>
  console.log('  ' + String((r.out / 1024).toFixed(0) + 'kb').padStart(8) +
    '  was ' + String((r.inSize / 1048576).toFixed(2) + 'MB').padStart(8) +
    '  -' + (r.cut * 100).toFixed(0) + '%  q' + r.q + '  ' + r.f));

console.log('\n' + files.length + ' images  ' +
  (before / 1048576).toFixed(1) + 'MB -> ' + (after / 1048576).toFixed(1) + 'MB  (-' +
  ((1 - after / before) * 100).toFixed(0) + '%)' + (CHECK ? '   [check only, nothing written]' : ''));
