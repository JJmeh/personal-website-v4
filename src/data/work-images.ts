/**
 * Screenshots for the work cards and case-study pages.
 *
 * Files live in `src/assets/works/` and are named `<slug>-<kind>` —
 * `ata-aluminum-hero.jpg`, `daoke-hero.png`. `kind` is `hero` (the card
 * thumbnail and page header) or `mid` / `foot` (the page gallery). JPG, PNG and
 * WebP all work; Astro re-encodes whatever is there.
 *
 * The four live client sites are captured in one pass by
 * `node scripts/capture-work-screenshots.mjs`; a screenshot of a private build
 * is dropped in by hand under the same name.
 *
 * Everything in the folder is picked up at build time, so adding a shot for a
 * new work needs no code change — only the file. Works with no screenshot at
 * all fall back to the poster tile from `works.ts`.
 */
import type { ImageMetadata } from "astro";
import type { WorkSlug } from "./works";

type ShotKind = "hero" | "mid" | "foot";

/** Caption per shot, shared by every work so the gallery reads consistently. */
const shotLabels: Record<ShotKind, string> = {
	hero: "Above the fold",
	mid: "Page content",
	foot: "Lower page",
};

/** Gallery order; `hero` is the page header image, not part of the gallery. */
const galleryKinds: ShotKind[] = ["mid", "foot"];

interface WorkGalleryShot {
	src: ImageMetadata;
	label: string;
}

export interface WorkShots {
	/** Header/thumbnail image, when the work has been captured. */
	hero?: ImageMetadata;
	/** Below-the-fold shots, in reading order. */
	gallery: WorkGalleryShot[];
}

const shotModules = import.meta.glob<{ default: ImageMetadata }>(
	"../assets/works/*.{jpg,jpeg,png,webp}",
	{ eager: true }
);

const isShotKind = (value: string): value is ShotKind =>
	Object.hasOwn(shotLabels, value);

/**
 * `../assets/works/ata-aluminum-mid.jpg` → slug `ata-aluminum`, kind `mid`.
 * Split on the *last* hyphen, because slugs contain hyphens too.
 */
const parseShotPath = (
	path: string
): { slug: string; kind: ShotKind } | null => {
	const file = path
		.slice(path.lastIndexOf("/") + 1)
		.replace(/\.(jpe?g|png|webp)$/i, "");
	const separator = file.lastIndexOf("-");
	if (separator === -1) return null;

	const kind = file.slice(separator + 1);
	if (!isShotKind(kind)) return null;

	return { slug: file.slice(0, separator), kind };
};

const shotsBySlug = new Map<string, Partial<Record<ShotKind, ImageMetadata>>>();

for (const [path, module] of Object.entries(shotModules)) {
	const parsed = parseShotPath(path);
	if (!parsed) continue;

	const existing = shotsBySlug.get(parsed.slug) ?? {};
	existing[parsed.kind] = module.default;
	shotsBySlug.set(parsed.slug, existing);
}

export const getWorkShots = (slug: WorkSlug): WorkShots => {
	const shots = shotsBySlug.get(slug);

	return {
		hero: shots?.hero,
		gallery: galleryKinds.flatMap((kind) => {
			const src = shots?.[kind];
			return src ? [{ src, label: shotLabels[kind] }] : [];
		}),
	};
};
