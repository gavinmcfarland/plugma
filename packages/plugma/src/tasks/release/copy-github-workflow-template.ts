import type { PluginOptions } from '../../core/types.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ListrLogLevels } from 'listr2';
import { createDebugAwareLogger } from '../../utils/debug-aware-logger.js';

interface Result {
	ymlPath: string;
}

/**
 * Task that creates the GitHub Actions release workflow file.
 * This file is used to automate the release process of the plugin.
 *
 * @param options - Plugin options
 * @param outputPath - Output directory path where the yml file should be created
 * @returns The path to the created yml file
 */
const createReleaseYml = async (options: PluginOptions, outputPath: string): Promise<Result> => {
	const logger = createDebugAwareLogger(options.debug);

	try {
		const ymlPath = join(outputPath, 'plugma-create-release.yml');

		const ymlContent = `
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16.x'
      - run: npm ci
      - run: npm run build
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ github.ref }}
          release_name: Release \${{ github.ref }}
          draft: false
          prerelease: false
    `;

		await writeFile(ymlPath, ymlContent.trim());
		logger.log(ListrLogLevels.OUTPUT, `Created release yml at ${ymlPath}`);

		return { ymlPath };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to create release yml: ${errorMessage}`);
	}
};

// Task exports removed - using direct function exports instead
export default createReleaseYml;
