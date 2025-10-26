import path from 'node:path';

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowTemplateError, workflowTemplates } from '../../../src/tasks/release/update-github-workflow-templates.js';

// Mock node modules
vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

// Mock git utilities
vi.mock('../../../src/utils/git/find-git-root.js', () => ({
  findGitRoot: vi.fn(),
  getRelativePathFromGitRoot: vi.fn(),
}));

import { execSync } from 'node:child_process';
// Import after mocking
import fs from 'node:fs/promises';
import { findGitRoot, getRelativePathFromGitRoot } from '../../../src/utils/git/find-git-root.js';

describe('workflowTemplates', () => {
  const mockGitRoot = '/path/to/repo';
  const releaseWorkflowPath = path.join(
    mockGitRoot,
    '.github',
    'workflows',
    'plugma-create-release.yml',
  );

  // Calculate the actual template directory path relative to this test file
  const templateDir = path.resolve(__dirname, '../../../templates/github/workflows');
  const githubDir = path.join(mockGitRoot, '.github', 'workflows');

  // Mock process.chdir to avoid actual directory changes in tests
  const originalChdir = process.chdir;
  let mockChdir: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();

    // Set up default git root mocks
    vi.mocked(findGitRoot).mockReturnValue(mockGitRoot);
    vi.mocked(getRelativePathFromGitRoot).mockReturnValue('.');

    // Mock process.chdir to avoid actual directory changes
    mockChdir = vi.fn();
    process.chdir = mockChdir;
  });

  // Restore process.chdir after all tests
  afterAll(() => {
    process.chdir = originalChdir;
  });

  it('should create .github/workflows directory at git root if it does not exist', async () => {
    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock empty template directory
    vi.mocked(fs.readdir).mockResolvedValueOnce([]);
    // Mock directory creation
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: false,
      copiedTemplates: [],
      releaseWorkflowPath,
      updatedTemplates: [],
      gitRoot: mockGitRoot,
      pluginRelativePath: '.',
    });

    expect(fs.mkdir).toHaveBeenCalledWith(
      githubDir,
      { recursive: true },
    );
  });

  it('should copy new templates to git root', async () => {
    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock template files
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      'test.yml',
      'other.yml',
    ] as any);
    // Mock directory creation
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    // Mock file stats to indicate source is newer
    vi.mocked(fs.stat)
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 1) } as any) // source
      .mockRejectedValueOnce(new Error('ENOENT')) // dest doesn't exist
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 1) } as any) // source
      .mockRejectedValueOnce(new Error('ENOENT')); // dest doesn't exist

    // Mock file read/write for templates
    vi.mocked(fs.readFile).mockResolvedValue('template content');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: true,
      copiedTemplates: ['test.yml', 'other.yml'],
      releaseWorkflowPath,
      updatedTemplates: [],
      gitRoot: mockGitRoot,
      pluginRelativePath: '.',
    });

    expect(fs.writeFile).toHaveBeenCalledTimes(2);
  });

  it('should update workflow for monorepo structure when plugin is in subdirectory', async () => {
    // Mock plugin in subdirectory
    vi.mocked(getRelativePathFromGitRoot).mockReturnValue('packages/my-plugin');

    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock template files - using release workflow
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      'plugma-create-release.yml',
    ] as any);
    // Mock directory creation
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    // Mock file stats to indicate source is newer
    vi.mocked(fs.stat)
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 2) } as any) // source
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 1) } as any); // dest is older

    // Mock file read/write for workflow template
    const originalContent = `env:
    PLUGIN_DIR: '.'`;
    const expectedContent = `env:
    PLUGIN_DIR: 'packages/my-plugin'`;

    vi.mocked(fs.readFile).mockResolvedValue(originalContent);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: true,
      copiedTemplates: [],
      updatedTemplates: ['plugma-create-release.yml'],
      releaseWorkflowPath,
      gitRoot: mockGitRoot,
      pluginRelativePath: 'packages/my-plugin',
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(githubDir, 'plugma-create-release.yml'),
      expectedContent
    );
  });

  it('should update release workflow and commit changes at git root', async () => {
    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock template files
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      'plugma-create-release.yml',
    ] as any);
    // Mock directory creation
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    // Mock file stats to indicate source is newer
    vi.mocked(fs.stat)
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 2) } as any) // source
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 1) } as any); // dest is older

    // Mock file read/write
    vi.mocked(fs.readFile).mockResolvedValue('template content');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    // Mock git commands
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: true,
      copiedTemplates: [],
      updatedTemplates: ['plugma-create-release.yml'],
      releaseWorkflowPath,
      gitRoot: mockGitRoot,
      pluginRelativePath: '.',
    });

    // Verify directory change and restore operations
    expect(mockChdir).toHaveBeenCalledTimes(2);
    expect(mockChdir).toHaveBeenNthCalledWith(1, mockGitRoot);
    expect(mockChdir).toHaveBeenNthCalledWith(2, expect.any(String)); // restoring original cwd

    expect(execSync).toHaveBeenCalledTimes(2);
    expect(execSync).toHaveBeenNthCalledWith(
      1,
      'git add .github/workflows/plugma-create-release.yml',
      { stdio: 'ignore' },
    );
    expect(execSync).toHaveBeenNthCalledWith(
      2,
      'git commit -m "chore: Add or update plugma-create-release.yml"',
      { stdio: 'ignore' },
    );
  });

  it('should skip files that are up to date', async () => {
    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock template files
    vi.mocked(fs.readdir).mockResolvedValueOnce(['test.yml'] as any);
    // Mock directory creation
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    // Mock file stats to indicate source is older
    vi.mocked(fs.stat)
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 1) } as any) // source
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 2) } as any); // dest is newer

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: false,
      copiedTemplates: [],
      releaseWorkflowPath,
      updatedTemplates: [],
      gitRoot: mockGitRoot,
      pluginRelativePath: '.',
    });

    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('should throw if template directory is not found', async () => {
    // Mock failed template directory check
    vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));

    await expect(workflowTemplates()).rejects.toThrow(
      new WorkflowTemplateError(
        `Template directory not found: ${templateDir}`,
        'TEMPLATE_NOT_FOUND',
      ),
    );
  });

  it('should handle git errors gracefully', async () => {
    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock template files
    vi.mocked(fs.readdir).mockResolvedValueOnce([
      'plugma-create-release.yml',
    ] as any);
    // Mock directory creation
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    // Mock file stats to indicate source is newer
    vi.mocked(fs.stat)
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 2) } as any) // source
      .mockResolvedValueOnce({ mtime: new Date(2024, 0, 1) } as any); // dest is older

    // Mock file read/write
    vi.mocked(fs.readFile).mockResolvedValue('template content');
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    // Mock git command failure
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('git error');
    });

    const result = await workflowTemplates();

    // Should still complete successfully
    expect(result).toEqual({
      templatesChanged: true,
      copiedTemplates: [],
      releaseWorkflowPath,
      updatedTemplates: ['plugma-create-release.yml'],
      gitRoot: mockGitRoot,
      pluginRelativePath: '.',
    });
  });

  it('should throw WorkflowTemplateError for filesystem errors', async () => {
    // Mock successful template directory check
    vi.mocked(fs.access).mockResolvedValueOnce(undefined);
    // Mock readdir failure
    vi.mocked(fs.readdir).mockRejectedValueOnce(new Error('filesystem error'));

    await expect(workflowTemplates()).rejects.toThrow(
      new WorkflowTemplateError(
        'Error managing workflow templates: filesystem error',
        'FILESYSTEM_ERROR',
      ),
    );
  });

  it('should throw WorkflowTemplateError when git root detection fails', async () => {
    // Mock git root detection failure
    vi.mocked(findGitRoot).mockImplementation(() => {
      throw new Error('not a git repository');
    });

    await expect(workflowTemplates()).rejects.toThrow(
      new WorkflowTemplateError(
        'Error managing workflow templates: not a git repository',
        'FILESYSTEM_ERROR',
      ),
    );
  });
});
