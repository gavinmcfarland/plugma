import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';

const dependencies = {
	'@playwright/test': 'latest',
};

export default defineIntegration({
	id: 'playwright',
	name: 'Playwright',
	description: 'End to end testing (experimental)',
	dependencies,

	setup: [
		{
			label: 'Adding dependencies to package.json',
			action: async ({ helpers }) => {
				await helpers.updateJson('package.json', (json) => {
					json.dependencies = json.dependencies || {};
					Object.entries(dependencies).forEach(([name, version]) => {
						json.dependencies[name] = version;
					});
				});
			},
		},
		{
			label: 'Adding test script to package.json',
			action: async ({ helpers }) => {
				await helpers.updateJson('package.json', (json) => {
					json.scripts = json.scripts || {};
					json.scripts['playwright'] = 'npx playwright test';
				});
			},
		},
		{
			label: 'Creating playwright config',
			action: async ({ helpers, typescript }) => {
				const ext = typescript ? 'ts' : 'js';
				await helpers.writeTemplateFile('templates/integrations/playwright', `playwright.config.${ext}`);
			},
		},
		{
			label: 'Creating example test file',
			action: async ({ helpers, typescript }) => {
				const ext = typescript ? 'ts' : 'js';
				await helpers.writeTemplateFile('templates/integrations/playwright', `playwright/example.spec.${ext}`);
			},
		},
	],

	nextSteps: (answers) => `
	**Plugged in and ready to go!**

	1. Run tests with \`npm run playwright\`
	2. Visit https://playwright.dev/ for more information
	`,
});
