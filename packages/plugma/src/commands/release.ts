/**
 * Release command implementation
 * Handles plugin release process including version management and Git operations
 */

import {
  gitRelease,
  gitStatus,
  versionUpdate,
  workflowTemplates,
} from '#tasks/release/index.js';
import type { ReleaseCommandOptions } from './types.js';

/**
 * Main release command implementation
 * @param options - Release configuration options
 */
export async function release(options: ReleaseCommandOptions): Promise<void> {
  // Check Git repository status
  const status = await gitStatus();
  if (!status.isGitRepo) {
    throw new Error(
      'This is not a Git repository. Please initialize a Git repository before proceeding.',
    );
  }
  if (!status.isClean) {
    throw new Error(
      'Working directory has uncommitted changes. Please commit or stash them before proceeding.',
    );
  }

  // Update workflow templates
  const { templatesUpdated, releaseWorkflowPath } = await workflowTemplates();

  // Update version in package.json
  const { newTag } = await versionUpdate({
    version: options.version,
    type: options.type || 'stable',
  });

  // Commit changes and create release
  const filesToStage = ['package.json'];
  if (templatesUpdated) {
    filesToStage.push(releaseWorkflowPath);
  }

  const releaseResult = await gitRelease({
    tag: newTag,
    title: options.title,
    notes: options.notes,
    files: filesToStage,
  });

  // If release was successful, run build
  if (releaseResult.pushed) {
    const { execSync } = await import('node:child_process');
    execSync('plugma build', { stdio: 'inherit' });
  }
}
