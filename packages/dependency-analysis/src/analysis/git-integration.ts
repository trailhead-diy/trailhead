import { err, ok, type Result } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import type {
  GitRepository,
  GitStatusOperations,
  GitCommandOperations,
  GitLogOperations,
  GitStashOperations,
  GitStagingOperations,
  FileStatusType,
} from '@esteban-url/git'
import type { AtomicCommitGroup, FileChange, DependencyError, AnalysisOptions } from '../types.js'
import { gitLogger, globalProfiler } from '../core/index.js'

/**
 * Context object containing all git operations needed for dependency analysis
 */
export interface GitContext {
  /** The git repository to operate on */
  readonly repository: GitRepository
  /** Git status operations */
  readonly status: GitStatusOperations
  /** Git command operations (commit, push, etc.) */
  readonly commands: GitCommandOperations
  /** Git log operations */
  readonly log: GitLogOperations
  /** Git stash operations */
  readonly stash: GitStashOperations
  /** Git staging operations */
  readonly staging: GitStagingOperations
}

/**
 * Options for creating atomic commits
 */
export interface CommitCreationOptions {
  /** If true, simulate commit creation without actually creating commits */
  readonly dryRun?: boolean
  /** If true, stash uncommitted changes before creating commits */
  readonly stashChanges?: boolean
  /** If true, run validation commands after each commit */
  readonly validateEachCommit?: boolean
  /** If true (default), use conventional commit format for messages */
  readonly conventionalCommitFormat?: boolean
}

/**
 * Result of creating an atomic commit
 */
export interface CommitResult {
  /** The SHA of the created commit (or "dry-run" if simulating) */
  readonly commitId: string
  /** The commit group that was processed */
  readonly group: AtomicCommitGroup
  /** Whether validation passed (always true if validation disabled) */
  readonly validationPassed: boolean
}

async function detectFileChanges(
  git: GitContext
): Promise<Result<readonly FileChange[], DependencyError>> {
  const stopProfiling = globalProfiler.start('git:detect-changes')
  gitLogger.debug('Detecting file changes')

  const statusResult = await git.status.getStatus(git.repository)

  if (!statusResult.isOk()) {
    gitLogger.error('Failed to get git status', statusResult.error)
    stopProfiling()
    return err({
      type: 'analysis-error',
      message: `Failed to get git status: ${statusResult.error.message}`,
    })
  }

  const status = statusResult.value
  const changes: FileChange[] = []

  // Process staged files
  for (const file of status.staged) {
    const type = mapFileStatusType(file.status)
    const fileChange = createFileChange(file.path, type)
    changes.push(fileChange)
  }

  // Process modified files
  for (const file of status.modified) {
    const type = mapFileStatusType(file.status)
    const fileChange = createFileChange(file.path, type)
    // Avoid duplicates from staged files
    if (!changes.some((c) => c.path === file.path)) {
      changes.push(fileChange)
    }
  }

  // Process untracked files
  for (const path of status.untracked) {
    const fileChange = createFileChange(path, 'addition')
    changes.push(fileChange)
  }

  const metrics = stopProfiling({ changeCount: changes.length })
  gitLogger.info('File changes detected', {
    count: changes.length,
    duration: metrics.duration,
  })

  return ok(changes)
}

function mapFileStatusType(status: FileStatusType): FileChange['type'] {
  switch (status) {
    case 'deleted':
      return 'deletion'
    case 'added':
    case 'untracked':
      return 'addition'
    default:
      return 'modification'
  }
}

