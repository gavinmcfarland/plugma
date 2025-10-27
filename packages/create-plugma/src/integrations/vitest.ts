import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';

// TODO: Update tsconfig.json to include tests

const dependencies = {
	vitest: '^4.0.0',
};

export default defineIntegration({
	id: 'vitest',
	name: 'Vitest',
	description: 'Unit testing (experimental)',
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
					json.scripts['vitest'] = 'npx vitest';
				});
			},
		},
		{
			label: 'Creating vitest config',
			action: async ({ helpers, typescript }) => {
				const ext = typescript ? 'ts' : 'js';
				await helpers.writeTemplateFile('templates/integrations/vitest', `vitest.config.${ext}`);
			},
		},
		{
			label: 'Creating example test file',
			action: async ({ helpers, typescript }) => {
				const ext = typescript ? 'ts' : 'js';
				await helpers.writeTemplateFile('templates/integrations/vitest', `vitest/example.test.${ext}`);
			},
		},
	],

	nextSteps: (answers) => `
	1. Start the dev server in one terminal \`npm run dev\`
	2. In another terminal, run tests with \`npm run vitest\`
	3. Visit https://vitest.dev/ for more information

	Support for Vitest is still experimental and may not work as expected.

	If you encounter any issues, please raise a github issue at https://github.com/gavinmcfarland/plugma/issues.
	`,
});
