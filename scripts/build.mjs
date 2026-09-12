import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolved from this file, not the cwd, and from the copy of the design package
// vendored into the repo — so a fresh clone can rebuild without the original
// handoff folder being present on the machine.
// Must be fileURLToPath, not `new URL(...).pathname`: on Windows the pathname is
// "/C:/x" and needs the leading slash stripped, but on Linux it is already "/x"
// and stripping it yields a relative path that resolve() then appends to the cwd
// — which is what doubled the path to /vercel/path0/vercel/path0 on deploy.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'reference');
const OUT = path.join(ROOT, 'public');
const ASSETS = path.join(OUT, 'assets');   // images ship in the repo, already in place

const PAGES = [
  { src: 'Home.dc.html', out: 'index.html', route: '/',
    title: 'Nikhil Kartikeya — UI/UX & Product Designer',
    desc: 'UI/UX and product designer in Hyderabad, previously at Amazon. Case studies in product design, brand systems and interface craft.' },
  { src: 'About.dc.html', out: 'about.html', route: '/about',
    title: 'About — Nikhil Kartikeya',
    desc: 'How I work, where I have worked, and the graphic design that runs alongside the product work.' },
  { src: 'Contact.dc.html', out: 'contact.html', route: '/contact',
    title: 'Contact — Nikhil Kartikeya',
    desc: 'Open to work. Reach me at nikhilkalimahanthi@gmail.com — replies within a day.' },
  { src: '404.dc.html', out: '404.html', route: '/404', noindex: true,
    title: 'Page not found — Nikhil Kartikeya', desc: 'That page does not exist.' },
  { src: 'Case-Foodzy.dc.html', out: 'foodzy.html', route: '/foodzy',
    caseStudy: 'https://www.behance.net/gallery/248513493/Foodzy-App-UIUX-Case-Study',
    title: 'Foodzy — Case Study — Nikhil Kartikeya',
    desc: 'A campus cafeteria ordering app: research, information architecture, wireframes and the shipped interface.' },
  { src: 'Case-Apex.dc.html', out: 'apex.html', route: '/apex',
    caseStudy: 'https://www.behance.net/gallery/249891129/APEX-Automotive-Web-Experience',
    title: 'Apex — Case Study — Nikhil Kartikeya',
    desc: 'A performance automotive configurator — brand, product surface and spec-sheet detail.' },
  { src: 'Case-Peak-Finance-Labs.dc.html', out: 'peak-finance-labs.html', route: '/peak-finance-labs',
    caseStudy: 'https://www.behance.net/gallery/255582289/Peak-Finance-Labs',
    title: 'Peak Finance Labs — Case Study — Nikhil Kartikeya',
    desc: 'Identity system and product surfaces for a finance lab: mark construction, grid, contrast grades and dashboards.' },
  { src: 'Case-Curate-And-Craft.dc.html', out: 'curate-and-craft.html', route: '/curate-and-craft',
    title: 'Curate & Craft Media — Case Study — Nikhil Kartikeya',
    desc: 'A logo-only identity piece: four lockups, each on its true ground.' }
];

const LINKS = {
  'Home.dc.html': '/', 'Home.dc.html#work': '/#work', 'Home.dc.html#stack': '/#stack',
  'About.dc.html': '/about', 'Contact.dc.html': '/contact', '404.dc.html': '/404',
  'Case-Foodzy.dc.html': '/foodzy', 'Case-Apex.dc.html': '/apex',
  'Case-Peak-Finance-Labs.dc.html': '/peak-finance-labs',
  'Case-Curate-And-Craft.dc.html': '/curate-and-craft'
};

// The live site. The single source of truth for canonical URLs, Open Graph,
// robots.txt and sitemap.xml — all four are generated from it. Point this at a
// custom domain and rebuild; nothing else needs touching.
const SITE = 'https://nikhil-design.vercel.app';

// The resume, linked from the nav, About and Contact. The reference files hard-code
// one Drive id in three places; this rewrites all three, so changing the resume is
// a one-line edit here rather than a hunt through generated HTML.
// Note: re-uploading over the same Drive file (Manage versions -> Upload new
// version) keeps the id, and then nothing here needs to change at all.
const RESUME = 'https://drive.google.com/file/d/12Xcnif-jiGb_rL7f9e71gKNghhMTj4G5/view?usp=sharing';

// Formspree endpoint for the contact form. Set as the form's real action/method
// too, not just used from fetch, so the form still delivers with JavaScript off.
const FORM_ENDPOINT = 'https://formspree.io/f/mrpgvgav';

