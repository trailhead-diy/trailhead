# Flow Control & Error Handling

The Flow Control & Error Handling enhancement addresses GitHub issue #113 by implementing result pipelines and error templates that streamline async operations and standardize error UX across the framework.

## Features

### 1. Result Pipeline Utilities

Eliminates 5-10 lines of manual error checking per operation chain through automatic error propagation and functional composition.

#### Before

```typescript
// Manual error handling with repetitive checks
const step1Result = await parseFile()
if (!step1Result.success) {
  return Err(new Error(`Parse failed: ${step1Result.error.message}`))
}

const step2Result = await validateData(step1Result.value)
if (!step2Result.success) {
  return Err(new Error(`Validation failed: ${step2Result.error.message}`))
}

const step3Result = await writeOutput(step2Result.value)
if (!step3Result.success) {
  return Err(new Error(`Write failed: ${step3Result.error.message}`))
}

return step3Result
```

#### After

```typescript
// Streamlined pipeline with automatic error propagation
import { pipeline } from '@esteban-url/trailhead-cli/core'

return pipeline(inputFile)
  .step('Parse file', parseFile)
  .step('Validate data', validateData)
  .step('Write output', writeOutput)
  .execute()
```

**Boilerplate Reduction**: 5-10 lines eliminated per operation chain with automatic error propagation.

### 2. Error Message Templates

Provides consistent error UX across the framework with predefined templates for common scenarios.

#### Before

```typescript
// Inconsistent error messages
return Err(new Error(`Failed to parse CSV: ${result.error.message}`))
return Err(new Error(`Input file does not exist: ${inputFile}`))
return Err(new Error(`Unsupported format: ${format}`))
```

#### After

```typescript
// Consistent error templates
import { errors } from '@esteban-url/trailhead-cli/core'

return Err(errors.parseFailure('CSV', inputFile, result.error.message))
return Err(errors.fileNotFound(inputFile))
return Err(errors.unsupportedFormat(format, ['json', 'csv', 'yaml']))
```

**Benefits**: Consistent error UX, helpful suggestions, internationalization ready, proper error categorization.

## API Reference

### Pipeline Utilities

#### `pipeline<T>(initialValue)`

Creates a new pipeline with an initial value, Result, or Promise<Result>.

#### Pipeline Methods

##### `.step(name, stepFn)` / `.step(stepFn)`

Add a step to the pipeline that executes sequentially.

##### `.stepIf(name, condition, stepFn)` / `.stepIf(condition, stepFn)`

Add a conditional step that only executes if the condition returns true.

##### `.stepWithTimeout(name, timeout, stepFn)` / `.stepWithTimeout(timeout, stepFn)`

Add a step with a timeout that fails if the step takes too long.

##### `.map(name, transform)` / `.map(transform)`

Transform data in the pipeline synchronously.

##### `.onError(handler)`

Set an error handler for pipeline recovery.

##### `.onProgress(callback)`

Set a progress tracking callback.

##### `.withAbortSignal(signal)`

Set an abort signal for cancellation support.

##### `.execute()`

Execute the pipeline and return the final result.

#### Parallel Execution

##### `parallel(operations)`

Execute operations in parallel and fail fast on first error.

```typescript
// Array of operations
const result = await parallel([
  async () => fetchData1(),
  async () => fetchData2(),
  async () => fetchData3(),
])

// Object of named operations
const result = await parallel({
  users: async () => fetchUsers(),
  posts: async () => fetchPosts(),
  comments: async () => fetchComments(),
})
```

##### `parallelSettled(operations)`

Execute operations in parallel with failure tolerance.

```typescript
const result = await parallelSettled([
  async () => fetchData1(),
  async () => fetchData2(), // May fail
  async () => fetchData3(),
])

if (result.success) {
  console.log('Successes:', result.value.successes)
  console.log('Failures:', result.value.failures)
}
```

##### `retryPipeline(pipelineFactory, options)`

Retry a pipeline with exponential backoff.

```typescript
const result = await retryPipeline(() => pipeline(data).step('process', processData), {
  maxAttempts: 3,
  baseDelay: 1000,
  onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`),
})
```

### Error Templates

#### Standard Templates

The `errorTemplates` object provides consistent error creation for common scenarios:

##### File System Errors

- `fileNotFound(filePath, suggestion?)` - File not found errors
- `directoryNotFound(dirPath)` - Directory not found errors
- `fileAlreadyExists(filePath)` - File already exists errors
- `permissionDenied(filePath, operation)` - Permission denied errors
- `diskSpaceFull(filePath)` - Disk space errors

##### Validation Errors

- `requiredFieldMissing(fieldName)` - Required field errors
- `invalidFormat(fieldName, expectedFormat, actualValue?)` - Format validation errors
- `valueOutOfRange(fieldName, min, max, actualValue?)` - Range validation errors
- `invalidChoice(fieldName, validChoices, actualValue?)` - Choice validation errors

##### Network Errors

- `connectionTimeout(url, timeoutMs)` - Connection timeout errors
- `connectionRefused(url)` - Connection refused errors
- `notFound(url)` - 404 not found errors
- `unauthorized(url)` - 401 unauthorized errors
- `rateLimited(url, retryAfter?)` - Rate limiting errors

##### Configuration Errors

- `configFileMissing(configPath)` - Missing config file errors
- `configFileInvalid(configPath, parseError?)` - Invalid config syntax errors
- `configValueInvalid(key, value, expectedType)` - Invalid config value errors

##### Execution Errors

- `commandNotFound(command)` - Command not found errors
- `commandFailed(command, exitCode, stderr?)` - Command execution failures
- `processTimeout(command, timeoutMs)` - Process timeout errors

##### User Input Errors

- `invalidInput(input, reason?)` - Invalid user input errors
- `missingArgument(argument)` - Missing required argument errors
- `tooManyArguments(expected, actual)` - Too many arguments errors

##### Dependency Errors

- `packageNotInstalled(packageName, installCommand?)` - Missing package errors
- `versionMismatch(packageName, requiredVersion, actualVersion)` - Version mismatch errors
- `dependencyConflict(package1, package2, reason?)` - Dependency conflict errors

##### Operation Errors

- `operationCancelled(operationName)` - Cancelled operation errors
- `operationTimeout(operationName, timeoutMs)` - Operation timeout errors
- `operationFailed(operationName, reason)` - General operation failures

##### Parse & Format Errors

- `parseFailure(format, filePath?, parseError?)` - Parse failure errors
- `unsupportedFormat(format, supportedFormats)` - Unsupported format errors

##### Authentication Errors

- `authenticationFailed(service?)` - Authentication failure errors
- `authenticationExpired(service?)` - Expired authentication errors

#### Custom Error Templates

##### `createErrorTemplate(code, category, messageTemplate, factory)`

Create custom error templates with consistent patterns.

##### `ErrorTemplateRegistry`

Registry for managing custom error templates.

##### `globalErrorTemplates`

Global registry instance for application-wide custom templates.

## Examples

### Complete Pipeline Workflow

```typescript
import { pipeline, errors } from '@esteban-url/trailhead-cli/core'

