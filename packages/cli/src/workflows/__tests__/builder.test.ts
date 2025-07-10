import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWorkflow, type WorkflowContext } from '../builder.js';

// Mock progress tracker
const mockProgressTracker = {
  nextStep: vi.fn(),
  setStep: vi.fn(),
  complete: vi.fn(),
  getState: vi.fn(),
  reset: vi.fn(),
  stop: vi.fn(),
};

// Mock createProgressTracker
vi.mock('../../progress/tracker.js', () => ({
  createProgressTracker: vi.fn(() => mockProgressTracker),
}));

interface TestContext {
  data: string;
  count: number;
  processed: boolean;
}

describe('WorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('step creation', () => {
    it('should create a workflow with multiple steps', () => {
      const workflow = createWorkflow<TestContext>()
        .step('Load data', async ctx => {
          ctx.set('data', 'test-data');
        })
        .step('Process data', async ctx => {
          ctx.set('processed', true);
        });

      expect(workflow).toBeDefined();
    });

    it('should allow conditional steps', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Load data', async ctx => {
          ctx.set('data', 'test-data');
        })
        .step(
          'Conditional step',
          async ctx => {
            ctx.set('processed', true);
          },
          {
            condition: ctx => ctx.get('data') === 'test-data',
          }
        );

      const result = await workflow.execute({ data: 'test-data' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.context.processed).toBe(true);
      }
    });

    it('should skip steps when condition is false', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Load data', async ctx => {
          ctx.set('data', 'test-data');
        })
        .step(
          'Skipped step',
          async ctx => {
            ctx.set('processed', true);
          },
          {
            condition: ctx => ctx.get('data') === 'other-data',
          }
        );

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.context.processed).toBeUndefined();
      }
    });
  });

  describe('context management', () => {
    it('should provide type-safe context access', async () => {
      const workflow = createWorkflow<TestContext>().step('Test context', async ctx => {
        ctx.set('data', 'test-value');
        ctx.set('count', 42);
        ctx.set('processed', true);

        expect(ctx.get('data')).toBe('test-value');
        expect(ctx.get('count')).toBe(42);
        expect(ctx.get('processed')).toBe(true);
        expect(ctx.has('data')).toBe(true);
        expect(ctx.has('nonexistent' as keyof TestContext)).toBe(false);
      });

      const result = await workflow.execute();
      expect(result.isOk()).toBe(true);
    });

    it('should maintain immutable context updates', async () => {
      let originalContext: WorkflowContext<TestContext>;
      let updatedContext: WorkflowContext<TestContext>;

      const workflow = createWorkflow<TestContext>().step('Test immutability', async ctx => {
        originalContext = ctx;
        updatedContext = ctx.set('data', 'new-value');

        expect(originalContext).not.toBe(updatedContext);
        expect(originalContext.get('data')).toBeUndefined();
        expect(updatedContext.get('data')).toBe('new-value');
      });

      await workflow.execute();
    });

    it('should provide access to all context data', async () => {
      const workflow = createWorkflow<TestContext>().step('Set data', async ctx => {
        ctx.set('data', 'test');
        ctx.set('count', 5);
        ctx.set('processed', false);

        const allData = ctx.getAll();
        expect(allData).toEqual({
          data: 'test',
          count: 5,
          processed: false,
        });
      });

      const result = await workflow.execute();
      expect(result.isOk()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle step errors gracefully', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Failing step', async () => {
          throw new Error('Test error');
        })
        .step('Never executed', async ctx => {
          ctx.set('processed', true);
        });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(result.value.errors).toHaveLength(1);
        expect(result.value.errors[0].error.message).toBe('Test error');
        expect(result.value.errors[0].step).toBe('Failing step');
      }
    });

    it('should stop on error when configured', async () => {
      const workflow = createWorkflow<TestContext>()
        .stopOnError(true)
        .step('Failing step', async () => {
          throw new Error('Test error');
        })
        .step('Never executed', async ctx => {
          ctx.set('processed', true);
        });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(result.value.context.processed).toBeUndefined();
      }
    });

    it('should continue execution when not configured to stop on error', async () => {
      const workflow = createWorkflow<TestContext>()
        .stopOnError(false)
        .step('Failing step', async () => {
          throw new Error('Test error');
        })
        .step('Continues execution', async ctx => {
          ctx.set('processed', true);
        });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(result.value.errors).toHaveLength(1);
        expect(result.value.context.processed).toBe(true);
      }
    });
  });

  describe('retry functionality', () => {
    it('should retry failed steps', async () => {
      let attempts = 0;

      const workflow = createWorkflow<TestContext>().step(
        'Retry step',
        async ctx => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Retry error');
          }
          ctx.set('processed', true);
        },
        {
          retry: { attempts: 3, delay: 10 },
        }
      );

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.context.processed).toBe(true);
        expect(attempts).toBe(3);
      }
    });

    it('should fail after max retry attempts', async () => {
      let attempts = 0;

      const workflow = createWorkflow<TestContext>().step(
        'Always failing step',
        async () => {
          attempts++;
          throw new Error('Persistent error');
        },
        {
          retry: { attempts: 2 },
        }
      );

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(result.value.errors).toHaveLength(1);
        expect(attempts).toBe(2);
      }
    });
  });

  describe('progress tracking integration', () => {
    it('should initialize progress tracker with correct steps', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Step 1', async ctx => {
          ctx.set('data', 'test');
        })
        .step('Step 2', async ctx => {
          ctx.set('processed', true);
        });

      await workflow.execute();

      expect(mockProgressTracker.nextStep).toHaveBeenCalledWith('Step 1');
      expect(mockProgressTracker.nextStep).toHaveBeenCalledWith('Step 2');
      expect(mockProgressTracker.complete).toHaveBeenCalled();
    });

    it('should update progress with step names', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Loading data', async ctx => {
          ctx.set('data', 'loaded');
        })
        .step('Processing data', async ctx => {
          ctx.set('processed', true);
        });

      await workflow.execute();

      expect(mockProgressTracker.nextStep).toHaveBeenCalledWith('Loading data');
      expect(mockProgressTracker.nextStep).toHaveBeenCalledWith('Processing data');
    });
  });

  describe('callback integration', () => {
    it('should call progress callback with step information', async () => {
      const progressCallback = vi.fn();

      const workflow = createWorkflow<TestContext>()
        .onProgress(progressCallback)
        .step('Test step', async ctx => {
          ctx.set('data', 'test');
        });

      await workflow.execute();

      expect(progressCallback).toHaveBeenCalledWith('Test step', expect.any(Number));
    });

    it('should call step completion callback', async () => {
      const stepCompleteCallback = vi.fn();

      const workflow = createWorkflow<TestContext>()
        .onStepComplete(stepCompleteCallback)
        .step('Test step', async ctx => {
          ctx.set('data', 'test');
        });

      await workflow.execute();

      expect(stepCompleteCallback).toHaveBeenCalledWith('Test step', { data: 'test' });
    });

    it('should call error callback for failed steps', async () => {
      const errorCallback = vi.fn();

      const workflow = createWorkflow<TestContext>()
        .onError(errorCallback)
        .step('Failing step', async () => {
          throw new Error('Test error');
        });

      await workflow.execute();

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        'Failing step'
      );
    });
  });

  describe('workflow execution result', () => {
    it('should return comprehensive execution metadata', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Step 1', async ctx => {
          ctx.set('data', 'test');
        })
        .step('Step 2', async ctx => {
          ctx.set('processed', true);
        });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.context).toEqual({
          data: 'test',
          processed: true,
        });
        expect(result.value.errors).toHaveLength(0);
        expect(result.value.metadata).toEqual({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          completedSteps: 2,
          totalSteps: 2,
        });
      }
    });

    it('should include initial context in execution', async () => {
      const workflow = createWorkflow<TestContext>().step('Use initial data', async ctx => {
        const initialData = ctx.get('data');
        ctx.set('processed', initialData === 'initial');
      });

      const result = await workflow.execute({ data: 'initial' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.context.processed).toBe(true);
      }
    });
  });

  describe('async condition handling', () => {
    it('should handle async conditions', async () => {
      const workflow = createWorkflow<TestContext>()
        .step('Setup', async ctx => {
          ctx.set('data', 'async-test');
        })
        .step(
          'Conditional step',
          async ctx => {
            ctx.set('processed', true);
          },
          {
            condition: async ctx => {
              await new Promise(resolve => setTimeout(resolve, 10));
              return ctx.get('data') === 'async-test';
            },
          }
        );

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.context.processed).toBe(true);
      }
    });
  });
});
