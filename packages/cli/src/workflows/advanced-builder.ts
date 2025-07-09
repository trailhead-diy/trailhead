import type { Result } from '../core/index.js';
import { Ok, Err, createError } from '../core/index.js';
import {
  createEnhancedProgressTracker,
  type EnhancedProgressTracker,
  type EnhancedProgressStep,
  type EnhancedProgressState,
} from '../progress/enhanced-tracker.js';

/**
 * Advanced workflow step with progress integration
 */
export interface AdvancedWorkflowStep<T> {
  /** Step name for display */
  name: string;
  /** Step execution function with progress callbacks */
  execute: (context: AdvancedWorkflowContext<T>) => Promise<void> | void;
  /** Step weight for progress calculation */
  weight: number;
  /** Estimated duration in milliseconds */
  estimatedDuration?: number;
  /** Optional condition to determine if step should run */
  condition?: (context: AdvancedWorkflowContext<T>) => boolean | Promise<boolean>;
  /** Optional retry configuration */
  retry?: {
    attempts: number;
    delay?: number;
  };
}

/**
 * Advanced workflow context with progress integration
 */
export interface AdvancedWorkflowContext<T> {
  /** Get a value from the context */
  get<K extends keyof T>(key: K): T[K] | undefined;
  /** Set a value in the context (returns new context) */
  set<K extends keyof T>(key: K, value: T[K]): AdvancedWorkflowContext<T>;
  /** Get all context data */
  getAll(): Partial<T>;
  /** Check if a key exists in the context */
  has<K extends keyof T>(key: K): boolean;
  /** Enhanced progress tracker */
  progress: EnhancedProgressTracker;
  /** Update progress within current step */
  updateProgress: (progress: number) => void;
  /** Get current step information */
  getCurrentStep: () => { index: number; name: string; progress: number };
}

/**
 * Advanced workflow execution result
 */
export interface AdvancedWorkflowResult<T> {
  /** Whether the workflow completed successfully */
  success: boolean;
  /** Final context state */
  context: Partial<T>;
  /** Errors encountered during execution */
  errors: Array<{ step: string; error: Error }>;
  /** Enhanced execution metadata */
  metadata: {
    startTime: number;
    endTime: number;
    duration: number;
    completedSteps: number;
    totalSteps: number;
    averageStepTime?: number;
    stepCompletionTimes: number[];
  };
  /** Final progress state */
  progressState: EnhancedProgressState;
}

/**
 * Advanced workflow options
 */
export interface AdvancedWorkflowOptions {
  /** Whether to stop execution on first error */
  stopOnError?: boolean;
  /** Whether to show time estimates */
  showTimeEstimates?: boolean;
  /** Custom progress format */
  progressFormat?: string;
  /** Callback for progress updates */
  onProgress?: (step: string, progress: number, timeRemaining?: number) => void;
  /** Callback for step completion */
  onStepComplete?: (step: string, context: any, duration: number) => void;
  /** Callback for errors */
  onError?: (error: Error, step: string) => void;
  /** Callback for step start */
  onStepStart?: (step: string, estimatedDuration?: number) => void;
}

/**
 * Advanced workflow configuration for functional composition
 */
interface AdvancedWorkflowConfig<T> {
  readonly steps: readonly AdvancedWorkflowStep<T>[];
  readonly options: AdvancedWorkflowOptions;
}

/**
 * Advanced workflow API for fluent composition
 */
export interface AdvancedWorkflowAPI<T = Record<string, unknown>> {
  /**
   * Add a step to the workflow with progress integration
   */
  step(
    name: string,
    execute: (context: AdvancedWorkflowContext<T>) => Promise<void> | void,
    options?: {
      weight?: number;
      estimatedDuration?: number;
      condition?: (context: AdvancedWorkflowContext<T>) => boolean | Promise<boolean>;
      retry?: { attempts: number; delay?: number };
    }
  ): AdvancedWorkflowAPI<T>;

  /**
   * Set progress callback with time estimates
   */
  onProgress(
    callback: (step: string, progress: number, timeRemaining?: number) => void
  ): AdvancedWorkflowAPI<T>;

  /**
   * Set step start callback
   */
  onStepStart(callback: (step: string, estimatedDuration?: number) => void): AdvancedWorkflowAPI<T>;

  /**
   * Set step completion callback with duration
   */
  onStepComplete(
    callback: (step: string, context: any, duration: number) => void
  ): AdvancedWorkflowAPI<T>;

  /**
   * Set error callback
   */
  onError(callback: (error: Error, step: string) => void): AdvancedWorkflowAPI<T>;

  /**
   * Configure to stop on first error
   */
  stopOnError(value?: boolean): AdvancedWorkflowAPI<T>;

  /**
   * Configure progress display options
   */
  progressOptions(options: {
    showTimeEstimates?: boolean;
    format?: string;
  }): AdvancedWorkflowAPI<T>;

  /**
   * Execute the enhanced workflow with automatic progress reporting
   */
  execute(initialContext?: Partial<T>): Promise<Result<AdvancedWorkflowResult<T>>>;
}

/**
 * Create a new advanced workflow using functional composition
 */
export function createAdvancedWorkflow<T = Record<string, unknown>>(): AdvancedWorkflowAPI<T> {
  return createAdvancedWorkflowAPI<T>({ steps: [], options: {} });
}

