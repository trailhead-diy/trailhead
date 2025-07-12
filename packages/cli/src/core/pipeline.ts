import type { CoreError } from '@trailhead/core';
import { Result, ResultAsync, ok, err } from 'neverthrow';
import { createCoreError } from './index.js';

/**
 * Flow Control & Error Handling - addresses GitHub issue #113
 *
 * This module implements Result pipeline utilities for streamlined async operations
 * and error handling, eliminating 5-10 lines per operation chain.
 */

// Pipeline utilities for chaining operations without manual error checking
export type PipelineStep<T, U> = (value: T) => ResultAsync<U, CoreError> | Result<U, CoreError>;
export type ConditionalStep<T> = (value: T) => boolean | Promise<boolean>;
export type ErrorHandler<T> = (
  error: CoreError,
  stepName?: string
) => ResultAsync<T, CoreError> | Result<T, CoreError>;

// Internal pipeline configuration (immutable)
export interface PipelineConfig<T> {
  readonly initialValue: T | ResultAsync<T, CoreError> | Result<T, CoreError>;
  readonly steps: readonly PipelineStepConfig[];
  readonly errorHandler?: ErrorHandler<any>;
  readonly progressCallback?: (step: string, progress: number, total: number) => void;
  readonly abortSignal?: AbortSignal;
}

export interface PipelineStepConfig {
  readonly name: string;
  readonly step: PipelineStep<any, any>;
  readonly condition?: ConditionalStep<any>;
  readonly timeout?: number;
}

/**
 * Functional pipeline builder using immutable configuration
 *
 * Eliminates 5-10 lines of manual error checking per operation:
 * - Automatic error propagation between steps
 * - Support for conditional execution
 * - Built-in error recovery and transformation
 * - Progress tracking integration
 * - Timeout and cancellation support
 */
export interface Pipeline<T> {
  step<U>(name: string, stepFn: PipelineStep<T, U>): Pipeline<U>;
  step<U>(stepFn: PipelineStep<T, U>): Pipeline<U>;
  stepIf<U>(
    name: string,
    condition: ConditionalStep<T>,
    stepFn: PipelineStep<T, U>
  ): Pipeline<T | U>;
  stepIf<U>(condition: ConditionalStep<T>, stepFn: PipelineStep<T, U>): Pipeline<T | U>;
  stepWithTimeout<U>(name: string, timeout: number, stepFn: PipelineStep<T, U>): Pipeline<U>;
  stepWithTimeout<U>(timeout: number, stepFn: PipelineStep<T, U>): Pipeline<U>;
  map<U>(name: string, transform: (value: T) => U): Pipeline<U>;
  map<U>(transform: (value: T) => U): Pipeline<U>;
  onError<U = T>(handler: ErrorHandler<U>): Pipeline<T>;
  onProgress(callback: (step: string, progress: number, total: number) => void): Pipeline<T>;
  withAbortSignal(signal: AbortSignal): Pipeline<T>;
  execute(): ResultAsync<T, CoreError>;
}

/**
 * Create a functional pipeline with immutable configuration
 */
function createPipeline<T>(config: PipelineConfig<T>): Pipeline<T> {
  const updateConfig = <K extends keyof PipelineConfig<T>>(
    key: K,
    value: PipelineConfig<T>[K]
  ): PipelineConfig<T> => ({
    ...config,
    [key]: value,
  });

  const addStep = (stepConfig: PipelineStepConfig): PipelineConfig<any> => ({
    ...config,
    steps: [...config.steps, stepConfig],
  });

  return {
    step<U>(nameOrStepFn: string | PipelineStep<T, U>, stepFn?: PipelineStep<T, U>): Pipeline<U> {
      const name =
        typeof nameOrStepFn === 'string' ? nameOrStepFn : `Step ${config.steps.length + 1}`;
      const fn = typeof nameOrStepFn === 'string' ? stepFn! : nameOrStepFn;

      return createPipeline(addStep({ name, step: fn }));
    },

    stepIf<U>(
      nameOrCondition: string | ConditionalStep<T>,
      conditionOrStepFn: ConditionalStep<T> | PipelineStep<T, U>,
      stepFn?: PipelineStep<T, U>
    ): Pipeline<T | U> {
      const name =
        typeof nameOrCondition === 'string'
          ? nameOrCondition
          : `Conditional Step ${config.steps.length + 1}`;
      const condition =
        typeof nameOrCondition === 'string'
          ? (conditionOrStepFn as ConditionalStep<T>)
          : nameOrCondition;
      const fn =
        typeof nameOrCondition === 'string' ? stepFn! : (conditionOrStepFn as PipelineStep<T, U>);

      return createPipeline(addStep({ name, step: fn, condition }));
    },

    stepWithTimeout<U>(
      nameOrTimeout: string | number,
      timeoutOrStepFn: number | PipelineStep<T, U>,
      stepFn?: PipelineStep<T, U>
    ): Pipeline<U> {
      const name =
        typeof nameOrTimeout === 'string' ? nameOrTimeout : `Timed Step ${config.steps.length + 1}`;
      const timeout =
        typeof nameOrTimeout === 'string' ? (timeoutOrStepFn as number) : nameOrTimeout;
      const fn =
        typeof nameOrTimeout === 'string' ? stepFn! : (timeoutOrStepFn as PipelineStep<T, U>);

      return createPipeline(addStep({ name, step: fn, timeout }));
    },

    map<U>(nameOrTransform: string | ((value: T) => U), transform?: (value: T) => U): Pipeline<U> {
      const name =
        typeof nameOrTransform === 'string'
          ? nameOrTransform
          : `Transform ${config.steps.length + 1}`;
      const fn = typeof nameOrTransform === 'string' ? transform! : nameOrTransform;

      return this.step(name, (value: T) => ok(fn(value)));
    },

    onError<U = T>(handler: ErrorHandler<U>): Pipeline<T> {
      return createPipeline(updateConfig('errorHandler', handler));
    },

    onProgress(callback: (step: string, progress: number, total: number) => void): Pipeline<T> {
      return createPipeline(updateConfig('progressCallback', callback));
    },

    withAbortSignal(signal: AbortSignal): Pipeline<T> {
      return createPipeline(updateConfig('abortSignal', signal));
    },

    execute(): ResultAsync<T, CoreError> {
      return ResultAsync.fromPromise(executePipeline(config), e => {
        if (e && typeof e === 'object' && 'type' in e && 'message' in e) {
          return e as CoreError;
        }
        return createCoreError('PIPELINE_ERROR', String(e), { recoverable: false });
      }).andThen(result => result);
    },
  };
}

