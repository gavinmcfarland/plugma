import chalk from 'chalk';
import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';

const dependencies = {
	prettier: 'latest',
};

export default defineIntegration({
	id: 'prettier',
	name: 'Prettier',
	description: 'Code formatting',
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
			label: 'Adding format script to package.json',
			action: async ({ helpers }) => {
				await helpers.updateJson('package.json', (json) => {
					json.scripts = json.scripts || {};
					json.scripts['format'] = 'prettier --write .';
					json.scripts['format:check'] = 'prettier --check .';
				});
			},
		},
		{
			label: 'Creating .prettierrc',
			action: async ({ helpers }) => {
				// FIXME: Needs fixing in combino
				// await helpers.writeTemplateFile('templates/integrations/prettier', '.prettierrc');
				const prettierConfig = {
					semi: true,
					singleQuote: true,
					printWidth: 120,
					tabWidth: 4,
					useTabs: true,
				};
				await helpers.writeFile('.prettierrc', JSON.stringify(prettierConfig, null, 4));
			},
		},
		{
			label: 'Creating .prettierignore',
			action: async ({ helpers }) => {
				await helpers.writeTemplateFile('templates/integrations/prettier', '.prettierignore');
			},
		},
	],

	nextSteps: () => `
	**Plugged in and ready to go!**

	1. To format your code, run \`npm run format\`.
	2. To check formatting without making changes, run \`npm run format:check\`.
	3. [Optional] Install Prettier extension for VSCode: https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode
	`,
});
