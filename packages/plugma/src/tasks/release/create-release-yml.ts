import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EnsureDistTask } from '../common/ensure-dist.js';
import { task } from '../runner.js';

interface Result {
  ymlPath: string;
}

/**
 * Task that creates the GitHub Actions release workflow file.
 * This file is used to automate the release process of the plugin.
 *
 * @param options - Plugin options
 * @param context - Task context containing results from previous tasks
 * @returns The path to the created yml file
 */
const createReleaseYml = async (
  options: PluginOptions,
  context: ResultsOfTask<EnsureDistTask>,
): Promise<Result> => {
  const logger = new Logger({ debug: options.debug });

  try {
    const distResult = context[EnsureDistTask.name];
    if (!distResult) {
      throw new Error('ensure-dist task must run first');
    }

    const ymlPath = join(distResult.outputPath, 'plugma-create-release.yml');

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
    logger.debug(`Created release yml at ${ymlPath}`);

    return { ymlPath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create release yml: ${errorMessage}`);
  }
};

export const CreateReleaseYmlTask = task(
  'release:create-yml',
  createReleaseYml,
);
export type CreateReleaseYmlTask = GetTaskTypeFor<typeof CreateReleaseYmlTask>;

export default CreateReleaseYmlTask;
