#!/usr/bin/env tsx

/**
 * Shared file utilities for conversion scripts
 * Reliability and performance focused utilities
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import {
  fileExists as frameworkFileExists,
  ensureDirectory as frameworkEnsureDirectory,
  getRelativePath as frameworkGetRelativePath,
  createBackupName as frameworkCreateBackupName,
  findFiles,
  readFile,
  writeFile as frameworkWriteFile,
  compareFiles as frameworkCompareFiles,
  type FileComparison,
} from '@trailhead/cli/filesystem'
import {
  createStats,
  updateStats as frameworkUpdateStats,
  type StatsTracker,
} from '@trailhead/cli'
import type {
  ConversionStats,
  FileProcessingResult,
  ConverterConfig,
  Result,
  AsyncResult,
} from './types.js'

/**
 * Find component files to process based on configuration
 * Pure function that respects skip patterns and ignore rules
 */
export async function findComponentFiles(
  directory: string,
  skipFiles: string[] = []
): Promise<Result<string[], Error>> {
  const ignorePatterns = ['**/*.test.tsx', '**/*.spec.tsx']

  // Add skip files to ignore patterns
  skipFiles.forEach((skipFile) => {
    ignorePatterns.push(`**/${skipFile}`)
  })

  return findFiles(directory, '**/*.tsx', ignorePatterns)
}

/**
 * Create initial conversion statistics object
 * Pure function with performance tracking
 */
export function createConversionStats(): ConversionStats {
  const stats = createStats<{ totalConversions: number }>({
    totalConversions: 0,
  })

  return {
    filesProcessed: stats.filesProcessed,
    filesModified: stats.filesModified,
    totalConversions: stats.custom?.totalConversions || 0,
    conversionsByType: stats.operationsByType,
    startTime: stats.startTime,
  }
}

/**
 * Update conversion statistics with file results
 * Pure function for immutable updates
 */
export function updateStats(
  stats: ConversionStats,
  result: FileProcessingResult,
  conversionTypes: Array<{ description: string }>
): ConversionStats {
  // Convert to StatsTracker format
  const tracker: StatsTracker<{ totalConversions: number }> = {
    filesProcessed: stats.filesProcessed,
    filesModified: stats.filesModified,
    totalOperations: stats.totalConversions,
    operationsByType: stats.conversionsByType,
    startTime: stats.startTime,
    custom: { totalConversions: stats.totalConversions },
  }

  const operationTypes = result.success && result.changes > 0
    ? conversionTypes.map(({ description }) => ({ type: description, count: 1 }))
    : []

  const updatedTracker = frameworkUpdateStats(tracker, {
    filesProcessed: 1,
    filesModified: result.success && result.changes > 0 ? 1 : 0,
    operations: result.success ? result.changes : 0,
    operationTypes,
    custom: {
      totalConversions: stats.totalConversions + (result.success ? result.changes : 0),
    },
  })

  // Convert back to ConversionStats format
  return {
    filesProcessed: updatedTracker.filesProcessed,
    filesModified: updatedTracker.filesModified,
    totalConversions: updatedTracker.custom?.totalConversions || 0,
    conversionsByType: updatedTracker.operationsByType,
    startTime: updatedTracker.startTime,
  }
}

/**
 * Read file content safely with error handling
 */
export async function readFileContent(filePath: string): AsyncResult<string, Error> {
  return readFile(filePath)
}

/**
 * Write file content safely with error handling
 */
export async function writeFileContent(
  filePath: string,
  content: string,
  dryRun: boolean = false
): AsyncResult<boolean, Error> {
  if (dryRun) {
    return { success: true, value: true }
  }

  const result = await frameworkWriteFile(filePath, content)
  if (result.success) {
    return { success: true, value: true }
  } else {
    return { success: false, error: result.error }
  }
}

// Re-export framework utilities for backward compatibility
export const fileExists = frameworkFileExists

// Adapter for ensureDirectory to match local AsyncResult type
export async function ensureDirectory(dirPath: string): AsyncResult<boolean, Error> {
  const result = await frameworkEnsureDirectory(dirPath)
  if (result.success) {
    return { success: true, value: true }
  } else {
    return { success: false, error: result.error }
  }
}

export const getRelativePath = frameworkGetRelativePath

export const createBackupName = frameworkCreateBackupName

export const compareFiles = frameworkCompareFiles

/**
 * Copy fresh files from catalyst source to destination with batch confirmation
 * Returns list of files that were copied or need confirmation
 */
export async function copyFreshFilesBatch(
  catalystSourceDir: string,
  destDir: string,
  force: boolean = false,
  addPrefix: boolean = false
): AsyncResult<
  {
    copied: string[]
    skipped: string[]
    failed: string[]
    filesToConfirm: Array<{
      fileName: string
      sourceFile: string
      destFile: string
      comparison: FileComparison
    }>
  },
  Error
