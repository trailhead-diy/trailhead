import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCLI } from '../cli.js';
import { createCommand } from '../command/index.js';
import { Ok } from '../core/errors/index.js';

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create and run CLI with createCommand', async () => {
    const mockAction = vi.fn().mockResolvedValue(Ok(undefined));
    
    const testCommand = createCommand({
      name: 'test',
      description: 'Test command',
      action: mockAction,
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [testCommand],
    });

    // This should not throw the TypeError that was reported, but will call process.exit for --help
    await expect(async () => {
      await cli.run(['node', 'test-cli', '--help']);
    }).rejects.toThrow('process.exit called');
    
    // Verify that help was shown (process.exit was called with 0)
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should register command properties correctly', () => {
    const testCommand = createCommand({
      name: 'test',
      description: 'Test command description',
      options: [
        {
          flags: '--output <dir>',
          description: 'Output directory',
          default: 'dist',
        },
      ],
      action: vi.fn().mockResolvedValue(Ok(undefined)),
    });

    // Verify command structure matches expected interface
    expect(testCommand).toEqual({
      name: 'test',
      description: 'Test command description',
      options: [
        {
          flags: '--output <dir>',
          description: 'Output directory',
          default: 'dist',
        },
      ],
      execute: expect.any(Function),
    });
  });

  it('should execute command action when called', async () => {
    const mockAction = vi.fn().mockResolvedValue(Ok(undefined));
    
    const testCommand = createCommand({
      name: 'test',
      description: 'Test command',
      action: mockAction,
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [testCommand],
    });

    await cli.run(['node', 'test-cli', 'test']);
    expect(mockAction).toHaveBeenCalled();
  });

  it('should handle command options correctly', async () => {
    const mockAction = vi.fn().mockResolvedValue(Ok(undefined));
    
    const testCommand = createCommand({
      name: 'build',
      description: 'Build command',
      options: [
        {
          name: 'output',
          description: 'Output directory',
          default: 'dist',
          type: 'string',
        },
      ],
      action: mockAction,
    });

    const cli = createCLI({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
      commands: [testCommand],
    });

    await cli.run(['node', 'test-cli', 'build']);
    
    // Verify action was called with correct options
    expect(mockAction).toHaveBeenCalledWith(
      expect.objectContaining({
        output: 'dist',
        verbose: false,
      }),
      expect.objectContaining({
        projectRoot: expect.any(String),
        logger: expect.any(Object),
        verbose: false,
        fs: expect.any(Object),
        args: [],
      })
    );
  });

  describe('validation and error handling', () => {
    it('should throw error for invalid command configuration', () => {
      expect(() => createCommand({
        name: '',
        description: 'Test command',
        action: async () => ({ success: true, value: undefined }),
      })).toThrow('Invalid command configuration');
    });

    it('should throw error for invalid option configuration', () => {
      expect(() => createCommand({
        name: 'test',
        description: 'Test command',
        options: [
          {
            description: 'Invalid option without name or flags',
          },
        ],
        action: async () => ({ success: true, value: undefined }),
      })).toThrow('Invalid command configuration');
    });

    it('should accept valid command with proper options', () => {
      expect(() => createCommand({
        name: 'test',
        description: 'Test command',
        options: [
          {
            name: 'output',
            description: 'Output directory',
            type: 'string',
          },
        ],
        action: async () => ({ success: true, value: undefined }),
      })).not.toThrow();
    });
  });
});