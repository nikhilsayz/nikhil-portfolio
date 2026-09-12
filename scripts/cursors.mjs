/* Renders the site's cursor artwork to PNG.
   SVG cursors are ignored by Safari, so the shapes are rasterised here at 1x and
   2x and referenced from CSS via image-set(), which every current browser honours.

   Each shape is auto-fitted into the box from its measured bounding box, with
   room reserved for the white keyline and the drop shadow. Hand-placing the
   coordinates is what clipped the hand's outer knuckle: its path reached exactly
   x=24 and the 2.6-wide stroke fell outside the viewBox.

   Run: node scripts/cursors.mjs   (also writes a magnified preview sheet) */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('C:/Users/nikhi/Claude/nikhil-portfolio/public/assets/cursor');
const PREVIEW = 'C:/Users/nikhi/AppData/Local/Temp/claude/shots2/cursor-sheet.png';

const BOX = 24;          // cursor box in CSS px
const STROKE = 2.4;      // white keyline width, in path units
const SHADOW_PAD = 1.1;  // room for the drop shadow
const SIZES = { '': 24, '@2x': 48 };

/* Both shapes are one continuous path so the keyline can be stroked behind the
   fill without internal seams. `hot` is the hotspot in the path's own
   coordinates; it is carried through the fit transform below. */
const SHAPES = {
  arrow: {
    d: 'M1.4 1.1 L1.4 19.9 L6.2 15.4 L9.3 22.6 L12.5 21.2 L9.4 14.2 L15.8 13.9 Z',
    hot: [1.4, 1.1]
  },
  hand: {
    d: [
      'M8.1 13.1 V4.0',
      'a1.95 1.95 0 0 1 3.9 0',
      'V11.3 h0.6 V9.2',
      'a1.75 1.75 0 0 1 3.5 0',
      'V11.5 h0.6 V10.1',
      'a1.7 1.7 0 0 1 3.4 0',
      'V11.9 h0.6 V11.2',
      'a1.65 1.65 0 0 1 3.3 0',
      'V17.0',
      'a5.6 5.6 0 0 1 -5.6 5.6',
      'h-2.6',
      'a5.3 5.3 0 0 1 -4.05 -1.88',
      'L3.6 16.6',
      'a1.75 1.75 0 0 1 2.6 -2.32',
      'Z'
    ].join(' '),
    hot: [10.05, 2.05]
  }
};

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

// Measure each path's true bounding box, then fit it into the box.
const fits = await page.evaluate((shapes, box, stroke, shadowPad) => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '400');
  document.body.appendChild(svg);
  const out = {};
  for (const [name, shape] of Object.entries(shapes)) {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', shape.d);
    svg.appendChild(p);
    const b = p.getBBox();
    p.remove();
    // the painted extent is the geometry plus half the keyline plus the shadow
    const pad = stroke / 2 + shadowPad;
    const w = b.width + pad * 2;
    const h = b.height + pad * 2;
    const scale = box / Math.max(w, h);
    // anchor top-left so the hotspot stays near the box origin
    const tx = -(b.x - pad) * scale;
    const ty = -(b.y - pad) * scale;
    out[name] = {
      scale, tx, ty,
      hot: [shape.hot[0] * scale + tx, shape.hot[1] * scale + ty],
      bbox: [b.x, b.y, b.width, b.height]
    };
  }
  svg.remove();
  return out;
}, SHAPES, BOX, STROKE, SHADOW_PAD);

function svg(name, px) {
  const { d } = SHAPES[name];
  const f = fits[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${BOX} ${BOX}">
  <defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" flood-color="#000" flood-opacity="0.4"/>
  </filter></defs>
  <g filter="url(#s)" transform="translate(${f.tx.toFixed(3)} ${f.ty.toFixed(3)}) scale(${f.scale.toFixed(5)})">
    <path d="${d}" fill="#fff" stroke="#fff" stroke-width="${STROKE}" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${d}" fill="#000"/>
  </g>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
await page.setViewport({ width: 200, height: 200, deviceScaleFactor: 1 });

const hotspots = {};
for (const name of Object.keys(SHAPES)) {
  const f = fits[name];
  hotspots[name] = [Math.round(f.hot[0]), Math.round(f.hot[1])];
  for (const [suffix, px] of Object.entries(SIZES)) {
    await page.setContent(
      `<body style="margin:0;background:transparent">${svg(name, px)}</body>`,
      { waitUntil: 'load' }
    );
    const el = await page.$('svg');
    const file = path.join(OUT, name + suffix + '.png');
    await el.screenshot({ path: file, omitBackground: true });
    console.log(
      (name + suffix + '.png').padEnd(16),
      px + 'px',
      String(fs.statSync(file).size + 'b').padEnd(7),
      'hotspot ' + hotspots[name].join(',')
    );
  }
}

// The CSS must use these hotspots — write them out so build.mjs stays in step.
fs.writeFileSync(path.join(OUT, 'hotspots.json'), JSON.stringify(hotspots, null, 2) + '\n');
console.log('hotspots.json ->', JSON.stringify(hotspots));

// magnified sheet plus an actual-size strip, for checking by eye
await page.setViewport({ width: 640, height: 420, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:#0A0A0A;color:#F3F2EE;
  font:12px monospace;height:420px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:26px">
  <div style="display:flex;gap:70px;align-items:flex-end">
    <div style="text-align:center"><div style="width:210px">${svg('arrow', 210)}</div>
      arrow &mdash; hotspot ${hotspots.arrow.join(',')}</div>
    <div style="text-align:center"><div style="width:210px">${svg('hand', 210)}</div>
      hand &mdash; hotspot ${hotspots.hand.join(',')}</div>
  </div>
  <div style="display:flex;gap:18px;align-items:center;border-top:1px solid #333;padding-top:22px">
    ${svg('arrow', 24)}${svg('hand', 24)}
    <span style="color:#86867E">actual size, 24px</span>
  </div>
</body>`, { waitUntil: 'load' });
await page.screenshot({ path: PREVIEW });
console.log('preview: ' + PREVIEW);

await browser.close();
