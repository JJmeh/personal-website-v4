/**
 * Composited-layer inventory.
 *
 * The interesting question is not how many layers a page has but how many
 * *pixels* it wants rastered: a document-sized layer has to be rastered whole,
 * and GPU memory is finite, so on a weaker machine Chrome starts re-rastering
 * tiles mid-scroll and the page stutters even though rAF never misses a beat.
 *
 *   node scripts/diag-layers.mjs http://localhost:4322 / [/works]
 */
import { chromium } from "@playwright/test";

const base = (process.argv[2] ?? "http://localhost:4322").replace(/\/$/, "");
const paths = process.argv.slice(3);
if (!paths.length) paths.push("/");

const browser = await chromium.launch({ channel: "chrome", headless: false });

for (const path of paths) {
	const page = await browser.newPage({
		viewport: { width: 1440, height: 900 },
	});
	const cdp = await page.context().newCDPSession(page);
	await page.goto(base + path, { waitUntil: "load" });
	await page.waitForTimeout(2500);

	const layers = new Map();
	cdp.on("LayerTree.layerTreeDidChange", (e) => {
		for (const l of e.layers ?? []) layers.set(l.layerId, l);
	});
	await cdp.send("LayerTree.enable");
	/* The tree is reported on the next composite, so make one happen. */
	await page.mouse.wheel(0, 60);
	await page.waitForTimeout(1000);

	const rows = [...layers.values()]
		.filter((l) => l.drawsContent)
		.map((l) => ({
			id: l.layerId,
			cssW: Math.round(l.width / 2),
			cssH: Math.round(l.height / 2),
			mp: +((l.width * l.height) / 1e6).toFixed(2),
			mb: +((l.width * l.height * 4) / 1024 / 1024).toFixed(1),
		}))
		.sort((a, b) => b.mp - a.mp);

	const totalMb = rows.reduce((n, r) => n + r.mb, 0);
	console.log(
		`\n${path} — ${rows.length} drawing layers, ~${totalMb.toFixed(0)} MB of raster surfaces`
	);
	console.table(rows.slice(0, 8));
	await page.close();
}

await browser.close();
