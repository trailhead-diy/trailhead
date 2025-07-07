#!/usr/bin/env tsx

/**
 * UI-specific file utilities for Trailhead web-ui
 * Focused on Catalyst component operations and UI installation workflows
 */

import * as path from 'path';
import {
  findFiles,
  readFile,
  writeFile as frameworkWriteFile,
  compareFiles as frameworkCompareFiles,
  type FileComparison,
} from '@esteban-url/trailhead-cli/filesystem';
import {
  createStats,
  updateStats as frameworkUpdateStats,
  type StatsTracker,
} from '@esteban-url/trailhead-cli/utils';
import type {
  ConversionStats,
  FileProcessingResult,
  ConverterConfig,
  Result,
  AsyncResult,
} from './types.js';

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
    ...skipFiles.map(f => `**/${f}`),
  ]);

  return result.success ? result.value : [];
}

/**
 * Create conversion statistics tracker for UI transformations
 */
export function createConversionStats(): ConversionStats {
  const stats = createStats<{ totalConversions: number }>({
    totalConversions: 0,
  });

  return {
    filesProcessed: stats.filesProcessed,
    filesModified: stats.filesModified,
    totalConversions: stats.custom?.totalConversions || 0,
    conversionsByType: stats.operationsByType,
    startTime: stats.startTime,
  };
}

/**
 * Update conversion statistics with processing results
 */
export function updateStats(
  stats: ConversionStats,
  result: FileProcessingResult,
  conversionTypes: Array<{ description: string }>
): ConversionStats {
  const tracker: StatsTracker<{ totalConversions: number }> = {
    filesProcessed: stats.filesProcessed,
    filesModified: stats.filesModified,
    totalOperations: stats.totalConversions,
    operationsByType: stats.conversionsByType,
    startTime: stats.startTime,
    custom: { totalConversions: stats.totalConversions },
  };

  const operationTypes =
    result.success && result.changes > 0
      ? conversionTypes.map(({ description }) => ({ type: description, count: 1 }))
      : [];

  const updatedTracker = frameworkUpdateStats(tracker, {
    filesProcessed: 1,
    filesModified: result.success && result.changes > 0 ? 1 : 0,
    operations: result.success ? result.changes : 0,
    operationTypes,
    custom: {
      totalConversions: stats.totalConversions + (result.success ? result.changes : 0),
    },
  });

  // Convert back to ConversionStats format
  return {
    filesProcessed: updatedTracker.filesProcessed,
    filesModified: updatedTracker.filesModified,
    totalConversions: updatedTracker.custom?.totalConversions || 0,
    conversionsByType: updatedTracker.operationsByType,
    startTime: updatedTracker.startTime,
  };
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
): AsyncResult<
  {
    copied: string[];
    skipped: string[];
    failed: string[];
    filesToConfirm: Array<{
      fileName: string;
      sourceFile: string;
      destFile: string;
      comparison: FileComparison;
    }>;
  },
  Error
> {
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
      const _relativePath = path.relative(catalystSourceDir, sourceFile);
      const fileName = path.basename(sourceFile);
      const destFileName = addPrefix ? `catalyst-${fileName}` : fileName;
      const destFile = path.join(destDir, destFileName);

      // Check if destination exists and compare
      const comparisonResult = await frameworkCompareFiles(sourceFile, destFile);

      if (!comparisonResult.success) {
        failed.push(destFileName);
        continue;
      }

      const comparison = comparisonResult.value;

      if (!comparison.destExists) {
        // File doesn't exist at destination, copy it
        const sourceResult = await readFile(sourceFile);
        if (sourceResult.success) {
          const writeResult = await frameworkWriteFile(destFile, sourceResult.value);
          if (writeResult.success) {
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
        if (sourceResult.success) {
          const writeResult = await frameworkWriteFile(destFile, sourceResult.value);
          if (writeResult.success) {
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

    return {
      success: true,
      value: { copied, skipped, failed, filesToConfirm },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to copy fresh files'),
    };
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
): AsyncResult<{ copied: string[]; skipped: string[] }, Error> {
  try {
    const batchResult = await copyFreshFilesBatch(catalystSourceDir, destDir, force, addPrefix);

    if (!batchResult.success) {
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
          if (sourceResult.success) {
            const writeResult = await frameworkWriteFile(destFile, sourceResult.value);
            if (writeResult.success) {
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

    return {
      success: true,
      value: { copied: finalCopied, skipped: finalSkipped },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to copy fresh files'),
    };
  }
}

/**
 * Validate UI converter configuration
 */
export function validateConfig(config: ConverterConfig): Result<ConverterConfig, Error> {
  if (!config.name || config.name.trim().length === 0) {
    return { success: false, error: new Error('Converter name is required') };
  }

  if (!config.description || config.description.trim().length === 0) {
    return { success: false, error: new Error('Converter description is required') };
  }

  return { success: true, value: config };
}
