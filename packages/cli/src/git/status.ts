import { ok, err, Result } from 'neverthrow';
import type { CoreError } from '@trailhead/core';
import { executeGitCommandSimple, validateGitEnvironment } from './git-command.js';
import { createGitError } from './errors.js';
import type { GitOptions } from './types.js';

// Local interface for GitStatus to avoid confusion with GitStatusResult
interface GitStatus {
  currentBranch: string;
  isClean: boolean;
  staged: number;
  modified: number;
  untracked: number;
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(
  options: GitOptions = {}
): Promise<Result<string, CoreError>> {
  return executeGitCommandSimple(['rev-parse', '--abbrev-ref', 'HEAD'], options);
}

/**
 * Check if working directory is clean (no staged, modified, or untracked files)
 */
export async function isWorkingDirectoryClean(
  options: GitOptions = {}
): Promise<Result<boolean, CoreError>> {
  const result = await executeGitCommandSimple(['status', '--porcelain'], options);
  return result.map(output => output.trim().length === 0);
}

/**
 * Get detailed git repository status
 */
export async function getGitStatus(
  options: GitOptions = {}
): Promise<Result<GitStatus, CoreError>> {
  // Validate git environment first
  const validationResult = await validateGitEnvironment(options);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  // Get current branch
  const currentBranchResult = await getCurrentBranch(options);
  if (currentBranchResult.isErr()) {
    return err(createGitError(`Failed to get current branch`, currentBranchResult.error.message));
  }
  const currentBranch = currentBranchResult.value;

  // Get porcelain status
  const statusResult = await executeGitCommandSimple(['status', '--porcelain'], options);
  if (statusResult.isErr()) {
    return err(createGitError(`Failed to get git status`, statusResult.error.message));
  }

  const statusLines = statusResult.value
    .split('\n')
    .filter((line: string) => line.trim().length > 0);

  let staged = 0;
  let modified = 0;
  let untracked = 0;

  for (const line of statusLines) {
    if (line.length < 2) continue;

    const indexStatus = line[0];
    const workTreeStatus = line[1];

    // Check if file is staged (index has changes)
    if (indexStatus !== ' ' && indexStatus !== '?') {
      staged++;
    }

    // Check if file is modified in working tree
    if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
      modified++;
    }

    // Check if file is untracked
    if (indexStatus === '?' && workTreeStatus === '?') {
      untracked++;
    }
  }

  const isClean = staged === 0 && modified === 0 && untracked === 0;

  const status: GitStatus = {
    currentBranch,
    isClean,
    staged,
    modified,
    untracked,
  };

  return ok(status);
}

/**
 * Check if there are any uncommitted changes (staged or modified files)
 */
export async function hasUncommittedChanges(
  options: GitOptions = {}
): Promise<Result<boolean, CoreError>> {
  const statusResult = await getGitStatus(options);
  return statusResult.map(status => status.staged > 0 || status.modified > 0);
}

/**
 * Check if there are any untracked files
 */
export async function hasUntrackedFiles(
  options: GitOptions = {}
): Promise<Result<boolean, CoreError>> {
  const statusResult = await getGitStatus(options);
  return statusResult.map(status => status.untracked > 0);
}

/**
 * Get list of modified files
 */
export async function getModifiedFiles(
  options: GitOptions = {}
): Promise<Result<string[], CoreError>> {
  const result = await executeGitCommandSimple(['diff', '--name-only'], options);
  return result.map(output => {
    return output.split('\n').filter(line => line.trim().length > 0);
  });
}

/**
 * Get list of staged files
 */
export async function getStagedFiles(
  options: GitOptions = {}
): Promise<Result<string[], CoreError>> {
  const result = await executeGitCommandSimple(['diff', '--cached', '--name-only'], options);
  return result.map(output => {
    return output.split('\n').filter(line => line.trim().length > 0);
  });
}

/**
 * Get list of untracked files
 */
export async function getUntrackedFiles(
  options: GitOptions = {}
): Promise<Result<string[], CoreError>> {
  const result = await executeGitCommandSimple(
    ['ls-files', '--others', '--exclude-standard'],
    options
  );
  return result.map(output => {
    return output.split('\n').filter(line => line.trim().length > 0);
  });
}

/**
 * Format git status into a human-readable string
 */
export function formatGitStatus(status: GitStatus): string {
  if (status.isClean) {
    return `On branch '${status.currentBranch}' - working directory clean`;
  }

  const parts = [`On branch '${status.currentBranch}'`];

  if (status.staged > 0) {
    parts.push(`${status.staged} staged file${status.staged === 1 ? '' : 's'}`);
  }

  if (status.modified > 0) {
    parts.push(`${status.modified} modified file${status.modified === 1 ? '' : 's'}`);
  }

  if (status.untracked > 0) {
    parts.push(`${status.untracked} untracked file${status.untracked === 1 ? '' : 's'}`);
  }

  return parts.join(', ');
}
