import { ok, err, fromThrowable, Result } from '@esteban-url/core'
import { execSync, ExecSyncOptions } from 'node:child_process'
import type { GitError } from '../types.js'
import { createGitError } from '../errors.js'

// ========================================
// Git Command Execution Wrapper
// ========================================

export interface GitExecOptions extends Omit<ExecSyncOptions, 'encoding'> {
  readonly timeout?: number
  readonly maxBuffer?: number
  readonly stripFinalNewline?: boolean
}

export interface GitExecResult {
  readonly stdout: string
  readonly exitCode: number
  readonly duration: number
}

/**
 * Escapes shell arguments to prevent injection
 */
const escapeShellArg = (arg: string): string => {
  // If arg contains special characters, wrap in quotes and escape internal quotes
  if (/[^A-Za-z0-9_\-.,:/@]/.test(arg)) {
    return `"${arg.replace(/"/g, '\\"')}"`
  }
  return arg
}

/**
 * Parses error output to extract exit code and stderr
 */
const parseExecError = (error: unknown): { exitCode: number; stderr: string; signal?: string } => {
  if (error && typeof error === 'object' && 'status' in error) {
    const execError = error as any
    return {
      exitCode: execError.status || 1,
      stderr: execError.stderr?.toString() || execError.message || 'Unknown error',
      signal: execError.signal,
    }
  }
  return {
    exitCode: 1,
    stderr: error?.toString() || 'Unknown error',
  }
}

/**
 * Safe git command execution with proper escaping and error handling
 */
export const gitExec = async (
  args: readonly string[],
  options: GitExecOptions = {}
): Promise<Result<GitExecResult, GitError>> => {
  const startTime = Date.now()
  const {
    stripFinalNewline = true,
    timeout = 30000,
    maxBuffer = 10 * 1024 * 1024,
    ...execOptions
  } = options

  // Build command with escaped arguments
  const [subcommand, ...commandArgs] = args
  const escapedArgs = commandArgs.map(escapeShellArg)
  const command = `git ${subcommand} ${escapedArgs.join(' ')}`.trim()

  const safeExec = fromThrowable(() =>
    execSync(command, {
      encoding: 'utf8',
      timeout,
      maxBuffer,
      ...execOptions,
    })
  )

  const result = safeExec()
  const duration = Date.now() - startTime

  if (result.isErr()) {
    const { exitCode, stderr, signal } = parseExecError(result.error)

    // Create detailed error with git context
    return err(
      createGitError('GIT_COMMAND_FAILED', `Git command failed: ${subcommand}`, 'exec', {
        details: stderr,
        cause: result.error,
        suggestion: getErrorSuggestion(subcommand, stderr),
        recoverable: isRecoverableError(exitCode, stderr),
        context: {
          command: subcommand,
          args: commandArgs,
          exitCode,
          duration,
          signal,
        },
        gitCode: exitCode.toString(),
        gitOutput: stderr,
        workingDirectory: execOptions.cwd?.toString(),
        severity: getErrorSeverity(exitCode, subcommand),
      })
    )
  }

  let stdout = result.value
  if (stripFinalNewline && stdout.endsWith('\n')) {
    stdout = stdout.slice(0, -1)
  }

  return ok({
    stdout,
    exitCode: 0,
    duration,
  })
}

/**
 * Synchronous version for compatibility
 */
export const gitExecSync = (
  args: readonly string[],
  options: GitExecOptions = {}
): Result<string, GitError> => {
  const startTime = Date.now()
  const {
    stripFinalNewline = true,
    timeout = 30000,
    maxBuffer = 10 * 1024 * 1024,
    ...execOptions
  } = options

  // Build command with escaped arguments
  const [subcommand, ...commandArgs] = args
  const escapedArgs = commandArgs.map(escapeShellArg)
  const command = `git ${subcommand} ${escapedArgs.join(' ')}`.trim()

  const safeExec = fromThrowable(() =>
    execSync(command, {
      encoding: 'utf8',
      timeout,
      maxBuffer,
      ...execOptions,
    })
  )

  const result = safeExec()
  const duration = Date.now() - startTime

  if (result.isErr()) {
    const { exitCode, stderr, signal } = parseExecError(result.error)

    // Create detailed error with git context
    return err(
      createGitError('GIT_COMMAND_FAILED', `Git command failed: ${subcommand}`, 'exec', {
        details: stderr,
        cause: result.error,
        suggestion: getErrorSuggestion(subcommand, stderr),
        recoverable: isRecoverableError(exitCode, stderr),
        context: {
          command: subcommand,
          args: commandArgs,
          exitCode,
          duration,
          signal,
        },
        gitCode: exitCode.toString(),
        gitOutput: stderr,
        workingDirectory: execOptions.cwd?.toString(),
        severity: getErrorSeverity(exitCode, subcommand),
      })
    )
  }

  let stdout = result.value
  if (stripFinalNewline && stdout.endsWith('\n')) {
    stdout = stdout.slice(0, -1)
  }

  return ok(stdout)
}

