import { expect, test } from "@playwright/test";

/**
 * Two servers back the suite:
 *
 * - the production **preview** (what ships) for every page-level check, and
 * - `astro dev`, where `draft: true` entries are still visible, for the entry
 *   tests — every sample entry is a draft, so the preview has none.
 */
const DEV_BASE_URL = "http://localhost:4400";

const pages = [
	{ path: "/", title: "Jeremiah Jason" },
	{ path: "/works", title: "Works | Jeremiah Jason" },
	{
		path: "/works/karlivahome/",
		title: "KarlivaHome — Landing page & catalogue | Jeremiah Jason",
	},
	{ path: "/profile", title: "Profile | Jeremiah Jason" },
	{ path: "/entries", title: "Entries | Jeremiah Jason" },
];

for (const { path, title } of pages) {
	test(`${path} renders without console errors`, async ({ page }) => {
		const errors: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		page.on("pageerror", (error) => errors.push(error.message));

		const response = await page.goto(path, { waitUntil: "networkidle" });

		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(title);
		expect(errors).toEqual([]);
	});
}

test("unknown routes land on the 404 page", async ({ page }) => {
	await page.goto("/this-page-does-not-exist", { waitUntil: "networkidle" });

	await expect(page.getByRole("heading", { level: 1 })).toContainText("404");
});

test("home page features the real catalogue", async ({ page }) => {
	await page.goto("/", { waitUntil: "networkidle" });

	for (const name of [
		"ATA Aluminum",
		"KarlivaHome",
		"Purest Coldpress",
		"Skalatama",
	]) {
		await expect(page.getByRole("heading", { name })).toBeVisible();
	}
	// Daoke has no public URL, so it is not featured on the home page.
	await expect(page.getByRole("heading", { name: "Daoke" })).toHaveCount(0);
});

test("all five works are listed, and each one opens its case study", async ({
	page,
}) => {
	await page.goto("/works", { waitUntil: "networkidle" });

	const items = page.locator(".work-item");
	await expect(items).toHaveCount(5);

	// Cards link to the case study, never straight off-site: the detail page is
	// where the client URL lives, so the visitor gets the context first.
	await expect(page.getByRole("link", { name: /KarlivaHome/ })).toHaveAttribute(
		"href",
		"/works/karlivahome/"
	);
	await expect(page.getByRole("link", { name: /Daoke/ })).toHaveAttribute(
		"href",
		"/works/daoke/"
	);
	await expect(page.locator('.work-item a[target="_blank"]')).toHaveCount(0);
});

/** Every work in the catalogue must resolve to a case study page. */
const workSlugs = [
	"ata-aluminum",
	"karlivahome",
	"daoke",
	"purest-coldpress",
	"skalatama",
];

for (const slug of workSlugs) {
	test(`/works/${slug} reads as a case study`, async ({ page }) => {
		const response = await page.goto(`/works/${slug}/`, {
			waitUntil: "networkidle",
		});

		expect(response?.status()).toBe(200);
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

		// Problem → solution → scope → outcome, each its own labelled section.
		for (const name of [
			"The problem",
			"What I built",
			"What shipped",
			"Outcome",
		]) {
			await expect(page.getByRole("region", { name })).toBeVisible();
		}

		const trail = page.getByRole("navigation", { name: "Breadcrumb" });
		await expect(trail.getByRole("link", { name: "WORKS" })).toHaveAttribute(
			"href",
			"/works"
		);

		// The page ends with somewhere to go, and never itself.
		const moreWorks = page.getByRole("region", { name: "More Works" });
		await expect(moreWorks).toBeVisible();
		await expect(moreWorks.locator(`a[href="/works/${slug}/"]`)).toHaveCount(0);
	});
}

test("a live work hands off to the client site from its case study", async ({
	page,
}) => {
	await page.goto("/works/skalatama/", { waitUntil: "networkidle" });

	const live = page.getByRole("link", { name: /VISIT LIVE SITE/i });
	await expect(live).toHaveAttribute("href", "https://skalatama.com/");
	await expect(live).toHaveAttribute("target", "_blank");
});

