# Handoff: Nikhil Kartikeya — Design Portfolio

## Overview

An eight-page personal portfolio for **Nikhil Kartikeya**, a UI/UX designer based in Hyderabad, India (previously at Amazon, currently open to work). Dark editorial aesthetic with strong typographic treatment, film grain texture, an animated hero gradient field, a custom accent-dot cursor, and four detailed case studies.

Pages: Home, About, Contact, 404, and four case studies (Foodzy, Apex, Peak Finance Labs, Curate & Craft Media).

## About the Design Files

The files in `reference/` are **design references authored in HTML** — working prototypes that show intended look, motion and behaviour. They are **not production code to copy directly**.

They use a proprietary component runtime (`support.js`, `<x-dc>`, `{{ }}` template holes, a `Component extends DCLogic` class). **Ignore that wrapper entirely.** What matters is the markup structure, the inline styles, the `<style>` block in `<helmet>`, and the logic-class methods, which document the interaction behaviour in plain JS.

The task is to **recreate these designs in the target environment** — React/Next.js is the natural fit — using its established patterns. If no codebase exists yet, Next.js (App Router) + Tailwind or CSS Modules + GSAP/Lenis is a sound default.

### Opening a reference file
Each `.dc.html` opens directly in a browser. `reference/assets/` must sit beside them.

## Fidelity

**High fidelity.** Final colours, typography, spacing, motion timings and copy. Recreate pixel-accurately. Every hex, duration and easing curve below is exact and taken from the source.

---

## Design Tokens

### Colour
| Token | Hex | Use |
|---|---|---|
| `--acc` | `#B3CF3C` | Accent (lime). Links on hover, active states, the trailing period in headings, cursor dot |
| `--bg` | `#0A0A0A` | Page background |
| `--desk` | `#050505` | Desk behind case-study article panels |
| `--surface` | `#101010` | Card / image-plate ground |
| `--surface2` | `#111111` | Raised surface, hover ground |
| `--ink` | `#F3F2EE` | Primary text |
| `--ink2` | `#E4E3DC` | Secondary text, lead paragraphs |
| `--t1` | `#B9B8B1` | Body copy |
| `--t2` | `#A5A49D` | Supporting copy |
| `--mut` | `#86867E` | Mono labels, meta |
| `--t3` | `#7C7C75` | Captions |
| `--t4` | `#4A4A46` | Faintest — table dashes, dividers |
| `--line` | `rgba(243,242,238,0.13)` | Standard hairline border |
| `--line2` | `rgba(243,242,238,0.22)` | Emphasised border |
| `--line3` | `rgba(243,242,238,0.08)` | Faint border |
| `--stripe` | `rgba(243,242,238,0.055)` | Diagonal plate stripes |
| `--wash` | `rgba(243,242,238,0.035)` | Subtle fill |
| `--ghost` | `rgba(243,242,238,0.10)` | Ghost fill |

Amazon orange `#FF9900` is used once, on the word "Amazon" in the Home hero chip.

**Selection:** `background: var(--acc); color: #0A0A0A`.

### Typography

Three families, loaded from Google Fonts:

```
Archivo — ital,wdth,wght@0,62..125,300..900;1,62..125,300..900
JetBrains Mono — wght@300;400;500
Instrument Serif — ital@0;1
Anton — (single weight)
```

| Role | Family | Treatment |
|---|---|---|
| Hero headline | **Anton**, fallback `'Space Grotesk', sans-serif` | `clamp(33px, 8.2vw, 154px)`, weight 400, line-height 0.92, letter-spacing ~`-0.02em`, uppercase |
| "beautiful" (hero) | **Instrument Serif** italic | weight 400, letter-spacing `-0.01em`, `text-transform: none` — deliberately breaks the uppercase run |
| Section headings | **Archivo** | weight 700–800, `font-stretch: 64–74%` (condensed), letter-spacing `-0.03em`, uppercase |
| Body | **Archivo** | weight 400, line-height 1.5–1.6 |
| Labels / meta / captions | **JetBrains Mono** | 9–11px, letter-spacing `0.14–0.24em`, uppercase |

> **Note:** `font-stretch` on Archivo is essential — the condensed headings are a defining trait. Archivo Variable must be loaded with its width axis (`wdth`), not the static family.

