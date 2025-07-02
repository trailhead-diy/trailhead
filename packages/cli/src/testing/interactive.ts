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

export class InteractiveTestRunner extends EventEmitter {
  private child: ChildProcess | null = null;
  private stdout = '';
  private stderr = '';
  private startTime = 0;
  private responses: PromptResponse[] = [];
  private currentResponseIndex = 0;

  constructor(private config: InteractiveTestConfig) {
    super();
  }

  /**
   * Add expected prompt and response pairs
   */
  addResponse(prompt: string | RegExp, response: string, delay = 100): this {
    this.responses.push({ prompt, response, delay });
    return this;
  }

  /**
   * Add multiple responses at once
   */
  addResponses(responses: Array<{ prompt: string | RegExp; response: string; delay?: number }>): this {
    this.responses.push(...responses.map(r => ({ delay: 100, ...r })));
    return this;
  }

  /**
   * Run the interactive test
   */
  async run(): Promise<InteractiveTestResult> {
    return new Promise((resolve, reject) => {
      this.startTime = Date.now();
      
      this.child = spawn(this.config.command, this.config.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.config.cwd || process.cwd(),
        env: { ...process.env, ...this.config.env },
      });

      if (!this.child.stdout || !this.child.stderr || !this.child.stdin) {
        reject(new Error('Failed to create child process streams'));
        return;
      }

      // Set up timeout
      const timeout = this.config.timeout || 30000;
      const timeoutHandle = setTimeout(() => {
        this.cleanup();
        reject(new Error(`Test timed out after ${timeout}ms`));
      }, timeout);

      // Capture output
      this.child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        this.stdout += text;
        this.emit('stdout', text);
        this.processOutput(text);
      });

      this.child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        this.stderr += text;
        this.emit('stderr', text);
      });

      this.child.on('close', (code: number | null) => {
        clearTimeout(timeoutHandle);
        
        resolve({
          exitCode: code,
          stdout: this.stdout,
          stderr: this.stderr,
          duration: Date.now() - this.startTime,
        });
      });

      this.child.on('error', (error: Error) => {
        clearTimeout(timeoutHandle);
        this.cleanup();
        reject(error);
      });
    });
  }

  /**
   * Process output and respond to prompts
   */
  private processOutput(text: string): void {
    if (this.currentResponseIndex >= this.responses.length) {
      return;
    }

    const response = this.responses[this.currentResponseIndex];
    const matches = typeof response.prompt === 'string' 
      ? text.includes(response.prompt)
      : response.prompt.test(text);

    if (matches) {
      setTimeout(() => {
        if (this.child?.stdin) {
          this.child.stdin.write(response.response + '\n');
          this.emit('response', response.prompt, response.response);
        }
      }, response.delay);
      
      this.currentResponseIndex++;
    }
  }

  /**
   * Send input to the process
   */
  sendInput(input: string): void {
    if (this.child?.stdin) {
      this.child.stdin.write(input + '\n');
    }
  }

  /**
   * Send raw input without newline
   */
  sendRaw(input: string): void {
    if (this.child?.stdin) {
      this.child.stdin.write(input);
    }
  }

  /**
   * Clean up the child process
   */
  private cleanup(): void {
    if (this.child) {
      this.child.kill('SIGTERM');
      this.child = null;
    }
  }

  /**
   * Force kill the process
   */
  kill(): void {
    this.cleanup();
  }
}

/**
 * Helper function to create and run an interactive test
 */
export async function runInteractiveTest(
  config: InteractiveTestConfig,
  responses: Array<{ prompt: string | RegExp; response: string; delay?: number }>
): Promise<InteractiveTestResult> {
  const runner = new InteractiveTestRunner(config);
  runner.addResponses(responses);
  return runner.run();
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
        { command: 'npx', args: ['tsx', baseCommand, ...args], cwd: baseCwd, timeout },
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
        { command: 'npx', args: ['tsx', baseCommand, ...args], cwd: baseCwd, timeout },
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
      const responses = Array.from({ length: promptCount }, (_, i) => ({
        prompt: new RegExp('.+[?:]\\s*$', 'm'), // Match lines ending with ? or :
        response: '', // Just press enter for defaults
      }));

      return runInteractiveTest(
        { command: 'npx', args: ['tsx', baseCommand, ...args], cwd: baseCwd, timeout },
        responses
      );
    },
  };
}