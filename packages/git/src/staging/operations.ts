import { ok, err } from '@esteban-url/core'
import type {
  GitRepository,
  GitResult,
  StagingResult,
  StagingPreview,
  FilePatch,
} from '../types.js'
import { createGitErrors } from '../errors.js'
import { gitExec, gitExecSync } from '../core/git-exec.js'

// ========================================
// Helper Functions
// ========================================

// Helper function to create reverse patch
const createReversePatch = (
  fullDiff: string,
  includeRanges: ReadonlyArray<{ start: number; end: number }>
): string | null => {
  const lines = fullDiff.split('\n')
  const reversePatch: string[] = []
  const header: string[] = []
  let inHeader = true

  for (const line of lines) {
    if (inHeader) {
      if (line.startsWith('@@')) {
        inHeader = false
      } else {
        header.push(line)
      }
    }

    if (!inHeader && line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
      if (match) {
        const startLine = parseInt(match[3], 10)
        const count = parseInt(match[4] || '1', 10)
        const endLine = startLine + count - 1

        const shouldExclude = !includeRanges.some(
          (range) => range.start <= endLine && range.end >= startLine
        )

        if (shouldExclude) {
          reversePatch.push(line)
        }
      }
    }
  }

  return reversePatch.length > 0 ? [...header, ...reversePatch].join('\n') : null
}

// ========================================
// Git Staging Operations
// ========================================

export interface GitStagingOperations {
  readonly stageFiles: (repo: GitRepository, files: readonly string[]) => Promise<GitResult<void>>
  readonly resetFiles: (repo: GitRepository, files: readonly string[]) => Promise<GitResult<void>>
  readonly stageFilePatches: (
    repo: GitRepository,
    patches: readonly FilePatch[]
  ) => Promise<GitResult<void>>
  readonly stageFilesSelective: (
    repo: GitRepository,
    includeFiles: readonly string[],
    excludeFiles: readonly string[]
  ) => Promise<GitResult<StagingResult>>
  readonly previewStaging: (
    repo: GitRepository,
    includeFiles: readonly string[],
    excludeFiles: readonly string[]
  ) => Promise<GitResult<StagingPreview>>
}

