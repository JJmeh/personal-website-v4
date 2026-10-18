/**
 * Regenerates `public/og.png` (1200×630), the social preview card.
 *
 * Run with:  node scripts/generate-og.mjs
 *
 * Uses Playwright's Chromium to screenshot an on-brand HTML canvas, so the card
 * always matches the design tokens without needing a design tool. Re-run it
 * whenever the palette or tagline changes.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const OUT = path.resolve(process.cwd(), "public/og.png");

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #1c3563;
    color: #E8EBEF;
    font-family: Helvetica, "Helvetica Neue", Arial, sans-serif;
    display: flex; flex-direction: column; justify-content: center;
    padding: 88px; position: relative;
  }
  .dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(232,235,239,0.22) 1.5px, transparent 1.5px);
    background-size: 22px 22px;
  }
  .inner { position: relative; }
  h1 {
    font-size: 104px; font-weight: 700; letter-spacing: -0.04em; line-height: 1;
  }
  h1 .dot { color: #FF7A1A; }
  p { margin-top: 28px; font-size: 40px; opacity: 0.82; font-weight: 400; }
  .rule { margin-top: 48px; width: 132px; height: 8px; background: #FF7A1A; }
  .url {
    position: absolute; right: 88px; bottom: 80px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 24px; letter-spacing: 0.16em; text-transform: uppercase;
    opacity: 0.7;
  }
  .mark {
    position: absolute; left: 88px; bottom: 74px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 34px; font-weight: 700; letter-spacing: -0.06em;
  }
  .mark .dot { color: #FF7A1A; }
</style></head>
<body>
  <div class="dots"></div>
  <div class="inner">
    <h1>Jeremiah Jason<span class="dot">.</span></h1>
    <p>Full-Stack Web Developer</p>
    <div class="rule"></div>
  </div>
  <div class="mark">JJ<span class="dot">.</span></div>
  <div class="url">jeremiahjason.com</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1200, height: 630 },
	deviceScaleFactor: 1,
});

await page.setContent(html, { waitUntil: "load" });
await mkdir(path.dirname(OUT), { recursive: true });
await page.screenshot({ path: OUT });
await browser.close();

console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
