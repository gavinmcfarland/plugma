/**
 * Task to manage GitHub workflow templates
 * Copies and updates workflow templates from package to user's repository
 * Supports monorepos by detecting git root and updating workflow paths
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findGitRoot, getRelativePathFromGitRoot } from '../../utils/git/find-git-root.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Custom error class for workflow template operations
 */
export class WorkflowTemplateError extends Error {
	constructor(
		message: string,
		public code: 'TEMPLATE_NOT_FOUND' | 'COPY_ERROR' | 'GIT_ERROR' | 'FILESYSTEM_ERROR',
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
	/** Git repository root path */
	gitRoot: string;
	/** Relative path from git root to plugin directory */
	pluginRelativePath: string;
}

/**
 * Checks if source file is newer than destination
 */
async function isSourceNewer(source: string, destination: string): Promise<boolean> {
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
 * Updates workflow content to support monorepo structure
 */
function updateWorkflowForMonorepo(content: string, pluginRelativePath: string): string {
	// If plugin is at git root, no changes needed
	if (!pluginRelativePath || pluginRelativePath === '.') {
		return content;
	}

	// Update the PLUGIN_DIR environment variable to point to the plugin directory
	return content.replace(/PLUGIN_DIR: '\.'/, `PLUGIN_DIR: '${pluginRelativePath}'`);
}

/**
 * Copies workflow templates from package to user's repository
 * Creates destination directory if needed and handles template updates
 * Supports monorepos by installing workflows at git root and updating paths
 *
 * @throws {WorkflowTemplateError} If template operations fail
 */
export async function workflowTemplates(): Promise<WorkflowTemplateResult> {
	try {
		// Find git repository root
		const gitRoot = findGitRoot();
		const pluginRelativePath = getRelativePathFromGitRoot();

		const result: WorkflowTemplateResult = {
			templatesChanged: false,
			copiedTemplates: [],
			updatedTemplates: [],
			releaseWorkflowPath: path.join(gitRoot, '.github/workflows/plugma-create-release.yml'),
			gitRoot,
			pluginRelativePath,
		};

		// Path to template in npm package (3 levels up from current file)
		const templateDir = path.join(__dirname, '../../../templates/github/workflows');
		// Path to git root's .github folder
		const githubDir = path.join(gitRoot, '.github/workflows');

		// Ensure template directory exists
		try {
			await fs.access(templateDir);
		} catch {
			throw new WorkflowTemplateError(`Template directory not found: ${templateDir}`, 'TEMPLATE_NOT_FOUND');
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
				// Read the template content
				let content = await fs.readFile(sourceFile, 'utf8');

				// Update content for monorepo if needed
				if (file === releaseWorkflow && pluginRelativePath) {
					content = updateWorkflowForMonorepo(content, pluginRelativePath);
				}

				// Write the updated content
				await fs.writeFile(destFile, content);

				if (file === releaseWorkflow) {
					result.updatedTemplates.push(file);
					result.templatesChanged = true;

					// Commit release workflow separately if it was updated
					try {
						// Store original working directory
						const originalCwd = process.cwd();

						// Change to git root for git operations
						process.chdir(gitRoot);
						execSync('git add .github/workflows/plugma-create-release.yml', {
							stdio: 'ignore',
						});
						execSync('git commit -m "chore: Add or update plugma-create-release.yml"', {
							stdio: 'ignore',
						});

						// Restore original working directory
						process.chdir(originalCwd);
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
			`Error managing workflow templates: ${err instanceof Error ? err.message : 'Unknown error'}`,
			'FILESYSTEM_ERROR',
		);
	}
}
