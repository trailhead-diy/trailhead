import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import type {
  GitCommandOperations,
  GitRepository,
  GitResult,
  GitCommitOptions,
  GitPushOptions,
  GitPullOptions,
  GitCheckoutOptions,
  GitBranchOptions,
  GitTagOptions,
  GitResetOptions,
  GitRevertOptions,
  GitMergeOptions,
} from '../types.js'

// ========================================
// Git Command Operations
// ========================================

/**
 * Safe git command execution utility
 * Replaces try/catch patterns with Result-based error handling
 */
const safeGitExec = (
  command: string,
  workingDirectory: string,
  errorCode: string,
  errorMessage: string,
  suggestion: string
) => {
  const safeExec = fromThrowable(
    () =>
      execSync(command, {
        cwd: workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      }) as string
  )

  const result = safeExec()
  if (result.isErr()) {
    return err({
      type: 'GitError',
      code: errorCode,
      message: errorMessage,
      suggestion,
      cause: result.error,
      recoverable: true,
    } as any)
  }

  return ok(result.value)
}

export const createGitCommandOperations = (): GitCommandOperations => {
  const add = async (repo: GitRepository, files: readonly string[]): Promise<GitResult<void>> => {
    const fileArgs = files.map((f) => `"${f}"`).join(' ')
    const result = safeGitExec(
      `git add ${fileArgs}`,
      repo.workingDirectory,
      'ADD_FAILED',
      `Failed to add files: ${files.join(', ')}`,
      'Check if the files exist and you have write permissions'
    )

    return result.isOk() ? ok(undefined) : err(result.error)
  }

  const commit = async (
    repo: GitRepository,
    message: string,
    options: GitCommitOptions = {}
  ): Promise<GitResult<string>> => {
    const args = ['commit', `-m "${message}"`]

    if (options.all) args.push('-a')
    if (options.amend) args.push('--amend')
    if (options.author) args.push(`--author="${options.author}"`)
    if (options.date) args.push(`--date="${options.date.toISOString()}"`)
    if (options.signoff) args.push('--signoff')
    if (options.gpgSign) args.push('--gpg-sign')

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'COMMIT_FAILED',
      'Failed to create commit',
      'Check if there are staged changes and the message is valid'
    )

    if (result.isErr()) {
      return err(result.error)
    }

    // Extract commit SHA from output
    const match = result.value.match(/\[.*?\s([a-f0-9]+)\]/)
    const sha = match ? match[1] : ''

    return ok(sha)
  }

  const push = async (
    repo: GitRepository,
    options: GitPushOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['push']

    if (options.force) args.push('--force')
    if (options.tags) args.push('--tags')
    if (options.upstream) args.push('--set-upstream')

    if (options.remote) {
      args.push(options.remote)
      if (options.branch) {
        args.push(options.branch)
      }
    }

    const safeExec = fromThrowable(() =>
      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      })
    )

    const result = safeExec()
    if (result.isErr()) {
      return err({
        type: 'GitError',
        code: 'PUSH_FAILED',
        message: 'Failed to push changes',
        suggestion: 'Check network connection and remote repository permissions',
        cause: result.error,
        recoverable: true,
      } as any)
    }

    return ok(undefined)
  }

  const pull = async (
    repo: GitRepository,
    options: GitPullOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['pull']

    if (options.rebase) args.push('--rebase')
    if (options.ff === false) args.push('--no-ff')
    else if (options.ff === true) args.push('--ff-only')
    if (options.squash) args.push('--squash')

    if (options.remote) {
      args.push(options.remote)
      if (options.branch) {
        args.push(options.branch)
      }
    }

    const safeExec = fromThrowable(() =>
      execSync(`git ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        stdio: 'pipe',
      })
    )

    const result = safeExec()
    if (result.isErr()) {
      return err({
        type: 'GitError',
        code: 'PULL_FAILED',
        message: 'Failed to pull changes',
        suggestion: 'Check network connection and resolve any conflicts',
        cause: result.error,
        recoverable: true,
      } as any)
    }

    return ok(undefined)
  }

  const checkout = async (
    repo: GitRepository,
    ref: string,
    options: GitCheckoutOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['checkout']

    if (options.createBranch) args.push('-b')
    if (options.force) args.push('--force')
    if (options.track) args.push('--track')
    if (options.orphan) args.push('--orphan')

    args.push(ref)

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'CHECKOUT_FAILED',
      `Failed to checkout ${ref}`,
      'Check if the ref exists and there are no uncommitted changes'
    )

    return result.isOk() ? ok(undefined) : err(result.error)
  }

  const branch = async (
    repo: GitRepository,
    name?: string,
    options: GitBranchOptions = {}
  ): Promise<GitResult<readonly string[]>> => {
    const args = ['branch']

    if (options.remote) args.push('-r')
    if (options.merged) args.push('--merged')

    if (name) {
      if (options.create) args.push('-c', name)
      else if (options.delete) {
        if (options.force) args.push('-D', name)
        else args.push('-d', name)
      } else {
        args.push(name)
      }
    }

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'BRANCH_FAILED',
      name ? `Failed to manage branch ${name}` : 'Failed to list branches',
      'Check if the branch name is valid and you have permissions'
    )

    if (result.isErr()) {
      return err(result.error)
    }

    const branches = result.value
      .split('\n')
      .map((line) => line.replace(/^\*?\s*/, '').trim())
      .filter((line) => line.length > 0)

    return ok(branches)
  }

  const tag = async (
    repo: GitRepository,
    name?: string,
    options: GitTagOptions = {}
  ): Promise<GitResult<readonly string[]>> => {
    const args = ['tag']

    if (name) {
      if (options.create) {
        if (options.annotated) args.push('-a')
        if (options.message) args.push('-m', `"${options.message}"`)
        if (options.force) args.push('-f')
        args.push(name)
      } else if (options.delete) {
        args.push('-d', name)
      }
    }

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'TAG_FAILED',
      name ? `Failed to manage tag ${name}` : 'Failed to list tags',
      'Check if the tag name is valid and you have permissions'
    )

    if (result.isErr()) {
      return err(result.error)
    }

    const tags = result.value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    return ok(tags)
  }

  const reset = async (
    repo: GitRepository,
    ref?: string,
    options: GitResetOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['reset']

    if (options.mode) {
      args.push(`--${options.mode}`)
    }

    if (ref) {
      args.push(ref)
    }

    if (options.paths && options.paths.length > 0) {
      args.push('--', ...options.paths)
    }

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'RESET_FAILED',
      `Failed to reset${ref ? ` to ${ref}` : ''}`,
      'Check if the ref exists and the reset mode is valid'
    )

    return result.isOk() ? ok(undefined) : err(result.error)
  }

  const revert = async (
    repo: GitRepository,
    sha: string,
    options: GitRevertOptions = {}
  ): Promise<GitResult<string>> => {
    const args = ['revert']

    if (options.noCommit) args.push('--no-commit')
    if (options.mainline) args.push(`--mainline=${options.mainline}`)
    if (options.signoff) args.push('--signoff')

    args.push(sha)

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'REVERT_FAILED',
      `Failed to revert commit ${sha}`,
      'Check if the commit SHA exists and can be reverted'
    )

    if (result.isErr()) {
      return err(result.error)
    }

    // Extract commit SHA from output
    const match = result.value.match(/\[.*?\s([a-f0-9]+)\]/)
    const revertSha = match ? match[1] : ''

    return ok(revertSha)
  }

  const merge = async (
    repo: GitRepository,
    ref: string,
    options: GitMergeOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['merge']

    if (options.strategy) args.push(`--strategy=${options.strategy}`)
    if (options.squash) args.push('--squash')
    if (options.noCommit) args.push('--no-commit')
    if (options.fastForward === false) args.push('--no-ff')
    else if (options.fastForward === true) args.push('--ff-only')

    args.push(ref)

    const result = safeGitExec(
      `git ${args.join(' ')}`,
      repo.workingDirectory,
      'MERGE_FAILED',
      `Failed to merge ${ref}`,
      'Check if the ref exists and resolve any conflicts'
    )

    return result.isOk() ? ok(undefined) : err(result.error)
  }

  return {
    add,
    commit,
    push,
    pull,
    checkout,
    branch,
    tag,
    reset,
    revert,
    merge,
  }
}
