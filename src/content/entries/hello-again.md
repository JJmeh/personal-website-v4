---
title: "Hello again — this site now has a place to write"
description: "A short note on why this corner of the site exists, and what will end up in it."
date: 2026-10-18
draft: true
cover: ./images/hello-again-cover.png
coverAlt: "A 600 × 400 grey placeholder image from placehold.co"
tags: ["meta", "writing"]
---
<!-- Placeholder entry: replace or delete before launch. Cover is https://placehold.co/600x400 (fetched as PNG so the build can resize it). -->

The site has had a works page and a profile for a while now, but never a place to
write things down. Notes about a build, a screenshot of something that finally
lines up, a small discovery worth keeping — all of it used to disappear into a
notebook or a chat thread.

This is where that goes now.

## What to expect

No schedule, no editorial calendar. Just entries when there is something worth
saying, roughly in these buckets:

- **Build notes** — decisions made while shipping a project, and the trade-offs
  behind them.
- **Small findings** — a browser quirk, a CSS trick, a tool that earned a spot.
- **Work updates** — what changed, what launched, what got thrown away.

Expect the occasional half-finished thought. That is the point of a note.

> Writing something down is the cheapest way to find out whether you actually
> understand it.

## How it works

Entries are plain Markdown files in `src/content/entries/`. Adding a file is all
it takes — the listing, the home page teaser, the RSS feed and the individual
page all pick it up on the next build. No dashboard, no CMS login.

If a draft is not ready, it stays hidden from production builds:

```yaml
---
title: "Something half-finished"
date: 2026-10-18
draft: true
---
```

That is the whole system. See you in the next one.
