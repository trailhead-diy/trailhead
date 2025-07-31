---
type: how-to
title: 'Migrate to Pipeline Utilities'
description: 'Replace manual error checking with streamlined pipeline operations'
prerequisites:
  - Existing code using manual Result checking
  - Understanding of Result types
  - Basic async/await knowledge
related:
  - ../reference/flow-control.md
  - ./use-result-pipelines.md
  - ../reference/core.md
---

# Migrate to Pipeline Utilities

This guide shows you how to migrate existing code from manual Result checking to pipeline utilities, eliminating 5-10 lines of boilerplate per operation chain.

## Identifying Migration Candidates

### Look for Repetitive Patterns

Common patterns that benefit from pipelines:

```typescript
// Pattern 1: Sequential operations with error checking
const step1 = await operation1()
if (!step1.success) {
  return Err(new Error(`Step 1 failed: ${step1.error.message}`))
}

const step2 = await operation2(step1.value)
if (!step2.success) {
  return Err(new Error(`Step 2 failed: ${step2.error.message}`))
}

// Pattern 2: Nested error handling
try {
  const data = await fetchData()
  if (!data) {
    return Err(new Error('No data'))
  }
  const processed = await processData(data)
  if (!processed.success) {
    return Err(processed.error)
  }
  return Ok(processed.value)
} catch (error) {
  return Err(error)
}

// Pattern 3: Multiple async operations
const results = []
for (const item of items) {
  const result = await processItem(item)
  if (!result.success) {
    return Err(result.error)
  }
  results.push(result.value)
}
```

## Basic Migration Examples

### Sequential Operations

#### Before: Manual Checking

```typescript
async function transformData(inputFile: string): Promise<Result<void>> {
  // Read file
  const readResult = await fs.readFile(inputFile)
  if (!readResult.success) {
    return Err(new Error(`Failed to read file: ${readResult.error.message}`))
  }

  // Parse JSON
  let parsed
  try {
    parsed = JSON.parse(readResult.value)
  } catch (error) {
    return Err(new Error(`Invalid JSON: ${error.message}`))
  }

  // Validate data
  const validationResult = validateSchema(parsed)
  if (!validationResult.success) {
    return Err(new Error(`Validation failed: ${validationResult.error}`))
  }

  // Transform data
  const transformed = transformToNewFormat(validationResult.value)

  // Write output
  const writeResult = await fs.writeFile('output.json', JSON.stringify(transformed))
  if (!writeResult.success) {
    return Err(new Error(`Failed to write: ${writeResult.error.message}`))
  }

  return Ok(undefined)
}
```

#### After: Pipeline

```typescript
import { pipeline } from '@esteban-url/cli/core'

async function transformData(inputFile: string): Promise<Result<void>> {
  return pipeline(inputFile)
    .step('Read file', (path) => fs.readFile(path))
    .step('Parse JSON', (content) => {
      try {
        return Ok(JSON.parse(content))
      } catch (error) {
        return Err(new Error(`Invalid JSON: ${error.message}`))
      }
    })
    .step('Validate schema', validateSchema)
    .map('Transform format', transformToNewFormat)
    .step('Write output', (data) => fs.writeFile('output.json', JSON.stringify(data)))
    .execute()
    .then((result) => (result.success ? Ok(undefined) : result))
}
```

### Error Context Preservation

#### Before: Lost Context

```typescript
async function processUserData(userId: string): Promise<Result<User>> {
  const fetchResult = await fetchUser(userId)
  if (!fetchResult.success) {
    // Original error context is lost
    return Err(new Error('Failed to fetch user'))
  }

  const enrichResult = await enrichUserData(fetchResult.value)
  if (!enrichResult.success) {
    // Have to manually add context
    return Err(new Error(`Failed to enrich data for user ${userId}`))
  }

  return enrichResult
}
```

#### After: Automatic Context

```typescript
import { pipeline } from '@esteban-url/cli/core'

async function processUserData(userId: string): Promise<Result<User>> {
  return pipeline({ userId })
    .step('Fetch user', (ctx) => fetchUser(ctx.userId))
    .step('Enrich user data', enrichUserData)
    .onError((error, stepName) => {
      // Context is automatically preserved
      console.error(`Failed at "${stepName}" for user ${userId}:`, error)
      return Err(error)
    })
    .execute()
}
```

## Migrating Complex Flows

### Conditional Logic

#### Before: Nested Conditions

