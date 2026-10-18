/**
 * Public entries, newest first.
 *
 * Drafts are filtered out of production builds only, so they stay visible
 * while writing locally.
 */
import { type CollectionEntry, getCollection } from "astro:content";
import { ALL_FILTER } from "./facets";

/**
 * Astro logs a "collection does not exist or is empty" warning on every call to
 * `getCollection` for an empty folder. Checking the glob first keeps builds quiet
 * until the first real entry is added (and costs nothing once there is one).
 */
const entryFiles = Object.keys(
	import.meta.glob("../content/entries/**/*.{md,mdx}")
);

export type Entry = CollectionEntry<"entries">;

const byNewest = (a: Entry, b: Entry) =>
	b.data.date.valueOf() - a.data.date.valueOf();

export const getPublishedEntries = async (): Promise<Entry[]> => {
	if (entryFiles.length === 0) return [];

	const entries = await getCollection("entries", ({ data }) =>
		import.meta.env.PROD ? data.draft !== true : true
	);

	return entries.sort(byNewest);
};

/**
 * The newest entries, optionally skipping the one being read.
 *
 * Powers the "latest entries" picker at the bottom of a single entry: three
 * slots, minus the current one, so it never links back to itself.
 */
export const getLatestEntries = async (
	options: { excludeId?: string; limit?: number } = {}
): Promise<Entry[]> => {
	const { excludeId, limit = 3 } = options;
	const entries = await getPublishedEntries();

	return entries.filter((entry) => entry.id !== excludeId).slice(0, limit);
};

/** `2026.10.18` — local date, so it never shifts a day via UTC. */
export const formatEntryDate = (date: Date): string => {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

/**
 * Every tag in the collection becomes a filter pill on `/entries`, so adding a
 * tag to a Markdown file is enough to add a button there.
 *
 * Values keep the author's spelling; duplicates that differ only in case are
 * collapsed onto the first one seen, and the rest are sorted for a stable order.
 */
export const getEntryTagFilters = (list: Entry[]): string[] => {
	const seen = new Map<string, string>();

	for (const entry of list) {
		for (const tag of entry.data.tags) {
			const key = tag.toLowerCase();
			if (!seen.has(key)) seen.set(key, tag);
		}
	}

	return [ALL_FILTER, ...[...seen.values()].sort((a, b) => a.localeCompare(b))];
};

/** `<time datetime>` wants an ISO *local* value, not the UTC `toISOString()`. */
export const toDateTimeAttr = (date: Date): string => {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
