import type { PluginOptions } from '#core/types';

/**
 * Creates mock task options with default values for testing.
 */
export function createMockTaskOptions(
  overrides: Partial<PluginOptions> = {},
): PluginOptions {
  return {
    command: 'dev',
    mode: 'development',
    port: 3000,
    output: 'dist',
    instanceId: 'test',
    debug: false,
    ...overrides,
  };
}