### Spacing & radii
Everything is fluid `clamp()`. Common patterns:
- Section padding: `clamp(36px, 6.4vw, 100px) clamp(16px, 4vw, 76px) 0`
- Page gutter: `clamp(14px, 3vw, 48px)`
- Card padding: `clamp(14px, 1.8vw, 22px)`
- Radii: `3–4px` on plates, `999px` on pills, `clamp(6px, 1.4vw, 20px)` on the case-study article panel
- Shadow (article panel): `0 40px 120px rgba(0,0,0,0.75)`

---

## Global Systems

These appear on **every** page and should be built once as shared components/hooks.

### 1. Film grain + vignette
Two `position: fixed` layers, `pointer-events: none`:
- **Grain** — `z-index: 9998`, `inset: -60%`, `opacity: 0.05`, `mix-blend-mode: screen`, background is an inline SVG `feTurbulence` (`baseFrequency 0.85`, `numOctaves 3`, desaturated), animated by `@keyframes grain` — 11 discrete translate steps, `1.1s steps(4) infinite`.
- **Vignette** — `z-index: 9997`, `radial-gradient(125% 95% at 50% 45%, transparent 46%, rgba(0,0,0,0.34) 80%, rgba(0,0,0,0.62) 100%)`.

Exposed as a three-step control: Off / Subtle (0.05) / Heavy (0.10).

### 2. Custom cursor
A single accent dot, no ring, no label — Apple-style.
- 10px `var(--acc)` circle, `position: fixed`, `z-index: 10001`, `mix-blend-mode: normal`.
- Eases toward the pointer at **0.16 lerp per frame** in a `requestAnimationFrame` loop, giving a soft trailing delay.
- Grows to ~22px and drops to ~40% opacity over any `a`, `button`, or `[data-cursor]`.
- Native cursor hidden via `html[data-cursorless="on"] * { cursor: none !important }`, **except** `input`/`textarea` which keep `cursor: text`.
- Only enabled under `(hover: hover) and (pointer: fine)`. Touch keeps the system cursor; reduced-motion drops the lerp.

> Critical: do **not** set `will-change` on `<body>`. It creates a containing block for `position: fixed` and the cursor scrolls away with the document.

### 3. Page transitions
On mount: `<body>` fades `0 → 1` and slides `translateY(16px) → 0` over `.55s/.65s cubic-bezier(.22,.7,.2,1)`.
On any internal link click: fades to `0` with `translateY(-14px)`, navigates after **400ms**. Modifier-clicks, `target="_blank"` and reduced-motion bypass it.

### 4. Smooth scroll
`scroll-behavior: smooth` with `scroll-padding-top: 72px` (accounts for the sticky nav). Disabled under `prefers-reduced-motion`.

### 5. Marquee footer
An infinite horizontal ticker linking to Contact — "Open to work / Let's work together / Hyderabad, IN / nikhilkalimahanthi@gmail.com / Replies within a day", separated by accent slashes. Two identical groups inside a `width: max-content` flex track, `@keyframes marq` translating `0 → -50%` over 26s linear. Text turns accent on hover.

---

## Screens

### Home (`Home.dc.html`)

**Nav** — Sticky, `z-index: 40`. Starts full-width and edge-aligned; on scroll past ~40px it animates to a centred, shortened, glass pill (`backdrop-filter: blur`, hairline border). Transition is on `max-width`/`padding`/`border-radius`, ~`.5s cubic-bezier(.22,.7,.2,1)`. Nav height is measured into a `--navh` CSS variable on mount and resize. Links: Work, About, Resume.

**Hero** — Full viewport (`min-height: 100svh`), pulled up behind the nav by `margin-top: calc(-1 * var(--navh))` with matching top padding, so the gradient runs beneath the bar. Centre-aligned.
- **Gradient field** — three large blurred radial blobs in accent-adjacent hues, animated by `heroDriftA` / `heroDriftB` (translate + scale, ~20–28s ease-in-out infinite) and `heroBreathe` (opacity 0.55 ↔ 0.9). A mask fades the field to transparent at the section's bottom edge so it does not read as a rectangle. Disabled under reduced-motion.
- **Headline** — "Make it obvious, then make it **beautiful**." Anton uppercase, with "beautiful" in Instrument Serif italic.
- **Support line** — "I study how people break things, now I design so they don't have to."
- **Chip row** (`[data-chiprow]`, three `[data-chip]` pills): "Open to work", "Previously at <span style="color:#FF9900">Amazon</span>", "See work". One row at every breakpoint — see Responsive below.

