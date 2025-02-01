import PlugmaPackageJson from '#packageJson' with { type: 'json' };
import type { GetFilesTaskResult } from '#tasks/common/get-files.js';
import userPkgJson from '#test/fixtures/user-package.json' with {
  type: 'json',
};
import type { PackageJson, PartialDeep } from 'type-fest';

/**
 * Creates a mock GetFilesResult with all required fields for testing.
 * This mock is used across multiple test files to ensure consistency.
 */
export function createMockGetFilesResult(
  overrides: PartialDeep<GetFilesTaskResult> = {},
): GetFilesTaskResult {
  const defaultResult: GetFilesTaskResult = {
    plugmaPkg: PlugmaPackageJson as PackageJson,
    files: {
      userPkgJson: userPkgJson as PackageJson,
      manifest: {
        name: 'Test Plugin',
        id: 'test-plugin',
        main: 'src/main.ts',
        ui: 'src/ui.tsx',
        version: '1.0.0',
        api: '1.0.0',
      },
    },
    config: {
      ui: {
        dev: {
          mode: 'development',
          define: {},
          plugins: [],
          server: { port: 3000 },
        },
        build: {
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            rollupOptions: { input: 'src/main.ts' },
          },
          plugins: [],
        },
      },
      main: {
        dev: {
          mode: 'development',
          define: {},
          plugins: [],
        },
        build: {
          mode: 'production',
          define: {},
          plugins: [],
        },
      },
    },
  };

  return {
    ...defaultResult,
    ...overrides,
    files: {
      ...defaultResult.files,
      ...(overrides.files || {}),
    },
    config: {
      ...defaultResult.config,
      ...(overrides.config || {}),
    },
  } as GetFilesTaskResult;
}

/**
 * Creates a mock GetFilesResult without UI fields for testing scenarios that don't require UI.
 */
export function createMockGetFilesResultWithoutUi(): GetFilesTaskResult {
  const result = createMockGetFilesResult();
  const { ui: _, ...manifestWithoutUi } = result.files.manifest;
  const { ui: __, ...plugmaManifestWithoutUi } =
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    result.files.userPkgJson.plugma!.manifest!;

  return {
    ...result,
    files: {
      ...result.files,
      manifest: manifestWithoutUi,
      userPkgJson: {
        ...result.files.userPkgJson,
        plugma: {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          ...result.files.userPkgJson.plugma!,
          manifest: plugmaManifestWithoutUi,
        },
      } as PackageJson,
    },
  };
}
