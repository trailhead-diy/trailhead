---
type: how-to
title: 'Use CLI Pipeline Utilities'
description: 'Use @esteban-url/cli pipeline API for streamlined command operations'
prerequisites:
  - Understanding of Result types
  - Basic async/await knowledge
  - Familiarity with @esteban-url/cli commands
related:
  - /packages/cli/reference/flow-control.md
  - ./migrate-to-pipelines.md
  - /packages/cli/how-to/handle-errors-in-cli
  - /docs/how-to/compose-result-operations
---

# Use CLI Pipeline Utilities

This guide shows you how to use @esteban-url/cli's pipeline utilities for building robust command-line operations with automatic error propagation, progress tracking, and cancellation support.

> **Note**: For general Result composition patterns, see [Compose Result Operations](/docs/how-to/compose-result-operations).

## Basic Pipeline Usage

### Step 1: Import Pipeline Utilities

```typescript
import { pipeline, Ok, Err } from '@esteban-url/cli/core'
```

### Step 2: Create a Simple Pipeline

Transform sequential operations into a pipeline:

```typescript
// Before: Manual error checking
async function processData(input: string): Promise<Result<ProcessedData>> {
  const parseResult = await parseJSON(input)
  if (!parseResult.success) {
    return Err(new Error(`Parse failed: ${parseResult.error.message}`))
  }

  const validateResult = await validateData(parseResult.value)
  if (!validateResult.success) {
    return Err(new Error(`Validation failed: ${validateResult.error.message}`))
  }

  const transformResult = await transformData(validateResult.value)
  if (!transformResult.success) {
    return Err(new Error(`Transform failed: ${transformResult.error.message}`))
  }

  return transformResult
}

// After: Pipeline with automatic error propagation
async function processData(input: string): Promise<Result<ProcessedData>> {
  return pipeline(input)
    .step('Parse JSON', parseJSON)
    .step('Validate data', validateData)
    .step('Transform data', transformData)
    .execute()
}
```

## Working with Context

### Passing Context Through Steps

Use an object to maintain context between steps:

```typescript
interface ProcessContext {
  inputFile: string
  rawData?: string
  parsedData?: any
  validatedData?: any
  outputFile?: string
}

const result = await pipeline<ProcessContext>({ inputFile: 'data.json' })
  .step('Read file', async (ctx) => {
    const content = await fs.readFile(ctx.inputFile, 'utf-8')
    return Ok({ ...ctx, rawData: content })
  })
  .step('Parse JSON', async (ctx) => {
    try {
      const parsed = JSON.parse(ctx.rawData!)
      return Ok({ ...ctx, parsedData: parsed })
    } catch (error) {
      return Err(new Error(`Invalid JSON: ${error.message}`))
    }
  })
  .step('Validate', async (ctx) => {
    const validation = validateSchema(ctx.parsedData)
    if (!validation.success) {
      return Err(new Error(validation.error))
    }
    return Ok({ ...ctx, validatedData: validation.data })
  })
  .execute()
```

## Conditional Steps

### Execute Steps Based on Conditions

```typescript
const result = await pipeline(config)
  .step('Load config', loadConfiguration)
  .stepIf('Validate premium features', (cfg) => cfg.plan === 'premium', validatePremiumFeatures)
  .stepIf('Apply rate limits', (cfg) => cfg.plan === 'free', applyRateLimits)
  .step('Initialize', initialize)
  .execute()
```

### Complex Conditions

```typescript
const result = await pipeline(data)
  .step('Parse input', parseInput)
  .stepIf('Process images', (d) => d.files.some((f) => f.type.startsWith('image/')), processImages)
  .stepIf(
    'Process documents',
    (d) => d.files.some((f) => f.type === 'application/pdf'),
    processDocuments
  )
  .execute()
```

## Timeouts and Cancellation

### Add Timeouts to Steps

```typescript
const result = await pipeline(url)
  .stepWithTimeout('Fetch data', 5000, async (url) => {
    const response = await fetch(url)
    const data = await response.json()
    return Ok(data)
  })
  .stepWithTimeout('Process data', 10000, processLargeDataset)
  .step('Save results', saveResults)
  .execute()
```

