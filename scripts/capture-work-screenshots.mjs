/**
 * Captures the screenshots used by `/works/<slug>` and by the work cards.
 *
 * Run it by hand whenever a client site has had a visible redesign:
 *
 *     node scripts/capture-work-screenshots.mjs
 *     node scripts/capture-work-screenshots.mjs skalatama   # one at a time
 *
 * Output lands in `src/assets/works/` as `<slug>-hero.jpg` (the card
 * thumbnail / page hero) plus `<slug>-mid.jpg` and `<slug>-foot.jpg` for the
 * page gallery. Only works with a public `url` can be captured; a private build
 * (Daoke) gets its screenshot dropped in by hand as `<slug>-hero.png`. Any of
 * jpg/png/webp is accepted — see `src/data/work-images.ts`.
 */
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "src/assets/works");

/** Kept in sync with the `url` fields in `src/data/works.ts`. */
const targets = [
	{ slug: "ata-aluminum", url: "https://www.ata-alu.com" },
	{ slug: "karlivahome", url: "https://karlivahome.com/" },
	{ slug: "purest-coldpress", url: "https://purestcoldpress.com/" },
	{ slug: "skalatama", url: "https://skalatama.com/" },
];

const viewport = { width: 1440, height: 900 };
/** 2× so the hero still looks sharp on a retina card. */
const deviceScaleFactor = 2;

/** Below-the-fold shots, as a fraction of the scrollable height. */
const scrollStops = { "": 0, mid: 0.55, foot: 1 };

/** Cookie/consent walls across the Wix-hosted client sites. */
const dismissLabels = [
	"Accept",
	"Accept all",
	"I agree",
	"Got it",
	"OK",
	"Allow all",
];

const onlySlug = process.argv[2];
const selected = onlySlug
	? targets.filter((target) => target.slug === onlySlug)
	: targets;

if (selected.length === 0) {
	console.error(`Unknown slug: ${onlySlug}`);
	process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();

try {
	for (const { slug, url } of selected) {
		const context = await browser.newContext({
			viewport,
			deviceScaleFactor,
			reducedMotion: "reduce",
		});
		const page = await context.newPage();

		console.log(`→ ${slug} (${url})`);
		// `networkidle` never settles on the Wix-hosted sites (chat widgets and
		// analytics keep polling), so wait for `load` and give the entrance
		// animations a fixed window instead.
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
		await page
			.waitForLoadState("load", { timeout: 30_000 })
			.catch(() => undefined);
		await page.waitForTimeout(4000);

		await dismissOverlays(page);

		const pageHeight = await page.evaluate(
			() => document.documentElement.scrollHeight
		);
		const maxScroll = Math.max(0, pageHeight - viewport.height);

		for (const [suffix, fraction] of Object.entries(scrollStops)) {
			const target = Math.round(maxScroll * fraction);

			await page.evaluate((y) => window.scrollTo(0, y), target);
			await page.waitForTimeout(1600);

			// Writing into an `<img>` that was still lazily loading would freeze
			// the placeholder, so force everything in view to decode first.
			await page.evaluate(async () => {
				const images = Array.from(document.images);

				for (const image of images) {
					image.loading = "eager";
					image.decoding = "sync";
				}
				await Promise.all(
					images.map((image) => image.decode().catch(() => undefined))
				);
			});
			await page.waitForTimeout(600);

			const name = suffix ? `${slug}-${suffix}.jpg` : `${slug}-hero.jpg`;
			const file = resolve(OUT_DIR, name);

			// A fixed-position hero can follow the scroll; re-anchor the viewport
			// to the very top for the hero shot only.
			if (!suffix) await page.evaluate(() => window.scrollTo(0, 0));

			await page.screenshot({
				path: file,
				type: "jpeg",
				quality: 82,
				animations: "disabled",
			});
			console.log(`   saved ${name}`);
		}

		await context.close();
	}
} finally {
	await browser.close();
}

/**
 * Best-effort click-through of the usual consent managers. Failures are
 * expected (most sites have none), so nothing here throws.
 */
async function dismissOverlays(page) {
	for (const label of dismissLabels) {
		const button = page
			.getByRole("button", { name: label, exact: false })
			.first();

		if (await button.isVisible().catch(() => false)) {
			await button.click({ timeout: 2000 }).catch(() => undefined);
			await page.waitForTimeout(800);
			return;
		}
	}
}
