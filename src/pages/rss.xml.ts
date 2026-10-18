import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedEntries } from "../data/entries";

export const GET = async (context: APIContext) => {
	const entries = await getPublishedEntries();

	return rss({
		title: "Jeremiah Jason — Entries",
		description: "Notes, announcements and updates from Jeremiah Jason.",
		site: context.site ?? "https://jeremiahjason.com",
		items: entries.map((entry) => ({
			title: entry.data.title,
			description: entry.data.description ?? "",
			pubDate: entry.data.date,
			link: `/entries/${entry.id}/`,
		})),
		customData: "<language>en</language>",
	});
};
