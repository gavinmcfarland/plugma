import path from 'node:path';
import { defineConfig } from 'vite';
import { gatherBuildOutputs } from '../../src/vite-plugins/build/gather-build-outputs';

const srcRoot = path.resolve(__dirname, '../../src');
const entryFile = path.resolve(srcRoot, 'figma/plugma-runtime.ts');

export default defineConfig({
  build: {
    lib: {
      entry: entryFile,
      formats: ['es'],
      fileName: 'plugma-runtime',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      }
    },
    outDir: 'dist', // Vite default output directory
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
  },
  plugins: [
    gatherBuildOutputs({
      sourceDir: `dist`,
      outputDir: '../../dist/apps',
      // getOutputPath: (file) => path.join('plugma-runtime', file),
      removeSourceDir: true,
    })
  ],
});
