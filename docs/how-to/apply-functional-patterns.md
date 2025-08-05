---
type: how-to
title: 'Apply Functional Programming Patterns'
description: 'Implement functional programming patterns for better maintainability and error handling'
prerequisites:
  - 'Basic TypeScript knowledge'
  - 'Understanding of async/await'
  - 'Familiarity with Result types'
related:
  - /docs/explanation/functional-architecture
  - /docs/explanation/result-types-pattern
  - /docs/how-to/compose-result-operations
  - /packages/cli/docs/tutorials/getting-started.md
---

# Apply Functional Programming Patterns

This guide shows you how to implement key functional programming patterns in Trailhead packages to improve code maintainability, testability, and error handling.

## Prerequisites

Before starting, ensure you have:

- Basic understanding of TypeScript
- Familiarity with Result types (`Ok` and `Err`)
- Understanding of async/await patterns

## Core Functional Concepts

### Immutability

Always return new data instead of modifying existing:

```typescript
// ❌ Mutation
const config = { port: 3000 }
config.port = 4000

// ✅ Immutable
const config = { port: 3000 }
const updated = { ...config, port: 4000 }
```

### Pure Functions

Functions that depend only on inputs and have no side effects:

```typescript
// ✅ Pure - same input always gives same output
const formatName = (first: string, last: string): string => `${first} ${last}`

// ❌ Impure - depends on external state
let count = 0
const getId = (): number => ++count
```

## Result Type Patterns

### Basic Error Handling

```typescript
import { ok, err } from '@repo/core'

async const readConfig = async (path: string): Promise<Result<Config>> => {
  const result = await fs.readFile(path)
  if (result.isErr()) {
    return result // Propagate error
  }

  try {
    const config = JSON.parse(result.value)
    return ok(config)
  } catch (error) {
    return err(new Error(`Invalid JSON: ${error.message}`))
  }
}
```

### Early Returns

Exit early on errors:

```typescript
async const processFile = async (path: string): Promise<Result<void>> => {
  // Read file
  const readResult = await fs.readFile(path)
  if (readResult.isErr()) return readResult

  // Parse content
  const parseResult = parseContent(readResult.value)
  if (parseResult.isErr()) return parseResult

  // Save processed content
  return fs.writeFile(path + '.processed', parseResult.value)
}
```

## Composition Patterns

### Function Composition

Build complex operations from simple functions:

```typescript
const compose =
  <A, B, C>(f: (b: B) => C, g: (a: A) => B) =>
  (a: A): C =>
    f(g(a))

// Example: Format and validate
const trim = (s: string) => s.trim()
const lowercase = (s: string) => s.toLowerCase()
const normalizeEmail = compose(lowercase, trim)

normalizeEmail('  USER@EXAMPLE.COM  ') // "user@example.com"
```

### Pipeline Pattern

Process data through a series of transformations:

```typescript
const pipe =
  <T>(...fns: Array<(value: T) => T>) =>
  (initial: T): T =>
    fns.reduce((value, fn) => fn(value), initial)

// Example: Text processing pipeline
const processText = pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\s+/g, '-')
)

processText('  Hello World  ') // "hello-world"
```

## Higher-Order Functions

### Function Factories

Create specialized functions:

```typescript
// Validator factory
const createRangeValidator = (min: number, max: number) => {
  return (value: number): Result<number> => {
    if (value < min || value > max) {
      return err(new Error(`Value must be between ${min} and ${max}`))
    }
    return ok(value)
  }
}

const validatePort = createRangeValidator(1, 65535)
const validatePercentage = createRangeValidator(0, 100)
```

### Middleware Pattern

Wrap functions with additional behavior:

```typescript
// Logging middleware
const withLogging = <T, R>(fn: (arg: T) => Promise<Result<R>>, logger: Logger) => {
  return async (arg: T): Promise<Result<R>> => {
    logger.info(`Calling with: ${JSON.stringify(arg)}`)
    const result = await fn(arg)
    if (result.isOk()) {
      logger.success('Operation succeeded')
    } else {
      logger.error(`Operation failed: ${result.error.message}`)
    }
    return result
  }
}
```

## Array Operations with Results

