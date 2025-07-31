---
type: explanation
title: 'Result Patterns in FileSystem Operations'
description: 'Understanding the design and benefits of Result-based error handling in filesystem operations'
related:
  - ../how-to/file-operations.md
  - ../reference/api.md
  - /docs/explanation/result-types-pattern.md
---

# Result Patterns in FileSystem Operations

This document explains why @repo/fs uses Result types for error handling and how this design improves reliability and composability in filesystem operations.

## Overview

The @repo/fs package uses Result types instead of throwing exceptions for error handling. This approach makes errors explicit, predictable, and composable, leading to more robust filesystem operations.

## Background

### The Problem with Traditional Filesystem APIs

Traditional Node.js filesystem operations use either callbacks with error-first patterns or async/await with thrown exceptions:

```typescript
// Callback style - error-prone and complex
fs.readFile('config.json', (err, data) => {
  if (err) {
    console.error('Read failed:', err.message)
    return
  }
  // Process data...
})

// Promise style with exceptions - hidden error paths
try {
  const data = await fs.readFile('config.json', 'utf8')
  // Process data...
} catch (error) {
  console.error('Read failed:', error.message)
  // Error handling scattered throughout code
}
```

### Problems with Exception-Based Approach

1. **Hidden Error Paths** - Exceptions aren't visible in function signatures
2. **Easy to Forget** - Error handling can be accidentally omitted
3. **Complex Composition** - Chaining operations requires extensive try/catch blocks
4. **Performance Overhead** - Exception throwing and catching has runtime cost
5. **Unpredictable Control Flow** - Exceptions can bubble up unexpectedly

## Core Concepts

### Result Type Structure

The Result type makes error handling explicit:

```typescript
type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }
```

Every filesystem operation returns a Result that must be explicitly checked:

```typescript
const result = await fs.readFile('config.json')
if (result.success) {
  // Type system guarantees result.value is available
  console.log('Content:', result.value)
} else {
  // Type system guarantees result.error is available
  console.error('Error:', result.error.message)
}
```

### Type Safety Benefits

TypeScript can enforce error handling at compile time:

```typescript
// This won't compile - must check success first
const result = await fs.readFile('config.json')
console.log(result.value) // ❌ Error: Property 'value' doesn't exist on type Result

// This compiles and is safe
const result = await fs.readFile('config.json')
if (result.success) {
  console.log(result.value) // ✅ TypeScript knows this is safe
}
```

## Design Decisions

### Decision 1: Explicit Error Handling

**Context**: Filesystem operations are inherently unreliable (permissions, network, hardware)

**Options considered**:

1. Exception-based approach - Follow Node.js conventions
2. Error-first callbacks - Traditional Node.js pattern
3. Result types - Functional programming approach
4. Maybe/Option types - Handle absence vs. errors separately

**Decision**: Result types with explicit error handling

**Trade-offs**:

- **Gained**: Type safety, explicit error paths, composability, performance
- **Lost**: Familiarity for some developers, slightly more verbose syntax

### Decision 2: Dependency Injection Pattern

**Context**: Different applications need different filesystem configurations

**Decision**: Factory functions that return configured operations

```typescript
// Factory function approach
const reader = readFile({ encoding: 'utf8' })
const config = await reader('./config.json')
const data = await reader('./data.json')
```

**Trade-offs**:

- **Gained**: Testability, configuration flexibility, reusability
- **Lost**: Direct function calls, slightly more setup

### Decision 3: Consistent Result Structure

**Context**: All operations should follow the same error handling pattern

**Decision**: Every operation returns Result<T, FileSystemError>

**Trade-offs**:

- **Gained**: Consistent API, predictable error handling, composability
- **Lost**: Operation-specific return types, some flexibility

## Implementation Patterns

### Basic Error Propagation

Results naturally propagate errors through operation chains:

```typescript
async function processConfigFile(configPath: string) {
  // Each operation returns a Result
  const readResult = await fs.readFile(configPath)
  if (!readResult.success) {
    return readResult // Propagate error
  }

  const parseResult = parseJSON(readResult.value)
  if (!parseResult.success) {
    return parseResult // Propagate error
  }

  const processResult = processConfig(parseResult.value)
  return processResult // Return final result
}
```

### Early Return Pattern

Result types enable clean early returns:

```typescript
async function setupProject(projectPath: string) {
  // Check if directory already exists
  const existsResult = await fs.exists(projectPath)
  if (!existsResult.success) {
    return existsResult // Propagate filesystem error
  }

  if (existsResult.value) {
    return err(new Error('Project directory already exists'))
  }

  // Create project directory
  const mkdirResult = await fs.mkdir(projectPath)
  if (!mkdirResult.success) {
    return mkdirResult // Propagate mkdir error
  }

  // Continue with setup...
  return ok({ created: true })
}
```

