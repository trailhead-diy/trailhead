import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import type {
  GitRepository,
  GitResult,
  GitStash,
  GitStashOptions,
  GitStashApplyOptions,
  ConflictPreview,
  ConflictInfo,
} from '../types.js'
import { createGitErrors } from '../errors.js'

// ========================================
// Git Stash Operations
// ========================================

export interface GitStashOperations {
  readonly stash: (repo: GitRepository, options?: GitStashOptions) => Promise<GitResult<string>>
  readonly listStashes: (repo: GitRepository) => Promise<GitResult<readonly GitStash[]>>
  readonly applyStash: (
    repo: GitRepository,
    stashRef?: string,
    options?: GitStashApplyOptions
  ) => Promise<GitResult<void>>
  readonly popStash: (
    repo: GitRepository,
    stashRef?: string,
    options?: GitStashApplyOptions
  ) => Promise<GitResult<void>>
  readonly dropStash: (repo: GitRepository, stashRef?: string) => Promise<GitResult<void>>
  readonly showStash: (repo: GitRepository, stashRef?: string) => Promise<GitResult<string>>
  readonly previewStashRestore: (
    repo: GitRepository,
    stashRef?: string
  ) => Promise<GitResult<ConflictPreview>>
  readonly detectMergeConflicts: (
    repo: GitRepository
  ) => Promise<GitResult<readonly ConflictInfo[]>>
}

