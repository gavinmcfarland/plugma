import { resolve } from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**'],
    },
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '#core': resolve(__dirname, 'src/core'),
      '#commands': resolve(__dirname, 'src/commands'),
      '#utils': resolve(__dirname, 'src/utils'),
      '#vite-plugins': resolve(__dirname, 'src/vite-plugins'),
      '#tasks': resolve(__dirname, 'src/tasks'),
      '#test': resolve(__dirname, 'test'),
    },
  },
});
