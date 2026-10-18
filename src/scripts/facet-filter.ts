/**
 * Client-side filtering for a grid of cards, driven by `data-facets`.
 *
 * Shared by `/works` (category pills) and `/entries` (tag pills): both pages
 * render the same collapsed-panel disclosure, the same pill styling and the
 * same "hide the cards that do not match" behaviour, so the logic lives here
 * once and each page passes its own selectors.
 *
 * The markup is fully server-rendered: with JS disabled every card and every
 * pill is still visible/readable, the panel is simply always collapsed.
 */
import { ALL_FILTER, FACET_SEPARATOR } from "../data/facets";

const ACTIVE_CLASSES = ["bg-light", "text-accent"];
const IDLE_CLASSES = ["bg-light/10", "text-light", "hover:bg-light/20"];

export interface FacetFilterConfig {
	/** Disclosure button that opens/closes the pill panel. */
	toggle: string;
	/** Collapsible wrapper around the pills. */
	panel: string;
	/** Chevron inside the toggle, rotated while open. */
	chevron?: string;
	/** Grid that holds the cards. */
	grid: string;
	/** Message shown when nothing matches. */
	empty?: string;
	/** Selector for one filterable card (carries `data-facets`). */
	item: string;
	/** Selector for one filter pill (carries `data-filter`). */
	pill: string;
	/** Decorative half-cell filler, kept in step with an odd visible count. */
	filler?: string;
}

export const initFacetFilter = (config: FacetFilterConfig): void => {
	const toggle = document.querySelector<HTMLButtonElement>(config.toggle);
	const panel = document.querySelector<HTMLElement>(config.panel);
	const chevron = config.chevron
		? document.querySelector<SVGElement>(config.chevron)
		: null;
	const grid = document.querySelector<HTMLElement>(config.grid);
	const empty = config.empty
		? document.querySelector<HTMLElement>(config.empty)
		: null;

	if (!toggle || !panel || !grid) return;

	const items = Array.from(grid.querySelectorAll<HTMLElement>(config.item));
	const pills = Array.from(
		document.querySelectorAll<HTMLButtonElement>(config.pill)
	);
	/** Keeps a lone last card from sitting half-width in the 2-column grid. */
	const filler = config.filler
		? grid.querySelector<HTMLElement>(config.filler)
		: null;

	let isPanelOpen = false;

	const syncFillers = (visibleCount: number): void => {
		if (filler) {
			filler.style.display = visibleCount % 2 === 0 ? "none" : "";
		}
		empty?.classList.toggle("hidden", visibleCount > 0);
	};

	const syncPills = (activeFilter: string): void => {
		for (const pill of pills) {
			const isActive = (pill.dataset.filter ?? ALL_FILTER) === activeFilter;

			pill.setAttribute("aria-pressed", String(isActive));
			for (const name of ACTIVE_CLASSES) pill.classList.toggle(name, isActive);
			for (const name of IDLE_CLASSES) pill.classList.toggle(name, !isActive);
		}
	};

	/** Exact facet match, so filtering by `WEB` never matches `WEB APP`. */
	const applyFilter = (filter: string): void => {
		let visibleCount = 0;

		for (const item of items) {
			const facets = (item.dataset.facets ?? "").split(FACET_SEPARATOR);
			const isMatch = filter === ALL_FILTER || facets.includes(filter);

			item.style.display = isMatch ? "" : "none";
			if (isMatch) visibleCount += 1;
		}

		syncPills(filter);
		syncFillers(visibleCount);
	};

	const setPanelOpen = (open: boolean): void => {
		panel.classList.toggle("grid-rows-[1fr]", open);
		panel.classList.toggle("grid-rows-[0fr]", !open);
		panel.setAttribute("aria-hidden", String(!open));
		panel.inert = !open;
		toggle.setAttribute("aria-expanded", String(open));
		chevron?.classList.toggle("rotate-180", open);
		chevron?.classList.toggle("rotate-0", !open);
	};

	toggle.addEventListener("click", () => {
		isPanelOpen = !isPanelOpen;
		setPanelOpen(isPanelOpen);
	});

	for (const pill of pills) {
		pill.addEventListener("click", () => {
			applyFilter(pill.dataset.filter ?? ALL_FILTER);
		});
	}

	// Sync runtime state with the server-rendered defaults.
	setPanelOpen(false);
	applyFilter(ALL_FILTER);
};
