---
type: reference
title: 'Core Module API Reference'
description: 'Result types, error handling, and validation utilities from @esteban-url/core'
related:
  - ./flow-control.md
  - /docs/how-to/apply-functional-patterns.md
  - ../explanation/design-decisions.md
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
import { Ok, Err, isOk, isErr } from '@esteban-url/core'
import type { Result } from '@esteban-url/core'
```

### Type Definition

```typescript
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }
```

### Creating Results

#### `Ok<T>(value: T): Result<T>`

Creates a successful result.

```typescript
const result = Ok(42)
// { success: true, value: 42 }

const voidResult = Ok(undefined)
// { success: true, value: undefined }
```

#### `Err<E>(error: E): Result<never, E>`

Creates an error result.

```typescript
const result = Err(new Error('Something went wrong'))
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

### Result Utilities

#### `unwrap<T>(result: Result<T>): T`

Extracts the value or throws the error.

```typescript
const value = unwrap(Ok(42)) // 42
const error = unwrap(Err(new Error('Oops'))) // Throws Error
```

#### `map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U>`

Transforms a successful value.

```typescript
const doubled = map(Ok(21), (x) => x * 2) // Ok(42)
const error = map(Err('error'), (x) => x * 2) // Err("error")
```

#### `chain<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>`

Chains operations that return Results.

```typescript
const result = chain(Ok(10), (x) => (x > 0 ? Ok(x * 2) : Err('negative'))) // Ok(20)
```

## Error Handling

### Error Creation

```typescript
import { createError } from '@esteban-url/trailhead-cli/core'

const error = createError({
  code: 'FILE_NOT_FOUND',
  message: 'Config file not found',
  suggestion: "Run 'init' to create a default config",
  details: { path: './config.json' },
})
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

- [Error Handling Guide](../guides/error-handling.md) - Patterns and best practices
- [Functional Patterns](../guides/functional-patterns.md) - Composition techniques
- [Testing Guide](../how-to/testing-guide.md) - Testing with Result types
