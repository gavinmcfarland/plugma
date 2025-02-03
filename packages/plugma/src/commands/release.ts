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
  const { updatedTemplates, releaseWorkflowPath } = await workflowTemplates();

  // Update version in package.json
  const { newTag } = await versionUpdate({
    version: options.version,
    type: options.type || 'stable',
  });

  // Commit changes and create release
  const filesToStage = ['package.json'];
  if (updatedTemplates) {
    filesToStage.push(releaseWorkflowPath);
  }

  // Stage files before creating release
  const { execSync } = await import('node:child_process');
  for (const file of filesToStage) {
    execSync(`git add ${file}`, { stdio: 'inherit' });
  }

  const releaseResult = await gitRelease({
    tag: newTag,
    title: options.title,
    notes: options.notes,
  });

  // If release was successful, run build
  if (releaseResult.pushed) {
    execSync('plugma build', { stdio: 'inherit' });
  }

  // TODO: review this...
  // CreateReleaseYmlTask.run(options as any);
}