export const createGitStashOperations = (): GitStashOperations => {
  const parseStashList = (output: string, workingDirectory: string): readonly GitStash[] => {
    const stashes: GitStash[] = []
    const lines = output.trim().split('\n').filter(Boolean)

    for (const line of lines) {
      // Format: stash@{0}: WIP on main: abc123 commit message
      // or: stash@{0}: On main: custom stash message
      const match = line.match(/^stash@\{(\d+)\}:\s+(?:WIP on|On)\s+([^:]+):\s+(.+)$/)
      if (match) {
        const [, indexStr, branch, rest] = match
        const index = parseInt(indexStr, 10)

        // For WIP stashes, rest contains commit SHA and message
        // For custom stashes, rest is just the message
        let message = rest
        if (rest.match(/^[0-9a-f]{6,}\s/)) {
          // Remove commit SHA from WIP stashes
          message = rest.replace(/^[0-9a-f]+\s+/, '')
        }

        stashes.push({
          index,
          id: `stash@{${index}}`,
          message: message.trim(),
          branch: branch.trim(),
          date: new Date(), // Will be updated with proper date below
          author: { name: '', email: '', date: new Date() }, // Will be updated below
        })
      }
    }

    // Get detailed info for each stash to populate dates and authors
    for (const stash of stashes) {
      try {
        const detailOutput = execSync(`git stash show -p ${stash.id} --format="%an|%ae|%ai"`, {
          cwd: workingDirectory,
          encoding: 'utf8',
        })
        const firstLine = detailOutput.split('\n')[0]
        const [name, email, dateStr] = firstLine.split('|')
        if (name && email && dateStr) {
          const author = {
            name: name.trim(),
            email: email.trim(),
            date: new Date(dateStr.trim()),
          }
          // Replace the stash object with updated author info
          const index = stashes.indexOf(stash)
          stashes[index] = {
            ...stash,
            author,
            date: author.date,
          }
        }
      } catch {
        // If we can't get detailed info, keep defaults
      }
    }

    return stashes
  }

  const stash = async (
    repo: GitRepository,
    options: GitStashOptions = {}
  ): Promise<GitResult<string>> => {
    const args = ['stash', 'push']

    if (options.message) args.push('-m', options.message)
    if (options.includeUntracked) args.push('-u')
    if (options.all) args.push('-a')
    if (options.keepIndex) args.push('-k')

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.stashFailed('create', result.error))
    }

    // Git stash output includes the stash reference
    const output = result.value.trim()
    const stashMatch = output.match(/stash@\{\d+\}/)
    const stashRef = stashMatch ? stashMatch[0] : 'stash@{0}'

    return ok(stashRef)
  }

  const listStashes = async (repo: GitRepository): Promise<GitResult<readonly GitStash[]>> => {
    const command = 'git stash list'
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.stashFailed('list', result.error))
    }

    const stashes = parseStashList(result.value, repo.workingDirectory)
    return ok(stashes)
  }

  const applyStash = async (
    repo: GitRepository,
    stashRef = 'stash@{0}',
    options: GitStashApplyOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['stash', 'apply']

    if (options.index) args.push('--index')
    args.push(stashRef)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      // Check for merge conflicts
      const errorString = result.error?.toString() || ''
      if (errorString.includes('CONFLICT') || errorString.includes('conflict')) {
        // Try to get list of conflicted files
        const statusResult = execSync('git status --porcelain', {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
        const conflictFiles = statusResult
          .split('\n')
          .filter((line) => line.startsWith('UU'))
          .map((line) => line.substring(3).trim())

        return err(createGitErrors.stashConflict(conflictFiles))
      }
      return err(createGitErrors.stashFailed('apply', result.error))
    }

    return ok(undefined)
  }

  const popStash = async (
    repo: GitRepository,
    stashRef = 'stash@{0}',
    options: GitStashApplyOptions = {}
  ): Promise<GitResult<void>> => {
    const args = ['stash', 'pop']

    if (options.index) args.push('--index')
    args.push(stashRef)

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      // Check for merge conflicts
      const errorString = result.error?.toString() || ''
      if (errorString.includes('CONFLICT') || errorString.includes('conflict')) {
        // Try to get list of conflicted files
        const statusResult = execSync('git status --porcelain', {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
        const conflictFiles = statusResult
          .split('\n')
          .filter((line) => line.startsWith('UU'))
          .map((line) => line.substring(3).trim())

        return err(createGitErrors.stashConflict(conflictFiles))
      }
      return err(createGitErrors.stashFailed('pop', result.error))
    }

    return ok(undefined)
  }

  const dropStash = async (
    repo: GitRepository,
    stashRef = 'stash@{0}'
  ): Promise<GitResult<void>> => {
    const args = ['stash', 'drop', stashRef]

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.stashFailed('drop', result.error))
    }

    return ok(undefined)
  }

  const showStash = async (
    repo: GitRepository,
    stashRef = 'stash@{0}'
  ): Promise<GitResult<string>> => {
    const args = ['stash', 'show', '-p', stashRef]

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.stashFailed('show', result.error))
    }

    return ok(result.value)
  }

  const previewStashRestore = async (
    repo: GitRepository,
    stashRef = 'stash@{0}'
  ): Promise<GitResult<ConflictPreview>> => {
    // First, check if the stash exists
    const stashList = await listStashes(repo)
    if (stashList.isErr()) {
      return err(stashList.error)
    }

    if (stashList.value.length === 0) {
      return ok({
        conflictFiles: [],
        canRestoreSafely: true,
        resolutionStrategy: 'skip',
      })
    }

    // Get the files in the stash
    const stashFilesResult = fromThrowable(() =>
      execSync(`git stash show --name-only ${stashRef}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf8',
      })
    )()

    if (stashFilesResult.isErr()) {
      return err(createGitErrors.stashFailed('preview', stashFilesResult.error))
    }

    const stashFiles = stashFilesResult.value.split('\n').filter(Boolean)

    // Check for conflicts by attempting a dry-run merge
    const conflictFiles: string[] = []

    for (const file of stashFiles) {
      // Check if file has local modifications
      const statusResult = fromThrowable(() =>
        execSync(`git status --porcelain -- "${file}"`, {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
      )()

      if (statusResult.isOk() && statusResult.value.trim()) {
        // File has local changes, potential conflict
        conflictFiles.push(file)
      }
    }

    // Try to detect actual merge conflicts by checking diff
    const _diffResult = fromThrowable(() =>
      execSync(`git stash show -p ${stashRef}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf8',
      })
    )()

    let resolutionStrategy: 'manual' | 'skip' | 'force' = 'force'
    if (conflictFiles.length > 0) {
      resolutionStrategy = 'manual'
    }

    const preview: ConflictPreview = {
      conflictFiles,
      canRestoreSafely: conflictFiles.length === 0,
      resolutionStrategy,
    }

    return ok(preview)
  }

  const detectMergeConflicts = async (
    repo: GitRepository
  ): Promise<GitResult<readonly ConflictInfo[]>> => {
    // Check for files with merge conflicts
    const conflictResult = fromThrowable(() =>
      execSync('git diff --name-only --diff-filter=U', {
        cwd: repo.workingDirectory,
        encoding: 'utf8',
      })
    )()

    if (conflictResult.isErr()) {
      // No conflicts is not an error
      return ok([])
    }

    const conflictFiles = conflictResult.value.split('\n').filter(Boolean)
    const conflicts: ConflictInfo[] = []

    for (const file of conflictFiles) {
      // Get detailed conflict information
      const diffResult = fromThrowable(() =>
        execSync(`git diff --no-index --no-prefix "${file}"`, {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
      )()

      const sections: any[] = []

      if (diffResult.isOk()) {
        // Parse diff to find conflict markers
        const lines = diffResult.value.split('\n')
        let inConflict = false
        let startLine = 0
        let ourContent: string[] = []
        let theirContent: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]

          if (line.startsWith('<<<<<<<')) {
            inConflict = true
            startLine = i + 1
            ourContent = []
          } else if (line.startsWith('=======') && inConflict) {
            theirContent = []
          } else if (line.startsWith('>>>>>>>') && inConflict) {
            sections.push({
              startLine,
              endLine: i + 1,
              ourContent,
              theirContent,
            })
            inConflict = false
          } else if (inConflict) {
            if (theirContent !== undefined) {
              theirContent.push(line)
            } else {
              ourContent.push(line)
            }
          }
        }
      }

      // Determine conflict type
      let type: 'content' | 'rename' | 'delete' = 'content'

      // Check if it's a delete conflict
      const lsFilesResult = fromThrowable(() =>
        execSync(`git ls-files -u -- "${file}"`, {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
      )()

      if (lsFilesResult.isOk()) {
        const stages = lsFilesResult.value.split('\n').filter(Boolean)
        if (stages.length === 2) {
          // Only two stages means delete conflict
          type = 'delete'
        }
      }

      conflicts.push({
        path: file,
        type,
        sections,
      })
    }

    return ok(conflicts)
  }

  return {
    stash,
    listStashes,
    applyStash,
    popStash,
    dropStash,
    showStash,
    previewStashRestore,
    detectMergeConflicts,
  }
}
