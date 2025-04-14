import chalk from 'chalk'
import { defineIntegration } from './define-integration.js'
import dedent from 'dedent'

export default defineIntegration({
	id: 'playwright',
	name: 'Playwright',
	description: 'End to end testing',
	dependencies: ['@playwright/test'],

	async setup({ helpers, typescript }) {
		const ext = typescript ? 'ts' : 'js'

		// Update package.json
		await helpers.updateJson('package.json', (json) => {
			json.scripts = json.scripts || {}
			json.scripts['test:e2e'] = 'playwright test'
		})

		await helpers.writeFile(
			`playwright.config.${ext}`,
			dedent`import { defineConfig, devices } from '@playwright/test';

					export default defineConfig({
					testDir: './e2e',
					fullyParallel: true,
					projects: [
						{
						name: 'chromium',
						use: { ...devices['Desktop Chrome'] },
						},
					],
					webServer: {
						command: 'npm run dev -- -ws --port 4000',
						url: 'http://localhost:4000',
						reuseExistingServer: !process.env.CI,
					},
				});
			`,
		)

		await helpers.writeFile(
			`e2e/example.spec.${ext}`,
			dedent`import { test, expect } from '@playwright/test';

				test("create 10 rectangles", async ({ ui, main }) => {

					await ui.goto("http://localhost:4000/");
					await ui.getByRole("spinbutton", { name: "X-position" }).click();
					await ui.getByRole("spinbutton", { name: "X-position" }).fill("10");
					await ui.getByRole("button", { name: "Create Rectangles" }).click();

					const rects = await main(async () => {
						return figma.currentPage.children;
					});

					expect(rects.length).toBe(10);
				});
			`,
		)
	},

	nextSteps: (answers) => dedent`
		Run tests with ${chalk.cyan('npm run test:e2e')}
		See Playwright docs for more information: ${chalk.cyan('https://playwright.dev/docs/intro')}
	`,
})