export const createGitStagingOperations = (): GitStagingOperations => {
  const stageFiles = async (
    repo: GitRepository,
    files: readonly string[]
  ): Promise<GitResult<void>> => {
    if (files.length === 0) {
      return ok(undefined)
    }

    const result = await gitExec(['add', '--', ...files], {
      cwd: repo.workingDirectory,
    })

    if (result.isErr()) {
      return err(createGitErrors.stagingFailed(files, result.error))
    }

    return ok(undefined)
  }

  const resetFiles = async (
    repo: GitRepository,
    files: readonly string[]
  ): Promise<GitResult<void>> => {
    if (files.length === 0) {
      return ok(undefined)
    }

    const result = await gitExec(['reset', 'HEAD', '--', ...files], {
      cwd: repo.workingDirectory,
    })

    if (result.isErr()) {
      return err(createGitErrors.stagingFailed(files, result.error))
    }

    return ok(undefined)
  }

  const stageFilePatches = async (
    repo: GitRepository,
    patches: readonly FilePatch[]
  ): Promise<GitResult<void>> => {
    // Stage specific line ranges by creating proper patch files

    for (const patch of patches) {
      // Get the full diff for the file
      const diffResult = gitExecSync(['diff', '--unified=0', '--', patch.path], {
        cwd: repo.workingDirectory,
      })

      if (diffResult.isErr()) {
        return err(createGitErrors.stagingFailed([patch.path], diffResult.error))
      }

      // Parse the diff to extract hunks
      const diffLines = diffResult.value.split('\n')
      const patchHeader: string[] = []
      const selectedHunks: string[] = []
      let currentHunk: string[] = []
      let inHunk = false
      let hunkStartLine = 0
      let hunkEndLine = 0

      for (let i = 0; i < diffLines.length; i++) {
        const line = diffLines[i]

        if (
          line.startsWith('diff --git') ||
          line.startsWith('index') ||
          line.startsWith('---') ||
          line.startsWith('+++')
        ) {
          patchHeader.push(line)
        } else if (line.startsWith('@@')) {
          // Parse hunk header: @@ -start,count +start,count @@
          const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
          if (match) {
            // Save previous hunk if it should be included
            if (inHunk && currentHunk.length > 0) {
              const shouldInclude = patch.ranges.some(
                (range) => range.start <= hunkEndLine && range.end >= hunkStartLine
              )
              if (shouldInclude) {
                selectedHunks.push(...currentHunk)
              }
            }

            // Start new hunk
            currentHunk = [line]
            inHunk = true
            hunkStartLine = parseInt(match[3], 10)
            const count = parseInt(match[4] || '1', 10)
            hunkEndLine = hunkStartLine + count - 1
          }
        } else if (inHunk) {
          currentHunk.push(line)
        }
      }

      // Check last hunk
      if (inHunk && currentHunk.length > 0) {
        const shouldInclude = patch.ranges.some(
          (range) => range.start <= hunkEndLine && range.end >= hunkStartLine
        )
        if (shouldInclude) {
          selectedHunks.push(...currentHunk)
        }
      }

      // Create the patch content
      if (selectedHunks.length > 0) {
        const patchContent = [...patchHeader, ...selectedHunks].join('\n')

        // Apply the patch to the index
        const applyResult = gitExecSync(['apply', '--cached', '--recount', '-'], {
          cwd: repo.workingDirectory,
          input: patchContent,
        })

        if (applyResult.isErr()) {
          // Try alternative approach: use git add -p simulation
          const resetResult = gitExecSync(['reset', '--', patch.path], {
            cwd: repo.workingDirectory,
          })

          if (resetResult.isErr()) {
            return err(createGitErrors.stagingFailed([patch.path], applyResult.error))
          }

          // Stage the entire file first, then unstage parts we don't want
          const addResult = gitExecSync(['add', '--', patch.path], {
            cwd: repo.workingDirectory,
          })

          if (addResult.isErr()) {
            return err(createGitErrors.stagingFailed([patch.path], addResult.error))
          }

          // Create reverse patch for parts we don't want
          const reversePatch = createReversePatch(diffResult.value, patch.ranges)
          if (reversePatch) {
            const reverseResult = gitExecSync(['apply', '--cached', '--reverse', '-'], {
              cwd: repo.workingDirectory,
              input: reversePatch,
            })

            if (reverseResult.isErr()) {
              return err(createGitErrors.stagingFailed([patch.path], reverseResult.error))
            }
          }
        }
      }
    }

    return ok(undefined)
  }

  const stageFilesSelective = async (
    repo: GitRepository,
    includeFiles: readonly string[],
    excludeFiles: readonly string[]
  ): Promise<GitResult<StagingResult>> => {
    const stagedFiles: string[] = []
    const skippedFiles: string[] = []
    const errors: string[] = []

    // Build exclude set for quick lookup
    const excludeSet = new Set(excludeFiles)

    for (const file of includeFiles) {
      if (excludeSet.has(file)) {
        skippedFiles.push(file)
        continue
      }

      const stageResult = await stageFiles(repo, [file])
      if (stageResult.isErr()) {
        errors.push(`Failed to stage ${file}: ${stageResult.error.message}`)
      } else {
        stagedFiles.push(file)
      }
    }

    const result: StagingResult = {
      stagedFiles,
      skippedFiles,
      errors,
    }

    return ok(result)
  }

  const previewStaging = async (
    repo: GitRepository,
    includeFiles: readonly string[],
    excludeFiles: readonly string[]
  ): Promise<GitResult<StagingPreview>> => {
    // Get current repository status
    const statusResult = await gitExec(['status', '--porcelain'], {
      cwd: repo.workingDirectory,
    })

    if (statusResult.isErr()) {
      return err(createGitErrors.statusFailed(repo.workingDirectory, statusResult.error))
    }

    const excludeSet = new Set(excludeFiles)
    const includeSet = new Set(includeFiles)

    const toBeStaged: string[] = []
    const toBeExcluded: string[] = []
    const conflicts: string[] = []
    let sizeImpact = 0

    // Parse status output
    const lines = statusResult.value.stdout.split('\n').filter(Boolean)
    for (const line of lines) {
      const _status = line.substring(0, 2)
      const file = line.substring(3)

      if (includeSet.has(file)) {
        if (excludeSet.has(file)) {
          conflicts.push(file)
        } else {
          toBeStaged.push(file)
          // Estimate size impact (simplified)
          sizeImpact += 1000 // Would need actual file size calculation
        }
      } else if (excludeSet.has(file)) {
        toBeExcluded.push(file)
      }
    }

    const preview: StagingPreview = {
      toBeStaged,
      toBeExcluded,
      conflicts,
      sizeImpact,
    }

    return ok(preview)
  }

  return {
    stageFiles,
    resetFiles,
    stageFilePatches,
    stageFilesSelective,
    previewStaging,
  }
}