/**
 * Execute a pipeline configuration (pure function)
 */
async function executePipeline<T>(config: PipelineConfig<T>): Promise<Result<T, CoreError>> {
  try {
    // Resolve initial value
    const initialResult = await resolveInitialValue(config.initialValue);
    if (initialResult.isErr()) {
      return initialResult;
    }

    let currentValue: any = initialResult.isOk() ? initialResult.value : undefined;

    // Execute pipeline steps
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];

      // Check for cancellation
      if (config.abortSignal?.aborted) {
        return err(
          createCoreError('PIPELINE_CANCELLED', 'Pipeline execution was cancelled', {
            recoverable: false,
            context: { step: step.name },
          })
        );
      }

      // Report progress
      config.progressCallback?.(step.name, i, config.steps.length);

      // Check condition if provided
      if (step.condition) {
        const shouldExecute = await step.condition(currentValue);
        if (!shouldExecute) {
          continue;
        }
      }

      // Execute step
      const stepResult = await executeStep(step, currentValue);

      if (stepResult.isErr()) {
        // Try error recovery if handler is provided
        if (config.errorHandler) {
          const recoveryResult = await config.errorHandler(stepResult.error, step.name);
          if (recoveryResult.isOk()) {
            currentValue = recoveryResult.value;
            continue;
          }
        }
        return stepResult;
      }

      currentValue = stepResult.isOk() ? stepResult.value : undefined;
    }

    // Final progress report
    config.progressCallback?.('Complete', config.steps.length, config.steps.length);

    return ok(currentValue);
  } catch (error) {
    return err(
      createCoreError('PIPELINE_EXECUTION_FAILED', 'Pipeline execution failed', {
        recoverable: false,
        cause: error,
        context: { error: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}

/**
 * Resolve initial value to a Result (pure function)
 */
async function resolveInitialValue<T>(
  initialValue: T | ResultAsync<T, CoreError> | Result<T, CoreError>
): Promise<Result<T, CoreError>> {
  if (
    typeof initialValue === 'object' &&
    initialValue !== null &&
    ('isOk' in initialValue || 'isErr' in initialValue)
  ) {
    // It's a Result
    return initialValue as Result<T, CoreError>;
  } else if (initialValue instanceof Promise) {
    // It's a Promise<Result>
    return await initialValue;
  } else {
    // It's a raw value
    return ok(initialValue as T);
  }
}

/**
 * Execute a single pipeline step (pure function)
 */
async function executeStep(
  step: PipelineStepConfig,
  currentValue: any
): Promise<Result<any, CoreError>> {
  try {
    let stepResult: ResultAsync<any, CoreError> | Result<any, CoreError>;

    if (step.timeout) {
      stepResult = await executeWithTimeout(step.step(currentValue), step.timeout, step.name);
    } else {
      stepResult = await step.step(currentValue);
    }

    return stepResult instanceof Promise ? await stepResult : stepResult;
  } catch (error) {
    return err(
      createCoreError('STEP_EXECUTION_ERROR', `Step "${step.name}" threw an exception`, {
        recoverable: false,
        cause: error,
        context: { step: step.name, error: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}

/**
 * Execute operation with timeout (pure function)
 */
async function executeWithTimeout<U>(
  operation: ResultAsync<U, CoreError> | Result<U, CoreError>,
  timeout: number,
  stepName: string
): Promise<Result<U, CoreError>> {
  if (!(operation instanceof Promise)) {
    return operation;
  }

  return new Promise<Result<U, CoreError>>(resolve => {
    const timer = setTimeout(() => {
      resolve(
        err(
          createCoreError('STEP_TIMEOUT', `Step "${stepName}" timed out after ${timeout}ms`, {
            recoverable: false,
            context: { timeout, stepName },
          })
        )
      );
    }, timeout);

    operation.then(result => {
      clearTimeout(timer);
      resolve(result);
    });
  });
}

/**
 * Create a new pipeline with initial value (pure function)
 */
export function pipeline<T>(initialValue: T): Pipeline<T>;
export function pipeline<T>(initialValue: ResultAsync<T, CoreError>): Pipeline<T>;
export function pipeline<T>(initialValue: Result<T, CoreError>): Pipeline<T>;
export function pipeline<T>(
  initialValue: T | ResultAsync<T, CoreError> | Result<T, CoreError>
): Pipeline<T> {
  return createPipeline({
    initialValue,
    steps: [],
  });
}

/**
 * Execute multiple operations in parallel and collect results
 */
export async function parallel<T>(
  operations: Record<string, () => ResultAsync<T, CoreError>>
): Promise<Result<Record<string, T>, CoreError>>;
export async function parallel<T>(
  operations: Array<() => ResultAsync<T, CoreError>>
): Promise<Result<T[], CoreError>>;
export async function parallel<T>(
  operations:
    | Record<string, () => ResultAsync<T, CoreError>>
    | Array<() => ResultAsync<T, CoreError>>
): Promise<Result<Record<string, T> | T[], CoreError>> {
  try {
    if (Array.isArray(operations)) {
      const results = await Promise.all(operations.map(op => op()));
      const values: T[] = [];

      for (const result of results) {
        if (result.isErr()) {
          return result as Result<T[], CoreError>;
        }
        if (result.isOk()) {
          values.push(result.value);
        }
      }

      return ok(values);
    } else {
      const entries = Object.entries(operations);
      const results = await Promise.all(entries.map(([, op]) => op()));
      const values: Record<string, T> = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.isErr()) {
          return result as Result<Record<string, T>, CoreError>;
        }
        if (result.isOk()) {
          values[entries[i][0]] = result.value;
        }
      }

      return ok(values);
    }
  } catch (error) {
    return err(
      createCoreError('PARALLEL_EXECUTION_FAILED', 'Parallel execution failed', {
        recoverable: false,
        cause: error,
        context: { error: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}

/**
 * Execute operations in parallel with failure tolerance
 */
export async function parallelSettled<T>(
  operations: Record<string, () => ResultAsync<T, CoreError>>
): Promise<
  Result<{ successes: Record<string, T>; failures: Record<string, CoreError> }, CoreError>
>;
export async function parallelSettled<T>(
  operations: Array<() => ResultAsync<T, CoreError>>
): Promise<Result<{ successes: T[]; failures: CoreError[] }, CoreError>>;
export async function parallelSettled<T>(
  operations:
    | Record<string, () => ResultAsync<T, CoreError>>
    | Array<() => ResultAsync<T, CoreError>>
): Promise<Result<any, CoreError>> {
  try {
    if (Array.isArray(operations)) {
      const results = await Promise.all(operations.map(op => op()));
      const successes: T[] = [];
      const failures: CoreError[] = [];

      for (const result of results) {
        if (result.isOk()) {
          successes.push(result.value);
        } else if (result.isErr()) {
          failures.push(result.error);
        }
      }

      return ok({ successes, failures });
    } else {
      const entries = Object.entries(operations);
      const results = await Promise.all(entries.map(([, op]) => op()));
      const successes: Record<string, T> = {};
      const failures: Record<string, CoreError> = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const key = entries[i][0];
        if (result.isOk()) {
          successes[key] = result.value;
        } else if (result.isErr()) {
          failures[key] = result.error;
        }
      }

      return ok({ successes, failures });
    }
  } catch (error) {
    return err(
      createCoreError('PARALLEL_SETTLED_EXECUTION_FAILED', 'Parallel settled execution failed', {
        recoverable: false,
        cause: error,
        context: { error: error instanceof Error ? error.message : String(error) },
      })
    );
  }
}

/**
 * Retry a pipeline with backoff
 */
export async function retryPipeline<T>(
  pipelineFactory: () => Pipeline<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: CoreError) => void;
  } = {}
): Promise<Result<T, CoreError>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: CoreError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await pipelineFactory().execute();

    if (result.isOk()) {
      return result;
    }

    lastError = result.isOk() ? undefined : result.error;

    if (attempt < maxAttempts) {
      onRetry?.(
        attempt,
        result.isOk()
          ? createCoreError('UNKNOWN_ERROR', 'Unknown error', { recoverable: false })
          : result.error
      );

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return err(
    createCoreError(
      'PIPELINE_MAX_RETRIES_EXCEEDED',
      `Pipeline failed after ${maxAttempts} attempts`,
      {
        recoverable: false,
        cause: lastError,
        context: { maxAttempts, lastError: lastError?.message },
      }
    )
  );
}
