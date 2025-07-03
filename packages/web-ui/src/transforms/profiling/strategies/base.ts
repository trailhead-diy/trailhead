/**
 * Base strategy interface for profiling approaches
 */

import type { ProfileResult, ProfileOptions } from '../types.js';
import type { ProfileProgressManager } from '../progress.js';

/**
 * Abstract base class for profiling strategies
 */
export abstract class ProfileStrategy {
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Execute profiling strategy
   */
  abstract profile(
    options: ProfileOptions,
    progressManager: ProfileProgressManager
  ): Promise<ProfileResult>;

  /**
   * Validate strategy can run with given options
   */
  abstract validate(options: ProfileOptions): { isValid: boolean; errors: string[] };

  /**
   * Get estimated duration for this strategy
   */
  abstract getEstimatedDuration(options: ProfileOptions): number; // milliseconds

  /**
   * Get list of transforms this strategy will use
   */
  abstract getTransforms(): string[];

  /**
   * Setup any strategy-specific environment
   */
  async setup(_options: ProfileOptions): Promise<void> {
    // Default: no setup required
  }

  /**
   * Cleanup any strategy-specific resources
   */
  async cleanup(_options: ProfileOptions): Promise<void> {
    // Default: no cleanup required
  }

  /**
   * Get strategy-specific configuration summary
   */
  getConfigSummary(options: ProfileOptions): Record<string, any> {
    return {
      strategy: this.name,
      description: this.description,
      transforms: this.getTransforms(),
      estimatedDuration: this.getEstimatedDuration(options),
    };
  }
}

/**
 * Strategy factory interface
 */
export interface StrategyFactory {
  createStrategy(mode: string): ProfileStrategy | null;
  getAvailableStrategies(): string[];
  getStrategyDescription(mode: string): string | null;
}

/**
 * Base profiling context
 */
export interface ProfilingContext {
  options: ProfileOptions;
  progressManager: ProfileProgressManager;
  startTime: number;
  memoryBaseline: number;
}

/**
 * Profiling measurement utilities
 */
export interface ProfilingMeasurement {
  startTime: number;
  endTime: number;
  executionTime: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryUsed: number;
}

/**
 * Helper function to create measurement
 */
export function createMeasurement(
  startTime: number,
  endTime: number,
  memoryBefore: number,
  memoryAfter: number
): ProfilingMeasurement {
  return {
    startTime,
    endTime,
    executionTime: endTime - startTime,
    memoryBefore,
    memoryAfter,
    memoryUsed: memoryAfter - memoryBefore,
  };
}

/**
 * Base implementation with common functionality
 */
export abstract class BaseProfileStrategy extends ProfileStrategy {
  /**
   * Common validation logic
   */
  protected validateCommon(options: ProfileOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.iterations < 1 || options.iterations > 10) {
      errors.push('Iterations must be between 1 and 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Common setup logic
   */
  async setup(options: ProfileOptions): Promise<void> {
    // Force garbage collection if requested
    if (options.forceGc && global.gc) {
      global.gc();
    }
  }

  /**
   * Execute warmup iterations if configured
   */
  protected async executeWarmup(
    options: ProfileOptions,
    profileFn: () => Promise<void>
  ): Promise<void> {
    if (options.warmupIterations && options.warmupIterations > 0) {
      for (let i = 0; i < options.warmupIterations; i++) {
        await profileFn();

        // Force GC between warmup iterations
        if (options.forceGc && global.gc) {
          global.gc();
        }
      }
    }
  }

  /**
   * Common profiling loop implementation
   */
  protected async executeProfilingLoop(
    options: ProfileOptions,
    progressManager: ProfileProgressManager,
    profileFn: (iteration: number) => Promise<ProfilingMeasurement>
  ): Promise<ProfilingMeasurement[]> {
    const measurements: ProfilingMeasurement[] = [];

    for (let i = 0; i < options.iterations; i++) {
      progressManager.updateProfiling(this.name, i + 1, `Iteration ${i + 1}/${options.iterations}`);

      const measurement = await profileFn(i);
      measurements.push(measurement);

      // Force garbage collection between iterations if requested
      if (options.forceGc && global.gc) {
        global.gc();
      }

      // Small delay to allow system to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return measurements;
  }

  /**
   * Create ProfileResult from measurements
   */
  protected createResult(
    measurements: ProfilingMeasurement[],
    options: ProfileOptions
  ): ProfileResult {
    const times = measurements.map(m => m.executionTime);
    const memories = measurements.map(m => m.memoryUsed);

    const timesSorted = [...times].sort((a, b) => a - b);
    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const averageTime = totalTime / times.length;
    const medianTime = timesSorted[Math.floor(timesSorted.length / 2)];

    const memoryPeak = Math.max(...memories);
    const memoryAverage = memories.reduce((sum, m) => sum + m, 0) / memories.length;

    return {
      approach: this.name,
      totalTime,
      averageTime,
      medianTime,
      minTime: timesSorted[0],
      maxTime: timesSorted[timesSorted.length - 1],
      memoryPeak,
      memoryAverage,
      componentsProcessed: 27, // All Catalyst components
      componentsPerSecond: (27 * 1000) / averageTime,
      componentProfiles: [], // Can be filled by specific strategies
      iterations: options.iterations,
    };
  }
}
