import { ok, err, fromThrowable } from '@esteban-url/core'
import { readFileSync, writeFileSync, statSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import type { GitRepository, GitResult, GitStatus, ExclusionResult, FileState } from '../types.js'
import { createGitErrors } from '../errors.js'
import { gitExec } from '../core/git-exec.js'

// ========================================
// Git Exclusion Operations
// ========================================

export interface GitExclusionOperations {
  readonly excludeFilesFromOperation: (
    repo: GitRepository,
    files: readonly string[],
    operation: 'stash' | 'stage' | 'commit'
  ) => Promise<GitResult<ExclusionResult>>
  readonly restoreExcludedFiles: (
    repo: GitRepository,
    files: readonly string[],
    fromRef?: string
  ) => Promise<GitResult<void>>
  readonly getStatusExcluding: (
    repo: GitRepository,
    excludeFiles: readonly string[]
  ) => Promise<GitResult<GitStatus>>
}

export const createGitExclusionOperations = (): GitExclusionOperations => {
  const preserveFileState = async (
    repo: GitRepository,
    file: string
  ): Promise<FileState | null> => {
    try {
      const fullPath = join(repo.workingDirectory, file)

      // Read file content
      const readContent = fromThrowable(() => readFileSync(fullPath, 'utf8'))
      const contentResult = readContent()
      if (contentResult.isErr()) {
        return null
      }

      // Get file mode using Node.js API (cross-platform)
      const statResult = fromThrowable(() => statSync(fullPath))
      const stats = statResult()
      if (stats.isErr()) {
        return null
      }

      // Convert mode to octal string (compatible with git)
      const mode = (stats.value.mode & parseInt('777', 8)).toString(8)

      // Get file hash using git
      const hashResult = await gitExec(['hash-object', file], {
        cwd: repo.workingDirectory,
      })

      if (hashResult.isErr()) {
        return null
      }

      return {
        path: file,
        content: contentResult.value,
        mode,
        hash: hashResult.value.stdout.trim(),
      }
    } catch {
      return null
    }
  }

  const excludeFilesFromOperation = async (
    repo: GitRepository,
    files: readonly string[],
    operation: 'stash' | 'stage' | 'commit'
  ): Promise<GitResult<ExclusionResult>> => {
    const excludedFiles: string[] = []
    const preservedState: FileState[] = []
    const operationAppliedTo: string[] = []
    const conflicts: string[] = []

    // Preserve state of excluded files
    for (const file of files) {
      const state = await preserveFileState(repo, file)
      if (state) {
        preservedState.push(state)
        excludedFiles.push(file)
      } else {
        conflicts.push(file)
      }
    }

    if (operation === 'stash') {
      // Create a stash excluding specific files
      // First, temporarily remove excluded files from the index
      for (const file of excludedFiles) {
        const resetResult = await gitExec(['reset', 'HEAD', '--', file], {
          cwd: repo.workingDirectory,
        })

        if (resetResult.isErr()) {
          conflicts.push(file)
        }
      }

      // Get list of files that will be stashed
      const statusResult = await gitExec(['status', '--porcelain'], {
        cwd: repo.workingDirectory,
      })

      if (statusResult.isOk()) {
        const lines = statusResult.value.stdout.split('\n').filter(Boolean)
        for (const line of lines) {
          const file = line.substring(3)
          if (!excludedFiles.includes(file)) {
            operationAppliedTo.push(file)
          }
        }
      }

      // Create the stash (only if there are files to stash)
      if (operationAppliedTo.length > 0) {
        const stashResult = await gitExec(
          ['stash', 'push', '-m', 'Excluding files', '--', ...operationAppliedTo],
          { cwd: repo.workingDirectory }
        )

        if (stashResult.isErr()) {
          return err(createGitErrors.stashFailed('create', stashResult.error))
        }
      }

      // Restore excluded files with proper permissions
      for (const state of preservedState) {
        const fullPath = join(repo.workingDirectory, state.path)
        const writeResult = fromThrowable(() => {
          writeFileSync(fullPath, state.content)
          // Restore file permissions
          const numericMode = parseInt(state.mode, 8)
          chmodSync(fullPath, numericMode)
        })

        if (writeResult().isErr()) {
          conflicts.push(state.path)
        }
      }
    } else if (operation === 'stage') {
      // Stage all files except excluded ones
      const allFiles = await gitExec(['ls-files', '-o', '-m', '--exclude-standard'], {
        cwd: repo.workingDirectory,
      })

      if (allFiles.isOk()) {
        const filesToStage = allFiles.value.stdout
          .split('\n')
          .filter(Boolean)
          .filter((f) => !excludedFiles.includes(f))

        // Stage files in batch for better performance
        if (filesToStage.length > 0) {
          const stageResult = await gitExec(['add', '--', ...filesToStage], {
            cwd: repo.workingDirectory,
          })

          if (stageResult.isOk()) {
            operationAppliedTo.push(...filesToStage)
          } else {
            // Try individual files if batch fails
            for (const file of filesToStage) {
              const individualResult = await gitExec(['add', '--', file], {
                cwd: repo.workingDirectory,
              })

              if (individualResult.isOk()) {
                operationAppliedTo.push(file)
              } else {
                conflicts.push(file)
              }
            }
          }
        }
      }
    } else if (operation === 'commit') {
      // Similar to stage, but create a commit
      // This would typically be combined with staging
      return err(
        createGitErrors.fileExclusionFailed(
          operation,
          files,
          new Error('Commit exclusion should be done through staging')
        )
      )
    }

    const result: ExclusionResult = {
      excludedFiles,
      preservedState,
      operationAppliedTo,
      conflicts,
    }

    return ok(result)
  }

  const restoreExcludedFiles = async (
    repo: GitRepository,
    files: readonly string[],
    fromRef = 'HEAD'
  ): Promise<GitResult<void>> => {
    if (files.length === 0) {
      return ok(undefined)
    }

    // Try batch restore first for better performance
    const batchResult = await gitExec(['checkout', fromRef, '--', ...files], {
      cwd: repo.workingDirectory,
    })

    if (batchResult.isOk()) {
      return ok(undefined)
    }

    // If batch fails, try individual files
    const failedFiles: string[] = []
    for (const file of files) {
      const restoreResult = await gitExec(['checkout', fromRef, '--', file], {
        cwd: repo.workingDirectory,
      })

      if (restoreResult.isErr()) {
        failedFiles.push(file)
      }
    }

    if (failedFiles.length > 0) {
      return err(
        createGitErrors.fileExclusionFailed(
          'restore',
          failedFiles,
          new Error(`Failed to restore ${failedFiles.length} files`)
        )
      )
    }

    return ok(undefined)
  }

  const getStatusExcluding = async (
    repo: GitRepository,
    excludeFiles: readonly string[]
  ): Promise<GitResult<GitStatus>> => {
    // Get full status
    const statusResult = await gitExec(['status', '--porcelain=v2', '-b'], {
      cwd: repo.workingDirectory,
    })

    if (statusResult.isErr()) {
      return err(createGitErrors.statusFailed(repo.workingDirectory, statusResult.error))
    }

    // Parse status and filter out excluded files
    const excludeSet = new Set(excludeFiles)
    const lines = statusResult.value.stdout.split('\n').filter(Boolean)

    let branch = 'HEAD'
    let commit = ''
    let ahead = 0
    let behind = 0
    const staged: any[] = []
    const modified: any[] = []
    const untracked: string[] = []

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        branch = line.substring('# branch.head '.length)
      } else if (line.startsWith('# branch.oid ')) {
        commit = line.substring('# branch.oid '.length)
      } else if (line.startsWith('# branch.ab ')) {
        const [aheadStr, behindStr] = line.substring('# branch.ab '.length).split(' ')
        ahead = parseInt(aheadStr, 10)
        behind = parseInt(behindStr, 10)
      } else if (line.startsWith('1 ')) {
        // Changed entries
        const parts = line.split('\t')
        const path = parts[1] || parts[0].split(' ').pop() || ''

        if (!excludeSet.has(path)) {
          const statusParts = parts[0].split(' ')
          const stagedStatus = statusParts[1][0]
          const modifiedStatus = statusParts[1][1]

          if (stagedStatus !== '.') {
            staged.push({
              path,
              status: parseFileStatus(stagedStatus),
            })
          }

          if (modifiedStatus !== '.') {
            modified.push({
              path,
              status: parseFileStatus(modifiedStatus),
            })
          }
        }
      } else if (line.startsWith('? ')) {
        // Untracked files
        const path = line.substring(2)
        if (!excludeSet.has(path)) {
          untracked.push(path)
        }
      }
    }

    const clean = staged.length === 0 && modified.length === 0 && untracked.length === 0

    const status: GitStatus = {
      branch,
      commit,
      ahead,
      behind,
      staged,
      modified,
      untracked,
      clean,
    }

    return ok(status)
  }

  return {
    excludeFilesFromOperation,
    restoreExcludedFiles,
    getStatusExcluding,
  }
}

const parseFileStatus = (status: string): any => {
  switch (status) {
    case 'A':
      return 'added'
    case 'M':
      return 'modified'
    case 'D':
      return 'deleted'
    case 'R':
      return 'renamed'
    case 'C':
      return 'copied'
    case 'U':
      return 'unmerged'
    default:
      return 'modified'
  }
}
