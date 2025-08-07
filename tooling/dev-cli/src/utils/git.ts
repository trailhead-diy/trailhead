import { execSync } from 'child_process'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'

export interface GitStatus {
  readonly hasChanges: boolean
  readonly currentBranch: string
  readonly isClean: boolean
}

export interface StashInfo {
  readonly message: string
  readonly ref: string
}

/**
 * Git operations with Result-based error handling
 */
export const gitOperations = {
  /**
   * Check git repository status
   */
  getStatus(): Result<GitStatus, CoreError> {
    try {
      const statusOutput = execSync('git status --porcelain', {
        encoding: 'utf8',
        stdio: 'pipe',
      })

      const branchOutput = execSync('git branch --show-current', {
        encoding: 'utf8',
        stdio: 'pipe',
      })

      return ok({
        hasChanges: statusOutput.trim().length > 0,
        currentBranch: branchOutput.trim(),
        isClean: statusOutput.trim().length === 0,
      })
    } catch (error) {
      return err(
        createCoreError(
          'GIT_STATUS_ERROR',
          'Failed to get git status',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Stash uncommitted changes with timestamped message
   */
  stashChanges(): Result<StashInfo | null, CoreError> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const message = `fresh-start: auto-stash ${timestamp}`

      const result = execSync(`git stash push -m "${message}"`, {
        encoding: 'utf8',
        stdio: 'pipe',
      })

      // Check if stash was created
      if (result.includes('No local changes to save')) {
        return ok(null)
      }

      // Get the stash ref
      const stashList = execSync('git stash list', { encoding: 'utf8', stdio: 'pipe' })
      const stashEntry = stashList.split('\n').find((line) => line.includes(message))
      const stashRef = stashEntry?.match(/stash@\{\d+\}/)?.[0]

      if (!stashRef) {
        return err(
          createCoreError(
            'STASH_REF_ERROR',
            'Failed to get stash reference after creating stash',
            'No stash reference found'
          )
        )
      }

      return ok({ message, ref: stashRef })
    } catch (error) {
      return err(
        createCoreError(
          'STASH_ERROR',
          'Failed to stash changes',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Pop specific stash by reference
   */
  popStash(stashRef: string): Result<void, CoreError> {
    try {
      execSync(`git stash pop ${stashRef}`, { stdio: 'inherit' })
      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError(
          'STASH_POP_ERROR',
          `Failed to pop stash ${stashRef}`,
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Reset to main branch and pull latest
   */
  resetToMain(): Result<void, CoreError> {
    try {
      // Checkout main
      execSync('git checkout main', { stdio: 'inherit' })

      // Fetch latest
      execSync('git fetch origin', { stdio: 'inherit' })

      // Reset hard to origin/main
      execSync('git reset --hard origin/main', { stdio: 'inherit' })

      // Clean untracked files
      execSync('git clean -fd', { stdio: 'inherit' })

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError(
          'GIT_RESET_ERROR',
          'Failed to reset to main branch',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Get current branch name
   */
  getCurrentBranch(): Result<string, CoreError> {
    try {
      const branch = execSync('git branch --show-current', {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim()

      return ok(branch)
    } catch (error) {
      return err(
        createCoreError(
          'GIT_BRANCH_ERROR',
          'Failed to get current branch',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },
}
