import type { ResolvedConfig, ViteDevServer } from 'vite';
import { vi } from 'vitest';
import { mockFs } from '../fs/mock-fs.js';
import { createMockViteConfig } from './mock-vite-config.js';

/**
 * Creates a mock Vite dev server for testing.
 */
export function createMockViteServer(
  overrides: Partial<ViteDevServer> = {},
): ViteDevServer {
  const mockServer: ViteDevServer = {
    listen: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    config: createMockViteConfig().ui.dev as unknown as ResolvedConfig,
    bindCLIShortcuts: vi.fn(),
    httpServer: null,
    middlewares: {} as any,
    printUrls: vi.fn(),
    resolvedUrls: null,
    restart: vi.fn(),
    watcher: {} as any,
    ws: {} as any,
    pluginContainer: {} as any,
    moduleGraph: {} as any,
    ssrLoadModule: async () => ({}),
    ssrFixStacktrace: () => {},
    ssrRewriteStacktrace: () => '',
    transformRequest: vi.fn().mockResolvedValue(null),
    warmupRequest: vi.fn().mockResolvedValue(null),
    transformIndexHtml: vi.fn().mockResolvedValue(''),
    ssrTransform: vi.fn().mockResolvedValue({ code: '' }),
    reloadModule: vi.fn(),
    openBrowser: vi.fn(),
    waitForRequestsIdle: vi.fn(),
    ssrFetchModule: vi.fn().mockResolvedValue({}),
    hot: {} as any,
  };

  return {
    ...mockServer,
    ...overrides,
  };
}

/**
 * Mock Vite server instance for testing
 */
export const mockViteServer = createMockViteServer();

/**
 * Mock Vite module for testing
 */
export const mockVite = {
  createServer: vi.fn().mockResolvedValue(mockViteServer),
  build: vi.fn().mockImplementation(async () => {
    // Log build output
    console.log('vite v5.4.12 building for production...');
    console.log('✓ 100 modules transformed.');
    console.log('dist/ui.html  39.80 kB │ gzip: 15.47 kB');
    console.log('✓ built in 293ms');

    // Create build artifacts in mock filesystem
    await mockFs.writeFile('test/sandbox/dist/ui.html', '<div>Test UI</div>');
    await mockFs.writeFile(
      'test/sandbox/dist/main.js',
      'console.log("Test main")',
    );
    await mockFs.writeFile(
      'test/sandbox/dist/manifest.json',
      JSON.stringify({
        name: 'test-plugin',
        id: 'test-plugin',
        api: '1.0.0',
        main: 'dist/main.js',
        ui: 'dist/ui.html',
      }),
    );

    return undefined;
  }),
  mergeConfig: vi.fn((config1, config2) => ({ ...config1, ...config2 })),
  defineConfig: vi.fn((config) => config),
};
