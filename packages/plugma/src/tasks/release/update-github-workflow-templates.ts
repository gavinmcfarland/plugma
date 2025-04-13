/**
 * Task to manage GitHub workflow templates
 * Copies and updates workflow templates from package to user's repository
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Custom error class for workflow template operations
 */
export class WorkflowTemplateError extends Error {
  constructor(
    message: string,
    public code:
      | 'TEMPLATE_NOT_FOUND'
      | 'COPY_ERROR'
      | 'GIT_ERROR'
      | 'FILESYSTEM_ERROR',
  ) {
    super(message);
    this.name = 'WorkflowTemplateError';
  }
}

/**
 * Result of workflow template operations
 */
export interface WorkflowTemplateResult {
  /** Whether any templates were copied or updated */
  templatesChanged: boolean;
  /** List of templates that were copied */
  copiedTemplates: string[];
  /** List of templates that were updated */
  updatedTemplates: string[];
  /** Path to the release workflow file */
  releaseWorkflowPath: string;
}

/**
 * Checks if source file is newer than destination
 */
async function isSourceNewer(
  source: string,
  destination: string,
): Promise<boolean> {
  try {
    const sourceStats = await fs.stat(source);
    const destStats = await fs.stat(destination).catch(() => null);

    return !destStats || sourceStats.mtime > destStats.mtime;
  } catch (err) {
    throw new WorkflowTemplateError(
      `Error comparing file timestamps: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'FILESYSTEM_ERROR',
    );
  }
}

/**
 * Copies workflow templates from package to user's repository
 * Creates destination directory if needed and handles template updates
 *
 * @throws {WorkflowTemplateError} If template operations fail
 */
export async function workflowTemplates(): Promise<WorkflowTemplateResult> {
  const result: WorkflowTemplateResult = {
    templatesChanged: false,
    copiedTemplates: [],
    updatedTemplates: [],
    releaseWorkflowPath: path.join(
      process.cwd(),
      '.github/workflows/plugma-create-release.yml',
    ),
  };

  try {
    // Path to template in npm package (3 levels up from current file)
    const templateDir = path.join(
      __dirname,
      '../../../templates/github/workflows',
    );
    // Path to user's .github folder (in current working directory)
    const githubDir = path.join(process.cwd(), '.github/workflows');

    // Ensure template directory exists
    try {
      await fs.access(templateDir);
    } catch {
      throw new WorkflowTemplateError(
        `Template directory not found: ${templateDir}`,
        'TEMPLATE_NOT_FOUND',
      );
    }

    // Create .github/workflows if it doesn't exist
    await fs.mkdir(githubDir, { recursive: true });

    // Get list of template files
    const files = await fs.readdir(templateDir);
    const releaseWorkflow = 'plugma-create-release.yml';

    // Copy or update each template
    for (const file of files) {
      const sourceFile = path.join(templateDir, file);
      const destFile = path.join(githubDir, file);

      if (await isSourceNewer(sourceFile, destFile)) {
        await fs.copyFile(sourceFile, destFile);

        if (file === releaseWorkflow) {
          result.updatedTemplates.push(file);
          result.templatesChanged = true;

          // Commit release workflow separately if it was updated
          try {
            execSync('git add .github/workflows/plugma-create-release.yml', {
              stdio: 'ignore',
            });
            execSync(
              'git commit -m "chore: Add or update plugma-create-release.yml"',
              {
                stdio: 'ignore',
              },
            );
          } catch (err) {
            // Don't throw if commit fails - might be no changes or other git issues
            // Just log the error and continue
            console.error(
              'Note: Could not commit workflow template changes:',
              err instanceof Error ? err.message : 'Unknown error',
            );
          }
        } else {
          result.copiedTemplates.push(file);
          result.templatesChanged = true;
        }
      }
    }

    return result;
  } catch (err) {
    // If it's already our custom error, rethrow it
    if (err instanceof WorkflowTemplateError) {
      throw err;
    }

    // For any other errors
    throw new WorkflowTemplateError(
      `Error managing workflow templates: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`,
      'FILESYSTEM_ERROR',
    );
  }
}
