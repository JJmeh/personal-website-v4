# jeremiahjason.com

Personal site: Astro (static output) + Tailwind v4 + GSAP.

```sh
npm install
npm run dev        # http://localhost:4321
```

## Scripts

| Command         | What it does                                                    |
| --------------- | --------------------------------------------------------------- |
| `npm run dev`   | Dev server (use `npx astro dev --background` in agent sessions)  |
| `npm run build` | Static build to `dist/`                                          |
| `npm run preview` | Serve the built output locally                                 |
| `npm run check` | `astro check` — TypeScript + Astro template diagnostics          |
| `npm run lint`  | Biome lint **and** format check (CI runs this)                   |
| `npm run format`| Biome autofix + reformat                                         |
| `npm test`      | Playwright smoke tests (`tests/smoke.spec.ts`)                   |
|                 | needs two servers: prod preview (4399) + `astro dev` (4400)      |
| `npm run og`    | Regenerate `public/og.png` from `scripts/generate-og.mjs`        |
| `npm run shots` | Re-capture the work screenshots from the live client sites       |

CI (`.github/workflows/build.yaml`) runs check → lint → tests → build, then pushes
`dist/` to the `build` branch, which GitHub Pages serves.

## Structure

```
src/
  content.config.ts      # `entries` collection schema (zod)
  content/entries/       # one Markdown file per entry
    images/              # every entry image (covers + inline screenshots)
  data/
    works.ts             # work catalogue — the single source for / and /works
    work-cases.ts        # case-study copy for /works/<slug> (problem, solution, …)
    work-images.ts       # screenshot lookup for the cards and case pages
    site.ts              # name, socials, contact, JSON-LD
    entries.ts           # collection helpers (publish filter, date formatting)
  assets/works/          # screenshots (<slug>-hero|mid|foot.{jpg,png,webp})
  components/            # Button, Breadcrumb, PageHero, WorkCard, EntryCard, CardFiller, ...
  layouts/BaseLayout.astro # shell: nav, footer, fonts, SEO
  pages/                 # /, /works, /works/[slug], /profile, /entries, /entries/[id], /404, /rss.xml
  scripts/works-filter.ts  # /works client-side filtering
  styles/global.css      # design tokens (@theme) + base layer
```

### Adding a work

Edit `src/data/works.ts` and append to `works`. Fields: `slug`, `name`, `type`
(display label), `description`, `kind` (`Website` | `Web App`), `stack[]`, `url`
(optional — omit for private work so the case page says so instead of linking
nowhere), `featured` (shows on the home page) and `poster` (placeholder tone +
monogram). Filter pills are derived from `kind` + `stack`, so no page edits are
needed.

Two things then have to follow the new entry:

1. **`src/data/work-cases.ts`** — add the key to `workCases`. It is typed
   `Record<WorkSlug, WorkCaseStudy>`, so the build fails until the copy exists:
   `summary`, `role`, `problem[]`, `solution[]`, `scope[]`, `outcomes[]` and
   optional `notes[]`.
2. **A screenshot** — `npm run shots` captures every work with a public `url`
   (override with `npm run shots -- <slug>`) into
   `src/assets/works/<slug>-hero|mid|foot.jpg` — or drop a screenshot of a
   private build in by hand under the same name (`.png`/`.webp` fine). Works
   without one fall back to the generated poster tile.

Screenshots are picked up by `src/data/work-images.ts` from the folder, so
dropping a file in is enough — no import list to update.

### Publishing an entry

Add `src/content/entries/my-post.md`:

```md
---
title: Hello
description: Optional summary used by the RSS feed and meta description.
date: 2026-10-18
tags: [astro]
---

Body goes here.
```

It then appears on `/entries`, in the home page teaser, at `/entries/my-post/`
and in `/rss.xml`. `draft: true` hides it from production builds.

A single entry ends with three other entries to read (nearest first, never
itself) plus a breadcrumb trail back through `/entries`. Both come from
`getLatestEntries` in `src/data/entries.ts` and the shared `EntryCard` /
`CardFiller` components, so the grid looks identical to `/entries`.

The four files currently in `src/content/entries/` are **placeholder samples**
that exist so every surface has real content to render — all four are
`draft: true`, so they show up in `astro dev` but never in a production build
(no pages, no RSS items, and `/entries` keeps its empty state). Replace or
delete them before launch, and drop the `draft` flag on whatever stays.

Markdown bodies are styled by `.entry-body` in `src/styles/global.css` — the
typography plugin is not installed, so keep new markup to the tags handled
there.

`hello-again.md` also carries a sample cover
(`images/hello-again-cover.png`, the 600 × 400 placeholder from placehold.co,
saved locally as PNG so the build can resize it). Image paths are resolved
relative to the Markdown file, so they point into `images/`.

