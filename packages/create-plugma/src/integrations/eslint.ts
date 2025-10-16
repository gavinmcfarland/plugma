import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';

// TODO: Update tsconfig.json to include tests

export default defineIntegration({
	id: 'eslint',
	name: 'ESLint',
	description: 'Linting',
	dependencies: [
		'typescript',
		'eslint@9',
		// '@typescript-eslint/parser@8',
		// '@typescript-eslint/eslint-plugin@8',
		'typescript-eslint@8',
		// NOTE: Disabled for now because they are not compatible with the latest version of ESLint
		// '@figma/plugin-typings',
		// '@figma/eslint-plugin-figma-plugins',
	],

	setup: [
		{
			label: 'Adding lint script to package.json',
			action: async ({ helpers }) => {
				await helpers.updateJson('package.json', (json) => {
					json.scripts = json.scripts || {};
					json.scripts['lint'] = 'eslint .';
				});
			},
		},
		{
			label: 'Creating eslint.config.js',
			action: async ({ helpers }) => {
				await helpers.writeTemplateFile('templates/integrations/eslint', 'eslint.config.js');
			},
		},
	],

	nextSteps: () => `
	**Plugged in and ready to go!**

	1. To run the linter, run \`npm run lint\`.
	2. [Optional] Install ESLint extension for VSCode: https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
	`,
});
