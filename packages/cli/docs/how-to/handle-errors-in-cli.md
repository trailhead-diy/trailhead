---
type: how-to
title: 'Handle Errors in CLI Applications'
description: 'Implement consistent error handling using Result types and error factories'
prerequisites:
  - 'Understanding of Result types'
  - 'Basic TypeScript knowledge'
  - 'Familiarity with async/await'
related:
  - /packages/cli/docs/reference/core.md
  - /packages/cli/docs/reference/flow-control.md
  - /packages/cli/docs/how-to/use-result-pipelines
---

# Handle Errors in CLI Applications

This guide shows you how to handle errors consistently in CLI applications using Result types and error factories.

## Error Handling Principles

1. **No exceptions** - All errors are returned as Result types
2. **Explicit handling** - Every error path must be handled
3. **Rich error context** - Include helpful information for debugging
4. **Consistent patterns** - Use error factories for common scenarios

## Basic Error Handling

### Import Error Utilities

```typescript
import { ok, err, Result } from '@esteban-url/core'
import {
  createFileSystemError,
  createValidationError,
  createDataError,
  createCliError,
} from '@esteban-url/core'
```

### Simple Error Handling

```typescript
async function readConfig(path: string): Promise<Result<Config>> {
  const fileResult = await fs.readFile(path)
  if (fileResult.isErr()) {
    return err(createFileSystemError('read', path, fileResult.error))
  }

  try {
    const config = JSON.parse(fileResult.value)
    return ok(config)
  } catch (error) {
    return err(createDataError('parse', `Invalid JSON in ${path}: ${error.message}`))
  }
}
```

## Using Error Factories

### File System Errors

```typescript
import { createFileSystemError } from '@esteban-url/core'
import { fs } from '@esteban-url/fs'

async function loadData(filePath: string): Promise<Result<string>> {
  const exists = await fs.exists(filePath)
  if (!exists) {
    return err(createFileSystemError('read', filePath, new Error('File not found')))
  }

  const result = await fs.readFile(filePath)
  if (result.isErr()) {
    return err(createFileSystemError('read', filePath, result.error))
  }

  return ok(result.value)
}
```

### Validation Errors

```typescript
import { createValidationError } from '@esteban-url/core'

function validateOptions(options: Options): Result<Options> {
  if (!options.input) {
    return err(createValidationError('missing_field', 'input field is required'))
  }

  if (!['json', 'csv', 'yaml'].includes(options.format)) {
    return err(
      createValidationError(
        'invalid_format',
        `Invalid format: ${options.format}. Expected: json, csv, or yaml`
      )
    )
  }

  if (options.limit < 1 || options.limit > 1000) {
    return err(
      createValidationError(
        'out_of_range',
        `Limit must be between 1 and 1000, got ${options.limit}`
      )
    )
  }

  return ok(options)
}
```

### Data Processing Errors

```typescript
import { createDataError } from '@esteban-url/core'

async function parseCSV(content: string): Promise<Result<Row[]>> {
  try {
    const rows = await csvParser.parse(content)
    return ok(rows)
  } catch (error) {
    return err(createDataError('parse', `CSV parsing failed: ${error.message}`))
  }
}
```

## Error Context and Chaining

### Adding Context to Errors

```typescript
import { withContext, chainError } from '@esteban-url/core'

async function processFile(path: string): Promise<Result<ProcessedData>> {
  // Read file
  const contentResult = await fs.readFile(path)
  if (contentResult.isErr()) {
    return err(withContext(contentResult.error, { operation: 'processFile', path }))
  }

  // Parse content
  const dataResult = await parseData(contentResult.value)
  if (dataResult.isErr()) {
    return err(
      chainError('Failed to process file', dataResult.error, {
        path,
        size: contentResult.value.length,
      })
    )
  }

  return ok(dataResult.value)
}
```

## Composing Result Operations

### Using Result Composition

```typescript
import { composeResult } from '@esteban-url/core'

async function loadAndValidateConfig(path: string): Promise<Result<Config>> {
  return composeResult(
    await fs.readFile(path),
    (content) => parseJSON<Config>(content),
    (config) => validateConfig(config),
    (config) => applyDefaults(config)
  )
}
```

### Handling Multiple Results

```typescript
import { combine } from '@esteban-url/core'

async function loadMultipleConfigs(paths: string[]): Promise<Result<Config[]>> {
  const results = await Promise.all(paths.map((path) => loadConfig(path)))

  return combine(results)
}
```

## Retry Patterns

### Simple Retry

