import { resolve } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['packages/**/__tests__/**/*.test.ts'],
		exclude: [
			'**/node_modules/**',
			// Temporarily excluded
			'**/__tests__/**/source-watcher.test.ts',
			'**/__tests__/**/main.test.ts',
			'**/__tests__/**/vite.test.ts',
			'**/__tests__/**/restart-vite.test.ts',
			'**/__tests__/**/manifest.test.ts',
		],
		testTimeout: 10000,
		hookTimeout: 10000,
		teardownTimeout: 10000,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
		},
		pool: 'forks',
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
	},
	plugins: [
		tsconfigPaths({
			ignoreConfigErrors: true,
		}),
	],
	resolve: {
		alias: {
			'#core': resolve(__dirname, 'packages/plugma/src/core'),
			'#commands': resolve(__dirname, 'packages/plugma/src/commands'),
			'#utils': resolve(__dirname, 'packages/plugma/src/utils'),
			'#vite-plugins': resolve(__dirname, 'packages/plugma/src/vite-plugins'),
			'#tasks': resolve(__dirname, 'packages/plugma/src/tasks'),
			'#test': resolve(__dirname, 'packages/plugma/test'),
		},
	},
});
