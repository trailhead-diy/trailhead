import {
  Result,
  Ok,
  Err,
  map,
  chain,
  isOk,
  isErr,
  CLIError,
} from '../core/index.js';
import {
  executeGitCommandSimple,
  validateGitEnvironment,
} from './git-command.js';
import { createGitError } from './errors.js';
import type { BranchSyncStatus, GitOptions } from './types.js';

/**
 * Get the current branch name
 */
export async function getCurrentBranch(
  options: GitOptions = {},
): Promise<Result<string, CLIError>> {
  return executeGitCommandSimple(
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    options,
  );
}

/**
 * Fetch latest changes from remote
 */
export async function fetchRemote(
  remote = 'origin',
  options: GitOptions = {},
): Promise<Result<string, CLIError>> {
  return executeGitCommandSimple(['fetch', remote], options);
}

/**
 * Check if a branch exists locally
 */
export async function branchExists(
  branch: string,
  options: GitOptions = {},
): Promise<Result<boolean, CLIError>> {
  const result = await executeGitCommandSimple(
    ['rev-parse', '--verify', branch],
    options,
  );
  return map(result, () => true);
}

/**
 * Check if a remote branch exists
 */
export async function remoteBranchExists(
  remoteBranch: string,
  options: GitOptions = {},
): Promise<Result<boolean, CLIError>> {
  const result = await executeGitCommandSimple(
    ['rev-parse', '--verify', remoteBranch],
    options,
  );
  return map(result, () => true);
}

/**
 * Get the number of commits between two refs
 */
async function getCommitCount(
  from: string,
  to: string,
  options: GitOptions = {},
): Promise<Result<number, CLIError>> {
  const result = await executeGitCommandSimple(
    ['rev-list', '--count', `${from}..${to}`],
    options,
  );
  return map(result, (output) => {
    const count = parseInt(output.trim(), 10);
    if (isNaN(count)) {
      throw new Error(`Invalid commit count: ${output}`);
    }
    return count;
  });
}

/**
 * Check if one ref is an ancestor of another
 */
export async function isAncestor(
  ancestor: string,
  descendant: string,
  options: GitOptions = {},
): Promise<Result<boolean, CLIError>> {
  const result = await executeGitCommandSimple(
    ['merge-base', '--is-ancestor', ancestor, descendant],
    options,
  );

  // git merge-base --is-ancestor returns 0 if ancestor, 1 if not, other codes for errors
  if (result.success) {
    return Ok(true);
  }

  // Check if it's just "not an ancestor" vs actual error
  const commandResult = await executeGitCommandSimple(
    ['merge-base', ancestor, descendant],
    options,
  );
  if (commandResult.success) {
    return Ok(false); // Has common ancestor but not direct ancestor
  }

  return Err(
    createGitError(
      `Failed to determine ancestor relationship`,
      result.error.message,
    ),
  );
}

/**
 * Check branch synchronization status with remote
 */
export async function checkBranchSync(
  remoteBranch = 'origin/main',
  options: GitOptions = {},
): Promise<Result<BranchSyncStatus, CLIError>> {
  // Validate git environment first
  const validationResult = await validateGitEnvironment(options);
  if (!validationResult.success) {
    return validationResult;
  }

  // Get current branch
  const currentBranchResult = await getCurrentBranch(options);
  if (!currentBranchResult.success) {
    return Err(
      createGitError(
        `Failed to get current branch`,
        currentBranchResult.error.message,
      ),
    );
  }
  const currentBranch = currentBranchResult.value;

  // Fetch if requested
  if (options.fetch) {
    const remote = remoteBranch.split('/')[0];
    const fetchResult = await fetchRemote(remote, options);
    if (!fetchResult.success) {
      return Err(
        createGitError(
          `Failed to fetch from ${remote}`,
          fetchResult.error.message,
        ),
      );
    }
  }

  // Check if remote branch exists
  const remoteBranchExistsResult = await remoteBranchExists(
    remoteBranch,
    options,
  );
  if (!remoteBranchExistsResult.success) {
    return Err(createGitError(`Remote branch ${remoteBranch} does not exist`));
  }

  // Get ahead count (local commits not in remote)
  const aheadResult = await getCommitCount(
    remoteBranch,
    currentBranch,
    options,
  );
  if (!aheadResult.success) {
    return Err(
      createGitError(
        `Failed to count ahead commits`,
        aheadResult.error.message,
      ),
    );
  }
  const ahead = aheadResult.value;

  // Get behind count (remote commits not in local)
  const behindResult = await getCommitCount(
    currentBranch,
    remoteBranch,
    options,
  );
  if (!behindResult.success) {
    return Err(
      createGitError(
        `Failed to count behind commits`,
        behindResult.error.message,
      ),
    );
  }
  const behind = behindResult.value;

  // Check if can fast-forward (local is ancestor of remote)
  const canFastForwardResult = await isAncestor(
    currentBranch,
    remoteBranch,
    options,
  );
  const canFastForward = canFastForwardResult.success
    ? canFastForwardResult.value
    : false;

  const status: BranchSyncStatus = {
    currentBranch,
    remoteBranch,
    ahead,
    behind,
    isUpToDate: ahead === 0 && behind === 0,
    canFastForward: behind > 0 && canFastForward,
  };

  return Ok(status);
}

/**
 * Check if current branch is behind remote and needs sync
 */
export async function needsSync(
  remoteBranch = 'origin/main',
  options: GitOptions = {},
): Promise<Result<boolean, CLIError>> {
  return chain(await checkBranchSync(remoteBranch, options), (status) =>
    Ok(status.behind > 0),
  );
}

/**
 * Get a human-readable sync status message
 */
export function formatSyncStatus(status: BranchSyncStatus): string {
  if (status.isUpToDate) {
    return `Branch '${status.currentBranch}' is up to date with '${status.remoteBranch}'`;
  }

  const parts = [];
  if (status.ahead > 0) {
    parts.push(`${status.ahead} commit${status.ahead === 1 ? '' : 's'} ahead`);
  }
  if (status.behind > 0) {
    parts.push(
      `${status.behind} commit${status.behind === 1 ? '' : 's'} behind`,
    );
  }

  const statusText = parts.join(', ');
  let suggestion = '';

  if (status.behind > 0) {
    suggestion = status.canFastForward
      ? ` (can fast-forward with: git pull --rebase ${status.remoteBranch.split('/')[0]} ${status.remoteBranch.split('/')[1]})`
      : ` (merge required)`;
  }

  return `Branch '${status.currentBranch}' is ${statusText} compared to '${status.remoteBranch}'${suggestion}`;
}
