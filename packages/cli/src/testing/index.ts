/**
 * @esteban-url/cli/testing
 *
 * CLI-specific testing utilities for command execution, interactive testing, and CLI workflows.
 * For general testing utilities, see the respective domain packages:
 * - @esteban-url/core/testing - Result matchers, error testing
 * - @esteban-url/fs/testing - Filesystem fixtures, path utilities
 * - @esteban-url/validation/testing - Schema testing
 *
 * @example
 * ```typescript
 * import {
 *   // CLI command testing
 *   runCommand, createCLITestRunner, testCLICommand,
 *   // Interactive testing
 *   createInteractiveTest, simulatePrompts,
 *   // CLI context and mocking
 *   createTestContext, mockLogger,
 *   // CLI assertions
 *   expectCommandSuccess, expectCommandFailure,
 *   // CLI performance monitoring
 *   measureCLIPerformance, createCLIPerformanceMonitor
 * } from '@esteban-url/cli/testing'
 *
 * // Test CLI command execution
 * const result = await runCommand(myCommand, ['--verbose'])
 * expectCommandSuccess(result)
 *
 * // Test interactive prompts
 * const interactive = createInteractiveTest(myInteractiveCommand)
 * await simulatePrompts(interactive, ['yes', 'save'])
 * ```
 */

// ========================================
// CLI Command Execution and Testing
// ========================================
export {
  runCommand,
  createCommandTestRunner,
  runTestCommand,
  runTestCommandExpectSuccess,
  runTestCommandExpectError,
  getTestContext,
  getTestFiles,
  getTestLogs,
} from './runner.js'

export type { CommandTestRunnerState } from './runner.js'

export {
  createCLITestRunner,
  expectCLISnapshot,
  createWorkflowTest,
  createCommandTestSuite,
  createInteractiveTest,
} from './cli-testing.js'

export type {
  CLISnapshotOptions,
  CLITestResult,
  WorkflowStep,
  CommandTestCase,
  InteractiveTestStep,
} from './cli-testing.js'

// ========================================
// Interactive CLI Testing
// ========================================
export {
  createInteractiveTestRunner,
  addResponse,
  addResponses,
  runInteractiveTestRunner,
  runInteractiveTest,
  sendInput,
  sendRaw,
  killProcess,
  createInteractiveTestHelper,
} from './interactive.js'

export type {
  InteractiveTestConfig,
  PromptResponse,
  InteractiveTestResult,
  InteractiveTestRunnerState,
} from './interactive.js'

// ========================================
// CLI Context and Mocking
// ========================================
export { createTestContext, createTestContextWithFiles } from './context.js'

export type { TestContextOptions } from './context.js'

// ========================================
// CLI-Specific Assertions
// ========================================
export {
  expectResult,
  expectError,
  expectSuccess,
  expectFailure,
  expectErrorCode,
  expectErrorMessage,
} from './assertions.js'

// ========================================
// CLI Performance Monitoring
// ========================================
export {
  createPerformanceMonitorState,
  monitorPerformance,
  getPerformanceReports,
  getPerformanceSummary,
  exportPerformanceReportsToJson,
  clearPerformanceReports,
  checkPerformanceThresholds,
  withPerformanceMonitoring,
  createCLIPerformanceMonitor,
} from './performance.js'

export type {
  PerformanceMetrics,
  PerformanceReport,
  PerformanceMonitorState as CLIPerformanceMonitorState,
} from './performance.js'

// ========================================
// Domain-Focused CLI Testing
// ========================================

/**
 * This package now focuses exclusively on CLI-specific testing utilities.
 * For other testing needs, import from the appropriate domain packages:
 *
 * @example
 * ```typescript
 * // Result testing
 * import { setupResultMatchers } from '@esteban-url/core/testing'
 *
 * // Filesystem testing
 * import { createTestTempDir, normalizePath } from '@esteban-url/fs/testing'
 *
 * // CLI testing (this package)
 * import { runCommand, createInteractiveTest } from '@esteban-url/cli/testing'
 * ```
 */

// ========================================
// Migration Notes
// ========================================

/**
 * Utilities moved to other packages:
 *
 * @esteban-url/core/testing:
 * - resultMatchers, setupResultMatchers
 * - Result helpers and factories
 *
 * @esteban-url/fs/testing:
 * - createTestTempDir, cleanup, createTestFile
 * - normalizePath, pathAssertions
 * - fixture management for files
 *
 * Future domain packages:
 * - data/testing: CSV/JSON fixtures and validators
 * - validation/testing: Schema testing utilities
 * - config/testing: Configuration testing helpers
 */
