import { ok, err } from '@trailhead/core';
import { execSync } from 'node:child_process';
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
} from '../types.js';

// ========================================
// Git Diff Operations
// ========================================

export const createGitDiffOperations = (): GitDiffOperations => {
  const getDiff = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<GitDiff>> => {
    try {
      const args = buildDiffArgs(options);
      const diffOutput = execSync(`git diff ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const diff = parseDiffOutput(diffOutput);
      return ok(diff);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'DIFF_FAILED',
        message: 'Failed to get diff',
        suggestion: 'Check if the repository is valid and the refs exist',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const getDiffSummary = async (
    repo: GitRepository,
    options: GitDiffOptions = {}
  ): Promise<GitResult<DiffSummary>> => {
    try {
      const args = buildDiffArgs({ ...options, stat: true });
      const summaryOutput = execSync(`git diff --stat ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const summary = parseDiffSummary(summaryOutput);
      return ok(summary);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'DIFF_SUMMARY_FAILED',
        message: 'Failed to get diff summary',
        suggestion: 'Check if the repository is valid and the refs exist',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  const getFileDiff = async (
    repo: GitRepository,
    path: string,
    options: GitDiffOptions = {}
  ): Promise<GitResult<DiffFile>> => {
    try {
      const args = buildDiffArgs({ ...options, paths: [path] });
      const diffOutput = execSync(`git diff ${args.join(' ')}`, {
        cwd: repo.workingDirectory,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const diff = parseDiffOutput(diffOutput);
      const fileDiff = diff.files.find(f => f.path === path);

      if (!fileDiff) {
        return err({
          type: 'GitError',
          code: 'FILE_NOT_FOUND',
          message: `No diff found for file ${path}`,
          suggestion: 'Check if the file exists and has changes',
          recoverable: true,
        } as any);
      }

      return ok(fileDiff);
    } catch (error) {
      return err({
        type: 'GitError',
        code: 'FILE_DIFF_FAILED',
        message: `Failed to get diff for file ${path}`,
        suggestion: 'Check if the file exists and the repository is valid',
        cause: error,
        recoverable: true,
      } as any);
    }
  };

  return {
    getDiff,
    getDiffSummary,
    getFileDiff,
  };
};

// ========================================
// Helper Functions
// ========================================

const buildDiffArgs = (options: GitDiffOptions & { stat?: boolean } = {}): string[] => {
  const args: string[] = [];

  if (options.cached || options.staged) {
    args.push('--cached');
  }

  if (options.ref) {
    args.push(options.ref);
  } else if (options.base) {
    args.push(options.base);
  }

  if (options.context !== undefined) {
    args.push(`--unified=${options.context}`);
  }

  if (options.ignoreWhitespace) {
    args.push('--ignore-all-space');
  }

  if (options.stat) {
    args.push('--stat');
  }

  if (options.paths && options.paths.length > 0) {
    args.push('--', ...options.paths);
  }

  return args;
};

const parseDiffOutput = (output: string): GitDiff => {
  const lines = output.split('\n');
  const files: DiffFile[] = [];
  let currentFile: {
    path?: string;
    oldPath?: string;
    status?: FileStatusType;
    hunks?: DiffHunk[];
    binary?: boolean;
    similarity?: number;
  } | null = null;
  let currentHunk: {
    oldStart?: number;
    oldLines?: number;
    newStart?: number;
    newLines?: number;
    header?: string;
    lines?: DiffLine[];
  } | null = null;
  let totalInsertions = 0;
  let totalDeletions = 0;
  let binaryFiles = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git ')) {
      // Save previous file
      if (currentFile) {
        files.push(currentFile as DiffFile);
      }

      // Start new file
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      if (match) {
        currentFile = {
          path: match[2],
          oldPath: match[1] !== match[2] ? match[1] : undefined,
          status: 'modified',
          hunks: [],
          binary: false,
        };
      }
      currentHunk = null;
    } else if (line.startsWith('new file mode ')) {
      if (currentFile) {
        currentFile.status = 'added';
      }
    } else if (line.startsWith('deleted file mode ')) {
      if (currentFile) {
        currentFile.status = 'deleted';
      }
    } else if (line.startsWith('rename from ')) {
      if (currentFile) {
        currentFile.status = 'renamed';
      }
    } else if (line.startsWith('copy from ')) {
      if (currentFile) {
        currentFile.status = 'copied';
      }
    } else if (line.startsWith('Binary files ')) {
      if (currentFile) {
        currentFile.binary = true;
        binaryFiles++;
      }
    } else if (line.startsWith('similarity index ')) {
      if (currentFile) {
        const match = line.match(/similarity index (\d+)%/);
        if (match) {
          currentFile.similarity = parseInt(match[1], 10);
        }
      }
    } else if (line.startsWith('@@ ')) {
      // Parse hunk header
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
      if (match && currentFile) {
        if (currentHunk) {
          currentFile.hunks!.push({
            oldStart: currentHunk.oldStart!,
            oldLines: currentHunk.oldLines!,
            newStart: currentHunk.newStart!,
            newLines: currentHunk.newLines!,
            header: currentHunk.header!,
            lines: currentHunk.lines!,
          });
        }

        currentHunk = {
          oldStart: parseInt(match[1], 10),
          oldLines: parseInt(match[2] || '1', 10),
          newStart: parseInt(match[3], 10),
          newLines: parseInt(match[4] || '1', 10),
          header: line,
          lines: [],
        };
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
          : 'context';
      const content = line.substring(1);

      if (!currentHunk.lines) {
        currentHunk.lines = [];
      }
      currentHunk.lines.push({
        type,
        content,
      });

      if (type === 'addition') {
        totalInsertions++;
      } else if (type === 'deletion') {
        totalDeletions++;
      }
    } else if (line === '\\ No newline at end of file') {
      if (currentHunk) {
        if (!currentHunk.lines) {
          currentHunk.lines = [];
        }
        currentHunk.lines.push({
          type: 'no-newline',
          content: line,
        });
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
    });
  }
  if (currentFile) {
    files.push({
      path: currentFile.path!,
      oldPath: currentFile.oldPath,
      status: currentFile.status!,
      hunks: currentFile.hunks!,
      binary: currentFile.binary!,
      similarity: currentFile.similarity,
    });
  }

  const summary: DiffSummary = {
    totalFiles: files.length,
    insertions: totalInsertions,
    deletions: totalDeletions,
    binary: binaryFiles,
  };

  return {
    files,
    summary,
  };
};

const parseDiffSummary = (output: string): DiffSummary => {
  const lines = output.split('\n');
  const files: string[] = [];
  let insertions = 0;
  let deletions = 0;
  let binary = 0;

  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const filename = parts[0].trim();
        const stats = parts[1].trim();

        if (filename && !files.includes(filename)) {
          files.push(filename);
        }

        if (stats.includes('Bin')) {
          binary++;
        } else {
          const match = stats.match(/(\d+) \+/);
          if (match) {
            insertions += parseInt(match[1], 10);
          }

          const deleteMatch = stats.match(/(\d+) -/);
          if (deleteMatch) {
            deletions += parseInt(deleteMatch[1], 10);
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
  };
};