interface ProcessContext {
  inputFile: string
  data?: any[]
  processedData?: any[]
  outputFile?: string
}

const result = await pipeline({ inputFile: 'data.csv' })
  .step('Read file', async (ctx) => {
    const fileResult = await fs.readFile(ctx.inputFile)
    if (!fileResult.success) {
      return Err(errors.fileNotFound(ctx.inputFile))
    }
    ctx.data = parseCSV(fileResult.value)
    return Ok(ctx)
  })
  .step('Validate data', async (ctx) => {
    if (!ctx.data?.length) {
      return Err(errors.invalidInput('CSV data', 'File contains no data'))
    }
    return Ok(ctx)
  })
  .step('Process data', async (ctx) => {
    ctx.processedData = ctx.data!.map((row) => processRow(row))
    return Ok(ctx)
  })
  .stepIf(
    'Write output',
    (ctx) => !!ctx.processedData?.length,
    async (ctx) => {
      const outputFile = ctx.inputFile.replace('.csv', '-processed.json')
      const writeResult = await fs.writeFile(outputFile, JSON.stringify(ctx.processedData))
      if (!writeResult.success) {
        return Err(errors.permissionDenied(outputFile, 'write'))
      }
      ctx.outputFile = outputFile
      return Ok(ctx)
    }
  )
  .onProgress((step, progress, total) => {
    console.log(`${step}: ${Math.round((progress / total) * 100)}%`)
  })
  .onError(async (error, stepName) => {
    console.error(`Error in ${stepName}: ${error.message}`)
    // Attempt recovery for certain error types
    if (error.recoverable) {
      console.log('Attempting recovery...')
      return Ok({ inputFile: 'fallback.csv' })
    }
    return Err(error)
  })
  .execute()
```

### Parallel Processing with Error Handling

```typescript
import { parallelSettled, errors } from '@esteban-url/trailhead-cli/core'

const result = await parallelSettled({
  users: async () => fetchUsers(),
  posts: async () => fetchPosts(),
  comments: async () => fetchComments(),
})

if (result.success) {
  const { successes, failures } = result.value

  // Process successful results
  console.log('Loaded data:', successes)

  // Handle failures gracefully
  Object.entries(failures).forEach(([operation, error]) => {
    if (error.code === 'NETWORK_TIMEOUT') {
      console.warn(`${operation} timed out, using cached data`)
    } else {
      console.error(`${operation} failed:`, error.message)
    }
  })
}
```

### Custom Error Templates

```typescript
import { createErrorTemplate, globalErrorTemplates } from '@esteban-url/trailhead-cli/core'

// Register custom error template
const customErrorTemplate = createErrorTemplate(
  'CUSTOM_VALIDATION_ERROR',
  'validation',
  'Custom validation failed',
  (field: string, rule: string) =>
    ({
      code: 'CUSTOM_VALIDATION_ERROR',
      category: 'validation',
      message: `Custom validation failed for field '${field}': ${rule}`,
      field,
      rule,
      suggestion: `Fix the ${rule} validation for ${field}`,
      recoverable: true,
    }) as any
)

globalErrorTemplates.register('customValidation', customErrorTemplate)

// Use custom template
const error = globalErrorTemplates.get('customValidation')?.create('email', 'must be unique')
```

## Migration Guide

### From Manual Error Handling

1. Replace repetitive error checking with `pipeline()` for sequential operations
2. Use `parallel()` or `parallelSettled()` for concurrent operations
3. Replace custom error creation with `errorTemplates` for consistency

### From Basic Async Patterns

1. Convert nested async/await chains to pipeline steps
2. Add progress tracking and cancellation support where needed
3. Implement error recovery strategies using `onError()` handlers

## Backward Compatibility

All existing error handling APIs remain functional:

- Manual Result checking still works unchanged
- Existing error factories continue to work
- No breaking changes to existing patterns

The enhancements add new capabilities alongside existing ones, providing a migration path without forcing immediate changes.

## Performance

- **Zero overhead** - Pipeline operations have minimal performance impact
- **Memory efficient** - Streaming support for large data processing
- **Cancellation support** - AbortSignal integration prevents resource leaks
- **Error recovery** - Graceful degradation instead of complete failures

## Type Safety

All enhancements maintain full type safety:

- Pipeline steps are properly typed with input/output inference
- Error templates provide strongly typed error objects
- Conditional execution maintains type flow
- Custom error templates support full TypeScript definitions
