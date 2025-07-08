import { Result, Ok, Err, map, CLIError } from '../core/index.js';
import { executeGitCommandSimple, validateGitEnvironment } from './git-command.js';
import { createGitError } from './errors.js';
import type { MergeBaseInfo, GitOptions } from './types.js';

/**
 * Find the merge base (common ancestor) between two refs
 */
export async function getMergeBase(
  ref1: string,
  ref2: string,
  options: GitOptions = {}
): Promise<Result<string, CLIError>> {
  // Validate git environment first
  const validationResult = await validateGitEnvironment(options);
  if (!validationResult.success) {
    return validationResult;
  }

  return executeGitCommandSimple(['merge-base', ref1, ref2], options);
}

/**
 * Find all merge bases between two refs
 */
export async function getAllMergeBases(
  ref1: string,
  ref2: string,
  options: GitOptions = {}
): Promise<Result<string[], CLIError>> {
  // Validate git environment first
  const validationResult = await validateGitEnvironment(options);
  if (!validationResult.success) {
    return validationResult;
  }

  const result = await executeGitCommandSimple(['merge-base', '--all', ref1, ref2], options);
  return map(result, output => {
    return output.split('\n').filter(line => line.trim().length > 0);
  });
}

/**
 * Check if one ref is an ancestor of another using merge-base
 */
export async function isAncestorMergeBase(
  ancestor: string,
  descendant: string,
  options: GitOptions = {}
): Promise<Result<boolean, CLIError>> {
  // Validate git environment first
  const validationResult = await validateGitEnvironment(options);
  if (!validationResult.success) {
    return validationResult;
  }

  const result = await executeGitCommandSimple(
    ['merge-base', '--is-ancestor', ancestor, descendant],
    options
  );

  // git merge-base --is-ancestor returns 0 if ancestor, 1 if not, other codes for errors
  if (result.success) {
    return Ok(true);
  }

  // Check if it's just "not an ancestor" vs actual error by trying to get merge base
  const mergeBaseResult = await getMergeBase(ancestor, descendant, options);
  if (mergeBaseResult.success) {
    return Ok(false); // Has common ancestor but not direct ancestor
  }

  return Err(createGitError(`Failed to determine ancestor relationship`, result.error.message));
}

/**
 * Get comprehensive merge base information between two refs
 */
export async function getMergeBaseInfo(
  branch1: string,
  branch2: string,
  options: GitOptions = {}
): Promise<Result<MergeBaseInfo, CLIError>> {
  // Get the merge base commit
  const mergeBaseResult = await getMergeBase(branch1, branch2, options);
  if (!mergeBaseResult.success) {
    return Err(createGitError(`Failed to get merge base`, mergeBaseResult.error.message));
  }
  const commitSha = mergeBaseResult.value;

  // Check if branch1 is an ancestor of branch2
  const isAncestorResult = await isAncestorMergeBase(branch1, branch2, options);
  const isAncestor = isAncestorResult.success ? isAncestorResult.value : false;

  const info: MergeBaseInfo = {
    commitSha,
    branch1,
    branch2,
    isAncestor,
  };

  return Ok(info);
}

/**
 * Check if two refs have diverged (neither is ancestor of the other)
 */
export async function haveDiverged(
  ref1: string,
  ref2: string,
  options: GitOptions = {}
): Promise<Result<boolean, CLIError>> {
  const isRef1AncestorResult = await isAncestorMergeBase(ref1, ref2, options);
  const isRef2AncestorResult = await isAncestorMergeBase(ref2, ref1, options);

  // If either check failed, return error
  if (!isRef1AncestorResult.success) {
    return Err(
      createGitError(`Failed to check if ${ref1} is ancestor`, isRef1AncestorResult.error.message)
    );
  }
  if (!isRef2AncestorResult.success) {
    return Err(
      createGitError(`Failed to check if ${ref2} is ancestor`, isRef2AncestorResult.error.message)
    );
  }

  // Branches have diverged if neither is an ancestor of the other
  const diverged = !isRef1AncestorResult.value && !isRef2AncestorResult.value;
  return Ok(diverged);
}

/**
 * Get the commit message for a given SHA
 */
export async function getCommitMessage(
  commitSha: string,
  options: GitOptions = {}
): Promise<Result<string, CLIError>> {
  return executeGitCommandSimple(['log', '--format=%s', '-n', '1', commitSha], options);
}

/**
 * Get formatted merge base information with commit details
 */
export async function formatMergeBaseInfo(
  info: MergeBaseInfo,
  options: GitOptions = {}
): Promise<string> {
  const commitMessageResult = await getCommitMessage(info.commitSha, options);
  const commitMessage = commitMessageResult.success
    ? commitMessageResult.value
    : 'Unknown commit message';

  const shortSha = info.commitSha.substring(0, 8);
  const ancestorText = info.isAncestor ? ` (${info.branch1} is ancestor of ${info.branch2})` : '';

  return `Merge base: ${shortSha} "${commitMessage}"${ancestorText}`;
}
