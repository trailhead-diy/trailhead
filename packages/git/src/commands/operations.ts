import { ok, err } from '@trailhead/core';
import { execSync } from 'node:child_process';
import type {
  GitCommandOperations,
  GitRepository,
  GitResult,
  GitCommitOptions,
  GitPushOptions,
  GitPullOptions,
  GitCheckoutOptions,
  GitBranchOptions,
  GitTagOptions,
  GitResetOptions,
  GitRevertOptions,
  GitMergeOptions,
  GitResetMode,
} from '../types.js';

// ========================================
// Git Command Operations
// ========================================

export const createGitCommandOperations = (): GitCommandOperations => {
  const add = async (repo: GitRepository, files: readonly string[]): Promise<GitResult<void>> => {
    try {
      const fileArgs = files.map(f => `"${f}"`).join(' ');
      execSync(`git add ${fileArgs}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      });

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'ADD_FAILED',
        message: `Failed to add files: ${files.join(', ')}`,
        suggestion: 'Check if the files exist and you have write permissions',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const commit = async (
    repo: GitRepository,
    message: string,
    options: GitCommitOptions = {}
  ): Promise<GitResult<string>> => {
    try {
      const args = ['commit', `-m "${message}"`];

      if (options.all) args.push('-a');
      if (options.amend) args.push('--amend');
      if (options.author) args.push(`--author="${options.author}"`);
      if (options.date) args.push(`--date="${options.date.toISOString()}"`);
      if (options.signoff) args.push('--signoff');
      if (options.gpgSign) args.push('--gpg-sign');

      const output = execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Extract commit SHA from output
      const match = output.match(/\[.*?\s([a-f0-9]+)\]/);
      const sha = match ? match[1] : '';

      return ok(sha);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'COMMIT_FAILED',
        message: 'Failed to create commit',
        suggestion: 'Check if there are staged changes and the message is valid',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const push = async (
    repo: GitRepository,
    options: GitPushOptions = {}
  ): Promise<GitResult<void>> => {
    try {
      const args = ['push'];

      if (options.force) args.push('--force');
      if (options.tags) args.push('--tags');
      if (options.upstream) args.push('--set-upstream');

      if (options.remote) {
        args.push(options.remote);
        if (options.branch) {
          args.push(options.branch);
        }
      }

      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      });

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'PUSH_FAILED',
        message: 'Failed to push changes',
        suggestion: 'Check network connection and remote repository permissions',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const pull = async (
    repo: GitRepository,
    options: GitPullOptions = {}
  ): Promise<GitResult<void>> => {
    try {
      const args = ['pull'];

      if (options.rebase) args.push('--rebase');
      if (options.ff === false) args.push('--no-ff');
      else if (options.ff === true) args.push('--ff-only');
      if (options.squash) args.push('--squash');

      if (options.remote) {
        args.push(options.remote);
        if (options.branch) {
          args.push(options.branch);
        }
      }

      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      });

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'PULL_FAILED',
        message: 'Failed to pull changes',
        suggestion: 'Check network connection and resolve any conflicts',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const checkout = async (
    repo: GitRepository,
    ref: string,
    options: GitCheckoutOptions = {}
  ): Promise<GitResult<void>> => {
    try {
      const args = ['checkout'];

      if (options.createBranch) args.push('-b');
      if (options.force) args.push('--force');
      if (options.track) args.push('--track');
      if (options.orphan) args.push('--orphan');

      args.push(ref);

      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      });

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'CHECKOUT_FAILED',
        message: `Failed to checkout ${ref}`,
        suggestion: 'Check if the ref exists and there are no uncommitted changes',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const branch = async (
    repo: GitRepository,
    name?: string,
    options: GitBranchOptions = {}
  ): Promise<GitResult<readonly string[]>> => {
    try {
      const args = ['branch'];

      if (options.remote) args.push('-r');
      if (options.merged) args.push('--merged');

      if (name) {
        if (options.create) args.push('-c', name);
        else if (options.delete) args.push('-d', name);
        else if (options.force && options.delete) args.push('-D', name);
        else args.push(name);
      }

      const output = execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const branches = output
        .split('\n')
        .map(line => line.replace(/^\*?\s*/, '').trim())
        .filter(line => line.length > 0);

      return ok(branches);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'BRANCH_FAILED',
        message: name ? `Failed to manage branch ${name}` : 'Failed to list branches',
        suggestion: 'Check if the branch name is valid and you have permissions',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const tag = async (
    repo: GitRepository,
    name?: string,
    options: GitTagOptions = {}
  ): Promise<GitResult<readonly string[]>> => {
    try {
      const args = ['tag'];

      if (name) {
        if (options.create) {
          if (options.annotated) args.push('-a');
          if (options.message) args.push('-m', `"${options.message}"`);
          if (options.force) args.push('-f');
          args.push(name);
        } else if (options.delete) {
          args.push('-d', name);
        }
      }

      const output = execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const tags = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      return ok(tags);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'TAG_FAILED',
        message: name ? `Failed to manage tag ${name}` : 'Failed to list tags',
        suggestion: 'Check if the tag name is valid and you have permissions',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const reset = async (
    repo: GitRepository,
    ref?: string,
    options: GitResetOptions = {}
  ): Promise<GitResult<void>> => {
    try {
      const args = ['reset'];

      if (options.mode) {
        args.push(`--${options.mode}`);
      }

      if (ref) {
        args.push(ref);
      }

      if (options.paths && options.paths.length > 0) {
        args.push('--', ...options.paths);
      }

      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      });

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'RESET_FAILED',
        message: `Failed to reset${ref ? ` to ${ref}` : ''}`,
        suggestion: 'Check if the ref exists and the reset mode is valid',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const revert = async (
    repo: GitRepository,
    sha: string,
    options: GitRevertOptions = {}
  ): Promise<GitResult<string>> => {
    try {
      const args = ['revert'];

      if (options.noCommit) args.push('--no-commit');
      if (options.mainline) args.push(`--mainline=${options.mainline}`);
      if (options.signoff) args.push('--signoff');

      args.push(sha);

      const output = execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Extract commit SHA from output
      const match = output.match(/\[.*?\s([a-f0-9]+)\]/);
      const revertSha = match ? match[1] : '';

      return ok(revertSha);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'REVERT_FAILED',
        message: `Failed to revert commit ${sha}`,
        suggestion: 'Check if the commit SHA exists and can be reverted',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const merge = async (
    repo: GitRepository,
    ref: string,
    options: GitMergeOptions = {}
  ): Promise<GitResult<void>> => {
    try {
      const args = ['merge'];

      if (options.strategy) args.push(`--strategy=${options.strategy}`);
      if (options.squash) args.push('--squash');
      if (options.noCommit) args.push('--no-commit');
      if (options.fastForward === false) args.push('--no-ff');
      else if (options.fastForward === true) args.push('--ff-only');

      args.push(ref);

      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      });

      return ok(undefined);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'MERGE_FAILED',
        message: `Failed to merge ${ref}`,
        suggestion: 'Check if the ref exists and resolve any conflicts',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  return {
    add,
    commit,
    push,
    pull,
    checkout,
    branch,
    tag,
    reset,
    revert,
    merge,
  };
};
