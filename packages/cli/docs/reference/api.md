---
type: reference
title: 'CLI Package API Reference'
description: 'Complete API reference for CLI framework with command creation, execution patterns, testing utilities, and Result-based error handling'
related:
  - /docs/reference/core-api
  - /packages/core/docs/reference/api
  - /packages/cli/docs/explanation/architecture
  - /packages/cli/docs/how-to/test-cli-applications
---

# CLI Package API Reference

Complete API reference for `@esteban-url/cli` package providing a functional CLI framework for building robust, testable command-line applications with TypeScript and Result types.

## Core Types

### Result Types (from @esteban-url/core)

**⚠️ IMPORTANT**: This package uses Result types from `@esteban-url/core` (neverthrow), not custom Result types.

```typescript
import type { Result, CoreError } from '@esteban-url/core'
```

### `CLI`

Main CLI application interface.

```typescript
interface CLI {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly commands: Command[]
  run(args?: string[]): Promise<Result<void, CoreError>>
}
```

### `CLIConfig`

Configuration for creating a CLI application.

```typescript
interface CLIConfig {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly commands?: Command[]
}
```

## Main API

### `createCLI()`

Creates a CLI application instance.

```typescript
const createCLI = (config: CLIConfig): CLI => {
```

**Parameters**:

- `config` - CLI configuration object

**Returns**: `CLI` instance

**Usage**:

```typescript
import { createCLI } from '@esteban-url/cli'

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  commands: [buildCommand, testCommand],
})

await cli.run()
```

## Subpath Exports

### `@esteban-url/cli/command`

Command creation and execution utilities.

#### Types

##### `Command`

Command interface for CLI registration.

```typescript
interface Command {
  readonly name: string
  readonly description: string
  readonly options?: CommandOption[]
  readonly action: CommandAction<any>
}
```

##### `CommandContext`

Execution context provided to command actions.

```typescript
interface CommandContext {
  readonly logger: Logger
  readonly args: string[]
  readonly cwd: string
}
```

##### `CommandOption`

Command option/flag specification.

```typescript
interface CommandOption {
  readonly name?: string
  readonly alias?: string
  readonly flags?: string
  readonly description: string
  readonly type?: 'string' | 'boolean' | 'number'
  readonly required?: boolean
  readonly default?: any
  readonly choices?: string[]
}
```

##### `CommandArgument`

Command argument specification.

```typescript
interface CommandArgument {
  readonly name: string
  readonly description: string
  readonly required?: boolean
  readonly variadic?: boolean
}
```

##### `CommandPhase`

Phase configuration for multi-step commands.

```typescript
interface CommandPhase {
  readonly name: string
  readonly description: string
  readonly action: (context: any) => Promise<Result<any, CoreError>>
}
```

##### `InteractiveOptions`

Options for interactive command execution.

```typescript
interface InteractiveOptions {
  readonly prompts?: boolean
  readonly confirmDestructive?: boolean
  readonly showProgress?: boolean
}
```

#### Base Command Creation

##### `createCommand()`

Creates a command with the specified configuration.

```typescript
function createCommand<T extends CommandOptions>(config: CommandConfig<T>): Command
```

**Types**:

```typescript
interface CommandOptions {
  readonly verbose?: boolean
  readonly dryRun?: boolean
}

interface CommandConfig<T extends CommandOptions> {
  readonly name: string
  readonly description: string
  readonly arguments?: string
  readonly options?: CommandOption[]
  readonly examples?: string[]
  readonly action: CommandAction<T>
  readonly validation?: CommandValidator<T>
}

type CommandAction<T extends CommandOptions> = (
  options: T,
  context: CommandContext
) => Promise<Result<void, CoreError>>

type CommandValidator<T extends CommandOptions> = (options: T) => Result<T, CoreError>
```

**Example**:

```typescript
import { createCommand } from '@esteban-url/cli/command'

interface BuildOptions extends CommandOptions {
  output?: string
  watch?: boolean
}

const buildCommand = createCommand<BuildOptions>({
  name: 'build',
  description: 'Build the project',
  arguments: '[source-dir]',
  options: [
    {
      flags: '-o, --output <dir>',
      description: 'Output directory',
      type: 'string',
    },
    {
      flags: '-w, --watch',
      description: 'Watch for changes',
      type: 'boolean',
    },
  ],
  examples: ['build src', 'build src -o dist', 'build --watch'],
  action: async (options, context) => {
    context.logger.info(`Building project...`)
    // Implementation
    return ok(undefined)
  },
})
```

