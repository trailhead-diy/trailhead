---
type: how-to
title: 'Compose Result Operations'
description: 'Chain and compose operations that return Result types'
prerequisites:
  - 'Understanding of Result types'
  - 'Basic async/await knowledge'
  - 'Functional programming basics'
related:
  - ../explanation/result-types-pattern.md
  - ./apply-functional-patterns.md
  - ./handle-errors.md
---

# Compose Result Operations

This guide shows you how to compose operations that return Result types, eliminating repetitive error checking and creating more maintainable code.

## Basic Composition Patterns

### Sequential Operations

Chain operations where each depends on the previous:

```typescript
import { ok, err } from '@repo/core'

// Manual error checking (verbose)
async function processData(input: string): Promise<Result<ProcessedData>> {
  const parseResult = await parseJSON(input)
  if (parseResult.isErr()) {
    return err(new Error(`Parse failed: ${parseResult.error.message}`))
  }

  const validateResult = await validateData(parseResult.value)
  if (validateResult.isErr()) {
    return err(new Error(`Validation failed: ${validateResult.error.message}`))
  }

  const transformResult = await transformData(validateResult.value)
  if (transformResult.isErr()) {
    return err(new Error(`Transform failed: ${transformResult.error.message}`))
  }

  return transformResult
}
```

### Using Helper Functions

Create reusable composition helpers:

```typescript
// Generic Result chain helper
async function chain<T, R>(
  result: Promise<Result<T>>,
  fn: (value: T) => Promise<Result<R>>
): Promise<Result<R>> {
  const res = await result
  if (res.isErr()) return res
  return fn(res.value)
}

// Usage
async function processData(input: string): Promise<Result<ProcessedData>> {
  return chain(chain(parseJSON(input), validateData), transformData)
}
```

## Functional Composition

### Map for Synchronous Transforms

Transform successful values without changing the Result container:

```typescript
function map<T, R>(result: Result<T>, fn: (value: T) => R): Result<R> {
  return result.isOk() ? ok(fn(result.value)) : result
}

// Usage
const result = await readFile('data.json')
const uppercased = map(result, (content) => content.toUpperCase())
```

### FlatMap for Operations Returning Results

Chain operations that return new Results:

```typescript
async function flatMap<T, R>(
  result: Result<T>,
  fn: (value: T) => Promise<Result<R>>
): Promise<Result<R>> {
  return result.isErr() ? result : fn(result.value)
}

// Usage
const result = await flatMap(await readFile('config.json'), (content) => parseJSON(content))
```

## Parallel Operations

### Process Multiple Results

Handle arrays of Results:

```typescript
// Check if all operations succeeded
function allOk<T>(results: Result<T>[]): Result<T[]> {
  const values: T[] = []

  for (const result of results) {
    if (result.isErr()) return result
    values.push(result.value)
  }

  return ok(values)
}

// Usage
const fileResults = await Promise.all(filePaths.map((path) => fs.readFile(path)))
const allFiles = allOk(fileResults)
```

### Parallel with Partial Success

Continue even if some operations fail:

```typescript
interface SettledResults<T> {
  successes: T[]
  failures: Error[]
}

function settleResults<T>(results: Result<T>[]): Result<SettledResults<T>> {
  const successes: T[] = []
  const failures: Error[] = []

  for (const result of results) {
    if (result.isOk()) {
      successes.push(result.value)
    } else {
      failures.push(result.error)
    }
  }

  return ok({ successes, failures })
}
```

## Error Recovery

### Fallback Values

Provide defaults for failed operations:

```typescript
function withDefault<T>(result: Result<T>, defaultValue: T): T {
  return result.isOk() ? result.value : defaultValue
}

// Usage
const config = withDefault(await loadConfig(), { theme: 'light', language: 'en' })
```

### Try Alternative Operations

Attempt fallback operations on failure:

```typescript
async function orElse<T>(
  primary: () => Promise<Result<T>>,
  fallback: () => Promise<Result<T>>
): Promise<Result<T>> {
  const result = await primary()
  return result.isOk() ? result : fallback()
}

// Usage
const data = await orElse(
  () => fetchFromAPI(),
  () => loadFromCache()
)
```

## Creating Pipeline Functions

Build reusable pipeline utilities:

```typescript
class ResultPipeline<T> {
  constructor(private value: Promise<Result<T>>) {}

  then<R>(fn: (value: T) => Promise<Result<R>>): ResultPipeline<R> {
    return new ResultPipeline(
      this.value.then((result) => (result.isErr() ? result : fn(result.value)))
    )
  }

  map<R>(fn: (value: T) => R): ResultPipeline<R> {
    return new ResultPipeline(
      this.value.then((result) => (result.isOk() ? ok(fn(result.value)) : result))
    )
  }

  async execute(): Promise<Result<T>> {
    return this.value
  }
}

// Helper to start pipeline
function pipeline<T>(value: T): ResultPipeline<T> {
  return new ResultPipeline(Promise.resolve(ok(value)))
}

// Usage
const result = await pipeline('input.json')
  .then(readFile)
  .then(parseJSON)
  .map((data) => ({ ...data, processed: true }))
  .then(validate)
  .execute()
```

## Real-World Examples

### File Processing

```typescript
import { fs } from '@repo/fs'
import { data } from '@repo/data'

async function processDataFile(inputPath: string): Promise<Result<void>> {
  // Read file
  const contentResult = await fs.readFile(inputPath)
  if (contentResult.isErr()) return contentResult

  // Parse data
  const dataResult = await data.parseAuto(contentResult.value)
  if (dataResult.isErr()) return dataResult

  // Transform
  const transformed = dataResult.value.data
    .filter((row) => row.active)
    .map((row) => ({ ...row, processed: true }))

  // Save result
  return fs.writeJson(`${inputPath}.processed`, transformed)
}
```

### API Request Chain

```typescript
async function fetchUserData(userId: string): Promise<Result<UserData>> {
  // Authenticate
  const authResult = await authenticate()
  if (authResult.isErr()) return authResult

  // Fetch user
  const userResult = await fetchUser(userId, authResult.value.token)
  if (userResult.isErr()) return userResult

  // Fetch additional data in parallel
  const [postsResult, friendsResult] = await Promise.all([
    fetchPosts(userId, authResult.value.token),
    fetchFriends(userId, authResult.value.token),
  ])

  // Combine results
  if (postsResult.isErr()) return postsResult
  if (friendsResult.isErr()) return friendsResult

  return ok({
    user: userResult.value,
    posts: postsResult.value,
    friends: friendsResult.value,
  })
}
```

## Best Practices

### 1. Early Returns

Exit as soon as an error occurs:

```typescript
async function process(input: string): Promise<Result<Output>> {
  const step1 = await operation1(input)
  if (step1.isErr()) return step1

  const step2 = await operation2(step1.value)
  if (step2.isErr()) return step2

  return operation3(step2.value)
}
```

### 2. Type Narrowing

Use TypeScript's type system:

```typescript
const result = await operation()

if (result.isOk()) {
  // TypeScript knows result.value exists
  console.log(result.value)
} else {
  // TypeScript knows result.error exists
  console.error(result.error)
}
```

### 3. Descriptive Errors

Add context to errors when propagating:

```typescript
const result = await parseJSON(input)
if (result.isErr()) {
  return err(new Error(`Failed to parse config file: ${result.error.message}`))
}
```

## Package Integration

### With @repo/fs

```typescript
import { fs } from '@repo/fs'

// Chain file operations
async function updateConfig(updates: any): Promise<Result<void>> {
  const readResult = await fs.readJson('config.json')
  if (readResult.isErr()) return readResult

  const updated = { ...readResult.value, ...updates }

  return fs.writeJson('config.json', updated)
}
```

### With @repo/validation

```typescript
import { validate } from '@repo/validation'

// Compose validation steps
function validateUser(data: unknown): Result<User> {
  const emailResult = validate.email(data.email)
  if (emailResult.isErr()) return emailResult

  const ageResult = validate.numberRange(18, 120)(data.age)
  if (ageResult.isErr()) return ageResult

  return ok({
    email: emailResult.value,
    age: ageResult.value,
    name: data.name,
  })
}
```

## Related Documentation

- [Result Types Pattern](../explanation/result-types-pattern.md) - Understanding Result types
- [Apply Functional Patterns](./apply-functional-patterns.md) - Functional programming techniques
- [Error Handling](./handle-errors.md) - Error handling strategies