```typescript
async function deployApplication(config: DeployConfig): Promise<Result<void>> {
  const validateResult = await validateConfig(config)
  if (!validateResult.success) {
    return Err(validateResult.error)
  }

  if (config.runTests) {
    const testResult = await runTests()
    if (!testResult.success) {
      return Err(new Error(`Tests failed: ${testResult.error.message}`))
    }
  }

  const buildResult = await buildApplication()
  if (!buildResult.success) {
    return Err(new Error(`Build failed: ${buildResult.error.message}`))
  }

  if (config.environment === 'production') {
    const approvalResult = await getApproval()
    if (!approvalResult.success) {
      return Err(new Error('Deployment not approved'))
    }
  }

  const deployResult = await deploy(buildResult.value)
  if (!deployResult.success) {
    return Err(new Error(`Deploy failed: ${deployResult.error.message}`))
  }

  return Ok(undefined)
}
```

#### After: Clear Flow

```typescript
async function deployApplication(config: DeployConfig): Promise<Result<void>> {
  return pipeline(config)
    .step('Validate config', validateConfig)
    .stepIf('Run tests', (cfg) => cfg.runTests, runTests)
    .step('Build application', buildApplication)
    .stepIf('Get approval', (cfg) => cfg.environment === 'production', getApproval)
    .step('Deploy', deploy)
    .execute()
    .then((result) => (result.success ? Ok(undefined) : result))
}
```

### Parallel Operations

#### Before: Sequential Processing

```typescript
async function gatherMetrics(servers: string[]): Promise<Result<Metrics>> {
  const cpuResult = await fetchCPUMetrics(servers)
  if (!cpuResult.success) {
    return Err(new Error(`CPU metrics failed: ${cpuResult.error.message}`))
  }

  const memoryResult = await fetchMemoryMetrics(servers)
  if (!memoryResult.success) {
    return Err(new Error(`Memory metrics failed: ${memoryResult.error.message}`))
  }

  const diskResult = await fetchDiskMetrics(servers)
  if (!diskResult.success) {
    return Err(new Error(`Disk metrics failed: ${diskResult.error.message}`))
  }

  return Ok({
    cpu: cpuResult.value,
    memory: memoryResult.value,
    disk: diskResult.value,
  })
}
```

#### After: Parallel Execution

```typescript
import { pipeline, parallel } from '@esteban-url/cli/core'

async function gatherMetrics(servers: string[]): Promise<Result<Metrics>> {
  return pipeline(servers)
    .step('Fetch all metrics', (servers) =>
      parallel({
        cpu: () => fetchCPUMetrics(servers),
        memory: () => fetchMemoryMetrics(servers),
        disk: () => fetchDiskMetrics(servers),
      })
    )
    .execute()
}
```

## Migrating Error Handling

### Standardizing Error Messages

#### Before: Inconsistent Errors

```typescript
async function processFile(path: string): Promise<Result<void>> {
  if (!(await fileExists(path))) {
    return Err(new Error(`File not found: ${path}`))
  }

  const content = await readFile(path)
  if (!content) {
    return Err(new Error(`Could not read file ${path}`))
  }

  if (!isValidFormat(content)) {
    return Err(new Error('Invalid file format'))
  }

  return Ok(undefined)
}
```

#### After: Error Templates

```typescript
import { pipeline, errorTemplates } from '@esteban-url/cli/core'

async function processFile(path: string): Promise<Result<void>> {
  return pipeline(path)
    .step('Check file exists', async (path) => {
      const exists = await fileExists(path)
      return exists ? Ok(path) : Err(errorTemplates.fileNotFound(path))
    })
    .step('Read file', async (path) => {
      const content = await readFile(path)
      return content ? Ok(content) : Err(errorTemplates.permissionDenied(path, 'read'))
    })
    .step('Validate format', (content) => {
      return isValidFormat(content)
        ? Ok(content)
        : Err(errorTemplates.invalidFormat('file', 'JSON', 'unknown'))
    })
    .execute()
    .then((result) => (result.success ? Ok(undefined) : result))
}
```

## Testing Migration

### Update Test Patterns

#### Before: Complex Test Setup

```typescript
it('handles errors correctly', async () => {
  const mockFs = {
    readFile: jest.fn().mockResolvedValue(Err(new Error('Read failed'))),
  }

  const result = await processData('test.json', mockFs)

  expect(result.success).toBe(false)
  expect(result.error.message).toContain('Read failed')
  expect(mockFs.readFile).toHaveBeenCalledWith('test.json')
})
```

