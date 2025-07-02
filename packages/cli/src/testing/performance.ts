/**
 * Performance monitoring utilities for CLI testing
 */

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

export interface PerformanceReport {
  testName: string;
  command: string;
  metrics: PerformanceMetrics;
  timestamp: string;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
}

export class PerformanceMonitor {
  private reports: PerformanceReport[] = [];

  /**
   * Monitor a CLI command execution
   */
  async monitor(
    testName: string,
    command: string,
    executor: () => Promise<any>,
    timeout = 30000
  ): Promise<PerformanceReport> {
    const startTime = Date.now();
    const startCpuUsage = process.cpuUsage();
    
    let status: 'success' | 'error' | 'timeout' = 'success';
    let errorMessage: string | undefined;

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      );

      await Promise.race([executor(), timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message === 'Timeout') {
        status = 'timeout';
        errorMessage = 'Command timed out';
      } else {
        status = 'error';
        errorMessage = error instanceof Error ? error.message : String(error);
      }
    }

    const endTime = Date.now();
    const endCpuUsage = process.cpuUsage(startCpuUsage);
    const memoryUsage = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      executionTime: endTime - startTime,
      memoryUsage,
      cpuUsage: {
        user: endCpuUsage.user / 1000, // Convert to milliseconds
        system: endCpuUsage.system / 1000,
      },
    };

    const report: PerformanceReport = {
      testName,
      command,
      metrics,
      timestamp: new Date().toISOString(),
      status,
      errorMessage,
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Get all performance reports
   */
  getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  /**
   * Get performance summary statistics
   */
  getSummary() {
    if (this.reports.length === 0) {
      return null;
    }

    const successfulReports = this.reports.filter(r => r.status === 'success');
    const executionTimes = successfulReports.map(r => r.metrics.executionTime);
    const memoryUsages = successfulReports.map(r => r.metrics.memoryUsage.heapUsed);

    return {
      totalTests: this.reports.length,
      successful: successfulReports.length,
      failed: this.reports.filter(r => r.status === 'error').length,
      timedOut: this.reports.filter(r => r.status === 'timeout').length,
      averageExecutionTime: executionTimes.length > 0 
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length 
        : 0,
      maxExecutionTime: Math.max(...executionTimes, 0),
      minExecutionTime: Math.min(...executionTimes, 0),
      averageMemoryUsage: memoryUsages.length > 0
        ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
        : 0,
      maxMemoryUsage: Math.max(...memoryUsages, 0),
    };
  }

  /**
   * Export reports to JSON
   */
  exportToJson(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      reports: this.reports,
      generatedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Clear all reports
   */
  clear(): void {
    this.reports = [];
  }

  /**
   * Check if any performance thresholds are exceeded
   */
  checkThresholds(thresholds: {
    maxExecutionTime?: number;
    maxMemoryUsage?: number;
    maxFailureRate?: number;
  }): { passed: boolean; violations: string[] } {
    const summary = this.getSummary();
    const violations: string[] = [];

    if (!summary) {
      return { passed: true, violations: [] };
    }

    if (thresholds.maxExecutionTime && summary.maxExecutionTime > thresholds.maxExecutionTime) {
      violations.push(`Max execution time ${summary.maxExecutionTime}ms exceeds threshold ${thresholds.maxExecutionTime}ms`);
    }

    if (thresholds.maxMemoryUsage && summary.maxMemoryUsage > thresholds.maxMemoryUsage) {
      violations.push(`Max memory usage ${Math.round(summary.maxMemoryUsage / 1024 / 1024)}MB exceeds threshold ${Math.round(thresholds.maxMemoryUsage / 1024 / 1024)}MB`);
    }

    if (thresholds.maxFailureRate) {
      const failureRate = (summary.failed + summary.timedOut) / summary.totalTests;
      if (failureRate > thresholds.maxFailureRate) {
        violations.push(`Failure rate ${Math.round(failureRate * 100)}% exceeds threshold ${Math.round(thresholds.maxFailureRate * 100)}%`);
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }
}

/**
 * Decorator for automatic performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  monitor: PerformanceMonitor,
  testName: string,
  command: string
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      return monitor.monitor(testName, command, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Helper to create a performance monitor for CLI testing
 */
export function createCLIPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}