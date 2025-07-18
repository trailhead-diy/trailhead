import { ok, err, fromThrowable } from '@esteban-url/core'
import { createGitErrors } from '../errors.js'
import { execSync } from 'node:child_process'
import type {
  GitDiffOperations,
  GitRepository,
  GitResult,
  GitDiff,
  GitDiffOptions,
  DiffFile,
  DiffSummary,
  DiffHunk,
  DiffLine,
  DiffLineType,
  FileStatusType,
  DiffStat,
  GitBlame,
  GitBlameLine,
  GitBlameOptions,
  GitCommit,
  FileChangeMap,
} from '../types.js'

// ========================================
// Git Diff Operations
// ========================================

export const createGitDiffOperations = (): GitDiffOperations => {
  const getDiff = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<GitDiff>> => {
    const args = buildDiffArgs(options)
    const safeDiff = fromThrowable(
      () =>
        execSync(`git diff ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeDiff()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const diff = parseDiffOutput(result.value)
    return ok(diff)
  }

  const getDiffSummary = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<DiffSummary>> => {
    const args = buildDiffArgs({ ...options, stat: true })
    const safeDiffSummary = fromThrowable(
      () =>
        execSync(`git diff --stat ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeDiffSummary()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const summary = parseDiffSummary(result.value)
    return ok(summary)
  }

  const getFileDiff = async (
    repo: GitRepository,
    path: string,
    options: GitDiffOptions = {}
  ): Promise<GitResult<DiffFile>> => {
    const args = buildDiffArgs({ ...options, paths: [path] })
    const safeFileDiff = fromThrowable(
      () =>
        execSync(`git diff ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeFileDiff()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const diff = parseDiffOutput(result.value)
    const fileDiff = diff.files.find((f) => f.path === path)

    if (!fileDiff) {
      return err(
        createGitErrors.diffFailed(
          repo.workingDirectory,
          new Error(`No diff found for file ${path}`)
        )
      )
    }

    return ok(fileDiff)
  }

  const getDiffBetweenCommits = async (
    repo: GitRepository,
    from: string,
    to: string,
    options: GitDiffOptions = {}
  ): Promise<GitResult<GitDiff>> => {
    const args = buildDiffArgs(options)
    const safeExec = fromThrowable(
      () =>
        execSync(`git diff ${from}..${to} ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeExec()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const diff = parseDiffOutput(result.value)
    return ok(diff)
  }

  const getDiffStats = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<DiffStat>> => {
    const args = buildDiffArgs(options)
    const safeExec = fromThrowable(
      () =>
        execSync(`git diff --numstat ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeExec()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const lines = result.value.trim().split('\n').filter(Boolean)
    let filesChanged = 0
    let insertions = 0
    let deletions = 0

    for (const line of lines) {
      const match = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/)
      if (match) {
        filesChanged++
        const added = match[1] === '-' ? 0 : parseInt(match[1], 10)
        const removed = match[2] === '-' ? 0 : parseInt(match[2], 10)
        insertions += added
        deletions += removed
      }
    }

    const stats: DiffStat = {
      filesChanged,
      insertions,
      deletions,
    }

    return ok(stats)
  }

  const getDiffFiles = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<readonly DiffFile[]>> => {
    // Use numstat to get file-level diff information
    const args = buildDiffArgs(options)
    const safeExec = fromThrowable(
      () =>
        execSync(`git diff --numstat --name-status ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeExec()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const files: DiffFile[] = []
    const lines = result.value.trim().split('\n').filter(Boolean)

    // First pass: get numstat data
    const numstatData: Map<string, { insertions: number; deletions: number }> = new Map()
    for (const line of lines) {
      const numstatMatch = line.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/)
      if (numstatMatch) {
        const [, added, removed, path] = numstatMatch
        numstatData.set(path, {
          insertions: added === '-' ? 0 : parseInt(added, 10),
          deletions: removed === '-' ? 0 : parseInt(removed, 10),
        })
      }
    }

    // Second pass: get name-status data
    const nameStatusResult = fromThrowable(
      () =>
        execSync(`git diff --name-status ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )()

    if (nameStatusResult.isOk()) {
      const statusLines = nameStatusResult.value.trim().split('\n').filter(Boolean)
      for (const line of statusLines) {
        const match = line.match(/^([AMDRCUTX])\s+(.+?)(?:\s+(.+))?$/)
        if (match) {
          const [, status, path, newPath] = match
          const stats = numstatData.get(newPath || path) || { insertions: 0, deletions: 0 }

          files.push({
            path: newPath || path,
            oldPath: status === 'R' && path !== newPath ? path : undefined,
            status: parseFileStatusChar(status),
            hunks: [], // Would need full diff parsing for hunks
            binary: stats.insertions === 0 && stats.deletions === 0,
            similarity: undefined,
            insertions: stats.insertions,
            deletions: stats.deletions,
          })
        }
      }
    }

    return ok(files)
  }

  const getBlame = async (
    repo: GitRepository,
    path: string,
    options: GitBlameOptions = {}
  ): Promise<GitResult<GitBlame>> => {
    const args = ['blame', '--porcelain']

    if (options.startLine) args.push(`-L${options.startLine},${options.endLine || '$'}`)
    if (options.reverse) args.push('--reverse')
    if (options.firstParent) args.push('--first-parent')

    args.push(path)

    const safeExec = fromThrowable(
      () =>
        execSync(`git ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeExec()
    if (result.isErr()) {
      return err(createGitErrors.blameFailed(path, result.error))
    }

    const blame = parseBlameOutput(result.value)
    return ok(blame)
  }

  const getChangedFilesByType = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<FileChangeMap>> => {
    const args = buildDiffArgs(options)
    const safeExec = fromThrowable(
      () =>
        execSync(`git diff --name-status ${args.join(' ')}`, {
          cwd: repo.workingDirectory,
          encoding: 'utf-8',
          stdio: 'pipe',
        }) as string
    )

    const result = safeExec()
    if (result.isErr()) {
      return err(createGitErrors.diffFailed(repo.workingDirectory, result.error))
    }

    const added: string[] = []
    const modified: string[] = []
    const deleted: string[] = []
    const renamed: Array<{ from: string; to: string }> = []

    const lines = result.value.trim().split('\n').filter(Boolean)
    for (const line of lines) {
      const match = line.match(/^([AMDRCUTX])\s+(.+?)(?:\s+(.+))?$/)
      if (match) {
        const [, status, path, newPath] = match

        switch (status) {
          case 'A':
            added.push(newPath || path)
            break
          case 'M':
            modified.push(newPath || path)
            break
          case 'D':
            deleted.push(newPath || path)
            break
          case 'R':
            if (newPath) {
              renamed.push({ from: path, to: newPath })
            } else {
              modified.push(path)
            }
            break
          case 'C':
            added.push(newPath || path)
            break
          case 'U':
            modified.push(newPath || path)
            break
          default:
            modified.push(newPath || path)
        }
      }
    }

    const changeMap: FileChangeMap = {
      added,
      modified,
      deleted,
      renamed,
    }

    return ok(changeMap)
  }

  return {
    getDiff,
    getDiffSummary,
    getFileDiff,
    getDiffFiles,
    getDiffBetweenCommits,
    getDiffStats,
    getBlame,
    getChangedFilesByType,
  }
}

// ========================================
// Helper Functions
// ========================================

const buildDiffArgs = (options: GitDiffOptions & { stat?: boolean } = {}): string[] => {
  const args: string[] = []

  if (options.cached || options.staged) {
    args.push('--cached')
  }

  if (options.ref) {
    args.push(options.ref)
  } else if (options.base) {
    args.push(options.base)
  }

  if (options.context !== undefined) {
    args.push(`--unified=${options.context}`)
  }

  if (options.ignoreWhitespace) {
    args.push('--ignore-all-space')
  }

  if (options.stat) {
    args.push('--stat')
  }

  if (options.paths && options.paths.length > 0) {
    args.push('--', ...options.paths)
  }

  return args
}

const parseDiffOutput = (output: string): GitDiff => {
  const lines = output.split('\n')
  const files: DiffFile[] = []
  let currentFile: {
    path?: string
    oldPath?: string
    status?: FileStatusType
    hunks?: DiffHunk[]
    binary?: boolean
    similarity?: number
  } | null = null
  let currentHunk: {
    oldStart?: number
    oldLines?: number
    newStart?: number
    newLines?: number
    header?: string
    lines?: DiffLine[]
  } | null = null
  let totalInsertions = 0
  let totalDeletions = 0
  let binaryFiles = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('diff --git ')) {
      // Save previous file
      if (currentFile) {
        files.push({
          ...currentFile,
          insertions: 0,
          deletions: 0,
        } as DiffFile)
      }

      // Start new file
      const match = line.match(/diff --git a\/(.+) b\/(.+)/)
      if (match) {
        currentFile = {
          path: match[2],
          oldPath: match[1] !== match[2] ? match[1] : undefined,
          status: 'modified',
          hunks: [],
          binary: false,
        }
      }
      currentHunk = null
    } else if (line.startsWith('new file mode ')) {
      if (currentFile) {
        currentFile.status = 'added'
      }
    } else if (line.startsWith('deleted file mode ')) {
      if (currentFile) {
        currentFile.status = 'deleted'
      }
    } else if (line.startsWith('rename from ')) {
      if (currentFile) {
        currentFile.status = 'renamed'
      }
    } else if (line.startsWith('copy from ')) {
      if (currentFile) {
        currentFile.status = 'copied'
      }
    } else if (line.startsWith('Binary files ')) {
      if (currentFile) {
        currentFile.binary = true
        binaryFiles++
      }
    } else if (line.startsWith('similarity index ')) {
      if (currentFile) {
        const match = line.match(/similarity index (\d+)%/)
        if (match) {
          currentFile.similarity = parseInt(match[1], 10)
        }
      }
    } else if (line.startsWith('@@ ')) {
      // Parse hunk header
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/)
      if (match && currentFile) {
        if (currentHunk) {
          currentFile.hunks!.push({
            oldStart: currentHunk.oldStart!,
            oldLines: currentHunk.oldLines!,
            newStart: currentHunk.newStart!,
            newLines: currentHunk.newLines!,
            header: currentHunk.header!,
            lines: currentHunk.lines!,
          })
        }

        currentHunk = {
          oldStart: parseInt(match[1], 10),
          oldLines: parseInt(match[2] || '1', 10),
          newStart: parseInt(match[3], 10),
          newLines: parseInt(match[4] || '1', 10),
          header: line,
          lines: [],
        }
      }
    } else if (
      currentHunk &&
      (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-'))
    ) {
      // Parse diff lines
      const type: DiffLineType = line.startsWith('+')
        ? 'addition'
        : line.startsWith('-')
          ? 'deletion'
          : 'context'
      const content = line.substring(1)

      if (!currentHunk.lines) {
        currentHunk.lines = []
      }
      currentHunk.lines.push({
        type,
        content,
      })

      if (type === 'addition') {
        totalInsertions++
      } else if (type === 'deletion') {
        totalDeletions++
      }
    } else if (line === '\\ No newline at end of file') {
      if (currentHunk) {
        if (!currentHunk.lines) {
          currentHunk.lines = []
        }
        currentHunk.lines.push({
          type: 'no-newline',
          content: line,
        })
      }
    }
  }

  // Save last file and hunk
  if (currentHunk && currentFile) {
    currentFile.hunks!.push({
      oldStart: currentHunk.oldStart!,
      oldLines: currentHunk.oldLines!,
      newStart: currentHunk.newStart!,
      newLines: currentHunk.newLines!,
      header: currentHunk.header!,
      lines: currentHunk.lines!,
    })
  }
  if (currentFile) {
    files.push({
      path: currentFile.path!,
      oldPath: currentFile.oldPath,
      status: currentFile.status!,
      hunks: currentFile.hunks!,
      binary: currentFile.binary!,
      similarity: currentFile.similarity,
      insertions: 0,
      deletions: 0,
    })
  }

  const summary: DiffSummary = {
    totalFiles: files.length,
    insertions: totalInsertions,
    deletions: totalDeletions,
    binary: binaryFiles,
  }

  return {
    files,
    summary,
  }
}

const parseDiffSummary = (output: string): DiffSummary => {
  const lines = output.split('\n')
  const files: string[] = []
  let insertions = 0
  let deletions = 0
  let binary = 0

  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|')
      if (parts.length >= 2) {
        const filename = parts[0].trim()
        const stats = parts[1].trim()

        if (filename && !files.includes(filename)) {
          files.push(filename)
        }

        if (stats.includes('Bin')) {
          binary++
        } else {
          const match = stats.match(/(\d+) \+/)
          if (match) {
            insertions += parseInt(match[1], 10)
          }

          const deleteMatch = stats.match(/(\d+) -/)
          if (deleteMatch) {
            deletions += parseInt(deleteMatch[1], 10)
          }
        }
      }
    }
  }

  return {
    totalFiles: files.length,
    insertions,
    deletions,
    binary,
  }
}

const parseBlameOutput = (output: string): GitBlame => {
  const lines = output.split('\n')
  const blameLines: GitBlameLine[] = []
  const commitData: Record<
    string,
    {
      sha: string
      authorName?: string
      authorEmail?: string
      authorTime?: Date
      committerName?: string
      committerEmail?: string
      committerTime?: Date
      message?: string
    }
  > = {}
  let currentCommit: string | null = null
  let currentLineNumber = 1
  let currentOriginalLineNumber = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // SHA line
    if (line.match(/^[0-9a-f]{40} \d+ \d+/)) {
      const parts = line.split(' ')
      currentCommit = parts[0]
      currentOriginalLineNumber = parseInt(parts[1], 10)
      currentLineNumber = parseInt(parts[2], 10)

      if (!commitData[currentCommit]) {
        commitData[currentCommit] = { sha: currentCommit }
      }
    }
    // Author info
    else if (line.startsWith('author ')) {
      if (currentCommit && commitData[currentCommit]) {
        commitData[currentCommit].authorName = line.substring(7)
      }
    } else if (line.startsWith('author-mail ')) {
      if (currentCommit && commitData[currentCommit]) {
        commitData[currentCommit].authorEmail = line.substring(12).replace(/[<>]/g, '')
      }
    } else if (line.startsWith('author-time ')) {
      if (currentCommit && commitData[currentCommit]) {
        const timestamp = parseInt(line.substring(12), 10)
        commitData[currentCommit].authorTime = new Date(timestamp * 1000)
      }
    } else if (line.startsWith('committer ')) {
      if (currentCommit && commitData[currentCommit]) {
        commitData[currentCommit].committerName = line.substring(10)
      }
    } else if (line.startsWith('committer-mail ')) {
      if (currentCommit && commitData[currentCommit]) {
        commitData[currentCommit].committerEmail = line.substring(15).replace(/[<>]/g, '')
      }
    } else if (line.startsWith('committer-time ')) {
      if (currentCommit && commitData[currentCommit]) {
        const timestamp = parseInt(line.substring(15), 10)
        commitData[currentCommit].committerTime = new Date(timestamp * 1000)
      }
    } else if (line.startsWith('summary ')) {
      if (currentCommit && commitData[currentCommit]) {
        commitData[currentCommit].message = line.substring(8)
      }
    }
    // Content line
    else if (line.startsWith('\t')) {
      if (currentCommit && commitData[currentCommit]) {
        const data = commitData[currentCommit]
        blameLines.push({
          lineNumber: currentLineNumber,
          content: line.substring(1),
          commit: currentCommit,
          author: {
            name: data.authorName || '',
            email: data.authorEmail || '',
            date: data.authorTime || new Date(),
          },
          originalLineNumber: currentOriginalLineNumber,
          finalLineNumber: currentLineNumber,
        })
      }
    }
  }

  // Build commits object
  const commits: Record<string, GitCommit> = {}
  for (const [sha, data] of Object.entries(commitData)) {
    commits[sha] = {
      sha,
      author: {
        name: data.authorName || '',
        email: data.authorEmail || '',
        date: data.authorTime || new Date(),
      },
      committer: {
        name: data.committerName || '',
        email: data.committerEmail || '',
        date: data.committerTime || new Date(),
      },
      date: data.authorTime || new Date(),
      message: data.message || '',
      parents: [],
    }
  }

  return {
    lines: blameLines,
    commits,
  }
}

const parseFileStatusChar = (status: string): FileStatusType => {
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
    case 'T':
      return 'modified' // Type change
    case 'X':
      return 'untracked' // Unknown
    default:
      return 'modified'
  }
}
