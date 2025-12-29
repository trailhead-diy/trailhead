import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

/**
 * Configuration for interactive CLI test runner.
 *
 * Defines command execution parameters for testing prompt-based CLI commands.
 */
export interface InteractiveTestConfig {
  command: string
  args: string[]
  cwd?: string
  timeout?: number
  env?: Record<string, string>
}

/**
 * Defines an expected prompt and its automated response.
 *
 * Used to simulate user input in interactive CLI tests.
 */
export interface PromptResponse {
  /** Prompt text or pattern to match */
  prompt: string | RegExp
  /** Text to send as response when prompt is matched */
  response: string
  /** Delay in ms before sending response (default: 100) */
  delay?: number
}

/**
 * Result of an interactive test execution.
 *
 * Contains captured output and exit status.
 */
export interface InteractiveTestResult {
  /** Process exit code (null if killed) */
  exitCode: number | null
  /** Captured standard output */
  stdout: string
  /** Captured standard error */
  stderr: string
  /** Total execution time in milliseconds */
  duration: number
}

/**
 * Internal state for interactive test runner.
 *
 * Tracks configuration, responses, and execution state.
 */
export interface InteractiveTestRunnerState {
  readonly config: InteractiveTestConfig
  readonly responses: PromptResponse[]
  readonly child: ChildProcess | null
  readonly stdout: string
  readonly stderr: string
  readonly startTime: number
  readonly currentResponseIndex: number
  readonly eventEmitter: EventEmitter
}

/**
 * Create interactive test runner state.
 *
 * Initializes a new test runner with configuration but no responses.
 *
 * @param config - Test runner configuration
 * @returns Initial test runner state
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
  }
}

/**
 * Add an expected prompt and response pair.
 *
 * Returns new state with the response added to the queue.
 *
 * @param state - Current test runner state
 * @param prompt - Text or pattern to match in output
 * @param response - Response to send when matched
 * @param delay - Delay in ms before sending response (default: 100)
 * @returns New state with response added
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
  }
}

/**
 * Add multiple prompt/response pairs at once.
 *
 * Convenience function for setting up multiple expected prompts.
 *
 * @param state - Current test runner state
 * @param responses - Array of prompt/response pairs
 * @returns New state with all responses added
 */
export function addResponses(
  state: InteractiveTestRunnerState,
  responses: Array<{
    prompt: string | RegExp
    response: string
    delay?: number
  }>
): InteractiveTestRunnerState {
  return {
    ...state,
    responses: [...state.responses, ...responses.map((r) => ({ delay: 100, ...r }))],
  }
}

/**
 * Execute the interactive test and collect results.
 *
 * Spawns the configured command, monitors output for prompts,
 * and sends responses automatically. Returns when process exits.
 *
 * @param state - Test runner state with configured responses
 * @returns Test result with captured output and exit code
 * @throws {Error} If process creation fails or timeout is exceeded
 */
export async function runInteractiveTestRunner(
  state: InteractiveTestRunnerState
): Promise<InteractiveTestResult> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const child = spawn(state.config.command, state.config.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: state.config.cwd || process.cwd(),
      env: { ...process.env, ...state.config.env },
    })

    if (!child.stdout || !child.stderr || !child.stdin) {
      reject(new Error('Failed to create child process streams'))
      return
    }

    let stdout = ''
    let stderr = ''
    let currentResponseIndex = 0

    // Set up timeout
    const timeout = state.config.timeout || 30000
    const timeoutHandle = setTimeout(() => {
      cleanup(child)
      reject(new Error(`Test timed out after ${timeout}ms`))
    }, timeout)

    // Process output and respond to prompts
    const processOutput = (text: string): void => {
      if (currentResponseIndex >= state.responses.length) {
        return
      }

      const response = state.responses[currentResponseIndex]
      const matches =
        typeof response.prompt === 'string'
          ? text.includes(response.prompt)
          : response.prompt.test(text)

      if (matches) {
        setTimeout(() => {
          if (child?.stdin) {
            child.stdin.write(response.response + '\n')
            state.eventEmitter.emit('response', response.prompt, response.response)
          }
        }, response.delay)

        currentResponseIndex++
      }
    }

    // Capture output
    child.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      stdout += text
      state.eventEmitter.emit('stdout', text)
      processOutput(text)
    })

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      stderr += text
      state.eventEmitter.emit('stderr', text)
    })

    child.on('close', (code: number | null) => {
      clearTimeout(timeoutHandle)

      resolve({
        exitCode: code,
        stdout,
        stderr,
        duration: Date.now() - startTime,
      })
    })

    child.on('error', (error: Error) => {
      clearTimeout(timeoutHandle)
      cleanup(child)
      reject(error)
    })
  })
}

/**
 * Send input to the running process with newline.
 *
 * @param state - Test runner state with active process
 * @param input - Text to send (newline appended automatically)
 */
export function sendInput(state: InteractiveTestRunnerState, input: string): void {
  if (state.child?.stdin) {
    state.child.stdin.write(input + '\n')
  }
}

/**
 * Send raw input without newline.
 *
 * Use for special key sequences or partial input.
 *
 * @param state - Test runner state with active process
 * @param input - Raw text to send (no newline added)
 */
export function sendRaw(state: InteractiveTestRunnerState, input: string): void {
  if (state.child?.stdin) {
    state.child.stdin.write(input)
  }
}

/**
 * Clean up the child process
 */
function cleanup(child: ChildProcess): void {
  if (child) {
    child.kill('SIGTERM')
  }
}

/**
 * Force kill the running process.
 *
 * Sends SIGTERM to terminate the process immediately.
 *
 * @param state - Test runner state with active process
 */
export function killProcess(state: InteractiveTestRunnerState): void {
  if (state.child) {
    cleanup(state.child)
  }
}

/**
 * Create and run an interactive test in one call.
 *
 * Convenience function combining createInteractiveTestRunner,
 * addResponses, and runInteractiveTestRunner.
 *
 * @param config - Test runner configuration
 * @param responses - Array of prompt/response pairs
 * @returns Test result with captured output and exit code
 */
export async function runInteractiveTest(
  config: InteractiveTestConfig,
  responses: Array<{
    prompt: string | RegExp
    response: string
    delay?: number
  }>
): Promise<InteractiveTestResult> {
  let runner = createInteractiveTestRunner(config)
  runner = addResponses(runner, responses)
  return runInteractiveTestRunner(runner)
}

/**
 * Create a reusable test helper for interactive CLI commands.
 *
 * Provides convenience methods for common testing patterns like
 * text responses, regex matching, and default selections.
 *
 * @param baseCommand - Base command/script to test
 * @param baseCwd - Optional working directory for tests
 * @returns Helper object with test methods
 *
 * @example
 * ```typescript
 * const helper = createInteractiveTestHelper('./my-cli.ts');
 * const result = await helper.testWithResponses(
 *   ['init'],
 *   [{ prompt: 'Project name?', response: 'my-app' }]
 * );
 * ```
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
      )
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
      )
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
      }))

      return runInteractiveTest(
        {
          command: 'npx',
          args: ['tsx', baseCommand, ...args],
          cwd: baseCwd,
          timeout,
        },
        responses
      )
    },
  }
}
