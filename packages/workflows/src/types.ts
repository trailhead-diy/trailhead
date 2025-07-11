import type { Result } from '@trailhead/core';
import type { TrailheadError } from '@trailhead/core/errors';

// ========================================
// Result Type Alias
// ========================================

export type WorkflowResult<T> = Result<T, TrailheadError>;

// ========================================
// Workflow State Types
// ========================================

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface WorkflowState {
  readonly id: string;
  readonly status: WorkflowStatus;
  readonly currentStep?: string;
  readonly context: Record<string, unknown>;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly duration?: number;
  readonly progress: WorkflowProgress;
  readonly metadata: Record<string, unknown>;
}

export interface WorkflowProgress {
  readonly current: number;
  readonly total: number;
  readonly percentage: number;
  readonly estimatedTimeRemaining?: number;
}

// ========================================
// Step Types
// ========================================

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

export interface StepResult<T = unknown> {
  readonly stepId: string;
  readonly status: StepStatus;
  readonly output?: T;
  readonly error?: TrailheadError;
  readonly duration: number;
  readonly metadata: Record<string, unknown>;
}

export interface StepDefinition<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly timeout?: number;
  readonly retries?: number;
  readonly retryDelay?: number;
  readonly dependencies?: readonly string[];
  readonly condition?: StepCondition<TInput>;
  readonly execute: StepExecutor<TInput, TOutput>;
  readonly onSuccess?: StepHook<TOutput>;
  readonly onFailure?: StepHook<TrailheadError>;
  readonly onSkip?: StepHook<string>;
  readonly cleanup?: StepCleanup;
}

export type StepExecutor<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  context: WorkflowContext
) => WorkflowResult<TOutput> | Promise<WorkflowResult<TOutput>>;

export type StepCondition<TInput = unknown> = (
  input: TInput,
  context: WorkflowContext
) => boolean | Promise<boolean>;

export type StepHook<T = unknown> = (data: T, context: WorkflowContext) => void | Promise<void>;

export type StepCleanup = (context: WorkflowContext) => void | Promise<void>;

// ========================================
// Workflow Types
// ========================================

export interface WorkflowDefinition<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
  readonly timeout?: number;
  readonly steps: readonly StepDefinition[];
  readonly onStart?: WorkflowHook<TInput>;
  readonly onComplete?: WorkflowHook<TOutput>;
  readonly onFailure?: WorkflowHook<TrailheadError>;
  readonly onCancel?: WorkflowHook<string>;
  readonly cleanup?: WorkflowCleanup;
}

export type WorkflowHook<T = unknown> = (data: T, state: WorkflowState) => void | Promise<void>;

export type WorkflowCleanup = (state: WorkflowState) => void | Promise<void>;

// ========================================
// Execution Types
// ========================================

export interface WorkflowContext {
  readonly workflowId: string;
  readonly stepId?: string;
  readonly input: unknown;
  readonly variables: Record<string, unknown>;
  readonly metadata: Record<string, unknown>;
  readonly startTime: number;
  readonly timeout?: number;
}

export interface ExecutionOptions {
  readonly timeout?: number;
  readonly maxRetries?: number;
  readonly retryDelay?: number;
  readonly parallel?: boolean;
  readonly stopOnFailure?: boolean;
  readonly variables?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export interface ExecutionPlan {
  readonly workflowId: string;
  readonly steps: readonly StepExecutionPlan[];
  readonly dependencies: ReadonlyMap<string, readonly string[]>;
  readonly parallel: boolean;
  readonly estimatedDuration?: number;
}

export interface StepExecutionPlan {
  readonly stepId: string;
  readonly order: number;
  readonly dependencies: readonly string[];
  readonly canRunInParallel: boolean;
  readonly estimatedDuration?: number;
}

// ========================================
// Engine Types
// ========================================

export interface WorkflowEngine {
  readonly execute: <TInput, TOutput>(
    workflow: WorkflowDefinition<TInput, TOutput>,
    input: TInput,
    options?: ExecutionOptions
  ) => Promise<WorkflowResult<TOutput>>;

