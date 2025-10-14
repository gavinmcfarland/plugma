import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';

// TODO: Update tsconfig.json to include tests

export default defineIntegration({
	id: 'vitest',
	name: 'Vitest',
	description: 'Unit testing (experimental)',
	dependencies: ['vitest'],

	async postSetup({ helpers, typescript }) {
		const ext = typescript ? 'ts' : 'js';

		// Update package.json
		await helpers.updateJson('package.json', (json) => {
			json.scripts = json.scripts || {};
			json.scripts['vitest'] = 'npx vitest';
		});

		// Create Vitest config file using template
		await helpers.writeTemplateFile('templates/integrations/vitest', `vitest.config.${ext}`);

		// Create example test file using template
		await helpers.writeTemplateFile('templates/integrations/vitest', `vitest/example.test.${ext}`);
	},

	nextSteps: (answers) => `
	**Plugged in and ready to go!**

	1. Start the dev server: \`npm run dev\`
	2. Run tests with \`npm run vitest\`
	3. Visit https://vitest.dev/ for more information
	`,
});