### Operation Composition

Results compose naturally without nested try/catch blocks:

```typescript
async function copyWithBackup(srcPath: string, destPath: string) {
  // Create backup if destination exists
  const destExistsResult = await fs.exists(destPath)
  if (!destExistsResult.success) {
    return destExistsResult
  }

  if (destExistsResult.value) {
    const backupPath = `${destPath}.backup`
    const backupResult = await fs.copy(destPath, backupPath)
    if (!backupResult.success) {
      return backupResult
    }
  }

  // Perform main copy
  const copyResult = await fs.copy(srcPath, destPath)
  return copyResult
}
```

## Error Recovery Patterns

### Fallback Operations

Result types make fallback strategies clear and type-safe:

```typescript
async function readConfigWithDefaults(configPath: string) {
  // Try primary config
  const primaryResult = await fs.readJson(configPath)
  if (primaryResult.success) {
    return primaryResult
  }

  // Try fallback config
  const fallbackPath = configPath.replace('.json', '.default.json')
  const fallbackResult = await fs.readJson(fallbackPath)
  if (fallbackResult.success) {
    return fallbackResult
  }

  // Use hardcoded defaults
  const defaults = { port: 3000, host: 'localhost' }
  return ok(defaults)
}
```

### Partial Success Handling

Handle scenarios where some operations succeed and others fail:

```typescript
async function copyMultipleFiles(filePairs: Array<{ src: string; dest: string }>) {
  const results = []
  const errors = []

  for (const { src, dest } of filePairs) {
    const copyResult = await fs.copy(src, dest)

    if (copyResult.success) {
      results.push({ src, dest, success: true })
    } else {
      errors.push({ src, dest, error: copyResult.error.message })
      // Continue processing other files
    }
  }

  // Return partial success information
  return ok({
    successful: results.length,
    failed: errors.length,
    total: filePairs.length,
    results,
    errors,
  })
}
```

### Retry Logic

Implement retry logic with clear error information:

```typescript
async function readFileWithRetries(filePath: string, maxRetries = 3) {
  let lastError: FileSystemError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await fs.readFile(filePath)

    if (result.success) {
      return result
    }

    lastError = result.error

    // Don't retry for certain error types
    if (result.error.code === 'ENOENT') {
      break // File doesn't exist, retrying won't help
    }

    if (attempt < maxRetries) {
      await sleep(1000 * attempt) // Exponential backoff
    }
  }

  return err(lastError!)
}
```

## Performance Considerations

### Memory Efficiency

Result types avoid exception stack traces and cleanup overhead:

```typescript
// Exception approach - creates stack trace
try {
  const data = await fs.readFile('large-file.txt')
} catch (error) {
  // Stack trace stored in memory
}

// Result approach - lightweight error object
const result = await fs.readFile('large-file.txt')
if (!result.success) {
  // Only essential error information
  console.error(result.error.message)
}
```

### Execution Speed

Results avoid the performance cost of exception throwing:

```typescript
// Benchmarks show Result types are ~2-3x faster than exceptions
// for error cases, with no overhead in success cases

async function benchmarkComparison() {
  // Exception approach
  const startException = performance.now()
  for (let i = 0; i < 10000; i++) {
    try {
      await riskyOperationWithExceptions()
    } catch (error) {
      // Handle error
    }
  }
  const exceptionTime = performance.now() - startException

  // Result approach
  const startResult = performance.now()
  for (let i = 0; i < 10000; i++) {
    const result = await riskyOperationWithResults()
    if (!result.success) {
      // Handle error
    }
  }
  const resultTime = performance.now() - startResult

  console.log(`Exception approach: ${exceptionTime}ms`)
  console.log(`Result approach: ${resultTime}ms`)
  // Typically shows 40-60% improvement for error cases
}
```

## Testing Benefits

### Predictable Test Cases

Result types make both success and error cases explicit:

```typescript
describe('file operations', () => {
  it('handles successful read', async () => {
    const result = await fs.readFile('existing-file.txt')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value).toContain('expected content')
    }
  })

  it('handles file not found', async () => {
    const result = await fs.readFile('missing-file.txt')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('ENOENT')
      expect(result.error.message).toContain('missing-file.txt')
    }
  })
})
```

### Error Injection

Mock specific error scenarios easily:

```typescript
const mockFs = {
  readFile: jest
    .fn()
    .mockReturnValue(Promise.resolve(err(new FileSystemError('EACCES', 'Permission denied')))),
}

// Test error handling without actually creating permission issues
const result = await processWithMockFs(mockFs)
expect(result.success).toBe(false)
```

