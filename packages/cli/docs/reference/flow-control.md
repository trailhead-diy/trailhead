---
type: reference
title: 'Flow Control API Reference'
description: 'Pipeline utilities and error templates for streamlined async operations'
related:
  - ./core.md
  - ../how-to/use-result-pipelines.md
  - ../how-to/migrate-to-pipelines.md
---

# Flow Control API Reference

Pipeline utilities and error templates for functional async flow control with automatic error propagation.

## Overview

| Property    | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| **Package** | `@esteban-url/cli`                                          |
| **Module**  | `@esteban-url/cli/core`                                     |
| **Since**   | `v0.3.0`                                                    |
| **Issue**   | [#113](https://github.com/esteban-url/trailhead/issues/113) |

## Import

```typescript
import {
  pipeline,
  parallel,
  parallelSettled,
  retryPipeline,
  errorTemplates,
  createErrorTemplate,
  globalErrorTemplates,
} from '@esteban-url/cli/core'
```

## Pipeline API

### `pipeline<T>(initialValue)`

Creates a new pipeline with an initial value.

```typescript
function pipeline<T>(initialValue: T | Result<T> | Promise<Result<T>>): Pipeline<T>
```

### Pipeline Methods

#### `.step(name?, stepFn)`

Adds a sequential step to the pipeline.

```typescript
interface Pipeline<T> {
  step(name: string, stepFn: StepFunction<T>): Pipeline<T>
  step(stepFn: StepFunction<T>): Pipeline<T>
}

type StepFunction<T> = (value: T) => Promise<Result<T>> | Result<T>
```

#### `.stepIf(name?, condition, stepFn)`

Adds a conditional step that executes only if the condition returns true.

```typescript
interface Pipeline<T> {
  stepIf(name: string, condition: (value: T) => boolean, stepFn: StepFunction<T>): Pipeline<T>
  stepIf(condition: (value: T) => boolean, stepFn: StepFunction<T>): Pipeline<T>
}
```

#### `.stepWithTimeout(name?, timeout, stepFn)`

Adds a step with timeout that fails if execution exceeds the specified duration.

```typescript
interface Pipeline<T> {
  stepWithTimeout(name: string, timeout: number, stepFn: StepFunction<T>): Pipeline<T>
  stepWithTimeout(timeout: number, stepFn: StepFunction<T>): Pipeline<T>
}
```

#### `.map(name?, transform)`

Transforms data synchronously within the pipeline.

```typescript
interface Pipeline<T> {
  map<U>(name: string, transform: (value: T) => U): Pipeline<U>
  map<U>(transform: (value: T) => U): Pipeline<U>
}
```

#### `.onError(handler)`

Sets an error handler for recovery.

```typescript
interface Pipeline<T> {
  onError(handler: (error: Error, stepName?: string) => Promise<Result<T>> | Result<T>): Pipeline<T>
}
```

#### `.onProgress(callback)`

Sets a progress tracking callback.

```typescript
interface Pipeline<T> {
  onProgress(callback: (stepName: string, progress: number, total: number) => void): Pipeline<T>
}
```

#### `.withAbortSignal(signal)`

Sets an abort signal for cancellation support.

```typescript
interface Pipeline<T> {
  withAbortSignal(signal: AbortSignal): Pipeline<T>
}
```

#### `.execute()`

Executes the pipeline and returns the final result.

```typescript
interface Pipeline<T> {
  execute(): Promise<Result<T>>
}
```

## Parallel Execution

### `parallel(operations)`

Executes operations in parallel with fail-fast behavior.

```typescript
// Array syntax
function parallel<T>(operations: Array<() => Promise<Result<T>>>): Promise<Result<T[]>>

// Object syntax
function parallel<T extends Record<string, any>>(operations: {
  [K in keyof T]: () => Promise<Result<T[K]>>
}): Promise<Result<T>>
```

### `parallelSettled(operations)`

Executes operations in parallel with failure tolerance.

```typescript
// Array syntax
function parallelSettled<T>(
  operations: Array<() => Promise<Result<T>>>
): Promise<Result<SettledResults<T>>>

// Object syntax
function parallelSettled<T extends Record<string, any>>(operations: {
  [K in keyof T]: () => Promise<Result<T[K]>>
}): Promise<Result<SettledObjectResults<T>>>

interface SettledResults<T> {
  successes: T[]
  failures: Error[]
}

interface SettledObjectResults<T> {
  successes: Partial<T>
  failures: Record<string, Error>
}
```

### `retryPipeline(pipelineFactory, options)`

Retries a pipeline with exponential backoff.

```typescript
function retryPipeline<T>(
  pipelineFactory: () => Pipeline<T>,
  options?: RetryOptions
): Promise<Result<T>>

interface RetryOptions {
  maxAttempts?: number // Default: 3
  baseDelay?: number // Default: 1000ms
  maxDelay?: number // Default: 30000ms
  backoffFactor?: number // Default: 2
  onRetry?: (attempt: number, error: Error) => void
}
```

## Error Templates

### Standard Error Templates

Access pre-defined error templates via the `errorTemplates` object:

#### File System Errors

```typescript
errorTemplates.fileNotFound(filePath: string, suggestion?: string): Error
errorTemplates.directoryNotFound(dirPath: string): Error
errorTemplates.fileAlreadyExists(filePath: string): Error
errorTemplates.permissionDenied(filePath: string, operation: string): Error
errorTemplates.diskSpaceFull(filePath: string): Error
```

#### Validation Errors

```typescript
errorTemplates.requiredFieldMissing(fieldName: string): Error
errorTemplates.invalidFormat(
  fieldName: string,
  expectedFormat: string,
  actualValue?: string
): Error
errorTemplates.valueOutOfRange(
  fieldName: string,
  min: number,
  max: number,
  actualValue?: number
): Error
errorTemplates.invalidChoice(
  fieldName: string,
  validChoices: string[],
  actualValue?: string
): Error
```

#### Network Errors

```typescript
errorTemplates.connectionTimeout(url: string, timeoutMs: number): Error
errorTemplates.connectionRefused(url: string): Error
errorTemplates.notFound(url: string): Error
errorTemplates.unauthorized(url: string): Error
errorTemplates.rateLimited(url: string, retryAfter?: number): Error
```

#### Configuration Errors

```typescript
errorTemplates.configFileMissing(configPath: string): Error
errorTemplates.configFileInvalid(configPath: string, parseError?: string): Error
errorTemplates.configValueInvalid(
  key: string,
  value: any,
  expectedType: string
): Error
```

#### Execution Errors

```typescript
errorTemplates.commandNotFound(command: string): Error
errorTemplates.commandFailed(
  command: string,
  exitCode: number,
  stderr?: string
): Error
errorTemplates.processTimeout(command: string, timeoutMs: number): Error
```

#### Operation Errors

```typescript
errorTemplates.operationCancelled(operationName: string): Error
errorTemplates.operationTimeout(operationName: string, timeoutMs: number): Error
errorTemplates.operationFailed(operationName: string, reason: string): Error
```

#### Parse Errors

```typescript
errorTemplates.parseFailure(
  format: string,
  filePath?: string,
  parseError?: string
): Error
errorTemplates.unsupportedFormat(format: string, supportedFormats: string[]): Error
```

### Custom Error Templates

#### `createErrorTemplate(code, category, messageTemplate, factory)`

Creates a custom error template.

```typescript
function createErrorTemplate<T extends any[]>(
  code: string,
  category: ErrorCategory,
  messageTemplate: string,
  factory: (...args: T) => ErrorDetails
): ErrorTemplate<T>

type ErrorCategory =
  | 'filesystem'
  | 'validation'
  | 'network'
  | 'configuration'
  | 'execution'
  | 'operation'
  | 'parse'
  | 'authentication'
  | 'user-input'
  | 'dependency'

interface ErrorDetails {
  code: string
  category: ErrorCategory
  message: string
  suggestion?: string
  recoverable?: boolean
  [key: string]: any
}
```

#### `ErrorTemplateRegistry`

Registry for managing custom error templates.

```typescript
class ErrorTemplateRegistry {
  register<T extends any[]>(name: string, template: ErrorTemplate<T>): void

  get(name: string): ErrorTemplate<any> | undefined

  has(name: string): boolean

  list(): string[]
}
```

#### `globalErrorTemplates`

Global registry instance for application-wide custom templates.

```typescript
const globalErrorTemplates: ErrorTemplateRegistry
```

## Type Definitions

### StepFunction

```typescript
type StepFunction<T> = (value: T) => Promise<Result<T>> | Result<T>
```

### PipelineOptions

```typescript
interface PipelineOptions {
  abortSignal?: AbortSignal
  onProgress?: (step: string, progress: number, total: number) => void
  onError?: (error: Error, stepName?: string) => Promise<Result<any>> | Result<any>
}
```

### ErrorTemplate

```typescript
interface ErrorTemplate<T extends any[]> {
  code: string
  category: ErrorCategory
  messageTemplate: string
  create(...args: T): Error
}
```

## Examples

### Basic Pipeline

```typescript
const result = await pipeline({ data: 'input' })
  .step('Parse', async (ctx) => {
    const parsed = JSON.parse(ctx.data)
    return Ok({ ...ctx, parsed })
  })
  .step('Validate', async (ctx) => {
    if (!ctx.parsed.required) {
      return Err(errorTemplates.requiredFieldMissing('required'))
    }
    return Ok(ctx)
  })
  .step('Process', async (ctx) => {
    const processed = await processData(ctx.parsed)
    return Ok({ ...ctx, processed })
  })
  .execute()
```

### Parallel Processing

```typescript
const result = await parallel({
  users: () => fetchUsers(),
  posts: () => fetchPosts(),
  comments: () => fetchComments(),
})

if (result.success) {
  const { users, posts, comments } = result.value
  // All operations succeeded
}
```

### Error Recovery

```typescript
const result = await pipeline(data)
  .step('Risky operation', riskyOperation)
  .onError(async (error, stepName) => {
    if (error.code === 'NETWORK_TIMEOUT') {
      // Try fallback
      return Ok(cachedData)
    }
    return Err(error)
  })
  .execute()
```

### Custom Error Template

```typescript
const apiErrorTemplate = createErrorTemplate(
  'API_RATE_LIMIT',
  'network',
  'API rate limit exceeded',
  (endpoint: string, resetTime: Date) => ({
    code: 'API_RATE_LIMIT',
    category: 'network',
    message: `Rate limit exceeded for ${endpoint}`,
    endpoint,
    resetTime,
    suggestion: `Wait until ${resetTime.toISOString()} before retrying`,
    recoverable: true,
  })
)

globalErrorTemplates.register('apiRateLimit', apiErrorTemplate)

// Usage
const error = globalErrorTemplates.get('apiRateLimit')?.create('/api/users', new Date())
```

## Performance Notes

- Pipelines add minimal overhead compared to manual error checking
- Parallel operations use Promise.all/Promise.allSettled internally
- Error templates are created lazily for better performance
- AbortSignal support prevents resource leaks

## Compatibility

- Fully backward compatible with manual Result checking
- Can mix pipeline and non-pipeline code
- Error templates work with any error handling approach

## See Also

- [Core API Reference](./core.md) - Result types and utilities
- [Using Result Pipelines](../how-to/use-result-pipelines.md) - Practical guide
- [Migration Guide](../how-to/migrate-to-pipelines.md) - Upgrading existing code
