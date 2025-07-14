import { ok, err } from '@esteban-url/core';
import type {
  TestOperations,
  TestSuiteBuilder,
  TestContext,
  TestRunner,
  TestRunnerOptions,
  MockFunction,
  MockImplementation,
  Assertion,
  TestResult,
  TestSuite,
  TestCase,
  TestFn,
  TestHookFn,
  TestReport,
  TestSuiteReport,
  TestCaseReport,
  TestStatus,
  TestRunContext,
  TestCleanupFn,
} from '../types.js';

// ========================================
// Test Operations
// ========================================

export const createTestOperations = (): TestOperations => {
  const createSuite = (name: string, options: Partial<TestContext> = {}): TestSuiteBuilder => {
    return createTestSuiteBuilder(name, options);
  };

  const createRunner = (options: Partial<TestRunnerOptions> = {}): TestRunner => {
    return createTestRunner(options);
  };

  const createMock = <TArgs extends readonly unknown[], TReturn>(
    implementation?: MockImplementation<TArgs, TReturn>
  ): MockFunction<TArgs, TReturn> => {
    return createMockFunction(implementation);
  };

  const expect = <T>(value: T): Assertion<T> => {
    return createAssertion(value);
  };

  return {
    createSuite,
    createRunner,
    createMock,
    expect,
  };
};

// ========================================
// Test Suite Builder
// ========================================

