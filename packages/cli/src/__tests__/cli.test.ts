import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCLI } from '../cli.js';
import type { Command, CommandContext } from '../command/types.js';
import { Ok, Err } from '../core/errors/index.js';

// Mock process.exit to prevent test suite from exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock process.cwd
const mockCwd = vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createCLI', () => {
    it('should create CLI with basic configuration', () => {
      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
      });

      expect(cli).toBeDefined();
      expect(typeof cli.run).toBe('function');
    });

    it('should create CLI with initial commands', () => {
      const mockCommand: Command = {
        name: 'test',
        description: 'Test command',
        execute: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      expect(cli).toBeDefined();
    });
  });

  describe('run', () => {
    it('should execute simple command successfully', async () => {
      const mockExecute = vi.fn().mockResolvedValue(Ok(undefined));
      const mockCommand: Command = {
        name: 'build',
        description: 'Build command',
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'build']);

      expect(mockExecute).toHaveBeenCalledTimes(1);

      const [options, context] = mockExecute.mock.calls[0];
      expect(options.verbose).toBe(false);
      expect(context.projectRoot).toBe('/test/project');
      expect(context.verbose).toBe(false);
      expect(context.args).toEqual([]);
      expect(context.logger).toBeDefined();
      expect(context.fs).toBeDefined();
    });

    it('should handle command with options', async () => {
      const mockExecute = vi.fn().mockResolvedValue(Ok(undefined));
      const mockCommand: Command = {
        name: 'build',
        description: 'Build command',
        options: [
          {
            name: 'output',
            alias: 'o',
            description: 'Output directory',
            type: 'string',
          },
          {
            name: 'watch',
            alias: 'w',
            description: 'Watch mode',
            type: 'boolean',
          },
        ],
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'build', '--output', 'dist', '--watch']);

      const [options, context] = mockExecute.mock.calls[0];
      expect(options.output).toBe('dist');
      expect(options.watch).toBe(true);
      expect(options.verbose).toBe(false);
      expect(context.projectRoot).toBe('/test/project');
      expect(context.verbose).toBe(false);
      expect(context.args).toEqual([]);
    });

    it('should handle required options', async () => {
      const mockExecute = vi.fn().mockResolvedValue(Ok(undefined));
      const mockCommand: Command = {
        name: 'deploy',
        description: 'Deploy command',
        options: [
          {
            name: 'target',
            alias: 't',
            description: 'Deployment target',
            type: 'string',
            required: true,
          },
        ],
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'deploy', '--target', 'production']);

      const [options, context] = mockExecute.mock.calls[0];
      expect(options.target).toBe('production');
      expect(options.verbose).toBe(false);
      expect(context).toBeDefined();
    });

    it('should handle verbose flag', async () => {
      const mockExecute = vi.fn().mockResolvedValue(Ok(undefined));
      const mockCommand: Command = {
        name: 'build',
        description: 'Build command',
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'build', '--verbose']);

      const [options, context] = mockExecute.mock.calls[0];
      expect(options.verbose).toBe(true);
      expect(context.projectRoot).toBe('/test/project');
      expect(context.verbose).toBe(true);
      expect(context.args).toEqual([]);
    });

    it('should handle positional arguments', async () => {
      const mockExecute = vi.fn().mockResolvedValue(Ok(undefined));
      const mockCommand: Command = {
        name: 'process',
        description: 'Process files',
        arguments: [
          {
            name: 'files',
            description: 'Files to process',
            variadic: true,
          },
        ],
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'process', 'file1.txt', 'file2.txt']);

      const [options, context] = mockExecute.mock.calls[0];
      expect(options).toBeDefined();
      expect(context.args).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should provide correct command context', async () => {
      let capturedContext: CommandContext | undefined;
      const mockExecute = vi.fn().mockImplementation((options, context) => {
        capturedContext = context;
        return Promise.resolve(Ok(undefined));
      });

      const mockCommand: Command = {
        name: 'test',
        description: 'Test command',
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'test']);

      expect(capturedContext).toBeDefined();
      expect(capturedContext!.projectRoot).toBe('/test/project');
      expect(capturedContext!.logger).toBeDefined();
      expect(capturedContext!.fs).toBeDefined();
      expect(capturedContext!.verbose).toBe(false);
      expect(capturedContext!.args).toEqual([]);
    });

    it('should exit with code 1 on command error', async () => {
      const mockExecute = vi.fn().mockResolvedValue(
        Err({
          code: 'TEST_ERROR',
          message: 'Test error occurred',
          suggestion: 'Try again',
        }),
      );

      const mockCommand: Command = {
        name: 'fail',
        description: 'Failing command',
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await expect(async () => {
        await cli.run(['node', 'cli.js', 'fail']);
      }).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit with code 1 on command exception', async () => {
      const mockExecute = vi
        .fn()
        .mockRejectedValue(new Error('Unexpected error'));

      const mockCommand: Command = {
        name: 'crash',
        description: 'Crashing command',
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await expect(async () => {
        await cli.run(['node', 'cli.js', 'crash']);
      }).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error exceptions', async () => {
      const mockExecute = vi.fn().mockRejectedValue('String error');

      const mockCommand: Command = {
        name: 'weird-fail',
        description: 'Weird failing command',
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await expect(async () => {
        await cli.run(['node', 'cli.js', 'weird-fail']);
      }).rejects.toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle command with default option values', async () => {
      const mockExecute = vi.fn().mockResolvedValue(Ok(undefined));
      const mockCommand: Command = {
        name: 'build',
        description: 'Build command',
        options: [
          {
            name: 'output',
            description: 'Output directory',
            type: 'string',
            default: 'dist',
          },
          {
            name: 'minify',
            description: 'Minify output',
            type: 'boolean',
            default: false,
          },
        ],
        execute: mockExecute,
      };

      const cli = createCLI({
        name: 'test-cli',
        version: '1.0.0',
        description: 'A test CLI',
        commands: [mockCommand],
      });

      await cli.run(['node', 'cli.js', 'build']);

      const [options, context] = mockExecute.mock.calls[0];
      expect(options.output).toBe('dist');
      expect(options.minify).toBe(false);
      expect(options.verbose).toBe(false);
      expect(context).toBeDefined();
    });
  });
});
