---
type: reference
title: 'Core API Reference - Result Types and Error Handling'
description: 'Complete API reference for Result types, error handling patterns, and core utilities used across all Trailhead packages'
related:
  - /docs/explanation/result-types-pattern.md
  - /docs/how-to/apply-functional-patterns.md
  - /docs/explanation/functional-architecture.md
---

# Core API Reference - Result Types and Error Handling

This reference documents the core types, utilities, and error handling patterns that form the foundation of all Trailhead packages.

## Result Types

### `Result<T, E>`

The fundamental Result type from neverthrow, representing either success (`Ok<T>`) or failure (`Err<E>`).

```typescript
type Result<T, E> = Ok<T> | Err<E>
```

**Type Parameters**:

- `T` - The success value type
- `E` - The error type

**Usage**:

```typescript
import { Result, ok, err } from '@esteban-url/core'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err('Division by zero')
  return ok(a / b)
}
```

### `CoreResult<T>`

Convenience type alias for Result with CoreError.

```typescript
type CoreResult<T> = Result<T, CoreError>
```

### `CoreResultAsync<T>`

Convenience type alias for asynchronous Result operations.

```typescript
type CoreResultAsync<T> = ResultAsync<T, CoreError>
```

## Core Error Types

### `CoreError`

The standardized error interface used across all Trailhead packages.

```typescript
interface CoreError {
  readonly type: string
  readonly code: string
  readonly message: string
  readonly details?: string
  readonly cause?: unknown
  readonly suggestion?: string
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>
  readonly component: string
  readonly operation: string
  readonly timestamp: Date
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}
```

**Properties**:

- `type` - Error classification (e.g., 'ValidationError', 'FileSystemError')
- `code` - Machine-readable error code (e.g., 'VALIDATION_FAILED')
- `message` - Human-readable error message
- `details` - Optional additional error details
- `cause` - Original error that caused this error
- `suggestion` - Optional suggestion for resolving the error
- `recoverable` - Whether the error can be recovered from
- `context` - Additional context data for debugging
- `component` - Component that generated the error
- `operation` - Operation that failed
- `timestamp` - When the error occurred
- `severity` - Error severity level

### `ErrorContext`

Context information for enhanced error debugging.

```typescript
interface ErrorContext {
  readonly operation: string
  readonly component: string
  readonly timestamp: Date
  readonly metadata?: Record<string, unknown>
}
```

## Result Construction Functions

### `ok<T>(value: T): Ok<T>`

Creates a successful Result.

**Parameters**:

- `value` - The success value

**Returns**: `Ok<T>`

**Example**:

```typescript
const result = ok(42)
// result.isOk() === true
// result.value === 42
```

### `err<E>(error: E): Err<E>`

Creates a failed Result.

**Parameters**:

- `error` - The error value

**Returns**: `Err<E>`

**Example**:

```typescript
const result = err('Something went wrong')
// result.isErr() === true
// result.error === 'Something went wrong'
```

### `okAsync<T>(value: T): ResultAsync<T, never>`

Creates a successful asynchronous Result.

**Parameters**:

- `value` - The success value

**Returns**: `ResultAsync<T, never>`

### `errAsync<E>(error: E): ResultAsync<never, E>`

Creates a failed asynchronous Result.

**Parameters**:

- `error` - The error value

**Returns**: `ResultAsync<never, E>`

## Error Factory Functions

### `createCoreError()`

Creates a standardized CoreError with required fields.

```typescript
function createCoreError(
  type: string,
  code: string,
  message: string,
  options?: {
    component?: string
    operation?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    details?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean
    context?: Record<string, unknown>
  }
): CoreError
```

**Parameters**:

- `type` - Error type classification
- `code` - Machine-readable error code
- `message` - Human-readable error message
- `options` - Optional error properties

**Returns**: `CoreError`

**Example**:

```typescript
const error = createCoreError('ValidationError', 'INVALID_INPUT', 'Input validation failed', {
  component: 'user-input',
  operation: 'validate',
  severity: 'medium',
  details: 'Email format is invalid',
  recoverable: true,
})
```

### `createErrorFactory()`

Creates a domain-specific error factory function.

```typescript
function createErrorFactory(
  component: string,
  defaultSeverity?: 'low' | 'medium' | 'high' | 'critical'
): (type: string, code: string, message: string, options?: ErrorFactoryOptions) => CoreError
```

**Parameters**:

- `component` - Default component name for errors
- `defaultSeverity` - Default severity level

**Returns**: Error factory function

**Example**:

```typescript
const createFileError = createErrorFactory('filesystem', 'high')

const readError = createFileError('ReadError', 'FILE_NOT_FOUND', 'Could not read file', {
  operation: 'read',
  details: 'File does not exist: /path/to/file.txt',
})
```

## Pre-built Error Factories

### `createDataError()`

Factory for data processing errors.

```typescript
const createDataError: ErrorFactory
```

### `createFileSystemError()`

Factory for filesystem operation errors.

```typescript
const createFileSystemError: ErrorFactory
```

### `createValidationError()`

Factory for validation errors.

```typescript
const createValidationError: ErrorFactory
```

### `createConfigError()`

Factory for configuration errors.

```typescript
const createConfigError: ErrorFactory
```

### `createGitError()`

Factory for Git operation errors.

```typescript
const createGitError: ErrorFactory
```

### `createCliError()`

Factory for CLI-related errors.

```typescript
const createCliError: ErrorFactory
```

## Error Utility Functions

### `withContext()`

Adds context to an existing error.

```typescript
function withContext<E extends CoreError>(error: E, context: Partial<ErrorContext>): E
```

**Parameters**:

