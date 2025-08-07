---
type: reference
title: 'Core Package API Reference'
description: 'Complete API reference for Result types, error handling, functional composition, and core utilities used across all Trailhead packages'
related:
  - /docs/reference/core-api
  - /docs/explanation/result-types-pattern
  - /docs/how-to/apply-functional-patterns
---

# Core Package API Reference

Complete API reference for `@esteban-url/core` package providing foundational Result types, error handling, functional programming utilities, and core utilities for the Trailhead ecosystem.

## Core Types

### `Result<T, E>`

The fundamental Result type from neverthrow, representing either success (`Ok<T>`) or failure (`Err<E>`).

```typescript
type Result<T, E> = Ok<T> | Err<E>
```

**Type Parameters**:

- `T` - The success value type
- `E` - The error type

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

### `CoreError`

**⚠️ BREAKING CHANGE**: The standardized error interface with required fields for enhanced debugging.

```typescript
interface CoreError {
  readonly type: string
  readonly code: string // REQUIRED (Breaking Change)
  readonly message: string
  readonly details?: string
  readonly cause?: unknown
  readonly suggestion?: string
  readonly recoverable: boolean
  readonly context?: Record<string, unknown>
  readonly component: string // REQUIRED (Breaking Change)
  readonly operation: string // REQUIRED (Breaking Change)
  readonly timestamp: Date // REQUIRED (Breaking Change)
  readonly severity: 'low' | 'medium' | 'high' | 'critical' // REQUIRED (Breaking Change)
}
```

**Properties**:

- `type` - Error classification (e.g., 'ValidationError', 'FileSystemError')
- `code` - **REQUIRED** Machine-readable error code (e.g., 'VALIDATION_FAILED')
- `message` - Human-readable error message
- `details` - Optional additional error details
- `cause` - Original error that caused this error
- `suggestion` - Optional suggestion for resolving the error
- `recoverable` - Whether the error can be recovered from
- `context` - Additional context data for debugging
- `component` - **REQUIRED** Component that generated the error
- `operation` - **REQUIRED** Operation that failed
- `timestamp` - **REQUIRED** When the error occurred
- `severity` - **REQUIRED** Error severity level

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

### `errAsync<E>(error: E): ResultAsync<never, E>`

Creates a failed asynchronous Result.

## Error Factory Functions

### `createCoreError()`

**⚠️ BREAKING CHANGE**: Creates a standardized CoreError with enhanced type safety.

```typescript
function createCoreError(
  type: string,
  code: string,
  message: string,
  options?: {
    component?: string // Defaults to 'unknown'
    operation?: string // Defaults to 'unknown'
    severity?: 'low' | 'medium' | 'high' | 'critical' // Defaults to 'medium'
    details?: string
    cause?: unknown
    suggestion?: string
    recoverable?: boolean // Defaults to false
    context?: Record<string, unknown>
  }
): CoreError
```

**Parameters**:

- `type` - Error type classification
- `code` - **REQUIRED** Machine-readable error code
- `message` - Human-readable error message
- `options` - Optional error properties with defaults

