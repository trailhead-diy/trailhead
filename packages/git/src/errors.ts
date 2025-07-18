import { createCoreError } from '@esteban-url/core'
import type { GitError } from './types.js'

/**
 * Factory function for creating Git-specific errors
 */
export const createGitError = (
  code: string,
  message: string,
  operation: string,
  options?: {
    details?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean
    context?: Record<string, unknown>
    gitCode?: string
    gitOutput?: string
    workingDirectory?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }
): GitError => {
  const coreError = createCoreError('GitError', code, message, {
    component: 'git',
    operation,
    severity: options?.severity ?? 'medium',
    details: options?.details,
    cause: options?.cause,
    suggestion: options?.suggestion,
    recoverable: options?.recoverable ?? false,
    context: options?.context,
  })

  return {
    ...coreError,
    type: 'GitError',
    gitCode: options?.gitCode,
    gitOutput: options?.gitOutput,
    workingDirectory: options?.workingDirectory,
  }
}

/**
 * Convenience factories for common Git error scenarios
 */
export const createGitErrors = {
  initFailed: (path: string, cause?: unknown): GitError =>
    createGitError('INIT_FAILED', `Failed to initialize Git repository at ${path}`, 'init', {
      cause,
      suggestion: 'Check if the path is valid and you have write permissions',
      recoverable: false,
      context: { path },
      severity: 'high',
    }),

  cloneFailed: (url: string, path: string, cause?: unknown): GitError =>
    createGitError('CLONE_FAILED', `Failed to clone repository from ${url} to ${path}`, 'clone', {
      cause,
      suggestion: 'Check if the URL is valid and you have network connectivity',
      recoverable: true,
      context: { url, path },
      severity: 'medium',
    }),

  commandFailed: (command: string, output: string, cause?: unknown): GitError =>
    createGitError('COMMAND_FAILED', `Git command failed: ${command}`, 'exec', {
      cause,
      suggestion: 'Check git installation and repository state',
      recoverable: true,
      gitOutput: output,
      context: { command },
      severity: 'medium',
    }),

  repositoryNotFound: (path: string): GitError =>
    createGitError('REPOSITORY_NOT_FOUND', `Git repository not found at ${path}`, 'detect', {
      suggestion: 'Initialize a repository with git init or check the path',
      recoverable: true,
      context: { path },
      severity: 'low',
    }),

  statusFailed: (path: string, cause?: unknown): GitError =>
    createGitError(
      'STATUS_FAILED',
      `Failed to get git status for repository at ${path}`,
      'status',
      {
        cause,
        suggestion: 'Check if the repository is in a valid state',
        recoverable: true,
        workingDirectory: path,
        context: { path },
        severity: 'medium',
      }
    ),

  diffFailed: (path: string, cause?: unknown): GitError =>
    createGitError('DIFF_FAILED', `Failed to get git diff for repository at ${path}`, 'diff', {
      cause,
      suggestion: 'Check if the repository is in a valid state',
      recoverable: true,
      workingDirectory: path,
      context: { path },
      severity: 'medium',
    }),

  repositoryCheckFailed: (path: string, cause?: unknown): GitError =>
    createGitError(
      'REPOSITORY_CHECK_FAILED',
      `Failed to check if ${path} is a repository`,
      'open',
      {
        cause,
        suggestion: 'Check if the path exists and is accessible',
        recoverable: true,
        context: { path },
        severity: 'medium',
      }
    ),

  notARepository: (path: string): GitError =>
    createGitError('NOT_A_REPOSITORY', `Path ${path} is not a Git repository`, 'open', {
      suggestion: 'Initialize a repository or navigate to an existing one',
      recoverable: true,
      context: { path },
      severity: 'low',
    }),

  openFailed: (path: string, cause?: unknown): GitError =>
    createGitError('OPEN_FAILED', `Failed to open Git repository at ${path}`, 'open', {
      cause,
      suggestion: 'Check if the path exists and is a valid Git repository',
      recoverable: false,
      context: { path },
      severity: 'high',
    }),

  // Log operations errors
  logFailed: (path: string, cause?: unknown): GitError =>
    createGitError('LOG_FAILED', `Failed to get git log for repository at ${path}`, 'log', {
      cause,
      suggestion: 'Check if the repository has any commits',
      recoverable: true,
      workingDirectory: path,
      context: { path },
      severity: 'medium',
    }),

  // Stash operations errors
  stashFailed: (operation: string, cause?: unknown): GitError =>
    createGitError('STASH_FAILED', `Failed to ${operation} stash`, 'stash', {
      cause,
      suggestion: 'Check if repository is in a clean state for stashing',
      recoverable: true,
      context: { operation },
      severity: 'medium',
    }),

  stashConflict: (files: readonly string[]): GitError =>
    createGitError('STASH_CONFLICT', 'Stash application would cause conflicts', 'stash', {
      suggestion: 'Resolve conflicts manually or use force option',
      recoverable: true,
      context: { conflictFiles: files },
      severity: 'medium',
    }),

  // Remote operations errors
  remoteFailed: (operation: string, remote: string, cause?: unknown): GitError =>
    createGitError('REMOTE_FAILED', `Failed to ${operation} remote '${remote}'`, 'remote', {
      cause,
      suggestion: 'Check remote configuration and network connectivity',
      recoverable: true,
      context: { operation, remote },
      severity: 'medium',
    }),

  fetchFailed: (remote: string, cause?: unknown): GitError =>
    createGitError('FETCH_FAILED', `Failed to fetch from remote '${remote}'`, 'fetch', {
      cause,
      suggestion: 'Check network connectivity and remote URL',
      recoverable: true,
      context: { remote },
      severity: 'medium',
    }),

  // Config operations errors
  configFailed: (operation: string, key: string, cause?: unknown): GitError =>
    createGitError('CONFIG_FAILED', `Failed to ${operation} config '${key}'`, 'config', {
      cause,
      suggestion: 'Check if config key is valid and permissions are correct',
      recoverable: true,
      context: { operation, key },
      severity: 'low',
    }),

  // Advanced command errors
  rebaseFailed: (onto: string, cause?: unknown): GitError =>
    createGitError('REBASE_FAILED', `Failed to rebase onto ${onto}`, 'rebase', {
      cause,
      suggestion: 'Resolve conflicts or abort rebase',
      recoverable: true,
      context: { onto },
      severity: 'high',
    }),

  cherryPickFailed: (commit: string, cause?: unknown): GitError =>
    createGitError('CHERRY_PICK_FAILED', `Failed to cherry-pick commit ${commit}`, 'cherry-pick', {
      cause,
      suggestion: 'Resolve conflicts or abort cherry-pick',
      recoverable: true,
      context: { commit },
      severity: 'medium',
    }),

  bisectFailed: (operation: string, cause?: unknown): GitError =>
    createGitError('BISECT_FAILED', `Failed to ${operation} bisect`, 'bisect', {
      cause,
      suggestion: 'Check bisect state or reset bisect',
      recoverable: true,
      context: { operation },
      severity: 'medium',
    }),

  cleanFailed: (cause?: unknown): GitError =>
    createGitError('CLEAN_FAILED', 'Failed to clean untracked files', 'clean', {
      cause,
      suggestion: 'Check permissions and use force option if needed',
      recoverable: true,
      severity: 'medium',
    }),

  blameFailed: (file: string, cause?: unknown): GitError =>
    createGitError('BLAME_FAILED', `Failed to get blame for ${file}`, 'blame', {
      cause,
      suggestion: 'Check if file exists and has history',
      recoverable: true,
      context: { file },
      severity: 'low',
    }),

  // Issue #137 specific errors
  typeScriptCacheClearFailed: (cause?: unknown): GitError =>
    createGitError('TS_CACHE_CLEAR_FAILED', 'Failed to clear TypeScript cache', 'cache-clear', {
      cause,
      suggestion: 'Check permissions for .tsbuildinfo files',
      recoverable: true,
      severity: 'medium',
    }),

  validationFailed: (command: string, exitCode: number): GitError =>
    createGitError('VALIDATION_FAILED', `Validation command failed: ${command}`, 'validate', {
      suggestion: 'Fix validation errors before committing',
      recoverable: true,
      context: { command, exitCode },
      severity: 'high',
    }),

  preCommitHookFailed: (hook: string, cause?: unknown): GitError =>
    createGitError('PRE_COMMIT_HOOK_FAILED', `Pre-commit hook failed: ${hook}`, 'hook', {
      cause,
      suggestion: 'Fix issues or use --no-verify to bypass hooks',
      recoverable: true,
      context: { hook },
      severity: 'medium',
    }),

  stagingFailed: (files: readonly string[], cause?: unknown): GitError =>
    createGitError(
      'STAGING_FAILED',
      `Failed to stage ${files.length} file${files.length === 1 ? '' : 's'}: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`,
      'stage',
      {
        cause,
        suggestion:
          'Verify files exist, are not ignored by .gitignore, and you have write permissions',
        recoverable: true,
        context: { files, fileCount: files.length },
        severity: 'medium',
      }
    ),

  fileExclusionFailed: (operation: string, files: readonly string[], cause?: unknown): GitError =>
    createGitError(
      'FILE_EXCLUSION_FAILED',
      `Failed to exclude files from ${operation}`,
      'exclude',
      {
        cause,
        suggestion: 'Check file paths and repository state',
        recoverable: true,
        context: { operation, files },
        severity: 'medium',
      }
    ),

  commitIntegrityFailed: (errors: readonly string[]): GitError =>
    createGitError('COMMIT_INTEGRITY_FAILED', 'Commit integrity check failed', 'integrity', {
      suggestion: 'Fix all errors before committing',
      recoverable: true,
      context: { errors },
      severity: 'high',
    }),
}