### Images inside an entry

Two different jobs, two different fields — `cover` is the card/preview image, an
image in the body is a screenshot the post actually talks about.

Both live in **`src/content/entries/images/`**: one folder for all entry images
keeps the entry folder readable (Markdown only) while staying inside the content
collection, which is what lets the image pipeline resolve the paths. Name the
files after their entry (`hello-again-cover.png`,
`designing-in-the-browser-screenshot.png`) so the owner is obvious.

Reference them from the Markdown with a **relative** path — the `./` is what
tells the pipeline to process the file:

```yaml
cover: ./images/my-post-cover.png
```

```md
![The dashboard after the rebuild](./images/my-post-dashboard.png)

*Fig. 1 — the same view at 1440px.*
```

What the build does with it:

- converts to WebP and emits five widths (640 → 1200) behind a `srcset`,
- adds intrinsic `width`/`height` so nothing shifts while it loads,
- `loading="lazy"` for anything below the fold,
- hashes the filename under `/_astro/` (safe to cache forever),
- applies `.entry-body img` (rounded corners) and the caption styling.

**Captions:** an italic line directly under the image is treated as its caption
and rendered as small uppercase mono text. A real `<figure>` cannot wrap a
Markdown image — raw HTML is not parsed as Markdown, and only Markdown images
get optimised — so the italic line is the pattern that survives the pipeline.

**Screenshots do not need a size limit**, but crop them to the content (no
browser chrome) and give every image meaningful `alt` text — that is what is
read when the image itself is not.

The responsive widths come from `image: { layout: "constrained",
responsiveStyles: true }` in `astro.config.mjs`, which applies to Markdown images
and to every `<Image>` component that does not set its own layout.

Remote URLs (`https://…`) are left alone by the pipeline: fine for a quick
example, not for production, since nothing is resized or cached locally.

## Design tokens

Defined in `src/styles/global.css` under `@theme`:

| Token                     | Value     | Notes                                        |
| ------------------------- | --------- | -------------------------------------------- |
| `--color-light`           | `#E8EBEF` | Page/card surface                            |
| `--color-dark`            | `#0b0b0b` | Body text                                    |
| `--color-accent`          | `#1c3563` | Brand blue — links, buttons, background      |
| `--color-highlight`       | `#FF7A1A` | Decorative only (~2.6:1 on light)            |
| `--color-highlight-ink`   | `#8F4200` | The orange when used **as text** (AA)        |
| `--color-frame`           | `#C9D2E6` | Poster/edge tone                             |

Fonts: Helvetica Neue (self-hosted, 400/500/600/700 — see `astro.config.mjs`,
600 reuses the Bold cut because the family has no true semibold) and Azeret Mono
(Fontsource). Only the weights in use are registered and preloaded.

## Accessibility notes

- Mobile menu is a disclosure: `aria-expanded` + `aria-controls` on the toggle,
  `inert` + `aria-hidden` on the panel, focus moves in and returns on close,
  Tab wraps inside the panel, Escape closes.
- Animations respect `prefers-reduced-motion` (scroll-driven reveals are
  skipped, the menu opens instantly, decorative spinners stop).
- Every page has a canonical URL, `og:image` (`public/og.png`) and a `Person`
  JSON-LD node.

## Scrolling

The page scrolls natively — one scrolling document, no JS in the scroll path.

It used to run GSAP's ScrollSmoother on fine pointers, which fixes the wrapper
and eases the content towards the scroll offset on the main thread. Measured on
the home page (1440x900, DPR 2) it cost more than it bought:

| | ScrollSmoother | native |
| --- | --- | --- |
| content offset vs `scrollY` | trails by up to a wheel step, ~580 ms to settle | identical, every frame |
| document-sized raster surfaces | 2 (~148 MB) | 1 (~95 MB total) |
| home scroll, GPU raster disabled | 53 % of frames over 16 ms, median 16.6 ms | 13–27 %, median 8.3 ms |

Nothing depended on it either: it was created with `effects: false` and no page
pins anything, so the only thing it did was smooth the wheel. Scroll-driven
reveals on `/profile` still work — `ScrollTrigger` observes native scroll on its
own.

`scripts/perf/` keeps the instruments this was measured with (real Chrome, real
GPU — headless Chromium runs SwiftShader and cannot see any of it):

```bash
npx astro preview --port 4400
node scripts/perf/motion.mjs http://localhost:4400 /    # input lag, per frame
node scripts/perf/layers.mjs http://localhost:4400 /    # raster-surface budget
node scripts/perf/frames.mjs http://localhost:4400 /    # frame timing, GPU on/off
```
