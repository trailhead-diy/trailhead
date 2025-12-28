/**
 * Performance monitoring utilities for CLI testing.
 *
 * Provides tools for tracking execution time, memory usage, and CPU usage
 * during CLI command testing. Useful for performance regression testing.
 *
 * @module cli/testing/performance
 */

import { sortBy, orderBy } from 'es-toolkit'

/**
 * Captured metrics from a single command execution.
 */
export interface PerformanceMetrics {
  executionTime: number
  memoryUsage: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  cpuUsage: {
    user: number
    system: number
  }
}

/**
 * Complete report for a single command execution.
 */
export interface PerformanceReport {
  /** Descriptive test name */
  testName: string
  /** Command that was executed */
  command: string
  /** Captured performance metrics */
  metrics: PerformanceMetrics
  /** ISO-8601 timestamp of execution */
  timestamp: string
  /** Execution result status */
  status: 'success' | 'error' | 'timeout'
  /** Error message if status is 'error' or 'timeout' */
  errorMessage?: string
}

/**
 * Immutable state container for performance reports.
 */
export interface PerformanceMonitorState {
  /** Collection of all performance reports */
  readonly reports: PerformanceReport[]
}

/**
 * Create empty performance monitor state.
 *
 * @returns New state with no reports
 */
export function createPerformanceMonitorState(): PerformanceMonitorState {
  return { reports: [] }
}

/**
 * Execute and monitor a CLI command's performance.
 *
 * Captures execution time, memory usage, and CPU usage while
 * running the provided executor function. Handles timeouts.
 *
 * @param state - Current monitor state
 * @param testName - Descriptive name for this test
 * @param command - Command string for the report
 * @param executor - Async function to execute and monitor
 * @param timeout - Maximum execution time in ms (default: 30000)
 * @returns Report and new state with report added
 */
export async function monitorPerformance(
  state: PerformanceMonitorState,
  testName: string,
  command: string,
  executor: () => Promise<any>,
  timeout = 30000
): Promise<{ report: PerformanceReport; newState: PerformanceMonitorState }> {
  const startTime = Date.now()
  const startCpuUsage = process.cpuUsage()

  let status: 'success' | 'error' | 'timeout' = 'success'
  let errorMessage: string | undefined

  try {
    // Set up timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )

    await Promise.race([executor(), timeoutPromise])
  } catch (error) {
    if (error instanceof Error && error.message === 'Timeout') {
      status = 'timeout'
      errorMessage = 'Command timed out'
    } else {
      status = 'error'
      errorMessage = error instanceof Error ? error.message : String(error)
    }
  }

  const endTime = Date.now()
  const endCpuUsage = process.cpuUsage(startCpuUsage)
  const memoryUsage = process.memoryUsage()

  const metrics: PerformanceMetrics = {
    executionTime: endTime - startTime,
    memoryUsage,
    cpuUsage: {
      user: endCpuUsage.user / 1000, // Convert to milliseconds
      system: endCpuUsage.system / 1000,
    },
  }

  const report: PerformanceReport = {
    testName,
    command,
    metrics,
    timestamp: new Date().toISOString(),
    status,
    errorMessage,
  }

  return {
    report,
    newState: {
      reports: [...state.reports, report],
    },
  }
}

/**
 * Get all performance reports from state.
 *
 * @param state - Monitor state containing reports
 * @returns Copy of all reports array
 */
export function getPerformanceReports(state: PerformanceMonitorState): PerformanceReport[] {
  return [...state.reports]
}

/**
 * Calculate summary statistics across all reports.
 *
 * @param state - Monitor state containing reports
 * @returns Summary with counts, averages, and extremes, or null if no reports
 */
