/**
 * Main profiler orchestrator
 */

import type { ProfileOptions, ComparisonResult } from './types.js';
import { createProgressManager } from './progress.js';
import { createStrategyPair } from './strategies/factory.js';
import { displayResults, displayError, displaySuccess } from './display.js';
import { saveReport, createReportSummary } from './report.js';
import { runInteractiveMode } from './interactive.js';
import { parseAndValidate } from './cli.js';
import { cleanupEnvironment, calculateComparison, ensureDirectory } from './utils.js';
import { PROFILER_CONFIG } from './constants.js';

/**
 * Main profiler class
 * Orchestrates the entire profiling workflow
 */
export class TransformProfiler {
  private options: ProfileOptions;
  private progressManager: ReturnType<typeof createProgressManager>;

  constructor(options: ProfileOptions) {
    this.options = options;
    this.progressManager = createProgressManager(options);
  }

  /**
   * Execute profiling workflow
   */
  async profile(): Promise<ComparisonResult> {
    try {
      // Setup environment
      await this.setupEnvironment();

      // Create profiling strategies
      const strategies = createStrategyPair(this.options.mode);

      if (!strategies) {
        throw new Error(`Invalid profiling mode: ${this.options.mode}`);
      }

      // Validate strategies
      const primaryValidation = strategies.primary.validate(this.options);
      if (!primaryValidation.isValid) {
        throw new Error(
          `Primary strategy validation failed: ${primaryValidation.errors.join(', ')}`
        );
      }

      if (strategies.comparison) {
        const comparisonValidation = strategies.comparison.validate(this.options);
        if (!comparisonValidation.isValid) {
          throw new Error(
            `Comparison strategy validation failed: ${comparisonValidation.errors.join(', ')}`
          );
        }
      }

      // Execute primary profiling
      this.progressManager.startSetup();
      await strategies.primary.setup(this.options);
      this.progressManager.completeSetup();

      const primaryResult = await strategies.primary.profile(this.options, this.progressManager);

      // Execute comparison profiling if enabled
      let comparisonResult = undefined;
      let speedupFactor = undefined;
      let memoryEfficiency = undefined;

      if (strategies.comparison && this.options.compare) {
        this.progressManager.startComparison();

        await strategies.comparison.setup(this.options);
        comparisonResult = await strategies.comparison.profile(this.options, this.progressManager);

        const comparison = calculateComparison(primaryResult, comparisonResult);
        speedupFactor = comparison.speedupFactor;
        memoryEfficiency = comparison.memoryEfficiency;

        this.progressManager.completeComparison(speedupFactor);
      }

      // Cleanup strategies
      await strategies.primary.cleanup(this.options);
      if (strategies.comparison) {
        await strategies.comparison.cleanup(this.options);
      }

      // Create final comparison result
      const result: ComparisonResult = {
        transforms2: primaryResult,
        traditional: comparisonResult,
        speedupFactor,
        memoryEfficiency,
      };

      return result;
    } catch (error) {
      this.progressManager.error('profile', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Setup profiling environment
   */
  private async setupEnvironment(): Promise<void> {
    await ensureDirectory(PROFILER_CONFIG.tempBase);
  }

  /**
   * Cleanup profiling environment
   */
  async cleanup(): Promise<void> {
    this.progressManager.startCleanup();

    if (!this.options.keepTempFiles) {
      await cleanupEnvironment();
    }

    this.progressManager.completeCleanup();
    this.progressManager.stop();
  }
}

/**
 * Main profiling function
 */
export async function runProfiler(options: ProfileOptions): Promise<ComparisonResult> {
  const profiler = new TransformProfiler(options);

  try {
    const result = await profiler.profile();

    // Display results
    displayResults(result, options);

    // Generate markdown report if requested
    if (options.outDir) {
      const savedFile = await saveReport('markdown', result, options, options.outDir);
      createReportSummary([savedFile], options).forEach(line => console.log(line));
    }

    return result;
  } finally {
    await profiler.cleanup();
  }
}

/**
 * CLI entry point
 */
export async function runCLI(argv: string[] = process.argv): Promise<void> {
  try {
    const { options, errors } = parseAndValidate(argv);

    if (errors.length > 0) {
      displayError(`Configuration errors:\n${errors.map(e => `  - ${e}`).join('\n')}`);
      process.exit(1);
    }

    // Run interactive mode if requested
    if (options.interactive) {
      const interactiveOptions = await runInteractiveMode();

      if (!interactiveOptions) {
        // User cancelled interactive mode
        process.exit(0);
      }

      // Use interactive options
      await runProfiler(interactiveOptions);
    } else {
      // Use CLI options
      await runProfiler(options);
    }

    displaySuccess('Profiling completed successfully!');
  } catch (error) {
    displayError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Factory function to create profiler with options
 */
export function createProfiler(options: ProfileOptions): TransformProfiler {
  return new TransformProfiler(options);
}

/**
 * Export main components
 */
export * from './types.js';
export * from './constants.js';
export * from './utils.js';
export * from './strategies/factory.js';