#### Specialized Commands

##### `createGitHooksCommand()`

Creates a Git hooks management command.

```typescript
const createGitHooksCommand = (config?: GitHooksConfig): Command => {
```

##### `createFileProcessingCommand()`

Creates a command for file processing operations.

```typescript
function createFileProcessingCommand<T extends FileProcessingOptions>(
  config: FileProcessingConfig<T>
): Command
```

**Types**:

```typescript
interface FileProcessingOptions extends CommandOptions {
  readonly input?: string
  readonly output?: string
  readonly format?: string
}

interface FileProcessingContext {
  readonly inputPath: string
  readonly outputPath: string
  readonly format: string
}

interface FileProcessingConfig<T extends FileProcessingOptions> {
  readonly name: string
  readonly description: string
  readonly supportedFormats: string[]
  readonly action: (options: T, context: FileProcessingContext) => Promise<Result<void, CoreError>>
}
```

#### Command Validation

##### `validateCommandOption()`

Validates a single command option.

```typescript
const validateCommandOption = (option: CommandOption): Result<CommandOption, CoreError> => {
```

##### `validateCommandConfig()`

Validates command configuration.

```typescript
function validateCommandConfig<T>(config: CommandConfig<T>): Result<CommandConfig<T>, CoreError>
```

##### `validateCommandConfigWithCache()`

Validates command configuration with caching.

```typescript
function validateCommandConfigWithCache<T>(
  config: CommandConfig<T>
): Result<CommandConfig<T>, CoreError>
```

#### Command Performance

##### `processOptionWithCache()`

Processes command option with caching for performance.

```typescript
const processOptionWithCache = (option: CommandOption): Result<ProcessedOption, CoreError> => {
```

##### `processCommandOptionsWithCache()`

Processes all command options with caching.

```typescript
function processCommandOptionsWithCache(
  options: CommandOption[]
): Result<ProcessedOption[], CoreError>
```

#### Command Patterns

##### `executeInteractive()`

Executes command with interactive features.

```typescript
function executeInteractive<T>(
  action: CommandAction<T>,
  options: T & InteractiveCommandOptions,
  context: CommandContext
): Promise<Result<void, CoreError>>
```

**Types**:

```typescript
interface InteractiveCommandOptions {
  readonly interactive?: boolean
  readonly confirmAll?: boolean
  readonly skipPrompts?: boolean
}
```

##### `executeWithValidation()`

Executes command with comprehensive validation.

```typescript
function executeWithValidation<T>(
  action: CommandAction<T>,
  validator: CommandValidator<T>,
  options: T,
  context: CommandContext
): Promise<Result<void, CoreError>>
```

##### `executeFileSystemOperations()`

Executes filesystem operations safely.

```typescript
function executeFileSystemOperations(
  operations: FileSystemOperation[],
  context: CommandContext
): Promise<Result<void, CoreError>>
```

**Types**:

```typescript
interface FileSystemOperation {
  readonly type: 'read' | 'write' | 'copy' | 'move' | 'delete'
  readonly source?: string
  readonly target?: string
  readonly content?: string
  readonly options?: Record<string, any>
}
```

##### `executeSubprocess()`

Executes subprocess operations.

```typescript
function executeSubprocess(
  config: SubprocessConfig,
  context: CommandContext
): Promise<Result<string, CoreError>>
```

**Types**:

```typescript
interface SubprocessConfig {
  readonly command: string
  readonly args?: string[]
  readonly cwd?: string
  readonly env?: Record<string, string>
  readonly timeout?: number
}
```

##### `executeBatch()`

Executes multiple commands in batch.

```typescript
function executeBatch(
  commands: Command[],
  options: BatchOptions,
  context: CommandContext
): Promise<Result<void, CoreError>>
```

##### `executeWithConfiguration()`

Executes command with configuration management.

```typescript
function executeWithConfiguration<T>(
  action: CommandAction<T>,
  configOptions: ConfigurationOptions,
  options: T,
  context: CommandContext
): Promise<Result<void, CoreError>>
```

**Types**:

```typescript
interface ConfigurationOptions {
  readonly configPath?: string
  readonly schema?: any
  readonly validate?: boolean
  readonly merge?: boolean
}
```