export function getPerformanceSummary(state: PerformanceMonitorState) {
  if (state.reports.length === 0) {
    return null
  }

  const successfulReports = state.reports.filter((r) => r.status === 'success')
  const executionTimes = successfulReports.map((r) => r.metrics.executionTime)
  const memoryUsages = successfulReports.map((r) => r.metrics.memoryUsage.heapUsed)

  return {
    totalTests: state.reports.length,
    successful: successfulReports.length,
    failed: state.reports.filter((r) => r.status === 'error').length,
    timedOut: state.reports.filter((r) => r.status === 'timeout').length,
    averageExecutionTime:
      executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0,
    maxExecutionTime: executionTimes.length > 0 ? Math.max(...executionTimes) : 0,
    minExecutionTime: executionTimes.length > 0 ? Math.min(...executionTimes) : 0,
    averageMemoryUsage:
      memoryUsages.length > 0 ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0,
    maxMemoryUsage: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
  }
}

/**
 * Export reports to formatted JSON string.
 *
 * Includes summary statistics and all individual reports.
 *
 * @param state - Monitor state to export
 * @returns Pretty-printed JSON string
 */
export function exportPerformanceReportsToJson(state: PerformanceMonitorState): string {
  return JSON.stringify(
    {
      summary: getPerformanceSummary(state),
      reports: state.reports,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  )
}

/**
 * Clear all reports and return fresh state.
 *
 * @param _state - Current state (ignored, returns empty state)
 * @returns New empty monitor state
 */
export function clearPerformanceReports(_state: PerformanceMonitorState): PerformanceMonitorState {
  return { reports: [] }
}

/**
 * Check if performance thresholds are exceeded.
 *
 * Validates execution time, memory usage, and failure rate against limits.
 *
 * @param state - Monitor state to check
 * @param thresholds - Maximum allowed values for each metric
 * @returns Object with pass/fail status and list of violations
 */
export function checkPerformanceThresholds(
  state: PerformanceMonitorState,
  thresholds: {
    maxExecutionTime?: number
    maxMemoryUsage?: number
    maxFailureRate?: number
  }
): { passed: boolean; violations: string[] } {
  const summary = getPerformanceSummary(state)
  const violations: string[] = []

  if (!summary) {
    return { passed: true, violations: [] }
  }

  if (thresholds.maxExecutionTime && summary.maxExecutionTime > thresholds.maxExecutionTime) {
    violations.push(
      `Max execution time ${summary.maxExecutionTime}ms exceeds threshold ${thresholds.maxExecutionTime}ms`
    )
  }

  if (thresholds.maxMemoryUsage && summary.maxMemoryUsage > thresholds.maxMemoryUsage) {
    violations.push(
      `Max memory usage ${Math.round(summary.maxMemoryUsage / 1024 / 1024)}MB exceeds threshold ${Math.round(thresholds.maxMemoryUsage / 1024 / 1024)}MB`
    )
  }

  if (thresholds.maxFailureRate) {
    const failureRate = (summary.failed + summary.timedOut) / summary.totalTests
    if (failureRate > thresholds.maxFailureRate) {
      violations.push(
        `Failure rate ${Math.round(failureRate * 100)}% exceeds threshold ${Math.round(thresholds.maxFailureRate * 100)}%`
      )
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}

/**
 * Wrap a function with automatic performance monitoring.
 *
 * Creates a new function that records performance metrics on each call.
 * Note: State updates require external handling due to functional approach.
 *
 * @template T - Function type
 * @param state - Monitor state for recording
 * @param testName - Name for performance reports
 * @param command - Command string for reports
 * @param testFn - Function to wrap
 * @returns Wrapped function that returns performance report
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  state: PerformanceMonitorState,
  testName: string,
  command: string,
  testFn: T
): T {
  return (async (...args: any[]) => {
    const { report, newState: _newState } = await monitorPerformance(state, testName, command, () =>
      testFn(...args)
    )
    // Note: In a real implementation, you'd need to update the global state
    // This is a limitation of pure functional approach for this use case
    return report
  }) as T
}

/**
 * Convenience factory for creating a CLI performance monitor.
 *
 * Alias for createPerformanceMonitorState with clearer intent.
 *
 * @returns New empty performance monitor state
 */
export function createCLIPerformanceMonitor(): PerformanceMonitorState {
  return createPerformanceMonitorState()
}

/**
 * Get the N slowest performance reports
 * @param state - Performance monitor state
 * @param n - Number of reports to return
 * @returns Array of slowest performance reports, sorted by execution time descending
 * @example
 * ```typescript
 * const monitor = createCLIPerformanceMonitor();
 * // ... run tests ...
 * const slowest = getSlowestReports(monitor, 5);
 * slowest.forEach(report => {
 *   console.log(`${report.testName}: ${report.metrics.executionTime}ms`);
 * });
 * ```
 */
export function getSlowestReports(state: PerformanceMonitorState, n: number): PerformanceReport[] {
  return orderBy(state.reports, [(report) => report.metrics.executionTime], ['desc']).slice(0, n)
}

/**
 * Get the N fastest performance reports
 * @param state - Performance monitor state
 * @param n - Number of reports to return
 * @returns Array of fastest performance reports, sorted by execution time ascending
 * @example
 * ```typescript
 * const monitor = createCLIPerformanceMonitor();
 * // ... run tests ...
 * const fastest = getFastestReports(monitor, 5);
 * ```
 */
export function getFastestReports(state: PerformanceMonitorState, n: number): PerformanceReport[] {
  return sortBy(state.reports, [(report) => report.metrics.executionTime]).slice(0, n)
}

/**
 * Get the N reports with highest memory usage
 * @param state - Performance monitor state
 * @param n - Number of reports to return
 * @returns Array of performance reports with highest memory usage
 * @example
 * ```typescript
 * const monitor = createCLIPerformanceMonitor();
 * // ... run tests ...
 * const memoryHogs = getHighestMemoryReports(monitor, 3);
 * ```
 */
export function getHighestMemoryReports(
  state: PerformanceMonitorState,
  n: number
): PerformanceReport[] {
  return orderBy(state.reports, [(report) => report.metrics.memoryUsage.heapUsed], ['desc']).slice(
    0,
    n
  )
}

/**
 * Get performance reports sorted by specified metric
 * @param state - Performance monitor state
 * @param metric - Metric to sort by
 * @param order - Sort order (default: 'desc')
 * @returns Sorted array of performance reports
 * @example
 * ```typescript
 * const monitor = createCLIPerformanceMonitor();
 * // ... run tests ...
 * const sortedByMemory = getReportsSortedBy(monitor, 'memory', 'desc');
 * const sortedByTime = getReportsSortedBy(monitor, 'time', 'asc');
 * ```
 */
export function getReportsSortedBy(
  state: PerformanceMonitorState,
  metric: 'time' | 'memory' | 'cpu',
  order: 'asc' | 'desc' = 'desc'
): PerformanceReport[] {
  const accessor =
    metric === 'time'
      ? (report: PerformanceReport) => report.metrics.executionTime
      : metric === 'memory'
        ? (report: PerformanceReport) => report.metrics.memoryUsage.heapUsed
        : (report: PerformanceReport) =>
            report.metrics.cpuUsage.user + report.metrics.cpuUsage.system

  return order === 'desc'
    ? orderBy(state.reports, [accessor], ['desc'])
    : sortBy(state.reports, [accessor])
}

/**
 * Get performance outliers (reports significantly slower than average)
 * @param state - Performance monitor state
 * @param threshold - Standard deviations from mean to consider outlier (default: 2)
 * @returns Array of outlier performance reports
 * @example
 * ```typescript
 * const monitor = createCLIPerformanceMonitor();
 * // ... run tests ...
 * const outliers = getPerformanceOutliers(monitor, 2);
 * console.log(`Found ${outliers.length} performance outliers`);
 * ```
 */
export function getPerformanceOutliers(
  state: PerformanceMonitorState,
  threshold: number = 2
): PerformanceReport[] {
  const successfulReports = state.reports.filter((r) => r.status === 'success')
  if (successfulReports.length < 3) return []

  const times = successfulReports.map((r) => r.metrics.executionTime)
  const mean = times.reduce((a, b) => a + b, 0) / times.length
  const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length
  const stdDev = Math.sqrt(variance)

  const outlierThreshold = mean + stdDev * threshold

  return successfulReports.filter((r) => r.metrics.executionTime > outlierThreshold)
}
