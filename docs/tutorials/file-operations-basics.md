---
type: tutorial
title: 'File Operations Basics'
description: 'Introduction to functional filesystem operations using @repo/fs with Result-based error handling'
prerequisites:
  - Basic TypeScript knowledge
  - Node.js 18+ installed
  - Understanding of async/await
related:
  - /packages/fs/docs/reference/api
  - /docs/how-to/perform-atomic-file-operations
  - /docs/explanation/result-types-pattern
---

# Tutorial: File Operations with @repo/fs

This tutorial introduces you to functional filesystem operations using `@repo/fs`. You'll learn how to perform common file operations with explicit error handling using Result types.

## What You'll Learn

- Reading and writing files with Result-based error handling
- Managing configurations functionally
- Processing multiple files
- Implementing atomic file operations

## Prerequisites

- Basic TypeScript knowledge
- Node.js 18+ installed
- Understanding of async/await

## Step 1: Installation and Setup

Install the filesystem package:

```bash
pnpm add @repo/fs @repo/core
```

Create a new file `file-operations.ts` to follow along.

## Step 2: Basic File Operations

Let's start with reading and writing files:

```typescript
import { fs } from '@repo/fs'

// Read a file
async function readConfig() {
  const result = await fs.readFile('./config.json')

  if (result.isErr()) {
    console.error('Failed to read config:', result.error.message)
    return
  }

  console.log('Config contents:', result.value)
}
```

Notice how:

- Every operation returns a Result
- Errors are handled explicitly
- No try-catch blocks needed

## Step 3: Configuration File Manager

Build a configuration manager using functional patterns:

```typescript
import { fs } from '@repo/fs'
import { ok } from '@repo/core'

// Pure transformation
const mergeConfigs = (current: any, updates: any) => ({ ...current, ...updates })

// Load or create config
const loadConfig = async (path: string) => {
  const result = await fs.readJson(path)
  return result.isOk()
    ? result
    : fs.writeJson(path, { version: '1.0.0' }).then(() => ok({ version: '1.0.0' }))
}

// Update config functionally
const updateConfig = (path: string, updates: any) =>
  loadConfig(path).then((result) =>
    result.isOk() ? fs.writeJson(path, mergeConfigs(result.value, updates)) : result
  )
```

## Step 4: File Processing Pipeline

Create a pipeline that processes text files:

```typescript
import { fs } from '@repo/fs'
import { join } from '@repo/fs/utils'
import { ok } from '@repo/core'

// Pure transformations
const toUpperCase = (text: string) => text.toUpperCase()
const addExtension = (file: string, ext: string) => file.replace(/\.[^.]+$/, ext)

// Process single file
const processFile = async (inputPath: string, outputPath: string) => {
  const result = await fs.readFile(inputPath)
  return result.isErr() ? result : fs.writeFile(outputPath, toUpperCase(result.value))
}
```

## Step 5: Directory Processing

Process all files in a directory:

```typescript
// Process directory of files
const processDirectory = async (inputDir: string, outputDir: string) => {
  // Find all text files
  const files = await fs.findFiles('**/*.txt', { cwd: inputDir })

  if (files.isErr()) return files

  // Ensure output directory exists
  await fs.ensureDir(outputDir)

  // Process each file
  const tasks = files.value.map((file) =>
    processFile(join(inputDir, file), join(outputDir, addExtension(file, '.processed')))
  )

  return Promise.all(tasks).then((results) => ok(results))
}
```

## Step 6: Atomic File Operations

Implement atomic writes to prevent corruption:

```typescript
import { fs } from '@repo/fs'
import { ok } from '@repo/core'

// Pure function to create temp path
const toTempPath = (path: string) => `${path}.tmp`

// Atomic write with cleanup on failure
const writeAtomic = async (path: string, content: string) => {
  const tempPath = toTempPath(path)

  // Write to temp file first
  const writeResult = await fs.writeFile(tempPath, content)
  if (writeResult.isErr()) {
    await fs.remove(tempPath) // Clean up
    return writeResult
  }

  // Move temp file to final location
  const moveResult = await fs.move(tempPath, path, { overwrite: true })
  if (moveResult.isErr()) {
    await fs.remove(tempPath) // Clean up
    return moveResult
  }

  return ok(undefined)
}
```

## Step 7: Complete Example

Put it all together in a complete example:

```typescript
import { fs } from '@repo/fs'
import { join } from '@repo/fs/utils'

async function main() {
  // Ensure working directory
  await fs.ensureDir('./output')

  // Process configuration
  const configResult = await updateConfig('./app.config.json', {
    lastRun: new Date().toISOString(),
    processCount: 0,
  })

  if (configResult.isErr()) {
    console.error('Config update failed:', configResult.error)
    return
  }

  // Process files
  const processResult = await processDirectory('./input', './output')

  if (processResult.isErr()) {
    console.error('Processing failed:', processResult.error)
    return
  }

  console.log('Processing completed successfully!')

  // Update config with results
  await updateConfig('./app.config.json', {
    processCount: processResult.value.length,
  })
}

main()
```

## Error Handling Patterns

Handle specific error types:

```typescript
const handleFileOperation = async (path: string) => {
  const result = await fs.readFile(path)

  if (result.isErr()) {
    const error = result.error

    switch (error.code) {
      case 'ENOENT':
        console.log('File not found - creating default')
        return fs.writeFile(path, 'default content')

      case 'EACCES':
        console.error('Permission denied - check file permissions')
        return result

      default:
        console.error('Unexpected error:', error.message)
        return result
    }
  }

  return result
}
```

## Testing Your Code

Use the mock filesystem for testing:

```typescript
import { createMockFS } from '@repo/fs/testing'
import { describe, it, expect } from 'vitest'

describe('File Operations', () => {
  it('processes files correctly', async () => {
    const mockFS = createMockFS({
      '/input/test.txt': 'hello world',
    })

    const result = await processFile('/input/test.txt', '/output/test.txt')
    expect(result.isOk()).toBe(true)

    const content = await mockFS.readFile('/output/test.txt')
    expect(content.value).toBe('HELLO WORLD')
  })
})
```

## Best Practices

1. **Always handle Result types** - Check `isErr()` before using values
2. **Use pure functions** - Keep transformations separate from I/O
3. **Clean up on failure** - Remove temporary files if operations fail
4. **Test with mocks** - Use `createMockFS` for unit tests
5. **Compose operations** - Build complex operations from simple ones

## Next Steps

- Explore JSON operations with `readJson` and `writeJson`
- Learn about glob patterns with `findFiles`
- Implement file watching for live updates
- Build a CLI tool using these operations

## Related Resources

- [How to Perform Atomic File Operations](/docs/how-to/perform-atomic-file-operations)
- [@repo/fs API Reference](/packages/fs/docs/reference/api)
- [Testing File Operations](/docs/how-to/perform-atomic-file-operations)
