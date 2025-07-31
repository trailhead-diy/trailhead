---
type: how-to
title: 'Handle Errors in CLI Applications'
description: 'Implement consistent error handling using Result types and error templates'
prerequisites:
  - 'Understanding of Result types'
  - 'Basic TypeScript knowledge'
  - 'Familiarity with async/await'
related:
  - /packages/cli/reference/core.md
  - /packages/cli/reference/flow-control.md
  - /packages/cli/how-to/use-result-pipelines
---

# Handle Errors in CLI Applications

This guide shows you how to handle errors consistently in CLI applications using Result types and error templates.

## Error Handling Principles

The framework uses Result types for explicit error handling:

- **No exceptions** - Errors are values, not thrown exceptions
- **Type safety** - Error possibilities are visible in function signatures
- **Composability** - Errors propagate naturally through pipelines
- **Consistency** - Error templates ensure uniform error messages

## Basic Error Handling

### Step 1: Import Result Types

```typescript
import { Ok, Err, Result } from '@esteban-url/cli/core'
```

### Step 2: Return Results from Functions

```typescript
import { fs } from '@repo/fs'

async function readConfig(path: string): Promise<Result<Config>> {
  const fileResult = await fs.readFile(path, 'utf-8')
  if (!fileResult.success) {
    return Err(new Error(`Failed to read config: ${fileResult.error.message}`))
  }

  // JSON.parse can still throw, so we wrap it
  try {
    const config = JSON.parse(fileResult.value)
    return Ok(config)
  } catch (error) {
    return Err(new Error(`Invalid JSON in config: ${error.message}`))
  }
}
```

### Step 3: Check Results Before Using Values

```typescript
const configResult = await readConfig('config.json')
if (!configResult.success) {
  logger.error(configResult.error.message)
  return configResult // Propagate the error
}

const config = configResult.value
// Now safe to use config
```

## Using Error Templates

### Import Error Templates

```typescript
import { errorTemplates } from '@esteban-url/cli/core'
```

### Common Error Scenarios

#### File System Errors

```typescript
async function loadData(filePath: string): Promise<Result<string>> {
  const exists = await fs.exists(filePath)
  if (!exists) {
    return Err(errorTemplates.fileNotFound(filePath))
  }

  const result = await fs.readFile(filePath)
  if (!result.success) {
    return Err(errorTemplates.permissionDenied(filePath, 'read'))
  }

  return result
}
```

#### Validation Errors

```typescript
function validateOptions(options: Options): Result<Options> {
  if (!options.input) {
    return Err(errorTemplates.requiredFieldMissing('input'))
  }

  if (!['json', 'csv', 'yaml'].includes(options.format)) {
    return Err(errorTemplates.invalidChoice('format', ['json', 'csv', 'yaml'], options.format))
  }

  if (options.limit < 1 || options.limit > 1000) {
    return Err(errorTemplates.valueOutOfRange('limit', 1, 1000, options.limit))
  }

  return Ok(options)
}
```

#### Parse Errors

```typescript
function parseJSON(content: string, filePath?: string): Result<any> {
  try {
    return Ok(JSON.parse(content))
  } catch (error) {
    return Err(errorTemplates.parseFailure('JSON', filePath, error.message))
  }
}
```

## Error Propagation

### Manual Propagation

```typescript
async function processFile(path: string): Promise<Result<ProcessedData>> {
  // Read file
  const readResult = await fs.readFile(path)
  if (!readResult.success) {
    return readResult // Propagate file read error
  }

  // Parse content
  const parseResult = parseJSON(readResult.value, path)
  if (!parseResult.success) {
    return parseResult // Propagate parse error
  }

  // Process data
  const processResult = await processData(parseResult.value)
  if (!processResult.success) {
    return processResult // Propagate processing error
  }

  return processResult
}
```

### Using Pipelines

```typescript
import { pipeline } from '@esteban-url/cli/core'

async function processFile(path: string): Promise<Result<ProcessedData>> {
  return pipeline(path)
    .step('Read file', (p) => fs.readFile(p))
    .step('Parse JSON', (content) => parseJSON(content, path))
    .step('Process data', processData)
    .execute()
}
```

