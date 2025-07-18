import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  GitRepository,
  GitResult,
  HookInfo,
  HookValidationResult,
  CommitResult,
} from '../types.js'
import { createGitErrors } from '../errors.js'
import { gitExec } from '../core/git-exec.js'

// ========================================
// Git Hook Operations
// ========================================

export interface GitHookOperations {
  readonly detectPreCommitHooks: (repo: GitRepository) => Promise<GitResult<readonly HookInfo[]>>
  readonly validateAgainstHooks: (
    repo: GitRepository,
    stagedFiles: readonly string[]
  ) => Promise<GitResult<HookValidationResult>>
  readonly commitWithHookStrategy: (
    repo: GitRepository,
    message: string,
    strategy: 'respect' | 'bypass' | 'interactive'
  ) => Promise<GitResult<CommitResult>>
}

export const createGitHookOperations = (): GitHookOperations => {
  const detectPreCommitHooks = async (
    repo: GitRepository
  ): Promise<GitResult<readonly HookInfo[]>> => {
    const hooks: HookInfo[] = []

    // Check .git/hooks/pre-commit
    const gitHookPath = join(repo.gitDirectory, 'hooks', 'pre-commit')
    if (existsSync(gitHookPath)) {
      try {
        const _content = readFileSync(gitHookPath, 'utf8')
        hooks.push({
          name: 'pre-commit',
          command: gitHookPath,
          canBypass: true,
          estimatedDuration: 5000, // Default estimate
          failureRecovery: 'rollback',
        })
      } catch {
        // Ignore read errors
      }
    }

    // Check for husky
    const huskyPath = join(repo.workingDirectory, '.husky', 'pre-commit')
    if (existsSync(huskyPath)) {
      try {
        const _content = readFileSync(huskyPath, 'utf8')
        hooks.push({
          name: 'husky pre-commit',
          command: huskyPath,
          canBypass: true,
          estimatedDuration: 10000, // Husky hooks often run longer
          failureRecovery: 'rollback',
        })
      } catch {
        // Ignore read errors
      }
    }

    // Check package.json for pre-commit scripts
    const packageJsonPath = join(repo.workingDirectory, 'package.json')
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
        if (packageJson.scripts?.['pre-commit']) {
          hooks.push({
            name: 'package.json pre-commit',
            command: 'npm run pre-commit',
            canBypass: true,
            estimatedDuration: 15000,
            failureRecovery: 'rollback',
          })
        }

        // Check for lint-staged
        if (packageJson['lint-staged']) {
          hooks.push({
            name: 'lint-staged',
            command: 'npx lint-staged',
            canBypass: true,
            estimatedDuration: 20000,
            failureRecovery: 'continue', // lint-staged modifies files
          })
        }
      } catch {
        // Ignore parse errors
      }
    }

    return ok(hooks)
  }

  const validateAgainstHooks = async (
    repo: GitRepository,
    _stagedFiles: readonly string[]
  ): Promise<GitResult<HookValidationResult>> => {
    const hooksResult = await detectPreCommitHooks(repo)
    if (hooksResult.isErr()) {
      return err(hooksResult.error)
    }

    const hooks = hooksResult.value
    const failedHooks: string[] = []
    let canProceedWithBypass = true

    // Create a temporary index to test hooks
    const _saveIndex = fromThrowable(() =>
      execSync('git write-tree', {
        cwd: repo.workingDirectory,
        encoding: 'utf8',
      })
    )()

    for (const hook of hooks) {
      const hookResult = fromThrowable(() =>
        execSync(hook.command, {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
          env: {
            ...process.env,
            GIT_INDEX_FILE: join(repo.gitDirectory, 'index'),
          },
        })
      )()

      if (hookResult.isErr()) {
        failedHooks.push(hook.name)
        if (!hook.canBypass) {
          canProceedWithBypass = false
        }
      }
    }

    const hooksPassed = failedHooks.length === 0
    let suggestedAction: 'commit' | 'bypass' | 'fix' | 'abort' = 'commit'

    if (!hooksPassed) {
      if (canProceedWithBypass) {
        suggestedAction = 'bypass'
      } else {
        suggestedAction = 'fix'
      }
    }

    const result: HookValidationResult = {
      hooksPassed,
      failedHooks,
      canProceedWithBypass,
      suggestedAction,
    }

    return ok(result)
  }

  const commitWithHookStrategy = async (
    repo: GitRepository,
    message: string,
    strategy: 'respect' | 'bypass' | 'interactive'
  ): Promise<GitResult<CommitResult>> => {
    const hooksRun: string[] = []
    // let command = 'git commit' - removed as unused
    const args: string[] = ['-m', `"${message}"`]

    if (strategy === 'bypass') {
      args.push('--no-verify')
    } else if (strategy === 'respect') {
      // Run hooks normally
      const hooksResult = await detectPreCommitHooks(repo)
      if (hooksResult.isOk()) {
        hooksRun.push(...hooksResult.value.map((h) => h.name))
      }
    } else if (strategy === 'interactive') {
      // For interactive mode, we would need to prompt the user
      // For now, we'll default to respecting hooks
      const validationResult = await validateAgainstHooks(repo, [])
      if (validationResult.isOk()) {
        if (validationResult.value.suggestedAction === 'bypass') {
          args.push('--no-verify')
        }
      }
    }

    const commitArgs = ['commit', '-m', message]
    if (strategy === 'bypass') {
      commitArgs.push('--no-verify')
    }

    const commitResult = await gitExec(commitArgs, {
      cwd: repo.workingDirectory,
    })

    if (commitResult.isErr()) {
      // Check if it's a hook failure
      const errorString = commitResult.error.gitOutput || commitResult.error.message || ''
      if (errorString.includes('pre-commit hook')) {
        const hookName = errorString.match(/pre-commit hook (.+) failed/)?.[1] || 'pre-commit'
        return err(createGitErrors.preCommitHookFailed(hookName, commitResult.error))
      }
      return err(commitResult.error)
    }

    // Extract commit SHA from output
    const output = commitResult.value.stdout
    const shaMatch = output.match(/\[\w+-?\w*\s+([a-f0-9]+)\]/)
    const sha = shaMatch ? shaMatch[1] : ''

    // Count changed files
    const filesResult = await gitExec(['diff-tree', '--no-commit-id', '--name-only', '-r', sha], {
      cwd: repo.workingDirectory,
    })

    const filesChanged = filesResult.isOk()
      ? filesResult.value.stdout.split('\n').filter(Boolean).length
      : 0

    const result: CommitResult = {
      sha,
      message,
      filesChanged,
      hooksRun,
    }

    return ok(result)
  }

  return {
    detectPreCommitHooks,
    validateAgainstHooks,
    commitWithHookStrategy,
  }
}
