import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Import CLI framework types for consistent error handling
import type { Result, CLIError } from '../core/index.js';
import { createError, ok, err } from '../core/index.js';

export interface FileComparison {
  readonly sourceExists: boolean;
  readonly destExists: boolean;
  readonly identical: boolean;
  readonly sourceContent?: string;
  readonly destContent?: string;
}

export interface FileStats {
  readonly filesProcessed: number;
  readonly filesModified: number;
  readonly startTime: number;
}

/**
 * Find files matching pattern with ignore rules
 * Pure function that respects skip patterns
 */
export async function findFiles(
  directory: string,
  pattern: string,
  ignorePatterns: string[] = []
): Promise<Result<string[], CLIError>> {
  try {
    const fullPattern = path.join(directory, pattern);
    const defaultIgnores = ['**/node_modules/**', '**/dist/**'];

    const files = await glob(fullPattern, {
      ignore: [...defaultIgnores, ...ignorePatterns],
    });

    return ok(files);
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to find files', {
        details: `Pattern: ${pattern} in ${directory}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }
}

/**
 * Read file content safely with error handling
 */
export async function readFile(filePath: string): Promise<Result<string, CLIError>> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return ok(content);
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to read file', {
        details: `Path: ${filePath}`,
        cause: error instanceof Error ? error : new Error(`Failed to read ${filePath}`),
      })
    );
  }
}

/**
 * Write file content safely with error handling
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<Result<void, CLIError>> {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return ok(undefined);
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to write file', {
        details: `Path: ${filePath}`,
        cause: error instanceof Error ? error : new Error(`Failed to write ${filePath}`),
      })
    );
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path exists with Result-based error handling
 */
export async function pathExists(filePath: string): Promise<Result<boolean, CLIError>> {
  try {
    await fs.access(filePath);
    return ok(true);
  } catch (error) {
    // If access fails with ENOENT, the file doesn't exist
    if ((error as any).code === 'ENOENT') {
      return ok(false);
    }
    // Other errors are actual filesystem errors
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to check path existence', {
        details: `Path: ${filePath}`,
        cause:
          error instanceof Error ? error : new Error(`Failed to check path existence: ${filePath}`),
      })
    );
  }
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDirectory(dirPath: string): Promise<Result<void, CLIError>> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return ok(undefined);
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to create directory', {
        details: `Path: ${dirPath}`,
        cause: error instanceof Error ? error : new Error(`Failed to create directory ${dirPath}`),
      })
    );
  }
}

/**
 * Compare two files for equality
 */
export async function compareFiles(
  sourcePath: string,
  destPath: string
): Promise<Result<FileComparison, CLIError>> {
  try {
    const sourceExists = await fileExists(sourcePath);
    const destExists = await fileExists(destPath);

    if (!sourceExists) {
      return ok({
        sourceExists: false,
        destExists,
        identical: false,
      });
    }

    const sourceResult = await readFile(sourcePath);
    if (sourceResult.isErr()) {
      return err(sourceResult.error);
    }

    const sourceContent = sourceResult.value;

    if (!destExists) {
      return ok({
        sourceExists: true,
        destExists: false,
        identical: false,
        sourceContent,
      });
    }

    const destResult = await readFile(destPath);
    if (destResult.isErr()) {
      return err(destResult.error);
    }

    const destContent = destResult.value;
    const identical = sourceContent === destContent;

    return ok({
      sourceExists: true,
      destExists: true,
      identical,
      sourceContent,
      destContent,
    });
  } catch (error) {
    return err(
      createError('FILESYSTEM_ERROR', 'Failed to compare files', {
        details: `Source: ${sourcePath}, Destination: ${destPath}`,
        cause:
          error instanceof Error
            ? error
            : new Error(`Failed to compare files: ${sourcePath} vs ${destPath}`),
      })
    );
  }
}

/**
 * Get relative path from cwd for display
 */
export function getRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

/**
 * Create timestamp string for backups
 */
export function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Create backup directory/file name with timestamp
 * Pure function for consistent naming
 */
export function createBackupName(prefix: string = 'backup'): string {
  const timestamp = createTimestamp();
  return `${prefix}-${timestamp}`;
}

/**
 * Create file statistics tracker
 */
export function createFileStats(): FileStats {
  return {
    filesProcessed: 0,
    filesModified: 0,
    startTime: Date.now(),
  };
}

/**
 * Update file statistics immutably
 */
export function updateFileStats(
  stats: FileStats,
  processed: number = 1,
  modified: number = 0
): FileStats {
  return {
    ...stats,
    filesProcessed: stats.filesProcessed + processed,
    filesModified: stats.filesModified + modified,
  };
}
