// Re-export listr2 with enhanced TypeScript support
import { Listr } from 'listr2';
import type { ListrTask, ListrTaskWrapper } from 'listr2';
export { Listr } from 'listr2';
export type {
  ListrTask,
  ListrContext,
  ListrRenderer,
  ListrOptions,
  ListrTaskResult,
  ListrTaskWrapper,
} from 'listr2';

// Enhanced type helpers for better developer experience
export type TypedTask<T = any> = {
  title: string;
  task: (ctx: T, task: ListrTaskWrapper<T, any, any>) => void | Promise<void> | any;
  enabled?: boolean | ((ctx: T) => boolean);
  skip?: boolean | string | ((ctx: T) => boolean | string | Promise<boolean | string>);
  retry?: number;
  rollback?: (ctx: T, task: ListrTaskWrapper<T, any, any>) => void | Promise<void> | any;
};

// Utility type for creating task lists with consistent context typing
export type TypedTaskList<T = any> = TypedTask<T>[];

// Helper for creating a typed task - provides IntelliSense without wrapper overhead
export const createTask = <T = any>(task: TypedTask<T>): TypedTask<T> => task;

export function createTaskList<T = any>(
  tasks: TypedTaskList<T>,
  options?: {
    concurrent?: boolean;
    exitOnError?: boolean;
    rendererOptions?: any;
  }
) {
  return new Listr(tasks, {
    concurrent: options?.concurrent ?? false,
    exitOnError: options?.exitOnError ?? true,
    rendererOptions: options?.rendererOptions,
  });
}

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
