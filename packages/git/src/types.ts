import type { Result, CoreError } from '@esteban-url/core'

// ========================================
// Git Error Types
// ========================================

export interface GitError extends CoreError {
  readonly type: 'GitError'
  readonly gitCode?: string
  readonly gitOutput?: string
  readonly workingDirectory?: string
}

// ========================================
// Result Type - Use standard Result<T, CoreError>
// ========================================

export type GitResult<T> = Result<T, GitError>

// ========================================
// Git Repository Types
// ========================================

export interface GitRepository {
  readonly path: string
  readonly isValid: boolean
  readonly head?: GitRef
  readonly workingDirectory: string
  readonly gitDirectory: string
}

export interface GitRef {
  readonly name: string
  readonly sha: string
  readonly type: GitRefType
}

export type GitRefType = 'branch' | 'tag' | 'commit'

// ========================================
// Git Status Types
// ========================================

export interface GitStatus {
  readonly branch: string
  readonly commit: string
  readonly ahead: number
  readonly behind: number
  readonly staged: readonly GitFileStatus[]
  readonly modified: readonly GitFileStatus[]
  readonly untracked: readonly string[]
  readonly clean: boolean
}

export interface GitFileStatus {
  readonly path: string
  readonly status: FileStatusType
  readonly oldPath?: string
}

export type FileStatusType =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'unmerged'
  | 'untracked'
  | 'ignored'

// ========================================
// Git Diff Types
// ========================================

export interface GitDiff {
  readonly files: readonly DiffFile[]
  readonly summary: DiffSummary
}

export interface DiffFile {
  readonly path: string
  readonly oldPath?: string
  readonly status: FileStatusType
  readonly hunks: readonly DiffHunk[]
  readonly binary: boolean
  readonly similarity?: number
}

export interface DiffHunk {
  readonly oldStart: number
  readonly oldLines: number
  readonly newStart: number
  readonly newLines: number
  readonly header: string
  readonly lines: readonly DiffLine[]
}

export interface DiffLine {
  readonly type: DiffLineType
  readonly content: string
  readonly oldLineNumber?: number
  readonly newLineNumber?: number
}

export type DiffLineType = 'context' | 'addition' | 'deletion' | 'no-newline'

export interface DiffSummary {
  readonly totalFiles: number
  readonly insertions: number
  readonly deletions: number
  readonly binary: number
}

// ========================================
// Git Log Types
// ========================================

export interface GitCommit {
  readonly sha: string
  readonly author: GitPerson
  readonly committer: GitPerson
  readonly date: Date
  readonly message: string
  readonly parents: readonly string[]
  readonly files?: readonly GitFileChange[]
}

export interface GitPerson {
  readonly name: string
  readonly email: string
  readonly date: Date
}

export interface GitFileChange {
  readonly path: string
  readonly oldPath?: string
  readonly status: FileStatusType
  readonly insertions: number
  readonly deletions: number
}

// ========================================
// Git Operations Types
// ========================================

export interface GitOperations {
  readonly init: (path: string, options?: GitInitOptions) => Promise<GitResult<GitRepository>>
  readonly clone: (
    url: string,
    path: string,
    options?: GitCloneOptions
  ) => Promise<GitResult<GitRepository>>
  readonly open: (path: string) => Promise<GitResult<GitRepository>>
  readonly isRepository: (path: string) => Promise<GitResult<boolean>>
  readonly getRepository: (path: string) => Promise<GitResult<GitRepository>>
}

export interface GitStatusOperations {
  readonly getStatus: (repo: GitRepository) => Promise<GitResult<GitStatus>>
  readonly isClean: (repo: GitRepository) => Promise<GitResult<boolean>>
  readonly hasChanges: (repo: GitRepository) => Promise<GitResult<boolean>>
  readonly getUntrackedFiles: (repo: GitRepository) => Promise<GitResult<readonly string[]>>
  readonly getStagedFiles: (repo: GitRepository) => Promise<GitResult<readonly GitFileStatus[]>>
  readonly getModifiedFiles: (repo: GitRepository) => Promise<GitResult<readonly GitFileStatus[]>>
  readonly getConflictedFiles: (repo: GitRepository) => Promise<GitResult<readonly string[]>>
  readonly getIgnoredFiles: (repo: GitRepository) => Promise<GitResult<readonly string[]>>
  readonly checkBranchSync: (
    repo: GitRepository,
    targetBranch: string,
    options?: GitBranchSyncOptions
  ) => Promise<GitResult<GitBranchSyncStatus>>
  readonly formatSyncStatus: (status: GitBranchSyncStatus) => string
}

