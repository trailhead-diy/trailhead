import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import type {
  GitRepository,
  GitResult,
  GitCommitInfo,
  GitLogOptions,
  GitFileChange,
  FileStatusType,
} from '../types.js'
import { createGitErrors } from '../errors.js'

// ========================================
// Git Log Operations
// ========================================

export interface GitLogOperations {
  readonly getLog: (
    repo: GitRepository,
    options?: GitLogOptions
  ) => Promise<GitResult<readonly GitCommitInfo[]>>
  readonly getCommit: (repo: GitRepository, sha: string) => Promise<GitResult<GitCommitInfo>>
  readonly getCommitFiles: (
    repo: GitRepository,
    sha: string
  ) => Promise<GitResult<readonly GitFileChange[]>>
  readonly getCommitHistory: (
    repo: GitRepository,
    path: string,
    options?: GitLogOptions
  ) => Promise<GitResult<readonly GitCommitInfo[]>>
  readonly searchCommits: (
    repo: GitRepository,
    pattern: string,
    options?: GitLogOptions
  ) => Promise<GitResult<readonly GitCommitInfo[]>>
  readonly getCommitRange: (
    repo: GitRepository,
    from: string,
    to: string,
    options?: GitLogOptions
  ) => Promise<GitResult<readonly GitCommitInfo[]>>
}

// ========================================
// Helper Functions
// ========================================

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
    default:
      return 'modified'
  }
}

export const createGitLogOperations = (): GitLogOperations => {
  const parseGitLog = (output: string): readonly GitCommitInfo[] => {
    const commits: GitCommitInfo[] = []
    const lines = output.trim().split('\n').filter(Boolean)

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        commits.push({
          sha: parsed.sha,
          message: parsed.message,
          body: parsed.body,
          author: {
            name: parsed.authorName,
            email: parsed.authorEmail,
            date: new Date(parsed.authorDate),
          },
          committer: {
            name: parsed.committerName,
            email: parsed.committerEmail,
            date: new Date(parsed.committerDate),
          },
          date: new Date(parsed.authorDate),
          parents: parsed.parents ? parsed.parents.split(' ').filter(Boolean) : [],
          refs: parsed.refs ? parsed.refs.split(', ').filter(Boolean) : undefined,
        })
      } catch {
        // Skip malformed lines
      }
    }

    return commits
  }

  const parseGitFiles = (output: string): readonly GitFileChange[] => {
    const files: GitFileChange[] = []
    const lines = output.trim().split('\n').filter(Boolean)

    for (const line of lines) {
      const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/)
      if (match) {
        const [, insertions, deletions, pathInfo] = match
        const statusMatch = pathInfo.match(/^([AMDRC])\s+(.+)$/)

        if (statusMatch) {
          const [, status, path] = statusMatch
          files.push({
            path,
            status: parseFileStatus(status),
            insertions: parseInt(insertions, 10),
            deletions: parseInt(deletions, 10),
          })
        }
      }
    }

    return files
  }

  const getLog = async (
    repo: GitRepository,
    options: GitLogOptions = {}
  ): Promise<GitResult<readonly GitCommitInfo[]>> => {
    const args = ['log']

    // Format for parsing
    args.push(
      '--format={"sha":"%H","message":"%s","body":"%b","authorName":"%an","authorEmail":"%ae","authorDate":"%aI","committerName":"%cn","committerEmail":"%ce","committerDate":"%cI","parents":"%P","refs":"%D"}'
    )

    // Apply options
    if (options.limit) args.push(`-n`, options.limit.toString())
    if (options.since) args.push(`--since="${options.since.toISOString()}"`)
    if (options.until) args.push(`--until="${options.until.toISOString()}"`)
    if (options.author) args.push(`--author="${options.author}"`)
    if (options.grep) args.push(`--grep="${options.grep}"`)
    if (options.firstParent) args.push('--first-parent')
    if (options.reverse) args.push('--reverse')
    if (options.follow) args.push('--follow')
    if (options.paths && options.paths.length > 0) {
      args.push('--')
      args.push(...options.paths)
    }

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.logFailed(repo.workingDirectory, result.error))
    }

    const commits = parseGitLog(result.value)
    return ok(commits)
  }

  const getCommit = async (repo: GitRepository, sha: string): Promise<GitResult<GitCommitInfo>> => {
    const args = [
      'show',
      '--format={"sha":"%H","message":"%s","body":"%b","authorName":"%an","authorEmail":"%ae","authorDate":"%aI","committerName":"%cn","committerEmail":"%ce","committerDate":"%cI","parents":"%P","refs":"%D"}',
      '--no-patch',
      sha,
    ]

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.logFailed(repo.workingDirectory, result.error))
    }

    const commits = parseGitLog(result.value)
    if (commits.length === 0) {
      return err(createGitErrors.logFailed(repo.workingDirectory, new Error('Commit not found')))
    }

    return ok(commits[0])
  }

  const getCommitFiles = async (
    repo: GitRepository,
    sha: string
  ): Promise<GitResult<readonly GitFileChange[]>> => {
    const args = ['show', '--numstat', '--format=', sha]

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.logFailed(repo.workingDirectory, result.error))
    }

    const files = parseGitFiles(result.value)
    return ok(files)
  }

  const getCommitHistory = async (
    repo: GitRepository,
    path: string,
    options: GitLogOptions = {}
  ): Promise<GitResult<readonly GitCommitInfo[]>> => {
    return getLog(repo, { ...options, paths: [path], follow: true })
  }

  const searchCommits = async (
    repo: GitRepository,
    pattern: string,
    options: GitLogOptions = {}
  ): Promise<GitResult<readonly GitCommitInfo[]>> => {
    return getLog(repo, { ...options, grep: pattern })
  }

  const getCommitRange = async (
    repo: GitRepository,
    from: string,
    to: string,
    options: GitLogOptions = {}
  ): Promise<GitResult<readonly GitCommitInfo[]>> => {
    const args = ['log', `${from}..${to}`]

    // Format for parsing
    args.push(
      '--format={"sha":"%H","message":"%s","body":"%b","authorName":"%an","authorEmail":"%ae","authorDate":"%aI","committerName":"%cn","committerEmail":"%ce","committerDate":"%cI","parents":"%P","refs":"%D"}'
    )

    // Apply options
    if (options.limit) args.push(`-n`, options.limit.toString())
    if (options.author) args.push(`--author="${options.author}"`)
    if (options.grep) args.push(`--grep="${options.grep}"`)
    if (options.firstParent) args.push('--first-parent')
    if (options.reverse) args.push('--reverse')
    if (options.paths && options.paths.length > 0) {
      args.push('--')
      args.push(...options.paths)
    }

    const command = `git ${args.join(' ')}`
    const safeExec = fromThrowable(() =>
      execSync(command, { cwd: repo.workingDirectory, encoding: 'utf8' })
    )
    const result = safeExec()

    if (result.isErr()) {
      return err(createGitErrors.logFailed(repo.workingDirectory, result.error))
    }

    const commits = parseGitLog(result.value)
    return ok(commits)
  }

  return {
    getLog,
    getCommit,
    getCommitFiles,
    getCommitHistory,
    searchCommits,
    getCommitRange,
  }
}
