import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeInteractiveCommand,
  executeWithValidation,
  executeFileSystemOperations,
  executeSubprocess,
  executeBatch,
  executeWithConfiguration,
  type InteractiveCommandOptions,
  type ValidationRule,
  type FileSystemOperation,
  type SubprocessConfig,
  type ConfigurationOptions,
} from '../patterns.js';
import type { CommandContext } from '../types.js';
import { Ok, Err } from '../../core/errors/index.js';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('Command Patterns', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = {
      projectRoot: '/test',
      logger: {
        info: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      } as any,
      verbose: false,
      fs: {} as any,
      args: [],
    };
    vi.clearAllMocks();
  });

  describe('executeInteractiveCommand', () => {
    interface TestOptions extends InteractiveCommandOptions {
      name?: string;
      value?: number;
    }

    it('should execute without prompts when not in interactive mode', async () => {
      const options: TestOptions = { name: 'test', value: 42 };
      const promptFn = vi.fn().mockResolvedValue({});
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeInteractiveCommand(
        options,
        promptFn,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(promptFn).not.toHaveBeenCalled();
      expect(executeFn).toHaveBeenCalledWith(options);
    });

    it('should run prompts in interactive mode', async () => {
      const options: TestOptions = {
        interactive: true,
        name: 'test',
      };
      const promptFn = vi.fn().mockResolvedValue({ value: 100 });
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeInteractiveCommand(
        options,
        promptFn,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(promptFn).toHaveBeenCalled();
      expect(executeFn).toHaveBeenCalledWith({
        interactive: true,
        name: 'test', // CLI option takes precedence
        value: 100, // From prompts
      });
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Running in interactive mode...',
      );
    });

    it('should skip prompts when skipPrompts is true', async () => {
      const options: TestOptions = {
        interactive: true,
        skipPrompts: true,
        name: 'test',
      };
      const promptFn = vi.fn().mockResolvedValue({ value: 100 });
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeInteractiveCommand(
        options,
        promptFn,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(promptFn).not.toHaveBeenCalled();
      expect(executeFn).toHaveBeenCalledWith(options);
    });

    it('should handle prompt errors', async () => {
      const options: TestOptions = { interactive: true };
      const promptFn = vi.fn().mockRejectedValue(new Error('Prompt failed'));
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeInteractiveCommand(
        options,
        promptFn,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROMPT_ERROR');
      expect(result.error?.message).toBe('Interactive prompts failed');
      expect(executeFn).not.toHaveBeenCalled();
    });

    it('should merge prompt results with CLI options, prioritizing CLI', async () => {
      const options: TestOptions = {
        interactive: true,
        name: 'from-cli',
        value: 42,
      };
      const promptFn = vi.fn().mockResolvedValue({
        name: 'from-prompt',
        value: 100,
        extra: 'additional',
      });
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      await executeInteractiveCommand(
        options,
        promptFn,
        executeFn,
        mockContext,
      );

      expect(executeFn).toHaveBeenCalledWith({
        interactive: true,
        name: 'from-cli', // CLI takes precedence
        value: 42, // CLI takes precedence
        extra: 'additional', // From prompt
      });
    });
  });

  describe('executeWithValidation', () => {
    it('should execute successfully when all validations pass', async () => {
      const data = { name: 'test', value: 42 };
      const rules: ValidationRule<typeof data>[] = [
        {
          name: 'name-required',
          validate: (d) =>
            d.name
              ? Ok(d)
              : Err({ code: 'VALIDATION_ERROR', message: 'Name required' }),
        },
        {
          name: 'value-positive',
          validate: (d) =>
            d.value > 0
              ? Ok(d)
              : Err({
                  code: 'VALIDATION_ERROR',
                  message: 'Value must be positive',
                }),
        },
      ];
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeWithValidation(
        data,
        rules,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(executeFn).toHaveBeenCalledWith(data);
      expect(mockContext.logger.debug).toHaveBeenCalledWith(
        'All validations passed',
      );
    });

    it('should fail on first validation error', async () => {
      const data = { name: '', value: 42 };
      const rules: ValidationRule<typeof data>[] = [
        {
          name: 'name-required',
          validate: (d) =>
            d.name
              ? Ok(d)
              : Err({ code: 'VALIDATION_ERROR', message: 'Name required' }),
        },
        {
          name: 'value-positive',
          validate: (d) =>
            d.value > 0
              ? Ok(d)
              : Err({
                  code: 'VALIDATION_ERROR',
                  message: 'Value must be positive',
                }),
        },
      ];
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeWithValidation(
        data,
        rules,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Name required');
      expect(executeFn).not.toHaveBeenCalled();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        'Validation failed: name-required',
      );
    });

    it('should transform data through validation rules', async () => {
      const data = { name: 'test', value: 42 };
      const rules: ValidationRule<typeof data>[] = [
        {
          name: 'normalize-name',
          validate: (d) => Ok({ ...d, name: d.name.toUpperCase() }),
        },
      ];
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeWithValidation(
        data,
        rules,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(executeFn).toHaveBeenCalledWith({ name: 'TEST', value: 42 });
    });
  });

  describe('executeFileSystemOperations', () => {
    it('should execute all operations successfully', async () => {
      const operations: FileSystemOperation<string>[] = [
        {
          name: 'operation1',
          execute: vi.fn().mockResolvedValue(Ok('result1')),
        },
        {
          name: 'operation2',
          execute: vi.fn().mockResolvedValue(Ok('result2')),
        },
      ];

      const result = await executeFileSystemOperations(operations, mockContext);

      expect(result.success).toBe(true);
      expect(result.value).toEqual(['result1', 'result2']);
      expect(operations[0].execute).toHaveBeenCalled();
      expect(operations[1].execute).toHaveBeenCalled();
    });

    it('should rollback completed operations on failure', async () => {
      const rollback1 = vi.fn().mockResolvedValue(undefined);
      const operations: FileSystemOperation<string>[] = [
        {
          name: 'operation1',
          execute: vi.fn().mockResolvedValue(Ok('result1')),
          rollback: rollback1,
        },
        {
          name: 'operation2',
          execute: vi
            .fn()
            .mockResolvedValue(
              Err({ code: 'OP_ERROR', message: 'Operation 2 failed' }),
            ),
        },
      ];

      const result = await executeFileSystemOperations(operations, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Operation 2 failed');
      expect(rollback1).toHaveBeenCalled();
      expect(mockContext.logger.warning).toHaveBeenCalledWith(
        'Rolling back changes...',
      );
      expect(mockContext.logger.debug).toHaveBeenCalledWith(
        'Rolled back: operation1',
      );
    });

    it('should handle rollback failures gracefully', async () => {
      const rollback1 = vi.fn().mockRejectedValue(new Error('Rollback failed'));
      const operations: FileSystemOperation<string>[] = [
        {
          name: 'operation1',
          execute: vi.fn().mockResolvedValue(Ok('result1')),
          rollback: rollback1,
        },
        {
          name: 'operation2',
          execute: vi
            .fn()
            .mockResolvedValue(
              Err({ code: 'OP_ERROR', message: 'Operation 2 failed' }),
            ),
        },
      ];

      const result = await executeFileSystemOperations(operations, mockContext);

      expect(result.success).toBe(false);
      expect(rollback1).toHaveBeenCalled();
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        'Failed to rollback: operation1',
      );
    });

    it('should handle operation exceptions', async () => {
      const operations: FileSystemOperation<string>[] = [
        {
          name: 'operation1',
          execute: vi.fn().mockRejectedValue(new Error('Unexpected error')),
        },
      ];

      const result = await executeFileSystemOperations(operations, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('OPERATION_ERROR');
      expect(result.error?.message).toBe('Operation failed: operation1');
    });
  });

  describe('executeSubprocess', () => {
    it('should execute subprocess successfully', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('output data'));
            }
          }),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        }),
      };

      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const config: SubprocessConfig = {
        command: 'echo',
        args: ['hello'],
      };

      const result = await executeSubprocess(config, mockContext);

      expect(result.success).toBe(true);
      expect(result.value).toBe('output data');
      expect(spawn).toHaveBeenCalledWith('echo', ['hello'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe',
      });
    });

    it('should handle subprocess failure with exit code', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('error output'));
            }
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        }),
      };

      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const config: SubprocessConfig = {
        command: 'false',
        args: [],
      };

      const result = await executeSubprocess(config, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SUBPROCESS_EXIT_ERROR');
      expect(result.error?.message).toBe('false exited with code 1');
      expect(result.error?.details).toBe('error output');
    });

    it('should handle spawn errors', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        }),
      };

      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const config: SubprocessConfig = {
        command: 'nonexistent',
        args: [],
      };

      const result = await executeSubprocess(config, mockContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SUBPROCESS_ERROR');
      expect(result.error?.message).toBe('Failed to spawn nonexistent');
    });

    it('should use verbose mode for stdio inheritance', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
      };

      const { spawn } = await import('child_process');
      vi.mocked(spawn).mockReturnValue(mockChild as any);

      const verboseContext = { ...mockContext, verbose: true };
      const config: SubprocessConfig = {
        command: 'echo',
        args: ['hello'],
      };

      await executeSubprocess(config, verboseContext);

      expect(spawn).toHaveBeenCalledWith('echo', ['hello'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });
    });
  });

  describe('executeBatch', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi
        .fn()
        .mockImplementation((item: number) => Promise.resolve(Ok(item * 2)));
      const onProgress = vi.fn();

      const result = await executeBatch(
        items,
        processor,
        { batchSize: 2, onProgress },
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(5);
      expect(onProgress).toHaveBeenCalledWith(2, 5);
      expect(onProgress).toHaveBeenCalledWith(4, 5);
      expect(onProgress).toHaveBeenCalledWith(5, 5);
    });

    it('should stop on first failure', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn().mockImplementation((item: number) => {
        if (item === 3) {
          return Promise.resolve(
            Err({ code: 'PROCESS_ERROR', message: 'Failed on item 3' }),
          );
        }
        return Promise.resolve(Ok(item * 2));
      });

      const result = await executeBatch(
        items,
        processor,
        { batchSize: 2 },
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed on item 3');
      expect(processor).toHaveBeenCalledTimes(4); // First batch (1,2) + second batch (3,4) - stops at failure
    });
  });

  describe('executeWithConfiguration', () => {
    interface TestOptions extends ConfigurationOptions {
      name?: string;
    }

    it('should load and execute with configuration', async () => {
      const options: TestOptions = { name: 'test' };
      const loadConfigFn = vi
        .fn()
        .mockResolvedValue(Ok({ setting1: 'value1', setting2: 42 }));
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeWithConfiguration(
        options,
        loadConfigFn,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(loadConfigFn).toHaveBeenCalledWith(undefined);
      expect(executeFn).toHaveBeenCalledWith({
        setting1: 'value1',
        setting2: 42,
      });
    });

    it('should load configuration from specified path', async () => {
      const options: TestOptions = { config: '/path/to/config.json' };
      const loadConfigFn = vi.fn().mockResolvedValue(Ok({ setting: 'value' }));
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      await executeWithConfiguration(
        options,
        loadConfigFn,
        executeFn,
        mockContext,
      );

      expect(loadConfigFn).toHaveBeenCalledWith('/path/to/config.json');
    });

    it('should apply overrides to configuration', async () => {
      const options: TestOptions = {
        override: { setting1: 'overridden', newSetting: 'added' },
      };
      const loadConfigFn = vi
        .fn()
        .mockResolvedValue(Ok({ setting1: 'original', setting2: 42 }));
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      await executeWithConfiguration(
        options,
        loadConfigFn,
        executeFn,
        mockContext,
      );

      expect(executeFn).toHaveBeenCalledWith({
        setting1: 'overridden', // Overridden
        setting2: 42, // Original
        newSetting: 'added', // Added
      });
    });

    it('should handle preset application', async () => {
      const options: TestOptions = { preset: 'development' };
      const loadConfigFn = vi.fn().mockResolvedValue(Ok({ setting: 'value' }));
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      await executeWithConfiguration(
        options,
        loadConfigFn,
        executeFn,
        mockContext,
      );

      expect(mockContext.logger.debug).toHaveBeenCalledWith(
        'Applying preset: development',
      );
      expect(executeFn).toHaveBeenCalledWith({ setting: 'value' });
    });

    it('should handle configuration load failure', async () => {
      const options: TestOptions = {};
      const loadConfigFn = vi
        .fn()
        .mockResolvedValue(
          Err({ code: 'CONFIG_ERROR', message: 'Config file not found' }),
        );
      const executeFn = vi.fn().mockResolvedValue(Ok('success'));

      const result = await executeWithConfiguration(
        options,
        loadConfigFn,
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Config file not found');
      expect(executeFn).not.toHaveBeenCalled();
    });
  });
});
