---
title: "Rebuilding the site, part two (still editing this)"
description: "An unfinished draft that only appears in local builds."
date: 2026-10-16
draft: true
tags: ["meta", "draft"]
---
<!-- Placeholder draft: shows how `draft: true` behaves — visible in dev, gone in production. -->

This entry is deliberately marked `draft: true`. It shows up when running
`astro dev`, and is filtered out of `astro build` along with its page and its RSS
item — handy for writing in public without publishing.

## Outline

- What the previous version got wrong
- What got kept, and why
- The parts that are still unfinished
- What shipping actually felt like

## A note on drafts

Because the filter runs in `getPublishedEntries`, a draft disappears everywhere
at once: the listing, the home page teaser, the feed, and its own route. There is
no stale page left behind for search engines to find later.

Finish this before flipping it to `draft: false`.
