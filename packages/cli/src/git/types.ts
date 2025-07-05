/**
 * Git branch synchronization types and interfaces
 */

/**
 * Status of a branch compared to its remote tracking branch
 */
export interface BranchSyncStatus {
  /** Current local branch name */
  currentBranch: string;
  /** Remote branch being compared (typically 'origin/main') */
  remoteBranch: string;
  /** Number of commits local branch is ahead of remote */
  ahead: number;
  /** Number of commits local branch is behind remote */
  behind: number;
  /** Whether the branch is up to date with remote */
  isUpToDate: boolean;
  /** Whether the branch can be fast-forwarded */
  canFastForward: boolean;
}

/**
 * Git repository status information
 */
export interface GitStatus {
  /** Current branch name */
  currentBranch: string;
  /** Whether the working directory is clean */
  isClean: boolean;
  /** Number of staged files */
  staged: number;
  /** Number of modified files */
  modified: number;
  /** Number of untracked files */
  untracked: number;
}

/**
 * Git merge base information
 */
export interface MergeBaseInfo {
  /** The merge base commit SHA */
  commitSha: string;
  /** First branch in comparison */
  branch1: string;
  /** Second branch in comparison */
  branch2: string;
  /** Whether branch1 is an ancestor of branch2 */
  isAncestor: boolean;
}

/**
 * Options for git operations
 */
export interface GitOptions {
  /** Working directory for git commands */
  cwd?: string;
  /** Timeout in milliseconds for git operations */
  timeout?: number;
  /** Whether to fetch before checking status */
  fetch?: boolean;
}

/**
 * Git command execution result
 */
export interface GitCommandResult {
  /** Exit code of the command */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Command that was executed */
  command: string;
}
