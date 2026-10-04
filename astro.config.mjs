// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},

	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Azeret Mono",
			cssVariable: "--font-azeret-mono",
			weights: [100, 200, 300, 400, 500, 600, 700],
			display: "optional",
		},
		{
			provider: fontProviders.local(),
			name: "HelveticaNeue",
			cssVariable: "--font-helvetica-neue",
			display: "optional",
			options: {
				variants: [
					// Thin (100)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueThin.otf",
						],
						weight: 100,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueThinItalic.otf",
						],
						weight: 100,
						style: "italic",
					},
					// UltraLight (200)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueUltraLight.otf",
						],
						weight: 200,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueUltraLightItalic.otf",
						],
						weight: 200,
						style: "italic",
					},
					// Light (300)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueLight.otf",
						],
						weight: 300,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueLightItalic.otf",
						],
						weight: 300,
						style: "italic",
					},
					// Regular (400)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueRoman.otf",
						],
						weight: 400,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueItalic.ttf",
						],
						weight: 400,
						style: "italic",
					},
					// Medium (500)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueMedium.otf",
						],
						weight: 500,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueMediumItalic.otf",
						],
						weight: 500,
						style: "italic",
					},
					// Bold (700)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueBold.otf",
						],
						weight: 700,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueBoldItalic.otf",
						],
						weight: 700,
						style: "italic",
					},
					// Heavy (800)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueHeavy.otf",
						],
						weight: 800,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueHeavyItalic.otf",
						],
						weight: 800,
						style: "italic",
					},
					// Black (900)
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueBlack.otf",
						],
						weight: 900,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/helvetica-neue/HelveticaNeueBlackItalic.otf",
						],
						weight: 900,
						style: "italic",
					},
				],
			},
		},
	],
});
