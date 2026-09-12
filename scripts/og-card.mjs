/* Renders the link-preview card to public/assets/og-cover.jpg.

   Built as a designed card rather than a crop of the portrait: 1200x630 is a wide
   format and the portrait is near-square, so any cover-crop of it lands on an ear.
   Rendering in the browser also means the card uses the site's own typefaces and
   gradient, so a shared link looks like the site it points at.

   JPEG on purpose — WebP support across social scrapers is still patchy, and a
   preview that fails to render is worse than a slightly larger file.

   Local step, like the cursors: the output is committed and the deploy needs
   neither puppeteer nor an image pipeline.
   Run: node scripts/og-card.mjs */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'assets', 'og-cover.jpg');
const PREVIEW = 'C:/Users/nikhi/AppData/Local/Temp/claude/shots2/og-card.png';

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..900&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@1&family=Anton&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #0A0A0A; color: #F3F2EE;
    font-family: Archivo, Helvetica, sans-serif;
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 86px;
  }
  /* the site's own gradient field, same hues */
  .blob { position: absolute; pointer-events: none; }
  .a {
    left: -14%; top: -34%; width: 86%; height: 116%;
    border-radius: 58% 42% 64% 36% / 52% 62% 38% 48%;
    background: radial-gradient(58% 62% at 42% 46%, rgba(179,207,60,0.52), rgba(179,207,60,0.22) 38%, transparent 76%);
    filter: blur(78px);
  }
  .b {
    right: -20%; bottom: -40%; width: 76%; height: 108%;
    border-radius: 46% 54% 38% 62% / 60% 44% 56% 40%;
    background: radial-gradient(60% 58% at 56% 52%, rgba(92,140,186,0.40), rgba(92,140,186,0.14) 42%, transparent 78%);
    filter: blur(86px);
  }
  .scrim { position: absolute; inset: 0;
    background: radial-gradient(92% 76% at 46% 50%, rgba(10,10,10,0.62) 0%, rgba(10,10,10,0.30) 40%, rgba(10,10,10,0.52) 100%); }
  .inner { position: relative; z-index: 2; }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace; font-size: 19px; letter-spacing: 0.2em;
    text-transform: uppercase; color: #A5A49D; display: flex; align-items: center; gap: 14px;
  }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: #B3CF3C;
         box-shadow: 0 0 0 6px rgba(179,207,60,0.16); }
  h1 { font-family: Anton, sans-serif; font-size: 118px; line-height: 0.9;
       font-weight: 400; letter-spacing: -0.02em; text-transform: uppercase; margin-top: 30px; }
  h1 .acc { color: #B3CF3C; }
  .sub { margin-top: 30px; font-size: 29px; line-height: 1.35; color: #B9B8B1; max-width: 22ch; }
  .sub em { font-family: 'Instrument Serif', serif; font-style: italic; color: #F3F2EE; }
  .foot { position: absolute; left: 86px; right: 86px; bottom: 52px; z-index: 2;
    display: flex; justify-content: space-between; align-items: center;
    font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 0.16em;
    text-transform: uppercase; color: #86867E;
    border-top: 1px solid rgba(243,242,238,0.15); padding-top: 26px; }
</style></head><body>
  <div class="blob a"></div><div class="blob b"></div><div class="scrim"></div>
  <div class="inner">
    <div class="eyebrow"><span class="dot"></span>UI/UX &amp; Product Designer &nbsp;·&nbsp; Hyderabad</div>
    <h1>Nikhil<br>Kartikeya<span class="acc">.</span></h1>
    <div class="sub">Make it obvious, then make it <em>beautiful</em>.</div>
  </div>
  <div class="foot"><span>nikhil-design.vercel.app</span><span>Open to work</span></div>
</body></html>`;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
if (page.evaluate) await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 400));

await page.screenshot({ path: OUT, type: 'jpeg', quality: 88 });
fs.copyFileSync(OUT, PREVIEW.replace(/\.png$/, '.jpg'));
console.log('og-cover.jpg  1200x630  ' + (fs.statSync(OUT).size / 1024).toFixed(0) + 'kb');
await browser.close();