function createFileChange(path: string, type: FileChange['type']): FileChange {
  const hasImportChanges =
    path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')

  const affectsPublicAPI =
    path.includes('/src/') && !path.includes('/test/') && !path.includes('/__tests__/')

  const riskLevel = affectsPublicAPI ? 'medium' : 'low'

  const packageMatch = path.match(/packages\/([^/]+)\//)
  const packageName = packageMatch ? packageMatch[1] : undefined

  return {
    path,
    type,
    package: packageName,
    hasImportChanges,
    affectsPublicAPI,
    riskLevel,
  }
}

async function stageFiles(
  git: GitContext,
  files: readonly string[]
): Promise<Result<void, DependencyError>> {
  const stageResult = await git.staging.stageFiles(git.repository, files)

  if (!stageResult.isOk()) {
    return err({
      type: 'analysis-error',
      message: `Failed to stage files: ${stageResult.error.message}`,
    })
  }

  return ok(undefined)
}

async function createCommit(
  git: GitContext,
  group: AtomicCommitGroup,
  options: CommitCreationOptions
): Promise<Result<string, DependencyError>> {
  const message =
    options.conventionalCommitFormat !== false
      ? group.description
      : group.description.replace(/^[a-z]+:\s*/, '')

  const commitResult = await git.commands.commit(git.repository, message)

  if (!commitResult.isOk()) {
    return err({
      type: 'analysis-error',
      message: `Failed to create commit: ${commitResult.error.message}`,
    })
  }

  return ok(commitResult.value)
}

async function validateCommit(
  validationCommands: readonly string[],
  repository: GitRepository
): Promise<boolean> {
  for (const command of validationCommands) {
    try {
      gitLogger.debug(`Executing validation command: ${command}`)
      execSync(command, {
        cwd: repository.path,
        stdio: 'pipe',
        encoding: 'utf-8',
      })
      gitLogger.debug(`Validation command succeeded: ${command}`)
    } catch (error) {
      gitLogger.error(`Validation command failed: ${command}`, error)
      return false
    }
  }

  return true
}

/**
 * Creates atomic commits from grouped file changes
 *
 * @param git - Git context with all required operations
 * @param groups - Atomic commit groups to process
 * @param options - Options for commit creation
 * @returns Array of commit results or error
 *
 * @remarks
 * This function will:
 * - Optionally stash uncommitted changes
 * - Process each group sequentially
 * - Stage only the files in each group
 * - Create a commit with the group's description
 * - Optionally validate each commit
 * - Rollback on any failure (if not in dry-run mode)
 *
 * @example
 * ```typescript
 * const results = await createAtomicCommits(gitContext, groups, {
 *   dryRun: false,
 *   validateEachCommit: true,
 *   stashChanges: true
 * });
 * ```
 */
export async function createAtomicCommits(
  git: GitContext,
  groups: readonly AtomicCommitGroup[],
  options: CommitCreationOptions = {}
): Promise<Result<readonly CommitResult[], DependencyError>> {
  const stopProfiling = globalProfiler.start('git:create-atomic-commits')
  gitLogger.info('Creating atomic commits', {
    groupCount: groups.length,
    options,
  })
  const results: CommitResult[] = []
  let stashId: string | undefined
  let initialHead: string | undefined

  const headResult = await git.log.getCommit(git.repository, 'HEAD')
  if (headResult.isOk()) {
    initialHead = headResult.value.sha
  }

  if (options.stashChanges) {
    const stashResult = await git.stash.stash(git.repository, {
      message: 'dependency-analysis: stashing changes',
    })

    if (!stashResult.isOk()) {
      return err({
        type: 'analysis-error',
        message: `Failed to stash changes: ${stashResult.error.message}`,
      })
    }

    stashId = stashResult.value
  }

  const rollback = async (
    error: DependencyError
  ): Promise<Result<readonly CommitResult[], DependencyError>> => {
    if (initialHead && results.length > 0) {
      await git.commands.reset(git.repository, initialHead, { mode: 'hard' })
    }

    if (stashId) {
      await git.stash.popStash(git.repository, stashId)
    }

    return err(error)
  }

  for (const group of groups) {
    gitLogger.debug(`Processing group: ${group.id}`, {
      description: group.description,
      fileCount: group.files.length,
    })

    if (options.dryRun) {
      results.push({
        commitId: 'dry-run',
        group,
        validationPassed: true,
      })
      continue
    }

    // Get all staged files first
    const stagedFilesResult = await git.status.getStagedFiles(git.repository)
    if (!stagedFilesResult.isOk()) {
      return rollback({
        type: 'analysis-error',
        message: `Failed to get staged files: ${stagedFilesResult.error.message}`,
      })
    }

    // Reset all staged files
    if (stagedFilesResult.value.length > 0) {
      const filePaths = stagedFilesResult.value.map((f: any) => f.path)
      const resetResult = await git.staging.resetFiles(git.repository, filePaths)
      if (!resetResult.isOk()) {
        return rollback({
          type: 'analysis-error',
          message: `Failed to reset staging area: ${resetResult.error.message}`,
        })
      }
    }

    const stageResult = await stageFiles(git, group.files)
    if (!stageResult.isOk()) {
      return rollback(stageResult.error)
    }

    let validationPassed = true
    if (options.validateEachCommit && group.validationCommands.length > 0) {
      gitLogger.debug('Running validation commands', {
        commands: group.validationCommands,
      })

      validationPassed = await validateCommit(group.validationCommands, git.repository)

      if (!validationPassed) {
        return rollback({
          type: 'validation-error',
          message: `Validation failed for group ${group.id}: ${group.description}`,
        })
      }
    }

    const commitResult = await createCommit(git, group, options)
    if (!commitResult.isOk()) {
      return rollback(commitResult.error)
    }

    results.push({
      commitId: commitResult.value,
      group,
      validationPassed,
    })
  }

  if (stashId && !options.dryRun) {
    const popResult = await git.stash.popStash(git.repository, stashId)
    if (!popResult.isOk()) {
      return err({
        type: 'analysis-error',
        message: `Failed to restore stashed changes: ${popResult.error.message}`,
      })
    }
  }

  const metrics = stopProfiling({
    commitCount: results.length,
    dryRun: options.dryRun,
  })

  gitLogger.info('Atomic commits created', {
    count: results.length,
    duration: metrics.duration,
    dryRun: options.dryRun,
  })

  return ok(results)
}

/**
 * Analyzes current git changes and converts them to FileChange objects
 *
 * @param git - Git context with required operations
 * @param options - Analysis options (currently unused but reserved for future use)
 * @returns Array of file changes or error
 *
 * @remarks
 * This function detects all staged, modified, and untracked files in the repository
 * and converts them to FileChange objects with metadata about risk level,
 * package association, and API impact.
 *
 * @example
 * ```typescript
 * const changes = await analyzeGitChanges(gitContext);
 * if (changes.isOk()) {
 *   console.log(`Found ${changes.value.length} changes`);
 * }
 * ```
 */
export async function analyzeGitChanges(
  git: GitContext,
  _options: AnalysisOptions = {}
): Promise<Result<readonly FileChange[], DependencyError>> {
  return detectFileChanges(git)
}