> {
  try {
    // If we're adding prefixes, clean up old non-prefixed files first
    if (addPrefix && (await frameworkFileExists(destDir))) {
      try {
        const existingFiles = await fs.readdir(destDir)
        const nonPrefixedFiles = existingFiles.filter(
          (f) => !f.startsWith('catalyst-') && f.endsWith('.tsx')
        )

        // Remove old non-prefixed files
        for (const file of nonPrefixedFiles) {
          const filePath = path.join(destDir, file)
          try {
            await fs.unlink(filePath)
          } catch (_error) {
            // Ignore errors for individual file deletions
          }
        }
      } catch (_error) {
        // Ignore errors if we can't read the directory
      }
    }

    // Find all .tsx files in catalyst source
    const sourceFilesResult = await findComponentFiles(catalystSourceDir, [])
    if (!sourceFilesResult.success) {
      return { success: false, error: sourceFilesResult.error }
    }

    const copied: string[] = []
    const skipped: string[] = []
    const failed: string[] = []
    const filesToConfirm: Array<{
      fileName: string
      sourceFile: string
      destFile: string
      comparison: FileComparison
    }> = []

    // First pass: analyze all files
    for (const sourceFile of sourceFilesResult.value) {
      const fileName = path.basename(sourceFile)
      // Add 'catalyst-' prefix if addPrefix is true and prefix not already present
      const destFileName =
        addPrefix && !fileName.startsWith('catalyst-') ? `catalyst-${fileName}` : fileName
      const destFile = path.join(destDir, destFileName)

      // Compare files
      const comparisonResult = await frameworkCompareFiles(sourceFile, destFile)
      if (!comparisonResult.success) {
        failed.push(destFileName)
        continue
      }

      const comparison = comparisonResult.value

      // If source doesn't exist, skip
      if (!comparison.sourceExists) {
        skipped.push(destFileName)
        continue
      }

      // If files are identical, skip
      if (comparison.identical) {
        skipped.push(destFileName)
        continue
      }

      // If destination doesn't exist, copy directly
      if (!comparison.destExists) {
        const sourceContent = comparison.sourceContent || ''
        const copyResult = await writeFileContent(destFile, sourceContent)
        if (copyResult.success) {
          copied.push(destFileName)
        } else {
          failed.push(destFileName)
        }
        continue
      }

      // Destination exists and is different
      if (force) {
        const sourceContent = comparison.sourceContent || ''
        const copyResult = await writeFileContent(destFile, sourceContent)
        if (copyResult.success) {
          copied.push(destFileName)
        } else {
          failed.push(destFileName)
        }
      } else {
        // Collect for confirmation
        filesToConfirm.push({ fileName: destFileName, sourceFile, destFile, comparison })
      }
    }

    return {
      success: true,
      value: { copied, skipped, failed, filesToConfirm },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to copy fresh files'),
    }
  }
}

/**
 * Copy fresh files from catalyst source to destination
 * Returns list of files that were copied or need confirmation
 */
export async function copyFreshFiles(
  catalystSourceDir: string,
  destDir: string,
  force: boolean = false,
  onConfirmOverwrite?: (filePath: string, comparison: FileComparison) => Promise<boolean>,
  addPrefix: boolean = false
): AsyncResult<{ copied: string[]; skipped: string[]; failed: string[] }, Error> {
  try {
    // Find all .tsx files in catalyst source
    const sourceFilesResult = await findComponentFiles(catalystSourceDir, [])
    if (!sourceFilesResult.success) {
      return { success: false, error: sourceFilesResult.error }
    }

    const copied: string[] = []
    const skipped: string[] = []
    const failed: string[] = []

    for (const sourceFile of sourceFilesResult.value) {
      const fileName = path.basename(sourceFile)
      // Add 'catalyst-' prefix if addPrefix is true and prefix not already present
      const destFileName =
        addPrefix && !fileName.startsWith('catalyst-') ? `catalyst-${fileName}` : fileName
      const destFile = path.join(destDir, destFileName)

      // Compare files
      const comparisonResult = await frameworkCompareFiles(sourceFile, destFile)
      if (!comparisonResult.success) {
        failed.push(destFileName)
        continue
      }

      const comparison = comparisonResult.value

      // If source doesn't exist, skip
      if (!comparison.sourceExists) {
        skipped.push(destFileName)
        continue
      }

      // If files are identical, skip
      if (comparison.identical) {
        skipped.push(destFileName)
        continue
      }

      // If destination doesn't exist, copy directly
      if (!comparison.destExists) {
        const sourceContent = comparison.sourceContent || ''
        const copyResult = await writeFileContent(destFile, sourceContent)
        if (copyResult.success) {
          copied.push(destFileName)
        } else {
          failed.push(destFileName)
        }
        continue
      }

      // Destination exists and is different - need confirmation
      let shouldCopy = force

      if (!force && onConfirmOverwrite) {
        shouldCopy = await onConfirmOverwrite(destFileName, comparison)
      }

      if (shouldCopy) {
        const sourceContent = comparison.sourceContent || ''
        const copyResult = await writeFileContent(destFile, sourceContent)
        if (copyResult.success) {
          copied.push(destFileName)
        } else {
          failed.push(destFileName)
        }
      } else {
        skipped.push(destFileName)
      }
    }

    return {
      success: true,
      value: { copied, skipped, failed },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to copy fresh files'),
    }
  }
}


//TODO: Delete?
/**
 * Validate converter configuration
 * Pure function with comprehensive checks
 */
export function validateConfig(config: ConverterConfig): Result<ConverterConfig, Error> {
  if (!config.name || config.name.trim().length === 0) {
    return { success: false, error: new Error('Converter name is required') }
  }

  if (!config.description || config.description.trim().length === 0) {
    return { success: false, error: new Error('Converter description is required') }
  }

  return { success: true, value: config }
}