### Support Cancellation

```typescript
const controller = new AbortController()

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000)

const result = await pipeline(data)
  .withAbortSignal(controller.signal)
  .step('Long operation 1', longOperation1)
  .step('Long operation 2', longOperation2)
  .step('Long operation 3', longOperation3)
  .execute()

// User can also cancel manually
button.onclick = () => controller.abort()
```

## Error Handling

### Basic Error Recovery

```typescript
const result = await pipeline(data)
  .step('Primary source', fetchFromPrimary)
  .onError(async (error, stepName) => {
    console.warn(`${stepName} failed: ${error.message}`)
    // Try fallback
    return fetchFromSecondary(data)
  })
  .execute()
```

### Selective Error Recovery

```typescript
const result = await pipeline(data)
  .step('Network operation', fetchData)
  .step('Parse response', parseResponse)
  .onError(async (error, stepName) => {
    // Only recover from network errors
    if (error.code === 'NETWORK_ERROR' && stepName === 'Network operation') {
      console.log('Using cached data')
      return Ok(getCachedData())
    }
    // Let other errors propagate
    return Err(error)
  })
  .execute()
```

## Progress Tracking

### Track Pipeline Progress

```typescript
const result = await pipeline(files)
  .onProgress((step, current, total) => {
    const percentage = Math.round((current / total) * 100)
    console.log(`[${percentage}%] ${step}`)
    updateProgressBar(percentage)
  })
  .step('Load files', loadFiles)
  .step('Validate format', validateFormat)
  .step('Transform data', transformData)
  .step('Generate output', generateOutput)
  .execute()
```

### Progress with UI Updates

```typescript
const progressElement = document.getElementById('progress')
const statusElement = document.getElementById('status')

const result = await pipeline(data)
  .onProgress((step, current, total) => {
    const percentage = (current / total) * 100
    progressElement.style.width = `${percentage}%`
    statusElement.textContent = step
  })
  .step('Downloading', download)
  .step('Processing', process)
  .step('Uploading', upload)
  .execute()
```

## Data Transformation

### Use Map for Synchronous Transforms

```typescript
const result = await pipeline(csvData)
  .step('Parse CSV', parseCSV)
  .map('Add timestamps', (data) =>
    data.map((row) => ({
      ...row,
      timestamp: new Date().toISOString(),
    }))
  )
  .map('Calculate totals', (data) => ({
    rows: data,
    total: data.reduce((sum, row) => sum + row.amount, 0),
  }))
  .step('Save to database', saveToDatabase)
  .execute()
```

## Parallel Operations

### Execute Steps in Parallel

```typescript
import { pipeline, parallel } from '@esteban-url/cli/core'

const result = await pipeline(userId)
  .step('Validate user', validateUser)
  .step('Fetch user data', async (id) => {
    // Fetch multiple data sources in parallel
    return parallel({
      profile: () => fetchProfile(id),
      posts: () => fetchPosts(id),
      followers: () => fetchFollowers(id),
    })
  })
  .map('Combine data', ({ profile, posts, followers }) => ({
    user: profile,
    stats: {
      postCount: posts.length,
      followerCount: followers.length,
    },
  }))
  .execute()
```

### Parallel with Failure Tolerance

```typescript
import { parallelSettled } from '@esteban-url/cli/core'

const result = await pipeline(urls)
  .step('Fetch all resources', async (urls) => {
    const results = await parallelSettled(urls.map((url) => () => fetchResource(url)))

    if (results.success) {
      console.log(`Fetched ${results.value.successes.length} resources`)
      console.log(`Failed: ${results.value.failures.length}`)
      return Ok(results.value.successes)
    }

    return results
  })
  .execute()
```

## Retry Logic

### Retry Failed Pipelines

