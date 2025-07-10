/**
 * Transform integration for Trailhead UI install script
 * Uses shared transform-core for consistent behavior across CLI and install
 */

import * as path from 'node:path';
import ora from 'ora';
import type { InstallError, FileSystem, Logger, Result, InstallConfig } from './types.js';
import { ok, err, createError } from '@esteban-url/trailhead-cli/core';
import { isTsxFile } from '../shared/file-filters.js';
import { pathExists } from '@esteban-url/trailhead-cli/filesystem';

import type { TransformResult } from '../shared/transform-core.js';
import {
  executeTransforms,
  validateTransformConfig,
  type TransformConfig,
} from '../shared/transform-core.js';

// ============================================================================
// ADAPTER TYPES - Bridge between install and transform interfaces
// ============================================================================

/**
 * Legacy interface for backward compatibility
 * Maps to TransformResult from shared core
 */
export interface ConversionStats {
  readonly filesProcessed: number;
  readonly filesModified: number;
  readonly conversionsApplied: number;
  readonly errors: readonly string[];
}

// ============================================================================
// TRANSFORM ORCHESTRATION - Using shared core
// ============================================================================

/**
 * Run color token conversions on installed components
 * Now uses shared transform-core for consistent behavior
 */
export const runColorConversions = async (
  fs: FileSystem,
  logger: Logger,
  config: InstallConfig
): Promise<Result<ConversionStats, InstallError>> => {
  const spinner = ora('Preparing transform pipeline...').start();

  try {
    // Path to the catalyst components directory
    const catalystDir = path.join(config.libDir, 'catalyst');

    // Verify that the catalyst directory exists
    spinner.text = 'Verifying catalyst directory...';

    const existsResult = await pathExists(catalystDir);
    if (!existsResult.isOk()) {
      spinner.fail('Failed to check catalyst directory');
      return err(
        createError('CONVERSION_ERROR', 'Failed to check catalyst directory', {
          cause: existsResult.error,
        })
      );
    }

    if (!existsResult.value) {
      spinner.fail('Catalyst components directory not found');
      return err(
        createError('CONVERSION_ERROR', `Catalyst components directory not found: ${catalystDir}`)
      );
    }

    // Create transform configuration
    const transformConfig: TransformConfig = {
      srcDir: catalystDir,
      verbose: false, // Keep quiet during install
      dryRun: false,
      skipTransforms: true, // Components already copied by install process
    };

    // Validate configuration
    const validation = validateTransformConfig(transformConfig);
    if (!validation.isOk()) {
      spinner.fail('Invalid transform configuration');
      return err(
        createError('CONVERSION_ERROR', `Invalid transform configuration: ${validation.error}`)
      );
    }

    // Execute transforms using shared core
    spinner.text = 'Executing transforms pipeline...';
    spinner.stop(); // Stop spinner to avoid conflicts with executeTransforms

    const transformResult = await executeTransforms(transformConfig);

    // Convert result to legacy format for backward compatibility
    const actualResult = transformResult.isOk()
      ? transformResult.value
      : {
          filesProcessed: 0,
          filesModified: 0,
          conversionsApplied: 0,
          errors: ['Transform failed'],
          warnings: [],
        };
    const stats = transformResultToConversionStats(actualResult);

    // Show results
    if (stats.filesModified > 0) {
      logger.success(`Transform pipeline completed: ${stats.filesModified} files modified`);
      if (stats.conversionsApplied > 0) {
        logger.info(`Applied ${stats.conversionsApplied} semantic token conversions`);
      }
    } else {
      logger.info('No conversions needed - files already use semantic tokens');
    }

    if (stats.errors.length > 0) {
      logger.warning(`Transform warnings (${stats.errors.length}):`);
      stats.errors.forEach(error => logger.warning(`  • ${error}`));
    }

    return ok(stats);
  } catch (error) {
    spinner.fail('Transform pipeline failed');
    return err(
      createError(
        'CONVERSION_ERROR',
        `Transform pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

// ============================================================================
// ADAPTER FUNCTIONS - Bridge between interfaces
// ============================================================================

/**
 * Pure function: Convert TransformResult to ConversionStats
 * Adapter pattern for backward compatibility
 */
const transformResultToConversionStats = (result: TransformResult): ConversionStats => ({
  filesProcessed: result.filesProcessed,
  filesModified: result.filesModified,
  conversionsApplied: result.conversionsApplied,
  errors: [...result.errors, ...result.warnings], // Combine errors and warnings
});

// ============================================================================
// LEGACY FUNCTIONS - Kept for backward compatibility
// ============================================================================

// ============================================================================
// CONVERSION VALIDATION
// ============================================================================

/**
 * Validate that conversions were applied successfully
 */
export const validateConversions = async (
  fs: FileSystem,
  _logger: Logger,
  config: InstallConfig
): Promise<Result<boolean, InstallError>> => {
  const spinner = ora('Validating semantic token conversions...').start();

  try {
    const catalystDir = path.join(config.libDir, 'catalyst');

    // Read a few sample files to check if they contain semantic tokens
    const sampleFiles = ['button.tsx', 'input.tsx', 'alert.tsx'];
    let hasSemanticTokens = false;

    for (const fileName of sampleFiles) {
      const filePath = path.join(catalystDir, fileName);

      const existsResult = await pathExists(filePath);
      if (!existsResult.isOk()) continue;

      if (existsResult.value) {
        const readResult = await fs.readFile(filePath);
        if (!readResult.isOk()) continue;

        const content = readResult.value;

        // Check for semantic token patterns
        const hasTokens =
          content.includes('bg-primary') ||
          content.includes('text-primary') ||
          content.includes('border-primary') ||
          content.includes('ring-primary');

        if (hasTokens) {
          hasSemanticTokens = true;
          break;
        }
      }
    }

    if (hasSemanticTokens) {
      spinner.succeed('Semantic token validation passed');
    } else {
      spinner.warn('Semantic tokens not detected - components may need manual updates');
    }

    return ok(hasSemanticTokens);
  } catch (error) {
    spinner.fail('Failed to validate conversions');
    return err(createError('CONVERSION_ERROR', 'Failed to validate conversions', { cause: error }));
  }
};

// ============================================================================
// UTILITY FUNCTIONS - Shared utilities now in transform-core
// ============================================================================

/**
 * Check if conversion is needed based on file content
 */
export const needsConversion = async (
  fs: FileSystem,
  filePath: string
): Promise<Result<boolean, InstallError>> => {
  const readResult = await fs.readFile(filePath);
  if (!readResult.isOk()) {
    return err(
      createError('CONVERSION_ERROR', 'Failed to read file for conversion check', {
        cause: readResult.error,
      })
    );
  }

  const content = readResult.value;

  // Look for hardcoded color patterns that should be converted
  const hardcodedPatterns = [
    /bg-zinc-\d+/,
    /text-zinc-\d+/,
    /border-zinc-\d+/,
    /ring-zinc-\d+/,
    /bg-slate-\d+/,
    /text-slate-\d+/,
  ];

  const needsConv = hardcodedPatterns.some(pattern => pattern.test(content));
  return ok(needsConv);
};

/**
 * Get list of files that need conversion
 */
export const getFilesNeedingConversion = async (
  fs: FileSystem,
  catalystDir: string
): Promise<Result<string[], InstallError>> => {
  const readDirResult = await fs.readdir(catalystDir);
  if (!readDirResult.isOk()) return err(readDirResult.error);

  const files = readDirResult.value.filter(isTsxFile);
  const filesNeedingConversion: string[] = [];

  for (const file of files) {
    const filePath = path.join(catalystDir, file);
    const needsConvResult = await needsConversion(fs, filePath);

    if (needsConvResult.isOk() && needsConvResult.value) {
      filesNeedingConversion.push(file);
    }
  }

  return ok(filesNeedingConversion);
};

// ============================================================================
// CONVERSION REPORTING
// ============================================================================

/**
 * Pure function: Generate conversion summary report
 */
export const generateConversionReport = (stats: ConversionStats): string[] => {
  const report: string[] = [];

  report.push('🎨 Color Conversion Summary');
  report.push('');
  report.push(`Files processed: ${stats.filesProcessed}`);
  report.push(`Files modified: ${stats.filesModified}`);
  report.push(`Conversions applied: ${stats.conversionsApplied}`);

  if (stats.errors.length > 0) {
    report.push('');
    report.push(`Warnings: ${stats.errors.length}`);
    stats.errors.forEach(error => {
      report.push(`  • ${error}`);
    });
  }

  if (stats.filesModified > 0) {
    report.push('');
    report.push('✅ Components now use semantic color tokens');
    report.push('   This enables dynamic theming with Trailhead UI');
  } else {
    report.push('');
    report.push('ℹ️  No conversions were needed');
    report.push('   Components already use semantic tokens');
  }

  return report;
};
