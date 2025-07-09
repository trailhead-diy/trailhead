import type { ProgressTracker } from '../progress/types.js';
import type { Result } from '../core/index.js';
import { createProgressTracker } from '../progress/tracker.js';
import { Ok, Err, createError } from '../core/index.js';

/**
 * Workflow step definition with metadata
 */
export interface WorkflowStep<T> {
  /** Step name for display */
  name: string;
  /** Step execution function */
  execute: (context: WorkflowContext<T>) => Promise<void> | void;
  /** Optional step weight for progress calculation */
  weight?: number;
  /** Optional condition to determine if step should run */
  condition?: (context: WorkflowContext<T>) => boolean | Promise<boolean>;
  /** Optional retry configuration */
  retry?: {
    attempts: number;
    delay?: number;
  };
}

/**
 * Workflow context with immutable state management
 */
export interface WorkflowContext<T> {
  /** Get a value from the context */
  get<K extends keyof T>(key: K): T[K] | undefined;
  /** Set a value in the context (returns new context) */
  set<K extends keyof T>(key: K, value: T[K]): WorkflowContext<T>;
  /** Get all context data */
  getAll(): Partial<T>;
  /** Check if a key exists in the context */
  has<K extends keyof T>(key: K): boolean;
  /** Progress tracker for the workflow */
  progress: ProgressTracker;
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
  /** Whether to stop execution on first error */
  stopOnError?: boolean;
  /** Custom progress tracking options */
  progressOptions?: {
    format?: string;
    showStepNames?: boolean;
  };
  /** Callback for progress updates */
  onProgress?: (step: string, progress: number) => void;
  /** Callback for step completion */
  onStepComplete?: (step: string, context: any) => void;
  /** Callback for errors */
  onError?: (error: Error, step: string) => void;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult<T> {
  /** Whether the workflow completed successfully */
  success: boolean;
  /** Final context state */
  context: Partial<T>;
  /** Errors encountered during execution */
  errors: Array<{ step: string; error: Error }>;
  /** Execution metadata */
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    completedSteps: number;
    totalSteps: number;
  };
}

/**
 * Workflow configuration for functional composition
 */
interface WorkflowConfig<T> {
  readonly steps: readonly WorkflowStep<T>[];
  readonly options: WorkflowOptions;
}

/**
 * Workflow API for fluent composition
 */
export interface WorkflowAPI<T = Record<string, unknown>> {
  /**
   * Add a step to the workflow
   */
  step(
    name: string,
    execute: (context: WorkflowContext<T>) => Promise<void> | void,
    options?: {
      weight?: number;
      condition?: (context: WorkflowContext<T>) => boolean | Promise<boolean>;
      retry?: { attempts: number; delay?: number };
    }
  ): WorkflowAPI<T>;

  /**
   * Set progress callback
   */
  onProgress(callback: (step: string, progress: number) => void): WorkflowAPI<T>;

  /**
   * Set step completion callback
   */
  onStepComplete(callback: (step: string, context: any) => void): WorkflowAPI<T>;

  /**
   * Set error callback
   */
  onError(callback: (error: Error, step: string) => void): WorkflowAPI<T>;

  /**
   * Configure to stop on first error
   */
  stopOnError(value?: boolean): WorkflowAPI<T>;

  /**
   * Configure progress options
   */
  progressOptions(options: { format?: string; showStepNames?: boolean }): WorkflowAPI<T>;

  /**
   * Execute the workflow
   */
  execute(initialContext?: Partial<T>): Promise<Result<WorkflowResult<T>>>;
}

/**
 * Create a new workflow using functional composition
 */
export function createWorkflow<T = Record<string, unknown>>(): WorkflowAPI<T> {
  return createWorkflowAPI<T>({ steps: [], options: {} });
}

/**
 * Create workflow API with functional composition
 */