### Processing Arrays

```typescript
// Process array of Results
async const processFiles = async (paths: string[]): Promise<Result<string[]>> => {
  const results = await Promise.all(paths.map((path) => fs.readFile(path)))

  // Check if all succeeded
  const errors = results.filter((r) => r.isErr())
  if (errors.length > 0) {
    return err(new Error(`Failed to read ${errors.length} files`))
  }

  // Extract values
  const contents = results.map((r) => (r as Ok<string>).value)
  return ok(contents)
}
```

### Collecting Results

```typescript
// Collect Results into Result of array
function collectResults<T>(results: Result<T>[]): Result<T[]> {
  const values: T[] = []

  for (const result of results) {
    if (result.isErr()) {
      return result
    }
    values.push(result.value)
  }

  return ok(values)
}
```

## Partial Application

Create specialized functions by fixing some arguments:

```typescript
// Generic file reader
const readFileWithEncoding = (encoding: string) => (path: string) => fs.readFile(path, { encoding })

// Specialized readers
const readUTF8 = readFileWithEncoding('utf8')
const readUTF16 = readFileWithEncoding('utf16le')

// Usage
const content = await readUTF8('config.json')
```

## Common Issues

### Issue: Mixing imperative and functional styles

**Symptoms**: Code that's hard to test, inconsistent error handling, side effects scattered throughout

**Solution**: Use consistent functional patterns throughout your codebase:

```typescript
// ❌ Mixed styles
const processData = (data: any[]) => {
  let results = []
  for (let item of data) {
    try {
      results.push(transform(item))
    } catch (error) {
      console.error(error) // Side effect
      return null // Inconsistent return
    }
  }
  return results
}

// ✅ Consistent functional style
const processData = (data: any[]): Result<TransformedData[]> => {
  const results = data.map((item) => transform(item))
  return collectResults(results)
}
```

### Issue: Not leveraging Result types properly

**Cause**: Using try/catch instead of Result types for error handling

**Solution**: Always use Result types for operations that can fail:

```typescript
// ❌ Exception-based
try {
  const data = await processFile(path)
  return data
} catch (error) {
  throw new Error(`Processing failed: ${error.message}`)
}

// ✅ Result-based
const result = await processFile(path)
if (result.isErr()) {
  return err(new Error(`Processing failed: ${result.error.message}`))
}
return ok(result.value)
```

## Package-Specific Examples

### Using with @repo/fs

```typescript
import { fs } from '@repo/fs'
import { pipe } from '@repo/core'

// Functional file processing
const processConfig = pipe(
  (path: string) => fs.readJson(path),
  (result) => (result.isErr() ? result : validateConfig(result.value)),
  (result) => (result.isErr() ? result : fs.writeJson('./processed.json', result.value))
)
```

### Using with @repo/validation

```typescript
import { validate, composeValidators } from '@repo/validation'

// Compose validators functionally
const validateUser = composeValidators(validate.required, validate.email, (email: string) =>
  email.endsWith('@company.com') ? ok(email) : err(new Error('Must be company email'))
)
```

### Using with @repo/data

```typescript
import { data } from '@repo/data'

// Functional data pipeline
const processCSV = async (path: string) => {
  const result = await data.parseAuto(path)

  return result.isErr()
    ? result
    : ok(result.value.data.filter((row) => row.active).map((row) => ({ ...row, processed: true })))
}
```

## Testing Functional Code

Functional code is inherently easier to test:

```typescript
import { describe, it, expect } from 'vitest'

describe('normalizeEmail', () => {
  it('trims and lowercases email', () => {
    expect(normalizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com')
  })
})

describe('validatePort', () => {
  it('accepts valid ports', () => {
    const result = validatePort(8080)
    expect(result.isOk()).toBe(true)
  })

  it('rejects invalid ports', () => {
    const result = validatePort(70000)
    expect(result.isErr()).toBe(true)
  })
})
```

## Related Documentation

- [Result Types Pattern](../explanation/result-types-pattern.md)- Understanding Result types
- [Functional Architecture](../explanation/functional-architecture.md)- Why functional programming
- [Package Ecosystem](../explanation/package-ecosystem.md)- How packages work together
