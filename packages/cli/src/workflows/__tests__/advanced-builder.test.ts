import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAdvancedWorkflow } from '../advanced-builder.js';

// Mock enhanced progress tracker
const mockEnhancedProgressTracker = {
  nextStep: vi.fn(),
  setStep: vi.fn(),
  complete: vi.fn(),
  getState: vi.fn(),
  reset: vi.fn(),
  stop: vi.fn(),
  getEnhancedState: vi.fn(() => ({
    currentStepIndex: 0,
    steps: [],
    stepProgress: 0,
    percentage: 0,
    averageStepTime: 1000,
    stepCompletionTimes: [],
    estimatedTimeRemaining: 2000,
    timeElapsed: 1000,
    currentStep: 1,
    totalSteps: 2,
    stepName: 'Test Step',
    startTime: Date.now(),
    completed: false,
    metadata: {},
  })),
  updateStepProgress: vi.fn(),
  startNextStep: vi.fn(),
  completeStep: vi.fn(),
  getTimeEstimate: vi.fn(() => ({
    remaining: 2000,
    total: 3000,
    elapsed: 1000,
  })),
};

// Mock createEnhancedProgressTracker
vi.mock('../../progress/enhanced-tracker.js', () => ({
  createEnhancedProgressTracker: vi.fn(() => mockEnhancedProgressTracker),
}));

interface TestContext {
  data: string;
  count: number;
  processed: boolean;
}

