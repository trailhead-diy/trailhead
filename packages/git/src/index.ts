// Core Git operations
export { createGitOperations } from './core/index.js'

// Status operations
export { createGitStatusOperations } from './status/index.js'

// Diff operations
export { createGitDiffOperations } from './diff/index.js'

// Command operations
export { createGitCommandOperations } from './commands/index.js'

// Types
export type {
  GitResult,
  GitRepository,
  GitRef,
  GitRefType,
  GitStatus,
  GitFileStatus,
  FileStatusType,
  GitDiff,
  DiffFile,
  DiffSummary,
  DiffHunk,
  DiffLine,
  DiffLineType,
  GitCommit,
  GitPerson,
  GitFileChange,
  GitOperations,
  GitStatusOperations,
  GitDiffOperations,
  GitCommandOperations,
  GitInitOptions,
  GitCloneOptions,
  GitDiffOptions,
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
  GitConfig,
  GitUserConfig,
  GitCoreConfig,
  GitRemoteConfig,
  GitBranchConfig,
} from './types.js'
