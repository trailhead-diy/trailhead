import { describe, it, expect, vi } from 'vitest';
import {
  createCLITestRunner,
  expectCLISnapshot,
  createWorkflowTest,
  createCommandTestSuite,
  createInteractiveTest,
} from '../cli-testing.js';
import { createCommand } from '../../command/index.js';
import { ok, err } from 'neverthrow';

describe('CLI Testing Utilities', () => {
  describe('CLI Test Runner', () => {
    it('should capture stdout and stderr', async () => {
      const command = createCommand({
        name: 'test',
        description: 'Test command',
        action: async () => {
          console.log('Success message');
          console.error('Warning message');
          return ok(undefined);
        },
      });

      const runner = createCLITestRunner();
      const result = await runner.run(command);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Success message');
      expect(result.stderr).toContain('Warning message');
    });

    it('should handle command errors', async () => {
      const command = createCommand({
        name: 'failing-test',
        description: 'Test command that fails',
        action: async () => {
          return err(new Error('Command failed'));
        },
      });

      const runner = createCLITestRunner();
      const result = await runner.run(command);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Command failed');
    });

    it('should strip ANSI codes when configured', async () => {
      const command = createCommand({
        name: 'colored-test',
        description: 'Test command with colors',
        action: async () => {
          console.log('\x1b[32mGreen text\x1b[0m');
          return ok(undefined);
        },
      });

      const runner = createCLITestRunner({ stripAnsi: true });
      const result = await runner.run(command);

      expect(result.stdout).toBe('Green text');
      expect(result.stdout).not.toContain('\x1b[32m');
    });

    it('should normalize output when configured', async () => {
      const command = createCommand({
        name: 'normalize-test',
        description: 'Test command with normalization',
        action: async () => {
          console.log('  Indented text  ');
          return ok(undefined);
        },
      });

      const runner = createCLITestRunner({
        normalizeOutput: output => output.trim().replace(/\s+/g, ' '),
      });
      const result = await runner.run(command);

      expect(result.stdout).toBe('Indented text');
    });
  });

  describe('CLI Snapshot Testing', () => {
    it('should create snapshots for CLI output', async () => {
      const command = createCommand({
        name: 'snapshot-test',
        description: 'Test command for snapshot',
        action: async () => {
          console.log('Snapshot test output');
          return ok(undefined);
        },
      });

      const runner = createCLITestRunner();
      const result = await runner.run(command);

      // This would typically use jest snapshots, but for this test we'll just verify structure
      expect(result.stdout).toBe('Snapshot test output');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);

      // Test the snapshot function doesn't throw
      expect(() => expectCLISnapshot(result, 'snapshot-test')).not.toThrow();
    });
  });

  describe('Workflow Testing', () => {
    it('should create workflow test builder function', () => {
      const step1Command = createCommand({
        name: 'step1',
        description: 'First step',
        action: async () => {
          console.log('Step 1 completed');
          return ok(undefined);
        },
      });

      const workflowBuilder = createWorkflowTest('Multi-step CLI Workflow', [
        {
          name: 'Initialize project',
          command: step1Command,
        },
      ]);

      expect(typeof workflowBuilder).toBe('function');
    });
  });

  describe('Command Test Suite Builder', () => {
    it('should create command test suite builder function', () => {
      const echoCommand = createCommand({
        name: 'echo',
        description: 'Echo command',
        options: [{ name: 'message', type: 'string', description: 'Message to echo' }],
        action: async options => {
          console.log(options.message || 'No message provided');
          return ok(undefined);
        },
      });

      const suiteBuilder = createCommandTestSuite('echo', echoCommand, [
        {
          name: 'should echo provided message',
          options: { message: 'Hello World' },
          shouldSucceed: true,
          expectedOutput: 'Hello World',
        },
      ]);

      expect(typeof suiteBuilder).toBe('function');
    });
  });

  describe('Interactive Testing', () => {
    it('should mock interactive prompts', async () => {
      // Mock the prompts module
      const mockInput = vi.fn();
      const mockConfirm = vi.fn();

      vi.doMock('@inquirer/prompts', () => ({
        input: mockInput,
        confirm: mockConfirm,
      }));

      mockInput.mockResolvedValueOnce('test input');
      mockConfirm.mockResolvedValueOnce(true);

      const interactiveCommand = createCommand({
        name: 'interactive',
        description: 'Interactive command',
        action: async () => {
          const { input, confirm } = await import('@inquirer/prompts');

          const userInput = await input({ message: 'Enter something:' });
          const userConfirmation = await confirm({ message: 'Continue?' });

          console.log(`Input: ${userInput}, Confirmed: ${userConfirmation}`);
          return ok(undefined);
        },
      });

      const runner = createCLITestRunner();
      const result = await runner.run(interactiveCommand);

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Input: test input');
      expect(result.stdout).toContain('Confirmed: true');

      expect(mockInput).toHaveBeenCalledWith({ message: 'Enter something:' });
      expect(mockConfirm).toHaveBeenCalledWith({ message: 'Continue?' });

      vi.doUnmock('@inquirer/prompts');
    });

    // This test demonstrates the interactive test helper structure
    it('should create interactive test helper', () => {
      const interactiveCommand = createCommand({
        name: 'interactive-test',
        description: 'Interactive test command',
        action: async () => ok(undefined),
      });

      // Test that the helper function exists and can be called
      expect(() =>
        createInteractiveTest('interactive workflow', interactiveCommand, [
          { prompt: 'Enter name:', response: 'John' },
          { prompt: 'Confirm?', response: 'true' },
        ])
      ).not.toThrow();
    });
  });

  describe('CLI Output Processing', () => {
    it('should handle process.exit calls', async () => {
      const exitCommand = createCommand({
        name: 'exit-test',
        description: 'Command that calls process.exit',
        action: async () => {
          process.exit(2);
          return ok(undefined); // This line should not be reached
        },
      });

      const runner = createCLITestRunner();
      const result = await runner.run(exitCommand);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(2);
    });

    it('should handle thrown errors', async () => {
      const throwingCommand = createCommand({
        name: 'throwing-test',
        description: 'Command that throws an error',
        action: async () => {
          throw new Error('Unexpected error');
        },
      });

      const runner = createCLITestRunner();
      const result = await runner.run(throwingCommand);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unexpected error');
    });

    it('should restore console methods after test', async () => {
      const originalLog = console.log;
      const originalError = console.error;
      const originalExit = process.exit;

      const command = createCommand({
        name: 'restore-test',
        description: 'Test console restoration',
        action: async () => {
          console.log('Test message');
          return ok(undefined);
        },
      });

      const runner = createCLITestRunner();
      await runner.run(command);

      // Verify methods are restored
      expect(console.log).toBe(originalLog);
      expect(console.error).toBe(originalError);
      expect(process.exit).toBe(originalExit);
    });
  });

  describe('CLI Test Runner Configuration', () => {
    it('should configure trimWhitespace option', async () => {
      const command = createCommand({
        name: 'whitespace-test',
        description: 'Test whitespace handling',
        action: async () => {
          console.log('  \n  Message with whitespace  \n  ');
          return ok(undefined);
        },
      });

      const trimRunner = createCLITestRunner({ trimWhitespace: true });
      const noTrimRunner = createCLITestRunner({ trimWhitespace: false });

      const trimResult = await trimRunner.run(command);
      const noTrimResult = await noTrimRunner.run(command);

      expect(trimResult.stdout).toBe('Message with whitespace');
      expect(noTrimResult.stdout).toContain('\n');
      expect(noTrimResult.stdout).toContain('  ');
    });
  });
});