## Common Misconceptions

❌ **Misconception**: "Result types make code more verbose"
✅ **Reality**: Result types eliminate try/catch blocks and make error handling more concise

❌ **Misconception**: "Exceptions are more familiar to JavaScript developers"  
✅ **Reality**: Result types are becoming common in modern TypeScript codebases

❌ **Misconception**: "You still need to remember to check results"
✅ **Reality**: TypeScript enforces checking at compile time, unlike exceptions

❌ **Misconception**: "Result types are slower than exceptions"
✅ **Reality**: Results are faster, especially in error scenarios

## Best Practices

### Always Check Results

The type system enforces this, but be explicit:

```typescript
// Good - explicit check
const result = await fs.readFile(path)
if (!result.success) {
  logger.error(`Failed to read ${path}: ${result.error.message}`)
  return result
}

// Bad - accessing value without checking (won't compile)
const result = await fs.readFile(path)
console.log(result.value) // ❌ TypeScript error
```

### Propagate Errors Appropriately

Don't swallow errors unless you have a good reason:

```typescript
// Good - propagate filesystem errors
async function loadConfig(path: string) {
  const result = await fs.readJson(path)
  if (!result.success) {
    return result // Let caller handle filesystem error
  }

  return ok(result.value)
}

// Bad - hiding filesystem errors
async function loadConfig(path: string) {
  const result = await fs.readJson(path)
  if (!result.success) {
    return ok({}) // ❌ Caller doesn't know what happened
  }

  return ok(result.value)
}
```

### Use Type Guards for Complex Logic

Extract result checking into reusable patterns:

```typescript
function isFileNotFound(result: Result<any, FileSystemError>): boolean {
  return !result.success && result.error.code === 'ENOENT'
}

// Usage
const result = await fs.readFile(configPath)
if (isFileNotFound(result)) {
  // Handle missing file specifically
  return ok(getDefaultConfig())
}

if (!result.success) {
  // Handle other filesystem errors
  return result
}
```

## Integration Examples

### With Express.js Applications

```typescript
app.get('/config', async (req, res) => {
  const result = await fs.readJson('./config.json')

  if (result.success) {
    res.json(result.value)
  } else {
    console.error('Config read failed:', result.error.message)
    res.status(500).json({
      error: 'Failed to load configuration',
      details: result.error.message,
    })
  }
})
```

### With CLI Applications

```typescript
const configCommand = createCommand({
  name: 'config',
  description: 'Manage configuration',
  action: async (options, context) => {
    const result = await fs.readJson('./config.json')

    if (!result.success) {
      context.logger.error(`Failed to read config: ${result.error.message}`)
      return result // CLI framework handles Result types
    }

    context.logger.info('Current configuration:')
    console.log(JSON.stringify(result.value, null, 2))
    return ok(undefined)
  },
})
```

### With Stream Processing

```typescript
async function processLargeFile(inputPath: string, outputPath: string) {
  // Check input exists
  const existsResult = await fs.exists(inputPath)
  if (!existsResult.success) return existsResult
  if (!existsResult.value) {
    return err(new Error(`Input file not found: ${inputPath}`))
  }

  // Ensure output directory exists
  const outputDir = dirname(outputPath)
  const ensureResult = await fs.ensureDir(outputDir)
  if (!ensureResult.success) return ensureResult

  // Process file with streams (implementation would use streams)
  // Result types work well with stream error handling too

  return ok({ processed: true, inputPath, outputPath })
}
```

## Future Considerations

### Enhanced Error Types

The Result pattern allows for rich error information:

```typescript
interface FileSystemError extends Error {
  code: string
  path: string
  operation: string
  errno?: number
  syscall?: string
  context?: Record<string, any>
}
```

### Operation Pipelines

Result types enable powerful operation composition:

```typescript
// Future: Pipeline syntax for chaining operations
const result = await pipeline(inputPath)
  .step('read', fs.readFile)
  .step('parse', parseJSON)
  .step('transform', transformData)
  .step('write', (data) => fs.writeJson(outputPath, data))
  .execute()
```

### Async Iteration

Result types work well with async iteration patterns:

```typescript
async function* processFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    const result = await fs.readFile(filePath)
    yield { filePath, result }
  }
}
```

---

The Result pattern in @repo/fs represents a fundamental shift toward more reliable, testable, and maintainable filesystem operations. While it requires learning new patterns, the benefits in type safety, error handling, and code quality make it a worthwhile investment for modern TypeScript applications.
