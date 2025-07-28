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
		'eslint@8',
		'@typescript-eslint/parser@6',
		'@typescript-eslint/eslint-plugin@6',
		'@figma/plugin-typings',
		'@figma/eslint-plugin-figma-plugins',
	],

	async setup({ answers }) {
		// Store configuration in answers for postSetup to use
		answers.eslintConfig = dedent`/* eslint-env node */
					module.exports = {
					extends: [
						'eslint:recommended',
						'plugin:@typescript-eslint/recommended',
						'plugin:@figma/figma-plugins/recommended',
					],
					parser: '@typescript-eslint/parser',
					parserOptions: {
						project: './tsconfig.json',
					},
					root: true
				}
			`;
	},

	async postSetup({ answers, helpers }) {
		const eslintConfig = answers.eslintConfig;

		// Update package.json
		await helpers.updateJson('package.json', (json) => {
			json.scripts = json.scripts || {};
			json.scripts['lint'] = 'eslint .';
		});

		// Create ESLint config file
		await helpers.writeFile('.eslintrc.cjs', eslintConfig);
	},

	nextSteps: () => dedent`
		To run the linter, run \`npm run lint\`.
		[Optional] Install ESLint extension for VSCode: ${chalk.cyan('https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint')}
	`,
});
