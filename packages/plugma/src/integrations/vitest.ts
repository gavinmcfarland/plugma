import chalk from 'chalk'
import { defineIntegration } from './define-integration.js'
import dedent from 'dedent'

// TODO: Update tsconfig.json to include tests

export default defineIntegration({
	id: 'vitest',
	name: 'Vitest',
	description: 'Unit testing',
	dependencies: ['vitest'],

	async setup({ helpers, typescript }) {
		const ext = typescript ? 'ts' : 'js'

		// Update package.json
		await helpers.updateJson('package.json', (json) => {
			json.scripts = json.scripts || {}
			json.scripts['test'] = 'npx vitest'
		})

		// await helpers.writeFile(
		// 	`vitest.config.${ext}`,
		// 	dedent`import { defineConfig, devices } from '@playwright/test';

		// 			export default defineConfig({
		// 			testDir: './tests',
		// 			fullyParallel: true,
		// 			projects: [
		// 				{
		// 				name: 'chromium',
		// 				use: { ...devices['Desktop Chrome'] },
		// 				},
		// 			],
		// 			webServer: {
		// 				command: 'npm run dev -- -ws --port 4000',
		// 				url: 'http://localhost:4000',
		// 				reuseExistingServer: !process.env.CI,
		// 			},
		// 		});
		// 	`,
		// )

		await helpers.writeFile(
			`tests/example.test.${ext}`,
			dedent`import { expect, test } from 'plugma/vitest';

				const TEST_COLOR = {
				r: Math.random(),
				g: Math.random(),
				b: Math.random(),
				};

				test('creates a rectangle', async () => {
					const rect = figma.createRectangle();

					rect.x = 0;
					rect.y = 0;
					rect.resize(200, 200);

					rect.fills = [{ type: 'SOLID', color: TEST_COLOR }];

					expect(rect.type).to.equal('RECTANGLE');
					expect(rect.width).to.equal(200);
					expect(rect.height).to.equal(200);

				});
			`,
		)
	},

	nextSteps: (answers) => dedent`
		Start the dev server with websockets enabled: ${chalk.cyan('npm run dev -- -ws')}
		Run tests with ${chalk.cyan('npm run test')}
		See Vitest docs for more information: ${chalk.cyan('https://vitest.dev/')}
	`,
})