- `error` - The error to enhance
- `context` - Additional context to add

**Returns**: Enhanced error with context

### `chainError()`

Chains errors together for error propagation.

```typescript
function chainError<E extends CoreError>(error: E, cause: CoreError | Error | unknown): E
```

**Parameters**:

- `error` - The current error
- `cause` - The causing error

**Returns**: Error with chained cause

### `getErrorMessage()`

Extracts a human-readable message from any error type.

```typescript
function getErrorMessage(error: unknown, defaultMessage?: string): string
```

**Parameters**:

- `error` - Any error value
- `defaultMessage` - Fallback message (default: 'Unknown error')

**Returns**: Human-readable error message

### `isRecoverableError()`

Checks if an error is recoverable.

```typescript
function isRecoverableError(error: { recoverable?: boolean }): boolean
```

**Parameters**:

- `error` - Error object to check

**Returns**: `true` if error is recoverable

### `getErrorType()`

Extracts error type for pattern matching.

```typescript
function getErrorType(error: { type?: string }): string
```

**Parameters**:

- `error` - Error object to check

**Returns**: Error type string or 'unknown'

## Result Utility Functions

### `combine()`

Combines multiple Results into a single Result.

```typescript
const combine: <T, E>(results: Result<T, E>[]) => Result<T[], E>
```

**Parameters**:

- `results` - Array of Results to combine

**Returns**: Result containing array of success values or first error

**Example**:

```typescript
const results = [ok(1), ok(2), ok(3)]
const combined = combine(results)
// combined.isOk() === true
// combined.value === [1, 2, 3]
```

### `combineWithAllErrors()`

Combines Results, collecting all errors instead of stopping at first.

```typescript
const combineWithAllErrors: <T, E>(results: Result<T, E>[]) => Result<T[], E[]>
```

### `fromThrowable()`

Converts a function that throws into a Result-returning function.

```typescript
function fromThrowable<Fn extends (...args: any[]) => any>(
  fn: Fn,
  errorFn?: (error: unknown) => unknown
): (...args: Parameters<Fn>) => Result<ReturnType<Fn>, unknown>
```

### `fromPromise()`

Converts a Promise into a ResultAsync.

```typescript
function fromPromise<T, E>(promise: Promise<T>, errorFn: (error: unknown) => E): ResultAsync<T, E>
```

### `safeTry()`

Safely executes a function and returns a Result.

```typescript
function safeTry<T>(fn: () => T): Result<T, unknown>
```

## Type Guards

### `isDefined()`

Type guard for checking if a value is defined (not null or undefined).

```typescript
function isDefined<T>(value: T | null | undefined): value is T
```

### `isNonEmptyString()`

Type guard for non-empty strings.

```typescript
function isNonEmptyString(value: unknown): value is string
```

### `isObject()`

Type guard for objects (excluding arrays and null).

```typescript
function isObject(value: unknown): value is Record<string, unknown>
```

### `isNonEmptyArray()`

Type guard for non-empty arrays.

```typescript
function isNonEmptyArray<T>(value: unknown): value is T[]
```

### `hasErrorShape()`

Type guard for error-like objects.

```typescript
function hasErrorShape(value: unknown): value is { type: string; message: string }
```

## Error Mapping Utilities

### `mapNodeError()`

Maps Node.js errors to CoreError format.

```typescript
function mapNodeError(component: string, operation: string, path: string, error: unknown): CoreError
```

### `mapLibraryError()`

Maps third-party library errors to CoreError format.

```typescript
function mapLibraryError(
  component: string,
  library: string,
  operation: string,
  error: unknown
): CoreError
```

### `mapValidationError()`

Maps validation errors to CoreError format.

```typescript
function mapValidationError(
  component: string,
  field: string,
  value: unknown,
  error: unknown
): CoreError
```

## Async Utilities

### `fromPromiseAsync()`

Alias for `fromPromise` for async operations.

```typescript
const fromPromiseAsync: typeof fromPromise
```

### `fromThrowableAsync()`

Converts a function to async Result-returning function.

```typescript
const fromThrowableAsync: <Fn extends (...args: any[]) => any>(
  fn: Fn,
  errorFn?: (error: unknown) => unknown
) => (...args: Parameters<Fn>) => ResultAsync<ReturnType<Fn>, unknown>
```

### `fromThrowableAsyncFunc()`

Converts an async function to Result-returning function.

```typescript
const fromThrowableAsyncFunc: <Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
  errorFn?: (error: unknown) => unknown
) => (...args: Parameters<Fn>) => ResultAsync<Awaited<ReturnType<Fn>>, unknown>
```

## Usage Patterns

### Basic Error Handling

```typescript
import { Result, ok, err, CoreError } from '@esteban-url/core'

function processData(input: string): Result<ProcessedData, CoreError> {
  if (!input.trim()) {
    return err(createDataError('ValidationError', 'EMPTY_INPUT', 'Input cannot be empty'))
  }

  try {
    const processed = expensive_operation(input)
    return ok(processed)
  } catch (error) {
    return err(mapLibraryError('data', 'processor', 'process', error))
  }
}
```

### Chaining Operations

```typescript
const result = await processData(input)
  .andThen(validateData)
  .andThen(transformData)
  .mapErr((error) => withContext(error, { operation: 'full-pipeline' }))
```

### Error Recovery

```typescript
const result = riskyOperation().orElse((error) => {
  if (isRecoverableError(error)) {
    return fallbackOperation()
  }
  return err(error)
})
```

## Related APIs

- **Package-specific APIs**: Each package extends these core patterns
- **Testing utilities**: Enhanced assertions for Result types
- **Logging integration**: Structured error logging support
