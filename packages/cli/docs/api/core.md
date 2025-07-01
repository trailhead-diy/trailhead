# Core Module API Reference

The core module provides fundamental types and utilities for error handling, validation, and logging.

## Import

```typescript
import { ok, err, isOk, isErr } from '@trailhead/cli/core'
import type { Result, CLIError } from '@trailhead/cli/core'
```

## Result Type

The `Result<T, E>` type is the foundation of error handling in @trailhead/cli. It represents either a successful value or an error.

### Type Definition

```typescript
type Result<T, E = CLIError> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E }
```

### Creating Results

#### `ok<T>(value: T): Result<T>`

Creates a successful result.

```typescript
const result = ok(42)
// result: { success: true, value: 42 }

const voidResult = ok(undefined)
// voidResult: { success: true, value: undefined }
```

#### `err<E>(error: E): Result<never, E>`

Creates an error result.

```typescript
const result = err(new Error('Something went wrong'))
// result: { success: false, error: Error }

const customError = err({ 
  code: 'INVALID_INPUT', 
  message: 'Invalid email format' 
})
```

### Checking Results

#### `isOk<T>(result: Result<T>): result is { success: true; value: T }`

Type guard that checks if a result is successful.

```typescript
const result = await someOperation()

if (isOk(result)) {
  console.log(result.value) // TypeScript knows value exists
} else {
  console.error(result.error) // TypeScript knows error exists
}
```

#### `isErr<E>(result: Result<any, E>): result is { success: false; error: E }`

Type guard that checks if a result is an error.

```typescript
const result = await someOperation()

if (isErr(result)) {
  handleError(result.error)
  return
}

processValue(result.value)
```

## Error Types

### CLIError Interface

Base error interface for all CLI errors.

```typescript
interface CLIError {
  readonly code: string
  readonly message: string
  readonly details?: string
  readonly cause?: unknown
  readonly suggestion?: string
  readonly recoverable: boolean
}
```

### Error Categories

Specialized error types for different failure scenarios:

#### ValidationError
```typescript
interface ValidationError extends CLIError {
  readonly category: 'validation'
  readonly field?: string
  readonly value?: unknown
  readonly constraints?: Record<string, unknown>
}

// Example
const error: ValidationError = {
  code: 'VALIDATION_FAILED',
  message: 'Email validation failed',
  field: 'email',
  value: 'invalid-email',
  constraints: { format: 'email' },
  recoverable: true,
  category: 'validation'
}
```

#### FileSystemError
```typescript
interface FileSystemError extends CLIError {
  readonly category: 'filesystem'
  readonly path: string
  readonly operation: 'read' | 'write' | 'delete' | 'create' | 'copy' | 'move' | 'stat'
  readonly errno?: number
}

// Example
const error: FileSystemError = {
  code: 'ENOENT',
  message: 'File not found',
  path: '/path/to/file.json',
  operation: 'read',
  errno: -2,
  recoverable: false,
  category: 'filesystem'
}
```

#### ConfigurationError
```typescript
interface ConfigurationError extends CLIError {
  readonly category: 'configuration'
  readonly configFile?: string
  readonly missingFields?: string[]
  readonly invalidFields?: string[]
}
```

#### ExecutionError
```typescript
interface ExecutionError extends CLIError {
  readonly category: 'execution'
  readonly command?: string
  readonly exitCode?: number
  readonly stdout?: string
  readonly stderr?: string
}
```

## Error Factory Functions

### `createError(options: ErrorOptions): CLIError`

Creates a standardized CLI error.

```typescript
import { createError } from '@trailhead/cli/core'

const error = createError({
  code: 'INVALID_CONFIG',
  message: 'Configuration file is invalid',
  details: 'Missing required field "apiKey"',
  suggestion: 'Add "apiKey" to your config.json file',
  recoverable: true
})
```

### `createValidationError(options: ValidationErrorOptions): ValidationError`

Creates a validation error with field information.

```typescript
const error = createValidationError({
  field: 'port',
  value: 'abc',
  message: 'Port must be a number',
  constraints: { type: 'number', min: 1, max: 65535 }
})
```

### `createFileSystemError(options: FileSystemErrorOptions): FileSystemError`

Creates a file system error with operation context.

```typescript
const error = createFileSystemError({
  path: '/etc/config.json',
  operation: 'write',
  message: 'Permission denied',
  errno: -13,
  suggestion: 'Run with sudo or change file permissions'
})
```

## Validation

### ValidationRule

Represents a single validation rule.