## Error Recovery

### Fallback Values

```typescript
async function loadConfigWithFallback(
  path: string,
  defaultConfig: Config
): Promise<Result<Config>> {
  const result = await loadConfig(path)

  if (!result.success) {
    logger.warn(`Using default config: ${result.error.message}`)
    return Ok(defaultConfig)
  }

  return result
}
```

### Retry Logic

```typescript
async function fetchWithRetry(url: string, maxAttempts = 3): Promise<Result<Data>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fetchData(url)

    if (result.success) {
      return result
    }

    if (attempt < maxAttempts) {
      logger.warn(`Attempt ${attempt} failed, retrying...`)
      await sleep(1000 * attempt) // Exponential backoff
    }
  }

  return Err(errorTemplates.operationFailed('fetch', `Failed after ${maxAttempts} attempts`))
}
```

### Partial Success

```typescript
import { parallelSettled } from '@esteban-url/cli/core'

async function processMultipleFiles(files: string[]): Promise<Result<ProcessResults>> {
  const operations = files.map((file) => () => processFile(file))
  const result = await parallelSettled(operations)

  if (result.success) {
    const { successes, failures } = result.value

    if (failures.length > 0) {
      logger.warn(`Failed to process ${failures.length} files`)
    }

    return Ok({
      processed: successes,
      failed: failures.length,
      total: files.length,
    })
  }

  return result
}
```

## Command Error Handling

### In Command Actions

```typescript
const processCommand = createCommand({
  name: 'process',
  description: 'Process data files',
  options: [
    { name: 'input', type: 'string', required: true },
    { name: 'output', type: 'string' },
  ],
  action: async (options, context) => {
    // Validate options
    const validationResult = validateOptions(options)
    if (!validationResult.success) {
      context.logger.error(validationResult.error.message)
      return validationResult
    }

    // Process file
    const processResult = await processFile(options.input)
    if (!processResult.success) {
      context.logger.error(`Processing failed: ${processResult.error.message}`)
      return processResult
    }

    // Save output
    if (options.output) {
      const saveResult = await saveOutput(options.output, processResult.value)
      if (!saveResult.success) {
        context.logger.error(`Save failed: ${saveResult.error.message}`)
        return saveResult
      }
    }

    context.logger.success('Processing complete!')
    return Ok(undefined)
  },
})
```

### With User-Friendly Messages

```typescript
action: async (options, context) => {
  const result = await processData(options)

  if (!result.success) {
    // Show user-friendly error
    context.logger.error('Failed to process data')

    // Show details if verbose
    if (context.verbose) {
      context.logger.error(`Details: ${result.error.message}`)
      if (result.error.stack) {
        context.logger.debug(result.error.stack)
      }
    }

    // Suggest recovery action
    if (result.error.code === 'FILE_NOT_FOUND') {
      context.logger.info('Tip: Check that the file path is correct')
    }

    return result
  }

  return Ok(undefined)
}
```

## Custom Error Types

### Define Custom Errors

```typescript
interface CLIError extends Error {
  code: string
  suggestion?: string
  recoverable?: boolean
}

function createCLIError(code: string, message: string, suggestion?: string): CLIError {
  const error = new Error(message) as CLIError
  error.code = code
  error.suggestion = suggestion
  return error
}
```

### Use Custom Errors

```typescript
function validateProjectName(name: string): Result<string> {
  if (!/^[a-z0-9-]+$/.test(name)) {
    return Err(
      createCLIError(
        'INVALID_PROJECT_NAME',
        `Invalid project name: ${name}`,
        'Use lowercase letters, numbers, and hyphens only'
      )
    )
  }

  return Ok(name)
}
```

### Handle Custom Errors

```typescript
const result = validateProjectName(name)
if (!result.success) {
  const error = result.error as CLIError

  context.logger.error(error.message)
  if (error.suggestion) {
    context.logger.info(`Tip: ${error.suggestion}`)
  }

  return result
}
```

## Error Formatting

### Consistent Error Display

