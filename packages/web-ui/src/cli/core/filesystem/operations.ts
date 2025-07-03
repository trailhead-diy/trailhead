/**
 * File operation utilities for installation
 */

import * as path from 'path';
import type { FileSystem, Result, InstallError } from '../installation/types.js';
import { Ok, Err } from '../installation/types.js';
import type { Logger } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// FILE EXISTENCE CHECKING
// ============================================================================

/**
 * Check if files already exist and would be overwritten
 */
export const checkExistingFiles = async (
  fs: FileSystem,
  paths: string[]
): Promise<Result<string[], InstallError>> => {
  const existingFiles: string[] = [];

  for (const filePath of paths) {
    const existsResult = await fs.exists(filePath);
    if (!existsResult.success) return existsResult;

    if (existsResult.value) {
      existingFiles.push(path.relative(process.cwd(), filePath));
    }
  }

  return Ok(existingFiles);
};

/**
 * Check if directory exists and contains files
 */
export const checkDirectoryContents = async (
  fs: FileSystem,
  dirPath: string
): Promise<Result<{ exists: boolean; files: string[] }, InstallError>> => {
  const existsResult = await fs.exists(dirPath);
  if (!existsResult.success) return existsResult;

  if (!existsResult.value) {
    return Ok({ exists: false, files: [] });
  }

  const readDirResult = await fs.readDir(dirPath);
  if (!readDirResult.success) return readDirResult;

  return Ok({ exists: true, files: readDirResult.value });
};

// ============================================================================
// DIRECTORY OPERATIONS
// ============================================================================

/**
 * Ensure all required directories exist
 */
export const ensureDirectories = async (
  fs: FileSystem,
  directories: string[]
): Promise<Result<void, InstallError>> => {
  for (const dir of directories) {
    const ensureDirResult = await fs.ensureDir(dir);
    if (!ensureDirResult.success) return ensureDirResult;
  }

  return Ok(undefined);
};

/**
 * Create directory structure
 */
export const createDirectoryStructure = async (
  fs: FileSystem,
  baseDir: string,
  structure: string[]
): Promise<Result<void, InstallError>> => {
  const directories = structure.map(dir => path.join(baseDir, dir));
  return ensureDirectories(fs, directories);
};

// ============================================================================
// FILE COPYING
// ============================================================================

export interface CopyFileOptions {
  overwrite?: boolean;
  filter?: (src: string) => boolean;
  transform?: (content: string, filePath: string) => string;
}

/**
 * Copy single file with options
 */
export const copyFile = async (
  fs: FileSystem,
  src: string,
  dest: string,
  options?: CopyFileOptions
): Promise<Result<void, InstallError>> => {
  // Check if source exists
  const existsResult = await fs.exists(src);
  if (!existsResult.success) return existsResult;

  if (!existsResult.value) {
    return Err({
      type: 'FileSystemError',
      message: `Source file not found: ${src}`,
      path: src,
    });
  }

  // Apply filter if provided
  if (options?.filter && !options.filter(src)) {
    return Ok(undefined); // Skip this file
  }

  // Check if destination exists
  const destExistsResult = await fs.exists(dest);
  if (!destExistsResult.success) return destExistsResult;

  if (destExistsResult.value && !options?.overwrite) {
    return Err({
      type: 'FileSystemError',
      message: `Destination file already exists: ${dest}`,
      path: dest,
    });
  }

  // Copy with optional transformation
  if (options?.transform) {
    const readResult = await fs.readFile(src);
    if (!readResult.success) return readResult;

    const transformed = options.transform(readResult.value, src);
    return fs.writeFile(dest, transformed);
  }

  // Direct copy
  return fs.copy(src, dest, { overwrite: options?.overwrite });
};

/**
 * Copy multiple files
 */
export const copyFiles = async (
  fs: FileSystem,
  files: Array<{ src: string; dest: string }>,
  options?: CopyFileOptions,
  logger?: Logger
): Promise<Result<string[], InstallError>> => {
  const copiedFiles: string[] = [];

  for (const file of files) {
    const copyResult = await copyFile(fs, file.src, file.dest, options);
    if (!copyResult.success) return copyResult;

    copiedFiles.push(path.basename(file.dest));
    logger?.debug(`Copied ${path.basename(file.src)} to ${file.dest}`);
  }

  return Ok(copiedFiles);
};

/**
 * Copy directory with filter
 */
