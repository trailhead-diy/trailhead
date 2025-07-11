import type { Result } from '@trailhead/core';
import type { TrailheadError } from '@trailhead/core/errors';

// ========================================
// Result Type Alias
// ========================================

export type TestResult<T> = Result<T, TrailheadError>;

// ========================================
// Test Context Types
// ========================================

export interface TestContext {
  readonly name: string;
  readonly timeout?: number;
  readonly retries?: number;
  readonly metadata?: Record<string, unknown>;
  readonly hooks?: TestHooks;
  readonly cleanup?: readonly TestCleanupFn[];
}

export interface TestHooks {
  readonly beforeEach?: TestHookFn;
  readonly afterEach?: TestHookFn;
  readonly beforeAll?: TestHookFn;
  readonly afterAll?: TestHookFn;
}

export type TestHookFn = () => Promise<TestResult<void>> | TestResult<void>;
export type TestCleanupFn = () => Promise<void> | void;

// ========================================
// Test Suite Types
// ========================================

export interface TestSuite {
  readonly name: string;
  readonly tests: readonly TestCase[];
  readonly suites: readonly TestSuite[];
  readonly context: TestContext;
  readonly stats: TestStats;
}

export interface TestCase {
  readonly name: string;
  readonly fn: TestFn;
  readonly context: TestContext;
  readonly status: TestStatus;
  readonly duration?: number;
  readonly error?: TrailheadError;
  readonly retries: number;
}

export type TestFn = (context: TestRunContext) => Promise<TestResult<void>> | TestResult<void>;

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'timeout';

export interface TestStats {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly duration: number;
}

// ========================================
// Test Runner Types
// ========================================

export interface TestRunner {
  readonly run: (suite: TestSuite) => Promise<TestResult<TestReport>>;
  readonly runTest: (test: TestCase) => Promise<TestResult<TestCase>>;
  readonly createContext: (options?: Partial<TestRunnerOptions>) => TestRunContext;
}

export interface TestRunnerOptions {
  readonly timeout: number;
  readonly retries: number;
  readonly parallel: boolean;
  readonly verbose: boolean;
  readonly failFast: boolean;
  readonly reporter: TestReporter;
}

export interface TestRunContext {
  readonly suite: string;
  readonly test: string;
  readonly timeout: number;
  readonly cleanup: (fn: TestCleanupFn) => void;
  readonly skip: (reason?: string) => never;
  readonly fail: (message: string, cause?: Error) => never;
}

// ========================================
// Test Report Types
// ========================================

export interface TestReport {
  readonly suites: readonly TestSuiteReport[];
  readonly stats: TestStats;
  readonly duration: number;
  readonly timestamp: Date;
  readonly success: boolean;
}

export interface TestSuiteReport {
  readonly name: string;
  readonly tests: readonly TestCaseReport[];
  readonly suites: readonly TestSuiteReport[];
  readonly stats: TestStats;
}

export interface TestCaseReport {
  readonly name: string;
  readonly status: TestStatus;
  readonly duration: number;
  readonly error?: TestError;
  readonly retries: number;
}

export interface TestError {
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
  readonly cause?: unknown;
}

// ========================================
// Mock Types
// ========================================

export interface MockFunction<TArgs extends readonly unknown[] = readonly unknown[], TReturn = unknown> {
  (...args: TArgs): TReturn;
  readonly mock: MockFunctionState<TArgs, TReturn>;
}

export interface MockFunctionState<TArgs extends readonly unknown[], TReturn> {
  readonly calls: readonly TArgs[];
  readonly results: readonly MockResult<TReturn>[];
  readonly instances: readonly unknown[];
  readonly invocationCallOrder: readonly number[];
  readonly lastCall?: TArgs;
  readonly lastResult?: MockResult<TReturn>;
  readonly clear: () => void;
  readonly reset: () => void;
  readonly restore: () => void;
}

export interface MockResult<T> {
  readonly type: 'return' | 'throw' | 'incomplete';
  readonly value?: T;
  readonly error?: Error;
}

export interface MockImplementation<TArgs extends readonly unknown[], TReturn> {
  (...args: TArgs): TReturn;
}

// ========================================
// Fixture Types
// ========================================

export interface TestFixture<T = unknown> {
  readonly name: string;
  readonly create: () => Promise<TestResult<T>> | TestResult<T>;
  readonly cleanup?: (fixture: T) => Promise<TestResult<void>> | TestResult<void>;
  readonly dependencies?: readonly string[];
}

export interface FixtureRegistry {
  readonly register: <T>(fixture: TestFixture<T>) => void;
  readonly get: <T>(name: string) => Promise<TestResult<T>>;
  readonly cleanup: () => Promise<TestResult<void>>;
  readonly clear: () => void;
}

