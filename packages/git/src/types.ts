import type { Result, CoreError } from '@esteban-url/core'

// ========================================
// Result Type Alias
// ========================================

export type GitResult<T> = Result<T, CoreError>

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
