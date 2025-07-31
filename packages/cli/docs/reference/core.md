---
type: reference
title: 'Core Module API Reference'
description: 'Result types, error handling, and validation utilities from @esteban-url/core'
related:
  - /packages/cli/docs/reference/flow-control.md
  - /docs/how-to/apply-functional-patterns
  - /packages/cli/docs/explanation/design-decisions
---

# Core Module API Reference

Fundamental types and utilities for error handling, validation, and logging.

## Overview

| Property    | Value               |
| ----------- | ------------------- |
| **Package** | `@esteban-url/core` |
| **Module**  | `@esteban-url/core` |
| **Since**   | `v1.0.0`            |

**Note**: The core functionality is provided by the `@esteban-url/core` package, which is a dependency of `@esteban-url/cli`.

## Result Types

### Basic Usage

```typescript
import { ok, err, isOk, isErr } from '@esteban-url/core'
import type { Result } from '@esteban-url/core'
```

### Type Definition

```typescript
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }
```

### Creating Results

#### `ok<T>(value: T): Result<T>`

Creates a successful result.

```typescript
const result = ok(42)
// { success: true, value: 42 }

const voidResult = ok(undefined)
// { success: true, value: undefined }
```

#### `err<E>(error: E): Result<never, E>`

Creates an error result.

```typescript
const result = err(new Error('Something went wrong'))
// { success: false, error: Error }
```

### Type Guards

#### `isOk<T, E>(result: Result<T, E>): result is Ok<T>`

```typescript
if (isOk(result)) {
  console.log(result.value) // TypeScript knows result.value exists
}
```

#### `isErr<T, E>(result: Result<T, E>): result is Err<E>`

```typescript
if (isErr(result)) {
  console.log(result.error.message) // TypeScript knows result.error exists
}
```

### Result Methods

Result objects (from neverthrow) provide methods for transformation and chaining:

#### `.map<U>(fn: (value: T) => U): Result<U, E>`

Transform a successful value:

```typescript
const result = ok(21)
const doubled = result.map((x) => x * 2) // ok(42)

const error = err('error')
const stillError = error.map((x) => x * 2) // err("error")
```

#### `.andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>`

Chain operations that return Results:

```typescript
const result = ok(10)
  .andThen((x) => (x > 0 ? ok(x * 2) : err('negative')))
  .andThen((x) => ok(x + 2)) // ok(22)
```

#### `.match<U>(okFn: (value: T) => U, errFn: (error: E) => U): U`

Pattern match on the Result:

```typescript
const message = result.match(
  (value) => `Success: ${value}`,
  (error) => `Error: ${error.message}`
)
```

#### `._unsafeUnwrap(): T`

Extract the value or throw (use sparingly):

```typescript
const value = ok(42)._unsafeUnwrap() // 42
const error = err(new Error('Oops'))._unsafeUnwrap() // Throws Error
```

### Result Utilities from @esteban-url/core

#### `combine(results: Result<T, E>[]): Result<T[], E>`

Combine multiple Results into a single Result:

```typescript
import { combine } from '@esteban-url/core'

const results = [ok(1), ok(2), ok(3)]
const combined = combine(results) // ok([1, 2, 3])

const withError = [ok(1), err('failed'), ok(3)]
const combinedError = combine(withError) // err('failed')
```

#### `combineWithAllErrors(results: Result<T, E>[]): Result<T[], E[]>`

Combine Results, collecting all errors:

```typescript
import { combineWithAllErrors } from '@esteban-url/core'

const results = [ok(1), err('error1'), err('error2')]
const combined = combineWithAllErrors(results) // err(['error1', 'error2'])
```

## Error Handling

### Error Creation