test("a private work says so instead of linking nowhere", async ({ page }) => {
	await page.goto("/works/daoke/", { waitUntil: "networkidle" });

	await expect(page.getByText(/Private build/).first()).toBeVisible();
	await expect(
		page.getByRole("link", { name: /VISIT LIVE SITE/i })
	).toHaveCount(0);
});

/**
 * The panel opens with a `grid-template-rows` transition; until it settles the
 * pills are clipped, so a click can land on the clipping ancestor instead. Wait
 * on the real CSS transition rather than sleeping for a guessed duration.
 */
const settlePanel = (
	page: import("@playwright/test").Page,
	panel = "#categories-panel"
) =>
	page
		.locator(panel)
		.evaluate((element) =>
			Promise.all(
				element.getAnimations().map((animation) => animation.finished)
			).then(() => undefined)
		);

test("category filters narrow the grid and can be reset", async ({ page }) => {
	await page.goto("/works", { waitUntil: "networkidle" });

	const visible = page.locator(".work-item:visible");
	const filter = (name: string) => page.locator(`[data-filter="${name}"]`);

	await page.locator("#categories-toggle").click();
	await expect(page.locator("#categories-toggle")).toHaveAttribute(
		"aria-expanded",
		"true"
	);
	await settlePanel(page);

	// "WEB APP" contains a space, which used to break the facet lookup.
	await filter("WEB APP").click();
	await expect(visible).toHaveCount(1);
	await expect(filter("WEB APP")).toHaveAttribute("aria-pressed", "true");

	await filter("CATALOGUE").click();
	await expect(visible).toHaveCount(2);

	await filter("ALL").click();
	await expect(visible).toHaveCount(5);
});

test("mobile menu is a real disclosure with focus management", async ({
	page,
	isMobile,
}) => {
	test.skip(!isMobile, "mobile-only markup");

	await page.goto("/works", { waitUntil: "networkidle" });

	const toggle = page.locator("#menu-open");
	const panel = page.locator("#menu-container");

	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(panel).toHaveAttribute("aria-hidden", "true");

	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	await expect(panel).toHaveAttribute("aria-hidden", "false");
	// Focus moves into the panel so keyboard users are not stranded.
	await expect(page.locator("#menu-close")).toBeFocused();

	await page.keyboard.press("Escape");
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(toggle).toBeFocused();
});

test("the page scrolls natively, with no smoothing layer in between", async ({
	page,
}) => {
	await page.goto("/works/karlivahome/", { waitUntil: "networkidle" });

	/**
	 * The page used to be handed to GSAP's ScrollSmoother on fine pointers, which
	 * fixed the wrapper and eased the content towards the scroll position on the
	 * main thread. Two things regressed whenever it came back: the content no
	 * longer moves 1:1 with the scroll (input lag), and Chrome allocates a second
	 * document-sized raster surface for the promoted content.
	 *
	 * So the guarantee is exact: scrolling by N pixels moves the content by
	 * exactly N pixels, immediately.
	 */
	await expect(page.locator("#smooth-wrapper")).toHaveCount(0);

	/**
	 * The check that actually distinguishes the two: after a native scroll, layout
	 * geometry is already in its new place in the same task. A smoother applies
	 * its transform on a later frame, so the element would still report the old
	 * position here.
	 */
	const delta = await page.evaluate(() => {
		const el = document.querySelector("main h1");
		if (!el) return null;
		const before = el.getBoundingClientRect().top;
		window.scrollTo(0, 400);
		return {
			moved: before - el.getBoundingClientRect().top,
			scroll: window.scrollY,
		};
	});

	expect(delta).not.toBeNull();
	expect(delta?.scroll).toBe(400);
	expect(delta?.moved).toBeCloseTo(400, 0);
});

