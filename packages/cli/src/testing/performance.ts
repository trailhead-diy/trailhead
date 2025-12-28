/**
 * Performance monitoring utilities for CLI testing
 */

import { sortBy, orderBy } from 'es-toolkit'

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

export interface PerformanceReport {
  testName: string
  command: string
  metrics: PerformanceMetrics
  timestamp: string
  status: 'success' | 'error' | 'timeout'
  errorMessage?: string
}

/**
 * Performance monitor state
 */
export interface PerformanceMonitorState {
  readonly reports: PerformanceReport[]
}

/**
 * Create performance monitor state
 */
export function createPerformanceMonitorState(): PerformanceMonitorState {
  return { reports: [] }
}

/**
 * Monitor a CLI command execution
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
 * Get all performance reports
 */
export function getPerformanceReports(state: PerformanceMonitorState): PerformanceReport[] {
  return [...state.reports]
}

/**
 * Get performance summary statistics
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
 * Export reports to JSON
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
 * Clear all reports
 */
export function clearPerformanceReports(_state: PerformanceMonitorState): PerformanceMonitorState {
  return { reports: [] }
}

/**
 * Check if any performance thresholds are exceeded
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
 * Higher-order function for automatic performance monitoring
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
 * Helper to create a performance monitor for CLI testing
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
