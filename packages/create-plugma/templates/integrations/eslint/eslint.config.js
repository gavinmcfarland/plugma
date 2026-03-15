import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import * as figmaPlugin from '@figma/eslint-plugin-figma-plugins';

export default defineConfig([
	js.configs.recommended,
	...tseslint.configs.recommended,

	globalIgnores(['node_modules/**', 'dist/**', '*.config.{js,ts}', 'src/vite-env.d.ts']),

	// Base configuration
	{
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	// Main thread specifics
	{
		files: ['src/main/**/*.ts'],
		languageOptions: {
			globals: { figma: 'readonly', __html__: 'readonly' },
		},
		plugins: {
			'@figma/figma-plugins': figmaPlugin,
		},
		rules: {
			'@typescript-eslint/triple-slash-reference': 'off',
			...figmaPlugin.flatConfigs.recommended.rules,
		},
	},

	// UI specifics (update as needed)
	{
		files: ['src/ui/**/*.{ts,tsx,svelte,vue}'],
	},
]);