test("the feature panel runs its motion on the compositor", async ({
	page,
}) => {
	await page.goto("/", { waitUntil: "networkidle" });

	/**
	 * The panel is the fixed left column on desktop and the mobile hero on
	 * phones, so only the instance that has a box is under test — the other copy
	 * is `display: none` and never starts its loop.
	 *
	 * Same rule as the scroll cue above: only the HTML box of the SVG may
	 * animate. A transform animation on the ring's `<text>`/`<textPath>` is
	 * applied during SVG layout and repaints the document every frame.
	 */
	await expect(page.locator("[data-feature-panel]:visible")).toHaveCount(1);

	const motion = await page.evaluate(() => {
		// Both copies exist in the DOM; only one of them has a box on this
		// breakpoint, and that is the one whose script has run.
		const panel = [...document.querySelectorAll("[data-feature-panel]")].find(
			(node) => node.getBoundingClientRect().width > 0
		);
		if (!panel) return null;

		const ring = panel.querySelector(".dial-type");
		const ticks = panel.querySelector(".dial-ticks");
		const text = ring?.querySelector("text") ?? null;
		const canvas = panel.querySelector(
			"[data-feature-canvas]"
		) as HTMLCanvasElement | null;

		return {
			ring: ring ? getComputedStyle(ring).animationName : "missing",
			ticks: ticks ? getComputedStyle(ticks).animationName : "missing",
			text: text ? getComputedStyle(text).animationName : "missing",
			ready: canvas?.dataset.ready ?? "unset",
			backingStore: canvas ? canvas.width * canvas.height : 0,
		};
	});

	expect(motion).not.toBeNull();
	expect(motion?.ring).toBe("dial-spin");
	expect(motion?.ticks).toBe("dial-spin");
	expect(motion?.text).toBe("none");

	// The field only fades in after it has measured its box and painted once.
	expect(motion?.ready).toBe("true");
	// ...and that box stays inside the documented backing-store cap (2.6 MP).
	expect(motion?.backingStore).toBeGreaterThan(0);
	expect(motion?.backingStore).toBeLessThanOrEqual(2_700_000);
});

test("exactly one feature panel is on screen at every breakpoint", async ({
	page,
}) => {
	/**
	 * The layout renders the panel twice — once in the fixed desktop column and
	 * once as the mobile hero on the home page. The two visibility rules have to
	 * meet exactly at `md`, or a tablet shows two dials side by side.
	 */
	for (const width of [390, 900, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/", { waitUntil: "networkidle" });

		const onScreen = await page
			.locator("[data-feature-panel]")
			.evaluateAll(
				(nodes) =>
					nodes.filter((node) => node.getBoundingClientRect().width > 0).length
			);

		expect(onScreen, `at ${width}px`).toBe(1);
	}
});

test("the scroll cue animates a composited box, not SVG text", async ({
	page,
}) => {
	await page.goto("/", { waitUntil: "networkidle" });

	/**
	 * A CSS `transform` animation on an SVG `<text>`/`<textPath>` is applied by
	 * Blink during SVG layout rather than by the compositor, so it invalidates
	 * layout and repaint for the whole document on every frame — which on the
	 * home page means re-laying-out and re-rasterising the whole document 60
	 * times a second while the reader scrolls. Rotate the `<svg>` box instead: it
	 * is an HTML-level box and stays on the compositor.
	 *
	 * Measured with CDP `Performance.getMetrics` during a full-page scroll:
	 * the SVG-text version logged 82 Layouts and 164 Paints, this one 0 and 4.
	 */
	const ring = page.locator(".cue-ring");
	/** The cue is currently commented out of the home hero — see `index.astro`. */
	test.skip((await ring.count()) === 0, "the scroll cue is not mounted");
	await expect(ring).toHaveCount(1);

	const animations = await page.evaluate(() => {
		const root = document.querySelector(".cue-ring");
		if (!root) return null;
		const text = root.querySelector("text");
		return {
			ring: getComputedStyle(root).animationName,
			text: text ? getComputedStyle(text).animationName : "missing",
		};
	});

	expect(animations).not.toBeNull();
	expect(animations?.ring).toBe("rotateRing");
	expect(animations?.text).toBe("none");
});

test("every page advertises a canonical URL and a social card", async ({
	page,
}) => {
	await page.goto("/works", { waitUntil: "networkidle" });

	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		"href",
		"https://jeremiahjason.com/works/"
	);
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
		"content",
		"https://jeremiahjason.com/og.png"
	);
});

/**
 * Entry pages are exercised against `astro dev`, not the production preview:
 * every sample entry is a draft, and drafts are filtered out of production
 * builds on purpose. The dev server keeps them visible, which is exactly the
 * state these tests need to see real entry markup.
 */