##### `executeWithPhases()`

Executes multi-step transformation workflows.

```typescript
function executeWithPhases(
  phases: CommandPhase[],
  context: CommandContext
): Promise<Result<any, CoreError>>
```

##### `executeWithDryRun()`

Safe preview of file operations.

```typescript
function executeWithDryRun<T>(
  action: CommandAction<T>,
  options: T & { dryRun?: boolean },
  context: CommandContext
): Promise<Result<void, CoreError>>
```

##### `displaySummary()`

Formatted configuration/result display.

```typescript
const displaySummary = (data: Record<string, any>, options?: SummaryOptions): void => {
```

#### Command Builders

##### `commonOptions`

Common command options for reuse.

```typescript
const commonOptions: {
  verbose: CommandOption
  dryRun: CommandOption
  force: CommandOption
  quiet: CommandOption
  help: CommandOption
}
```

##### `defineOptions()`

Utility for defining command options.

```typescript
const defineOptions = (definitions: OptionDefinition[]): CommandOption[] => {
```

**Types**:

```typescript
interface OptionDefinition {
  readonly key: string
  readonly flags: string
  readonly description: string
  readonly type?: 'string' | 'boolean' | 'number'
  readonly default?: any
  readonly required?: boolean
}

type OptionsBuilder = {
  string: (flags: string, description: string, options?: OptionConfig) => OptionsBuilder
  boolean: (flags: string, description: string, options?: OptionConfig) => OptionsBuilder
  number: (flags: string, description: string, options?: OptionConfig) => OptionsBuilder
  build: () => CommandOption[]
}
```

### `@esteban-url/cli/prompts`

Interactive prompts for CLI applications.

```typescript
// Re-exports from @inquirer/prompts
export * from '@inquirer/prompts'
```

#### Helper Functions

##### `createConfirmationPrompt()`

Creates a confirmation prompt with optional details.

```typescript
function createConfirmationPrompt(
  message: string,
  details?: string[],
  defaultValue?: boolean
): () => Promise<boolean>
```

**Parameters**:

- `message` - The confirmation message
- `details` - Optional array of detail strings to display
- `defaultValue` - Default value (defaults to `true`)

**Returns**: Promise-returning function that shows confirmation prompt

##### `createDirectoryPrompt()`

Creates a directory path input prompt with validation.

```typescript
const createDirectoryPrompt = (message: string, defaultPath?: string): () => Promise<string> => {
```

**Parameters**:

- `message` - The input prompt message
- `defaultPath` - Optional default directory path

**Returns**: Promise-returning function that shows directory input prompt

### `@esteban-url/cli/testing`

Comprehensive testing utilities for CLI applications including command execution, interactive testing, assertions, and performance monitoring.

#### CLI Command Execution and Testing

##### `runCommand()`

Executes a command for testing.

```typescript
const runCommand = (command: Command, args: string[]): Promise<TestResult> => {
```

##### `createCommandTestRunner()`

Creates a command test runner.

```typescript
const createCommandTestRunner = (): CommandTestRunner => {
```

##### `runTestCommand()`

Runs a test command.

```typescript
const runTestCommand = (command: Command, args: string[]): Promise<TestResult> => {
```

##### `runTestCommandExpectSuccess()`

Runs a test command expecting success.

```typescript
const runTestCommandExpectSuccess = (command: Command, args: string[]): Promise<TestResult> => {
```

##### `runTestCommandExpectError()`

Runs a test command expecting an error.

```typescript
const runTestCommandExpectError = (command: Command, args: string[]): Promise<TestResult> => {
```

##### `getTestContext()`

Gets the current test context.

```typescript
const getTestContext = (): TestContext => {
```

##### `getTestFiles()`

Gets test files from context.

```typescript
const getTestFiles = (): Record<string, string> => {
```

##### `getTestLogs()`

Gets test logs from context.

```typescript
const getTestLogs = (): LogMessage[] => {
```

**Types**:

```typescript
interface CommandTestRunnerState {
  readonly commands: Command[]
  readonly context: TestContext
  readonly results: TestResult[]
}
```

#### CLI Testing Utilities

##### `createCLITestRunner()`

Creates a CLI test runner.

```typescript
const createCLITestRunner = (config: CLIConfig): CLITestRunner => {
```

##### `expectCLISnapshot()`