```typescript
import {
  createCoreError,
  createFileSystemError,
  createValidationError,
  createDataError,
  createCliError,
} from '@esteban-url/core'

// Core error with context
const error = createCoreError('operation_failed', 'Operation failed', {
  operation: 'loadConfig',
  path: './config.json',
})

// Domain-specific errors
const fsError = createFileSystemError('read', './config.json', new Error('ENOENT'))
const validationError = createValidationError('invalid_format', 'Email format invalid')
const dataError = createDataError('parse', 'Invalid JSON in config file')
const cliError = createCliError('command_failed', 'Deploy command failed')
```

### Error Types

#### CLIError

```typescript
interface CLIError extends Error {
  code: string
  details?: unknown
  suggestion?: string
  recoverable?: boolean
}
```

#### Specialized Errors

```typescript
import { fileSystemError, validationError, displayError } from '@esteban-url/trailhead-cli/core'

// File system error
const fsError = fileSystemError({
  path: '/etc/config',
  operation: 'read',
  code: 'EACCES',
})

// Validation error
const valError = validationError({
  field: 'email',
  value: 'invalid',
  message: 'Must be a valid email',
})

// Display formatted error
displayError(error, console.error)
```

## Validation

### Validation Pipeline

```typescript
import { createValidationPipeline } from '@esteban-url/trailhead-cli/core'
import type { ValidationRule } from '@esteban-url/trailhead-cli/core'

const pipeline = createValidationPipeline([
  {
    name: 'required',
    validate: (value) => value != null || 'Value is required',
  },
  {
    name: 'email',
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email',
  },
])

const result = await pipeline.validate('user@example.com')
```

### Built-in Validators

```typescript
import {
  string,
  number,
  boolean,
  array,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  email,
  url,
} from '@esteban-url/trailhead-cli/core'

// String validation
const nameValidator = string().pipe(minLength(2)).pipe(maxLength(50))

// Number validation
const ageValidator = number().pipe(min(0)).pipe(max(150))

// Pattern validation
const usernameValidator = string().pipe(
  pattern(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore')
)
```

## Logging

### Logger Interface

```typescript
interface Logger {
  info(message: string): void
  success(message: string): void
  warning(message: string): void
  error(message: string): void
  debug(message: string): void
}
```

### Logger Creation

```typescript
import {
  createDefaultLogger,
  createSilentLogger,
  createPrefixedLogger,
} from '@esteban-url/trailhead-cli/core'

// Standard console logger with colors
const logger = createDefaultLogger()

// Silent logger for testing
const silent = createSilentLogger()

// Logger with prefix
const prefixed = createPrefixedLogger('[Server]', logger)
prefixed.info('Started') // [Server] Started
```

### Logger Usage

```typescript
logger.info('Processing files...')
logger.success('✓ Completed successfully')
logger.warning('⚠ Deprecation warning')
logger.error('✗ Operation failed')
logger.debug('Debug info (only if verbose)')
```

## Type Reference

### Result Types

```typescript
// Main result type
type Result<T, E = Error> = Ok<T> | Err<E>

// Success variant
type Ok<T> = {
  readonly success: true
  readonly value: T
}

// Error variant
type Err<E> = {
  readonly success: false
  readonly error: E
}
```

### Error Types

```typescript
interface CLIError extends Error {
  code: string
  details?: unknown
  suggestion?: string
  recoverable?: boolean
}

interface FileSystemError extends CLIError {
  path: string
  operation: string
}

interface ValidationError extends CLIError {
  field?: string
  value?: unknown
  constraints?: Record<string, any>
}
```

### Validation Types

```typescript
interface ValidationRule<T> {
  name: string
  validate: (value: T) => boolean | string
}

interface ValidationPipeline<T> {
  validate(value: T): Promise<Result<T>>
  addRule(rule: ValidationRule<T>): ValidationPipeline<T>
}
```

## See Also

- [Error Handling Guide](/packages/cli/docs/how-to/handle-errors-in-cli.md)- Patterns and best practices
- [Functional Patterns](/docs/how-to/apply-functional-patterns.md)- Composition techniques
- [Testing Guide](/packages/cli/docs/how-to/test-cli-applications.md)- Testing with Result types