**Featured work** — Four numbered rows (01–04): Foodzy, Apex, Peak Finance Labs, Curate & Craft Media. Each row is number / title / category / arrow. On hover a **cursor-following preview card** appears — a small image plate with a one-line description, positioned at the pointer and eased toward it. Each project has its own preview image and copy.

**Stack & workflow** — Four numbered workflow steps (Find the logic / AI-driven fidelity / Prototype & validate / Ship & iterate). Hovering a step swaps the adjacent panel to that step's detail and highlights its tool set. Tool chips use Simple Icons CDN (`https://cdn.simpleicons.org/<slug>/F3F2EE`) with a text-monogram fallback on error. Midjourney has no Simple Icons entry — it uses an "MJ" monogram deliberately.

**Footer** — Marquee + social links (Behance, LinkedIn, Email) + copyright.

### About (`About.dc.html`)

- Hero heading, intro copy.
- **Portrait + experience band** — portrait (`nk-portrait.jpg`, max 420px) beside the intro and experience list. Experience rows (`[data-exp]`) are collapsed by default; hovering reveals the detail, with a 45° arrow indicating there is more.
- **Graphic design gallery** — two full-bleed rows of 4:5 tiles scrolling in **opposite** directions (`marq` 82s / `marqr` 72s, linear infinite). 17 pieces, each duplicated within its track for the seamless loop. Tiles `clamp(132px, 15vw, 210px)` wide.
- Marquee footer.

### Contact (`Contact.dc.html`)
Large heading, email as primary CTA, social links, availability note.

### 404 (`404.dc.html`)
Oversized "404", short line, recovery links to the main pages.

### Case studies — shared shell

All four share one structure:

1. **Sticky chapter bar** — `z-index: 12`, near-opaque ground (`rgba(10,10,10,0.92)`) + blur + hairline bottom border. Holds "← Index", a live chapter readout (`[data-chapter]`, `white-space: nowrap`), and "Contact ↗". Below it a 1px **progress bar** fills with `var(--acc)` in proportion to scroll (`.15s linear`).
2. **Article panel** — `max-width: 1440px`, `background: var(--bg)` on the darker desk, 1px border, large soft shadow, rounded.
3. **Header** — mono eyebrow (`// Case 0N · Discipline · Year`), oversized condensed uppercase title with an accent period, a lead sentence, then a meta grid (Role / Scope / Tools / Timeline / Platform).
4. **Numbered sections** — each `<section data-sec="0N — Name">`; the scroll handler reads these to drive the chapter readout. Eyebrow label spans the row; heading and body copy are `align-items: baseline` so they share a reference line.
5. **Prev/next nav** then the shared footer.

Section content per case study is in the reference files — copy it verbatim, it is the client's own writing.

| Case | Sections | Notable |
|---|---|---|
| **Foodzy** | 8 | Competitive comparison table (`minmax(0,2fr) repeat(3, minmax(30px,0.42fr))`); real research artefacts (empathy map, 5W+H, IA sitemap, wireframes); palette `#FF6A2B` / `#818CF8` / `#34D399`; Clash Display + Satoshi; "read the entire case study" pill → Behance |
| **Apex** | 6 | Spec-sheet numbering ("Spec 01…"); staggered image plates; verbatim quoted paragraphs; palette Void/Bone/Signal red `#0A0A0A` / `#E8E6E1` / `#E23B3B` |
| **Peak Finance Labs** | 12 | Logo construction diagram, clearspace rule, reversed marks, grid system, colour contrast grades, product surfaces |
| **Curate & Craft Media** | 6 | Logo-only piece — no case-study link, and the closing section says so explicitly. Four lockups (stacked/horizontal × positive/reversed), each on its true ground. Palette `#000000` / `#2C2C2C` / `#B0B0B0` / `#FFFFFF` |

---

## Interactions & Behaviour

| Interaction | Detail |
|---|---|
| Cursor dot | 0.16 lerp per rAF; 10px → 22px + 40% opacity over interactive elements |
| Nav condense | On scroll > ~40px; `.5s cubic-bezier(.22,.7,.2,1)` on max-width/padding/radius |
| Page transition | In: `.55s/.65s cubic-bezier(.22,.7,.2,1)`. Out: 400ms then navigate |
| Work row hover | Preview card follows pointer with easing; per-project image + copy |
| Workflow step hover | Swaps detail panel content; highlights that step's tools |
| Experience row hover (About) | Expands detail; 45° arrow affordance |
| Marquee | 26s (footer), 82s/72s (gallery rows, opposite directions), linear infinite |
| Chapter readout | Last `[data-sec]` whose top is above 45% of viewport height |
| Progress bar | `scrollY / (scrollHeight - innerHeight)`, `.15s linear` |
| Reduced motion | Disables gradient drift, grain animation, cursor lerp, page transitions, smooth scroll |

