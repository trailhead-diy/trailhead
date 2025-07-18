/**
 * Performance metrics for a single operation
 */
export interface PerformanceMetrics {
  /** The name of the operation being measured */
  readonly operation: string
  /** Start time in milliseconds (from performance.now()) */
  readonly startTime: number
  /** End time in milliseconds (from performance.now()) */
  readonly endTime: number
  /** Duration in milliseconds */
  readonly duration: number
  /** Optional metadata about the operation (e.g., file count, size) */
  readonly metadata?: Record<string, unknown>
}

/**
 * Function returned by profiler.start() to stop timing and record metrics
 * @param metadata - Optional metadata to attach to the performance metrics
 * @returns The recorded performance metrics
 */
export type ProfilerStopFn = (metadata?: Record<string, unknown>) => PerformanceMetrics

/**
 * Performance profiler for measuring operation timings
 */
export interface PerformanceProfiler {
  /**
   * Start timing an operation
   * @param operation - Name of the operation to measure
   * @returns A function to stop timing and record the metrics
   * @example
   * ```typescript
   * const stop = profiler.start("dependency-analysis");
   * // ... perform operation ...
   * const metrics = stop({ fileCount: 100 });
   * ```
   */
  start(operation: string): ProfilerStopFn

  /**
   * Get all recorded performance metrics
   * @returns Array of all performance metrics recorded since creation or last reset
   */
  getMetrics(): readonly PerformanceMetrics[]

  /**
   * Clear all recorded metrics
   */
  reset(): void

  /**
   * Generate a human-readable summary of all recorded metrics
   * @returns Formatted summary string with statistics per operation
   */
  summary(): string
}

/**
 * Creates a new performance profiler instance
 *
 * @returns A new performance profiler
 *
 * @example
 * ```typescript
 * const profiler = createPerformanceProfiler();
 *
 * const stop = profiler.start("parse-files");
 * // ... do work ...
 * stop({ fileCount: 42 });
 *
 * console.log(profiler.summary());
 * ```
 */
export function createPerformanceProfiler(): PerformanceProfiler {
  const metrics: PerformanceMetrics[] = []

  const start = (operation: string): (() => PerformanceMetrics) => {
    const startTime = performance.now()

    return (metadata?: Record<string, unknown>): PerformanceMetrics => {
      const endTime = performance.now()
      const metric: PerformanceMetrics = {
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        metadata,
      }

      metrics.push(metric)
      return metric
    }
  }

  const getMetrics = (): readonly PerformanceMetrics[] => {
    return [...metrics]
  }

  const reset = (): void => {
    metrics.length = 0
  }

  const summary = (): string => {
    if (metrics.length === 0) {
      return 'No performance metrics collected'
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)
    const operationStats = new Map<string, { count: number; totalDuration: number }>()

    for (const metric of metrics) {
      const stats = operationStats.get(metric.operation) || { count: 0, totalDuration: 0 }
      stats.count++
      stats.totalDuration += metric.duration
      operationStats.set(metric.operation, stats)
    }

    const lines: string[] = [
      `Performance Summary (${metrics.length} operations, ${totalDuration.toFixed(2)}ms total)`,
      '─'.repeat(60),
    ]

    for (const [operation, stats] of operationStats) {
      const avgDuration = stats.totalDuration / stats.count
      const percentage = ((stats.totalDuration / totalDuration) * 100).toFixed(1)

      lines.push(
        `${operation.padEnd(30)} ${stats.count.toString().padStart(4)} calls  ` +
          `${avgDuration.toFixed(2).padStart(8)}ms avg  ` +
          `${stats.totalDuration.toFixed(2).padStart(10)}ms total (${percentage}%)`
      )
    }

    return lines.join('\n')
  }

  return {
    start,
    getMetrics,
    reset,
    summary,
  }
}

/**
 * Global singleton profiler instance for the entire dependency-analysis package
 *
 * @remarks
 * This profiler is shared across all modules in the package to provide
 * a unified view of performance across the entire analysis pipeline.
 *
 * @example
 * ```typescript
 * import { globalProfiler } from "@esteban-url/dependency-analysis/core";
 *
 * // In your analysis code
 * const stop = globalProfiler.start("my-operation");
 * // ... perform operation ...
 * stop();
 *
 * // Later, display summary
 * console.log(globalProfiler.summary());
 * ```
 */
export const globalProfiler = createPerformanceProfiler()