// Written by scripts/cursors.mjs beside the PNGs, so the CSS hotspots can never
// drift out of step with the artwork they belong to.
const HOTSPOTS = JSON.parse(
  fs.readFileSync(path.join(OUT, 'assets/cursor/hotspots.json'), 'utf8')
);
const HOT = Object.fromEntries(
  Object.entries(HOTSPOTS).map(([k, v]) => [k, v.join(' ')])
);

let hoverRules = [];
const hoverIndex = new Map();

function hoverClass(css, pseudo) {
  const key = pseudo + '|' + css;
  if (hoverIndex.has(key)) return hoverIndex.get(key);
  const cls = (pseudo === 'hover' ? 'hv-' : 'fv-') + hoverIndex.size;
  const decls = css.trim().replace(/;\s*$/, '')
    .split(';').map(s => s.trim()).filter(Boolean)
    .map(s => s + ' !important').join('; ');
  const sel = pseudo === 'hover' ? 'hover' : 'focus-visible';
  hoverRules.push('.' + cls + ':' + sel + '{' + decls + ';}');
  hoverIndex.set(key, cls);
  return cls;
}

function addClass(tag, cls) {
  if (/\sclass="/.test(tag)) return tag.replace(/\sclass="([^"]*)"/, (m, v) => ' class="' + v + ' ' + cls + '"');
  return tag.replace(/^<([a-zA-Z0-9-]+)/, '<$1 class="' + cls + '"');
}

function addAttr(tag, name, val) {
  return tag.replace(/^<([a-zA-Z0-9-]+)/, '<$1 ' + name + '="' + val + '"');
}

function transform(page) {
  const raw = fs.readFileSync(path.join(SRC, page.src), 'utf8');

  const helmetMatch = raw.match(/<helmet>([\s\S]*?)<\/helmet>/);
  const helmet = helmetMatch ? helmetMatch[1] : '';
  let body = raw.slice(raw.indexOf('</helmet>') + '</helmet>'.length);
  body = body.slice(0, body.indexOf('</x-dc>'));

  let styles = [...helmet.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');

  // the grain plate is gone, so its keyframes are dead weight
  styles = styles.replace(/^\s*@keyframes grain \{[^\n]*\n/gm, '');

  // grid overlay debug block — value is false, drop it
  body = body.replace(/<sc-if[\s\S]*?<\/sc-if>/g, '');

  // style-hover / style-focus -> generated CSS classes
  body = body.replace(/<[a-zA-Z0-9-]+\b[^>]*>/g, (tag) => {
    let t = tag;
    const hov = t.match(/\sstyle-hover="([^"]*)"/);
    if (hov) { t = t.replace(hov[0], ''); t = addClass(t, hoverClass(hov[1], 'hover')); }
    const foc = t.match(/\sstyle-focus="([^"]*)"/);
    if (foc) { t = t.replace(foc[0], ''); t = addClass(t, hoverClass(foc[1], 'focus')); }
    return t;
  });

  // event holes -> data-on attributes consumed by app.js
  body = body.replace(/\son([A-Z][a-zA-Z]*)="\{\{\s*([a-zA-Z0-9_]+)\s*\}\}"/g,
    (m, evt, fn) => ' data-on="' + evt.toLowerCase() + ':' + fn + '"');
  body = body.replace(/<[a-zA-Z0-9-]+\b[^>]*>/g, (tag) => {
    const all = [...tag.matchAll(/\sdata-on="([^"]*)"/g)];
    if (all.length < 2) return tag;
    const t = tag.replace(/\sdata-on="[^"]*"/g, '');
    return addAttr(t, 'data-on', all.map(a => a[1]).join(' '));
  });

  // text holes -> bind targets
  body = body.replace(/\{\{\s*(clock|stepHint|statusNote|buttonLabel)\s*\}\}/g,
    (m, k) => '<span data-bind="' + k + '"></span>');
  body = body.replace(/\{\{[^}]*\}\}/g, '');

  // --- Texture ---------------------------------------------------------
  // Both noise layers are removed: the fixed film-grain plate, and the grain
  // overlay that sat inside the gradient fields. The gradients and their drift
  // stay, as does the vignette — that is a darkening gradient, not texture.
  // Each of these divs is empty, so the first </div> after it is its own.
  const dropIfEmpty = (m, test) => (m.includes('<div', 1) ? m : (test(m) ? '' : m));

  let grainRemoved = 0;
  body = body.replace(/<div data-film=""[\s\S]*?<\/div>\s*/g, (m) =>
    dropIfEmpty(m, (s) => {
      const hit = s.includes('mix-blend-mode: screen') && s.includes('feTurbulence');
      if (hit) grainRemoved++;
      return hit;
    }));

  let overlayRemoved = 0;
  body = body.replace(/<div aria-hidden="true"[\s\S]*?<\/div>\s*/g, (m) =>
    dropIfEmpty(m, (s) => {
      const hit = s.includes('mix-blend-mode: overlay') && s.includes('feTurbulence');
      if (hit) overlayRemoved++;
      return hit;
    }));

  if (!grainRemoved) throw new Error('film grain plate not found in ' + page.src);

  // The accent dot cursor is gone — the site uses real CSS cursors instead, which
  // the OS composites, so there is nothing left to chase the pointer.
  body = body.replace(/<div data-cur-dot=[\s\S]*?<\/div>\s*/g, '');

  // Tag the page wrapper (the one top-level div that is not a fixed overlay).
  // The intro fade rides on this rather than on <body>: a transform on <body>
  // would turn it into a containing block and drag the fixed cursor/grain with it.
  {
    let tagged = false;
    body = body.replace(/^<div\b[^>]*>/gm, (tag) => {
      if (tagged || tag.includes('aria-hidden')) return tag;
      tagged = true;
      return addAttr(tag, 'data-page', '');
    });
    if (!tagged) throw new Error('no page wrapper found in ' + page.src);
  }

  // Wire the form to Formspree at the markup level. With JS the submit is
  // intercepted and posted by fetch; without it, the browser posts natively to
  // the same endpoint and Formspree renders its own confirmation — so the form
  // works either way. `_gotcha` is Formspree's honeypot: hidden from people,
  // filled in by bots, and silently discarded.
  if (page.src === 'Contact.dc.html') {
    body = body.replace(/<form\b[^>]*>/, (tag) => {
      let t = addAttr(tag, 'action', FORM_ENDPOINT);
      t = addAttr(t, 'method', 'POST');
      return t;
    });
    body = body.replace(/<button[^>]*type="submit"/, (m) =>
      '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" ' +
      'style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />' + m);
  }

  // contact form fields carry no name/autocomplete in the reference — add them
  if (page.src === 'Contact.dc.html') {
    const fields = [
      ['name', 'name'], ['email', 'email'], ['subject', 'off'], ['message', 'off']
    ];
    let fi = 0;
    body = body.replace(/<(input|textarea)\b[^>]*>/g, (tag) => {
      const f = fields[fi++];
      if (!f) return tag;
      let t = addAttr(tag, 'name', f[0]);
      t = addAttr(t, 'id', 'f-' + f[0]);
      t = addAttr(t, 'autocomplete', f[1]);
      return t;
    });
  }

  // Point the "read the entire case study" button at this project's own gallery.
  // The reference sends all three to the generic Behance profile (Apex to an old
  // Framer site), which makes the reader hunt for the piece they just read about.
  // Curate & Craft has no button — the design says so, it is a logo-only piece.
  {
    const cta = /<a\b[^>]*data-cursor="Read in full"[^>]*>/;
    const hasCta = cta.test(body);
    if (page.caseStudy) {
      if (!hasCta) throw new Error('case-study CTA not found in ' + page.src);
      body = body.replace(cta, (tag) =>
        tag.replace(/href="[^"]*"/, 'href="' + page.caseStudy + '"'));
    } else if (hasCta) {
      throw new Error('unexpected case-study CTA in ' + page.src + ' (no caseStudy set)');
    }
  }

  // point every resume link at the current file
  let resumeLinks = 0;
  body = body.replace(/https:\/\/drive\.google\.com\/file\/d\/[^"']+/g, () => {
    resumeLinks++;
    return RESUME;
  });

  // links + assets
  body = body.replace(/(href|src)="([^"]+)"/g, (m, attr, val) => {
    if (LINKS[val]) return attr + '="' + LINKS[val] + '"';
    if (val.startsWith('assets/')) return attr + '="/' + val + '"';
    if (val.startsWith('./assets/')) return attr + '="/' + val.slice(2) + '"';
    return m;
  });

  // Serve the WebP encodes (see scripts/images.mjs). Only the flat asset images —
  // the cursor PNGs live in /assets/cursor/ and must stay as they are.
  body = body.replace(/\/assets\/([A-Za-z0-9_-]+)\.(png|jpe?g)\b/g, (m, name) => {
    const webp = path.join(ASSETS, name + '.webp');
    if (!fs.existsSync(webp)) throw new Error('missing webp for ' + name + ' (run scripts/images.mjs)');
    return '/assets/' + name + '.webp';
  });

  // lazy-load offscreen imagery (never the first plate on a page)
  let imgSeen = 0;
  body = body.replace(/<img\b[^>]*>/g, (tag) => {
    if (/cdn\.simpleicons\.org/.test(tag)) return tag.includes('loading=') ? tag : addAttr(tag, 'loading', 'lazy');
    imgSeen++;
    if (imgSeen <= 1 || tag.includes('loading=')) return tag;
    return addAttr(addAttr(tag, 'loading', 'lazy'), 'decoding', 'async');
  });

  const fontLinks = [...helmet.matchAll(/<link[^>]*rel="(?:preconnect|stylesheet)"[^>]*>/g)]
    .map(m => m[0]).join('\n  ');

  const extra = [
    '  html { -webkit-tap-highlight-color: rgba(179,207,60,0.18); }',
    '  :root { --maxw: 1440px; }',
    // On a wide monitor the reference layout runs edge to edge: work rows strand
    // their description mid-screen and the meta column drifts off to the right.
    // Cap the measure. Full-bleed bands (hero gradient, marquees) opt out.
    '  [data-page] section:not(:has([data-marquee])):not(:has([data-herofield])),',
    '  [data-page] > footer > div:not([aria-hidden]):not([data-footer-marq]),',
    '  [data-page] > footer > a:not([data-footer-marq]) {',
    '    max-width: var(--maxw); margin-left: auto; margin-right: auto;',
    '  }',
    // Hero sections must stay full-bleed so the gradient field still bleeds off
    // both edges, so cap them with padding rather than max-width. The field is
    // absolutely positioned against the padding box, so it is unaffected.
    '  [data-page] section:has([data-herofield]) {',
    '    padding-left: max(clamp(16px, 3vw, 48px), calc((100% - var(--maxw)) / 2)) !important;',
    '    padding-right: max(clamp(16px, 3vw, 48px), calc((100% - var(--maxw)) / 2)) !important;',
    '  }',
    // Nudge the supporting type up on very large screens so it stops reading as fine print.
    // Form controls carry an intrinsic min-width (the default `size`) that keeps
    // a grid column from shrinking, which overflows the contact form under ~400px.
    '  [data-page] form, [data-page] form label, [data-page] form > div { min-width: 0; }',
    '  [data-page] form input, [data-page] form textarea, [data-page] form select {',
    '    width: 100%; min-width: 0; max-width: 100%;',
    '  }',
    // Long unbroken strings (email, handles) must be allowed to wrap on narrow screens.
    '  [data-page] a[href^="mailto:"], [data-page] a[href^="tel:"] { min-width: 0; overflow-wrap: anywhere; }',
    '  @media (min-width: 1600px) {',
    '    [data-rowdesc] { font-size: 17px !important; }',
    '    [data-rowmeta] { font-size: 11px !important; }',
    '    [data-hero] > p { font-size: 26px !important; }',
    '  }',
    '  @keyframes pageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }',
    '  [data-page] { animation: pageIn .55s cubic-bezier(.22,.7,.2,1) both; }',
    '  [data-page][data-leaving] { opacity: 0; transform: translateY(-14px); transition: opacity .35s cubic-bezier(.22,.7,.2,1), transform .4s cubic-bezier(.22,.7,.2,1); }',
    '  @media (prefers-reduced-motion: reduce) { [data-page] { animation: none; } [data-page][data-leaving] { opacity: 1; transform: none; } }',
    '  img { height: auto; }',
    '  :where(a, button, input, textarea, select):focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; border-radius: 4px; }',
    '  @media (prefers-reduced-motion: reduce) {',
    '    [data-herofield] > div, [data-footfield] > div, [data-marquee] { animation: none !important; }',
    '  }',
    // Mac-style pointer, drawn by the site so every visitor sees the same shape.
    // These are real CSS cursors: the OS composites them, so there is zero lag.
    // Raster, not SVG — Safari ignores SVG cursors. image-set carries the retina
    // copy; the plain url() above it is the fallback for anything that cannot
    // parse image-set. A keyword tail always ends the list, so a failed image can
    // never leave the visitor without a cursor. Hotspots come from cursors.mjs.
    '  @media (hover: hover) and (pointer: fine) {',
    '    html, body {',
    '      cursor: url("/assets/cursor/arrow.png") ' + HOT.arrow + ', default;',
    '      cursor: -webkit-image-set(url("/assets/cursor/arrow.png") 1x, url("/assets/cursor/arrow@2x.png") 2x) ' + HOT.arrow + ', default;',
    '      cursor: image-set(url("/assets/cursor/arrow.png") 1x, url("/assets/cursor/arrow@2x.png") 2x) ' + HOT.arrow + ', default;',
    '    }',
    // macOS shows an I-beam over selectable text rather than the arrow. Without
    // this the arrow sits over every paragraph and stops reading as a real cursor.
    '    p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, dd, dt, td, th, code, pre {',
    '      cursor: text;',
    '    }',
    // Interactive elements take the hand, the text inside them included.
    '    a, a *, button, button *, summary, [role="button"], [role="button"] *,',
    '    [data-cursor], [data-step], [data-step] *, [data-exp], [data-exp] *,',
    '    input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select {',
    '      cursor: url("/assets/cursor/hand.png") ' + HOT.hand + ', pointer !important;',
    '      cursor: -webkit-image-set(url("/assets/cursor/hand.png") 1x, url("/assets/cursor/hand@2x.png") 2x) ' + HOT.hand + ', pointer !important;',
    '      cursor: image-set(url("/assets/cursor/hand.png") 1x, url("/assets/cursor/hand@2x.png") 2x) ' + HOT.hand + ', pointer !important;',
    '    }',
    // Text entry keeps the native I-beam; a custom arrow there would hide the caret.
    '    input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]),',
    '    textarea { cursor: text !important; }',
    '    :disabled, [aria-disabled="true"] { cursor: not-allowed !important; }',
    '  }',
    hoverRules.join('\n')
  ].join('\n');

  const head = [
    '<meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    '  <title>' + page.title + '</title>',
    '  <meta name="description" content="' + page.desc + '" />',
    page.noindex
      ? '  <meta name="robots" content="noindex" />'
      : '  <link rel="canonical" href="' + SITE + page.route + '" />',
    '  <meta name="theme-color" content="#0A0A0A" />',
    '  <meta name="color-scheme" content="dark" />',
    '  <meta property="og:type" content="website" />',
    '  <meta property="og:site_name" content="Nikhil Kartikeya" />',
    '  <meta property="og:title" content="' + page.title + '" />',
    '  <meta property="og:description" content="' + page.desc + '" />',
    '  <meta property="og:url" content="' + SITE + page.route + '" />',
    '  <meta property="og:image" content="' + SITE + '/assets/og-cover.jpg" />',
    '  <meta property="og:image:width" content="1200" />',
    '  <meta property="og:image:height" content="630" />',
    '  <meta property="og:image:alt" content="Nikhil Kartikeya, UI/UX and product designer" />',
    '  <meta name="twitter:card" content="summary_large_image" />',
    '  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    '  <link rel="apple-touch-icon" href="/favicon.svg" />',
    '  ' + fontLinks,
    '  <style>',
    styles,
    extra,
    '  </style>'
  ].join('\n');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  ' + head,
    '</head>',
    '<body>',
    body.trim(),
    '<' + 'script src="/app.js" defer><' + '/script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

