/**
 * Single source of truth for the work catalogue.
 *
 * Every entry is transcribed from the live jeremiahjason.com works section
 * (name, discipline, stack, one-line description, outbound URL) so the
 * index page and /works can never drift apart — they both read from here.
 *
 * Facets (`kind`, `stack`) drive the /works filter pills, so adding a
 * new stack value automatically adds a new filter button.
 */
import { ALL_FILTER } from "./facets";

export type WorkKind = "Website" | "Web App";

/**
 * Every work that has a page at `/works/<slug>/`.
 *
 * A closed union on purpose: `src/data/work-cases.ts` keys its case studies by
 * this type, so adding a work here fails the build until it has copy.
 */
export type WorkSlug =
	| "ata-aluminum"
	| "karlivahome"
	| "daoke"
	| "purest-coldpress"
	| "skalatama";

export interface WorkPoster {
	/** Background token for the placeholder poster until a screenshot exists. */
	tone: "accent" | "dark" | "highlight" | "frame";
	/** Short mark rendered large in the poster, e.g. "ATA". */
	monogram: string;
}

export interface Work {
	/** URL segment for the detail page at `/works/<slug>/`. */
	slug: WorkSlug;
	name: string;
	/** Human-readable discipline shown under the project name. */
	type: string;
	/** One-line description, kept close to the live site wording. */
	description: string;
	kind: WorkKind;
	stack: string[];
	/** Live URL. Missing for private/client work with no public build. */
	url?: string;
	/** Shown on the home page. */
	featured?: boolean;
	poster: WorkPoster;
}

export const works: Work[] = [
	{
		slug: "ata-aluminum",
		name: "ATA Aluminum",
		type: "Landing page",
		description:
			"Company profile landing page to present every service and use case on offer.",
		kind: "Website",
		stack: ["Wix", "Frontend"],
		url: "https://www.ata-alu.com",
		featured: true,
		poster: { tone: "accent", monogram: "ATA" },
	},
	{
		slug: "karlivahome",
		name: "KarlivaHome",
		type: "Landing page & catalogue",
		description:
			"Company profile and product catalogue for a furniture manufacturer.",
		kind: "Website",
		stack: ["Catalogue", "Frontend"],
		url: "https://karlivahome.com/",
		featured: true,
		poster: { tone: "dark", monogram: "KH" },
	},
	{
		slug: "daoke",
		name: "Daoke",
		type: "Web app",
		description:
			"Custom inventory system and business process management application.",
		kind: "Web App",
		stack: ["Fullstack"],
		poster: { tone: "highlight", monogram: "D" },
	},
	{
		slug: "purest-coldpress",
		name: "Purest Coldpress",
		type: "Landing page & catalogue",
		description: "Landing page and product catalogue for a juice business.",
		kind: "Website",
		stack: ["Catalogue", "Frontend"],
		url: "https://purestcoldpress.com/",
		featured: true,
		poster: { tone: "frame", monogram: "PC" },
	},
	{
		slug: "skalatama",
		name: "Skalatama",
		type: "Portfolio",
		description:
			"Portfolio site for a consulting agency focused on scaling businesses up.",
		kind: "Website",
		stack: ["Frontend"],
		url: "https://skalatama.com/",
		featured: true,
		poster: { tone: "accent", monogram: "S" },
	},
];

/** `[ WEBSITE · WIX · FRONTEND ]`. */
export const formatWorkTag = (work: Work): string =>
	[work.kind, ...work.stack].map((token) => token.toUpperCase()).join(" · ");

/** Every uppercase token a work can be filtered by. */
export const getWorkFacets = (work: Work): string[] =>
	[work.kind, ...work.stack].map((token) => token.toUpperCase());

/**
 * Filter pills, in a stable reading order: discipline → stack.
 * Deduped, so two works sharing a stack value only produce one pill.
 */
export const getWorkFilters = (list: Work[] = works): string[] => {
	const kinds = new Set<string>();
	const stacks = new Set<string>();

	for (const work of list) {
		kinds.add(work.kind.toUpperCase());
		for (const item of work.stack) stacks.add(item.toUpperCase());
	}

	return [ALL_FILTER, ...[...kinds].sort(), ...[...stacks].sort()];
};

export const featuredWorks = works.filter((work) => work.featured);

export const getWorkBySlug = (slug: WorkSlug): Work | undefined =>
	works.find((work) => work.slug === slug);

/**
 * The works to offer at the foot of a case study: the next two in the
 * catalogue (wrapping around), so every page ends with somewhere to go and
 * never links back to itself.
 */
export const getRelatedWorks = (slug: WorkSlug, limit = 2): Work[] => {
	const index = works.findIndex((work) => work.slug === slug);
	if (index === -1) return works.slice(0, limit);

	return Array.from(
		{ length: Math.min(limit, works.length - 1) },
		(_, offset) => works[(index + offset + 1) % works.length]
	);
};
