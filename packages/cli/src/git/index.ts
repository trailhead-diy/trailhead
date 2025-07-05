/**
 * Git utilities for branch synchronization and repository management
 *
 * This module provides zero-dependency git utilities using Node.js child_process
 * and functional programming patterns with Result types.
 */

// Git error utilities
export { createGitError } from './errors.js';

// Git command execution
export {
  executeGitCommand,
  executeGitCommandSimple,
  validateGitEnvironment,
} from './git-command.js';

// Branch synchronization
export {
  getCurrentBranch,
  fetchRemote,
  branchExists,
  remoteBranchExists,
  isAncestor,
  checkBranchSync,
  needsSync,
  formatSyncStatus,
} from './branch-sync.js';

// Merge base operations
export {
  getMergeBase,
  getAllMergeBases,
  isAncestorMergeBase,
  getMergeBaseInfo,
  haveDiverged,
  getCommitMessage,
  formatMergeBaseInfo,
} from './merge-base.js';

// Repository status
export {
  getCurrentBranch as getStatusCurrentBranch,
  isWorkingDirectoryClean,
  getGitStatus,
  hasUncommittedChanges,
  hasUntrackedFiles,
  getModifiedFiles,
  getStagedFiles,
  getUntrackedFiles,
  formatGitStatus,
} from './status.js';

// Types
export type {
  BranchSyncStatus,
  GitStatus,
  MergeBaseInfo,
  GitOptions,
  GitCommandResult,
} from './types.js';