/**
 * Create advanced workflow API with functional composition
 */
function createAdvancedWorkflowAPI<T>(config: AdvancedWorkflowConfig<T>): AdvancedWorkflowAPI<T> {
  return {
    step: (name, execute, options) =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        steps: [
          ...config.steps,
          {
            name,
            execute,
            weight: options?.weight ?? 1,
            estimatedDuration: options?.estimatedDuration,
            condition: options?.condition,
            retry: options?.retry,
          },
        ],
      }),

    onProgress: callback =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onProgress: callback },
      }),

    onStepStart: callback =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onStepStart: callback },
      }),

    onStepComplete: callback =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onStepComplete: callback },
      }),

    onError: callback =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        options: { ...config.options, onError: callback },
      }),

    stopOnError: (value = true) =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        options: { ...config.options, stopOnError: value },
      }),

    progressOptions: progressOpts =>
      createAdvancedWorkflowAPI<T>({
        ...config,
        options: {
          ...config.options,
          showTimeEstimates: progressOpts.showTimeEstimates,
          progressFormat: progressOpts.format,
        },
      }),

    execute: (initialContext = {}) => executeAdvancedWorkflow(config, initialContext),
  };
}

/**
 * Execute advanced workflow with functional approach
 */
async function executeAdvancedWorkflow<T>(
  config: AdvancedWorkflowConfig<T>,
  initialContext: Partial<T>
): Promise<Result<AdvancedWorkflowResult<T>>> {
  const startTime = Date.now();
  const errors: Array<{ step: string; error: Error }> = [];

  // Convert steps to progress steps
  const progressSteps: EnhancedProgressStep[] = config.steps.map(step => ({
    name: step.name,
    weight: step.weight,
    estimatedDuration: step.estimatedDuration,
  }));

  // Create enhanced progress tracker
  const progressTracker = createEnhancedProgressTracker({
    totalSteps: config.steps.length,
    steps: progressSteps,
    showTimeEstimates: config.options.showTimeEstimates,
    enhancedFormat: config.options.progressFormat,
  });

  // Create advanced workflow context
  let context = createAdvancedWorkflowContext<T>(initialContext, progressTracker);
  let completedSteps = 0;

  try {
    // Execute each step
    for (let i = 0; i < config.steps.length; i++) {
      const step = config.steps[i];

      // Check condition if provided
      if (step.condition) {
        const shouldRun = await step.condition(context);
        if (!shouldRun) {
          progressTracker.completeStep(`${step.name} (skipped)`);
          if (i < config.steps.length - 1) {
            progressTracker.startNextStep();
          }
          continue;
        }
      }

      // Start step
      const stepStartTime = Date.now();
      config.options.onStepStart?.(step.name, step.estimatedDuration);

      // Execute step with retry logic
      let attempts = 0;
      const maxAttempts = step.retry?.attempts ?? 1;
      const delay = step.retry?.delay ?? 0;

      while (attempts < maxAttempts) {
        try {
          await step.execute(context);

          // Complete step
          const stepDuration = Date.now() - stepStartTime;
          progressTracker.completeStep();
          completedSteps++;

          config.options.onStepComplete?.(step.name, context.getAll(), stepDuration);

          // Progress callback with time estimates
          const timeEstimate = progressTracker.getTimeEstimate();
          config.options.onProgress?.(
            step.name,
            context.progress.getEnhancedState().percentage,
            timeEstimate.remaining
          );

          // Start next step if not the last one
          if (i < config.steps.length - 1) {
            progressTracker.startNextStep();
          }

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
              const finalState = progressTracker.getEnhancedState();

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
                  averageStepTime: finalState.averageStepTime,
                  stepCompletionTimes: finalState.stepCompletionTimes,
                },
                progressState: finalState,
              });
            }

            // Continue to next step on error if not stopping
            if (i < config.steps.length - 1) {
              progressTracker.startNextStep();
            }
            break;
          }

          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }

    // Complete workflow
    progressTracker.complete();
    const endTime = Date.now();
    const finalState = progressTracker.getEnhancedState();

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
        averageStepTime: finalState.averageStepTime,
        stepCompletionTimes: finalState.stepCompletionTimes,
      },
      progressState: finalState,
    });
  } catch (error) {
    progressTracker.stop();

    return Err(
      createError(
        'advanced-workflow-execution-error',
        error instanceof Error ? error.message : String(error),
        { cause: error }
      )
    );
  }
}

/**
 * Create an advanced workflow context with progress integration
 */
function createAdvancedWorkflowContext<T>(
  initialData: Partial<T>,
  progress: EnhancedProgressTracker
): AdvancedWorkflowContext<T> {
  let data = { ...initialData };

  return {
    get<K extends keyof T>(key: K): T[K] | undefined {
      return data[key];
    },

    set<K extends keyof T>(key: K, value: T[K]): AdvancedWorkflowContext<T> {
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

    updateProgress: (stepProgress: number) => {
      progress.updateStepProgress(stepProgress);
    },

    getCurrentStep: () => {
      const state = progress.getEnhancedState();
      return {
        index: state.currentStepIndex,
        name: state.stepName,
        progress: state.stepProgress,
      };
    },
  };
}