// ========================================
// Assertion Types
// ========================================

export interface Assertion<T> {
  readonly value: T;
  readonly not: Assertion<T>;
  readonly toBe: (expected: T) => void;
  readonly toEqual: (expected: T) => void;
  readonly toBeNull: () => void;
  readonly toBeUndefined: () => void;
  readonly toBeDefined: () => void;
  readonly toBeTruthy: () => void;
  readonly toBeFalsy: () => void;
  readonly toThrow: T extends (...args: any[]) => any ? (expected?: string | RegExp | Error) => void : never;
  readonly toResolve: T extends Promise<any> ? () => Promise<void> : never;
  readonly toReject: T extends Promise<any> ? (expected?: string | RegExp | Error) => Promise<void> : never;
}

export interface NumberAssertion extends Assertion<number> {
  readonly toBeGreaterThan: (expected: number) => void;
  readonly toBeGreaterThanOrEqual: (expected: number) => void;
  readonly toBeLessThan: (expected: number) => void;
  readonly toBeLessThanOrEqual: (expected: number) => void;
  readonly toBeCloseTo: (expected: number, precision?: number) => void;
  readonly toBeNaN: () => void;
  readonly toBeInfinite: () => void;
}

export interface StringAssertion extends Assertion<string> {
  readonly toContain: (expected: string) => void;
  readonly toMatch: (expected: string | RegExp) => void;
  readonly toStartWith: (expected: string) => void;
  readonly toEndWith: (expected: string) => void;
  readonly toHaveLength: (expected: number) => void;
}

export interface ArrayAssertion<T> extends Assertion<readonly T[]> {
  readonly toContain: (expected: T) => void;
  readonly toContainEqual: (expected: T) => void;
  readonly toHaveLength: (expected: number) => void;
  readonly toBeEmpty: () => void;
}

// ========================================
// Reporter Types
// ========================================

export interface TestReporter {
  readonly onStart: (suites: readonly TestSuite[]) => Promise<void> | void;
  readonly onSuiteStart: (suite: TestSuite) => Promise<void> | void;
  readonly onSuiteEnd: (suite: TestSuite, report: TestSuiteReport) => Promise<void> | void;
  readonly onTestStart: (test: TestCase) => Promise<void> | void;
  readonly onTestEnd: (test: TestCase, report: TestCaseReport) => Promise<void> | void;
  readonly onEnd: (report: TestReport) => Promise<void> | void;
}

// ========================================
// Operations Types
// ========================================

export interface TestOperations {
  readonly createSuite: (name: string, options?: Partial<TestContext>) => TestSuiteBuilder;
  readonly createRunner: (options?: Partial<TestRunnerOptions>) => TestRunner;
  readonly createMock: <TArgs extends readonly unknown[], TReturn>(
    implementation?: MockImplementation<TArgs, TReturn>
  ) => MockFunction<TArgs, TReturn>;
  readonly expect: <T>(value: T) => Assertion<T>;
}

export interface MockOperations {
  readonly createFunction: <TArgs extends readonly unknown[], TReturn>(
    implementation?: MockImplementation<TArgs, TReturn>
  ) => MockFunction<TArgs, TReturn>;
  readonly spyOn: <T, K extends keyof T>(object: T, method: K) => MockFunction<any[], any>;
  readonly mockModule: (modulePath: string, factory?: () => unknown) => void;
  readonly clearAllMocks: () => void;
  readonly resetAllMocks: () => void;
  readonly restoreAllMocks: () => void;
}

export interface FixtureOperations {
  readonly createRegistry: () => FixtureRegistry;
  readonly createFixture: <T>(name: string, options: Omit<TestFixture<T>, 'name'>) => TestFixture<T>;
  readonly withFixtures: <T>(
    fixtures: readonly TestFixture<any>[],
    fn: (registry: FixtureRegistry) => Promise<TestResult<T>> | TestResult<T>
  ) => Promise<TestResult<T>>;
}

// ========================================
// Test Builder Types
// ========================================

export interface TestSuiteBuilder {
  readonly name: string;
  readonly context: TestContext;
  readonly test: (name: string, fn: TestFn, options?: Partial<TestContext>) => TestSuiteBuilder;
  readonly describe: (name: string, fn: (suite: TestSuiteBuilder) => void, options?: Partial<TestContext>) => TestSuiteBuilder;
  readonly beforeEach: (fn: TestHookFn) => TestSuiteBuilder;
  readonly afterEach: (fn: TestHookFn) => TestSuiteBuilder;
  readonly beforeAll: (fn: TestHookFn) => TestSuiteBuilder;
  readonly afterAll: (fn: TestHookFn) => TestSuiteBuilder;
  readonly build: () => TestSuite;
}