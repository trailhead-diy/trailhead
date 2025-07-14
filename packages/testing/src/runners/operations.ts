import { ok, err } from '@esteban-url/core'
import type {
  TestRunner,
  TestRunnerOptions,
  TestReporter,
  TestSuite,
  TestCase,
  TestResult,
  TestReport,
  TestSuiteReport,
  TestCaseReport,
  TestStats,
  TestStatus,
  TestRunContext,
  TestCleanupFn,
} from '../types.js'

// ========================================
// Test Runners
// ========================================

export const createSequentialRunner = (options: Partial<TestRunnerOptions> = {}): TestRunner => {
  const config: TestRunnerOptions = {
    timeout: 5000,
    retries: 0,
    parallel: false,
    verbose: false,
    failFast: false,
    reporter: createConsoleReporter(),
    ...options,
  }

  const run = async (suite: TestSuite): Promise<TestResult<TestReport>> => {
    try {
      const startTime = Date.now()

      await config.reporter.onStart([suite])
      const suiteReport = await runSuiteSequentially(suite)

      const report: TestReport = {
        suites: [suiteReport],
        stats: suiteReport.stats,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        success: suiteReport.stats.failed === 0,
      }

      await config.reporter.onEnd(report)
      return ok(report)
    } catch (error) {
      return err({
        type: 'TestError',
        code: 'RUN_FAILED',
        message: 'Failed to run test suite',
        suggestion: 'Check test configuration and implementation',
        cause: error,
        recoverable: false,
      } as any)
    }
  }

  const runSuiteSequentially = async (suite: TestSuite): Promise<TestSuiteReport> => {
    await config.reporter.onSuiteStart(suite)

    const stats: TestStats = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 }
    const testReports: TestCaseReport[] = []
    const suiteReports: TestSuiteReport[] = []

    // Run beforeAll hook
    if (suite.context.hooks?.beforeAll) {
      const hookResult = await suite.context.hooks.beforeAll()
      if (hookResult.isErr()) {
        throw new Error(`beforeAll hook failed: ${hookResult.error.message}`)
      }
    }

    // Run tests sequentially
    for (const test of suite.tests) {
      const testResult = await runTest(test)
      if (testResult.isOk()) {
        const updatedTest = testResult.value
        const testReport: TestCaseReport = {
          name: updatedTest.name,
          status: updatedTest.status,
          duration: updatedTest.duration || 0,
          error: updatedTest.error
            ? {
                message: updatedTest.error.message,
                code: updatedTest.error.type,
                cause: updatedTest.error.cause,
              }
            : undefined,
          retries: updatedTest.retries,
        }

        testReports.push(testReport)
        ;(stats as any).total++

        if (updatedTest.status === 'passed') (stats as any).passed++
        else if (updatedTest.status === 'failed') (stats as any).failed++
        else if (updatedTest.status === 'skipped') (stats as any).skipped++
        ;(stats as any).duration += updatedTest.duration || 0

        if (config.failFast && updatedTest.status === 'failed') {
          break
        }
      }
    }

    // Run child suites
    for (const childSuite of suite.suites) {
      const childReport = await runSuiteSequentially(childSuite)
      suiteReports.push(childReport)
      ;(stats as any).total += childReport.stats.total
      ;(stats as any).passed += childReport.stats.passed
      ;(stats as any).failed += childReport.stats.failed
      ;(stats as any).skipped += childReport.stats.skipped
      ;(stats as any).duration += childReport.stats.duration
    }

    // Run afterAll hook
    if (suite.context.hooks?.afterAll) {
      const hookResult = await suite.context.hooks.afterAll()
      if (hookResult.isErr()) {
        throw new Error(`afterAll hook failed: ${hookResult.error.message}`)
      }
    }

    const suiteReport: TestSuiteReport = {
      name: suite.name,
      tests: testReports,
      suites: suiteReports,
      stats,
    }

    await config.reporter.onSuiteEnd(suite, suiteReport)
    return suiteReport
  }

  const runTest = async (test: TestCase): Promise<TestResult<TestCase>> => {
    try {
      await config.reporter.onTestStart(test)

      const startTime = Date.now()
      let updatedTest = { ...test, status: 'running' as TestStatus }

      const runContext = createContext({
        timeout: test.context.timeout || config.timeout,
        ...(test.context.name && { suite: test.context.name }),
        ...(test.name && { test: test.name }),
      } as any)

      // Run beforeEach hook
      if (test.context.hooks?.beforeEach) {
        const hookResult = await test.context.hooks.beforeEach()
        if (hookResult.isErr()) {
          throw new Error(`beforeEach hook failed: ${hookResult.error.message}`)
        }
      }

      // Run the test with retry logic
      let lastError: Error | undefined
      const maxAttempts = (test.context.retries || config.retries) + 1

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const testResult = await Promise.race([
            test.fn(runContext),
            createTimeout(test.context.timeout || config.timeout),
          ])

          if (testResult.isErr()) {
            lastError = new Error(testResult.error.message)
            updatedTest.retries = attempt

            if (attempt === maxAttempts - 1) {
              updatedTest = {
                ...updatedTest,
                status: 'failed',
                error: testResult.error,
                duration: Date.now() - startTime,
              }
              break
            }
            continue
          } else {
            updatedTest = {
              ...updatedTest,
              status: 'passed',
              duration: Date.now() - startTime,
              retries: attempt,
            }
            break
          }
        } catch (error) {
          lastError = error as Error
          updatedTest.retries = attempt

          if (error instanceof Error && error.message === 'TEST_TIMEOUT') {
            updatedTest = {
              ...updatedTest,
              status: 'timeout',
              duration: Date.now() - startTime,
              error: {
                type: 'TestError',
                code: 'TIMEOUT',
                message: `Test timed out after ${test.context.timeout || config.timeout}ms`,
                recoverable: false,
              } as any,
            }
            break
          } else if (error instanceof Error && error.message.startsWith('TEST_SKIP:')) {
            updatedTest = {
              ...updatedTest,
              status: 'skipped',
              duration: Date.now() - startTime,
            }
            break
          } else if (attempt === maxAttempts - 1) {
            updatedTest = {
              ...updatedTest,
              status: 'failed',
              duration: Date.now() - startTime,
              error: {
                type: 'TestError',
                code: 'TEST_FAILED',
                message: error instanceof Error ? error.message : 'Unknown error',
                cause: error,
                recoverable: false,
              } as any,
            }
            break
          }
        }
      }

      // Run afterEach hook
      if (test.context.hooks?.afterEach) {
        const hookResult = await test.context.hooks.afterEach()
        if (hookResult.isErr()) {
          // Don't fail the test for afterEach errors
          // afterEach hook failure recorded but not propagated
        }
      }

      // Run cleanup
      for (const cleanup of test.context.cleanup || []) {
        try {
          await cleanup()
        } catch (error) {
          // Cleanup failure recorded but not propagated
        }
      }

      const testReport: TestCaseReport = {
        name: updatedTest.name,
        status: updatedTest.status,
        duration: updatedTest.duration || 0,
        error: updatedTest.error
          ? {
              message: updatedTest.error.message,
              code: updatedTest.error.type,
              cause: updatedTest.error.cause,
            }
          : undefined,
        retries: updatedTest.retries,
      }

      await config.reporter.onTestEnd(updatedTest, testReport)
      return ok(updatedTest)
    } catch (error) {
      return err({
        type: 'TestError',
        code: 'TEST_EXECUTION_FAILED',
        message: `Failed to execute test ${test.name}`,
        cause: error,
        recoverable: false,
      } as any)
    }
  }

  const createContext = (options: Partial<TestRunnerOptions> = {}): TestRunContext => {
    const cleanupFns: TestCleanupFn[] = []

    return {
      suite: (options as any)?.suite || 'unknown',
      test: (options as any)?.test || 'unknown',
      timeout: options.timeout || 5000,
      cleanup: (fn: TestCleanupFn) => {
        cleanupFns.push(fn)
      },
      skip: (reason?: string) => {
        throw new Error(`TEST_SKIP: ${reason || 'Test skipped'}`)
      },
      fail: (message: string, cause?: Error) => {
        throw new Error(`TEST_FAIL: ${message}`, { cause })
      },
    }
  }

  return {
    run,
    runTest,
    createContext,
  }
}

export const createParallelRunner = (options: Partial<TestRunnerOptions> = {}): TestRunner => {
  const sequentialRunner = createSequentialRunner({ ...options, parallel: true })

  // For now, parallel runner uses sequential implementation
  // In a full implementation, this would run tests concurrently
  return sequentialRunner
}

// ========================================
// Helper Functions
// ========================================

const createTimeout = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TEST_TIMEOUT')), ms)
  })
}

const createConsoleReporter = (): TestReporter => ({
  onStart: async (suites) => {
    if (suites.length > 0) {
      // Running test suites
    }
  },
  onSuiteStart: async (suite) => {
    // Suite started
  },
  onSuiteEnd: async (suite, report) => {
    const { stats } = report
    // Suite completed
  },
  onTestStart: async () => {
    // No-op for console reporter
  },
  onTestEnd: async (test, report) => {
    const statusIcon =
      report.status === 'passed'
        ? '✓'
        : report.status === 'failed'
          ? '✗'
          : report.status === 'skipped'
            ? '-'
            : '?'
    // Test completed

    if (report.error) {
      // Test error recorded
    }
  },
  onEnd: async (report) => {
    const { stats } = report
    // Test results recorded
  },
})
