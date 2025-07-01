# Error Handling Guide

This guide provides a deep dive into @trailhead/cli's error handling system based on the Result pattern, a functional programming approach that makes errors explicit and composable.

## Table of Contents

1. [Why Result Types?](#why-result-types)
2. [The Result Pattern](#the-result-pattern)
3. [Error Types and Categories](#error-types-and-categories)
4. [Common Patterns](#common-patterns)
5. [Advanced Techniques](#advanced-techniques)
6. [Best Practices](#best-practices)
7. [Migration Guide](#migration-guide)

## Why Result Types?

Traditional error handling with try/catch has several problems:

```typescript
// ❌ Problems with exceptions:
try {
  const data = JSON.parse(jsonString) // Can throw
  const result = await processData(data) // Can throw
  await saveResult(result) // Can throw
  return result
} catch (error) {
  // Which operation failed?
  // What type is error?
  // How do we recover?
  console.error('Something failed:', error)
}
```

Result types solve these issues:

```typescript
// ✅ Benefits of Result types:
const parseResult = parseJSON(jsonString)
if (!parseResult.success) {
  return parseResult // Explicit error propagation
}

const processResult = await processData(parseResult.value)
if (!processResult.success) {
  return processResult // Know exactly where it failed
}

const saveResult = await saveResult(processResult.value)
if (!saveResult.success) {
  return saveResult // Type-safe error handling
}

return ok(processResult.value)
```

### Key Benefits

1. **Explicit Error Handling** - Errors are part of the function signature
2. **Type Safety** - TypeScript knows exactly what errors can occur
3. **Composability** - Chain operations without nested try/catch
4. **No Hidden Control Flow** - No unexpected jumps like with throw
5. **Better Testing** - Easier to test error cases explicitly

## The Result Pattern

### Basic Structure

```typescript
type Result<T, E = CLIError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }
```

### Creating Results

```typescript
import { ok, err } from '@trailhead/cli/core'

// Success case
function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return err(createError({
      code: 'DIVISION_BY_ZERO',
      message: 'Cannot divide by zero',
      recoverable: false
    }))
  }
  return ok(a / b)
}

// Async operations
async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      return err(createNetworkError({
        statusCode: response.status,
        message: `Failed to fetch user: ${response.statusText}`
      }))
    }
    const user = await response.json()
    return ok(user)
  } catch (error) {
    return err(createNetworkError({
      message: 'Network request failed',
      cause: error
    }))
  }
}
```

### Checking Results

```typescript
const result = divide(10, 2)

// Pattern 1: Direct check
if (result.success) {
  console.log('Result:', result.value) // TypeScript knows value exists
} else {
  console.error('Error:', result.error.message) // TypeScript knows error exists
}

// Pattern 2: Type guards
if (isOk(result)) {
  console.log('Result:', result.value)
}

if (isErr(result)) {
  handleError(result.error)
}

// Pattern 3: Early return
const divisionResult = divide(x, y)
if (!divisionResult.success) {
  return divisionResult // Propagate error
}
// TypeScript knows this is safe
const value = divisionResult.value
```

## Error Types and Categories

### Base Error Interface

```typescript
interface CLIError {
  readonly code: string          // Unique error code
  readonly message: string       // Human-readable message
  readonly details?: string      // Additional details
  readonly cause?: unknown       // Original error
  readonly suggestion?: string   // How to fix it
  readonly recoverable: boolean  // Can we recover?
}
```

### Error Categories

Different error types for different scenarios:

```typescript
// Validation errors
const emailError = createValidationError({
  field: 'email',
  value: 'invalid-email',
  message: 'Invalid email format',
  constraints: { pattern: 'email' },
  suggestion: 'Use format: user@example.com'
})

// File system errors
const fileError = createFileSystemError({
  path: '/etc/config.json',
  operation: 'read',
  message: 'Permission denied',
  errno: -13,
  suggestion: 'Run with sudo or change permissions'
})

// Configuration errors
const configError = createConfigurationError({
  configFile: 'app.config.js',
  missingFields: ['apiKey', 'database.url'],
  message: 'Invalid configuration',
  suggestion: 'Add missing fields to your config file'
})

// Network errors
const networkError = createNetworkError({
  url: 'https://api.example.com/users',
  statusCode: 503,
  message: 'Service unavailable',
  suggestion: 'Try again later'
})
```

### Custom Error Types

Create domain-specific error types:

```typescript
interface AuthError extends CLIError {
  readonly category: 'auth'
  readonly authType: 'token' | 'credentials' | 'mfa'
  readonly expired?: boolean
}

function createAuthError(options: {
  authType: AuthError['authType']
  message: string
  expired?: boolean
}): AuthError {
  return {
    code: `AUTH_${options.authType.toUpperCase()}_FAILED`,
    message: options.message,
    category: 'auth',
    authType: options.authType,
    expired: options.expired,
    recoverable: true,
    suggestion: options.expired 
      ? 'Please authenticate again'
      : 'Check your credentials'
  }
}
```

## Common Patterns

### Error Propagation

Propagate errors up the call stack:

```typescript
async function loadUserProfile(userId: string): Promise<Result<Profile>> {
  // Load user
  const userResult = await loadUser(userId)
  if (!userResult.success) {
    return userResult // Propagate error with correct type
  }

  // Load preferences
  const prefsResult = await loadPreferences(userResult.value.id)
  if (!prefsResult.success) {
    return prefsResult // Each error maintains its context
  }

  // Combine into profile
  return ok({
    user: userResult.value,
    preferences: prefsResult.value
  })
}
```

### Error Recovery

Provide fallback values or recovery strategies:

```typescript
async function loadConfigWithFallback(
  path: string,
  defaultConfig: Config
): Promise<Config> {
  const result = await fs.readJson<Config>(path)
  
  if (!result.success) {
    if (result.error.code === 'ENOENT') {
      // File doesn't exist, use default
      logger.info('Config not found, using defaults')
      return defaultConfig
    }
    
    if (result.error.recoverable) {
      // Try recovery
      logger.warning(`Config error: ${result.error.message}`)
      logger.info('Attempting recovery...')
      
      // Create backup and use default
      await fs.copy(path, `${path}.backup`)
      await fs.writeJson(path, defaultConfig)
      return defaultConfig
    }
    
    // Unrecoverable error
    throw new Error(result.error.message)
  }
  
  return result.value
}
```

### Result Transformation

Transform successful values while preserving errors:

```typescript
// Map function for Results
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value))
  }
  return result
}

// Example usage
const numberResult = ok(42)
const stringResult = mapResult(numberResult, n => n.toString())
// stringResult is Result<string>

// Async map
async function mapResultAsync<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> {
  if (result.success) {
    return ok(await fn(result.value))
  }
  return result
}
```

### Result Chaining

Chain multiple operations elegantly:

```typescript
// Result chain helper
class ResultChain<T, E> {
  constructor(private result: Result<T, E>) {}

  map<U>(fn: (value: T) => U): ResultChain<U, E> {
    if (this.result.success) {
      return new ResultChain(ok(fn(this.result.value)))
    }
    return new ResultChain(this.result)
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): ResultChain<U, E> {
    if (this.result.success) {
      return new ResultChain(fn(this.result.value))
    }
    return new ResultChain(this.result)
  }

  async flatMapAsync<U>(
    fn: (value: T) => Promise<Result<U, E>>
  ): Promise<ResultChain<U, E>> {
    if (this.result.success) {
      return new ResultChain(await fn(this.result.value))
    }
    return new ResultChain(this.result)
  }

  unwrap(): Result<T, E> {
    return this.result
  }
}

// Usage
const result = new ResultChain(ok('hello'))
  .map(s => s.toUpperCase())
  .map(s => s.length)
  .flatMap(n => n > 10 ? ok(n) : err(createError({ message: 'Too short' })))
  .unwrap()
```

### Collecting Multiple Results

Handle multiple operations that might fail:

```typescript
// Process all, fail on first error
async function processAllOrFail<T>(
  items: T[],
  processor: (item: T) => Promise<Result<void>>
): Promise<Result<void>> {
  for (const item of items) {
    const result = await processor(item)
    if (!result.success) {
      return result // Fail fast
    }
  }
  return ok(undefined)
}

// Process all, collect errors
async function processAllCollectErrors<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R>>
): Promise<Result<R[], CLIError[]>> {
  const results: R[] = []
  const errors: CLIError[] = []

  for (const item of items) {
    const result = await processor(item)
    if (result.success) {
      results.push(result.value)
    } else {
      errors.push(result.error)
    }
  }

  if (errors.length > 0) {
    return err(errors)
  }
  return ok(results)
}

// Parallel processing with error collection
async function processParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<Result<R>>
): Promise<{ successes: R[], failures: Array<{ item: T, error: CLIError }> }> {
  const results = await Promise.all(
    items.map(async item => ({
      item,
      result: await processor(item)
    }))
  )

  const successes: R[] = []
  const failures: Array<{ item: T, error: CLIError }> = []

  for (const { item, result } of results) {
    if (result.success) {
      successes.push(result.value)
    } else {
      failures.push({ item, error: result.error })
    }
  }

  return { successes, failures }
}
```

## Advanced Techniques

### Error Context Enrichment

Add context as errors propagate:

```typescript
function enrichError<E extends CLIError>(
  error: E,
  context: Partial<CLIError>
): E {
  return {
    ...error,
    ...context,
    message: context.message 
      ? `${context.message}: ${error.message}`
      : error.message
  }
}

// Usage
async function deployApplication(env: string): Promise<Result<void>> {
  const buildResult = await buildApplication()
  if (!buildResult.success) {
    return err(enrichError(buildResult.error, {
      details: `Deployment to ${env} failed during build phase`
    }))
  }

  const uploadResult = await uploadArtifacts(buildResult.value)
  if (!uploadResult.success) {
    return err(enrichError(uploadResult.error, {
      details: `Deployment to ${env} failed during upload phase`
    }))
  }

  return ok(undefined)
}
```

### Result Combinators

Combine multiple Results:

```typescript
// Combine two results
function combine2<A, B, E>(
  resultA: Result<A, E>,
  resultB: Result<B, E>
): Result<[A, B], E> {
  if (!resultA.success) return resultA
  if (!resultB.success) return resultB
  return ok([resultA.value, resultB.value])
}

// Combine array of results
function combineAll<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const values: T[] = []
  
  for (const result of results) {
    if (!result.success) {
      return result
    }
    values.push(result.value)
  }
  
  return ok(values)
}

// Async combinator
async function combineAsync<T, E>(
  ...promises: Promise<Result<T, E>>[]
): Promise<Result<T[], E>> {
  const results = await Promise.all(promises)
  return combineAll(results)
}
```

### Error Aggregation

Aggregate multiple errors into one:

```typescript
interface AggregateError extends CLIError {
  readonly errors: CLIError[]
}

function createAggregateError(errors: CLIError[]): AggregateError {
  const errorMessages = errors.map(e => `- ${e.message}`).join('\n')
  
  return {
    code: 'MULTIPLE_ERRORS',
    message: `Multiple errors occurred:\n${errorMessages}`,
    errors,
    recoverable: errors.every(e => e.recoverable),
    suggestion: errors
      .map(e => e.suggestion)
      .filter(Boolean)
      .join('\n')
  }
}

// Usage with validation
async function validateProject(
  projectPath: string
): Promise<Result<void, AggregateError>> {
  const errors: CLIError[] = []

  // Check package.json
  const pkgResult = await fs.readJson(`${projectPath}/package.json`)
  if (!pkgResult.success) {
    errors.push(createError({
      code: 'MISSING_PACKAGE_JSON',
      message: 'package.json not found',
      suggestion: 'Run npm init to create package.json'
    }))
  }

  // Check source directory
  const srcResult = await fs.exists(`${projectPath}/src`)
  if (!srcResult.success || !srcResult.value) {
    errors.push(createError({
      code: 'MISSING_SRC_DIR',
      message: 'src directory not found',
      suggestion: 'Create src directory for source files'
    }))
  }

  // Check configuration
  const configResult = await fs.exists(`${projectPath}/config.json`)
  if (!configResult.success || !configResult.value) {
    errors.push(createError({
      code: 'MISSING_CONFIG',
      message: 'config.json not found',
      suggestion: 'Create config.json with project settings'
    }))
  }

  if (errors.length > 0) {
    return err(createAggregateError(errors))
  }

  return ok(undefined)
}
```

### Retry Logic with Results

Implement retry logic for recoverable errors:

```typescript
interface RetryOptions {
  maxAttempts: number
  delay: number
  backoff?: number
  shouldRetry?: (error: CLIError) => boolean
}

async function withRetry<T>(
  operation: () => Promise<Result<T>>,
  options: RetryOptions
): Promise<Result<T>> {
  let lastError: CLIError | null = null
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    const result = await operation()
    
    if (result.success) {
      return result
    }
    
    lastError = result.error
    
    // Check if we should retry
    const shouldRetry = options.shouldRetry?.(result.error) ?? result.error.recoverable
    
    if (!shouldRetry || attempt === options.maxAttempts) {
      return err(enrichError(result.error, {
        details: `Failed after ${attempt} attempts`
      }))
    }
    
    // Wait before retry
    const delay = options.delay * Math.pow(options.backoff ?? 1, attempt - 1)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  
  return err(lastError!)
}

// Usage
const result = await withRetry(
  () => fetchDataFromAPI(),
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2, // Exponential backoff
    shouldRetry: (error) => error.code === 'NETWORK_ERROR'
  }
)
```

## Best Practices

### 1. Always Use Result Types

Never throw exceptions in your public API:

```typescript
// ❌ Bad
class UserService {
  async getUser(id: string): Promise<User> {
    const user = await db.query(`SELECT * FROM users WHERE id = ?`, [id])
    if (!user) {
      throw new Error('User not found') // Hidden control flow
    }
    return user
  }
}

// ✅ Good
class UserService {
  async getUser(id: string): Promise<Result<User>> {
    try {
      const user = await db.query(`SELECT * FROM users WHERE id = ?`, [id])
      if (!user) {
        return err(createError({
          code: 'USER_NOT_FOUND',
          message: `User with id ${id} not found`,
          recoverable: false
        }))
      }
      return ok(user)
    } catch (error) {
      return err(createDatabaseError({
        operation: 'query',
        message: 'Failed to fetch user',
        cause: error
      }))
    }
  }
}
```

### 2. Provide Rich Error Information

Include all context needed to understand and fix the error:

```typescript
// ❌ Bad
return err(createError({ message: 'Invalid input' }))

// ✅ Good
return err(createValidationError({
  field: 'email',
  value: input.email,
  message: 'Invalid email format',
  constraints: {
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    maxLength: 255
  },
  suggestion: 'Email should be in format: user@example.com',
  recoverable: true
}))
```

### 3. Use Type Guards Consistently

Always use type guards for type safety:

```typescript
// ❌ Bad
const result = await loadConfig()
if (result.success) {
  console.log(result.value) // TS error in strict mode
}

// ✅ Good
const result = await loadConfig()
if (isOk(result)) {
  console.log(result.value) // Type safe
}

// Or with early return
if (isErr(result)) {
  handleError(result.error)
  return
}
// TypeScript knows result is Ok here
processConfig(result.value)
```

### 4. Design for Error Recovery

Make errors actionable:

```typescript
interface RecoverableError extends CLIError {
  readonly recovery?: () => Promise<Result<void>>
}

async function connectToDatabase(): Promise<Result<Connection>> {
  const result = await tryConnect()
  
  if (!result.success) {
    return err({
      ...result.error,
      recovery: async () => {
        // Try to fix the issue
        if (result.error.code === 'CONNECTION_REFUSED') {
          await startDatabaseServer()
          return ok(undefined)
        }
        return err(createError({ message: 'Cannot recover' }))
      }
    })
  }
  
  return result
}

// Usage with recovery
const dbResult = await connectToDatabase()
if (!dbResult.success && dbResult.error.recovery) {
  const recoveryResult = await dbResult.error.recovery()
  if (recoveryResult.success) {
    // Retry after recovery
    return connectToDatabase()
  }
}
```

### 5. Test Error Cases

Test error paths as thoroughly as success paths:

```typescript
describe('UserService', () => {
  it('should return error when user not found', async () => {
    const result = await userService.getUser('non-existent')
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('USER_NOT_FOUND')
      expect(result.error.recoverable).toBe(false)
    }
  })
  
  it('should handle database errors', async () => {
    // Mock database to throw
    mockDb.query.mockRejectedValue(new Error('Connection lost'))
    
    const result = await userService.getUser('123')
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR')
      expect(result.error.recoverable).toBe(true)
      expect(result.error.cause).toBeDefined()
    }
  })
})
```

## Migration Guide

### From Try/Catch to Results

Transform existing code to use Results:

```typescript
// Before: Using try/catch
async function oldProcessFile(path: string): Promise<ProcessedData> {
  try {
    const content = await fs.readFileSync(path, 'utf8')
    const data = JSON.parse(content)
    validateData(data) // throws on invalid
    return await transformData(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${path}`)
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${path}`)
    }
    if (error instanceof ValidationError) {
      throw new Error(`Invalid data: ${error.message}`)
    }
    throw error
  }
}

// After: Using Results
async function newProcessFile(path: string): Promise<Result<ProcessedData>> {
  // Read file
  const readResult = await fs.readFile(path)
  if (!readResult.success) {
    return err(enrichError(readResult.error, {
      suggestion: `Ensure file exists at ${path}`
    }))
  }

  // Parse JSON
  const parseResult = parseJSON<RawData>(readResult.value)
  if (!parseResult.success) {
    return err(createError({
      code: 'INVALID_JSON',
      message: `Invalid JSON in ${path}`,
      cause: parseResult.error,
      suggestion: 'Check JSON syntax with a validator'
    }))
  }

  // Validate data
  const validateResult = validateData(parseResult.value)
  if (!validateResult.success) {
    return validateResult
  }

  // Transform data
  return transformData(validateResult.value)
}
```

### Gradual Migration Strategy

1. **Start with leaf functions** - Convert innermost functions first
2. **Create Result wrappers** - Wrap external APIs that throw
3. **Update callers** - Work your way up the call stack
4. **Remove try/catch** - Replace with Result handling

```typescript
// Step 1: Wrap throwing functions
function wrapThrowingFunction<T, A extends any[]>(
  fn: (...args: A) => T,
  errorMapper?: (error: unknown) => CLIError
): (...args: A) => Result<T> {
  return (...args: A) => {
    try {
      return ok(fn(...args))
    } catch (error) {
      return err(errorMapper?.(error) ?? createError({
        code: 'WRAPPED_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      }))
    }
  }
}

// Step 2: Create async wrapper
function wrapAsyncThrowingFunction<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  errorMapper?: (error: unknown) => CLIError
): (...args: A) => Promise<Result<T>> {
  return async (...args: A) => {
    try {
      return ok(await fn(...args))
    } catch (error) {
      return err(errorMapper?.(error) ?? createError({
        code: 'WRAPPED_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error
      }))
    }
  }
}

// Usage
const safeReadFile = wrapAsyncThrowingFunction(
  fs.promises.readFile,
  (error: any) => createFileSystemError({
    path: error.path,
    operation: 'read',
    message: error.message,
    errno: error.errno
  })
)
```

## Summary

The Result pattern provides a robust foundation for error handling in CLI applications:

- **Explicit** - Errors are visible in function signatures
- **Composable** - Chain operations without nested error handling
- **Type-safe** - TypeScript ensures proper error handling
- **Testable** - Easy to test both success and failure paths
- **Maintainable** - Clear error propagation and handling

By following these patterns and practices, you'll build more reliable and maintainable CLI applications.