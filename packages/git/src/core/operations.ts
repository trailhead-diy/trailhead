import { ok, err, fromThrowable } from '@trailhead/core';
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
    const resolvedPath = resolve(path);

    // Build git init command
    const args = ['init'];
    if (options.bare) args.push('--bare');
    if (options.template) args.push(`--template=${options.template}`);
    if (options.separateGitDir) args.push(`--separate-git-dir=${options.separateGitDir}`);
    if (options.branch) args.push(`--initial-branch=${options.branch}`);

    // Execute git init
    const command = `git ${args.join(' ')} "${resolvedPath}"`;
    const safeExec = fromThrowable(() => execSync(command, { stdio: 'pipe' }));
    const result = safeExec();

    if (result.isErr()) {
      return err({
        type: 'GitError',
        code: 'INIT_FAILED',
        message: `Failed to initialize Git repository at ${path}`,
        suggestion: 'Check if the path is valid and you have write permissions',
        cause: result.error,
        recoverable: false,
      } as any);
    }

    // Return repository info
    const repo = await createRepository(resolvedPath);
    return ok(repo);
  };

  const clone = async (
    url: string,
    path: string,
    options: GitCloneOptions = {}
  ): Promise<GitResult<GitRepository>> => {
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
    const safeExec = fromThrowable(() => execSync(command, { stdio: 'pipe' }));
    const result = safeExec();

    if (result.isErr()) {
      return err({
        type: 'GitError',
        code: 'CLONE_FAILED',
        message: `Failed to clone repository from ${url}`,
        suggestion: 'Check if the URL is valid and you have network access',
        cause: result.error,
        recoverable: false,
      } as any);
    }

    // Return repository info
    const repo = await createRepository(resolvedPath);
    return ok(repo);
  };

  const open = async (path: string): Promise<GitResult<GitRepository>> => {
    const safeOpen = fromThrowable(async () => {
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
    });

    const result = await safeOpen();
    if (result.isErr()) {
      return err({
        type: 'GitError',
        code: 'OPEN_FAILED',
        message: `Failed to open Git repository at ${path}`,
        suggestion: 'Check if the path exists and is a valid Git repository',
        cause: result.error,
        recoverable: false,
      } as any);
    }

    return result.value;
  };

  const isRepository = async (path: string): Promise<GitResult<boolean>> => {
    const resolvedPath = resolve(path);
    const gitDir = join(resolvedPath, '.git');

    // First check for .git directory
    try {
      await access(gitDir, constants.F_OK);
      return ok(true);
    } catch {
      // .git directory doesn't exist, continue to git command check
    }

    // Try to find .git directory in parent directories using git command
    const safeGitCheck = fromThrowable(() =>
      execSync('git rev-parse --git-dir', {
        cwd: path,
        stdio: 'pipe',
      })
    );
    const gitResult = safeGitCheck();

    if (gitResult.isOk() && gitResult.value) {
      return ok(true);
    }

    return ok(false);
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

  const safeGitDir = fromThrowable(
    () =>
      execSync('git rev-parse --git-dir', {
        cwd: resolvedPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      }) as string
  );

  const gitDirResult = safeGitDir();
  if (gitDirResult.isErr()) {
    return {
      path: resolvedPath,
      isValid: false,
      workingDirectory: resolvedPath,
      gitDirectory: join(resolvedPath, '.git'),
    };
  }

  const gitDirectory = gitDirResult.value.trim();

  // Get working directory (may fail for bare repositories)
  let workingDirectory = resolvedPath;
  const safeWorkingDir = fromThrowable(
    () =>
      execSync('git rev-parse --show-toplevel', {
        cwd: resolvedPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      }) as string
  );

  const workingDirResult = safeWorkingDir();
  if (workingDirResult.isOk()) {
    workingDirectory = workingDirResult.value.trim();
  }

  // Get current HEAD
  let head;
  const safeHeadRef = fromThrowable(
    () =>
      execSync('git symbolic-ref HEAD', {
        cwd: resolvedPath,
        encoding: 'utf-8',
        stdio: 'pipe',
      }) as string
  );

  const headRefResult = safeHeadRef();
  if (headRefResult.isOk()) {
    const branchName = headRefResult.value.trim().replace('refs/heads/', '');

    const safeSha = fromThrowable(
      () =>
        execSync('git rev-parse HEAD', {
          cwd: resolvedPath,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    );

    const shaResult = safeSha();
    if (shaResult.isOk()) {
      const sha = shaResult.value.trim();
      head = {
        name: branchName,
        sha,
        type: 'branch' as const,
      };
    }
  }

  return {
    path: resolvedPath,
    isValid: true,
    head,
    workingDirectory,
    gitDirectory: join(workingDirectory, gitDirectory),
  };
};