```typescript
function formatError(error: Error): string {
  const lines = [`❌ ${error.message}`]

  if ('code' in error) {
    lines.push(`   Error code: ${error.code}`)
  }

  if ('suggestion' in error && error.suggestion) {
    lines.push(`   💡 ${error.suggestion}`)
  }

  return lines.join('\n')
}

// Usage
if (!result.success) {
  context.logger.error(formatError(result.error))
}
```

### Error Summaries

```typescript
function displayErrorSummary(errors: Error[], context: CommandContext): void {
  context.logger.error(`Found ${errors.length} errors:\n`)

  errors.forEach((error, index) => {
    context.logger.error(`${index + 1}. ${error.message}`)
  })

  const fileErrors = errors.filter((e) => e.code === 'FILE_NOT_FOUND')
  if (fileErrors.length > 0) {
    context.logger.info('\nTip: Check that all file paths are correct')
  }
}
```

## Testing Error Handling

### Test Error Cases

```typescript
import { describe, it, expect } from 'vitest'

describe('error handling', () => {
  it('handles missing file', async () => {
    const result = await loadData('/nonexistent.txt')

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('FILE_NOT_FOUND')
    expect(result.error.message).toContain('/nonexistent.txt')
  })

  it('provides helpful suggestions', async () => {
    const result = validateProjectName('My Project!')

    expect(result.success).toBe(false)
    expect(result.error.suggestion).toContain('lowercase letters')
  })
})
```

### Test Error Recovery

```typescript
it('falls back to default config', async () => {
  const fs = mockFileSystem() // No config file
  const defaultConfig = { theme: 'dark' }

  const result = await loadConfigWithFallback('config.json', defaultConfig)

  expect(result.success).toBe(true)
  expect(result.value).toEqual(defaultConfig)
})
```

## Best Practices

### 1. Use Specific Error Messages

```typescript
// Less helpful
return Err(new Error('Invalid input'))

// More helpful
return Err(new Error(`Invalid email format: ${email}`))

// Best: Use error templates
return Err(errorTemplates.invalidFormat('email', 'user@example.com', email))
```

### 2. Include Context

```typescript
// Include relevant context in errors
return Err(new Error(`Failed to process ${file} at line ${lineNumber}: ${parseError}`))
```

### 3. Make Errors Actionable

```typescript
if (!(await fs.exists(configPath))) {
  return Err(
    createCLIError(
      'CONFIG_NOT_FOUND',
      `Configuration file not found: ${configPath}`,
      `Run 'myapp init' to create a default configuration`
    )
  )
}
```

### 4. Handle Errors at the Right Level

```typescript
// Don't hide errors too deep
async function deepFunction(): Promise<Result<Data>> {
  const result = await operation()
  if (!result.success) {
    // Don't log here, let caller decide
    return result
  }
  return processData(result.value)
}

// Handle at command level
action: async (options, context) => {
  const result = await deepFunction()
  if (!result.success) {
    // Log and format error for user here
    context.logger.error(formatError(result.error))
    return result
  }
}
```

## Common Patterns

### Validate Early

```typescript
action: async (options, context) => {
  // Validate all inputs first
  const validation = validateOptions(options)
  if (!validation.success) {
    return validation
  }

  // Check prerequisites
  const preCheck = await checkPrerequisites()
  if (!preCheck.success) {
    return preCheck
  }

  // Now safe to proceed with main logic
  return processData(validation.value)
}
```

### Collect Multiple Errors

```typescript
function validateData(rows: DataRow[]): Result<DataRow[]> {
  const errors: Error[] = []

  rows.forEach((row, index) => {
    if (!row.email || !isValidEmail(row.email)) {
      errors.push(new Error(`Row ${index + 1}: Invalid email`))
    }
    if (!row.name) {
      errors.push(new Error(`Row ${index + 1}: Missing name`))
    }
  })

  if (errors.length > 0) {
    return Err(
      new Error(
        `Validation failed with ${errors.length} errors:\n` +
          errors.map((e) => `  - ${e.message}`).join('\n')
      )
    )
  }

  return Ok(rows)
}
```

## Next Steps

- Explore [Pipeline Error Handling](/packages/cli/how-to/use-result-pipelines)
- Review [Core API Reference](/packages/cli/reference/core)
- Learn about [Testing Errors](/packages/cli/how-to/test-cli-applications)
