import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowTemplateError, workflowTemplates } from '#tasks';

// Mock node modules
vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    copyFile: vi.fn(),
  },
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'node:child_process';
// Import after mocking
import fs from 'node:fs/promises';

describe('workflowTemplates', () => {
  const releaseWorkflowPath = path.join(
    process.cwd(),
    '.github',
    'workflows',
    'plugma-create-release.yml',
  );
  const templateDir = path.join(
    process.cwd(),
    'src',
    'tasks',
    'release',
    '../../../templates',
    'github',
    'workflows',
  );
  const githubDir = path.join(process.cwd(), '.github', 'workflows');
  const releaseFile = path.join(githubDir, 'plugma-create-release.yml');

  beforeEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it('should create .github/workflows directory if it does not exist', async () => {
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
    });

    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('.github/workflows'),
      { recursive: true },
    );
  });

  it('should copy new templates', async () => {
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

    // Mock file copy
    vi.mocked(fs.copyFile).mockResolvedValue(undefined);

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: true,
      copiedTemplates: ['test.yml', 'other.yml'],
      releaseWorkflowPath,
      updatedTemplates: [],
    });

    expect(fs.copyFile).toHaveBeenCalledTimes(2);
  });

  it('should update release workflow and commit changes', async () => {
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

    // Mock file copy
    vi.mocked(fs.copyFile).mockResolvedValue(undefined);
    // Mock git commands
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    const result = await workflowTemplates();

    expect(result).toEqual({
      templatesChanged: true,
      copiedTemplates: [],
      updatedTemplates: ['plugma-create-release.yml'],
      releaseWorkflowPath,
    });

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
    });

    expect(fs.copyFile).not.toHaveBeenCalled();
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

    // Mock file copy
    vi.mocked(fs.copyFile).mockResolvedValue(undefined);
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
});
