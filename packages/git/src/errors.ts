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
}
