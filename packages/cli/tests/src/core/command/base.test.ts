import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCommand,
  executeWithPhases,
  executeWithProgress,
  executeWithDryRun,
  displaySummary,
  type CommandConfig,
  type CommandContext,
  type CommandPhase,
} from '@trailhead/cli/command';
import { Ok, Err } from '@trailhead/cli';
import { createError } from '@trailhead/cli/core';

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('Command Execution', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = {
      projectRoot: '/test/project',
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
            defaultValue: 'default',
          },
        ],
        examples: ['test-command --test value'],
      };

      const command = createCommand(config, { projectRoot: '/test' });

      expect(command.name()).toBe('test-command');
      expect(command.description()).toBe('Test command');
      expect(command.options).toHaveLength(2);
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
        'Failed at phase: Phase 2',
      );
      expect(phases[2].execute).not.toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress spinner during execution', async () => {
      const mockTask = vi.fn().mockResolvedValue(Ok('result'));

      const mockSpinner = {
        start: vi.fn().mockReturnThis(),
        succeed: vi.fn(),
        fail: vi.fn(),
      };

      vi.doMock('ora', () => ({
        default: () => mockSpinner,
      }));

      const result = await executeWithProgress(
        mockTask,
        'Processing...',
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('result');
      expect(mockTask).toHaveBeenCalled();

      vi.doUnmock('ora');
    });

    it('should handle task failures gracefully', async () => {
      const mockTask = vi.fn().mockRejectedValue(new Error('Task failed'));

      const mockSpinner = {
        start: vi.fn().mockReturnThis(),
        succeed: vi.fn(),
        fail: vi.fn(),
      };

      vi.doMock('ora', () => ({
        default: () => mockSpinner,
      }));

      const result = await executeWithProgress(
        mockTask,
        'Processing...',
        mockContext,
      );

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('EXECUTION_ERROR');
      expect(result.error.message).toBe('Task failed');

      vi.doUnmock('ora');
    });
  });

  describe('Dry Run Mode', () => {
    it('should execute dry run task when enabled', async () => {
      const realTask = vi.fn().mockResolvedValue(Ok('real result'));
      const dryRunTask = vi.fn().mockResolvedValue(Ok('dry run result'));

      const result = await executeWithDryRun(
        realTask,
        dryRunTask,
        true,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('dry run result');
      expect(mockContext.logger.warning).toHaveBeenCalledWith(
        'DRY RUN MODE - No changes will be made',
      );
      expect(realTask).not.toHaveBeenCalled();
      expect(dryRunTask).toHaveBeenCalled();
    });

    it('should execute real task when dry run is disabled', async () => {
      const realTask = vi.fn().mockResolvedValue(Ok('real result'));
      const dryRunTask = vi.fn().mockResolvedValue(Ok('dry run result'));

      const result = await executeWithDryRun(
        realTask,
        dryRunTask,
        false,
        mockContext,
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('real result');
      expect(realTask).toHaveBeenCalled();
      expect(dryRunTask).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should display summary with formatted output', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      displaySummary(
        'Installation Summary',
        [
          { label: 'Files installed', value: 42 },
          { label: 'Themes available', value: 8 },
          { label: 'Framework', value: 'Next.js' },
        ],
        mockContext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installation Summary'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Files installed'),
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('42'));

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling in Commands', () => {
    it('should handle unexpected errors in command action', async () => {
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

      const command = createCommand(config, { projectRoot: '/test' });

      await expect(async () => {
        await command.parseAsync(['node', 'test', 'error-command']);
      }).rejects.toThrow('process.exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error'),
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);

      processExitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
