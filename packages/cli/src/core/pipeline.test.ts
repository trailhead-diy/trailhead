import { describe, it, expect } from 'vitest';
import { pipeline, parallel, parallelSettled, retryPipeline } from './pipeline.js';
import { ok, err } from 'neverthrow';
import { createCoreError } from '@trailhead/core';

describe('Pipeline Utilities', () => {
  describe('pipeline', () => {
    it('creates pipeline with initial value', () => {
      const p = pipeline('initial');
      expect(p).toBeDefined();
    });

    it('executes simple pipeline with transformations', async () => {
      const result = await pipeline('hello')
        .map('uppercase', (value: string) => value.toUpperCase())
        .map('add-suffix', (value: string) => `${value}!`)
        .execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('HELLO!');
      }
    });

    it('executes pipeline with async steps', async () => {
      const result = await pipeline(10)
        .step('multiply', async (value: number) => ok(value * 2))
        .step('add', async (value: number) => ok(value + 5))
        .execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(25);
      }
    });

    it('stops on first error', async () => {
      const result = await pipeline(10)
        .step('multiply', async (value: number) => ok(value * 2))
        .step('fail', async () => err(createCoreError('TEST_ERROR', 'Test error')))
        .step('should-not-execute', async (value: number) => ok(value + 5))
        .execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('TEST_ERROR');
      }
    });

    it('supports conditional steps', async () => {
      const result = await pipeline(10)
        .stepIf(
          'double-if-even',
          (value: number) => value % 2 === 0,
          async (value: number) => ok(value * 2)
        )
        .stepIf(
          'triple-if-odd',
          (value: number) => value % 2 !== 0,
          async (value: number) => ok(value * 3)
        )
        .execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(20); // 10 * 2 (even condition)
      }
    });

    it('skips conditional steps when condition is false', async () => {
      const result = await pipeline(11)
        .stepIf(
          'double-if-even',
          (value: number) => value % 2 === 0,
          async (value: number) => ok(value * 2)
        )
        .stepIf(
          'triple-if-odd',
          (value: number) => value % 2 !== 0,
          async (value: number) => ok(value * 3)
        )
        .execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(33); // 11 * 3 (odd condition)
      }
    });

    it('handles error recovery', async () => {
      let errorHandlerCalled = false;
      const result = await pipeline(10)
        .step('fail', async () => err(createCoreError('RECOVERABLE_ERROR', 'Recoverable error')))
        .onError(async (error, stepName) => {
          errorHandlerCalled = true;
          expect(stepName).toBe('fail');
          return ok(42); // Recovery value
        })
        .execute();

      expect(errorHandlerCalled).toBe(true);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    it('reports progress during execution', async () => {
      const progressReports: Array<{ step: string; progress: number; total: number }> = [];

      const result = await pipeline('start')
        .step('step1', async (value: string) => ok(`${value}-1`))
        .step('step2', async (value: string) => ok(`${value}-2`))
        .step('step3', async (value: string) => ok(`${value}-3`))
        .onProgress((step, progress, total) => {
          progressReports.push({ step, progress, total });
        })
        .execute();

      expect(result.isOk()).toBe(true);
      expect(progressReports).toHaveLength(4); // 3 steps + complete
      expect(progressReports[0]).toEqual({ step: 'step1', progress: 0, total: 3 });
      expect(progressReports[1]).toEqual({ step: 'step2', progress: 1, total: 3 });
      expect(progressReports[2]).toEqual({ step: 'step3', progress: 2, total: 3 });
      expect(progressReports[3]).toEqual({ step: 'Complete', progress: 3, total: 3 });
    });

    it('handles step timeout', async () => {
      const result = await pipeline('test')
        .stepWithTimeout('slow-step', 100, async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return ok('done');
        })
        .execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('STEP_TIMEOUT');
      }
    });

    it('handles cancellation with abort signal', async () => {
      const controller = new AbortController();

      // Cancel immediately
      controller.abort();

      const result = await pipeline('test')
        .step('step1', async () => ok('step1-done'))
        .step('step2', async () => ok('step2-done'))
        .withAbortSignal(controller.signal)
        .execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PIPELINE_CANCELLED');
      }
    });

    it('handles pipeline with Result as initial value', async () => {
      const initialResult = ok('initial');
      const result = await pipeline(initialResult)
        .map('transform', (value: string) => `${value}-transformed`)
        .execute();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('initial-transformed');
      }
    });

    it('handles pipeline with failed Result as initial value', async () => {
      const initialResult = err(createCoreError('INITIAL_ERROR', 'Initial error'));
      const result = await pipeline(initialResult)
        .map('should-not-execute', (value: string) => `${value}-transformed`)
        .execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INITIAL_ERROR');
      }
    });

    it('handles exceptions in steps', async () => {
      const result = await pipeline('test')
        .step('throwing-step', async () => {
          throw new Error('Step threw an exception');
        })
        .execute();

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('STEP_EXECUTION_ERROR');
        expect(result.error.message).toContain('throwing-step');
      }
    });
  });

  describe('parallel', () => {
    it('executes operations in parallel and returns all results (array)', async () => {
      const operations = [
        async () => ok('result1'),
        async () => ok('result2'),
        async () => ok('result3'),
      ];

      const result = await parallel(operations);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(['result1', 'result2', 'result3']);
      }
    });

    it('executes operations in parallel and returns all results (object)', async () => {
      const operations = {
        op1: async () => ok('result1'),
        op2: async () => ok('result2'),
        op3: async () => ok('result3'),
      };

      const result = await parallel(operations);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({
          op1: 'result1',
          op2: 'result2',
          op3: 'result3',
        });
      }
    });

    it('fails fast on first error (array)', async () => {
      const operations = [
        async () => ok('result1'),
        async () => err(createCoreError('PARALLEL_ERROR', 'Parallel error')),
        async () => ok('result3'),
      ];

      const result = await parallel(operations);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PARALLEL_ERROR');
      }
    });

    it('fails fast on first error (object)', async () => {
      const operations = {
        op1: async () => ok('result1'),
        op2: async () => err(createCoreError('PARALLEL_ERROR', 'Parallel error')),
        op3: async () => ok('result3'),
      };

      const result = await parallel(operations);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PARALLEL_ERROR');
      }
    });
  });

  describe('parallelSettled', () => {
    it('collects both successes and failures (array)', async () => {
      const operations = [
        async () => ok('success1'),
        async () => err(createCoreError('ERROR1', 'Error 1')),
        async () => ok('success2'),
        async () => err(createCoreError('ERROR2', 'Error 2')),
      ];

      const result = await parallelSettled(operations);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.successes).toEqual(['success1', 'success2']);
        expect(result.value.failures).toHaveLength(2);
        expect(result.value.failures[0].type).toBe('ERROR1');
        expect(result.value.failures[1].type).toBe('ERROR2');
      }
    });

    it('collects both successes and failures (object)', async () => {
      const operations = {
        op1: async () => ok('success1'),
        op2: async () => err(createCoreError('ERROR1', 'Error 1')),
        op3: async () => ok('success2'),
        op4: async () => err(createCoreError('ERROR2', 'Error 2')),
      };

      const result = await parallelSettled(operations);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.successes).toEqual({
          op1: 'success1',
          op3: 'success2',
        });
        expect(result.value.failures).toEqual({
          op2: expect.objectContaining({ type: 'ERROR1' }),
          op4: expect.objectContaining({ type: 'ERROR2' }),
        });
      }
    });
  });

  describe('retryPipeline', () => {
    it('succeeds on first attempt', async () => {
      const pipelineFactory = () => pipeline('success').step('pass', async value => ok(value));

      const result = await retryPipeline(pipelineFactory, { maxAttempts: 3 });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('success');
      }
    });

    it('retries on failure and eventually succeeds', async () => {
      let attempts = 0;
      const pipelineFactory = () =>
        pipeline('test').step('flaky', async () => {
          attempts++;
          if (attempts < 3) {
            return err(createCoreError('FLAKY_ERROR', 'Flaky error'));
          }
          return ok('success');
        });

      const result = await retryPipeline(pipelineFactory, { maxAttempts: 3 });

      expect(attempts).toBe(3);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('success');
      }
    });

    it('exhausts retries and returns last error', async () => {
      const pipelineFactory = () =>
        pipeline('test').step('always-fail', async () =>
          err(createCoreError('PERSISTENT_ERROR', 'Persistent error'))
        );

      const result = await retryPipeline(pipelineFactory, { maxAttempts: 2 });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PIPELINE_MAX_RETRIES_EXCEEDED');
      }
    });

    it('calls onRetry callback', async () => {
      const retryCallbacks: Array<{ attempt: number; error: string }> = [];
      let attempts = 0;

      const pipelineFactory = () =>
        pipeline('test').step('fail', async () => {
          attempts++;
          return err(createCoreError('RETRY_ERROR', `Error ${attempts}`));
        });

      await retryPipeline(pipelineFactory, {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          retryCallbacks.push({ attempt, error: error.message });
        },
      });

      expect(retryCallbacks).toHaveLength(2); // 2 retries for 3 attempts
      expect(retryCallbacks[0]).toEqual({ attempt: 1, error: 'Error 1' });
      expect(retryCallbacks[1]).toEqual({ attempt: 2, error: 'Error 2' });
    });
  });
});
