export {
  mockFileSystem,
  mockLogger,
  mockPrompts,
  mockConfig,
  createConfigMock,
  createEnhancedMockFileSystem,
  createTestMockFileSystem,
  createCLIMockFileSystem,
  createCrossPlatformMockFileSystem,
} from './mocks.js';
export { createTestContext, createTestContextWithFiles } from './context.js';
export {
  runCommand,
  createCommandTestRunner,
  runTestCommand,
  runTestCommandExpectSuccess,
  runTestCommandExpectError,
  getTestContext,
  getTestFiles,
  getTestLogs,
} from './runner.js';

export type { CommandTestRunnerState } from './runner.js';

export type { TestContextOptions } from './context.js';
export type {
  MockFileSystemOptions,
  EnhancedMockFileSystem,
  MockConfigOptions,
  CreateConfigMockOptions,
} from './mocks.js';

export {
  expectResult,
  expectError,
  expectSuccess,
  expectFailure,
  expectErrorCode,
  expectErrorMessage,
} from './assertions.js';

// Test suite builders
export {
  createResultTestSuite,
  createFileSystemTestSuite,
  createErrorTemplateTestSuite,
  createValidationTestSuite,
  createMockFactory,
  createTestSuite,
} from './test-suites.js';

export type {
  ResultTestCase,
  FileSystemTestCase,
  ErrorTemplateTestCase,
  ValidationTestCase,
  MockFactory,
  TestContextConfig,
} from './test-suites.js';

// CLI testing utilities
export {
  createCLITestRunner,
  expectCLISnapshot,
  createWorkflowTest,
  createCommandTestSuite,
  createInteractiveTest,
} from './cli-testing.js';

// Interactive testing
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
} from './interactive.js';

export type {
  InteractiveTestConfig,
  PromptResponse,
  InteractiveTestResult,
  InteractiveTestRunnerState,
} from './interactive.js';

// Performance monitoring
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
} from './performance.js';

export type {
  PerformanceMetrics,
  PerformanceReport,
  PerformanceMonitorState as CLIPerformanceMonitorState,
} from './performance.js';

export type {
  CLISnapshotOptions,
  CLITestResult,
  WorkflowStep,
  CommandTestCase,
  InteractiveTestStep,
} from './cli-testing.js';

// Vitest matchers
export { resultMatchers, setupResultMatchers } from './vitest-matchers.js';

// Fixture management
export {
  createFixtureManager,
  fixtures,
  testData,
  createTempFixture,
  createFixtureBuilder,
  addFile,
  addCsv,
  addJson,
  addPackageJson,
  addDirectory,
  buildFixtures,
  fixtureBuilder,
} from './fixtures.js';

export type { FixtureManager, FixtureBuilderState } from './fixtures.js';

// Test debugging and profiling
export {
  createPerformanceMonitor,
  measure,
  getPerformanceStats,
  getAllPerformanceStats,
  clearPerformanceStats,
  printPerformanceReport,
  createTestDebugger,
  enableDebugger,
  disableDebugger,
  debugLog,
  infoLog,
  warnLog,
  errorLog,
  traceResult,
  getDebugLogs,
  clearDebugLogs,
  printDebugReport,
  createTestStateInspector,
  captureSnapshot,
  compareSnapshots,
  getSnapshot,
  clearSnapshots,
  printSnapshotComparison,
  testUtils,
  profileTest,
  debugTest,
} from './test-debugging.js';

export type {
  PerformanceMonitorState as TestPerformanceMonitorState,
  TestDebuggerState,
  TestStateInspectorState,
  TestUtilsState,
} from './test-debugging.js';

// Cross-platform path utilities
export {
  normalizePath,
  toPosixPath,
  toWindowsPath,
  createTestPath,
  createPathRegex,
  pathAssertions,
  testPaths,
  isWindows,
} from './path-utils.js';
