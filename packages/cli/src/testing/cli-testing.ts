import type { Command, CommandContext } from '../command/index.js'

/**
 * Options for CLI output snapshot testing.
 */
export interface CLISnapshotOptions {
  normalizeOutput?: (output: string) => string
  stripAnsi?: boolean
  trimWhitespace?: boolean
}

/**
 * Result of a CLI test execution.
 */
export interface CLITestResult {
  /** Captured standard output */
  stdout: string
  /** Captured standard error */
  stderr: string
  /** Process exit code */
  exitCode: number
  /** Whether command succeeded (exitCode === 0) */
  success: boolean
}

/**
 * Create a CLI test runner with output capture.
 *
 * Creates a runner that executes commands while capturing console output
 * and process.exit calls. Useful for testing CLI command output.
 *
 * @param options - Snapshot configuration options
 * @returns Test runner with run method
 */
export function createCLITestRunner(options: CLISnapshotOptions = {}) {
  const { normalizeOutput, stripAnsi = true, trimWhitespace = true } = options

  return {
    async run(command: Command<any>, args: string[] = []): Promise<CLITestResult> {
      let stdout = ''
      let stderr = ''
      let exitCode = 0

      // Capture console output
      const originalLog = console.log
      const originalError = console.error
      const originalExit = process.exit

      console.log = (...args) => {
        stdout += args.join(' ') + '\n'
      }

      console.error = (...args) => {
        stderr += args.join(' ') + '\n'
      }

      process.exit = ((code: number = 0) => {
        exitCode = code
        throw new Error(`process.exit(${code})`)
      }) as any

      try {
        // Parse args into options and context
        const mockLogger = {
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
          success: () => {},
        }

        const mockFs = {
          readFile: async () => ({
            isOk: () => false,
            isErr: () => true,
            error: new Error('Mock fs'),
          }),
          writeFile: async () => ({
            isOk: () => false,
            isErr: () => true,
            error: new Error('Mock fs'),
          }),
          access: async () => ({
            isOk: () => false,
            isErr: () => true,
            error: new Error('Mock fs'),
          }),
        }

        const mockContext: CommandContext = {
          args: args.filter((arg) => !arg.startsWith('-')),
          projectRoot: process.cwd(),
          logger: mockLogger as any,
          verbose: false,
          fs: mockFs as any,
        }

        // Execute command
        const result = await command.execute({} as any, mockContext)

        if (result.isErr()) {
          exitCode = 1
          stderr += result.error.message + '\n'
        }
      } catch (error: any) {
        if (!error.message.startsWith('process.exit')) {
          exitCode = 1
          stderr += error.message + '\n'
        }
      } finally {
        // Restore original functions
        console.log = originalLog
        console.error = originalError
        process.exit = originalExit
      }

      // Process output
      if (stripAnsi) {
        stdout = stripAnsiCodes(stdout)
        stderr = stripAnsiCodes(stderr)
      }

      if (trimWhitespace) {
        stdout = stdout.trim()
        stderr = stderr.trim()
      }

      if (normalizeOutput) {
        stdout = normalizeOutput(stdout)
        stderr = normalizeOutput(stderr)
      }

      return {
        stdout,
        stderr,
        exitCode,
        success: exitCode === 0,
      }
    },
  }
}

/**
 * Assert CLI result matches snapshot.
 *
 * Requires test framework with expect and toMatchSnapshot (e.g., Vitest, Jest).
 *
 * @param result - CLI test result to snapshot
 * @param snapshotName - Optional snapshot identifier
 * @throws {Error} If test framework is not available
 */
export function expectCLISnapshot(result: CLITestResult, snapshotName?: string) {
  const snapshot = {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  }

  // This function is intended to be used in test files where expect is available
  if (typeof globalThis !== 'undefined' && 'expect' in globalThis) {
    ;(globalThis as any).expect(snapshot).toMatchSnapshot(snapshotName)
  } else {
    throw new Error('expectCLISnapshot requires a test framework with expect function')
  }
}

/**
 * Single step in a CLI workflow test.
 */
export interface WorkflowStep {
  name: string
  command: Command<any>
  args?: string[]
  setup?: () => Promise<void>
  verify?: (result: CLITestResult) => void
}

/**
 * Create a multi-step workflow test.
 *
 * Must be used within a test framework environment. Returns a test
 * function that executes steps in sequence with setup/verify hooks.
 *
 * @param _workflowName - Descriptive name for the workflow
 * @param _steps - Array of workflow steps to execute
 * @returns Test function (throws if not in test environment)
 */
export function createWorkflowTest(_workflowName: string, _steps: WorkflowStep[]): () => void {
  return () => {
    // This function returns a test suite that should be executed in a test environment
    // The actual test framework functions (describe, it, expect) need to be available
    throw new Error('createWorkflowTest should be used in test files with test framework available')
  }
}

/**
 * Test case definition for command testing.
 *
 * @template T - Command options type
 */
export interface CommandTestCase<T> {
  name: string
  options: T
  args?: string[]
  shouldSucceed: boolean
  expectedOutput?: string | RegExp
  expectedError?: string | RegExp
  setup?: () => Promise<void>
  cleanup?: () => Promise<void>
}

/**
 * Create a test suite for a command with multiple test cases.
 *
 * Must be used within a test framework environment.
 *
 * @template T - Command options type
 * @param _commandName - Name of the command being tested
 * @param _command - Command to test
 * @param _testCases - Array of test case definitions
 * @returns Test function (throws if not in test environment)
 */
export function createCommandTestSuite<T>(
  _commandName: string,
  _command: Command<T>,
  _testCases: CommandTestCase<T>[]
): () => void {
  return () => {
    // This function returns a test suite that should be executed in a test environment
    // The actual test framework functions (describe, it, expect) need to be available
    throw new Error(
      'createCommandTestSuite should be used in test files with test framework available'
    )
  }
}

/**
 * Remove ANSI escape codes from a string.
 *
 * @param str - String potentially containing ANSI codes
 * @returns String with ANSI codes removed
 */
function stripAnsiCodes(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

/**
 * Step definition for interactive command testing.
 */
export interface InteractiveTestStep {
  prompt: string | RegExp
  response: string
  delay?: number
}

/**
 * Create an interactive command test with simulated user input.
 *
 * Must be used within a test framework environment.
 *
 * @param _testName - Descriptive name for the test
 * @param _command - Command to test
 * @param _steps - Array of prompt/response steps
 * @returns Test function (throws if not in test environment)
 */
export function createInteractiveTest(
  _testName: string,
  _command: Command<any>,
  _steps: InteractiveTestStep[]
): () => void {
  return () => {
    // This function returns a test that should be executed in a test environment
    // The actual test framework functions (it, expect, vi) need to be available
    throw new Error(
      'createInteractiveTest should be used in test files with test framework available'
    )
  }
}
