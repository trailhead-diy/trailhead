---
type: explanation
title: '@repo/fs Documentation Hub'
description: 'Functional filesystem operations with Result-based error handling'
related:
  - /packages/fs/docs/how-to/file-operations.md
  - /packages/fs/docs/reference/api.md
  - /packages/fs/docs/explanation/result-patterns.md
---

# @repo/fs Documentation

Functional filesystem operations with Result-based error handling and dependency injection.

## Core Principles

- **Result-based errors** - Explicit error handling without exceptions
- **Functional patterns** - Pure functions with dependency injection
- **Type safety** - Comprehensive TypeScript support
- **Composability** - Operations compose naturally through Result types

## Documentation Structure

### Getting Started

- [File Operations](/packages/fs/docs/how-to/file-operations.md)- Common filesystem tasks

### API Reference

Complete API documentation is available in the shared documentation:

- [FileSystem API Reference](/packages/fs/docs/reference/api.md)- Complete function and type definitions

### Understanding the Design

- [Result Patterns](/packages/fs/docs/explanation/result-patterns.md)- Error handling design

## Key Features

### 1. Result-Based Operations

```typescript
import { fs } from '@repo/fs'

const result = await fs.readFile('./config.json')
if (result.success) {
  console.log('File content:', result.value)
} else {
  console.error('Read failed:', result.error.message)
}
```

### 2. Dependency Injection

```typescript
import { readFile } from '@repo/fs'

// Create configured operation
const reader = readFile({ encoding: 'utf8' })

// Use with different paths
const config = await reader('./config.json')
const data = await reader('./data.txt')
```

### 3. JSON Operations

```typescript
import { fs } from '@repo/fs'

// Read and parse JSON
const configResult = await fs.readJson('./config.json')
if (configResult.success) {
  const config = configResult.value

  // Modify and write back
  config.lastUpdated = new Date().toISOString()
  await fs.writeJson('./config.json', config)
}
```

### 4. Path Utilities

```typescript
import { join, dirname, basename, extname } from '@repo/fs/utils'

const filePath = join('src', 'components', 'Button.tsx')
const dir = dirname(filePath) // 'src/components'
const name = basename(filePath) // 'Button.tsx'
const ext = extname(filePath) // '.tsx'
```

## Quick Examples

### Basic File Operations

```typescript
import { fs } from '@repo/fs'

async function processFile(inputPath: string, outputPath: string) {
  // Check if input exists
  const existsResult = await fs.exists(inputPath)
  if (!existsResult.success || !existsResult.value) {
    return err(new Error(`Input file not found: ${inputPath}`))
  }

  // Read input file
  const readResult = await fs.readFile(inputPath)
  if (!readResult.success) {
    return readResult // Propagate error
  }

  // Transform content
  const transformed = readResult.value.toUpperCase()

  // Write output file
  const writeResult = await fs.writeFile(outputPath, transformed)
  if (!writeResult.success) {
    return writeResult // Propagate error
  }

  return ok({ processed: true, size: transformed.length })
}
```

### Directory Operations

```typescript
import { fs } from '@repo/fs'

async function setupProject(projectPath: string) {
  // Ensure project directory exists
  const dirResult = await fs.ensureDir(projectPath)
  if (!dirResult.success) {
    return dirResult
  }

  // Create subdirectories
  const dirs = ['src', 'tests', 'docs']
  for (const dir of dirs) {
    const subDirResult = await fs.mkdir(join(projectPath, dir))
    if (!subDirResult.success) {
      return subDirResult
    }
  }

  // Create initial files
  const packageJson = {
    name: basename(projectPath),
    version: '1.0.0',
    main: 'src/index.js',
  }

  const packageResult = await fs.writeJson(join(projectPath, 'package.json'), packageJson)

  return packageResult
}
```

### Error Recovery

```typescript
import { fs } from '@repo/fs'

async function readConfigWithFallback(configPath: string) {
  // Try to read main config
  const primaryResult = await fs.readJson(configPath)
  if (primaryResult.success) {
    return primaryResult
  }

  // Try fallback config
  const fallbackPath = configPath.replace('.json', '.default.json')
  const fallbackResult = await fs.readJson(fallbackPath)
  if (fallbackResult.success) {
    console.warn('Using fallback config')
    return fallbackResult
  }

  // Return default config
  const defaultConfig = {
    port: 3000,
    host: 'localhost',
    debug: false,
  }

  console.warn('Using default config')
  return ok(defaultConfig)
}
```

## Supported Operations

