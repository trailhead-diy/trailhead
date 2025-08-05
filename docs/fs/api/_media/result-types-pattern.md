---
type: explanation
title: 'Understanding Result Types Pattern'
description: 'Explicit error handling without exceptions using Result types for safer, more predictable code'
related:
  - /docs/explanation/functional-architecture
  - /docs/how-to/compose-result-operations
  - /packages/cli/docs/how-to/handle-errors-in-cli.md
  - /docs/tutorials/file-operations-basics
---

# Understanding Result Types

Result types provide explicit error handling without exceptions, making error paths visible in the type system and encouraging proper error handling.

## Why Result Types?

Traditional error handling in JavaScript relies on exceptions:

```typescript
// Traditional approach - errors are invisible
const parseConfig = (json: string): Config => {
  return JSON.parse(json) // Might throw!
}

// Caller has no idea this could fail
const config = parseConfig(userInput) // 💥 Runtime error
```

Result types make errors explicit:

```typescript
// Result-based approach - errors are visible
const parseConfig = (json: string): Result<Config, ParseError> => {
  try {
    return ok(JSON.parse(json))
  } catch (e) {
    return err(new ParseError(e.message))
  }
}

// Caller must handle the error case
const result = parseConfig(userInput)
if (result.isErr()) {
  console.error('Parse failed:', result.error)
  return
}
const config = result.value // Safe to use
```

## The Result Type

A Result is a discriminated union representing success or failure:

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>

type Ok<T> = {
  isOk(): true
  isErr(): false
  value: T
}

type Err<E> = {
  isOk(): false
  isErr(): true
  error: E
}
```

## Benefits

### 1. Explicit Error Handling

Errors cannot be ignored:

```typescript
const result = await fs.readFile('./config.json')
// TypeScript forces you to check result.isErr()
// before accessing result.value
```

### 2. Composable Operations

Chain operations without nested try-catch:

```typescript
const processFile = (path: string) =>
  fs
    .readFile(path)
    .then((result) => (result.isErr() ? result : parseJson(result.value)))
    .then((result) => (result.isErr() ? result : validateConfig(result.value)))
```

### 3. Type Safety

Error types are preserved through transformations:

```typescript
const transform = (result: Result<string, FileError>): Result<Config, FileError | ParseError> => {
  if (result.isErr()) return result
  return parseConfig(result.value)
}
```

### 4. Better Testing

Test both success and failure paths easily:

```typescript
it('handles missing file', async () => {
  const result = await readConfig('./missing.json')
  expect(result.isErr()).toBe(true)
  expect(result.error.code).toBe('ENOENT')
})
```

## Common Patterns

### Early Return

```typescript
async const processData = async (id: string): Promise<Result<ProcessedData>> => {
  const fetchResult = await fetchData(id)
  if (fetchResult.isErr()) return fetchResult

  const validateResult = validate(fetchResult.value)
  if (validateResult.isErr()) return validateResult

  const transformResult = transform(validateResult.value)
  if (transformResult.isErr()) return transformResult

  return ok(transformResult.value)
}
```

### Collecting Results

```typescript
const results = await Promise.all(files.map((file) => processFile(file)))

const errors = results.filter((r) => r.isErr())
if (errors.length > 0) {
  return err(new AggregateError(errors.map((e) => e.error)))
}

const values = results.map((r) => r.value)
```

### Default Values

```typescript
const config = (await loadConfig('./config.json')).unwrapOr(defaultConfig)
```

## Comparison with Other Approaches

### Try-Catch

- ❌ Errors are invisible in function signatures
- ❌ Easy to forget error handling
- ❌ Difficult to compose
- ✅ Familiar to developers

### Null/Undefined

- ❌ No error information
- ❌ Ambiguous (null vs undefined)
- ✅ Simple for optional values
- ❌ Not suitable for operations that can fail

### Promises

- ✅ Async error handling
- ❌ Sync operations need wrapping
- ❌ catch() loses type information
- ✅ Built into the language

### Result Types

- ✅ Explicit error handling
- ✅ Type-safe error information
- ✅ Composable operations
- ✅ Works for sync and async
- ❌ Requires learning new pattern

## When to Use Result Types

Use Result types when:

- Operations can fail in expected ways
- Error information needs to be preserved
- Building composable APIs
- Type safety is important

Consider alternatives when:

- Errors are truly exceptional
- Working with existing callback/promise APIs
- Simple boolean checks suffice

## Implementation in Trailhead

All Trailhead packages use Result types consistently:

```typescript
// @repo/fs
const result = await fs.readFile('./data.txt')

// @repo/data
const result = await data.parseAuto('./data.csv')

// @repo/validation
const result = validate.email('user@example.com')
```

This consistency allows seamless composition across packages and predictable error handling throughout your application.

## Related Resources

- [Functional Architecture](./functional-architecture)
- [Error Handling Best Practices](../how-to/compose-result-operations)
- [@repo/core API Reference](../reference/core-api)
