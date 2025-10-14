import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';

export default defineIntegration({
	id: 'playwright',
	name: 'Playwright',
	description: 'End to end testing (experimental)',
	dependencies: ['@playwright/test'],

	async postSetup({ helpers, typescript }) {
		const ext = typescript ? 'ts' : 'js';

		// Update package.json
		await helpers.updateJson('package.json', (json) => {
			json.scripts = json.scripts || {};
			json.scripts['playwright'] = 'npx playwright test';
		});

		// Create Playwright config file using template
		await helpers.writeTemplateFile('templates/integrations/playwright', `playwright.config.${ext}`);

		// Create example test file using template
		await helpers.writeTemplateFile('templates/integrations/playwright', `playwright/example.spec.${ext}`);
	},

	nextSteps: (answers) => `
	**Plugged in and ready to go!**

	1. Run tests with \`npm run playwright\`
	2. Visit https://playwright.dev/ for more information
	`,
});
