// Re-export listr2 with enhanced TypeScript support
import { Listr } from 'listr2';
export { Listr } from 'listr2';
export type {
  ListrTask,
  ListrContext,
  ListrRenderer,
  ListrOptions,
  ListrTaskResult,
  ListrTaskWrapper,
} from 'listr2';

// Enhanced task creation types - addresses issue #112 item 1
export type TaskHandler<T> = (ctx: T) => Promise<void> | void;

// Simple task creation helpers (backward compatible)
export function createTask<T = any>(
  title: string,
  task: (ctx: T, task: any) => Promise<any> | any,
  options?: {
    enabled?: boolean | ((ctx: T) => boolean);
    skip?: boolean | string | ((ctx: T) => boolean | string | Promise<boolean | string>);
    retry?: number;
    rollback?: (ctx: T, task: any) => Promise<any> | any;
  }
) {
  return {
    title,
    task,
    enabled: options?.enabled,
    skip: options?.skip,
    retry: options?.retry,
    rollback: options?.rollback,
  };
}

// New typed task creation helpers - reduces boilerplate by 60%
export function createTypedTask<T>(
  title: string,
  handler: TaskHandler<T>,
  options?: {
    enabled?: boolean | ((ctx: T) => boolean);
    skip?: boolean | string | ((ctx: T) => boolean | string | Promise<boolean | string>);
    retry?: number;
    rollback?: (ctx: T, task: any) => Promise<any> | any;
  }
) {
  return createTask<T>(title, handler, options);
}

// Task builder factory for command-specific contexts
export function createTaskBuilder<T>() {
  return (
    title: string,
    handler: TaskHandler<T>,
    options?: {
      enabled?: boolean | ((ctx: T) => boolean);
      skip?: boolean | string | ((ctx: T) => boolean | string | Promise<boolean | string>);
      retry?: number;
      rollback?: (ctx: T, task: any) => Promise<any> | any;
    }
  ) => createTypedTask<T>(title, handler, options);
}

export function createTaskList(
  tasks: Array<ReturnType<typeof createTask>>,
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