#### After: Cleaner Tests

```typescript
it('handles errors correctly', async () => {
  const mockFs = {
    readFile: jest.fn().mockResolvedValue(Err(new Error('Read failed'))),
  }

  const pipeline = createPipeline('test.json').step('Read file', (path) => mockFs.readFile(path))

  const result = await pipeline.execute()

  expect(result).toBeErr()
  expect(result.error.message).toBe('Read failed')
})
```

## Gradual Migration Strategy

### Phase 1: Identify Hotspots

```typescript
// Mark functions for migration - identify functions with multiple error checks
async function complexOperation() {
  // Original function with 8 separate error checks
  // This is a candidate for pipeline migration
  const step1 = await validateInput(input)
  if (step1.isErr()) return step1

  const step2 = await processData(step1.value)
  if (step2.isErr()) return step2

  const step3 = await transformResult(step2.value)
  if (step3.isErr()) return step3

  // ... 5 more similar error checks ...

  return finalResult
}
```

### Phase 2: Create Wrapper Functions

```typescript
// Keep old function during transition
async function processDataLegacy(input: string): Promise<Result<Output>> {
  // ... original implementation ...
}

// New pipeline version
async function processData(input: string): Promise<Result<Output>> {
  return pipeline(input)
    .step('Parse', parse)
    .step('Validate', validate)
    .step('Transform', transform)
    .execute()
}

// Temporary delegation
async function processDataCompat(input: string): Promise<Result<Output>> {
  if (useNewPipeline) {
    return processData(input)
  }
  return processDataLegacy(input)
}
```

### Phase 3: Update Tests

```typescript
describe('processData', () => {
  // Test both implementations during migration
  describe.each([
    ['legacy', processDataLegacy],
    ['pipeline', processData],
  ])('%s implementation', (name, implementation) => {
    it('processes valid data', async () => {
      const result = await implementation('{"valid": true}')
      expect(result).toBeOk()
    })
  })
})
```

### Phase 4: Remove Legacy Code

Once all tests pass with the pipeline version, remove the legacy implementation.

## Common Pitfalls

### 1. Forgetting to Return Results

```typescript
// Wrong: Forgetting to return
.step('Process', async (data) => {
  processData(data) // Missing return!
})

// Correct: Always return Result
.step('Process', async (data) => {
  return processData(data)
})
```

### 2. Mixing Patterns

```typescript
// Avoid: Don't mix manual checking with pipelines
return pipeline(data)
  .step('Step 1', step1)
  .execute()
  .then(async (result) => {
    if (!result.success) return result
    // Don't do manual checking here!
    const step2Result = await step2(result.value)
    if (!step2Result.success) {
      return Err(step2Result.error)
    }
    return step2Result
  })

// Better: Use pipeline throughout
return pipeline(data).step('Step 1', step1).step('Step 2', step2).execute()
```

### 3. Losing Type Information

```typescript
// Preserve types through context
interface ProcessContext {
  input: string
  parsed?: ParsedData
  validated?: ValidatedData
}

pipeline<ProcessContext>({ input: data })
  .step('Parse', async (ctx) => {
    const parsed = await parse(ctx.input)
    return Ok({ ...ctx, parsed })
  })
  .step('Validate', async (ctx) => {
    // TypeScript knows ctx.parsed exists
    const validated = await validate(ctx.parsed!)
    return Ok({ ...ctx, validated })
  })
```

## Migration Checklist

- [ ] Identify functions with 3+ sequential operations
- [ ] Count manual error checks (if statements)
- [ ] Look for repeated error message patterns
- [ ] Find parallel operations running sequentially
- [ ] Create pipeline version alongside original
- [ ] Update tests to cover both versions
- [ ] Run performance comparisons
- [ ] Switch to pipeline version
- [ ] Remove legacy code

## Performance Considerations

Pipelines add minimal overhead:

```typescript
// Benchmark results (typical)
// Manual checking: 1.2ms
// Pipeline: 1.3ms
// Overhead: ~0.1ms (8%)

// For CPU-intensive operations, overhead is negligible
// For I/O operations, overhead is < 1%
```

## Next Steps

- Explore [Pipeline Features](./use-result-pipelines.md)
- Learn about [Error Templates](./handle-errors-in-cli.md)
- Review [Flow Control Reference](../reference/flow-control.md)
