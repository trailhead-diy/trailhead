import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Interactive CLI test runner for testing prompt-based commands
 */
export interface InteractiveTestConfig {
  command: string;
  args: string[];
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface PromptResponse {
  prompt: string | RegExp;
  response: string;
  delay?: number;
}

export interface InteractiveTestResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  duration: number;
}

/**
 * Interactive test runner state
 */
export interface InteractiveTestRunnerState {
  readonly config: InteractiveTestConfig;
  readonly responses: PromptResponse[];
  readonly child: ChildProcess | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly startTime: number;
  readonly currentResponseIndex: number;
  readonly eventEmitter: EventEmitter;
}

/**
 * Create interactive test runner state
 */
export function createInteractiveTestRunner(
  config: InteractiveTestConfig
): InteractiveTestRunnerState {
  return {
    config,
    responses: [],
    child: null,
    stdout: '',
    stderr: '',
    startTime: 0,
    currentResponseIndex: 0,
    eventEmitter: new EventEmitter(),
  };
}

/**
 * Add expected prompt and response pairs
 */
export function addResponse(
  state: InteractiveTestRunnerState,
  prompt: string | RegExp,
  response: string,
  delay = 100
): InteractiveTestRunnerState {
  return {
    ...state,
    responses: [...state.responses, { prompt, response, delay }],
  };
}

/**
 * Add multiple responses at once
 */
export function addResponses(
  state: InteractiveTestRunnerState,
  responses: Array<{
    prompt: string | RegExp;
    response: string;
    delay?: number;
  }>
): InteractiveTestRunnerState {
  return {
    ...state,
    responses: [...state.responses, ...responses.map(r => ({ delay: 100, ...r }))],
  };
}

/**
 * Run the interactive test
 */
export async function runInteractiveTestRunner(
  state: InteractiveTestRunnerState
): Promise<InteractiveTestResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const child = spawn(state.config.command, state.config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: state.config.cwd || process.cwd(),
      env: { ...process.env, ...state.config.env },
    });

    if (!child.stdout || !child.stderr || !child.stdin) {
      reject(new Error('Failed to create child process streams'));
      return;
    }

    let stdout = '';
    let stderr = '';
    let currentResponseIndex = 0;

    // Set up timeout
    const timeout = state.config.timeout || 30000;
    const timeoutHandle = setTimeout(() => {
      cleanup(child);
      reject(new Error(`Test timed out after ${timeout}ms`));
    }, timeout);

    // Process output and respond to prompts
    const processOutput = (text: string): void => {
      if (currentResponseIndex >= state.responses.length) {
        return;
      }

      const response = state.responses[currentResponseIndex];
      const matches =
        typeof response.prompt === 'string'
          ? text.includes(response.prompt)
          : response.prompt.test(text);

      if (matches) {
        setTimeout(() => {
          if (child?.stdin) {
            child.stdin.write(response.response + '\n');
            state.eventEmitter.emit('response', response.prompt, response.response);
          }
        }, response.delay);

        currentResponseIndex++;
      }
    };

    // Capture output
    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      state.eventEmitter.emit('stdout', text);
      processOutput(text);
    });

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      state.eventEmitter.emit('stderr', text);
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timeoutHandle);

      resolve({
        exitCode: code,
        stdout,
        stderr,
        duration: Date.now() - startTime,
      });
    });

    child.on('error', (error: Error) => {
      clearTimeout(timeoutHandle);
      cleanup(child);
      reject(error);
    });
  });
}

/**
 * Send input to the process
 */
export function sendInput(state: InteractiveTestRunnerState, input: string): void {
  if (state.child?.stdin) {
    state.child.stdin.write(input + '\n');
  }
}

/**
 * Send raw input without newline
 */
export function sendRaw(state: InteractiveTestRunnerState, input: string): void {
  if (state.child?.stdin) {
    state.child.stdin.write(input);
  }
}

/**
 * Clean up the child process
 */
function cleanup(child: ChildProcess): void {
  if (child) {
    child.kill('SIGTERM');
  }
}

/**
 * Force kill the process
 */
export function killProcess(state: InteractiveTestRunnerState): void {
  if (state.child) {
    cleanup(state.child);
  }
}

/**
 * Helper function to create and run an interactive test
 */
export async function runInteractiveTest(
  config: InteractiveTestConfig,
  responses: Array<{
    prompt: string | RegExp;
    response: string;
    delay?: number;
  }>
): Promise<InteractiveTestResult> {
  let runner = createInteractiveTestRunner(config);
  runner = addResponses(runner, responses);
  return runInteractiveTestRunner(runner);
}

/**
 * Create a test helper for common interactive patterns
 */
export function createInteractiveTestHelper(baseCommand: string, baseCwd?: string) {
  return {
    /**
     * Test a command with simple text responses
     */
    async testWithResponses(
      args: string[],
      responses: Array<{ prompt: string; response: string }>,
      timeout = 15000
    ): Promise<InteractiveTestResult> {
      return runInteractiveTest(
        {
          command: 'npx',
          args: ['tsx', baseCommand, ...args],
          cwd: baseCwd,
          timeout,
        },
        responses
      );
    },

    /**
     * Test a command with regex prompt matching
     */
    async testWithRegexResponses(
      args: string[],
      responses: Array<{ prompt: RegExp; response: string }>,
      timeout = 15000
    ): Promise<InteractiveTestResult> {
      return runInteractiveTest(
        {
          command: 'npx',
          args: ['tsx', baseCommand, ...args],
          cwd: baseCwd,
          timeout,
        },
        responses
      );
    },

    /**
     * Test command with default selections (just press enter)
     */
    async testWithDefaults(
      args: string[],
      promptCount: number,
      timeout = 15000
    ): Promise<InteractiveTestResult> {
      const responses = Array.from({ length: promptCount }, () => ({
        prompt: new RegExp('.+[?:]\\s*$', 'm'), // Match lines ending with ? or :
        response: '', // Just press enter for defaults
      }));

      return runInteractiveTest(
        {
          command: 'npx',
          args: ['tsx', baseCommand, ...args],
          cwd: baseCwd,
          timeout,
        },
        responses
      );
    },
  };
}