const createTestSuiteBuilder = (
  name: string,
  options: Partial<TestContext> = {}
): TestSuiteBuilder => {
  let context: TestContext = {
    name,
    timeout: 5000,
    retries: 0,
    metadata: {},
    hooks: {},
    cleanup: [],
    ...options,
  };

  const tests: TestCase[] = [];
  const suites: TestSuite[] = [];

  const test = (
    testName: string,
    fn: TestFn,
    testOptions: Partial<TestContext> = {}
  ): TestSuiteBuilder => {
    const testContext: TestContext = {
      ...context,
      name: testName,
      ...testOptions,
    };

    const testCase: TestCase = {
      name: testName,
      fn,
      context: testContext,
      status: 'pending',
      retries: 0,
    };

    tests.push(testCase);
    return builder;
  };

  const describe = (
    suiteName: string,
    fn: (suite: TestSuiteBuilder) => void,
    suiteOptions: Partial<TestContext> = {}
  ): TestSuiteBuilder => {
    const childBuilder = createTestSuiteBuilder(suiteName, { ...context, ...suiteOptions });
    fn(childBuilder);
    suites.push(childBuilder.build());
    return builder;
  };

  const beforeEach = (fn: TestHookFn): TestSuiteBuilder => {
    context = { ...context, hooks: { ...context.hooks, beforeEach: fn } };
    return builder;
  };

  const afterEach = (fn: TestHookFn): TestSuiteBuilder => {
    context = { ...context, hooks: { ...context.hooks, afterEach: fn } };
    return builder;
  };

  const beforeAll = (fn: TestHookFn): TestSuiteBuilder => {
    context = { ...context, hooks: { ...context.hooks, beforeAll: fn } };
    return builder;
  };

  const afterAll = (fn: TestHookFn): TestSuiteBuilder => {
    context = { ...context, hooks: { ...context.hooks, afterAll: fn } };
    return builder;
  };

  const build = (): TestSuite => {
    return {
      name,
      tests,
      suites,
      context,
      stats: {
        total: tests.length + suites.reduce((acc, suite) => acc + suite.stats.total, 0),
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
    };
  };

  const builder: TestSuiteBuilder = {
    name,
    context,
    test,
    describe,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    build,
  };

  return builder;
};

// ========================================
// Test Runner
// ========================================

const createTestRunner = (options: Partial<TestRunnerOptions> = {}): TestRunner => {
  const config: TestRunnerOptions = {
    timeout: 5000,
    retries: 0,
    parallel: false,
    verbose: false,
    failFast: false,
    reporter: createConsoleReporter(),
    ...options,
  };

  const run = async (suite: TestSuite): Promise<TestResult<TestReport>> => {
    try {
      const startTime = Date.now();

      await config.reporter.onStart([suite]);
      const suiteReport = await runSuite(suite);

      const report: TestReport = {
        suites: [suiteReport],
        stats: suiteReport.stats,
        duration: Date.now() - startTime,
        timestamp: new Date(),
        success: suiteReport.stats.failed === 0,
      };

      await config.reporter.onEnd(report);
      return ok(report);
    } catch (error) {
      return err({
        type: 'TestError',
        code: 'RUN_FAILED',
        message: 'Failed to run test suite',
        suggestion: 'Check test configuration and implementation',
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const runSuite = async (suite: TestSuite): Promise<TestSuiteReport> => {
    await config.reporter.onSuiteStart(suite);

    const stats = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
    const testReports: TestCaseReport[] = [];
    const suiteReports: TestSuiteReport[] = [];

    // Run hooks
    if (suite.context.hooks?.beforeAll) {
      await suite.context.hooks.beforeAll();
    }

    // Run tests
    for (const test of suite.tests) {
      const testResult = await runTest(test, suite.name);
      if (testResult.isOk()) {
        const updatedTest = testResult.value;
        testReports.push({
          name: updatedTest.name,
          status: updatedTest.status,
          duration: updatedTest.duration || 0,
          error: updatedTest.error
            ? {
                message: updatedTest.error.message,
                stack:
                  updatedTest.error.cause instanceof Error
                    ? updatedTest.error.cause.stack
                    : undefined,
              }
            : undefined,
          retries: updatedTest.retries,
        });

        stats.total++;
        if (updatedTest.status === 'passed') stats.passed++;
        else if (updatedTest.status === 'failed') stats.failed++;
        else if (updatedTest.status === 'skipped') stats.skipped++;
        stats.duration += updatedTest.duration || 0;

        if (config.failFast && updatedTest.status === 'failed') {
          break;
        }
      }
    }

    // Run child suites
    for (const childSuite of suite.suites) {
      const childReport: TestSuiteReport = await runSuite(childSuite);
      suiteReports.push(childReport);

      stats.total += childReport.stats.total;
      stats.passed += childReport.stats.passed;
      stats.failed += childReport.stats.failed;
      stats.skipped += childReport.stats.skipped;
      stats.duration += childReport.stats.duration;
    }

    // Run cleanup hooks
    if (suite.context.hooks?.afterAll) {
      await suite.context.hooks.afterAll();
    }

    const suiteReport: TestSuiteReport = {
      name: suite.name,
      tests: testReports,
      suites: suiteReports,
      stats,
    };

    await config.reporter.onSuiteEnd(suite, suiteReport);
    return suiteReport;
  };

  const runTest = async (test: TestCase, suiteName?: string): Promise<TestResult<TestCase>> => {
    try {
      await config.reporter.onTestStart(test);

      const startTime = Date.now();
      let updatedTest = { ...test, status: 'running' as TestStatus };

      const cleanupFns: TestCleanupFn[] = [];
      const runContext: TestRunContext = {
        suite: suiteName || test.context.name,
        test: test.name,
        timeout: test.context.timeout || config.timeout,
        cleanup: (fn: TestCleanupFn) => {
          cleanupFns.push(fn);
        },
        skip: (reason?: string) => {
          throw new Error(`TEST_SKIP: ${reason || 'Test skipped'}`);
        },
        fail: (message: string, cause?: Error) => {
          throw new Error(`TEST_FAIL: ${message}`);
        },
      };

      // Run before hooks
      if (test.context.hooks?.beforeEach) {
        const hookResult = await test.context.hooks.beforeEach();
        if (hookResult.isErr()) {
          throw new Error(`beforeEach hook failed: ${hookResult.error.message}`);
        }
      }

      // Run the test
      try {
        const testResult = await Promise.race([
          test.fn(runContext),
          createTimeout(test.context.timeout || config.timeout),
        ]);

        // Handle both Result types and direct results
        if (testResult && typeof testResult === 'object' && 'isErr' in testResult) {
          // Result type
          if (testResult.isErr()) {
            updatedTest = {
              ...updatedTest,
              status: 'failed',
              error: testResult.error,
              duration: Date.now() - startTime,
            };
          } else {
            updatedTest = {
              ...updatedTest,
              status: 'passed',
              duration: Date.now() - startTime,
            };
          }
        } else {
          // Direct result (non-Result type)
          updatedTest = {
            ...updatedTest,
            status: 'passed',
            duration: Date.now() - startTime,
          };
        }
      } catch (error) {
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
          };
        } else {
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
          };
        }
      }

      // Run after hooks
      if (test.context.hooks?.afterEach) {
        await test.context.hooks.afterEach();
      }

      // Run cleanup
      for (const cleanup of test.context.cleanup || []) {
        await cleanup();
      }

      const testReport = {
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
      };

      await config.reporter.onTestEnd(updatedTest, testReport);
      return ok(updatedTest);
    } catch (error) {
      return err({
        type: 'TestError',
        code: 'TEST_EXECUTION_FAILED',
        message: `Failed to execute test ${test.name}`,
        cause: error,
        recoverable: false,
      } as any);
    }
  };

  const createContext = (options: Partial<TestRunnerOptions> = {}): TestRunContext => {
    const cleanupFns: TestCleanupFn[] = [];

    return {
      suite: options.toString() || 'unknown',
      test: 'unknown',
      timeout: config.timeout,
      cleanup: (fn: TestCleanupFn) => {
        cleanupFns.push(fn);
      },
      skip: (reason?: string) => {
        throw new Error(`TEST_SKIP: ${reason || 'Test skipped'}`);
      },
      fail: (message: string, cause?: Error) => {
        throw new Error(`TEST_FAIL: ${message}`, { cause });
      },
    };
  };

  return {
    run,
    runTest,
    createContext,
  };
};

// ========================================
// Mock Function
// ========================================

const createMockFunction = <TArgs extends readonly unknown[], TReturn>(
  implementation?: MockImplementation<TArgs, TReturn>
): MockFunction<TArgs, TReturn> => {
  const calls: TArgs[] = [];
  const results: Array<{ type: 'return' | 'throw'; value?: TReturn; error?: Error }> = [];
  const instances: unknown[] = [];
  let callOrder = 0;
  let currentImplementation = implementation;

  const mockFn = ((...args: TArgs): TReturn => {
    calls.push(args);
    instances.push(undefined);
    callOrder++;

    try {
      if (currentImplementation) {
        const result = currentImplementation(...args);
        results.push({ type: 'return', value: result });
        return result;
      } else {
        const result = undefined as TReturn;
        results.push({ type: 'return', value: result });
        return result;
      }
    } catch (error) {
      results.push({ type: 'throw', error: error as Error });
      throw error;
    }
  }) as MockFunction<TArgs, TReturn>;

  (mockFn as any).mock = {
    calls,
    results,
    instances,
    invocationCallOrder: [],
    get lastCall() {
      return calls[calls.length - 1];
    },
    get lastResult() {
      return results[results.length - 1];
    },
    clear: () => {
      calls.length = 0;
      results.length = 0;
      instances.length = 0;
    },
    reset: () => {
      calls.length = 0;
      results.length = 0;
      instances.length = 0;
      currentImplementation = undefined;
    },
    restore: () => {
      // No-op for basic mock functions
    },
  };

  return mockFn;
};

// ========================================
// Assertion
// ========================================

const createAssertion = <T>(value: T): Assertion<T> => {
  const assertion: Assertion<T> = {
    value,
    get not() {
      return createNegatedAssertion(value);
    },
    toBe: (expected: T) => {
      if (value !== expected) {
        throw new Error(`Expected ${String(value)} to be ${String(expected)}`);
      }
    },
    toEqual: (expected: T) => {
      if (!deepEqual(value, expected)) {
        throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toBeNull: () => {
      if (value !== null) {
        throw new Error(`Expected ${String(value)} to be null`);
      }
    },
    toBeUndefined: () => {
      if (value !== undefined) {
        throw new Error(`Expected ${String(value)} to be undefined`);
      }
    },
    toBeDefined: () => {
      if (value === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toBeTruthy: () => {
      if (!value) {
        throw new Error(`Expected ${String(value)} to be truthy`);
      }
    },
    toBeFalsy: () => {
      if (value) {
        throw new Error(`Expected ${String(value)} to be falsy`);
      }
    },
    toThrow: ((expected?: string | RegExp | Error) => {
      if (typeof value !== 'function') {
        throw new Error('Expected value to be a function');
      }

      try {
        (value as any)();
        throw new Error('Expected function to throw');
      } catch (error) {
        if (expected) {
          if (typeof expected === 'string') {
            if (!(error instanceof Error) || !error.message.includes(expected)) {
              throw new Error(`Expected error message to contain "${expected}"`);
            }
          } else if (expected instanceof RegExp) {
            if (!(error instanceof Error) || !expected.test(error.message)) {
              throw new Error(`Expected error message to match ${expected}`);
            }
          } else if (expected instanceof Error) {
            if (!(error instanceof Error) || error.message !== expected.message) {
              throw new Error(`Expected error to match ${expected.message}`);
            }
          }
        }
      }
    }) as any,
    toResolve: (async () => {
      if (!(value instanceof Promise)) {
        throw new Error('Expected value to be a Promise');
      }

      try {
        await value;
      } catch (error) {
        throw new Error(`Expected promise to resolve, but it rejected with: ${error}`);
      }
    }) as any,
    toReject: (async (expected?: string | RegExp | Error) => {
      if (!(value instanceof Promise)) {
        throw new Error('Expected value to be a Promise');
      }

      try {
        await value;
        throw new Error('Expected promise to reject');
      } catch (error) {
        if (expected) {
          if (typeof expected === 'string') {
            if (!(error instanceof Error) || !error.message.includes(expected)) {
              throw new Error(`Expected rejection message to contain "${expected}"`);
            }
          } else if (expected instanceof RegExp) {
            if (!(error instanceof Error) || !expected.test(error.message)) {
              throw new Error(`Expected rejection message to match ${expected}`);
            }
          } else if (expected instanceof Error) {
            if (!(error instanceof Error) || error.message !== expected.message) {
              throw new Error(`Expected rejection to match ${expected.message}`);
            }
          }
        }
      }
    }) as any,
  };

  return assertion;
};

const createNegatedAssertion = <T>(value: T): Assertion<T> => {
  return {
    value,
    get not() {
      return createAssertion(value);
    },
    toBe: (expected: T) => {
      if (value === expected) {
        throw new Error(`Expected ${String(value)} not to be ${String(expected)}`);
      }
    },
    toEqual: (expected: T) => {
      if (deepEqual(value, expected)) {
        throw new Error(
          `Expected ${JSON.stringify(value)} not to equal ${JSON.stringify(expected)}`
        );
      }
    },
    toBeNull: () => {
      if (value === null) {
        throw new Error(`Expected ${String(value)} not to be null`);
      }
    },
    toBeUndefined: () => {
      if (value === undefined) {
        throw new Error(`Expected ${String(value)} not to be undefined`);
      }
    },
    toBeDefined: () => {
      if (value !== undefined) {
        throw new Error('Expected value not to be defined');
      }
    },
    toBeTruthy: () => {
      if (value) {
        throw new Error(`Expected ${String(value)} not to be truthy`);
      }
    },
    toBeFalsy: () => {
      if (!value) {
        throw new Error(`Expected ${String(value)} not to be falsy`);
      }
    },
    toThrow: ((expected?: string | RegExp | Error) => {
      if (typeof value !== 'function') {
        throw new Error('Expected value to be a function');
      }

      try {
        (value as any)();
        // If no error is thrown, that's what we want for negation
      } catch (error) {
        throw new Error('Expected function not to throw');
      }
    }) as any,
    toResolve: (async () => {
      if (!(value instanceof Promise)) {
        throw new Error('Expected value to be a Promise');
      }

      try {
        await value;
        throw new Error('Expected promise not to resolve');
      } catch (error) {
        // Promise rejected, which is what we want for negation
      }
    }) as any,
    toReject: (async (expected?: string | RegExp | Error) => {
      if (!(value instanceof Promise)) {
        throw new Error('Expected value to be a Promise');
      }

      try {
        await value;
        // Promise resolved, which is what we want for negation
      } catch (error) {
        throw new Error('Expected promise not to reject');
      }
    }) as any,
  };
};

// ========================================
// Helper Functions
// ========================================

const createTimeout = (ms: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TEST_TIMEOUT')), ms);
  });
};

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual((a as any)[key], (b as any)[key])) return false;
    }

    return true;
  }

  return false;
};

const createConsoleReporter = () => ({
  onStart: async () => {},
  onSuiteStart: async () => {},
  onSuiteEnd: async () => {},
  onTestStart: async () => {},
  onTestEnd: async () => {},
  onEnd: async () => {},
});
