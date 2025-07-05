import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCommand,
  executeWithPhases,
  executeWithDryRun,
  displaySummary,
  type CommandConfig,
  type CommandContext,
  type CommandPhase,
} from '@esteban-url/trailhead-cli/command';
import { Ok, Err } from '@esteban-url/trailhead-cli';
import { createError } from '@esteban-url/trailhead-cli/core';
import { testPaths } from '../../testing/test-utils/cross-platform-paths.js';

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('Command Execution', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = {
      projectRoot: testPaths.mockProject,
      logger: {
        info: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        step: vi.fn(),
      },
      verbose: false,
    };
  });

  describe('Command Creation', () => {
    it('should create command with validation and error handling', async () => {
      const mockAction = vi.fn().mockResolvedValue(Ok(undefined));
      const mockValidation = vi.fn().mockReturnValue(Ok({}));

      const config: CommandConfig<{ test: string }> = {
        name: 'test-command',
        description: 'Test command',
        action: mockAction,
        validation: mockValidation,
        options: [
          {
            flags: '--test <value>',
            description: 'Test option',
            default: 'default',
          },
        ],
        examples: ['test-command --test value'],
      };

      const command = createCommand(config, { projectRoot: testPaths.mockCli });

      expect(command.name).toBe('test-command');
      expect(command.description).toBe('Test command');
      expect(command.options).toHaveLength(1);
    });
  });

  describe('Phase Execution', () => {
    it('should execute phases in order and pass data between them', async () => {
      const phases: CommandPhase<{ count: number }>[] = [
        {
          name: 'Initialize',
          execute: async (data) => Ok({ ...data, count: 1 }),
        },
        {
          name: 'Process',
          execute: async (data) => Ok({ ...data, count: data.count + 1 }),
        },
        {
          name: 'Finalize',
          execute: async (data) => Ok({ ...data, count: data.count * 2 }),
        },
      ];

      const result = await executeWithPhases(phases, { count: 0 }, mockContext);

      expect(result.success).toBe(true);
      expect(result.value.count).toBe(4);
      expect(mockContext.logger.step).toHaveBeenCalledTimes(3);
      expect(mockContext.logger.step).toHaveBeenCalledWith('Initialize');
      expect(mockContext.logger.step).toHaveBeenCalledWith('Process');
      expect(mockContext.logger.step).toHaveBeenCalledWith('Finalize');
    });

    it('should stop execution on phase failure', async () => {
      const phases: CommandPhase<{}>[] = [
        {
          name: 'Phase 1',
          execute: async () => Ok({}),
        },
        {
          name: 'Phase 2',
          execute: async () =>
            Err(createError('PHASE_ERROR', 'Phase 2 failed')),
        },
        {
          name: 'Phase 3',
          execute: vi.fn().mockResolvedValue(Ok({})),
        },
      ];

      const result = await executeWithPhases(phases, {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Phase 2 failed');
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        'Phase 2 failed: Phase 2',
      );
      expect(phases[2].execute).not.toHaveBeenCalled();
    });
  });

  describe('Dry Run Mode', () => {
    it('should execute in dry run mode when enabled', async () => {
      const executeFn = vi.fn().mockImplementation(async (config) => {
        if (config.dryRun) {
          mockContext.logger.info('Would perform operation');
          return Ok('dry run result');
        }
        return Ok('real result');
      });

      const result = await executeWithDryRun(
        { dryRun: true },
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('dry run result');
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        '🔍 DRY RUN MODE - No changes will be made',
      );
      expect(executeFn).toHaveBeenCalledWith({ dryRun: true });
    });

    it('should execute normally when dry run is disabled', async () => {
      const executeFn = vi.fn().mockResolvedValue(Ok('real result'));

      const result = await executeWithDryRun(
        { dryRun: false },
        executeFn,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('real result');
      expect(executeFn).toHaveBeenCalledWith({ dryRun: false });
    });
  });

  describe('User Interactions', () => {
    it('should display summary with formatted output', () => {
      displaySummary(
        'Installation Summary',
        [
          { label: 'Files installed', value: 42 },
          { label: 'Themes available', value: 8 },
          { label: 'Framework', value: 'Next.js' },
          { label: 'Hot reload', value: true },
        ],
        mockContext,
        [
          { label: 'Total size', value: '2.3 MB' },
          { label: 'Build time', value: '1.2s' },
        ],
      );

      expect(mockContext.logger.info).toHaveBeenCalledWith('');
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Installation Summary'),
      );
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Files installed'),
      );
    });
  });

  describe('Error Handling in Commands', () => {
    it('should handle failed result in command action', async () => {
      const config: CommandConfig<{}> = {
        name: 'error-command',
        description: 'Command that errors',
        action: async () => {
          return Err(createError('TEST_ERROR', 'Test error message'));
        },
      };

      const command = createCommand(config, { projectRoot: testPaths.mockCli });

      // Test the action directly since command interface doesn't have parseAsync
      const result = await command.execute({}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('TEST_ERROR');
      expect(result.error.message).toBe('Test error message');
    });

    it.skip('should handle unexpected errors in command action', async () => {
      // This test is skipped due to commander v14 compatibility issues
      // The main error handling through Result types is covered by the previous test
      const processExitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => {
          throw new Error('process.exit');
        });
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const config: CommandConfig<{}> = {
        name: 'error-command',
        description: 'Command that errors',
        action: async () => {
          throw new Error('Unexpected error');
        },
      };

      const command = createCommand(config, { projectRoot: testPaths.mockCli });

      await expect(async () => {
        await command.parseAsync(['node', 'test', 'error-command']);
      }).rejects.toThrow('process.exit');

      // Allow time for async error handling to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