Asserts CLI output matches snapshot.

```typescript
const expectCLISnapshot = (result: TestResult, options?: CLISnapshotOptions): void => {
```

##### `createWorkflowTest()`

Creates a workflow test.

```typescript
const createWorkflowTest = (steps: WorkflowStep[]): WorkflowTest => {
```

##### `createCommandTestSuite()`

Creates a command test suite.

```typescript
const createCommandTestSuite = (cases: CommandTestCase[]): CommandTestSuite => {
```

##### `createInteractiveTest()`

Creates an interactive test.

```typescript
const createInteractiveTest = (steps: InteractiveTestStep[]): InteractiveTest => {
```

**Types**:

```typescript
interface CLISnapshotOptions {
  readonly updateSnapshots?: boolean
  readonly snapshotPath?: string
}

interface CLITestResult {
  readonly passed: boolean
  readonly error?: string
  readonly output: string
}

interface WorkflowStep {
  readonly name: string
  readonly command: Command
  readonly args: string[]
  readonly expectedOutput?: string | RegExp
}

interface CommandTestCase {
  readonly name: string
  readonly command: Command
  readonly args: string[]
  readonly expected: TestResult
}

interface InteractiveTestStep {
  readonly type: 'input' | 'expect' | 'wait'
  readonly value: string
  readonly timeout?: number
}
```

#### Interactive CLI Testing

##### `createInteractiveTestRunner()`

Creates an interactive test runner.

```typescript
const createInteractiveTestRunner = (config: InteractiveTestConfig): InteractiveTestRunner => {
```

##### `addResponse()`

Adds a response to interactive test.

```typescript
const addResponse = (runner: InteractiveTestRunner, response: PromptResponse): void => {
```

##### `addResponses()`

Adds multiple responses to interactive test.

```typescript
const addResponses = (runner: InteractiveTestRunner, responses: PromptResponse[]): void => {
```

##### `runInteractiveTestRunner()`

Runs an interactive test runner.

```typescript
const runInteractiveTestRunner = (runner: InteractiveTestRunner): Promise<InteractiveTestResult> => {
```

##### `runInteractiveTest()`

Runs an interactive test.

```typescript
const runInteractiveTest = (config: InteractiveTestConfig): Promise<InteractiveTestResult> => {
```

##### `sendInput()`

Sends input to interactive process.

```typescript
const sendInput = (process: ChildProcess, input: string): void => {
```

##### `sendRaw()`

Sends raw input to interactive process.

```typescript
const sendRaw = (process: ChildProcess, data: Buffer): void => {
```

##### `killProcess()`

Kills an interactive process.

```typescript
const killProcess = (process: ChildProcess): void => {
```

##### `createInteractiveTestHelper()`

Creates an interactive test helper.

```typescript
const createInteractiveTestHelper = (): InteractiveTestHelper => {
```

**Types**:

```typescript
interface InteractiveTestConfig {
  readonly command: Command
  readonly responses: PromptResponse[]
  readonly timeout?: number
}

interface PromptResponse {
  readonly prompt: string | RegExp
  readonly response: string
  readonly delay?: number
}

interface InteractiveTestResult {
  readonly success: boolean
  readonly output: string
  readonly error?: string
  readonly duration: number
}

interface InteractiveTestRunnerState {
  readonly config: InteractiveTestConfig
  readonly responses: PromptResponse[]
  readonly results: InteractiveTestResult[]
}
```

#### CLI Context and Mocking

##### `createTestContext()`

Creates a test context for CLI testing.

```typescript
const createTestContext = (options?: TestContextOptions): TestContext => {
```

##### `createTestContextWithFiles()`

Creates a test context with predefined files.

```typescript
function createTestContextWithFiles(
  files: Record<string, string>,
  options?: TestContextOptions
): TestContext
```

**Types**:

```typescript
interface TestContextOptions {
  readonly tmpDir?: string
  readonly fixtures?: Record<string, string>
  readonly verbose?: boolean
}
```

#### CLI-Specific Assertions

##### `expectResult()`

Asserts on a Result type.

```typescript
function expectResult<T, E>(result: Result<T, E>): ResultAssertion<T, E>
```

##### `expectError()`

Asserts that result is an error.

```typescript
function expectError<T, E>(result: Result<T, E>): void
```

##### `expectSuccess()`

