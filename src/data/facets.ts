/**
 * Shared vocabulary for the facet filters on `/works` (categories) and
 * `/entries` (tags).
 *
 * Deliberately free of `astro:content` imports: `src/scripts/facet-filter.ts`
 * is a client module and must not pull the content layer into the bundle.
 */

/** Pseudo-facet that clears the filter; always the first pill. */
export const ALL_FILTER = "ALL";

/**
 * A card stores its facets as one string. The delimiter must not be a space:
 * facets like `WEB APP` or `build notes` would split apart.
 */
export const FACET_SEPARATOR = "|";

/** Joins a card's facets into the `data-facets` attribute the filter reads. */
export const toFacetAttr = (facets: string[]): string =>
	facets.join(FACET_SEPARATOR);