fs.mkdirSync(OUT, { recursive: true });
const outputs = [];
for (const p of PAGES) {
  hoverRules = []; hoverIndex.clear();
  const html = transform(p);
  fs.writeFileSync(path.join(OUT, p.out), html);
  outputs.push(p.out.padEnd(26) + (html.length / 1024).toFixed(1) + 'kb');
}

// The masters in reference/assets/ are deliberately NOT copied here: public/
// ships only the WebP encodes, which scripts/images.mjs writes and which are
// committed. Copying the masters in would put 46MB of unreferenced PNGs into
// every deploy.
fs.mkdirSync(ASSETS, { recursive: true });

// robots.txt and sitemap.xml are generated from SITE and PAGES, not hand-kept,
// so they cannot drift from the canonical URLs the pages themselves declare.
const indexable = PAGES.filter((p) => !p.noindex);

fs.writeFileSync(
  path.join(OUT, 'robots.txt'),
  ['User-agent: *', 'Allow: /', '', 'Sitemap: ' + SITE + '/sitemap.xml', ''].join('\n')
);

const lastmod = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexable.map((p) =>
      '  <url><loc>' + SITE + p.route + '</loc><lastmod>' + lastmod + '</lastmod></url>'),
    '</urlset>',
    ''
  ].join('\n')
);

console.log(outputs.join('\n'));
console.log('assets: ' + fs.readdirSync(ASSETS).length);
console.log('sitemap: ' + indexable.length + ' urls at ' + SITE);