Asserts that result is successful.

```typescript
function expectSuccess<T, E>(result: Result<T, E>): void
```

##### `expectFailure()`

Asserts that CLI execution failed.

```typescript
const expectFailure = (result: TestResult): void => {
```

##### `expectErrorCode()`

Asserts specific error code.

```typescript
const expectErrorCode = (error: CoreError, expectedCode: string): void => {
```

##### `expectErrorMessage()`

Asserts error message matches expected.

```typescript
const expectErrorMessage = (error: CoreError, expected: string | RegExp): void => {
```

#### CLI Performance Monitoring

##### `createPerformanceMonitorState()`

Creates performance monitor state.

```typescript
const createPerformanceMonitorState = (): PerformanceMonitorState => {
```

##### `monitorPerformance()`

Monitors performance of an operation.

```typescript
function monitorPerformance<T>(operation: () => Promise<T>): Promise<PerformanceResult<T>>
```

##### `getPerformanceReports()`

Gets performance reports.

```typescript
const getPerformanceReports = (): PerformanceReport[] => {
```

##### `getPerformanceSummary()`

Gets performance summary.

```typescript
const getPerformanceSummary = (): PerformanceSummary => {
```

##### `exportPerformanceReportsToJson()`

Exports performance reports to JSON.

```typescript
const exportPerformanceReportsToJson = (path: string): Promise<void> => {
```

##### `clearPerformanceReports()`

Clears performance reports.

```typescript
const clearPerformanceReports = (): void => {
```

##### `checkPerformanceThresholds()`

Checks performance against thresholds.

```typescript
const checkPerformanceThresholds = (thresholds: PerformanceThresholds): boolean => {
```

##### `withPerformanceMonitoring()`

Wraps operation with performance monitoring.

```typescript
function withPerformanceMonitoring<T>(operation: () => Promise<T>): Promise<PerformanceResult<T>>
```

##### `createCLIPerformanceMonitor()`

Creates a CLI performance monitor.

```typescript
const createCLIPerformanceMonitor = (): CLIPerformanceMonitor => {
```

**Types**:

```typescript
interface PerformanceMetrics {
  readonly duration: number
  readonly memoryUsage: NodeJS.MemoryUsage
  readonly cpuUsage?: NodeJS.CpuUsage
}

interface PerformanceReport {
  readonly operation: string
  readonly metrics: PerformanceMetrics
  readonly timestamp: Date
}

interface CLIPerformanceMonitorState {
  readonly reports: PerformanceReport[]
  readonly startTime: Date
}
```

### `@esteban-url/cli/utils`

CLI utility functions including logging, colors, spinners, package manager detection, options processing, and statistics.

#### Colors and Styling

```typescript
// Chalk utilities
const chalk: Chalk
const success: (text: string) => string
const error: (text: string) => string
const warning: (text: string) => string
const info: (text: string) => string
const muted: (text: string) => string
const bold: (text: string) => string
const dim: (text: string) => string
const italic: (text: string) => string
const underline: (text: string) => string
```

#### Spinners

##### `createSpinner()`

Creates a spinner for long operations.

```typescript
const createSpinner = (text: string, options?: SpinnerOptions): Spinner => {
```

##### `withSpinner()`

Wraps an operation with a spinner.

```typescript
function withSpinner<T>(text: string, operation: () => Promise<T>): Promise<T>
```

**Types**:

```typescript
interface Spinner {
  start(): void
  stop(): void
  succeed(text?: string): void
  fail(text?: string): void
  warn(text?: string): void
  info(text?: string): void
  setText(text: string): void
}

interface SpinnerOptions {
  readonly color?: string
  readonly spinner?: string
  readonly hideCursor?: boolean
}
```

#### Logging

##### `createDefaultLogger()`

Creates a default console logger.

```typescript
const createDefaultLogger = (verbose?: boolean): Logger => {
```

**Types**:

```typescript
interface Logger {
  info(message: string): void
  success(message: string): void
  warning(message: string): void
  error(message: string): void
  debug(message: string): void
}
```

#### Statistics

##### `createStats()`

Creates a statistics tracker.

```typescript
const createStats = (): StatsTracker => {
```

##### `updateStats()`

Updates statistics.

```typescript
const updateStats = (stats: StatsTracker, operation: string, duration: number): void => {
```

##### `getElapsedTime()`

Gets elapsed time from start time.