/**
 * Execute git command and return stdout directly (throws on error)
 */
export const gitExecOrThrow = async (
  args: readonly string[],
  options: GitExecOptions = {}
): Promise<string> => {
  const result = await gitExec(args, options)
  if (result.isErr()) {
    throw result.error
  }
  return result.value.stdout
}

// ========================================
// Helper Functions
// ========================================

const getErrorSuggestion = (command: string, stderr: string): string => {
  // Common git error patterns and suggestions
  if (stderr.includes('not a git repository')) {
    return 'Run this command from within a git repository. Use "git init" to create a new repository or "cd" to navigate to an existing one'
  }
  if (stderr.includes('Permission denied')) {
    return 'Check file permissions (chmod) and repository access rights. You may need sudo or different credentials'
  }
  if (stderr.includes('pathspec') && stderr.includes('did not match')) {
    return 'The specified file or path does not exist. Check spelling, use "git status" to see available files, or create the file first'
  }
  if (stderr.includes('conflicts')) {
    return 'Merge conflicts detected. Use "git status" to see conflicted files, edit them to resolve conflicts, then "git add" and continue'
  }
  if (stderr.includes('uncommitted changes')) {
    return 'You have uncommitted changes. Either commit them with "git commit", stash with "git stash", or discard with "git checkout -- ."'
  }
  if (command === 'push' && stderr.includes('rejected')) {
    return 'Remote has changes you don\'t have locally. Run "git pull --rebase" to update, resolve any conflicts, then push again'
  }
  if (command === 'commit' && stderr.includes('nothing to commit')) {
    return 'No changes are staged for commit. Use "git add <files>" to stage changes, or "git commit -a" to commit all modified files'
  }
  if (stderr.includes('does not have a commit checked out')) {
    return 'You are in a detached HEAD state. Create a new branch with "git checkout -b <branch-name>" to save your work'
  }
  if (stderr.includes('failed to push some refs')) {
    return 'Push failed. This often means the remote has been updated. Try "git pull --rebase" before pushing'
  }
  if (stderr.includes('index.lock')) {
    return 'Git operation already in progress or crashed. Remove .git/index.lock if no other git process is running'
  }
  return 'Run the command with --help for usage information, or check git documentation for this specific error'
}

const isRecoverableError = (exitCode: number, stderr: string): boolean => {
  // Non-recoverable errors
  if (stderr.includes('fatal:')) return false
  if (exitCode === 128) return false // Invalid git command

  // Recoverable errors
  if (stderr.includes('nothing to commit')) return true
  if (stderr.includes('already exists')) return true
  if (stderr.includes('up to date')) return true
  if (exitCode === 1) return true // General errors are often recoverable

  return false
}

const getErrorSeverity = (
  exitCode: number,
  command: string
): 'low' | 'medium' | 'high' | 'critical' => {
  // Critical errors
  if (exitCode === 128) return 'critical' // Invalid git usage

  // High severity
  if (['push', 'pull', 'merge', 'rebase'].includes(command)) return 'high'

  // Low severity
  if (['status', 'log', 'diff'].includes(command)) return 'low'

  // Default to medium
  return 'medium'
}

// ========================================
// Convenience Functions
// ========================================

/**
 * Execute git command in a specific directory
 */
export const gitExecIn = async (
  cwd: string,
  args: readonly string[],
  options: GitExecOptions = {}
): Promise<Result<GitExecResult, GitError>> => {
  return gitExec(args, { ...options, cwd })
}

/**
 * Execute git command and parse JSON output
 */
export const gitExecJson = async <T>(
  args: readonly string[],
  options: GitExecOptions = {}
): Promise<Result<T, GitError>> => {
  const result = await gitExec(args, options)

  if (result.isErr()) {
    return err(result.error)
  }

  try {
    const parsed = JSON.parse(result.value.stdout) as T
    return ok(parsed)
  } catch (error) {
    return err(
      createGitError('GIT_PARSE_ERROR', 'Failed to parse git output as JSON', 'parse', {
        cause: error,
        details: 'Git output was not valid JSON',
        suggestion: 'Check git command output format',
        recoverable: false,
        context: { command: args[0], output: result.value.stdout },
      })
    )
  }
}

/**
 * Execute git command and split output into lines
 */
export const gitExecLines = async (
  args: readonly string[],
  options: GitExecOptions = {}
): Promise<Result<readonly string[], GitError>> => {
  const result = await gitExec(args, options)

  if (result.isErr()) {
    return err(result.error)
  }

  const lines = result.value.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return ok(lines)
}
