/* Responsive audit: loads every route at every breakpoint in headless Chrome and
   reports horizontal overflow, offending elements, tiny touch targets and console errors. */
import puppeteer from 'puppeteer';

const BASE = process.env.BASE || 'http://localhost:4399';
const ROUTES = ['/', '/about', '/contact', '/404', '/foodzy', '/apex', '/peak-finance-labs', '/curate-and-craft'];
const WIDTHS = [320, 360, 390, 414, 520, 640, 720, 768, 820, 900, 1024, 1280, 1440, 1920];

const probe = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const offenders = [];
  const seen = new Set();
  document.querySelectorAll('body *').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (cs.position === 'fixed') return;                      // grain / vignette / cursor
    if (el.closest('[data-marquee], [data-gallery], [aria-hidden="true"]')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const over = Math.round(Math.max(r.right - vw, -r.left));
    if (over <= 1) return;
    // ignore elements inside a scroll container that is meant to scroll
    let p = el.parentElement, inScroller = false;
    while (p && p !== document.body) {
      const pcs = getComputedStyle(p);
      if (pcs.overflowX === 'auto' || pcs.overflowX === 'scroll' || pcs.overflowX === 'hidden') { inScroller = true; break; }
      p = p.parentElement;
    }
    if (inScroller) return;
    const sig = el.tagName + '.' + (el.className || '').toString().slice(0, 40);
    if (seen.has(sig)) return;
    seen.add(sig);
    offenders.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 60),
      data: el.dataset ? Object.keys(el.dataset).slice(0, 3).join(',') : '', over,
      text: (el.textContent || '').trim().slice(0, 40) });
  });

  const small = [];
  document.querySelectorAll('a, button, input, textarea, select, [role="button"]').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    // never presented to a person: the spam honeypot, and anything hidden from
    // assistive tech or pulled off-screen. Not a tap target, so not a finding.
    if (cs.opacity === '0') return;
    if (el.getAttribute('aria-hidden') === 'true' || el.tabIndex < 0) return;
    if (el.closest('[data-marquee], [data-footer-marq], [data-gallery]')) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.height < 24 || r.width < 24) {
      small.push({ tag: el.tagName, h: Math.round(r.height), w: Math.round(r.width),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) });
    }
  });

  // does the viewport ACTUALLY scroll sideways? scrollWidth alone lies when
  // body{overflow-x:hidden} propagates to the viewport.
  const before = window.scrollX;
  window.scrollTo(99999, window.scrollY);
  const canScrollX = Math.round(window.scrollX);
  window.scrollTo(before, window.scrollY);

  return {
    canScrollX,
    scrollW: de.scrollWidth, clientW: de.clientWidth,
    bodyScrollW: document.body.scrollWidth,
    offenders: offenders.sort((a, b) => b.over - a.over).slice(0, 8),
    small: small.slice(0, 8),
    bodyOpacity: getComputedStyle(document.body).opacity,
    navh: getComputedStyle(de).getPropertyValue('--navh').trim()
  };
};

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--font-render-hinting=none'] });
const page = await browser.newPage();

let problems = 0;
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

for (const route of ROUTES) {
  const bad = [];
  for (const w of WIDTHS) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(BASE + route, { waitUntil: 'networkidle2' });
    // headless throttles the CSS intro animation to a crawl — settle it instantly
    await page.addStyleTag({ content: "[data-page]{animation:none!important;opacity:1!important;transform:none!important}" });
    await new Promise((r) => setTimeout(r, 1300));
    const res = await page.evaluate(probe);
    const overflow = res.canScrollX;
    if (overflow > 1 || res.offenders.length || res.small.length || Number(res.bodyOpacity) < 1) {
      bad.push({ w, overflow, ...res });
    }
  }
  if (!bad.length) { console.log('OK   ' + route); continue; }
  problems += bad.length;
  console.log('FAIL ' + route);
  for (const b of bad) {
    console.log('  @' + b.w + 'px  scrollW=' + b.scrollW + ' clientW=' + b.clientW +
      ' overflow=' + b.overflow + ' bodyOpacity=' + b.bodyOpacity + ' navh=' + b.navh);
    b.offenders.forEach((o) => console.log('     over+' + o.over + 'px  <' + o.tag.toLowerCase() +
      '> data[' + o.data + '] "' + o.text.replace(/\s+/g, ' ') + '"'));
    b.small.forEach((s) => console.log('     tiny ' + s.w + 'x' + s.h + ' <' + s.tag.toLowerCase() + '> "' + s.text.replace(/\s+/g, ' ') + '"'));
  }
}

if (consoleErrors.length) {
  console.log('\nCONSOLE ERRORS');
  [...new Set(consoleErrors)].forEach((e) => console.log('  ' + e.slice(0, 160)));
}
console.log('\n' + (problems ? problems + ' failing page/width combinations' : 'clean across all widths'));
await browser.close();
