import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createPerformanceMonitorState,
  monitorPerformance,
  getPerformanceSummary,
  getSlowestReports,
  getFastestReports,
  getHighestMemoryReports,
  getReportsSortedBy,
  getPerformanceOutliers,
  type PerformanceMonitorState,
  type PerformanceReport,
} from '../performance'

describe('performance monitoring utilities', () => {
  let monitor: PerformanceMonitorState

  beforeEach(() => {
    monitor = createPerformanceMonitorState()
  })

  describe('createPerformanceMonitorState', () => {
    it('should create empty monitor state', () => {
      expect(monitor.reports).toEqual([])
    })
  })

  describe('monitorPerformance', () => {
    it('should monitor successful operation', async () => {
      const mockOperation = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('success'), 1)))

      const { report, newState } = await monitorPerformance(
        monitor,
        'test-operation',
        'test command',
        mockOperation
      )

      expect(report.testName).toBe('test-operation')
      expect(report.command).toBe('test command')
      expect(report.status).toBe('success')
      expect(report.metrics.executionTime).toBeGreaterThanOrEqual(0)
      expect(report.metrics.memoryUsage).toBeDefined()
      expect(report.metrics.cpuUsage).toBeDefined()
      expect(newState.reports).toHaveLength(1)
      expect(mockOperation).toHaveBeenCalledOnce()
    })

    it('should handle operation errors', async () => {
      const mockOperation = vi
        .fn()
        .mockImplementation(
          () => new Promise((_, reject) => setTimeout(() => reject(new Error('Test error')), 1))
        )

      const { report, newState } = await monitorPerformance(
        monitor,
        'failing-operation',
        'failing command',
        mockOperation
      )

      expect(report.status).toBe('error')
      expect(report.errorMessage).toBe('Test error')
      expect(report.metrics.executionTime).toBeGreaterThanOrEqual(0)
      expect(newState.reports).toHaveLength(1)
    })

    it('should handle operation timeout', async () => {
      const mockOperation = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const { report, newState } = await monitorPerformance(
        monitor,
        'slow-operation',
        'slow command',
        mockOperation,
        50 // 50ms timeout
      )

      expect(report.status).toBe('timeout')
      expect(report.errorMessage).toBe('Command timed out')
      expect(newState.reports).toHaveLength(1)
    })

    it('should accumulate reports in state', async () => {
      const mockOperation = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve('success'), 1)))

      let currentState = monitor
      for (let i = 0; i < 3; i++) {
        const { newState } = await monitorPerformance(
          currentState,
          `test-${i}`,
          `command-${i}`,
          mockOperation
        )
        currentState = newState
      }

      expect(currentState.reports).toHaveLength(3)
      expect(currentState.reports.map((r) => r.testName)).toEqual(['test-0', 'test-1', 'test-2'])
    })
  })

  describe('getPerformanceSummary', () => {
    it('should return null for empty reports', () => {
      const summary = getPerformanceSummary(monitor)
      expect(summary).toBeNull()
    })

    it('should calculate summary statistics', async () => {
      // Create mock reports with known execution times
      const mockReports: PerformanceReport[] = [
        {
          testName: 'fast',
          command: 'cmd',
          status: 'success',
          timestamp: new Date().toISOString(),
          metrics: {
            executionTime: 100,
            memoryUsage: { rss: 1000, heapUsed: 500, heapTotal: 1000, external: 100 },
            cpuUsage: { user: 50, system: 25 },
          },
        },
        {
          testName: 'medium',
          command: 'cmd',
          status: 'success',
          timestamp: new Date().toISOString(),
          metrics: {
            executionTime: 200,
            memoryUsage: { rss: 2000, heapUsed: 1000, heapTotal: 2000, external: 200 },
            cpuUsage: { user: 100, system: 50 },
          },
        },
        {
          testName: 'slow',
          command: 'cmd',
          status: 'success',
          timestamp: new Date().toISOString(),
          metrics: {
            executionTime: 300,
            memoryUsage: { rss: 3000, heapUsed: 1500, heapTotal: 3000, external: 300 },
            cpuUsage: { user: 150, system: 75 },
          },
        },
        {
          testName: 'failed',
          command: 'cmd',
          status: 'error',
          timestamp: new Date().toISOString(),
          errorMessage: 'Test error',
          metrics: {
            executionTime: 50,
            memoryUsage: { rss: 500, heapUsed: 250, heapTotal: 500, external: 50 },
            cpuUsage: { user: 25, system: 12 },
          },
        },
      ]

      const stateWithReports = { reports: mockReports }
      const summary = getPerformanceSummary(stateWithReports)

      expect(summary?.totalTests).toBe(4)
      expect(summary?.successful).toBe(3)
      expect(summary?.failed).toBe(1)
      expect(summary?.timedOut).toBe(0)
      expect(summary?.averageExecutionTime).toBe(200) // (100 + 200 + 300) / 3
      expect(summary?.maxExecutionTime).toBe(300)
      expect(summary?.minExecutionTime).toBe(100)
      expect(summary?.averageMemoryUsage).toBe(1000) // (500 + 1000 + 1500) / 3
      expect(summary?.maxMemoryUsage).toBe(1500)
    })
  })

  describe('sorting operations', () => {
    let stateWithReports: PerformanceMonitorState

    beforeEach(() => {
      const mockReports: PerformanceReport[] = [
        {
          testName: 'fast-low-memory',
          command: 'cmd1',
          status: 'success',
          timestamp: new Date().toISOString(),
          metrics: {
            executionTime: 100,
            memoryUsage: { rss: 1000, heapUsed: 500, heapTotal: 1000, external: 100 },
            cpuUsage: { user: 50, system: 25 },
          },
        },
        {
          testName: 'slow-high-memory',
          command: 'cmd2',
          status: 'success',
          timestamp: new Date().toISOString(),
          metrics: {
            executionTime: 500,
            memoryUsage: { rss: 5000, heapUsed: 2500, heapTotal: 5000, external: 500 },
            cpuUsage: { user: 200, system: 100 },
          },
        },
        {
          testName: 'medium-medium-memory',
          command: 'cmd3',
          status: 'success',
          timestamp: new Date().toISOString(),
          metrics: {
            executionTime: 300,
            memoryUsage: { rss: 3000, heapUsed: 1500, heapTotal: 3000, external: 300 },
            cpuUsage: { user: 150, system: 75 },
          },
        },
      ]

      stateWithReports = { reports: mockReports }
    })

    describe('getSlowestReports', () => {
      it('should return slowest reports by execution time', () => {
        const slowest = getSlowestReports(stateWithReports, 2)
        expect(slowest).toHaveLength(2)
        expect(slowest[0].testName).toBe('slow-high-memory')
        expect(slowest[1].testName).toBe('medium-medium-memory')
        expect(slowest[0].metrics.executionTime).toBe(500)
        expect(slowest[1].metrics.executionTime).toBe(300)
      })

      it('should handle requesting more reports than exist', () => {
        const slowest = getSlowestReports(stateWithReports, 10)
        expect(slowest).toHaveLength(3)
      })
    })

    describe('getFastestReports', () => {
      it('should return fastest reports by execution time', () => {
        const fastest = getFastestReports(stateWithReports, 2)
        expect(fastest).toHaveLength(2)
        expect(fastest[0].testName).toBe('fast-low-memory')
        expect(fastest[1].testName).toBe('medium-medium-memory')
        expect(fastest[0].metrics.executionTime).toBe(100)
        expect(fastest[1].metrics.executionTime).toBe(300)
      })
    })

    describe('getHighestMemoryReports', () => {
      it('should return reports with highest memory usage', () => {
        const highMemory = getHighestMemoryReports(stateWithReports, 2)
        expect(highMemory).toHaveLength(2)
        expect(highMemory[0].testName).toBe('slow-high-memory')
        expect(highMemory[1].testName).toBe('medium-medium-memory')
        expect(highMemory[0].metrics.memoryUsage.heapUsed).toBe(2500)
        expect(highMemory[1].metrics.memoryUsage.heapUsed).toBe(1500)
      })
    })

    describe('getReportsSortedBy', () => {
      it('should sort by execution time descending by default', () => {
        const sorted = getReportsSortedBy(stateWithReports, 'time')
        expect(sorted.map((r) => r.metrics.executionTime)).toEqual([500, 300, 100])
      })

      it('should sort by execution time ascending', () => {
        const sorted = getReportsSortedBy(stateWithReports, 'time', 'asc')
        expect(sorted.map((r) => r.metrics.executionTime)).toEqual([100, 300, 500])
      })

      it('should sort by memory usage', () => {
        const sorted = getReportsSortedBy(stateWithReports, 'memory', 'desc')
        expect(sorted.map((r) => r.metrics.memoryUsage.heapUsed)).toEqual([2500, 1500, 500])
      })

      it('should sort by cpu usage', () => {
        const sorted = getReportsSortedBy(stateWithReports, 'cpu', 'desc')
        expect(sorted.map((r) => r.metrics.cpuUsage.user + r.metrics.cpuUsage.system)).toEqual([
          300, 225, 75,
        ]) // 200+100, 150+75, 50+25
      })
    })

    describe('getPerformanceOutliers', () => {
      it('should identify performance outliers', () => {
        // Add more reports to make outlier detection meaningful
        const reportsWithOutlier: PerformanceReport[] = [
          ...stateWithReports.reports,
          // Add several normal reports
          ...Array.from({ length: 5 }, (_, i) => ({
            testName: `normal-${i}`,
            command: `cmd-${i}`,
            status: 'success' as const,
            timestamp: new Date().toISOString(),
            metrics: {
              executionTime: 150 + i * 10, // 150-190ms range
              memoryUsage: {
                rss: 1500 + i * 100,
                heapUsed: 750 + i * 50,
                heapTotal: 1500,
                external: 150,
              },
              cpuUsage: { user: 75 + i * 5, system: 37 + i * 2 },
            },
          })),
          // Add an obvious outlier
          {
            testName: 'outlier',
            command: 'slow-cmd',
            status: 'success' as const,
            timestamp: new Date().toISOString(),
            metrics: {
              executionTime: 2000, // Much slower than others
              memoryUsage: { rss: 10000, heapUsed: 5000, heapTotal: 10000, external: 1000 },
              cpuUsage: { user: 800, system: 400 },
            },
          },
        ]

        const stateWithOutlier = { reports: reportsWithOutlier }
        const outliers = getPerformanceOutliers(stateWithOutlier, 2)

        expect(outliers.length).toBeGreaterThan(0)
        expect(outliers.some((r) => r.testName === 'outlier')).toBe(true)
      })

      it('should return empty array for insufficient data', () => {
        const smallState = { reports: stateWithReports.reports.slice(0, 2) }
        const outliers = getPerformanceOutliers(smallState, 2)
        expect(outliers).toEqual([])
      })

      it('should handle different threshold values', () => {
        const reportsWithVariance: PerformanceReport[] = [
          ...Array.from({ length: 10 }, (_, i) => ({
            testName: `test-${i}`,
            command: `cmd-${i}`,
            status: 'success' as const,
            timestamp: new Date().toISOString(),
            metrics: {
              executionTime: 100 + i * 10, // Linear progression 100-190
              memoryUsage: { rss: 1000, heapUsed: 500, heapTotal: 1000, external: 100 },
              cpuUsage: { user: 50, system: 25 },
            },
          })),
          {
            testName: 'extreme-outlier',
            command: 'slow',
            status: 'success' as const,
            timestamp: new Date().toISOString(),
            metrics: {
              executionTime: 1000, // Much higher than the linear progression
              memoryUsage: { rss: 1000, heapUsed: 500, heapTotal: 1000, external: 100 },
              cpuUsage: { user: 50, system: 25 },
            },
          },
        ]

        const extremeState = { reports: reportsWithVariance }

        // Stricter threshold should find the outlier
        const strictOutliers = getPerformanceOutliers(extremeState, 1)
        expect(strictOutliers.some((r) => r.testName === 'extreme-outlier')).toBe(true)

        // Looser threshold might not find it
        const looseOutliers = getPerformanceOutliers(extremeState, 5)
        expect(looseOutliers.length).toBeLessThanOrEqual(strictOutliers.length)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty performance reports', () => {
      const empty = createPerformanceMonitorState()

      expect(getSlowestReports(empty, 5)).toEqual([])
      expect(getFastestReports(empty, 5)).toEqual([])
      expect(getHighestMemoryReports(empty, 5)).toEqual([])
      expect(getReportsSortedBy(empty, 'time')).toEqual([])
      expect(getPerformanceOutliers(empty)).toEqual([])
    })

    it('should handle reports with same execution times', () => {
      const sameTimeReports: PerformanceReport[] = Array.from({ length: 3 }, (_, i) => ({
        testName: `test-${i}`,
        command: 'cmd',
        status: 'success' as const,
        timestamp: new Date().toISOString(),
        metrics: {
          executionTime: 100, // Same time for all
          memoryUsage: {
            rss: 1000 + i * 100,
            heapUsed: 500 + i * 50,
            heapTotal: 1000,
            external: 100,
          },
          cpuUsage: { user: 50, system: 25 },
        },
      }))

      const sameTimeState = { reports: sameTimeReports }
      const sorted = getReportsSortedBy(sameTimeState, 'time')

      expect(sorted).toHaveLength(3)
      expect(sorted.every((r) => r.metrics.executionTime === 100)).toBe(true)
    })
  })
})
