/* Capture full-page screenshots of every route at the given widths. */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:4399';
const OUT = process.env.OUT || 'C:/Users/nikhi/AppData/Local/Temp/claude/shots';
const WIDTHS = (process.env.WIDTHS || '390,1440').split(',').map(Number);
const ROUTES = (process.env.ROUTES || '/,/about,/contact,/404,/foodzy,/apex,/peak-finance-labs,/curate-and-craft').split(',');

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
const page = await browser.newPage();

for (const w of WIDTHS) {
  for (const route of ROUTES) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
    await page.goto(BASE + route, { waitUntil: 'networkidle2' });
    // headless throttles the CSS intro animation to a crawl — settle it instantly
    await page.addStyleTag({ content: "[data-page]{animation:none!important;opacity:1!important;transform:none!important}" });
    // let the reveal observers fire the whole way down
    await page.evaluate(async () => {
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';   // defeat scroll-behavior: smooth
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const max = document.documentElement.scrollHeight;
      for (let y = 0; y < max; y += window.innerHeight * 0.7) {
        window.scrollTo(0, y);
        await wait(160);
      }
      window.scrollTo(0, max);
      await wait(500);
      window.scrollTo(0, 0);
      await wait(500);
      document.documentElement.style.scrollBehavior = prev;
    });
    await new Promise((r) => setTimeout(r, 1600));
    const name = (route === '/' ? 'home' : route.slice(1).replace(/\//g, '-')) + '-' + w + '.png';
    await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    console.log(name);
  }
}
await browser.close();
