import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests for the static site.
 *
 * The dev server is started on its own port so a locally running
 * `astro dev` (default 4321) never collides with a run.
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: "http://localhost:4399",
		trace: "on-first-retry",
	},
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"] } },
		{ name: "mobile", use: { ...devices["Pixel 7"] } },
	],
	webServer: [
		{
			command: "npm run build && npx astro preview --port 4399",
			url: "http://localhost:4399",
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
			stdout: "ignore",
			stderr: "pipe",
		},
		{
			/**
			 * Drafts (`draft: true`) only exist in dev — see the entry tests.
			 * `--ignore-lock` lets this run alongside a local background dev server.
			 */
			command: "npx astro dev --port 4400 --ignore-lock",
			url: "http://localhost:4400",
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
			stdout: "ignore",
			stderr: "pipe",
		},
	],
});
