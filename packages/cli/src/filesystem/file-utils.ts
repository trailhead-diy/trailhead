import { promises as fs } from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Use local Result type for file operations that returns regular Error
export type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

const Ok = <T>(value: T): Result<T, never> => ({ success: true, value });
const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

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
  ignorePatterns: string[] = [],
): Promise<Result<string[], Error>> {
  try {
    const fullPattern = path.join(directory, pattern);
    const defaultIgnores = ['**/node_modules/**', '**/dist/**'];

    const files = await glob(fullPattern, {
      ignore: [...defaultIgnores, ...ignorePatterns],
    });

    return Ok(files);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Read file content safely with error handling
 */
export async function readFile(
  filePath: string,
): Promise<Result<string, Error>> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return Ok(content);
  } catch (error) {
    return Err(
      error instanceof Error ? error : new Error(`Failed to read ${filePath}`),
    );
  }
}

/**
 * Write file content safely with error handling
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<Result<void, Error>> {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return Ok(undefined);
  } catch (error) {
    return Err(
      error instanceof Error ? error : new Error(`Failed to write ${filePath}`),
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
 * Create directory if it doesn't exist
 */
export async function ensureDirectory(
  dirPath: string,
): Promise<Result<void, Error>> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return Ok(undefined);
  } catch (error) {
    return Err(
      error instanceof Error
        ? error
        : new Error(`Failed to create directory ${dirPath}`),
    );
  }
}

/**
 * Compare two files for equality
 */
export async function compareFiles(
  sourcePath: string,
  destPath: string,
): Promise<Result<FileComparison, Error>> {
  try {
    const sourceExists = await fileExists(sourcePath);
    const destExists = await fileExists(destPath);

    if (!sourceExists) {
      return Ok({
        sourceExists: false,
        destExists,
        identical: false,
      });
    }

    const sourceResult = await readFile(sourcePath);
    if (!sourceResult.success) {
      return Err(sourceResult.error);
    }

    const sourceContent = sourceResult.value;

    if (!destExists) {
      return Ok({
        sourceExists: true,
        destExists: false,
        identical: false,
        sourceContent,
      });
    }

    const destResult = await readFile(destPath);
    if (!destResult.success) {
      return Err(destResult.error);
    }

    const destContent = destResult.value;
    const identical = sourceContent === destContent;

    return Ok({
      sourceExists: true,
      destExists: true,
      identical,
      sourceContent,
      destContent,
    });
  } catch (error) {
    return Err(
      error instanceof Error
        ? error
        : new Error(`Failed to compare files: ${sourcePath} vs ${destPath}`),
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
  modified: number = 0,
): FileStats {
  return {
    ...stats,
    filesProcessed: stats.filesProcessed + processed,
    filesModified: stats.filesModified + modified,
  };
}
