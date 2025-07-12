// Pure delegation to @trailhead/workflows domain package
export * from '@trailhead/workflows';

// Re-export for backward compatibility
import { createWorkflowOperations as createWorkflow } from '@trailhead/workflows';
export { createWorkflow };

// Simple task creator for backward compatibility
export const createTask = <T = any>(task: TypedTask<T>): TypedTask<T> => task;

// Legacy type compatibility for CLI tests
export type TypedTask<T = any> = {
  title: string;
  task: (ctx: T, task: any) => void | Promise<void> | any;
  enabled?: boolean | ((ctx: T) => boolean);
  skip?: boolean | string | ((ctx: T) => boolean | string | Promise<boolean | string>);
  retry?: number;
  rollback?: (ctx: T, task: any) => void | Promise<void> | any;
};

export type TypedTaskList<T = any> = TypedTask<T>[];
