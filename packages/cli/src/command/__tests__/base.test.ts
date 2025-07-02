import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import {
  createCommand,
  type CommandOptions,
  type CommandConfig,
} from '../base.js';
import type { CommandContext } from '../types.js';
import { Ok, Err } from '../../core/errors/index.js';

// Mock external dependencies
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Command Base', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createCommand', () => {
    interface TestOptions extends CommandOptions {
      output?: string;
      watch?: boolean;
    }

    it('should create command interface object with name and description', () => {
      const config: CommandConfig<TestOptions> = {
        name: 'test',
        description: 'Test command',
        action: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      const command = createCommand(config);

      expect(command).toEqual({
        name: 'test',
        description: 'Test command',
        options: undefined,
        execute: expect.any(Function),
      });
    });

    it('should include options when specified', () => {
      const config: CommandConfig<TestOptions> = {
        name: 'process',
        description: 'Process files',
        options: [
          {
            flags: '--output <dir>',
            description: 'Output directory',
            default: 'dist',
          },
        ],
        action: vi.fn().mockResolvedValue(Ok(undefined)),
      };

      const command = createCommand(config);
      
      expect(command.options).toEqual([
        {
          flags: '--output <dir>',
          description: 'Output directory',
          default: 'dist',
        },
      ]);
    });

    it('should execute action function', async () => {
      const mockAction = vi.fn().mockResolvedValue(Ok(undefined));
      const config: CommandConfig<TestOptions> = {
        name: 'test',
        description: 'Test command',
        action: mockAction,
      };

      const command = createCommand(config);
      const mockOptions = { verbose: false };
      const mockContext = {
        projectRoot: '/test',
        logger: { info: vi.fn() },
        verbose: false,
        fs: {},
        args: [],
      } as any;

      await command.execute(mockOptions, mockContext);

      expect(mockAction).toHaveBeenCalledWith(mockOptions, mockContext);
    });
  });








});