function createWorkflowAPI<T>(config: WorkflowConfig<T>): WorkflowAPI<T> {
  return {
    step: (name, execute, options) =>
      createWorkflowAPI<T>({
        ...config,
        steps: [
          ...config.steps,
          {
            name,
            execute,
            weight: options?.weight,
            condition: options?.condition,
            retry: options?.retry,
          },
        ],
      }),

    onProgress: callback =>
      createWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onProgress: callback },
      }),

    onStepComplete: callback =>
      createWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onStepComplete: callback },
      }),

    onError: callback =>
      createWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onError: callback },
      }),

    stopOnError: (value = true) =>
      createWorkflowAPI<T>({
        ...config,
        options: { ...config.options, stopOnError: value },
      }),

    progressOptions: progressOpts =>
      createWorkflowAPI<T>({
        ...config,
        options: { ...config.options, progressOptions: progressOpts },
      }),

    execute: (initialContext = {}) => executeWorkflow(config, initialContext),
  };
}

/**
 * Execute workflow with functional approach
 */
async function executeWorkflow<T>(
  config: WorkflowConfig<T>,
  initialContext: Partial<T>
): Promise<Result<WorkflowResult<T>>> {
  const startTime = Date.now();
  const errors: Array<{ step: string; error: Error }> = [];

  // Calculate step weights
  const weights = config.steps.map(step => step.weight ?? 1);

  // Create progress tracker
  const progressTracker = createProgressTracker({
    totalSteps: config.steps.length,
    stepWeights: weights,
    format: config.options.progressOptions?.format,
    showStepNames: config.options.progressOptions?.showStepNames,
  });

  // Create workflow context
  let context = createWorkflowContext<T>(initialContext, progressTracker);
  let completedSteps = 0;

  try {
    // Execute each step
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];

      // Check condition if provided
      if (step.condition) {
        const shouldRun = await step.condition(context);
        if (!shouldRun) {
          progressTracker.nextStep(`${step.name} (skipped)`);
          continue;
        }
      }

      // Update progress
      progressTracker.nextStep(step.name);
      config.options.onProgress?.(
        step.name,
        calculateProgressPercentage(i, config.steps.length, weights)
      );

      // Execute step with retry logic
      let attempts = 0;
      const maxAttempts = step.retry?.attempts ?? 1;
      const delay = step.retry?.delay ?? 0;

      while (attempts < maxAttempts) {
        try {
          await step.execute(context);
          completedSteps++;
          config.options.onStepComplete?.(step.name, context.getAll());
          break;
        } catch (error) {
          attempts++;

          if (attempts >= maxAttempts) {
            const stepError = error instanceof Error ? error : new Error(String(error));
            errors.push({ step: step.name, error: stepError });
            config.options.onError?.(stepError, step.name);

            if (config.options.stopOnError) {
              progressTracker.stop();
              const endTime = Date.now();

              return Ok({
                success: false,
                context: context.getAll(),
                errors,
                metadata: {
                  startTime,
                  endTime,
                  duration: endTime - startTime,
                  completedSteps,
                  totalSteps: config.steps.length,
                },
              });
            }
            break;
          }

          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }

    // Complete progress tracking
    progressTracker.complete();
    const endTime = Date.now();

    return Ok({
      success: errors.length === 0,
      context: context.getAll(),
      errors,
      metadata: {
        startTime,
        endTime,
        duration: endTime - startTime,
        completedSteps,
        totalSteps: config.steps.length,
      },
    });
  } catch (error) {
    progressTracker.stop();

    return Err(
      createError(
        'workflow-execution-error',
        error instanceof Error ? error.message : String(error),
        { cause: error }
      )
    );
  }
}

/**
 * Create a workflow context with immutable state management
 */
function createWorkflowContext<T>(
  initialData: Partial<T>,
  progress: ProgressTracker
): WorkflowContext<T> {
  let data = { ...initialData };

  return {
    get<K extends keyof T>(key: K): T[K] | undefined {
      return data[key];
    },

    set<K extends keyof T>(key: K, value: T[K]): WorkflowContext<T> {
      data = { ...data, [key]: value };
      return this;
    },

    getAll(): Partial<T> {
      return { ...data };
    },

    has<K extends keyof T>(key: K): boolean {
      return key in data;
    },

    progress,
  };
}

/**
 * Calculate progress percentage based on step weights
 */
function calculateProgressPercentage(
  currentStep: number,
  totalSteps: number,
  weights: number[]
): number {
  if (weights.length === 0) {
    return Math.round((currentStep / totalSteps) * 100);
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const completedWeight = weights.slice(0, currentStep).reduce((sum, weight) => sum + weight, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}
