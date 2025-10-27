import type { PluginManifest } from 'plugma';

export default {
	name: 'Test Plugin',
	id: 'test-plugin',
	api: '1.0.0',
	main: 'src/main.ts',
	ui: 'src/App.svelte',
} satisfies PluginManifest;
