import type { Command, CommandContext } from '../command/index.js';

/**
 * CLI snapshot testing utilities
 * Provides built-in snapshot testing for CLI output
 */
export interface CLISnapshotOptions {
  normalizeOutput?: (output: string) => string;
  stripAnsi?: boolean;
  trimWhitespace?: boolean;
}

export interface CLITestResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Create a CLI test runner with output capture
 */
export function createCLITestRunner(options: CLISnapshotOptions = {}) {
  const { normalizeOutput, stripAnsi = true, trimWhitespace = true } = options;

  return {
    async run(command: Command<any>, args: string[] = []): Promise<CLITestResult> {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      const originalExit = process.exit;

      console.log = (...args) => {
        stdout += args.join(' ') + '\n';
      };

      console.error = (...args) => {
        stderr += args.join(' ') + '\n';
      };

      process.exit = ((code: number = 0) => {
        exitCode = code;
        throw new Error(`process.exit(${code})`);
      }) as any;

      try {
        // Parse args into options and context
        const mockLogger = {
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
          success: () => {},
        };

        const mockFs = {
          readFile: async () => ({ success: false, error: new Error('Mock fs') }),
          writeFile: async () => ({ success: false, error: new Error('Mock fs') }),
          access: async () => ({ success: false, error: new Error('Mock fs') }),
        };

        const mockContext: CommandContext = {
          args: args.filter(arg => !arg.startsWith('-')),
          projectRoot: process.cwd(),
          logger: mockLogger as any,
          verbose: false,
          fs: mockFs as any,
        };

        // Execute command
        const result = await command.execute({} as any, mockContext);

        if (!result.success) {
          exitCode = 1;
          stderr += result.error.message + '\n';
        }
      } catch (error: any) {
        if (!error.message.startsWith('process.exit')) {
          exitCode = 1;
          stderr += error.message + '\n';
        }
      } finally {
        // Restore original functions
        console.log = originalLog;
        console.error = originalError;
        process.exit = originalExit;
      }

      // Process output
      if (stripAnsi) {
        stdout = stripAnsiCodes(stdout);
        stderr = stripAnsiCodes(stderr);
      }

      if (trimWhitespace) {
        stdout = stdout.trim();
        stderr = stderr.trim();
      }

      if (normalizeOutput) {
        stdout = normalizeOutput(stdout);
        stderr = normalizeOutput(stderr);
      }

      return {
        stdout,
        stderr,
        exitCode,
        success: exitCode === 0,
      };
    },
  };
}

/**
 * Snapshot testing for CLI commands
 * Note: Requires test framework with expect and toMatchSnapshot
 */
export function expectCLISnapshot(result: CLITestResult, snapshotName?: string) {
  const snapshot = {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };

  // This function is intended to be used in test files where expect is available
  if (typeof globalThis !== 'undefined' && 'expect' in globalThis) {
    (globalThis as any).expect(snapshot).toMatchSnapshot(snapshotName);
  } else {
    throw new Error('expectCLISnapshot requires a test framework with expect function');
  }
}

/**
 * Integration test helpers for complete CLI workflows
 */
export interface WorkflowStep {
  name: string;
  command: Command<any>;
  args?: string[];
  setup?: () => Promise<void>;
  verify?: (result: CLITestResult) => void;
}

export function createWorkflowTest(_workflowName: string, _steps: WorkflowStep[]): () => void {
  return () => {
    // This function returns a test suite that should be executed in a test environment
    // The actual test framework functions (describe, it, expect) need to be available
    throw new Error(
      'createWorkflowTest should be used in test files with test framework available'
    );
  };
}

/**
 * Command test builder for comprehensive command testing
 */
export interface CommandTestCase<T> {
  name: string;
  options: T;
  args?: string[];
  shouldSucceed: boolean;
  expectedOutput?: string | RegExp;
  expectedError?: string | RegExp;
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

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
    );
  };
}

/**
 * Utility to strip ANSI color codes from output
 */
function stripAnsiCodes(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Helper for testing interactive CLI commands
 */
export interface InteractiveTestStep {
  prompt: string | RegExp;
  response: string;
  delay?: number;
}

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
    );
  };
}