| Category        | Operations                                  | Use Case                    |
| --------------- | ------------------------------------------- | --------------------------- |
| **Reading**     | `readFile`, `readJson`, `readIfExists`      | Load data and configuration |
| **Writing**     | `writeFile`, `writeJson`, `outputFile`      | Save data and configuration |
| **Directories** | `mkdir`, `readDir`, `ensureDir`, `emptyDir` | Directory management        |
| **File System** | `exists`, `stat`, `copy`, `move`, `remove`  | File system operations      |
| **Advanced**    | `findFiles`, `copyIfExists`                 | Bulk operations             |

## Error Types

The library provides specific error types for different scenarios:

- `FileSystemError` - General filesystem errors
- `PermissionError` - Access permission issues
- `NotFoundError` - File or directory not found
- `InvalidPathError` - Invalid path format
- `IOError` - Input/output operation failures

## Next Steps

1. Start with [File Operations](/packages/fs/docs/how-to/file-operations.md)for common tasks
2. Review the [FileSystem API Reference](/packages/fs/docs/reference/api.md)for detailed documentation
3. Understand [Result Patterns](/packages/fs/docs/explanation/result-patterns.md)for advanced error handling

## Integration Examples

### With Data Processing

```typescript
import { fs } from '@repo/fs'
import { data } from '@repo/data'

async function processDataFile(inputPath: string, outputPath: string) {
  // Check if input exists
  const existsResult = await fs.exists(inputPath)
  if (!existsResult.success || !existsResult.value) {
    return err(new Error(`File not found: ${inputPath}`))
  }

  // Parse data automatically
  const parseResult = await data.parseAuto(inputPath)
  if (!parseResult.success) {
    return parseResult
  }

  // Transform data
  const transformed = parseResult.value.map((row) => ({
    ...row,
    processed: true,
    timestamp: new Date().toISOString(),
  }))

  // Ensure output directory exists
  const outputDir = dirname(outputPath)
  const dirResult = await fs.ensureDir(outputDir)
  if (!dirResult.success) {
    return dirResult
  }

  // Write transformed data
  const writeResult = await data.writeAuto(outputPath, transformed)
  return writeResult
}
```

### With Configuration Management

```typescript
import { fs } from '@repo/fs'
import { validate } from '@repo/validation'

interface AppConfig {
  port: number
  host: string
  apiKey: string
  features: string[]
}

const configSchema = validate.object({
  port: validate.numberRange(1, 65535),
  host: validate.required,
  apiKey: validate.stringLength(10),
  features: validate.array(validate.required),
})

async function loadValidatedConfig(configPath: string): Promise<Result<AppConfig>> {
  // Read config file
  const readResult = await fs.readJson(configPath)
  if (!readResult.success) {
    return readResult
  }

  // Validate configuration
  const validationResult = configSchema(readResult.value)
  if (!validationResult.success) {
    return err(new Error(`Invalid config: ${validationResult.error.message}`))
  }

  return ok(validationResult.value)
}
```

### With CLI Applications

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { fs } from '@repo/fs'

const copyCommand = createCommand({
  name: 'copy',
  description: 'Copy files or directories',
  options: [
    { name: 'source', type: 'string', required: true },
    { name: 'destination', type: 'string', required: true },
    { name: 'overwrite', type: 'boolean', default: false },
  ],
  action: async (options, context) => {
    const { source, destination, overwrite } = options

    // Check if source exists
    const existsResult = await fs.exists(source)
    if (!existsResult.success) {
      context.logger.error(`Failed to check source: ${existsResult.error.message}`)
      return existsResult
    }

    if (!existsResult.value) {
      const error = new Error(`Source not found: ${source}`)
      context.logger.error(error.message)
      return err(error)
    }

    // Check if destination exists and handle overwrite
    const destExistsResult = await fs.exists(destination)
    if (destExistsResult.success && destExistsResult.value && !overwrite) {
      const error = new Error(`Destination exists: ${destination}. Use --overwrite to replace.`)
      context.logger.error(error.message)
      return err(error)
    }

    // Perform copy operation
    const copyResult = await fs.copy(source, destination)
    if (!copyResult.success) {
      context.logger.error(`Copy failed: ${copyResult.error.message}`)
      return copyResult
    }

    context.logger.success(`Copied ${source} → ${destination}`)
    return ok(undefined)
  },
})
```

## Contributing

See the [Contributing Guide](/docs/how-to/contributing.md)for development setup and guidelines.

## License

MIT - See [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE)
