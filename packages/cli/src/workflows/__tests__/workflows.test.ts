import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock listr2 - must be hoisted
vi.mock('listr2', () => ({
  Listr: vi.fn().mockImplementation((tasks, options) => ({
    tasks,
    options,
    run: vi.fn().mockResolvedValue({}),
  })),
}));

import { createTaskList } from '../index.js';

describe('Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTaskList', () => {
    it('should create Listr instance with default options', async () => {
      const { Listr } = await import('listr2');
      const tasks = [{ title: 'Task 1', task: async () => 'result' }];

      createTaskList(tasks);

      expect(Listr).toHaveBeenCalledWith(tasks, {
        concurrent: false,
        exitOnError: true,
        rendererOptions: undefined,
      });
    });

    it('should create Listr instance with custom options', async () => {
      const { Listr } = await import('listr2');
      const tasks = [{ title: 'Task 1', task: async () => 'result' }];
      const options = {
        concurrent: true,
        exitOnError: false,
        rendererOptions: { collapse: false },
      };

      createTaskList(tasks, options);

      expect(Listr).toHaveBeenCalledWith(tasks, {
        concurrent: true,
        exitOnError: false,
        rendererOptions: { collapse: false },
      });
    });

    it('should handle empty task array', async () => {
      const { Listr } = await import('listr2');

      createTaskList([]);

      expect(Listr).toHaveBeenCalledWith([], {
        concurrent: false,
        exitOnError: true,
        rendererOptions: undefined,
      });
    });

    it('should pass through task functions correctly', async () => {
      const taskFn = vi.fn().mockResolvedValue('success');
      const tasks = [{ title: 'Test Task', task: taskFn }];

      createTaskList(tasks);

      // Verify the task function is preserved
      expect(tasks[0].task).toBe(taskFn);
    });
  });

  describe('Integration', () => {
    it('should work with multiple tasks', async () => {
      const { Listr } = await import('listr2');
      const tasks = [
        { title: 'Setup', task: async () => 'setup complete' },
        {
          title: 'Process',
          task: async () => 'processing done',
          retry: 2,
        },
        {
          title: 'Cleanup',
          task: async () => 'cleanup finished',
          enabled: (ctx: any) => ctx.needsCleanup,
        },
      ];

      createTaskList(tasks, {
        concurrent: false,
        exitOnError: true,
      });

      expect(Listr).toHaveBeenCalledWith(tasks, {
        concurrent: false,
        exitOnError: true,
        rendererOptions: undefined,
      });

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Setup');
      expect(tasks[1].title).toBe('Process');
      expect(tasks[1].retry).toBe(2);
      expect(tasks[2].title).toBe('Cleanup');
      expect(tasks[2].enabled).toBeTypeOf('function');
    });
  });
});
