import { ok, err, fromThrowable } from '@trailhead/core';
import { execSync } from 'node:child_process';
import type {
  GitStatusOperations,
  GitRepository,
  GitResult,
  GitStatus,
  GitFileStatus,
  FileStatusType,
} from '../types.js';

// ========================================
// Git Status Operations
// ========================================

export const createGitStatusOperations = (): GitStatusOperations => {
  const getStatus = async (repo: GitRepository): Promise<GitResult<GitStatus>> => {
    const safeStatus = fromThrowable(
      () =>
        execSync('git status --porcelain=v2 -b', {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    );

    const result = safeStatus();
    if (result.isErr()) {
      return err({
        type: 'GitError',
        code: 'STATUS_FAILED',
        message: 'Failed to get repository status',
        suggestion: 'Check if the repository is valid and accessible',
        cause: result.error,
        recoverable: true,
      } as any);
    }

    const status = parseStatusOutput(result.value);
    return ok(status);
  };

  const isClean = async (repo: GitRepository): Promise<GitResult<boolean>> => {
    const statusResult = await getStatus(repo);
    if (statusResult.isErr()) {
      return err(statusResult.error);
    }

    return ok(statusResult.value.clean);
  };

  const hasChanges = async (repo: GitRepository): Promise<GitResult<boolean>> => {
    const statusResult = await getStatus(repo);
    if (statusResult.isErr()) {
      return err(statusResult.error);
    }

    const status = statusResult.value;
    const hasChanges =
      status.staged.length > 0 || status.modified.length > 0 || status.untracked.length > 0;

    return ok(hasChanges);
  };

  const getUntrackedFiles = async (repo: GitRepository): Promise<GitResult<readonly string[]>> => {
    const statusResult = await getStatus(repo);
    if (statusResult.isErr()) {
      return err(statusResult.error);
    }

    return ok(statusResult.value.untracked);
  };

  const getStagedFiles = async (
    repo: GitRepository
  ): Promise<GitResult<readonly GitFileStatus[]>> => {
    const statusResult = await getStatus(repo);
    if (statusResult.isErr()) {
      return err(statusResult.error);
    }

    return ok(statusResult.value.staged);
  };

  return {
    getStatus,
    isClean,
    hasChanges,
    getUntrackedFiles,
    getStagedFiles,
  };
};

// ========================================
// Helper Functions
// ========================================

const parseStatusOutput = (output: string): GitStatus => {
  const lines = output.split('\n').filter(line => line.length > 0);

  let branch = 'HEAD';
  let commit = '';
  let ahead = 0;
  let behind = 0;
  const staged: GitFileStatus[] = [];
  const modified: GitFileStatus[] = [];
  const untracked: string[] = [];

  for (const line of lines) {
    if (line.startsWith('# branch.head ')) {
      branch = line.substring('# branch.head '.length);
    } else if (line.startsWith('# branch.oid ')) {
      commit = line.substring('# branch.oid '.length);
    } else if (line.startsWith('# branch.ab ')) {
      const [aheadStr, behindStr] = line.substring('# branch.ab '.length).split(' ');
      ahead = parseInt(aheadStr, 10);
      behind = parseInt(behindStr, 10);
    } else if (line.startsWith('1 ')) {
      // Changed entries
      const parts = line.split('\t');
      let path: string;
      let statusParts: string[];

      if (parts.length > 1) {
        // Tab-separated format
        statusParts = parts[0].split(' ');
        path = parts[1];
      } else {
        // Space-separated format - path is the last part
        statusParts = parts[0].split(' ');
        path = statusParts[statusParts.length - 1];
      }

      const stagedStatus = statusParts[1][0];
      const modifiedStatus = statusParts[1][1];

      if (stagedStatus !== '.') {
        staged.push({
          path,
          status: parseFileStatus(stagedStatus),
        });
      }

      if (modifiedStatus !== '.') {
        modified.push({
          path,
          status: parseFileStatus(modifiedStatus),
        });
      }
    } else if (line.startsWith('2 ')) {
      // Renamed/copied entries
      const parts = line.split('\t');
      const statusParts = parts[0].split(' ');
      let oldPath: string;
      let newPath: string;

      if (parts.length > 2) {
        // Tab-separated format
        oldPath = parts[1];
        newPath = parts[2];
      } else {
        // Space-separated format - paths are the last two parts
        oldPath = statusParts[statusParts.length - 2];
        newPath = statusParts[statusParts.length - 1];
      }

      const stagedStatus = statusParts[1][0];

      if (stagedStatus !== '.') {
        staged.push({
          path: newPath,
          status: parseFileStatus(stagedStatus),
          oldPath,
        });
      }
    } else if (line.startsWith('? ')) {
      // Untracked files
      const path = line.substring(2);
      untracked.push(path);
    }
  }

  const clean = staged.length === 0 && modified.length === 0 && untracked.length === 0;

  return {
    branch,
    commit,
    ahead,
    behind,
    staged,
    modified,
    untracked,
    clean,
  };
};

const parseFileStatus = (status: string): FileStatusType => {
  switch (status) {
    case 'A':
      return 'added';
    case 'M':
      return 'modified';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case 'C':
      return 'copied';
    case 'U':
      return 'unmerged';
    case '?':
      return 'untracked';
    case '!':
      return 'ignored';
    default:
      return 'modified';
  }
};