```typescript
interface ValidationRule<T> {
  name: string
  validate: (value: T) => boolean | string
  isAsync?: false
}

interface AsyncValidationRule<T> {
  name: string
  validate: (value: T) => Promise<boolean | string>
  isAsync: true
}
```

### Creating Rules

#### `createRule<T>(name: string, validate: (value: T) => boolean | string): ValidationRule<T>`

Creates a synchronous validation rule.

```typescript
const minLength = createRule('minLength', (value: string) =>
  value.length >= 3 || 'Must be at least 3 characters'
)

const isEmail = createRule('email', (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format'
)
```

#### `createAsyncRule<T>(name: string, validate: (value: T) => Promise<boolean | string>): AsyncValidationRule<T>`

Creates an asynchronous validation rule.

```typescript
const uniqueUsername = createAsyncRule('unique', async (username: string) => {
  const exists = await checkUsernameExists(username)
  return !exists || 'Username already taken'
})
```

### ValidationPipeline

Combines multiple validation rules into a pipeline.

#### `createValidationPipeline<T>(rules: Array<ValidationRule<T> | AsyncValidationRule<T>>): ValidationPipeline<T>`

```typescript
const validateUser = createValidationPipeline([
  createRule('required', (value: string) => 
    value.length > 0 || 'Username is required'
  ),
  createRule('format', (value: string) =>
    /^[a-zA-Z0-9_]+$/.test(value) || 'Only letters, numbers, and underscores allowed'
  ),
  createRule('length', (value: string) =>
    value.length <= 20 || 'Maximum 20 characters'
  ),
  createAsyncRule('unique', async (value: string) =>
    !(await userExists(value)) || 'Username already exists'
  )
])

// Usage
const result = await validateUser.validate('john_doe')
if (!result.success) {
  console.error(result.errors)
  // [{ rule: 'unique', message: 'Username already exists' }]
}
```

### ValidationResult

Result of running a validation pipeline.

```typescript
interface ValidationResult {
  success: boolean
  errors: Array<{ rule: string; message: string }>
  summary: ValidationSummary
}

interface ValidationSummary {
  total: number
  passed: number
  failed: number
  skipped: number
}
```

## Logger

Provides formatted console output with color support.

### Interface

```typescript
interface Logger {
  info(message: string): void
  success(message: string): void
  warning(message: string): void
  error(message: string): void
  debug(message: string): void
  step(step: number, total: number, message: string): void
  chalk: ChalkInstance // Direct access to chalk for custom styling
}
```

### Creating a Logger

```typescript
import { createLogger } from '@trailhead/cli/core'

const logger = createLogger(verbose: boolean)

// Usage
logger.info('Processing files...')
logger.success('✓ Operation completed')
logger.warning('⚠ Config file not found, using defaults')
logger.error('✗ Failed to connect to server')
logger.debug('Debug: Cache hit for key "user:123"') // Only shown if verbose=true
logger.step(2, 5, 'Installing dependencies')

// Custom styling
logger.info(logger.chalk.blue('Custom blue text'))
logger.info(logger.chalk.bold.green('Bold green text'))
```

## Error Handling Patterns

### Result Chaining

Chain operations that return Results:

```typescript
async function processFile(path: string): Promise<Result<ProcessedData>> {
  const readResult = await fs.readFile(path)
  if (!readResult.success) {
    return readResult
  }

  const parseResult = parseJSON(readResult.value)
  if (!parseResult.success) {
    return parseResult
  }

  const validateResult = await validateData(parseResult.value)
  if (!validateResult.success) {
    return validateResult
  }

  return ok(validateResult.value)
}
```

### Result Mapping

Transform successful values:

```typescript
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value))
  }
  return result
}

// Usage
const numberResult = ok(42)
const stringResult = mapResult(numberResult, n => n.toString())
// stringResult: { success: true, value: "42" }
```

### Result Flattening

Handle nested Results:

```typescript
async function flatten<T, E>(
  result: Result<Result<T, E>, E>
): Promise<Result<T, E>> {
  if (result.success) {
    return result.value
  }
  return result
}
```

### Error Recovery

Provide fallback values:

```typescript
function withDefault<T, E>(
  result: Result<T, E>,
  defaultValue: T
): T {
  return result.success ? result.value : defaultValue
}

// Usage
const config = withDefault(
  await loadConfig(),
  { port: 3000, host: 'localhost' }
)
```

## Best Practices

### 1. Always Return Results

Never throw exceptions in your functions:

