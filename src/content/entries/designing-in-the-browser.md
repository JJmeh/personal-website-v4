---
title: "Designing in the browser beats designing in a canvas"
description: "Why most of my layout decisions happen after the first build, not before it."
date: 2026-10-04
draft: true
tags: ["process", "frontend", "css"]
---
<!-- Placeholder entry: replace or delete before launch. -->

A static canvas is a guess about how type, spacing and density will feel once
they are real. The browser answers that guess immediately — and it is usually
wrong in ways I would not have predicted.

## The loop that works for me

1. Rough the structure out in markup first, with real copy in place.
2. Open it at three widths before touching colour.
3. Fix the things that break, not the things that merely look plain.
4. Only then add motion, texture and detail.

The step people skip is number two. A layout that survives a narrow viewport is
almost always a layout that survives everything else.

## Things a canvas cannot show

- **Line breaks with real content.** Placeholder text is suspiciously well
  behaved. Real sentences wrap into orphans and widows on their own schedule.
- **Rhythm across sections.** Vertical spacing only reads correctly as a whole
  page, not as one artboard.
- **Interaction states.** Hover, focus and the moment before an image loads are
  part of the design, not cleanup afterwards.

## The trade-off

Working this way means the first hour produces something ugly, and that is
uncomfortable when someone is watching. The compensation is that decisions are
made against the thing that ships.

> The fastest way to make a layout decision is to look at the layout.

A small example of the kind of thing that only shows up in a real build — the
line that finally made a sticky header behave:

```css
header {
	position: sticky;
	top: 0;
	z-index: 1;
	isolation: isolate;
}
```

Nothing clever. Just three lines that are obvious the moment you can scroll the
page, and invisible on a canvas.

## Screenshots belong in the post

A build note is twice as useful with the screen it is talking about. Images sit
next to the Markdown file and are referenced with a relative path — no upload,
no CDN, no `/public` copy to keep in sync:

![The same page at 1440px, with the grid of cards settling into two columns](./images/designing-in-the-browser-screenshot.png)

*Fig. 1 — a wide screenshot; the build resizes it for every breakpoint.*

That file is a 1200 × 675 placeholder, but the mechanics are the real ones. At
build time the file is converted to WebP at five widths (640 → 1200) and served
through a `srcset`, given intrinsic `width`/`height` so the paragraph below it
does not jump while loading, and lazy-loaded when it sits below the fold.

The italic line directly under an image is treated as its caption, so keep alt
text for screen readers and the caption for the reader who wants the extra
detail.