describe('AdvancedWorkflowBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('enhanced step creation', () => {
    it('should create enhanced workflow with weighted steps', () => {
      const workflow = createAdvancedWorkflow<TestContext>()
        .step(
          'Load data',
          async ctx => {
            ctx.set('data', 'test-data');
          },
          {
            weight: 2,
            estimatedDuration: 1000,
          }
        )
        .step(
          'Process data',
          async ctx => {
            ctx.set('processed', true);
          },
          {
            weight: 3,
            estimatedDuration: 2000,
          }
        );

      expect(workflow).toBeDefined();
    });

    it('should use default weight of 1 when not specified', async () => {
      const workflow = createAdvancedWorkflow<TestContext>().step(
        'Default weight step',
        async ctx => {
          ctx.set('data', 'test');
        }
      );

      const result = await workflow.execute();
      expect(result.isOk()).toBe(true);
    });
  });

  describe('enhanced context management', () => {
    it('should provide enhanced context with progress integration', async () => {
      const workflow = createAdvancedWorkflow<TestContext>().step(
        'Test enhanced context',
        async ctx => {
          expect(ctx.progress).toBeDefined();
          expect(ctx.updateProgress).toBeDefined();
          expect(ctx.getCurrentStep).toBeDefined();

          ctx.updateProgress(50);
          const stepInfo = ctx.getCurrentStep();
          expect(stepInfo).toHaveProperty('index');
          expect(stepInfo).toHaveProperty('name');
          expect(stepInfo).toHaveProperty('progress');
        }
      );

      const result = await workflow.execute();
      expect(result.isOk()).toBe(true);
    });

    it('should allow updating step progress', async () => {
      const workflow = createAdvancedWorkflow<TestContext>().step(
        'Progress update step',
        async ctx => {
          ctx.updateProgress(25);
          ctx.updateProgress(50);
          ctx.updateProgress(75);
        }
      );

      await workflow.execute();

      expect(mockEnhancedProgressTracker.updateStepProgress).toHaveBeenCalledWith(25);
      expect(mockEnhancedProgressTracker.updateStepProgress).toHaveBeenCalledWith(50);
      expect(mockEnhancedProgressTracker.updateStepProgress).toHaveBeenCalledWith(75);
    });
  });

  describe('enhanced progress tracking', () => {
    it('should start and complete steps with enhanced progress', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
        .step('Step 1', async ctx => {
          ctx.set('data', 'test');
        })
        .step('Step 2', async ctx => {
          ctx.set('processed', true);
        });

      await workflow.execute();

      expect(mockEnhancedProgressTracker.completeStep).toHaveBeenCalledTimes(2);
      expect(mockEnhancedProgressTracker.startNextStep).toHaveBeenCalledTimes(1);
      expect(mockEnhancedProgressTracker.complete).toHaveBeenCalled();
    });

    it('should handle step skipping with enhanced progress', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
        .step('Normal step', async ctx => {
          ctx.set('data', 'test');
        })
        .step(
          'Skipped step',
          async ctx => {
            ctx.set('processed', true);
          },
          {
            condition: () => false,
          }
        );

      await workflow.execute();

      expect(mockEnhancedProgressTracker.completeStep).toHaveBeenCalledWith(
        'Skipped step (skipped)'
      );
    });
  });

  describe('enhanced callbacks', () => {
    it('should call progress callback with time estimates', async () => {
      const progressCallback = vi.fn();

      const workflow = createAdvancedWorkflow<TestContext>()
        .onProgress(progressCallback)
        .step('Test step', async ctx => {
          ctx.set('data', 'test');
        });

      await workflow.execute();

      expect(progressCallback).toHaveBeenCalledWith(
        'Test step',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should call step start callback with estimated duration', async () => {
      const stepStartCallback = vi.fn();

      const workflow = createAdvancedWorkflow<TestContext>()
        .onStepStart(stepStartCallback)
        .step(
          'Test step',
          async ctx => {
            ctx.set('data', 'test');
          },
          {
            estimatedDuration: 5000,
          }
        );

      await workflow.execute();

      expect(stepStartCallback).toHaveBeenCalledWith('Test step', 5000);
    });

    it('should call step completion callback with duration', async () => {
      const stepCompleteCallback = vi.fn();

      const workflow = createAdvancedWorkflow<TestContext>()
        .onStepComplete(stepCompleteCallback)
        .step('Test step', async ctx => {
          ctx.set('data', 'test');
        });

      await workflow.execute();

      expect(stepCompleteCallback).toHaveBeenCalledWith(
        'Test step',
        { data: 'test' },
        expect.any(Number)
      );
    });
  });

  describe('enhanced execution result', () => {
    it('should return enhanced execution metadata', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
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
        expect(result.value.metadata).toEqual({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          completedSteps: 2,
          totalSteps: 2,
          averageStepTime: expect.any(Number),
          stepCompletionTimes: expect.any(Array),
        });
        expect(result.value.progressState).toBeDefined();
      }
    });

    it('should include progress state in result', async () => {
      const workflow = createAdvancedWorkflow<TestContext>().step('Test step', async ctx => {
        ctx.set('data', 'test');
      });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.progressState).toBeDefined();
        expect(result.value.progressState.currentStepIndex).toBeDefined();
        expect(result.value.progressState.steps).toBeDefined();
        expect(result.value.progressState.stepProgress).toBeDefined();
      }
    });
  });

  describe('retry with enhanced progress', () => {
    it('should maintain progress during retries', async () => {
      let attempts = 0;

      const workflow = createAdvancedWorkflow<TestContext>().step(
        'Retry step',
        async ctx => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Retry error');
          }
          ctx.set('processed', true);
        },
        {
          retry: { attempts: 2, delay: 10 },
        }
      );

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
        expect(result.value.context.processed).toBe(true);
      }
    });
  });

  describe('error handling with enhanced progress', () => {
    it('should stop progress on error when configured', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
        .stopOnError(true)
        .step('Failing step', async () => {
          throw new Error('Test error');
        });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(mockEnhancedProgressTracker.stop).toHaveBeenCalled();
      }
    });

    it('should continue progress on error when not configured to stop', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
        .stopOnError(false)
        .step('Failing step', async () => {
          throw new Error('Test error');
        })
        .step('Continue step', async ctx => {
          ctx.set('processed', true);
        });

      const result = await workflow.execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(false);
        expect(result.value.context.processed).toBe(true);
      }
    });
  });

  describe('progress configuration', () => {
    it('should configure progress options', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
        .progressOptions({
          showTimeEstimates: true,
          format: 'Custom format [{bar}] {percentage}%',
        })
        .step('Test step', async ctx => {
          ctx.set('data', 'test');
        });

      const result = await workflow.execute();
      expect(result.isOk()).toBe(true);
    });
  });

  describe('async conditions with enhanced progress', () => {
    it('should handle async conditions with progress updates', async () => {
      const workflow = createAdvancedWorkflow<TestContext>()
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