export interface GitDiffOperations {
  readonly getDiff: (repo: GitRepository, options?: GitDiffOptions) => Promise<GitResult<GitDiff>>
  readonly getDiffSummary: (
    repo: GitRepository,
    options?: GitDiffOptions
  ) => Promise<GitResult<DiffSummary>>
  readonly getFileDiff: (
    repo: GitRepository,
    path: string,
    options?: GitDiffOptions
  ) => Promise<GitResult<DiffFile>>
  readonly getDiffFiles: (
    repo: GitRepository,
    options?: GitDiffOptions
  ) => Promise<GitResult<readonly DiffFile[]>>
  readonly getDiffBetweenCommits: (
    repo: GitRepository,
    from: string,
    to: string,
    options?: GitDiffOptions
  ) => Promise<GitResult<GitDiff>>
  readonly getDiffStats: (
    repo: GitRepository,
    options?: GitDiffOptions
  ) => Promise<GitResult<DiffStat>>
  readonly getBlame: (
    repo: GitRepository,
    path: string,
    options?: GitBlameOptions
  ) => Promise<GitResult<GitBlame>>
  readonly getChangedFilesByType: (
    repo: GitRepository,
    options?: GitDiffOptions
  ) => Promise<GitResult<FileChangeMap>>
}

export interface GitCommandOperations {
  readonly add: (repo: GitRepository, files: readonly string[]) => Promise<GitResult<void>>
  readonly commit: (
    repo: GitRepository,
    message: string,
    options?: GitCommitOptions
  ) => Promise<GitResult<string>>
  readonly push: (repo: GitRepository, options?: GitPushOptions) => Promise<GitResult<void>>
  readonly pull: (repo: GitRepository, options?: GitPullOptions) => Promise<GitResult<void>>
  readonly checkout: (
    repo: GitRepository,
    ref: string,
    options?: GitCheckoutOptions
  ) => Promise<GitResult<void>>
  readonly branch: (
    repo: GitRepository,
    name?: string,
    options?: GitBranchOptions
  ) => Promise<GitResult<readonly string[]>>
  readonly tag: (
    repo: GitRepository,
    name?: string,
    options?: GitTagOptions
  ) => Promise<GitResult<readonly string[]>>
  readonly reset: (
    repo: GitRepository,
    ref?: string,
    options?: GitResetOptions
  ) => Promise<GitResult<void>>
  readonly revert: (
    repo: GitRepository,
    sha: string,
    options?: GitRevertOptions
  ) => Promise<GitResult<string>>
  readonly merge: (
    repo: GitRepository,
    ref: string,
    options?: GitMergeOptions
  ) => Promise<GitResult<void>>
  readonly fetch: (repo: GitRepository, options?: GitFetchOptions) => Promise<GitResult<void>>
  readonly rebase: (
    repo: GitRepository,
    onto?: string,
    options?: GitRebaseOptions
  ) => Promise<GitResult<void>>
  readonly cherryPick: (
    repo: GitRepository,
    commit: string,
    options?: GitCherryPickOptions
  ) => Promise<GitResult<void>>
  readonly bisect: (repo: GitRepository, options: GitBisectOptions) => Promise<GitResult<void>>
  readonly clean: (repo: GitRepository, options?: GitCleanOptions) => Promise<GitResult<void>>
  readonly createCommit: (
    repo: GitRepository,
    message: string,
    options?: GitCommitOptions
  ) => Promise<GitResult<string>>
  readonly amendCommit: (
    repo: GitRepository,
    message?: string,
    options?: GitCommitOptions
  ) => Promise<GitResult<void>>
}

// ========================================
// Git Options Types
// ========================================

export interface GitInitOptions {
  readonly bare?: boolean
  readonly template?: string
  readonly separateGitDir?: string
  readonly branch?: string
}

export interface GitCloneOptions {
  readonly branch?: string
  readonly depth?: number
  readonly recursive?: boolean
  readonly bare?: boolean
  readonly mirror?: boolean
}

export interface GitDiffOptions {
  readonly cached?: boolean
  readonly staged?: boolean
  readonly ref?: string
  readonly base?: string
  readonly context?: number
  readonly ignoreWhitespace?: boolean
  readonly paths?: readonly string[]
}

export interface GitCommitOptions {
  readonly all?: boolean
  readonly amend?: boolean
  readonly author?: string
  readonly date?: Date
  readonly signoff?: boolean
  readonly gpgSign?: boolean
}

export interface GitPushOptions {
  readonly remote?: string
  readonly branch?: string
  readonly force?: boolean
  readonly tags?: boolean
  readonly upstream?: boolean
}

export interface GitPullOptions {
  readonly remote?: string
  readonly branch?: string
  readonly rebase?: boolean
  readonly ff?: boolean
  readonly squash?: boolean
}

