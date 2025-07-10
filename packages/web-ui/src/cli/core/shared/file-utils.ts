#!/usr/bin/env tsx

/**
 * UI-specific file utilities for Trailhead web-ui
 * Focused on Catalyst component operations and UI installation workflows
 */

import * as path from 'node:path';
import {
  findFiles,
  readFile,
  writeFile as frameworkWriteFile,
  compareFiles as frameworkCompareFiles,
  type FileComparison,
} from '@esteban-url/trailhead-cli/filesystem';
import type {
  ConversionStats,
  FileProcessingResult,
  ConverterConfig,
  Result,
  AsyncResult,
} from './types.js';
import { createError, ok, err } from '@esteban-url/trailhead-cli/core';
import { isNotTestRelated } from './file-filters.js';

// ============================================================================
// CONVERSION STATS UTILITIES
// ============================================================================

/**
 * Create initial conversion statistics
 */
export function createConversionStats(): ConversionStats {
  return {
    filesProcessed: 0,
    filesModified: 0,
    totalConversions: 0,
    conversionsByType: new Map(),
  };
}

/**
 * Update conversion statistics with processing results
 */
export function updateStats(
  stats: ConversionStats,
  result: FileProcessingResult,
  conversionTypes: { description: string }[]
): ConversionStats {
  const newStats: ConversionStats = {
    filesProcessed: stats.filesProcessed + 1,
    filesModified: stats.filesModified + (result.success && result.changes > 0 ? 1 : 0),
    totalConversions: stats.totalConversions + (result.success ? result.changes : 0),
    conversionsByType: new Map(stats.conversionsByType),
  };

  // Update conversion type counts
  for (const conversion of conversionTypes) {
    const current = newStats.conversionsByType.get(conversion.description) || 0;
    newStats.conversionsByType.set(conversion.description, current + 1);
  }

  return newStats;
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Get relative path for display purposes
 */
export function getRelativePath(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath);
}

// ============================================================================
// UI-SPECIFIC FILE OPERATIONS
// ============================================================================

/**
 * Find component files specifically for UI component processing
 */
export async function findComponentFiles(
  directory: string,
  skipFiles: string[] = []
): Promise<string[]> {
  const result = await findFiles(directory, '**/*.{tsx,ts}', [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '**/__tests__/**',
    '**/*.test.*',
    '**/*.spec.*',
    ...skipFiles.map(f => `**/${f}`),
  ]);

  if (!result.isOk()) {
    return [];
  }

  // Additional filtering to ensure no test files are included
  return result.value.filter(file => isNotTestRelated(file));
}

/**
 * Copy fresh Catalyst files in batch mode for development workflow
 * Returns list of files that were copied or need confirmation
 */
export async function copyFreshFilesBatch(
  catalystSourceDir: string,
  destDir: string,
  force: boolean = false,
  addPrefix: boolean = false
): AsyncResult<{
  copied: string[];
  skipped: string[];
  failed: string[];
  filesToConfirm: Array<{
    fileName: string;
    sourceFile: string;
    destFile: string;
    comparison: FileComparison;
  }>;
}> {
  try {
    const sourceFiles = await findComponentFiles(catalystSourceDir);
    const copied: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];
    const filesToConfirm: Array<{
      fileName: string;
      sourceFile: string;
      destFile: string;
      comparison: FileComparison;
    }> = [];

    for (const sourceFile of sourceFiles) {
      const fileName = path.basename(sourceFile);
      const destFileName = addPrefix ? `catalyst-${fileName}` : fileName;
      const destFile = path.join(destDir, destFileName);

      // Check if destination exists and compare
      const comparisonResult = await frameworkCompareFiles(sourceFile, destFile);

      if (!comparisonResult.isOk()) {
        failed.push(destFileName);
        continue;
      }

      const comparison = comparisonResult.value;

      if (!comparison.destExists) {
        // File doesn't exist at destination, copy it
        const sourceResult = await readFile(sourceFile);
        if (sourceResult.isOk()) {
          const writeResult = await frameworkWriteFile(destFile, sourceResult.value);
          if (writeResult.isOk()) {
            copied.push(destFileName);
          } else {
            failed.push(destFileName);
          }
        } else {
          failed.push(destFileName);
        }
        continue;
      }

      if (comparison.identical) {
        skipped.push(destFileName);
        continue;
      }

      // Destination exists and is different
      if (force) {
        const sourceResult = await readFile(sourceFile);
        if (sourceResult.isOk()) {
          const writeResult = await frameworkWriteFile(destFile, sourceResult.value);
          if (writeResult.isOk()) {
            copied.push(destFileName);
          } else {
            failed.push(destFileName);
          }
        } else {
          failed.push(destFileName);
        }
      } else {
        // Collect for confirmation
        filesToConfirm.push({ fileName: destFileName, sourceFile, destFile, comparison });
      }
    }

    return ok({ copied, skipped, failed, filesToConfirm });
  } catch (error) {
    return err(
      createError('FILE_OPERATION_ERROR', 'Failed to copy fresh files', {
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Copy fresh files from catalyst source to destination with confirmation support
 */
export async function copyFreshFiles(
  catalystSourceDir: string,
  destDir: string,
  force: boolean = false,
  onConfirmOverwrite?: (filePath: string, comparison: FileComparison) => Promise<boolean>,
  addPrefix: boolean = false
): AsyncResult<{ copied: string[]; skipped: string[] }> {
  try {
    const batchResult = await copyFreshFilesBatch(catalystSourceDir, destDir, force, addPrefix);

    if (!batchResult.isOk()) {
      return batchResult;
    }

    const { copied, skipped, filesToConfirm } = batchResult.value;
    const finalCopied = [...copied];
    const finalSkipped = [...skipped];

    // Handle confirmation for conflicting files
    for (const { fileName, sourceFile, destFile, comparison } of filesToConfirm) {
      if (onConfirmOverwrite) {
        const shouldOverwrite = await onConfirmOverwrite(destFile, comparison);
        if (shouldOverwrite) {
          const sourceResult = await readFile(sourceFile);
          if (sourceResult.isOk()) {
            const writeResult = await frameworkWriteFile(destFile, sourceResult.value);
            if (writeResult.isOk()) {
              finalCopied.push(fileName);
            }
          }
        } else {
          finalSkipped.push(fileName);
        }
      } else {
        finalSkipped.push(fileName);
      }
    }

    return ok({ copied: finalCopied, skipped: finalSkipped });
  } catch (error) {
    return err(
      createError('FILE_OPERATION_ERROR', 'Failed to copy fresh files', {
        cause: error instanceof Error ? error : undefined,
      })
    );
  }
}

/**
 * Validate UI converter configuration
 */
export function validateConfig(config: ConverterConfig): Result<ConverterConfig, any> {
  if (!config.name || config.name.trim().length === 0) {
    return err(createError('VALIDATION_ERROR', 'Converter name is required'));
  }

  if (!config.description || config.description.trim().length === 0) {
    return err(createError('VALIDATION_ERROR', 'Converter description is required'));
  }

  return ok(config);
}
