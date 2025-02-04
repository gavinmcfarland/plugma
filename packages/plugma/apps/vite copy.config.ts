import { gatherBuildOutputs } from '#vite-plugins';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const apps = {
  'dev-server': {
    entry: 'dev-server/main.ts',
  },
  'figma-bridge': {
    entry: 'figma-bridge/main.js',
  },
};

const app = process.env.PLUGMA_APP_NAME;

if (!app) {
  throw new Error('PLUGMA_APP_NAME environment variable is not defined');
}

const appConfig = apps[app as keyof typeof apps];

if (!appConfig) {
  throw new Error(
    `Unknown app: ${app}. Available apps: ${Object.keys(apps).join(', ')}`,
  );
}

export default defineConfig({
  define: {
    'import.meta.env.PLUGMA_APP_NAME': JSON.stringify(app),
  },

  resolve: {
    alias: {
      '#core': path.resolve(__dirname, '../src/core'),
      '#tasks': path.resolve(__dirname, '../src/tasks'),
      '#utils': path.resolve(__dirname, '../src/utils'),
      '#vite-plugins': path.resolve(__dirname, '../src/vite-plugins'),
    },
  },

  plugins: [
    // TODO: Update @sveltejs/vite-plugin-svelte version
    // BUT NOT THE LATEST! The latest version only supports Vite 6 and Svelte 5
    svelte(),
    {
      name: 'html-transform',
      transform(html) {
        return html
          .replace(/<% appId %>/g, app)
          .replace(/<% entrypoint %>/g, `./${appConfig.entry}`);
      },
    },
    viteSingleFile(),
    gatherBuildOutputs({
      sourceDir: 'dist',
      outputDir: '../dist/apps',
      getOutputPath: (file) => `${path.dirname(file)}.html`,
      removeSourceDir: false,
    }),
  ],

  optimizeDeps: {
    exclude: ['fsevents'],
  },

	root: app,

  build: {
    outDir: `dist/${app}`,
    minify: 'terser' as const,
    terserOptions: {
      format: {
        comments: false,
      },
    },
    cssCodeSplit: false,
    // rollupOptions: {
    //   input: 'index.html',
    //   output: {
    //     manualChunks: undefined,
		// 		format: 'cjs',
    //   },
    // },
  },
});
