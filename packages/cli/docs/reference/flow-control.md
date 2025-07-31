---
type: reference
title: 'Command Execution Patterns API Reference'
description: 'Execution patterns for batch processing, phased operations, and command enhancements'
related:
  - /packages/cli/docs/reference/command.md
  - /packages/cli/docs/how-to/use-result-pipelines
  - /packages/cli/docs/how-to/migrate-to-command-enhancements
---

# Command Execution Patterns API Reference

Execution patterns for building robust CLI commands with progress tracking, validation, and error handling.

## Overview

| Property    | Value                      |
| ----------- | -------------------------- |
| **Package** | `@esteban-url/cli`         |
| **Module**  | `@esteban-url/cli/command` |
| **Since**   | `v0.3.0`                   |

## Import

```typescript
import {
  executeBatch,
  executeWithPhases,
  executeWithConfiguration,
  executeWithDryRun,
  executeWithValidation,
  executeFileSystemOperations,
} from '@esteban-url/cli/command'
```

## Batch Processing

### `executeBatch<T, R>`

Execute operations in batches with concurrency control.

```typescript
function executeBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R, CoreError>>,
  options: {
    batchSize: number
    onProgress?: (completed: number, total: number) => void
  },
  context: CommandContext
): Promise<Result<R[], CoreError>>
```

#### Parameters

- `items` - Array of items to process
- `processor` - Async function to process each item
- `options.batchSize` - Number of items to process concurrently
- `options.onProgress` - Optional progress callback
- `context` - Command execution context

#### Example

```typescript
const result = await executeBatch(
  files,
  async (file) => processFile(file),
  {
    batchSize: 5,
    onProgress: (completed, total) => {
      console.log(`Processed ${completed}/${total}`)
    },
  },
  context
)
```

## Phased Execution

### `executeWithPhases<T>`

Execute command phases in sequence with progress tracking.

```typescript
interface CommandPhase<T> {
  name: string
  weight?: number
  action: (data: T, context: CommandContext) => Promise<Result<T, CoreError>>
}

function executeWithPhases<T>(
  phases: CommandPhase<T>[],
  initialData: T,
  context: CommandContext
): Promise<Result<T, CoreError>>
```

#### Parameters

- `phases` - Array of phases to execute in order
- `initialData` - Initial data passed to first phase
- `context` - Command execution context

#### Example

```typescript
const phases: CommandPhase<BuildData>[] = [
  {
    name: 'compile',
    weight: 50,
    action: async (data) => compileCode(data),
  },
  {
    name: 'optimize',
    weight: 30,
    action: async (data) => optimizeOutput(data),
  },
  {
    name: 'bundle',
    weight: 20,
    action: async (data) => createBundle(data),
  },
]

const result = await executeWithPhases(phases, initialData, context)
```

## Configuration Management

### `executeWithConfiguration<T, R>`

Load and merge configuration before executing.

```typescript
function executeWithConfiguration<T extends ConfigurationOptions, R>(
  options: T,
  loadConfigFn: (path?: string) => Promise<Result<Record<string, any>, CoreError>>,
  executeFn: (config: Record<string, any>) => Promise<Result<R, CoreError>>,
  context: CommandContext
): Promise<Result<R, CoreError>>
```

#### Configuration Options

```typescript
interface ConfigurationOptions {
  readonly config?: string // Path to config file
  readonly preset?: string // Configuration preset name
  readonly override?: Record<string, any> // Config overrides
}
```

## Dry Run Support

### `executeWithDryRun<T>`

Execute operations with dry-run mode support.

```typescript
function executeWithDryRun<T>(
  operation: () => Promise<Result<T, CoreError>>,
  isDryRun: boolean,
  context: CommandContext
): Promise<Result<T, CoreError>>
```

#### Parameters

- `operation` - Function to execute if not in dry-run mode
- `isDryRun` - Whether to run in dry-run mode
- `context` - Command execution context

#### Example

```typescript
const result = await executeWithDryRun(
  async () => {
    // This only runs if isDryRun is false
    return performDangerousOperation()
  },
  options.dryRun,
  context
)
```

## Validation

### `executeWithValidation<T, U>`

Execute with schema validation using Zod.

```typescript
function executeWithValidation<T, U>(
  input: T,
  schema: ZodSchema<U>,
  executeFn: (validated: U) => Promise<Result<any, CoreError>>,
  context: CommandContext
): Promise<Result<any, CoreError>>
```

## File System Operations

### `executeFileSystemOperations`

Execute file operations atomically with rollback support.

```typescript
type FileOperation =
  | { type: 'mkdir'; path: string }
  | { type: 'write'; path: string; content: string }
  | { type: 'copy'; from: string; to: string }
  | { type: 'move'; from: string; to: string }
  | { type: 'remove'; path: string }

function executeFileSystemOperations(
  operations: FileOperation[],
  context: CommandContext
): Promise<Result<void, CoreError>>
```

#### Features

- Atomic operations - all succeed or all fail
- Automatic rollback on failure
- Progress tracking for long operations
- Validation before execution

#### Example

```typescript
const operations: FileOperation[] = [
  { type: 'mkdir', path: 'dist' },
  { type: 'copy', from: 'src/index.js', to: 'dist/index.js' },
  { type: 'write', path: 'dist/manifest.json', content: JSON.stringify(manifest) },
]

const result = await executeFileSystemOperations(operations, context)
if (result.isErr()) {
  // All operations rolled back automatically
  console.error('Failed to scaffold project:', result.error.message)
}
```

## Error Handling

All execution patterns return `Result<T, CoreError>` types for consistent error handling:

```typescript
const result = await executeBatch(items, processor, options, context)

if (result.isErr()) {
  // Handle error
  context.logger.error(`Batch processing failed: ${result.error.message}`)
  return result
}

// Use successful result
const processedItems = result.value
```

## Progress Tracking

Most execution patterns support progress tracking through the context logger:

```typescript
// Automatic progress for phases
await executeWithPhases(phases, data, context)
// Logs: "Starting 3 phase execution..."
// Logs: "Phase 1/3: compile..."
// Logs: "Phase 2/3: optimize..."
// Logs: "Phase 3/3: bundle..."

// Custom progress for batches
await executeBatch(
  items,
  processor,
  {
    batchSize: 10,
    onProgress: (completed, total) => {
      const percent = Math.round((completed / total) * 100)
      context.logger.info(`Progress: ${percent}%`)
    },
  },
  context
)
```

## Best Practices

1. **Use appropriate patterns** - Choose the right execution pattern for your use case
2. **Handle errors explicitly** - All patterns return Result types
3. **Provide progress feedback** - Use progress callbacks for long operations
4. **Validate early** - Use executeWithValidation for user input
5. **Support dry-run** - Allow users to preview dangerous operations

## See Also

- [Command Module](/packages/cli/docs/reference/command.md)- Command creation and structure
- [Using Execution Patterns](/packages/cli/docs/how-to/use-result-pipelines.md)- Practical guide
- [Core Error Types](/packages/cli/docs/reference/core.md)- Error handling details
