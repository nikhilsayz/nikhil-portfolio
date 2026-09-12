# Nikhil Kartikeya — Portfolio

Eight-page portfolio site built from the `design_handoff_portfolio` reference package.
Static HTML/CSS/JS, no framework, no build step at request time — deploys to Vercel as-is.

```
public/                 ← the deployable site (Vercel output directory)
  index.html            /
  about.html            /about
  contact.html          /contact
  404.html              /404  (also Vercel's not-found page)
  foodzy.html           /foodzy
  apex.html             /apex
  peak-finance-labs.html        /peak-finance-labs
  curate-and-craft.html         /curate-and-craft
  app.js                shared runtime (nav, reveals, stepper, chapters)
  assets/               49 images from the handoff
  assets/cursor/        cursor artwork + hotspots.json, generated
reference/              the design handoff, vendored so the build is reproducible
  *.dc.html             the eight design files
  HANDOFF.md            the original spec: tokens, motion timings, responsive rules
scripts/
  build.mjs             regenerates public/*.html from the reference files
  cursors.mjs           renders the cursor PNGs and writes hotspots.json
  serve.mjs             local server that mirrors Vercel's cleanUrls behaviour
  audit.mjs             responsive audit — every route × 14 viewport widths
  shots.mjs             full-page screenshots for visual review
vercel.json             cleanUrls, cache headers, security headers, redirects
```

## Commands

```bash
npm run dev      # http://localhost:4399
npm run build    # regenerate public/*.html from the reference package
node scripts/audit.mjs    # responsive + touch-target + console-error audit
node scripts/shots.mjs    # screenshots into the temp shots directory
```

`build.mjs` reads `reference/*.dc.html`, which is committed, so a fresh clone
rebuilds without the original handoff folder being present.

**Edits made directly to `public/*.html` are overwritten by a rebuild** — change
`scripts/build.mjs` instead. `public/app.js` is hand-written and never generated;
so are `vercel.json`, `robots.txt` and `favicon.svg`.

## Deploying to Vercel

Framework preset **Other**, build command **empty**, output directory **`public`**.
`vercel.json` already sets `cleanUrls`, so `/about` serves `about.html`.

### Once the real URL exists

1. Set `SITE` in `scripts/build.mjs` to the live domain, and replace the same
   placeholder in `public/robots.txt` and `public/sitemap.xml`. These feed the
   canonical tags, Open Graph URLs and the sitemap, so leaving the placeholder
   points search engines and link previews at the wrong site.
2. `npm run build`, commit, push. Vercel redeploys on push.

### Changing the resume

The resume is linked from the nav, About and Contact. All three come from the
`RESUME` constant in `scripts/build.mjs` — change it there and rebuild. Editing
`public/*.html` directly will not survive the next build.

If you re-upload the PDF over the existing Drive file (**Manage versions →
Upload new version**) the file id does not change, the link keeps working, and
nothing in this repo needs touching. Only a brand-new upload needs `RESUME`
updated.

## What the build does to the reference files

The handoff files use a proprietary component runtime. The build strips it and
produces plain HTML:

- `<x-dc>` / `<helmet>` unwrapped; the helmet `<style>` becomes the page's `<style>`
- `style-hover="…"` / `style-focus="…"` compiled into real `:hover` / `:focus-visible` rules
- `onMouseEnter="{{ fn }}"` → `data-on="mouseenter:fn"`, wired by `app.js`
- `{{ clock }}` / `{{ stepHint }}` / … → `<span data-bind="…">`, filled by `app.js`
- `<sc-if>` grid-overlay debug block removed
- `X.dc.html` links rewritten to clean routes; `assets/` → `/assets/`
- contact inputs given `name` / `id` / `autocomplete` (the reference had none)
- offscreen images given `loading="lazy" decoding="async"`
- head filled in: title, description, canonical, Open Graph, favicon

## Deliberate departures from the handoff

These are documented so they can be reverted knowingly.

1. **Film grain removed entirely.** The reference stacks two noise layers — a fixed
   film-grain plate and a grain overlay inside each gradient field. Both are gone;
   no `feTurbulence` survives on any page. What remains is the gradient field with
   its slow drift, and the vignette, which is a darkening gradient rather than
   texture. `build.mjs` throws if it cannot find the grain plate to remove, so a
   future change to the reference files cannot silently reintroduce it.
2. **Content capped at `--maxw: 1440px`.** The reference sections are full-bleed, so
   past ~1600px the work rows stranded their description mid-screen. Marquee bands
   stay full-bleed; hero sections are capped with padding rather than `max-width`
   so their gradient fields still bleed off both edges.
3. **Intro fade is CSS, not JS.** The reference sets `body { opacity: 0 }` and reveals
   it from script — if the script is slow or fails, the page is blank. It now runs as
   `@keyframes pageIn` on `[data-page]`, which also keeps `transform` off `<body>`
   (a transform there makes it a containing block and the fixed cursor scrolls away).
4. **Scroll reveal has a fallback sweep.** The IntersectionObserver alone can miss
   elements when the page is restored mid-scroll or entered on an anchor, which would
   leave a section stuck at `opacity: 0`.
5. **Contact form actually sends.** The reference form was a prototype that only
   flipped a label. It now composes a `mailto:` to nikhilkalimahanthi@gmail.com.
   Swap in Formspree/Basin in `initContactForm()` if a server-side endpoint is wanted.
6. **The accent-dot cursor is gone.** The handoff's lime dot chased the pointer
   from JavaScript, which always trails. It is replaced by real CSS cursors — a
   mac-style arrow and pointing hand — which the OS composites, so there is no
   lag at all. Text keeps the native I-beam, as it does on macOS.

   The artwork is generated: `node scripts/cursors.mjs` renders `arrow`/`hand`
   at 1x and 2x and writes `hotspots.json`, which `build.mjs` reads so the CSS
   hotspots cannot drift from the shapes. Each shape is auto-fitted from its
   measured bounding box with room reserved for the keyline and shadow — the
   hand was previously clipped down its right edge because its path reached
   exactly the viewBox boundary. **Edit the paths in `cursors.mjs`, then rerun
   it** — the PNGs are build output.

   PNG rather than SVG because Safari ignores SVG cursors; `image-set()` carries
   the retina copy, and every declaration ends in a keyword (`default`,
   `pointer`, `text`) so a failed image can never leave a visitor with no cursor.
7. **Accessibility additions.** 44px minimum tap target on the NK logo, keyboard
   operation and `aria-expanded` on the About experience rows, keyboard operation and
   `aria-selected` on the workflow stepper, a visible focus ring, and `min-width: 0`
   on form controls so they shrink below their intrinsic width.

## Audit status

`node scripts/audit.mjs` — 8 routes × 14 widths (320 → 1920): no horizontal scroll,
no sub-24px tap targets, no console errors.

Note: full-page screenshots from `shots.mjs` sometimes show reveal sections blank.
That is a capture artifact — headless Chrome throttles the animation clock — not a
site defect; verified against a real browser.