```typescript
async function fetchWithRetry<T>(
  operation: () => Promise<Result<T>>,
  maxAttempts = 3
): Promise<Result<T>> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await operation()

    if (result.isOk() || attempt === maxAttempts) {
      return result
    }

    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }

  return err(createCliError('retry_exhausted', `Failed after ${maxAttempts} attempts`))
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

  if (result.isErr()) {
    console.warn(`Using default config due to: ${result.error.message}`)
    return ok(defaultConfig)
  }

  return result
}
```

### Partial Success

```typescript
import { combineWithAllErrors } from '@esteban-url/core'

async function processFiles(paths: string[]): Promise<Result<ProcessedFile[]>> {
  const results = await Promise.all(
    paths.map(async (path) => {
      const result = await processFile(path)
      return result.isOk()
        ? ok({ path, data: result.value })
        : ok({ path, error: result.error.message })
    })
  )

  return combine(results)
}
```

## Command Error Handling

### In Command Actions

```typescript
import { createCommand } from '@esteban-url/cli/command'

const processCommand = createCommand({
  name: 'process',
  options: {
    input: { type: 'string', required: true },
    output: { type: 'string', required: true },
  },
  action: async (options, context) => {
    // Validate options
    const validateResult = validateOptions(options)
    if (validateResult.isErr()) {
      context.logger.error(`Validation failed: ${validateResult.error.message}`)
      return validateResult
    }

    // Process file
    const processResult = await processFile(options.input)
    if (processResult.isErr()) {
      context.logger.error(`Processing failed: ${processResult.error.message}`)
      return processResult
    }

    // Write output
    const writeResult = await fs.writeFile(options.output, processResult.value)
    if (writeResult.isErr()) {
      context.logger.error(`Write failed: ${writeResult.error.message}`)
      return writeResult
    }

    context.logger.success('Processing completed successfully')
    return ok(undefined)
  },
})
```

## Error Reporting

### User-Friendly Messages

```typescript
function formatErrorForUser(error: CoreError): string {
  const baseMessage = error.message

  // Add suggestions based on error type
  if (error.type === 'filesystem' && error.code === 'ENOENT') {
    return `${baseMessage}\n\nHint: Check that the file path is correct and the file exists.`
  }

  if (error.type === 'validation') {
    return `${baseMessage}\n\nHint: Run with --help to see valid options.`
  }

  return baseMessage
}
```

### Detailed Error Logging

```typescript
function logDetailedError(error: CoreError, context: CommandContext): void {
  context.logger.error(`Error: ${error.message}`)

  if (context.debug) {
    context.logger.debug(`Type: ${error.type}`)
    context.logger.debug(`Code: ${error.code}`)
    if (error.context) {
      context.logger.debug(`Context: ${JSON.stringify(error.context, null, 2)}`)
    }
    if (error.cause) {
      context.logger.debug(`Cause: ${error.cause}`)
    }
  }
}
```

## Testing Error Scenarios

### Testing Error Paths

```typescript
import { createTestContext } from '@esteban-url/cli/testing'
import { createFileSystemError } from '@esteban-url/core'

describe('error handling', () => {
  test('handles missing file gracefully', async () => {
    const mockFs = {
      exists: async () => false,
      readFile: async () => err(createFileSystemError('read', 'test.json', new Error('ENOENT'))),
    }

    const context = createTestContext({ fileSystem: mockFs })
    const result = await loadConfig('test.json')

    expect(result.isErr()).toBe(true)
    expect(result.error.type).toBe('filesystem')
  })
})
```

## Best Practices

1. **Always handle both success and error cases**

   ```typescript
   const result = await operation()
   if (result.isErr()) {
     // Handle error
     return result
   }
   // Handle success
   ```

2. **Use specific error factories**

   ```typescript
   // Good
   return err(createValidationError('invalid_email', 'Email format is invalid'))

   // Avoid
   return err(new Error('Invalid email'))
   ```

3. **Include helpful context**

   ```typescript
   return err(
     withContext(error, {
       file: filePath,
       line: lineNumber,
       column: columnNumber,
     })
   )
   ```

4. **Chain errors for better traceability**
   ```typescript
   return err(
     chainError('High-level operation failed', lowLevelError, { additionalContext: value })
   )
   ```

## Next Steps

- Explore [Command Execution Patterns](/packages/cli/docs/how-to/use-result-pipelines)
- Review [Core API Reference](/packages/cli/docs/reference/core)
- Learn about [Testing Errors](/packages/cli/docs/how-to/test-cli-applications)
