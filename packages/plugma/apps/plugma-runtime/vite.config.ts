import { defineConfig } from 'vite'
import { gatherBuildOutputs } from '../gather-build-outputs'

// const srcRoot = path.resolve(__dirname, '../../src');
// const entryFile = path.resolve(srcRoot, 'figma/plugma-runtime.ts');

export default defineConfig({
	build: {
		lib: {
			entry: 'index.ts',
			formats: ['es'],
			fileName: 'plugma-runtime',
		},
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				// Prevents generating export default
				exports: 'named',
			},
		},
		target: 'esnext',
		outDir: 'dist', // Vite default output directory
		minify: false,
		sourcemap: false,
		emptyOutDir: false,
	},
	plugins: [
		gatherBuildOutputs({
			from: `dist`,
			to: '../../dist/apps',
			transformPath: (file) => file.replace('.cjs', '.js'),
			removeSource: false,
		}),
	],
})
