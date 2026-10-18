import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Written entries (notes / announcements).
 *
 * Drop a Markdown file into `src/content/entries/` and it appears on
 * `/entries`, in the home page teaser, in the RSS feed and on its own page at
 * `/entries/<filename>/` — no code change needed.
 */
const entries = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/entries" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string().optional(),
			date: z.coerce.date(),
			/** Hidden from the listing and the feed when true in a prod build. */
			draft: z.boolean().default(false),
			cover: image().optional(),
			coverAlt: z.string().optional(),
			tags: z.array(z.string()).default([]),
		}),
});

export const collections = { entries };
