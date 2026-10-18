// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

/**
 * Helvetica Neue ships as woff2, not otf: the three cuts the design uses are
 * 482 KB as woff2 against 1.4 MB as otf, and two of them are preloaded on
 * every page (870 KB → 288 KB). Convert a new cut with `fontTools`:
 *
 *     python3 -c "from fontTools.ttLib import TTFont; f = TTFont('In.otf'); f.flavor = 'woff2'; f.save('In.woff2')"
 *
 * No subsetting — the full charset is kept, so nothing the copy uses (em dash,
 * ×, curly quotes) falls back to a system font.
 */
/** @param {string} file */
const font = (file) => `./src/assets/fonts/helvetica-neue/${file}.woff2`;

// https://astro.build/config
export default defineConfig({
	site: "https://jeremiahjason.com",

	image: {
		layout: "constrained",
		responsiveStyles: true,
	},

	// `/experiments` is a scratch space for visual tests, not content.
	integrations: [sitemap({ filter: (page) => !page.includes("/experiments") })],

	vite: {
		plugins: [tailwindcss()],
	},

	/**
	 * Only the weights the design actually uses are registered.
	 *
	 * Helvetica Neue has no true 600, so `font-semibold` (600) reuses the Bold
	 * cut — that is the weight the browser already fell back to when 600 was
	 * missing entirely. Point it at `HelveticaNeueMedium.woff2` instead if
	 * `font-semibold` should read lighter than `font-bold`.
	 *
	 * The other 12 cuts (thin → black, plus every italic) are not used
	 * anywhere, so registering them only shipped dead files.
	 */
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Azeret Mono",
			cssVariable: "--font-azeret-mono",
			weights: [400, 500, 700],
			styles: ["normal"],
			display: "swap",
		},
		{
			provider: fontProviders.local(),
			name: "HelveticaNeue",
			cssVariable: "--font-helvetica-neue",
			display: "swap",
			options: {
				variants: [
					{
						src: [font("HelveticaNeueRoman")],
						weight: 400,
						style: "normal",
					},
					{
						src: [font("HelveticaNeueMedium")],
						weight: 500,
						style: "normal",
					},
					// No true semibold exists in the family.
					{
						src: [font("HelveticaNeueBold")],
						weight: 600,
						style: "normal",
					},
					{
						src: [font("HelveticaNeueBold")],
						weight: 700,
						style: "normal",
					},
				],
			},
		},
	],
});
