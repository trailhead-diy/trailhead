import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import type { GitRepository, GitResult, GitRemote, GitFetchOptions } from '../types.js'
import { createGitErrors } from '../errors.js'

// ========================================
// Git Remote Operations
// ========================================

export interface GitRemoteOperations {
  readonly listRemotes: (
    repo: GitRepository,
    verbose?: boolean
  ) => Promise<GitResult<readonly GitRemote[]>>
  readonly addRemote: (repo: GitRepository, name: string, url: string) => Promise<GitResult<void>>
  readonly removeRemote: (repo: GitRepository, name: string) => Promise<GitResult<void>>
  readonly getRemoteUrl: (
    repo: GitRepository,
    name: string,
    push?: boolean
  ) => Promise<GitResult<string | null>>
  readonly setRemoteUrl: (
    repo: GitRepository,
    name: string,
    url: string,
    push?: boolean
  ) => Promise<GitResult<void>>
  readonly fetchRemote: (repo: GitRepository, options?: GitFetchOptions) => Promise<GitResult<void>>
}

export const createGitRemoteOperations = (): GitRemoteOperations => {
  const parseRemotes = (output: string, verbose: boolean): readonly GitRemote[] => {
    const remotes: GitRemote[] = []
    const lines = output.trim().split('\n').filter(Boolean)

    if (!verbose) {
      // Simple format: just remote names
      for (const name of lines) {
        remotes.push({
          name: name.trim(),
          url: '',
          type: 'both',
        })
      }
    } else {
      // Verbose format: name url (type)
      for (const line of lines) {
        const match = line.match(/^(\S+)\s+(\S+)\s+\((\w+)\)$/)
        if (match) {
          const [, name, url, type] = match
          const remoteType = type as 'fetch' | 'push'

          // Check if this remote already exists (for push URLs)
          const existingIndex = remotes.findIndex((r) => r.name === name)
          if (existingIndex !== -1 && remoteType === 'push' && remotes[existingIndex].url !== url) {
            remotes[existingIndex] = {
              ...remotes[existingIndex],
              pushUrl: url,
              type: 'both',
            }
          } else if (existingIndex === -1) {
            remotes.push({
              name,
              url,
              type: remoteType,
            })
          }
        }
      }
    }

    return remotes
  }

  const listRemotes = async (
    repo: GitRepository,
    verbose = false
  ): Promise<GitResult<readonly GitRemote[]>> => {
    const args = ['remote']
    if (verbose) args.push('-v')

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.remoteFailed('list', 'all', result.error))
    }

    const remotes = parseRemotes(result.value, verbose)
    return ok(remotes)
  }

  const addRemote = async (
    repo: GitRepository,
    name: string,
    url: string
  ): Promise<GitResult<void>> => {
    const args = ['remote', 'add', name, url]

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.remoteFailed('add', name, result.error))
    }

    return ok(undefined)
  }

  const removeRemote = async (repo: GitRepository, name: string): Promise<GitResult<void>> => {
    const args = ['remote', 'remove', name]

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.remoteFailed('remove', name, result.error))
    }

    return ok(undefined)
  }

  const getRemoteUrl = async (
    repo: GitRepository,
    name: string,
    push = false
  ): Promise<GitResult<string | null>> => {
    const args = ['remote', 'get-url']
    if (push) args.push('--push')
    args.push(name)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      // Git returns exit code 2 when remote doesn't exist
      const errorString = result.error?.toString() || ''
      if (errorString.includes('exit code 2')) {
        return ok(null)
      }
      return err(createGitErrors.remoteFailed('get-url', name, result.error))
    }

    return ok(result.value.trim())
  }

  const setRemoteUrl = async (
    repo: GitRepository,
    name: string,
    url: string,
    push = false
  ): Promise<GitResult<void>> => {
    const args = ['remote', 'set-url']
    if (push) args.push('--push')
    args.push(name, url)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.remoteFailed('set-url', name, result.error))
    }

    return ok(undefined)
  }

  const fetchRemote = async (
    repo: GitRepository,
    options: GitFetchOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['fetch']

    if (options.all) {
      args.push('--all')
    } else if (options.remote) {
      args.push(options.remote)
      if (options.branch) {
        args.push(options.branch)
      }
    }

    if (options.prune) args.push('--prune')
    if (options.tags) args.push('--tags')
    if (options.depth) args.push(`--depth=${options.depth}`)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.fetchFailed(options.remote || 'origin', result.error))
    }

    return ok(undefined)
  }

  return {
    listRemotes,
    addRemote,
    removeRemote,
    getRemoteUrl,
    setRemoteUrl,
    fetchRemote,
  }
}
