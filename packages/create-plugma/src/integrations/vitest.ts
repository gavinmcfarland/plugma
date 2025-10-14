import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';

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

	nextSteps: (answers) => dedent`
		Start the dev server: ${chalk.cyan('npm run dev')}
		Run tests with ${chalk.cyan('npm run vitest')}
		See Vitest docs for more information: ${chalk.cyan('https://vitest.dev/')}
	`,
});