export interface GitCheckoutOptions {
  readonly createBranch?: boolean
  readonly force?: boolean
  readonly track?: boolean
  readonly orphan?: boolean
}

export interface GitBranchOptions {
  readonly create?: boolean
  readonly delete?: boolean
  readonly force?: boolean
  readonly remote?: boolean
  readonly merged?: boolean
}

export interface GitTagOptions {
  readonly create?: boolean
  readonly delete?: boolean
  readonly annotated?: boolean
  readonly message?: string
  readonly force?: boolean
}

export interface GitResetOptions {
  readonly mode?: GitResetMode
  readonly paths?: readonly string[]
}

export type GitResetMode = 'soft' | 'mixed' | 'hard'

export interface GitRevertOptions {
  readonly noCommit?: boolean
  readonly mainline?: number
  readonly signoff?: boolean
}

export interface GitMergeOptions {
  readonly strategy?: string
  readonly squash?: boolean
  readonly noCommit?: boolean
  readonly fastForward?: boolean
}

// ========================================
// Git Configuration Types
// ========================================

export interface GitConfig {
  readonly user?: GitUserConfig
  readonly core?: GitCoreConfig
  readonly remote?: Record<string, GitRemoteConfig>
  readonly branch?: Record<string, GitBranchConfig>
}

export interface GitUserConfig {
  readonly name?: string
  readonly email?: string
  readonly signingKey?: string
}

export interface GitCoreConfig {
  readonly editor?: string
  readonly autocrlf?: boolean | 'input'
  readonly ignoreCase?: boolean
  readonly fileMode?: boolean
}

export interface GitRemoteConfig {
  readonly url: string
  readonly fetch?: string
  readonly pushUrl?: string
}

export interface GitBranchConfig {
  readonly remote?: string
  readonly merge?: string
  readonly rebase?: boolean
}

// ========================================
// Git Branch Sync Types
// ========================================

export interface GitBranchSyncStatus {
  readonly currentBranch: string
  readonly targetBranch: string
  readonly ahead: number
  readonly behind: number
  readonly isUpToDate: boolean
  readonly diverged: boolean
  readonly lastFetch?: Date
}

export interface GitBranchSyncOptions {
  readonly fetch?: boolean
  readonly timeout?: number
}

// ========================================
// Git Log Types (Enhanced)
// ========================================

export interface GitLogOptions {
  readonly limit?: number
  readonly since?: Date
  readonly until?: Date
  readonly author?: string
  readonly grep?: string
  readonly format?: GitLogFormat
  readonly paths?: readonly string[]
  readonly firstParent?: boolean
  readonly reverse?: boolean
  readonly follow?: boolean
}

export type GitLogFormat =
  | 'oneline'
  | 'short'
  | 'medium'
  | 'full'
  | 'fuller'
  | 'reference'
  | 'email'
  | 'raw'

export interface GitCommitInfo extends GitCommit {
  readonly stats?: DiffSummary
  readonly body?: string
  readonly refs?: readonly string[]
}

// ========================================
// Git Stash Types
// ========================================

export interface GitStash {
  readonly index: number
  readonly id: string
  readonly message: string
  readonly branch: string
  readonly date: Date
  readonly author: GitPerson
}

export interface GitStashOptions {
  readonly includeUntracked?: boolean
  readonly keepIndex?: boolean
  readonly message?: string
  readonly all?: boolean
}

export interface GitStashApplyOptions {
  readonly index?: boolean
  readonly reinstateIndex?: boolean
}

// ========================================
// Git Remote Types
// ========================================

export interface GitRemote {
  readonly name: string
  readonly url: string
  readonly pushUrl?: string
  readonly type: 'fetch' | 'push' | 'both'
}

export interface GitRemoteOptions {
  readonly tags?: boolean
  readonly branches?: readonly string[]
}

export interface GitFetchOptions {
  readonly remote?: string
  readonly branch?: string
  readonly prune?: boolean
  readonly tags?: boolean
  readonly depth?: number
  readonly all?: boolean
}

// ========================================
// Git Advanced Command Types
// ========================================

export interface GitRebaseOptions {
  readonly onto?: string
  readonly interactive?: boolean
  readonly preserve?: boolean
  readonly autosquash?: boolean
  readonly continue?: boolean
  readonly abort?: boolean
  readonly skip?: boolean
}

export interface GitCherryPickOptions {
  readonly noCommit?: boolean
  readonly edit?: boolean
  readonly signoff?: boolean
  readonly mainline?: number
  readonly strategy?: string
}

