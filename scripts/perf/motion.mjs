/**
 * Does the content move with the scroll, or towards it?
 *
 * Whatever mechanism drives the page (native scrolling, a JS smoother, a
 * scroll-linked animation), the reader-visible question is the same: on each
 * frame, how far did the content actually move, and how far behind the scroll
 * offset is it?
 *
 * - Native scroll: `gap` stays ~0 and every frame moves by the same amount.
 * - JS smoothing: `gap` grows while the wheel turns and `settleMs` is the tail
 *   after the input stops — that tail is the "lag" a reader feels.
 *
 *   node scripts/diag-motion.mjs http://localhost:4322 /
 */
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://localhost:4322").replace(/\/$/, "");
const path = process.argv[3] ?? "/";

const browser = await chromium.launch({ channel: "chrome", headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await page.goto(base + path, { waitUntil: "load" });
await page.waitForTimeout(2500);

await page.evaluate(() => {
	/** Re-queried every frame: a dev-server hot reload detaches any cached node. */
	const markerFor = () => document.querySelector("main h1, main h2");
	window.__m = [];
	let lastTop = null;
	let lastT = performance.now();
	const tick = (now) => {
		const marker = markerFor();
		if (!marker) {
			requestAnimationFrame(tick);
			return;
		}
		const top = marker.getBoundingClientRect().top;
		const scroll = window.scrollY;
		window.__m.push({
			dt: now - lastT,
			top,
			documentTop: top + scroll,
			moved: lastTop === null ? 0 : lastTop - top,
			scroll,
		});
		lastTop = top;
		lastT = now;
		window.__raf = requestAnimationFrame(tick);
	};
	window.__raf = requestAnimationFrame(tick);
});

await cdp.send("Input.synthesizeScrollGesture", {
	x: 1000,
	y: 700,
	yDistance: -1200,
	speed: 600,
	gestureSourceType: "mouse",
});
await page.waitForTimeout(1400);

const m = await page.evaluate(() => {
	cancelAnimationFrame(window.__raf);
	return window.__m;
});

const start = Math.floor(m.length * 0.3);
const slice = m.slice(start, start + 24);

console.log(`\n${path} — per-frame content motion (gesture 600 px/s)\n`);
console.log("  t(ms)    dt   scrollY   moved    gap");
let t = 0;
for (const f of slice) {
	t += f.dt;
	console.log(
		`${t.toFixed(0).padStart(7)} ${f.dt.toFixed(1).padStart(5)} ${f.scroll.toFixed(0).padStart(8)} ${f.moved.toFixed(2).padStart(8)}`
	);
}

const moving = m.filter((f) => f.moved > 0.01);
const moved = moving.map((f) => f.moved);
const avg = moved.reduce((a, b) => a + b, 0) / moved.length;
const sd = Math.sqrt(
	moved.reduce((a, b) => a + (b - avg) ** 2, 0) / moved.length
);

console.log(`\nmoving frames        ${moving.length} / ${m.length}`);
console.log(`mean movement/frame  ${avg.toFixed(2)} px`);
console.log(`std dev              ${sd.toFixed(2)} px`);
console.log(`max movement/frame   ${Math.max(...moved).toFixed(1)} px`);
console.log(
	`idle frames          ${m.filter((f) => Math.abs(f.moved) < 0.05).length}`
);
/**
 * With native scrolling the marker's document offset (`rect.top + scrollY`)
 * never changes; anything else means the rendered offset is chasing the real
 * one, which is exactly what input lag is.
 */
const offsets = m.map((f) => f.documentTop);
console.log(
	`document offset drift ${(Math.max(...offsets) - Math.min(...offsets)).toFixed(1)} px`
);

await browser.close();