export const copyDirectory = async (
  fs: FileSystem,
  src: string,
  dest: string,
  options?: CopyFileOptions
): Promise<Result<string[], InstallError>> => {
  // Check source exists
  const existsResult = await fs.exists(src);
  if (!existsResult.success) return existsResult;

  if (!existsResult.value) {
    return Err({
      type: 'FileSystemError',
      message: `Source directory not found: ${src}`,
      path: src,
    });
  }

  // Ensure destination directory
  const ensureDirResult = await fs.ensureDir(dest);
  if (!ensureDirResult.success) return ensureDirResult;

  // Read source directory
  const readDirResult = await fs.readDir(src);
  if (!readDirResult.success) return readDirResult;

  const copiedFiles: string[] = [];

  for (const file of readDirResult.value) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    // Apply filter
    if (options?.filter && !options.filter(srcPath)) {
      continue;
    }

    // Check if it's a directory
    const statResult = await fs.stat(srcPath);
    if (!statResult.success) continue;

    // Recursively copy subdirectories
    if (statResult.value.isDirectory) {
      const subResult = await copyDirectory(fs, srcPath, destPath, options);
      if (!subResult.success) return subResult;
      copiedFiles.push(...subResult.value);
    } else {
      // Copy file
      const copyResult = await copyFile(fs, srcPath, destPath, options);
      if (!copyResult.success) return copyResult;
      copiedFiles.push(file);
    }
  }

  return Ok(copiedFiles);
};

// ============================================================================
// FILE GENERATION
// ============================================================================

/**
 * Generate file content from template
 */
export const generateFromTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  return Object.entries(variables).reduce(
    (content, [key, value]) => content.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
};

/**
 * Write file with backup
 */
export const writeFileWithBackup = async (
  fs: FileSystem,
  filePath: string,
  content: string,
  backupSuffix: string = '.backup'
): Promise<Result<void, InstallError>> => {
  // Check if file exists
  const existsResult = await fs.exists(filePath);
  if (!existsResult.success) return existsResult;

  // Create backup if file exists
  if (existsResult.value) {
    const backupPath = `${filePath}${backupSuffix}`;
    const copyResult = await fs.copy(filePath, backupPath, { overwrite: true });
    if (!copyResult.success) return copyResult;
  }

  // Write new content
  return fs.writeFile(filePath, content);
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export interface BatchOperation {
  type: 'copy' | 'write' | 'delete' | 'mkdir';
  src?: string;
  dest?: string;
  content?: string;
  path?: string;
}

/**
 * Execute batch operations with rollback capability
 */
export const executeBatchOperations = async (
  fs: FileSystem,
  operations: BatchOperation[],
  dryRun: boolean = false
): Promise<Result<{ completed: string[]; skipped: string[] }, InstallError>> => {
  const completed: string[] = [];
  const skipped: string[] = [];

  for (const op of operations) {
    if (dryRun) {
      // In dry-run mode, just log what would be done
      const description = describeBatchOperation(op);
      skipped.push(description);
      continue;
    }

    try {
      switch (op.type) {
        case 'copy':
          if (!op.src || !op.dest) {
            return Err({
              type: 'ValidationError',
              message: 'Copy operation requires src and dest',
            });
          }
          const copyResult = await fs.copy(op.src, op.dest, { overwrite: true });
          if (!copyResult.success) return copyResult;
          completed.push(`Copied ${op.src} to ${op.dest}`);
          break;

        case 'write':
          if (!op.dest || op.content === undefined) {
            return Err({
              type: 'ValidationError',
              message: 'Write operation requires dest and content',
            });
          }
          const writeResult = await fs.writeFile(op.dest, op.content);
          if (!writeResult.success) return writeResult;
          completed.push(`Wrote ${op.dest}`);
          break;

        case 'delete':
          if (!op.path) {
            return Err({
              type: 'ValidationError',
              message: 'Delete operation requires path',
            });
          }
          const existsResult = await fs.exists(op.path);
          if (!existsResult.success) return existsResult;

          if (existsResult.value) {
            const removeResult = await fs.remove(op.path);
            if (!removeResult.success) return removeResult;
            completed.push(`Deleted ${op.path}`);
          }
          break;

        case 'mkdir':
          if (!op.path) {
            return Err({
              type: 'ValidationError',
              message: 'Mkdir operation requires path',
            });
          }
          const mkdirResult = await fs.ensureDir(op.path);
          if (!mkdirResult.success) return mkdirResult;
          completed.push(`Created directory ${op.path}`);
          break;
      }
    } catch (error) {
      return Err({
        type: 'FileSystemError',
        message: `Batch operation failed: ${describeBatchOperation(op)}`,
        path: op.dest || op.path || op.src || '',
        cause: error,
      });
    }
  }

  return Ok({ completed, skipped });
};

/**
 * Describe a batch operation for logging
 */
function describeBatchOperation(op: BatchOperation): string {
  switch (op.type) {
    case 'copy':
      return `Copy ${op.src} to ${op.dest}`;
    case 'write':
      return `Write ${op.dest}`;
    case 'delete':
      return `Delete ${op.path}`;
    case 'mkdir':
      return `Create directory ${op.path}`;
    default:
      return `Unknown operation: ${op.type}`;
  }
}
