/**
 * Full pipeline profiling strategy
 */

import { performance } from 'perf_hooks';
import type { ProfileResult, ProfileOptions } from '../types.js';
import type { ProfileProgressManager } from '../progress.js';
import { BaseProfileStrategy, createMeasurement } from './base.js';
import { setupEnvironment, measureMemory, forceGarbageCollection } from '../utils.js';
import { PROFILER_CONFIG } from '../constants.js';
import { runMainPipeline } from '@/transforms/pipelines/main.js';

/**
 * Full pipeline profiling strategy
 * Uses the complete transforms pipeline with all optimizations
 */
export class FullPipelineStrategy extends BaseProfileStrategy {
  readonly name = 'transforms_full';
  readonly description = 'Complete transforms pipeline with all optimizations';

  /**
   * Validate full pipeline strategy
   */
  validate(options: ProfileOptions): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateCommon(options);
    const errors = [...baseValidation.errors];

    // Full pipeline specific validations
    if (options.mode !== 'full') {
      errors.push('Full pipeline strategy requires mode to be "full"');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get estimated duration based on historical performance
   */
  getEstimatedDuration(options: ProfileOptions): number {
    // Based on actual measurements: ~19ms per iteration for full pipeline
    const baseTime = 19; // milliseconds
    const setupTime = 500; // environment setup
    const cleanupTime = 200; // cleanup
    const warmupTime = options.warmupIterations ? options.warmupIterations * baseTime : 0;

    return setupTime + warmupTime + options.iterations * baseTime + cleanupTime;
  }

  /**
   * Get list of all transforms used by full pipeline
   */
  getTransforms(): string[] {
    return [
      // Import transforms
      'clsx-to-cn',
      'cleanup-unused',

      // ClassName transforms
      'add-parameter',
      'wrap-static',
      'ensure-in-cn',
      'reorder-args',
      'remove-unused',

      // Color transforms
      'base-mappings',
      'interactive-states',
      'dark-mode',
      'special-patterns',

      // Component-specific transforms
      'semantic-enhancements',
      'component-color-mappings',

      // Edge cases
      'text-colors',
      'icon-fills',
      'blue-to-primary',
      'focus-states',

      // Formatting
      'file-headers',
      'post-process',
    ];
  }

  /**
   * Execute full pipeline profiling
   */
  async profile(
    options: ProfileOptions,
    progressManager: ProfileProgressManager
  ): Promise<ProfileResult> {
    progressManager.startProfiling(this.name, options.iterations);

    // Execute warmup if configured
    if (options.warmupIterations) {
      await this.executeWarmup(options, async () => {
        await setupEnvironment(PROFILER_CONFIG.transforms2Dir);
        await runMainPipeline({
          srcDir: PROFILER_CONFIG.transforms2Dir,
          outDir: PROFILER_CONFIG.transforms2Dir,
          verbose: false,
          dryRun: false,
        });
      });
    }

    // Execute profiling iterations
    const measurements = await this.executeProfilingLoop(
      options,
      progressManager,
      async (_iteration: number) => {
        // Setup fresh environment for each iteration
        await setupEnvironment(PROFILER_CONFIG.transforms2Dir);

        // Force garbage collection if requested
        if (options.forceGc) {
          forceGarbageCollection();
        }

        const memoryBefore = measureMemory();
        const startTime = performance.now();

        // Run the full transforms pipeline
        await runMainPipeline({
          srcDir: PROFILER_CONFIG.transforms2Dir,
          outDir: PROFILER_CONFIG.transforms2Dir,
          verbose: options.verbose && options.iterations === 1, // Only verbose on single iteration
          dryRun: false,
        });

        const endTime = performance.now();
        const memoryAfter = measureMemory();

        return createMeasurement(startTime, endTime, memoryBefore, memoryAfter);
      }
    );

    // Create result from measurements
    const result = this.createResult(measurements, options);

    progressManager.completeProfiling(this.name, result.averageTime);

    return result;
  }

  /**
   * Get configuration summary for full pipeline
   */
  getConfigSummary(options: ProfileOptions): Record<string, any> {
    const base = super.getConfigSummary(options);

    return {
      ...base,
      pipelineFeatures: [
        'Complete AST transformations',
        'All color mappings',
        'Component-specific optimizations',
        'Edge case handling',
        'Parallel transform execution',
        'Optimized file I/O',
      ],
      performanceOptimizations: [
        'Dependency-aware execution',
        'Minimal file reads/writes',
        'Memory-efficient processing',
        'Functional composition',
        'Pure transform functions',
      ],
    };
  }
}
