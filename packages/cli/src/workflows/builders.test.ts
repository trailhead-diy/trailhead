import { describe, it, expect } from 'vitest';
import { createTypedTask, createTaskBuilder, type TaskHandler } from './index.js';

describe('Typed Task Handler Pattern', () => {
  interface TestContext {
    data: string;
    result?: string;
  }

  describe('createTypedTask', () => {
    it('creates task with typed handler', async () => {
      const handler: TaskHandler<TestContext> = async ctx => {
        ctx.result = `processed: ${ctx.data}`;
      };

      const task = createTypedTask('Test task', handler);

      expect(task.title).toBe('Test task');
      expect(typeof task.task).toBe('function');
    });

    it('executes handler with correct context', async () => {
      const handler: TaskHandler<TestContext> = async ctx => {
        ctx.result = `processed: ${ctx.data}`;
      };

      const task = createTypedTask('Test task', handler);
      const context: TestContext = { data: 'test data' };

      await task.task(context, {});

      expect(context.result).toBe('processed: test data');
    });

    it('supports task options', () => {
      const handler: TaskHandler<TestContext> = async () => {};

      const task = createTypedTask('Test task', handler, {
        enabled: true,
        retry: 3,
      });

      expect(task.enabled).toBe(true);
      expect(task.retry).toBe(3);
    });

    it('supports conditional skip function', () => {
      const handler: TaskHandler<TestContext> = async () => {};

      const task = createTypedTask('Test task', handler, {
        skip: ctx => ctx.data === 'skip',
      });

      expect(typeof task.skip).toBe('function');
    });
  });

  describe('createTaskBuilder', () => {
    it('creates task builder with correct type inference', async () => {
      const createTask = createTaskBuilder<TestContext>();

      const task = createTask('Build task', async ctx => {
        // TypeScript should infer ctx as TestContext
        ctx.result = `built: ${ctx.data}`;
      });

      const context: TestContext = { data: 'build data' };
      await task.task(context, {});

      expect(context.result).toBe('built: build data');
    });

    it('allows multiple tasks with same context type', () => {
      const createTask = createTaskBuilder<TestContext>();

      const task1 = createTask('Task 1', async ctx => {
        ctx.result = `task1: ${ctx.data}`;
      });

      const task2 = createTask('Task 2', async ctx => {
        ctx.result = `task2: ${ctx.data}`;
      });

      expect(task1.title).toBe('Task 1');
      expect(task2.title).toBe('Task 2');
    });

    it('supports task options in builder', () => {
      const createTask = createTaskBuilder<TestContext>();

      const task = createTask('Conditional task', async () => {}, {
        enabled: ctx => ctx.data !== 'disabled',
        retry: 2,
      });

      expect(typeof task.enabled).toBe('function');
      expect(task.retry).toBe(2);
    });
  });

  describe('type safety', () => {
    it('prevents wrong context type access', () => {
      const createTask = createTaskBuilder<TestContext>();

      // This should be a TypeScript compilation error if types are working correctly
      const task = createTask('Type test', async ctx => {
        expect(ctx.data).toBeDefined(); // TestContext has data
        // ctx.wrongField would be a TypeScript error
      });

      expect(task.title).toBe('Type test');
    });

    it('infers void return type correctly', () => {
      const handler: TaskHandler<TestContext> = async ctx => {
        ctx.result = 'test';
        // Explicitly no return - should be void
      };

      const task = createTypedTask('Void task', handler);
      expect(typeof task.task).toBe('function');
    });

    it('supports synchronous handlers', () => {
      const handler: TaskHandler<TestContext> = ctx => {
        ctx.result = 'sync result';
      };

      const task = createTypedTask('Sync task', handler);
      const context: TestContext = { data: 'sync data' };

      task.task(context, {});
      expect(context.result).toBe('sync result');
    });
  });
});
