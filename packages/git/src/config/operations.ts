import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import type {
  GitRepository,
  GitResult,
  GitConfigEntry,
  GitConfigOptions,
  GitConfigScope,
  GitUserConfig,
} from '../types.js'
import { createGitErrors } from '../errors.js'

// ========================================
// Git Config Operations
// ========================================

export interface GitConfigOperations {
  readonly getConfig: (
    repo: GitRepository,
    key: string,
    options?: GitConfigOptions
  ) => Promise<GitResult<string | null>>
  readonly setConfig: (
    repo: GitRepository,
    key: string,
    value: string | boolean | number,
    options?: GitConfigOptions
  ) => Promise<GitResult<void>>
  readonly unsetConfig: (
    repo: GitRepository,
    key: string,
    options?: GitConfigOptions
  ) => Promise<GitResult<void>>
  readonly listConfig: (
    repo: GitRepository,
    options?: GitConfigOptions
  ) => Promise<GitResult<readonly GitConfigEntry[]>>
  readonly getUser: (repo: GitRepository) => Promise<GitResult<GitUserConfig>>
  readonly setUser: (repo: GitRepository, user: Partial<GitUserConfig>) => Promise<GitResult<void>>
}

// ========================================
// Helper Functions
// ========================================

const buildScopeArg = (scope?: GitConfigScope): string => {
  switch (scope) {
    case 'system':
      return '--system'
    case 'global':
      return '--global'
    case 'worktree':
      return '--worktree'
    case 'local':
    default:
      return '--local'
  }
}

const buildTypeArg = (options?: GitConfigOptions): string => {
  if (!options?.type) return ''
  return `--type=${options.type}`
}

export const createGitConfigOperations = (): GitConfigOperations => {
  const parseConfigList = (output: string): readonly GitConfigEntry[] => {
    const entries: GitConfigEntry[] = []
    const lines = output.trim().split('\n').filter(Boolean)

    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const [, key, value] = match
        // Detect scope from key prefix if present in verbose output
        let scope: GitConfigScope = 'local'
        let cleanKey = key

        if (key.startsWith('file:')) {
          const scopeMatch = key.match(/^file:([^:]+):(.+)$/)
          if (scopeMatch) {
            const [, file, actualKey] = scopeMatch
            cleanKey = actualKey
            if (file.includes('system')) scope = 'system'
            else if (file.includes('global')) scope = 'global'
            else if (file.includes('worktree')) scope = 'worktree'
          }
        }

        entries.push({
          key: cleanKey,
          value: value.trim(),
          scope,
        })
      }
    }

    return entries
  }

  const getConfig = async (
    repo: GitRepository,
    key: string,
    options: GitConfigOptions = {}
  ): Promise<GitResult<string | null>> => {
    const args = ['config', buildScopeArg(options.scope), buildTypeArg(options), key].filter(
      Boolean
    )

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      // Git returns exit code 1 when config key is not found
      const errorString = result.error?.toString() || ''
      if (errorString.includes('exit code 1')) {
        return ok(null)
      }
      return err(createGitErrors.configFailed('get', key, result.error))
    }

    return ok(result.value.trim())
  }

  const setConfig = async (
    repo: GitRepository,
    key: string,
    value: string | boolean | number,
    options: GitConfigOptions = {}
  ): Promise<GitResult<void>> => {
    const args = [
      'config',
      buildScopeArg(options.scope),
      buildTypeArg(options),
      key,
      value.toString(),
    ].filter(Boolean)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.configFailed('set', key, result.error))
    }

    return ok(undefined)
  }

  const unsetConfig = async (
    repo: GitRepository,
    key: string,
    options: GitConfigOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['config', buildScopeArg(options.scope), '--unset', key].filter(Boolean)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      // Git returns exit code 5 when trying to unset a non-existent key
      const errorString = result.error?.toString() || ''
      if (errorString.includes('exit code 5')) {
        return ok(undefined)
      }
      return err(createGitErrors.configFailed('unset', key, result.error))
    }

    return ok(undefined)
  }

  const listConfig = async (
    repo: GitRepository,
    options: GitConfigOptions = {}
  ): Promise<GitResult<readonly GitConfigEntry[]>> => {
    const args = ['config', buildScopeArg(options.scope), '--list'].filter(Boolean)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.configFailed('list', 'all', result.error))
    }

    const entries = parseConfigList(result.value)
    return ok(entries)
  }

  const getUser = async (repo: GitRepository): Promise<GitResult<GitUserConfig>> => {
    const nameResult = await getConfig(repo, 'user.name')
    const emailResult = await getConfig(repo, 'user.email')
    const signingKeyResult = await getConfig(repo, 'user.signingkey')

    if (nameResult.isErr()) return err(nameResult.error)
    if (emailResult.isErr()) return err(emailResult.error)
    if (signingKeyResult.isErr()) return err(signingKeyResult.error)

    return ok({
      name: nameResult.value || undefined,
      email: emailResult.value || undefined,
      signingKey: signingKeyResult.value || undefined,
    })
  }

  const setUser = async (
    repo: GitRepository,
    user: Partial<GitUserConfig>
  ): Promise<GitResult<void>> => {
    if (user.name !== undefined) {
      const result = await setConfig(repo, 'user.name', user.name)
      if (result.isErr()) return result
    }

    if (user.email !== undefined) {
      const result = await setConfig(repo, 'user.email', user.email)
      if (result.isErr()) return result
    }

    if (user.signingKey !== undefined) {
      const result = await setConfig(repo, 'user.signingkey', user.signingKey)
      if (result.isErr()) return result
    }

    return ok(undefined)
  }

  return {
    getConfig,
    setConfig,
    unsetConfig,
    listConfig,
    getUser,
    setUser,
  }
}
