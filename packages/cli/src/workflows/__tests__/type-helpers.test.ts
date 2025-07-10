import { describe, it, expect } from 'vitest';
import { createTask, createTaskList, type TypedTask, type TypedTaskList } from '../index.js';

describe('Workflow Type Helpers', () => {
  interface TestContext {
    count: number;
    result?: string;
  }

  describe('TypedTask type', () => {
    it('should provide type safety for context', () => {
      // This should provide full TypeScript intellisense and type checking
      const task: TypedTask<TestContext> = {
        title: 'Test Task',
        task: async ctx => {
          ctx.count++; // ✅ TypeScript knows this exists
          ctx.result = 'completed'; // ✅ TypeScript knows this exists
        },
        enabled: ctx => ctx.count > 0, // ✅ Typed context
        skip: ctx => (ctx.count > 10 ? 'Already done' : false), // ✅ Typed context
      };

      expect(task.title).toBe('Test Task');
      expect(typeof task.task).toBe('function');
      expect(typeof task.enabled).toBe('function');
      expect(typeof task.skip).toBe('function');
    });
  });

  describe('createTask helper', () => {
    it('should provide IntelliSense without runtime overhead', () => {
      const task = createTask<TestContext>({
        title: 'Typed Task',
        task: async ctx => {
          ctx.count++; // ✅ Fully typed
        },
        enabled: ctx => ctx.count < 5,
      });

      expect(task.title).toBe('Typed Task');
      expect(typeof task.task).toBe('function');
      expect(typeof task.enabled).toBe('function');
    });

    it('should work with default any type', () => {
      const task = createTask({
        title: 'Generic Task',
        task: async _ctx => {
          // _ctx is 'any' type - works for quick prototyping
        },
      });

      expect(task.title).toBe('Generic Task');
    });
  });

  describe('TypedTaskList and createTaskList', () => {
    it('should maintain type safety across task list', () => {
      const tasks: TypedTaskList<TestContext> = [
        createTask<TestContext>({
          title: 'Setup',
          task: async ctx => {
            ctx.count = 0;
          },
        }),
        createTask<TestContext>({
          title: 'Process',
          task: async ctx => {
            ctx.count += 5;
            ctx.result = 'processed';
          },
          enabled: ctx => ctx.count >= 0,
        }),
        createTask<TestContext>({
          title: 'Cleanup',
          task: async ctx => {
            ctx.result = 'cleaned';
          },
          skip: ctx => !ctx.result,
        }),
      ];

      const taskList = createTaskList(tasks);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].title).toBe('Setup');
      expect(tasks[1].title).toBe('Process');
      expect(tasks[2].title).toBe('Cleanup');
      expect(taskList).toBeDefined();
    });
  });

  describe('Direct object creation (alternative approach)', () => {
    it('should work without helpers for simple cases', () => {
      // Users can still create objects directly if they prefer
      const task: TypedTask<TestContext> = {
        title: 'Direct Task',
        task: async ctx => {
          ctx.count = 42; // ✅ Still typed
        },
      };

      expect(task.title).toBe('Direct Task');
    });
  });
});
