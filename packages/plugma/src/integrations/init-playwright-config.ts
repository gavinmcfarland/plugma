import fs from 'fs'
import path from 'path'

const configContent = `import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests',
	/* Run tests in files in parallel */
	fullyParallel: false,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like \`await page.goto('/')\`. */
		// baseURL: 'http://127.0.0.1:3000',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: 'npm run dev -- -ws --port 4000',
		url: 'http://localhost:4000',
		reuseExistingServer: !process.env.CI,
	},
})
`

const outputPath = path.resolve(process.cwd(), 'playwright.config.ts')

export function initConfig() {
	if (fs.existsSync(outputPath)) {
		console.log(`⚠️ Playwright config already exists at ${outputPath}`)
		return
	}

	fs.writeFileSync(outputPath, configContent, 'utf-8')
	console.log(`✅ Created Playwright config at ${outputPath}`)
}