test.describe("entries", () => {
	test.use({ baseURL: DEV_BASE_URL });

	/**
	 * Entries are content, not code — the titles will change. This only checks
	 * the wiring: the listing links out, and the linked page renders a body.
	 */
	test("each listed entry opens a readable page", async ({ page }) => {
		await page.goto("/entries", { waitUntil: "networkidle" });

		const links = page.locator('a[href^="/entries/"]');
		const count = await links.count();
		test.skip(count === 0, "no entries in the collection");

		const href = await links.first().getAttribute("href");
		const response = await page.goto(href as string, {
			waitUntil: "networkidle",
		});

		expect(response?.status()).toBe(200);
		await expect(page.locator(".entry-body")).toBeVisible();
	});

	/**
	 * The tag pills are built from the collection itself, so this reads a real
	 * tag off the first card instead of hardcoding one. It also proves the card
	 * prints its tags: the pills and the card text come from the same array.
	 */
	test("cards show their tags and the tag filter narrows the grid", async ({
		page,
	}) => {
		await page.goto("/entries", { waitUntil: "networkidle" });

		const items = page.locator(".entry-item");
		const total = await items.count();
		test.skip(total === 0, "no entries in the collection");

		const firstIndex = await items.evaluateAll((nodes) =>
			nodes.findIndex((node) => (node.getAttribute("data-facets") ?? "") !== "")
		);
		test.skip(firstIndex < 0, "no entry is tagged");

		const firstTagged = items.nth(firstIndex);
		const facets = (await firstTagged.getAttribute("data-facets")) ?? "";
		const tags = facets.split("|").filter(Boolean);

		// Every tag on the card is printed on the card.
		await expect(firstTagged.locator("li")).toHaveText(tags);

		const tag = tags[0] as string;
		const expected = await items.evaluateAll(
			(nodes, needle) =>
				nodes.filter((node) =>
					(node.getAttribute("data-facets") ?? "").split("|").includes(needle)
				).length,
			tag
		);

		const visible = page.locator(".entry-item:visible");
		const filter = (name: string) => page.locator(`[data-filter="${name}"]`);

		await page.locator("#tags-toggle").click();
		await expect(page.locator("#tags-toggle")).toHaveAttribute(
			"aria-expanded",
			"true"
		);
		await settlePanel(page, "#tags-panel");

		await filter(tag).click();
		await expect(filter(tag)).toHaveAttribute("aria-pressed", "true");
		await expect(visible).toHaveCount(expected);
		await expect(page.locator("#entries-empty")).toBeHidden();

		// ALL restores the full grid.
		await filter("ALL").click();
		await expect(visible).toHaveCount(total);
	});

	/**
	 * The foot of an entry carries the way back (breadcrumb trail) and the way
	 * on (three other entries), so a reader is never stranded.
	 */
	test("an entry page ends with a trail back and other entries to read", async ({
		page,
	}) => {
		await page.goto("/entries", { waitUntil: "networkidle" });

		const links = page.locator('a[href^="/entries/"]');
		const total = await links.count();
		test.skip(total === 0, "no entries in the collection");

		const href = (await links.first().getAttribute("href")) as string;
		await page.goto(href, { waitUntil: "networkidle" });

		const trail = page.getByRole("navigation", { name: "Breadcrumb" });
		await expect(trail.getByRole("link", { name: "Home" })).toHaveAttribute(
			"href",
			"/"
		);
		await expect(trail.getByRole("link", { name: "ENTRIES" })).toHaveAttribute(
			"href",
			"/entries"
		);

		const picker = page.getByRole("region", { name: "Latest Entries" });
		// With a single entry there is nothing to offer, so the picker is absent.
		await expect(picker).toHaveCount(total > 1 ? 1 : 0);
		// It never offers the entry currently being read.
		await expect(picker.locator(`a[href="${href}"]`)).toHaveCount(0);
	});
});

test("the sitemap and RSS feed exist", async ({ request }) => {
	expect((await request.get("/sitemap-index.xml")).status()).toBe(200);
	expect((await request.get("/rss.xml")).status()).toBe(200);
});
