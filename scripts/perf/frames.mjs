/**
 * Two things this measures that the rAF harness cannot:
 *
 * 1. The composited layer inventory. A `will-change: transform` on the page
 *    wrapper promotes the *entire* document to one layer; on a GPU-poor or
 *    software-composited machine that is the difference between silk and
 *    stutter, and it never shows up as a dropped rAF frame.
 * 2. Scroll motion with GPU raster disabled (`--disable-gpu`), i.e. what a
 *    machine without hardware acceleration actually does.
 *
 *   node scripts/diag-gpu.mjs http://localhost:4322 / [/works]
 */
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://localhost:4322").replace(/\/$/, "");
const paths = process.argv.slice(3);
if (!paths.length) paths.push("/", "/works");

const measure = async (page, cdp, path) => {
	await page.goto(base + path, { waitUntil: "load" });
	await page.waitForTimeout(2500);
	const travel = await page.evaluate(
		() => document.documentElement.scrollHeight - innerHeight
	);
	await page.evaluate(() => {
		window.__frames = [];
		let last = performance.now();
		const tick = (now) => {
			window.__frames.push(now - last);
			last = now;
			window.__raf = requestAnimationFrame(tick);
		};
		window.__raf = requestAnimationFrame(tick);
	});
	await cdp.send("Input.synthesizeScrollGesture", {
		x: 1000,
		y: 700,
		yDistance: -Math.max(travel, 100),
		speed: 900,
		gestureSourceType: "mouse",
	});
	await page.waitForTimeout(600);
	await cdp.send("Input.synthesizeScrollGesture", {
		x: 1000,
		y: 300,
		yDistance: Math.max(travel, 100),
		speed: 900,
		gestureSourceType: "mouse",
	});
	await page.waitForTimeout(800);
	const frames = await page.evaluate(() => {
		cancelAnimationFrame(window.__raf);
		return window.__frames;
	});
	const sorted = [...frames].sort((a, b) => a - b);
	const q = (p) =>
		sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
	const over = (ms) => frames.filter((f) => f > ms).length;
	return {
		median: q(0.5).toFixed(1),
		p99: q(0.99).toFixed(1),
		max: (sorted.at(-1) ?? 0).toFixed(0),
		"%>16": ((over(16) / frames.length) * 100 || 0).toFixed(1),
		"%>33": ((over(33) / frames.length) * 100 || 0).toFixed(1),
	};
};

for (const gpu of [true, false]) {
	const browser = await chromium.launch({
		channel: "chrome",
		headless: false,
		args: gpu ? [] : ["--disable-gpu", "--disable-gpu-compositing"],
	});
	const rows = [];
	for (const path of paths) {
		const page = await browser.newPage({
			viewport: { width: 1440, height: 900 },
		});
		const cdp = await page.context().newCDPSession(page);
		rows.push({
			path,
			gpu: gpu ? "hardware" : "software",
			...(await measure(page, cdp, path)),
		});
		await page.close();
	}
	console.table(rows);
	await browser.close();
}
