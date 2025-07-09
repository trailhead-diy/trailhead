import type { Result, AsyncResult, CLIError } from './errors/types.js';
import { Ok, Err, createError } from './errors/factory.js';
import { isOk, isErr } from './errors/utils.js';

/**
 * Flow Control & Error Handling - addresses GitHub issue #113
 *
 * This module implements Result pipeline utilities for streamlined async operations
 * and error handling, eliminating 5-10 lines per operation chain.
 */

// Pipeline utilities for chaining operations without manual error checking
export type PipelineStep<T, U> = (value: T) => AsyncResult<U> | Result<U>;
export type ConditionalStep<T> = (value: T) => boolean | Promise<boolean>;
export type ErrorHandler<T> = (error: CLIError, stepName?: string) => AsyncResult<T> | Result<T>;

// Internal pipeline configuration (immutable)
export interface PipelineConfig<T> {
  readonly initialValue: T | AsyncResult<T> | Result<T>;
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
  execute(): AsyncResult<T>;
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

      return this.step(name, async (value: T) => Ok(fn(value)));
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

    async execute(): AsyncResult<T> {
      return executePipeline(config);
    },
  };
}

/**
 * Execute a pipeline configuration (pure function)
 */
async function executePipeline<T>(config: PipelineConfig<T>): AsyncResult<T> {
  try {
    // Resolve initial value
    const initialResult = await resolveInitialValue(config.initialValue);
    if (isErr(initialResult)) {
      return initialResult;
    }

    let currentValue: any = initialResult.success ? initialResult.value : undefined;

    // Execute pipeline steps
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];

      // Check for cancellation
      if (config.abortSignal?.aborted) {
        return Err(
          createError('PIPELINE_CANCELLED', 'Pipeline execution was cancelled', {
            details: `Cancelled at step: ${step.name}`,
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

      if (isErr(stepResult)) {
        // Try error recovery if handler is provided
        if (config.errorHandler) {
          const recoveryResult = await config.errorHandler(stepResult.error, step.name);
          if (isOk(recoveryResult)) {
            currentValue = recoveryResult.value;
            continue;
          }
        }
        return stepResult;
      }

      currentValue = stepResult.success ? stepResult.value : undefined;
    }

    // Final progress report
    config.progressCallback?.('Complete', config.steps.length, config.steps.length);

    return Ok(currentValue);
  } catch (error) {
    return Err(
      createError('PIPELINE_ERROR', 'Pipeline execution failed', {
        cause: error,
        details: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Resolve initial value to a Result (pure function)
 */
async function resolveInitialValue<T>(
  initialValue: T | AsyncResult<T> | Result<T>
): AsyncResult<T> {
  if (typeof initialValue === 'object' && initialValue !== null && 'success' in initialValue) {
    // It's a Result
    return initialValue as Result<T>;
  } else if (initialValue instanceof Promise) {
    // It's a Promise<Result>
    return await initialValue;
  } else {
    // It's a raw value
    return Ok(initialValue as T);
  }
}

/**
 * Execute a single pipeline step (pure function)
 */
async function executeStep(step: PipelineStepConfig, currentValue: any): AsyncResult<any> {
  try {
    let stepResult: AsyncResult<any> | Result<any>;

    if (step.timeout) {
      stepResult = await executeWithTimeout(step.step(currentValue), step.timeout, step.name);
    } else {
      stepResult = await step.step(currentValue);
    }

    return stepResult;
  } catch (error) {
    return Err(
      createError('PIPELINE_STEP_ERROR', `Step "${step.name}" threw an exception`, {
        cause: error,
        details: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Execute operation with timeout (pure function)
 */
async function executeWithTimeout<U>(
  operation: AsyncResult<U> | Result<U>,
  timeout: number,
  stepName: string
): AsyncResult<U> {
  if (!(operation instanceof Promise)) {
    return operation;
  }

  return new Promise<Result<U>>(resolve => {
    const timer = setTimeout(() => {
      resolve(
        Err(
          createError('PIPELINE_TIMEOUT', `Step "${stepName}" timed out after ${timeout}ms`, {
            details: `Timeout: ${timeout}ms`,
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
export function pipeline<T>(initialValue: AsyncResult<T>): Pipeline<T>;
export function pipeline<T>(initialValue: Result<T>): Pipeline<T>;
export function pipeline<T>(initialValue: T | AsyncResult<T> | Result<T>): Pipeline<T> {
  return createPipeline({
    initialValue,
    steps: [],
  });
}

/**
 * Execute multiple operations in parallel and collect results
 */
export async function parallel<T>(
  operations: Record<string, () => AsyncResult<T>>
): AsyncResult<Record<string, T>>;
export async function parallel<T>(operations: Array<() => AsyncResult<T>>): AsyncResult<T[]>;
export async function parallel<T>(
  operations: Record<string, () => AsyncResult<T>> | Array<() => AsyncResult<T>>
): AsyncResult<Record<string, T> | T[]> {
  try {
    if (Array.isArray(operations)) {
      const results = await Promise.all(operations.map(op => op()));
      const values: T[] = [];

      for (const result of results) {
        if (isErr(result)) {
          return result;
        }
        if (isOk(result)) {
          values.push(result.value);
        }
      }

      return Ok(values);
    } else {
      const entries = Object.entries(operations);
      const results = await Promise.all(entries.map(([, op]) => op()));
      const values: Record<string, T> = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (isErr(result)) {
          return result;
        }
        if (isOk(result)) {
          values[entries[i][0]] = result.value;
        }
      }

      return Ok(values);
    }
  } catch (error) {
    return Err(
      createError('PARALLEL_EXECUTION_ERROR', 'Parallel execution failed', {
        cause: error,
        details: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

/**
 * Execute operations in parallel with failure tolerance
 */
export async function parallelSettled<T>(
  operations: Record<string, () => AsyncResult<T>>
): AsyncResult<{ successes: Record<string, T>; failures: Record<string, CLIError> }>;
export async function parallelSettled<T>(
  operations: Array<() => AsyncResult<T>>
): AsyncResult<{ successes: T[]; failures: CLIError[] }>;
export async function parallelSettled<T>(
  operations: Record<string, () => AsyncResult<T>> | Array<() => AsyncResult<T>>
): AsyncResult<any> {
  try {
    if (Array.isArray(operations)) {
      const results = await Promise.all(operations.map(op => op()));
      const successes: T[] = [];
      const failures: CLIError[] = [];

      for (const result of results) {
        if (isOk(result)) {
          successes.push(result.value);
        } else if (isErr(result)) {
          failures.push(result.error);
        }
      }

      return Ok({ successes, failures });
    } else {
      const entries = Object.entries(operations);
      const results = await Promise.all(entries.map(([, op]) => op()));
      const successes: Record<string, T> = {};
      const failures: Record<string, CLIError> = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const key = entries[i][0];
        if (isOk(result)) {
          successes[key] = result.value;
        } else if (isErr(result)) {
          failures[key] = result.error;
        }
      }

      return Ok({ successes, failures });
    }
  } catch (error) {
    return Err(
      createError('PARALLEL_SETTLED_ERROR', 'Parallel settled execution failed', {
        cause: error,
        details: error instanceof Error ? error.message : String(error),
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
    onRetry?: (attempt: number, error: CLIError) => void;
  } = {}
): AsyncResult<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: CLIError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await pipelineFactory().execute();

    if (isOk(result)) {
      return result;
    }

    lastError = result.success ? undefined : result.error;

    if (attempt < maxAttempts) {
      onRetry?.(
        attempt,
        result.success ? createError('UNKNOWN_ERROR', 'Unknown error') : result.error
      );

      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return Err(
    createError('PIPELINE_RETRY_EXHAUSTED', `Pipeline failed after ${maxAttempts} attempts`, {
      cause: lastError,
      details: `Last error: ${lastError?.message}`,
    })
  );
}
