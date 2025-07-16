import { ok, err, fromThrowable } from '@esteban-url/core'
import { createGitErrors } from '../errors.js'
import { execSync } from 'node:child_process'
import type {
  GitStatusOperations,
  GitRepository,
  GitResult,
  GitStatus,
  GitFileStatus,
  FileStatusType,
  GitBranchSyncStatus,
  GitBranchSyncOptions,
} from '../types.js'

// ========================================
// Git Status Operations
// ========================================

export const createGitStatusOperations = (): GitStatusOperations => {
  const getStatus = async (repo: GitRepository): Promise<GitResult<GitStatus>> => {
    const safeStatus = fromThrowable(
      () =>
        execSync('git status --porcelain=v2 -b', {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeStatus()
    if (result.isErr()) {
      return err(createGitErrors.statusFailed(repo.workingDirectory, result.error))
    }

    const status = parseStatusOutput(result.value)
    return ok(status)
  }

  const isClean = async (repo: GitRepository): Promise<GitResult<boolean>> => {
    const statusResult = await getStatus(repo)
    if (statusResult.isErr()) {
      return err(statusResult.error)
    }

    return ok(statusResult.value.clean)
  }

  const hasChanges = async (repo: GitRepository): Promise<GitResult<boolean>> => {
    const statusResult = await getStatus(repo)
    if (statusResult.isErr()) {
      return err(statusResult.error)
    }

    const status = statusResult.value
    const hasChanges =
      status.staged.length > 0 || status.modified.length > 0 || status.untracked.length > 0

    return ok(hasChanges)
  }

  const getUntrackedFiles = async (repo: GitRepository): Promise<GitResult<readonly string[]>> => {
    const statusResult = await getStatus(repo)
    if (statusResult.isErr()) {
      return err(statusResult.error)
    }

    return ok(statusResult.value.untracked)
  }

  const getStagedFiles = async (
    repo: GitRepository
  ): Promise<GitResult<readonly GitFileStatus[]>> => {
    const statusResult = await getStatus(repo)
    if (statusResult.isErr()) {
      return err(statusResult.error)
    }

    return ok(statusResult.value.staged)
  }

  const checkBranchSync = async (
    repo: GitRepository,
    targetBranch: string,
    options: GitBranchSyncOptions = {}
  ): Promise<GitResult<GitBranchSyncStatus>> => {
    const { fetch = false, timeout = 10000 } = options

    // Get current branch
    const currentBranchResult = fromThrowable(() =>
      execSync('git branch --show-current', {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout,
      }).trim()
    )()

    if (currentBranchResult.isErr()) {
      return err(
        createGitErrors.commandFailed(
          'git branch --show-current',
          String(currentBranchResult.error),
          currentBranchResult.error
        )
      )
    }

    const currentBranch = currentBranchResult.value

    // Optionally fetch latest changes
    if (fetch) {
      const fetchResult = fromThrowable(() =>
        execSync('git fetch --quiet origin', {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout,
        })
      )()

      if (fetchResult.isErr()) {
        // Continue without fetch if it fails (might be offline)
        console.warn('Warning: Could not fetch latest changes')
      }
    }

    // Get ahead/behind counts
    const revListResult = fromThrowable(() =>
      execSync(`git rev-list --count --left-right ${targetBranch}...HEAD`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout,
      }).trim()
    )()

    if (revListResult.isErr()) {
      return err(
        createGitErrors.commandFailed(
          'git rev-list',
          String(revListResult.error),
          revListResult.error
        )
      )
    }

    const [behindStr, aheadStr] = revListResult.value.split('\t')
    const behind = parseInt(behindStr, 10) || 0
    const ahead = parseInt(aheadStr, 10) || 0

    const isUpToDate = behind === 0 && ahead === 0
    const diverged = behind > 0 && ahead > 0

    const syncStatus: GitBranchSyncStatus = {
      currentBranch,
      targetBranch,
      ahead,
      behind,
      isUpToDate,
      diverged,
      lastFetch: fetch ? new Date() : undefined,
    }

    return ok(syncStatus)
  }

  const formatSyncStatus = (status: GitBranchSyncStatus): string => {
    const { currentBranch, targetBranch, ahead, behind, isUpToDate, diverged } = status

    if (isUpToDate) {
      return `Branch '${currentBranch}' is up to date with '${targetBranch}'`
    }

    if (diverged) {
      return `Branch '${currentBranch}' has diverged from '${targetBranch}' (${ahead} ahead, ${behind} behind)`
    }

    if (ahead > 0) {
      return `Branch '${currentBranch}' is ${ahead} commit${ahead === 1 ? '' : 's'} ahead of '${targetBranch}'`
    }

    if (behind > 0) {
      return `Branch '${currentBranch}' is ${behind} commit${behind === 1 ? '' : 's'} behind '${targetBranch}'`
    }

    return `Branch '${currentBranch}' status unknown relative to '${targetBranch}'`
  }

  return {
    getStatus,
    isClean,
    hasChanges,
    getUntrackedFiles,
    getStagedFiles,
    checkBranchSync,
    formatSyncStatus,
  }
}

// ========================================
// Helper Functions
// ========================================

const parseStatusOutput = (output: string): GitStatus => {
  const lines = output.split('\n').filter((line) => line.length > 0)

  let branch = 'HEAD'
  let commit = ''
  let ahead = 0
  let behind = 0
  const staged: GitFileStatus[] = []
  const modified: GitFileStatus[] = []
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
      let path: string
      let statusParts: string[]

      if (parts.length > 1) {
        // Tab-separated format
        statusParts = parts[0].split(' ')
        path = parts[1]
      } else {
        // Space-separated format - path is the last part
        statusParts = parts[0].split(' ')
        path = statusParts[statusParts.length - 1]
      }

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
    } else if (line.startsWith('2 ')) {
      // Renamed/copied entries
      const parts = line.split('\t')
      const statusParts = parts[0].split(' ')
      let oldPath: string
      let newPath: string

      if (parts.length > 2) {
        // Tab-separated format
        oldPath = parts[1]
        newPath = parts[2]
      } else {
        // Space-separated format - paths are the last two parts
        oldPath = statusParts[statusParts.length - 2]
        newPath = statusParts[statusParts.length - 1]
      }

      const stagedStatus = statusParts[1][0]

      if (stagedStatus !== '.') {
        staged.push({
          path: newPath,
          status: parseFileStatus(stagedStatus),
          oldPath,
        })
      }
    } else if (line.startsWith('? ')) {
      // Untracked files
      const path = line.substring(2)
      untracked.push(path)
    }
  }

  const clean = staged.length === 0 && modified.length === 0 && untracked.length === 0

  return {
    branch,
    commit,
    ahead,
    behind,
    staged,
    modified,
    untracked,
    clean,
  }
}

const parseFileStatus = (status: string): FileStatusType => {
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
    case '?':
      return 'untracked'
    case '!':
      return 'ignored'
    default:
      return 'modified'
  }
}