export interface GitBisectOptions {
  readonly command: 'start' | 'bad' | 'good' | 'skip' | 'reset'
  readonly commit?: string
  readonly bad?: string
  readonly good?: string
}

export interface GitCleanOptions {
  readonly directories?: boolean
  readonly force?: boolean
  readonly ignored?: boolean
  readonly excludePattern?: string
  readonly dryRun?: boolean
}

// ========================================
// Git Config Types (Enhanced)
// ========================================

export interface GitConfigOptions {
  readonly scope?: GitConfigScope
  readonly type?: GitConfigType
}

export type GitConfigScope = 'system' | 'global' | 'local' | 'worktree'
export type GitConfigType = 'bool' | 'int' | 'bool-or-int' | 'path' | 'expiry-date' | 'color'

export interface GitConfigEntry {
  readonly key: string
  readonly value: string | boolean | number
  readonly scope: GitConfigScope
  readonly file?: string
}

// ========================================
// Git Blame Types
// ========================================

export interface GitBlame {
  readonly lines: readonly GitBlameLine[]
  readonly commits: Record<string, GitCommit>
}

export interface GitBlameLine {
  readonly lineNumber: number
  readonly content: string
  readonly commit: string
  readonly author: GitPerson
  readonly originalLineNumber: number
  readonly finalLineNumber: number
}

export interface GitBlameOptions {
  readonly startLine?: number
  readonly endLine?: number
  readonly reverse?: boolean
  readonly firstParent?: boolean
}

// ========================================
// Enhanced Diff Types from Issue #137
// ========================================

export interface DiffFile {
  readonly path: string
  readonly oldPath?: string
  readonly status: FileStatusType
  readonly hunks: readonly DiffHunk[]
  readonly binary: boolean
  readonly similarity?: number
  readonly insertions: number
  readonly deletions: number
}

export interface DiffStat {
  readonly filesChanged: number
  readonly insertions: number
  readonly deletions: number
}

export interface FileChangeMap {
  readonly added: readonly string[]
  readonly modified: readonly string[]
  readonly deleted: readonly string[]
  readonly renamed: ReadonlyArray<{ from: string; to: string }>
}

export interface FilePatch {
  readonly path: string
  readonly ranges: ReadonlyArray<{ start: number; end: number }>
}

// ========================================
// TypeScript Cache Types from Issue #137
// ========================================

export interface TypeScriptCacheInfo {
  readonly buildInfoFiles: readonly string[]
  readonly cleared: boolean
  readonly warnings: readonly string[]
}

export interface ConflictPreview {
  readonly conflictFiles: readonly string[]
  readonly canRestoreSafely: boolean
  readonly resolutionStrategy: 'manual' | 'skip' | 'force'
}

export interface ConflictInfo {
  readonly path: string
  readonly type: 'content' | 'rename' | 'delete'
  readonly sections: readonly ConflictSection[]
}

export interface ConflictSection {
  readonly startLine: number
  readonly endLine: number
  readonly ourContent: readonly string[]
  readonly theirContent: readonly string[]
}

export interface ValidationResult {
  readonly command: string
  readonly exitCode: number
  readonly output: string
  readonly passed: boolean
  readonly duration: number
}

export interface IntegrityResult {
  readonly typesValid: boolean
  readonly lintPassed: boolean
  readonly testsPassed?: boolean
  readonly isValid: boolean
  readonly errors: readonly string[]
}

// ========================================
// File Exclusion Types from Issue #137
// ========================================

export interface ExclusionResult {
  readonly excludedFiles: readonly string[]
  readonly preservedState: readonly FileState[]
  readonly operationAppliedTo: readonly string[]
  readonly conflicts: readonly string[]
}

export interface FileState {
  readonly path: string
  readonly content: string
  readonly mode: string
  readonly hash: string
}

export interface StagingResult {
  readonly stagedFiles: readonly string[]
  readonly skippedFiles: readonly string[]
  readonly errors: readonly string[]
}

export interface StagingPreview {
  readonly toBeStaged: readonly string[]
  readonly toBeExcluded: readonly string[]
  readonly conflicts: readonly string[]
  readonly sizeImpact: number
}

export interface HookInfo {
  readonly name: string
  readonly command: string
  readonly canBypass: boolean
  readonly estimatedDuration: number
  readonly failureRecovery: 'rollback' | 'continue' | 'manual'
}

export interface HookValidationResult {
  readonly hooksPassed: boolean
  readonly failedHooks: readonly string[]
  readonly canProceedWithBypass: boolean
  readonly suggestedAction: 'commit' | 'bypass' | 'fix' | 'abort'
}

export interface CommitResult {
  readonly sha: string
  readonly message: string
  readonly filesChanged: number
  readonly hooksRun: readonly string[]
}