---

## Responsive

Breakpoints: **900px**, **760px**, **520px** (case studies also use 640px).

Rules that matter:
- **No fixed-pixel grid floors.** Every `minmax()` is `minmax(min(Npx, 100%), 1fr)` — a bare `minmax(300px, 1fr)` overflows any viewport narrower than 300px. This was a recurring bug; keep the pattern.
- **Chip row** — `[data-chiprow]` takes `width: 100%; max-width: 100%; align-self: stretch` at ≤760px so its width resolves against the hero content box rather than `max-content`. That is what lets `flex: 0 1 auto; min-width: 0` on the chips actually shrink. At ≤760px: 38px tall, 8.5px type, 11px padding. At ≤520px: 34px tall, 7.5px type, 7px padding, 4px gap, `0.04em` tracking. **Never let them stack** — they are one row at every width.
- **Hero** — `min-height: 100svh` (note `svh`, not `vh`, for mobile browser chrome). At ≤520px the headline scales on `10.4vw` to a 13ch measure; support line 15px/30ch; side padding 20px.
- **Nav** — at ≤900px the shell becomes `width: max-content` and left-aligned before condensing.
- **Case-study rows** — `[data-row]` grids collapse to one column at ≤640px and hide their arrow columns.
- **Gallery** — at ≤520px tiles drop to `clamp(116px, 34vw, 150px)` and the tracks speed up (56s/46s) to compensate for the shorter loop.
- Touch targets are never below 44px.

---

## Assets

All in `reference/assets/` (49 files).

| Prefix | Contents |
|---|---|
| `fz-*` | Foodzy — cover, four-phone hero, cafeteria photo, app screens, research artefacts, wireframes |
| `ax-*` | Apex — hero, MacBook preview, profile, wheel detail, configurator frame |
| `pk-*` | Peak Finance Labs — mark, construction, clearspace, reversed, grid, dashboard, cards, cashflow |
| `cc-*` | Curate & Craft Media — four lockups + preview |
| `gd-*` | 17 graphic-design gallery pieces, pre-cropped to 4:5 at 640×800 |
| `nk-portrait.jpg` | Portrait for About |

All are the client's own work, cropped from source boards. Tool icons load at runtime from `cdn.simpleicons.org`.

---

## External Links

- Resume: `https://drive.google.com/file/d/1J40op6vvfJNqpqjZOAl_rQUZBgSb73mV/view?usp=sharing`
- Behance: `https://www.behance.net/sainikhilkartikeya`
- LinkedIn: `https://www.linkedin.com/in/nikhil-kartikeya-kalimahanthi`
- Email: `nikhilkalimahanthi@gmail.com`

---

## Files

```
reference/
  Home.dc.html
  About.dc.html
  Contact.dc.html
  404.dc.html
  Case-Foodzy.dc.html
  Case-Apex.dc.html
  Case-Peak-Finance-Labs.dc.html
  Case-Curate-And-Craft.dc.html
  support.js          ← runtime wrapper, ignore
  assets/             ← 49 images
```

---

## Notes for the Implementer

1. **Copy is final.** All body copy, case-study writing and project descriptions are the client's. Do not rewrite.
2. **Three.js is optional.** Earlier iterations used a WebGL hero; it was removed in favour of the CSS gradient field, which performs better and matches the aesthetic. If you reintroduce three.js, keep the hero as the only WebGL surface and retain a CSS fallback.
3. **Fonts:** Archivo must be the variable font with the `wdth` axis. Anton and Instrument Serif are single-purpose — hero only.
4. **The `.dc.html` wrapper is not part of the design.** Strip `<x-dc>`, `support.js`, `{{ }}` holes and the `DCLogic` class. The logic-class methods are plain JS and translate directly to hooks.
5. **Accessibility:** all text meets 4.5:1 against its ground; the accent `#B3CF3C` on `#0A0A0A` is ~11:1. Preserve these if you retune the palette.
