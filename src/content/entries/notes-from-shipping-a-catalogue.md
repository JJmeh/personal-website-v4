---
title: "Notes from shipping a catalogue site"
description: "Three things that came up while building a furniture catalogue, and how each one was solved."
date: 2026-09-21
draft: true
tags: ["build notes", "catalogue", "performance"]
---
<!-- Placeholder entry: replace or delete before launch. -->

A catalogue is a deceptively hard shape of project: dozens of product images,
filters that have to agree with each other, and a client who will add items for
years after launch. These are the parts that took the most thought.

## 1. Images are the whole performance budget

A single product photo straight off a camera can be 6–8 MB. Nine of those on one
page is a site that does not load on a train.

- Serve a modern format, sized for the slot it lands in.
- Keep a tiny inline placeholder so nothing jumps while the real image arrives.
- Never ship the original to the browser, whatever the design calls for.

The rule that made this manageable: **every image on the site has exactly one
source, and the build does the resizing.** Hand-optimised copies always drift.

## 2. Filters need one source of truth

Filters are the first feature to rot, because the catalog and the filter buttons
are usually maintained in two different places. When they disagree, the result is
a filter that silently returns an empty grid.

Keeping the facets derived from the items themselves means a new category shows
up as a new button automatically — and a category with nothing in it never
appears at all.

## 3. Content editing should not need a developer

If adding a product requires a deploy and a code edit, the catalogue will stop
growing. Either the client can add items themselves, or the maintenance cost sits
with whoever built the site — forever.

> The handover is part of the build, not a favour after it.

## What I would do differently

Two things: write the image pipeline before the first template, and get real
product data (not placeholders) into the layout on day one. Both would have saved
a week of re-flowing pages after the fact.
