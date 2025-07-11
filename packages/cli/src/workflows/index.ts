// Delegate to @trailhead/workflows domain package
export * from '@trailhead/workflows/core';

// Keep CLI-specific workflow utilities
// Enhanced type helpers for better developer experience
export type TypedTask<T = any> = {
  title: string;
  task: (ctx: T, task: any) => void | Promise<void> | any;
  enabled?: boolean | ((ctx: T) => boolean);
  skip?: boolean | string | ((ctx: T) => boolean | string | Promise<boolean | string>);
  retry?: number;
  rollback?: (ctx: T, task: any) => void | Promise<void> | any;
};

// Utility type for creating task lists with consistent context typing
export type TypedTaskList<T = any> = TypedTask<T>[];

// Helper for creating a typed task - provides IntelliSense without wrapper overhead
export const createTask = <T = any>(task: TypedTask<T>): TypedTask<T> => task;

// Advanced workflow builder exports - addresses issue #116 items 7 & 13
export {
  createWorkflow,
  type WorkflowAPI,
  type WorkflowStep,
  type WorkflowContext,
  type WorkflowOptions,
  type WorkflowResult,
} from './builder.js';

export {
  createAdvancedWorkflow,
  type AdvancedWorkflowAPI,
  type AdvancedWorkflowStep,
  type AdvancedWorkflowContext,
  type AdvancedWorkflowOptions,
  type AdvancedWorkflowResult,
} from './advanced-builder.js';