```typescript
// ❌ Bad
async function readConfig(): Promise<Config> {
  const content = await fs.promises.readFile('config.json', 'utf8')
  return JSON.parse(content) // Can throw!
}

// ✅ Good
async function readConfig(): Promise<Result<Config>> {
  try {
    const content = await fs.promises.readFile('config.json', 'utf8')
    const config = JSON.parse(content)
    return ok(config)
  } catch (error) {
    return err(createFileSystemError({
      path: 'config.json',
      operation: 'read',
      message: error.message,
      cause: error
    }))
  }
}
```

### 2. Propagate Errors Early

Don't continue processing after an error:

```typescript
// ❌ Bad
async function process(items: string[]): Promise<Result<void>> {
  const errors = []
  for (const item of items) {
    const result = await processItem(item)
    if (!result.success) {
      errors.push(result.error)
    }
  }
  
  if (errors.length > 0) {
    return err(errors[0]) // Lost other errors!
  }
  return ok(undefined)
}

// ✅ Good
async function process(items: string[]): Promise<Result<void>> {
  for (const item of items) {
    const result = await processItem(item)
    if (!result.success) {
      return result // Fail fast
    }
  }
  return ok(undefined)
}
```

### 3. Provide Helpful Error Messages

Include context and recovery suggestions:

```typescript
// ❌ Bad
return err(new Error('Invalid input'))

// ✅ Good
return err(createValidationError({
  field: 'email',
  value: input,
  message: 'Invalid email format',
  suggestion: 'Email should be in format: user@example.com',
  constraints: { format: 'email', maxLength: 255 }
}))
```

### 4. Use Type Guards

Always use type guards for type-safe error handling:

```typescript
const result = await someOperation()

// ❌ Bad - TypeScript doesn't know the types
if (result.success) {
  console.log(result.value) // Error: Property 'value' does not exist
}

// ✅ Good - Type guards provide type safety
if (isOk(result)) {
  console.log(result.value) // TypeScript knows this is safe
}
```

## Examples

### Complete Error Handling Example

```typescript
import { ok, err, isOk, createError, createValidationPipeline, createRule } from '@trailhead/cli/core'
import type { Result } from '@trailhead/cli/core'

// Define validation rules
const validatePort = createValidationPipeline([
  createRule('type', (value: any) =>
    typeof value === 'number' || 'Port must be a number'
  ),
  createRule('range', (value: number) =>
    (value >= 1 && value <= 65535) || 'Port must be between 1 and 65535'
  )
])

// Configuration type
interface ServerConfig {
  host: string
  port: number
}

// Load and validate configuration
async function loadServerConfig(): Promise<Result<ServerConfig>> {
  // Read file
  const fileResult = await fs.readFile('server.json')
  if (!isOk(fileResult)) {
    return err(createError({
      code: 'CONFIG_NOT_FOUND',
      message: 'Server configuration file not found',
      suggestion: 'Create server.json with { "host": "localhost", "port": 3000 }',
      cause: fileResult.error,
      recoverable: true
    }))
  }

  // Parse JSON
  let data: any
  try {
    data = JSON.parse(fileResult.value)
  } catch (error) {
    return err(createError({
      code: 'INVALID_JSON',
      message: 'Failed to parse server.json',
      details: error.message,
      suggestion: 'Check for syntax errors in server.json',
      recoverable: true
    }))
  }

  // Validate structure
  if (!data.host || !data.port) {
    return err(createError({
      code: 'MISSING_FIELDS',
      message: 'Invalid configuration structure',
      details: 'Missing required fields',
      suggestion: 'Ensure server.json contains both "host" and "port" fields',
      recoverable: true
    }))
  }

  // Validate port
  const portValidation = await validatePort.validate(data.port)
  if (!portValidation.success) {
    return err(createValidationError({
      field: 'port',
      value: data.port,
      message: portValidation.errors[0].message,
      constraints: { type: 'number', min: 1, max: 65535 }
    }))
  }

  return ok({
    host: data.host,
    port: data.port
  })
}

// Usage
async function startServer(): Promise<Result<void>> {
  const configResult = await loadServerConfig()
  if (!isOk(configResult)) {
    logger.error(configResult.error.message)
    if (configResult.error.suggestion) {
      logger.info(`💡 ${configResult.error.suggestion}`)
    }
    return configResult
  }

  const { host, port } = configResult.value
  logger.info(`Starting server on ${host}:${port}`)
  
  // Start server...
  return ok(undefined)
}
```