```typescript
import { retryPipeline } from '@esteban-url/cli/core'

const result = await retryPipeline(
  () =>
    pipeline(apiEndpoint)
      .step('Authenticate', authenticate)
      .step('Fetch data', fetchData)
      .step('Process', process),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Attempt ${attempt} failed: ${error.message}`)
    },
  }
)
```

## Real-World Example

### File Processing Pipeline

```typescript
import { pipeline, errorTemplates } from '@esteban-url/cli/core'
import { createFileSystem } from '@esteban-url/cli/filesystem'

interface FileProcessContext {
  inputPath: string
  content?: string
  data?: any[]
  processed?: any[]
  outputPath?: string
}

export async function processDataFile(
  inputPath: string,
  outputPath: string
): Promise<Result<void>> {
  const fs = createFileSystem()

  return pipeline<FileProcessContext>({ inputPath, outputPath })
    .step('Check input file exists', async (ctx) => {
      const exists = await fs.exists(ctx.inputPath)
      if (!exists) {
        return Err(errorTemplates.fileNotFound(ctx.inputPath))
      }
      return Ok(ctx)
    })
    .step('Read file content', async (ctx) => {
      const result = await fs.readFile(ctx.inputPath, 'utf-8')
      if (!result.success) {
        return Err(errorTemplates.permissionDenied(ctx.inputPath, 'read'))
      }
      return Ok({ ...ctx, content: result.value })
    })
    .step('Parse CSV data', async (ctx) => {
      try {
        const data = parseCSV(ctx.content!)
        return Ok({ ...ctx, data })
      } catch (error) {
        return Err(errorTemplates.parseFailure('CSV', ctx.inputPath, error.message))
      }
    })
    .stepIf(
      'Validate data',
      (ctx) => ctx.data!.length > 0,
      async (ctx) => {
        const errors = validateData(ctx.data!)
        if (errors.length > 0) {
          return Err(new Error(`Validation failed: ${errors.join(', ')}`))
        }
        return Ok(ctx)
      }
    )
    .step('Process data', async (ctx) => {
      const processed = await processRows(ctx.data!)
      return Ok({ ...ctx, processed })
    })
    .step('Write output', async (ctx) => {
      const output = JSON.stringify(ctx.processed, null, 2)
      const result = await fs.writeFile(ctx.outputPath!, output)
      if (!result.success) {
        return Err(errorTemplates.permissionDenied(ctx.outputPath!, 'write'))
      }
      return Ok(ctx)
    })
    .onProgress((step, current, total) => {
      console.log(`[${current}/${total}] ${step}`)
    })
    .onError(async (error, step) => {
      console.error(`Pipeline failed at "${step}": ${error.message}`)
      return Err(error)
    })
    .execute()
    .then((result) => (result.success ? Ok(undefined) : result))
}
```

## Best Practices

### 1. Name Your Steps

Always provide descriptive names for better debugging:

```typescript
// Good
.step('Parse configuration file', parseConfig)
.step('Validate API credentials', validateCredentials)

// Less helpful
.step(parseConfig)
.step(validateCredentials)
```

### 2. Keep Steps Focused

Each step should do one thing:

```typescript
// Good: Separate concerns
.step('Read file', readFile)
.step('Parse JSON', parseJSON)
.step('Validate schema', validateSchema)

// Bad: Too many responsibilities
.step('Read and parse and validate', readParseValidate)
```

### 3. Use Context Objects

Maintain state through context objects:

```typescript
interface Context {
  // Define all possible fields
  input?: string
  parsed?: any
  validated?: any
  result?: any
}

// Type-safe context passing
pipeline<Context>({ input: data })
```

### 4. Handle Errors Appropriately

Use error templates for consistency:

```typescript
import { errorTemplates } from '@esteban-url/cli/core'

.step('Check file', async (path) => {
  if (!exists(path)) {
    return Err(errorTemplates.fileNotFound(path))
  }
  return Ok(path)
})
```

## Next Steps

- Learn about [Error Templates](/packages/cli/how-to/handle-errors-in-cli)
- Explore [Pipeline Migration](/packages/cli/how-to/migrate-to-pipelines)
- Review [Flow Control Reference](/packages/cli/reference/flow-control)
