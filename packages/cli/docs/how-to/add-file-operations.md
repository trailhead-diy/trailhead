---
type: how-to
title: 'How to Add File Operations to Your CLI'
description: 'Add file reading, writing, and processing capabilities to your CLI application'
prerequisites:
  - Completed the getting started tutorial
  - Understanding of Result types
  - Basic CLI structure created
related:
  - /packages/fs/docs/reference/api
  - /packages/cli/docs/reference/command
  - /packages/cli/docs/tutorials/getting-started
---

# How to Add File Operations to Your CLI

This guide shows you how to add file system operations to your CLI application using the @repo/fs package.

## Prerequisites

- A working CLI application structure
- Understanding of Result types for error handling
- The @repo/fs package installed

## Adding File Reading

To read files in your CLI commands:

```typescript
import { ok, err } from '@trailhead/cli'
import { createCommand } from '@trailhead/cli/command'
import { fs } from '@repo/fs'

const readCommand = createCommand({
  name: 'read',
  description: 'Read a file',
  options: [
    {
      name: 'file',
      alias: 'f',
      type: 'string',
      required: true,
      description: 'File to read',
    },
  ],
  action: async (options, context) => {
    const result = await fs.readFile(options.file)

    if (result.isErr()) {
      return err(new Error(`Failed to read: ${result.error.message}`))
    }

    context.logger.info(result.value)
    return ok(undefined)
  },
})
```

## Processing Files with Validation

For more complex file processing:

```typescript
import { ok, err } from '@trailhead/cli'
import { createCommand } from '@trailhead/cli/command'
import { fs } from '@repo/fs'

const processCommand = createCommand({
  name: 'process',
  description: 'Process a data file',
  options: [
    { name: 'input', alias: 'i', type: 'string', required: true, description: 'Input file' },
    { name: 'output', alias: 'o', type: 'string', description: 'Output file' },
    { name: 'format', alias: 'f', type: 'string', description: 'Output format' },
  ],
  action: async (options, context) => {
    // Validate input file exists
    const exists = await fs.exists(options.input)
    if (exists.isErr()) {
      return err(new Error(`Input file does not exist: ${options.input}`))
    }

    // Read and process file
    const data = await parseFile(options.input, options.format)

    if (options.output) {
      const writeResult = await fs.writeFile(options.output, JSON.stringify(data))
      if (writeResult.isErr()) {
        return err(new Error(`Failed to write output: ${writeResult.error.message}`))
      }
    }

    return ok(undefined)
  },
})
```

## Working with Multiple Files

To process multiple files:

```typescript
import { fs } from '@repo/fs'
import { combineWithAllErrors } from '@trailhead/core'

async const processMultipleFiles = async (patterns: string[]) => {
  const results = await Promise.all(patterns.map((pattern) => fs.glob(pattern)))

  const combined = combineWithAllErrors(results)
  if (combined.isErr()) {
    return err(new Error(`Failed to find files: ${combined.error.join(', ')}`))
  }

  const allFiles = combined.value.flat()
  // Process each file...
}
```

## File System Context

Access file system through command context:

```typescript
async const myAction = async (options: any, context: CommandContext) => {
  // File system is available in context
  const result = await context.fs.readFile('config.json')

  // Project root is also available
  const configPath = path.join(context.projectRoot, 'config.json')
}
```

## Error Handling Best Practices

Always handle file system errors explicitly:

```typescript
const result = await fs.readFile(filePath)

if (result.isErr()) {
  // Check specific error types
  if (result.error.code === 'ENOENT') {
    return err(new Error(`File not found: ${filePath}`))
  }
  if (result.error.code === 'EACCES') {
    return err(new Error(`Permission denied: ${filePath}`))
  }
  return err(new Error(`File error: ${result.error.message}`))
}
```

## Common Patterns

### Safe File Writing

```typescript
// Write with automatic directory creation
const writeResult = await fs.writeFile('./output/data.json', JSON.stringify(data, null, 2))
```

### JSON File Operations

```typescript
// Read and parse JSON
const readJson = async (path: string) => {
  const result = await fs.readFile(path)
  if (result.isErr()) return result

  try {
    return ok(JSON.parse(result.value))
  } catch (e) {
    return err(new Error(`Invalid JSON in ${path}`))
  }
}
```

## See Also

- [File System API Reference](../../../fs/reference/api)
- [Command API Reference](../../reference/command)
- [Error Handling Patterns](../../how-to/handle-errors-in-cli)
