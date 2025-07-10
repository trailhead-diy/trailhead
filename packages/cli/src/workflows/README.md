# Workflows Module

Enhanced TypeScript support for Listr2 task runners with type-safe context handling.

## Quick Start

### Basic Usage (with type safety)

```typescript
import { createTask, createTaskList, type TypedTask } from '@esteban-url/trailhead-cli/workflows';

interface BuildContext {
  srcDir: string;
  distDir: string;
  buildTime?: number;
}

// Option 1: Using createTask helper (recommended)
const tasks = [
  createTask<BuildContext>({
    title: 'Clean dist directory',
    task: async ctx => {
      // ctx is fully typed as BuildContext
      await fs.rm(ctx.distDir, { recursive: true, force: true });
    },
  }),

  createTask<BuildContext>({
    title: 'Build project',
    task: async ctx => {
      const start = Date.now();
      // Your build logic here
      ctx.buildTime = Date.now() - start;
    },
    enabled: ctx => fs.existsSync(ctx.srcDir), // Typed context
  }),

  createTask<BuildContext>({
    title: 'Verify build',
    task: async ctx => {
      if (!fs.existsSync(ctx.distDir)) {
        throw new Error('Build failed');
      }
    },
    skip: ctx => (!ctx.buildTime ? 'No build to verify' : false), // Typed context
  }),
];

const taskList = createTaskList(tasks);
await taskList.run({ srcDir: './src', distDir: './dist' });
```

### Option 2: Direct object creation with types

```typescript
import {
  createTaskList,
  type TypedTask,
  type TypedTaskList,
} from '@esteban-url/trailhead-cli/workflows';

interface DeployContext {
  environment: 'dev' | 'staging' | 'prod';
  version: string;
}

// Create tasks directly with TypeScript intellisense
const deployTasks: TypedTaskList<DeployContext> = [
  {
    title: 'Validate environment',
    task: async ctx => {
      // ctx is typed as DeployContext
      if (!['dev', 'staging', 'prod'].includes(ctx.environment)) {
        throw new Error(`Invalid environment: ${ctx.environment}`);
      }
    },
  },
  {
    title: 'Deploy to environment',
    task: async ctx => {
      console.log(`Deploying version ${ctx.version} to ${ctx.environment}`);
      // Your deployment logic
    },
    enabled: ctx => ctx.environment !== 'prod' || ctx.version.includes('stable'),
  },
];

const taskList = createTaskList(deployTasks);
await taskList.run({ environment: 'staging', version: '1.2.3-rc.1' });
```

### Option 3: Untyped for quick prototyping

```typescript
import { createTask, createTaskList } from '@esteban-url/trailhead-cli/workflows';

// No types - useful for quick scripts
const tasks = [
  createTask({
    title: 'Quick task',
    task: async ctx => {
      // ctx is 'any' type - good for prototyping
      console.log('Running quick task');
    },
  }),
];

const taskList = createTaskList(tasks);
await taskList.run({});
```

## Features

### ✅ Full Type Safety

- Context types are preserved throughout task execution
- IntelliSense for task properties and context
- Compile-time checking for context usage

### ✅ Zero Runtime Overhead

- Type helpers are compile-time only
- Direct Listr2 integration without wrapper functions
- Same performance as raw Listr2

### ✅ Flexible API

- Use `createTask<T>()` helper for IntelliSense
- Create objects directly with `TypedTask<T>` type
- Fall back to untyped for quick prototyping

### ✅ Full Listr2 Compatibility

- All Listr2 features available
- Direct access to Listr2 types and classes
- Can mix with raw Listr2 code seamlessly

## Migration from Previous API

### Before (removed over-abstraction):

```typescript
// Old way - unnecessary wrapper functions
const task = createTypedTask<Context>('title', handler, options);
const builder = createTaskBuilder<Context>();
```

### After (clean type helpers):

```typescript
// New way - direct with type safety
const task = createTask<Context>({
  title: 'title',
  task: handler,
  ...options,
});
```

## Advanced Usage

### Custom Task Types

```typescript
// Extend TypedTask for domain-specific tasks
export type BuildTask = TypedTask<BuildContext> & {
  category: 'build' | 'test' | 'deploy';
};

const buildTask: BuildTask = createTask<BuildContext>({
  title: 'Compile TypeScript',
  task: async ctx => {
    /* build logic */
  },
  category: 'build', // Custom property
});
```

### Conditional Task Lists

```typescript
const createConditionalTasks = (isDev: boolean): TypedTaskList<AppContext> => [
  createTask<AppContext>({
    title: 'Development setup',
    task: async ctx => {
      /* dev setup */
    },
    enabled: () => isDev,
  }),
  createTask<AppContext>({
    title: 'Production optimization',
    task: async ctx => {
      /* prod optimization */
    },
    enabled: () => !isDev,
  }),
];
```

The workflows module provides the cleanest possible API for type-safe task execution while maintaining full compatibility with the Listr2 ecosystem.
