import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './playwright',
	fullyParallel: true,
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run dev -- --port 4000',
		url: 'http://localhost:4000',
		reuseExistingServer: !process.env.CI,
	},
});
