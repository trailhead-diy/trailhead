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

// Simple task creation helpers
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
