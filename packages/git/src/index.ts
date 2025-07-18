// Core Git operations
export { createGitOperations } from './core/index.js'

// Status operations
export { createGitStatusOperations } from './status/index.js'

// Diff operations
export { createGitDiffOperations } from './diff/index.js'

// Command operations
export { createGitCommandOperations } from './commands/index.js'

// Log operations
export { createGitLogOperations } from './log/index.js'
export type { GitLogOperations } from './log/index.js'

// Config operations
export { createGitConfigOperations } from './config/index.js'
export type { GitConfigOperations } from './config/index.js'

// Remote operations
export { createGitRemoteOperations } from './remote/index.js'
export type { GitRemoteOperations } from './remote/index.js'

// Stash operations
export { createGitStashOperations } from './stash/index.js'
export type { GitStashOperations } from './stash/index.js'

// Staging operations
export { createGitStagingOperations } from './staging/index.js'
export type { GitStagingOperations } from './staging/index.js'

// Validation operations
export { createGitValidationOperations } from './validation/index.js'
export type { GitValidationOperations } from './validation/index.js'

// Hook operations
export { createGitHookOperations } from './hooks/index.js'
export type { GitHookOperations } from './hooks/index.js'

// Exclusion operations
export { createGitExclusionOperations } from './exclusion/index.js'
export type { GitExclusionOperations } from './exclusion/index.js'

// Error factories
export { createGitError, createGitErrors } from './errors.js'

// Types
export type {
  GitError,
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
  GitBranchSyncStatus,
  GitBranchSyncOptions,
  // New types for enhanced operations
  GitLogOptions,
  GitLogFormat,
  GitCommitInfo,
  GitStash,
  GitStashOptions,
  GitStashApplyOptions,
  GitRemote,
  GitRemoteOptions,
  GitFetchOptions,
  GitRebaseOptions,
  GitCherryPickOptions,
  GitBisectOptions,
  GitCleanOptions,
  GitConfigOptions,
  GitConfigScope,
  GitConfigType,
  GitConfigEntry,
  GitBlame,
  GitBlameLine,
  GitBlameOptions,
  DiffStat,
  FileChangeMap,
  FilePatch,
  TypeScriptCacheInfo,
  ConflictPreview,
  ConflictInfo,
  ConflictSection,
  ValidationResult,
  IntegrityResult,
  ExclusionResult,
  FileState,
  StagingResult,
  StagingPreview,
  HookInfo,
  HookValidationResult,
  CommitResult,
} from './types.js'