  readonly getState: (workflowId: string) => WorkflowState | undefined;
  readonly cancel: (workflowId: string) => Promise<WorkflowResult<void>>;
  readonly pause: (workflowId: string) => Promise<WorkflowResult<void>>;
  readonly resume: (workflowId: string) => Promise<WorkflowResult<void>>;
  readonly cleanup: (workflowId: string) => Promise<WorkflowResult<void>>;
}

// ========================================
// Operations Types
// ========================================

export interface WorkflowOperations {
  readonly createWorkflow: <TInput, TOutput>(
    definition: Omit<WorkflowDefinition<TInput, TOutput>, 'id'>
  ) => WorkflowDefinition<TInput, TOutput>;

  readonly createStep: <TInput, TOutput>(
    definition: Omit<StepDefinition<TInput, TOutput>, 'id'>
  ) => StepDefinition<TInput, TOutput>;

  readonly validateWorkflow: (workflow: WorkflowDefinition) => WorkflowResult<void>;

  readonly planExecution: (
    workflow: WorkflowDefinition,
    options?: ExecutionOptions
  ) => WorkflowResult<ExecutionPlan>;
}

export interface StepOperations {
  readonly execute: <TInput, TOutput>(
    step: StepDefinition<TInput, TOutput>,
    input: TInput,
    context: WorkflowContext
  ) => Promise<WorkflowResult<TOutput>>;

  readonly validateStep: (step: StepDefinition) => WorkflowResult<void>;

  readonly shouldExecute: <TInput>(
    step: StepDefinition<TInput>,
    input: TInput,
    context: WorkflowContext
  ) => Promise<boolean>;
}

export interface StateOperations {
  readonly createState: (
    workflowId: string,
    definition: WorkflowDefinition,
    context: WorkflowContext
  ) => WorkflowState;

  readonly updateState: (state: WorkflowState, updates: Partial<WorkflowState>) => WorkflowState;

  readonly updateProgress: (state: WorkflowState, current: number, total: number) => WorkflowState;

  readonly getMetrics: (state: WorkflowState) => WorkflowMetrics;
}

export interface ExecutionOperations {
  readonly createEngine: (options?: EngineOptions) => WorkflowEngine;

  readonly createExecutor: (options?: ExecutorOptions) => StepExecutor;

  readonly createScheduler: (options?: SchedulerOptions) => WorkflowScheduler;
}

// ========================================
// Additional Types
// ========================================

export interface WorkflowMetrics {
  readonly totalSteps: number;
  readonly completedSteps: number;
  readonly failedSteps: number;
  readonly skippedSteps: number;
  readonly averageStepDuration: number;
  readonly totalDuration: number;
  readonly throughput: number;
  readonly errorRate: number;
}

export interface EngineOptions {
  readonly maxConcurrentWorkflows?: number;
  readonly defaultTimeout?: number;
  readonly defaultRetries?: number;
  readonly enableMetrics?: boolean;
  readonly enableLogging?: boolean;
}

export interface ExecutorOptions {
  readonly timeout?: number;
  readonly maxRetries?: number;
  readonly retryDelay?: number;
  readonly enableProfiling?: boolean;
}

export interface SchedulerOptions {
  readonly maxConcurrentSteps?: number;
  readonly queueSize?: number;
  readonly priorityHandling?: boolean;
}

export interface WorkflowScheduler {
  readonly schedule: (
    plan: ExecutionPlan,
    context: WorkflowContext
  ) => Promise<WorkflowResult<unknown>>;

  readonly getQueueSize: () => number;
  readonly getActiveCount: () => number;
  readonly getMetrics: () => SchedulerMetrics;
}

export interface SchedulerMetrics {
  readonly queueSize: number;
  readonly activeCount: number;
  readonly completedCount: number;
  readonly failedCount: number;
  readonly averageWaitTime: number;
  readonly averageExecutionTime: number;
}
