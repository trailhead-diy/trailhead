import { ok, err } from '@trailhead/core';
import { join, resolve } from 'node:path';
import { access, constants } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import type {
  GitOperations,
  GitRepository,
  GitResult,
  GitInitOptions,
  GitCloneOptions,
} from '../types.js';

// ========================================
// Git Operations
// ========================================

export const createGitOperations = (): GitOperations => {
  const init = async (
    path: string,
    options: GitInitOptions = {}
  ): Promise<GitResult<GitRepository>> => {
    try {
      const resolvedPath = resolve(path);

      // Build git init command
      const args = ['init'];
      if (options.bare) args.push('--bare');
      if (options.template) args.push(`--template=${options.template}`);
      if (options.separateGitDir) args.push(`--separate-git-dir=${options.separateGitDir}`);
      if (options.branch) args.push(`--initial-branch=${options.branch}`);

      // Execute git init
      const command = `git ${args.join(' ')} "${resolvedPath}"`;
      execSync(command, { stdio: 'pipe' });

      // Return repository info
      const repo = await createRepository(resolvedPath);
      return ok(repo);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'INIT_FAILED',
        message: `Failed to initialize Git repository at ${path}`,
        suggestion: 'Check if the path is valid and you have write permissions',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const clone = async (
    url: string,
    path: string,
    options: GitCloneOptions = {}
  ): Promise<GitResult<GitRepository>> => {
    try {
      const resolvedPath = resolve(path);

      // Build git clone command
      const args = ['clone'];
      if (options.branch) args.push(`--branch=${options.branch}`);
      if (options.depth) args.push(`--depth=${options.depth}`);
      if (options.recursive) args.push('--recursive');
      if (options.bare) args.push('--bare');
      if (options.mirror) args.push('--mirror');

      args.push(url, `"${resolvedPath}"`);

      // Execute git clone
      const command = `git ${args.join(' ')}`;
      execSync(command, { stdio: 'pipe' });

      // Return repository info
      const repo = await createRepository(resolvedPath);
      return ok(repo);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'CLONE_FAILED',
        message: `Failed to clone repository from ${url}`,
        suggestion: 'Check if the URL is valid and you have network access',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const open = async (path: string): Promise<GitResult<GitRepository>> => {
    try {
      const resolvedPath = resolve(path);
      const isRepo = await isRepository(resolvedPath);

      if (isRepo.isErr()) {
        return err({
          type: 'GitError',
          code: 'REPOSITORY_CHECK_FAILED',
          message: `Failed to check if ${path} is a repository`,
          suggestion: 'Check if the path exists and is accessible',
          cause: isRepo.error,
          recoverable: true,
        } as any);
      }

      if (!isRepo.value) {
        return err({
          type: 'GitError',
          code: 'NOT_A_REPOSITORY',
          message: `Path ${path} is not a Git repository`,
          suggestion: 'Initialize a repository or navigate to an existing one',
          recoverable: true,
        } as any);
      }

      const repo = await createRepository(resolvedPath);
      return ok(repo);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'OPEN_FAILED',
        message: `Failed to open Git repository at ${path}`,
        suggestion: 'Check if the path exists and is a valid Git repository',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const isRepository = async (path: string): Promise<GitResult<boolean>> => {
    try {
      const resolvedPath = resolve(path);
      const gitDir = join(resolvedPath, '.git');

      await access(gitDir, constants.F_OK);
      return ok(true);
    } catch {
      // Try to find .git directory in parent directories
      try {
        const result = execSync('git rev-parse --git-dir', {
          cwd: path,
          stdio: 'pipe',
        });
        return ok(!!result);
      } catch {
        return ok(false);
      }
    }
  };

  const getRepository = async (path: string): Promise<GitResult<GitRepository>> => {
    return open(path);
  };

  return {
    init,
    clone,
    open,
    isRepository,
    getRepository,
  };
};

// ========================================
// Helper Functions
// ========================================

const createRepository = async (path: string): Promise<GitRepository> => {
  const resolvedPath = resolve(path);

  try {
    // Get git directory
    const gitDirOutput = execSync('git rev-parse --git-dir', {
      cwd: resolvedPath,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    const gitDirectory = gitDirOutput.trim();

    // Get working directory (may fail for bare repositories)
    let workingDirectory = resolvedPath;
    try {
      const workingDirOutput = execSync('git rev-parse --show-toplevel', {
        cwd: resolvedPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      workingDirectory = workingDirOutput.trim();
    } catch {
      // Bare repository or other case where working directory doesn't exist
      workingDirectory = resolvedPath;
    }

    // Get current HEAD
    let head;
    try {
      const headOutput = execSync('git symbolic-ref HEAD', {
        cwd: resolvedPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      const branchName = headOutput.trim().replace('refs/heads/', '');

      const shaOutput = execSync('git rev-parse HEAD', {
        cwd: resolvedPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      const sha = shaOutput.trim();

      head = {
        name: branchName,
        sha,
        type: 'branch' as const,
      };
    } catch {
      // Repository might be empty or in detached HEAD state
      head = undefined;
    }

    return {
      path: resolvedPath,
      isValid: true,
      head,
      workingDirectory,
      gitDirectory: join(workingDirectory, gitDirectory),
    };
  } catch (error) {
    return {
      path: resolvedPath,
      isValid: false,
      workingDirectory: resolvedPath,
      gitDirectory: join(resolvedPath, '.git'),
    };
  }
};