**Returns**: `CoreError` with required fields auto-populated

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
- `defaultSeverity` - Default severity level (defaults to 'medium')

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
const createDataError: (
  type: string,
  code: string,
  message: string,
  options?: ErrorFactoryOptions
) => CoreError
```

### `createFileSystemError()`

Factory for filesystem operation errors.

```typescript
const createFileSystemError: (
  type: string,
  code: string,
  message: string,
  options?: ErrorFactoryOptions
) => CoreError
```

### `createValidationError()`

Factory for validation errors.

```typescript
const createValidationError: (
  type: string,
  code: string,
  message: string,
  options?: ErrorFactoryOptions
) => CoreError
```

### `createConfigError()`

Factory for configuration errors.

```typescript
const createConfigError: (
  type: string,
  code: string,
  message: string,
  options?: ErrorFactoryOptions
) => CoreError
```

### `createGitError()`

Factory for Git operation errors.

```typescript
const createGitError: (
  type: string,
  code: string,
  message: string,
  options?: ErrorFactoryOptions
) => CoreError
```

### `createCliError()`

Factory for CLI-related errors.

```typescript
const createCliError: (
  type: string,
  code: string,
  message: string,
  options?: ErrorFactoryOptions
) => CoreError
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
const getErrorMessage = (error: unknown, defaultMessage?: string): string => {
```

**Parameters**:

- `error` - Any error value
- `defaultMessage` - Fallback message (default: 'Unknown error')

**Returns**: Human-readable error message

### `isRecoverableError()`

Checks if an error is recoverable.

```typescript
const isRecoverableError = (error: { recoverable?: boolean }): boolean => {
```

**Parameters**:

- `error` - Error object to check

**Returns**: `true` if error is recoverable

### `getErrorType()`

Extracts error type for pattern matching.

```typescript
const getErrorType = (error: { type?: string }): string => {
```

**Parameters**:

- `error` - Error object to check

**Returns**: Error type string or 'unknown'

### `getErrorCategory()`

Extracts error category for categorization.

```typescript
const getErrorCategory = (error: { category?: string }): string => {
```

**Parameters**:

- `error` - Error object to check

**Returns**: Error category string or 'unknown'

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

## Performance-Optimized Type Guards

### `isDefined()`

**⚠️ Performance-Optimized**: Type guard for checking if a value is defined (not null or undefined).

```typescript
function isDefined<T>(value: T | null | undefined): value is T
```

### `isNonEmptyString()`

**⚠️ Performance-Optimized**: Type guard for non-empty strings with zero-overhead validation.

```typescript
const isNonEmptyString = (value: unknown): value is string => {
```

### `isObject()`

**⚠️ Performance-Optimized**: Type guard for objects (excluding arrays and null) with V8 optimizations.

```typescript
const isObject = (value: unknown): value is Record<string, unknown> => {
```

### `isNonEmptyArray()`

**⚠️ Performance-Optimized**: Type guard for non-empty arrays with frequent validation optimization.

```typescript
function isNonEmptyArray<T>(value: unknown): value is T[]
```

### `hasErrorShape()`

**⚠️ Performance-Optimized**: Type guard for error-like objects with production-optimized error checking.

```typescript
const hasErrorShape = (value: unknown): value is { type: string; message: string } => {
```

## Advanced Type Utilities

### `IsValidInput<T>`

Compile-time conditional validation using TypeScript's conditional types for zero runtime overhead.

```typescript
export type IsValidInput<T> = T extends string
  ? T extends ''
    ? false
    : true
  : T extends unknown[]
    ? T extends []
      ? false
      : true
    : T extends null | undefined
      ? false
      : true
```

## Error Mapping Utilities

### `mapNodeError()`

Maps Node.js errors to CoreError format.

```typescript
const mapNodeError = (component: string, operation: string, path: string, error: unknown): CoreError => {
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

## Functional Programming Utilities

### `pipe()`

Function composition utility from fp-ts.

```typescript
const pipe: <A, B, C, D, E, F, G, H, I, J>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J
) => J
```

### `flow()`

Function composition utility from fp-ts.

```typescript
const flow: <A, B, C, D, E, F, G, H, I, J>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J
) => (a: A) => J
```

### `identity()`

Identity function.

```typescript
const identity: <A>(a: A) => A
```

### `constant()`

Constant function.

```typescript
const constant: <A>(a: A) => () => A
```

### `composeResult()`

Compose functions that return Result types using fp-ts patterns.

```typescript
const composeResult: <A, B, C, E>(
  f: (b: B) => Result<C, E>,
  g: (a: A) => Result<B, E>
) => (a: A) => Result<C, E>
```

### `composeResultAsync()`

Async composition for ResultAsync types.

```typescript
const composeResultAsync: <A, B, C, E>(
  f: (b: B) => ResultAsync<C, E>,
  g: (a: A) => ResultAsync<B, E>
) => (a: A) => ResultAsync<C, E>
```

### `tap()`

Tap function for side effects.

```typescript
const tap: <T>(fn: (value: T) => void) => (value: T) => T
```

## Async Utilities

### `fromPromiseAsync`

Alias for `fromPromise` for async operations.

```typescript
const fromPromiseAsync: typeof fromPromise
```

### `fromThrowableAsync`

Converts a function to async Result-returning function.

```typescript
const fromThrowableAsync: <Fn extends (...args: any[]) => any>(
  fn: Fn,
  errorFn?: (error: unknown) => unknown
) => (...args: Parameters<Fn>) => ResultAsync<ReturnType<Fn>, unknown>
```

### `fromThrowableAsyncFunc`

Converts an async function to Result-returning function.

```typescript
const fromThrowableAsyncFunc: <Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
  errorFn?: (error: unknown) => unknown
) => (...args: Parameters<Fn>) => ResultAsync<Awaited<ReturnType<Fn>>, unknown>
```

## Color Utilities

### `chalk`

Chalk color utility instance.

```typescript
const chalk: Chalk
```

### Color Functions

```typescript
const success: (text: string) => string
const error: (text: string) => string
const warning: (text: string) => string
const info: (text: string) => string
const muted: (text: string) => string
const bold: (text: string) => string
const dim: (text: string) => string
const italic: (text: string) => string
const underline: (text: string) => string
```

## Usage Examples

### Basic Error Handling

```typescript
import { Result, ok, err, CoreError, createCoreError } from '@esteban-url/core'

const processData = (input: string): Result<ProcessedData, CoreError> => {
  if (!input.trim()) {
    return err(
      createCoreError('ValidationError', 'EMPTY_INPUT', 'Input cannot be empty', {
        component: 'data-processor',
        operation: 'validate',
        severity: 'medium',
      })
    )
  }

  try {
    const processed = expensiveOperation(input)
    return ok(processed)
  } catch (error) {
    return err(
      createCoreError('ProcessingError', 'PROCESS_FAILED', 'Processing failed', {
        component: 'data-processor',
        operation: 'process',
        cause: error,
        severity: 'high',
      })
    )
  }
}
```

### Chaining Operations

```typescript
import { pipe } from '@esteban-url/core'

const result = pipe(input, validateInput, processData, transformResult)
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

### Using Error Factories

```typescript
import { createErrorFactory } from '@esteban-url/core'

const createMyModuleError = createErrorFactory('my-module', 'high')

const error = createMyModuleError('ProcessingError', 'INVALID_FORMAT', 'Invalid data format', {
  operation: 'parse',
  details: 'Expected JSON, received XML',
  recoverable: true,
})
```

## Related APIs

- [FileSystem API](../../../fs/reference/api.md) - File operations with Result types
- [Validation API](../../../validation/reference/api.md) - Data validation
- [Data API](../../../data/reference/api.md) - Data processing operations
- [CLI API](../../../cli/reference/api.md) - CLI framework utilities