```typescript
const getElapsedTime = (startTime: number): number => {
```

##### `formatStats()`

Formats statistics for display.

```typescript
const formatStats = (stats: StatsTracker): string => {
```

**Types**:

```typescript
interface StatsTracker {
  readonly startTime: number
  readonly operations: Record<string, number>
  readonly totalDuration: number
}
```

#### Options Processing

##### `filterUndefined()`

Filters undefined values from options.

```typescript
function filterUndefined<T>(options: T): T
```

##### `mergeOptionsWithDefaults()`

Merges options with defaults.

```typescript
function mergeOptionsWithDefaults<T>(options: Partial<T>, defaults: T): T
```

##### `coerceOptionType()`

Coerces option to correct type.

```typescript
const coerceOptionType = (value: any, type: 'string' | 'boolean' | 'number'): any => {
```

##### `processCommandOptions()`

Processes command options.

```typescript
const processCommandOptions = (options: CommandOption[]): ProcessedOption[] => {
```

#### Package Manager Utilities

##### `detectPackageManager()`

Detects the package manager in use.

```typescript
const detectPackageManager = (options?: DetectOptions): Promise<PackageManager> => {
```

##### `getRunCommand()`

Gets the run command for a package manager.

```typescript
const getRunCommand = (packageManager: PackageManager): string => {
```

##### `execPackageManagerCommand()`

Executes a package manager command.

```typescript
function execPackageManagerCommand(
  packageManager: PackageManager,
  command: string,
  args?: string[]
): Promise<string>
```

##### `clearPackageManagerCache()`

Clears package manager cache.

```typescript
const clearPackageManagerCache = (): void => {
```

##### `createPackageManagerCache()`

Creates package manager cache.

```typescript
const createPackageManagerCache = (): PackageManagerCache => {
```

##### `parseSemVer()`

Parses semantic version string.

```typescript
const parseSemVer = (version: string): SemVer | null => {
```

##### `compareSemVer()`

Compares two semantic versions.

```typescript
const compareSemVer = (a: SemVer, b: SemVer): number => {
```

##### `isGreaterThanOrEqual()`

Checks if version is greater than or equal to another.

```typescript
const isGreaterThanOrEqual = (a: SemVer, b: SemVer): boolean => {
```

**Types**:

```typescript
interface SemVer {
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly prerelease?: string
}

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

interface DetectOptions {
  readonly cwd?: string
  readonly cache?: boolean
}

interface PackageManagerCache {
  readonly detectedManager?: PackageManager
  readonly detectionTime: number
}
```

### `@esteban-url/cli/progress`

Progress tracking for CLI operations with basic and enhanced progress trackers.

#### Basic Progress Tracking

##### `createProgressTracker()`

Creates a basic progress tracker.

```typescript
const createProgressTracker = (options: ProgressOptions): ProgressTracker => {
```

##### `updateProgress()`

Updates progress state.

```typescript
const updateProgress = (tracker: ProgressTracker, current: number): void => {
```

##### `calculateWeightedProgress()`

Calculates weighted progress across multiple operations.

```typescript
const calculateWeightedProgress = (steps: WeightedStep[]): number => {
```

**Types**:

```typescript
interface ProgressTracker {
  start(): void
  update(current: number): void
  increment(step?: number): void
  stop(): void
  setTitle(title: string): void
}

interface ProgressState {
  readonly current: number
  readonly total: number
  readonly percentage: number
  readonly isComplete: boolean
}

interface ProgressOptions {
  readonly total: number
  readonly title?: string
  readonly format?: string
  readonly showETA?: boolean
  readonly showPercentage?: boolean
}

interface WeightedStep {
  readonly weight: number
  readonly progress: number
}
```

#### Enhanced Progress Tracking

##### `createEnhancedProgressTracker()`

Creates an enhanced progress tracker with multiple bars and advanced features.

```typescript
const createEnhancedProgressTracker = (options: EnhancedProgressOptions): EnhancedProgressTracker => {
```

**Types**:

```typescript
interface EnhancedProgressTracker {
  start(): void
  updateBar(name: string, current: number): void
  incrementBar(name: string, step?: number): void
  completeBar(name: string): void
  stop(): void
  addBar(config: ProgressBarConfig): void
  removeBar(name: string): void
}

interface EnhancedProgressState {
  readonly bars: Record<string, ProgressState>
  readonly overall: ProgressState
}

interface EnhancedProgressOptions {
  readonly bars: ProgressBarConfig[]
  readonly concurrent?: boolean
  readonly autoStop?: boolean
}

interface EnhancedProgressStep {
  readonly name: string
  readonly progress: number
  readonly total: number
}

interface ProgressBarConfig {
  readonly name: string
  readonly total: number
  readonly format?: string
}
```

#### CLI Progress Re-exports

Advanced progress bar utilities from cli-progress library.

```typescript
// Re-exports from cli-progress
export { SingleBar, MultiBar, Presets } from 'cli-progress'
```

## Usage Examples

### Basic CLI Application

```typescript
import { createCLI, createCommand } from '@esteban-url/cli'
import type { CommandOptions } from '@esteban-url/cli/command'

interface BuildOptions extends CommandOptions {
  output?: string
  minify?: boolean
}

const buildCommand = createCommand<BuildOptions>({
  name: 'build',
  description: 'Build the project',
  options: [
    {
      flags: '-o, --output <dir>',
      description: 'Output directory',
      type: 'string',
      default: 'dist',
    },
    {
      flags: '--minify',
      description: 'Minify output',
      type: 'boolean',
      default: false,
    },
  ],
  action: async (options, context) => {
    context.logger.info(`Building to ${options.output}...`)

    if (options.minify) {
      context.logger.info('Minifying output...')
    }

    // Build implementation
    return ok(undefined)
  },
})

const cli = createCLI({
  name: 'my-build-tool',
  version: '1.0.0',
  description: 'A modern build tool',
  commands: [buildCommand],
})

// Run the CLI
await cli.run()
```

### Interactive Command

```typescript
import { createCommand, executeInteractive } from '@esteban-url/cli/command'
import { confirm, input } from '@esteban-url/cli/prompts'

const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application',
  action: async (options, context) => {
    return executeInteractive(
      async (opts, ctx) => {
        const environment = await input({
          message: 'Target environment:',
          default: 'staging',
        })

        const confirmed = await confirm({
          message: `Deploy to ${environment}?`,
          default: false,
        })

        if (!confirmed) {
          return ok(undefined)
        }

        ctx.logger.info(`Deploying to ${environment}...`)
        // Deploy implementation
        return ok(undefined)
      },
      options,
      context
    )
  },
})
```

### File Processing Command

```typescript
import { createFileProcessingCommand } from '@esteban-url/cli/command'

const convertCommand = createFileProcessingCommand({
  name: 'convert',
  description: 'Convert files between formats',
  supportedFormats: ['json', 'yaml', 'toml'],
  action: async (options, context) => {
    const { inputPath, outputPath, format } = context

    // Convert file implementation
    return ok(undefined)
  },
})
```

### Testing CLI Commands

```typescript
import {
  createTestContext,
  createTestCLI,
  expectSuccess,
  expectOutput,
} from '@esteban-url/cli/testing'

describe('build command', () => {
  let context: TestContext
  let testCLI: TestCLI

  beforeEach(async () => {
    context = createTestContext({
      fixtures: {
        'src/index.js': 'console.log("Hello")',
      },
    })

    testCLI = createTestCLI(
      {
        name: 'test-cli',
        version: '1.0.0',
        description: 'Test CLI',
        commands: [buildCommand],
      },
      context
    )
  })

  afterEach(async () => {
    await context.cleanup()
  })

  it('should build successfully', async () => {
    const result = await testCLI.run(['build', '--output', 'dist'])

    expectSuccess(result)
    expectOutput(result, /Building to dist/)
  })
})
```

### Progress Tracking

```typescript
import { createProgressTracker } from '@esteban-url/cli/progress'

const processFiles = async (files: string[]) => {
  const progress = createProgressTracker({
    total: files.length,
    title: 'Processing files',
    showETA: true,
  })

  progress.start()

  for (let i = 0; i < files.length; i++) {
    // Process file
    await processFile(files[i])
    progress.update(i + 1)
  }

  progress.stop()
}
```

## Related APIs

- [Core API Reference](../../../core/reference/api.md) - Result types and error handling
- [FileSystem API](../../../fs/reference/api.md) - File operations
- [Validation API](../../../validation/reference/api.md) - Data validation
- [Configuration API](../../../config/reference/api.md) - Configuration management
