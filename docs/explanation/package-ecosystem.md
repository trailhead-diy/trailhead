---
type: explanation
title: 'Trailhead Package Ecosystem'
description: 'Understanding how Trailhead packages work together to provide a cohesive development experience'
related:
  - /docs/explanation/functional-architecture.md
  - /docs/explanation/result-types-pattern.md
  - /docs/how-to/contributing.md
---

# Trailhead Package Ecosystem

Understanding how Trailhead packages work together to provide a cohesive development experience.

## Package Architecture

```
@repo/core
    ↑
    ├── @repo/fs
    ├── @repo/validation
    ├── @repo/data
    └── @repo/config
```

### @repo/core - Foundation

The foundation package providing:

- Result types for error handling
- Functional utilities (pipe, compose)
- Core type definitions

All other packages depend on core for consistent patterns.

### @repo/fs - File System Operations

Wraps Node.js fs operations with Result types:

- File I/O with explicit error handling
- Path utilities
- Mock filesystem for testing

### @repo/validation - Data Validation

Functional validation with Zod integration:

- Pre-built validators
- Schema composition
- Result-based validation

### @repo/data - Data Processing

Unified data format handling:

- CSV, JSON, Excel support
- Format detection and conversion
- Streaming for large files

### @repo/config - Configuration Management

Type-safe configuration management:

- Environment-based configuration loading
- Schema validation with Zod integration
- Hot reloading during development
- Support for multiple config formats (JSON, YAML, TOML)
- Configuration merging and overrides

## How Packages Work Together

### Layered Architecture

Each package has a specific responsibility:

```typescript
// 1. Read configuration file (@repo/fs)
const configResult = await fs.readJson('./config.json')

// 2. Validate configuration (@repo/validation)
const validResult = configResult.isOk() ? validateConfig(configResult.value) : configResult

// 3. Process data files (@repo/data)
const dataResult = validResult.isOk()
  ? await data.parseAuto(validResult.value.dataPath)
  : validResult

// All use @repo/core Result types
```

### Shared Patterns

All packages follow the same patterns:

1. **Result Types** - Consistent error handling
2. **Pure Functions** - Predictable behavior
3. **Functional API** - Composable operations
4. **TypeScript First** - Full type safety

### Composition Example

Build a data pipeline using multiple packages:

```typescript
import { fs } from '@repo/fs'
import { data } from '@repo/data'
import { validate, createSchemaValidator } from '@repo/validation'
import { pipe, ok, err } from '@repo/core'

// Define validation schema
const rowSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  amount: z.number().positive(),
})

const validateRow = createSchemaValidator(rowSchema)

// Compose pipeline
async function processDataFile(inputPath: string) {
  // 1. Check file exists (@repo/fs)
  const exists = await fs.exists(inputPath)
  if (!exists.value) {
    return err(new Error('File not found'))
  }

  // 2. Parse data file (@repo/data)
  const parseResult = await data.parseAuto(inputPath)
  if (parseResult.isErr()) return parseResult

  // 3. Validate each row (@repo/validation)
  const validRows = []
  for (const row of parseResult.value.data) {
    const validResult = validateRow(row)
    if (validResult.isOk()) {
      validRows.push(validResult.value)
    }
  }

  // 4. Write validated data (@repo/fs + @repo/data)
  const outputPath = inputPath.replace('.csv', '.validated.json')
  return data.writeAuto(outputPath, validRows)
}
```

## Package Design Principles

### 1. Single Responsibility

Each package does one thing well:

- @repo/fs - File operations only
- @repo/validation - Validation only
- @repo/data - Data format handling only

### 2. Minimal Dependencies

Packages only depend on:

- @repo/core (for shared types)
- Their specific domain libraries
- Node.js built-ins

### 3. Consistent APIs

All packages follow similar patterns:

```typescript
// Creation functions
const validator = createValidator(schema)
const csv = createCSVOperations(options)
const mockFs = createMockFS(files)

// Result-returning operations
const result = await fs.readFile(path)
const result = await data.parseAuto(file)
const result = validate.email(value)

// Configuration injection
const operations = createOperations(config)
```

### 4. Testing Support

Every package includes testing utilities:

```typescript
// @repo/fs/testing
const mockFS = createMockFS({ '/test.txt': 'content' })

// @repo/validation/testing
const mockValidator = createMockValidator(responses)

// @repo/data/testing
const generators = createDataGenerators()
```

## Common Use Cases

### Configuration Loading

```typescript
import { fs } from '@repo/fs'
import { createSchemaValidator } from '@repo/validation'

const configSchema = z.object({
  port: z.number().int().min(1).max(65535),
  database: z.string().url(),
  features: z.array(z.string()),
})

const validateConfig = createSchemaValidator(configSchema)

async function loadConfig(path: string) {
  const result = await fs.readJson(path)
  return result.isErr() ? result : validateConfig(result.value)
}
```

### Data Import Pipeline

```typescript
async function importUserData(csvPath: string) {
  // Parse CSV
  const parseResult = await data.parseAuto(csvPath)
  if (parseResult.isErr()) return parseResult

  // Validate each row
  const validated = validateUsers(parseResult.value.data)
  if (validated.isErr()) return validated

  // Save to database
  return saveUsers(validated.value)
}
```

### File Processing

```typescript
async function processDirectory(dir: string) {
  // Find all data files
  const files = await fs.findFiles('**/*.{csv,json,xlsx}', { cwd: dir })
  if (files.isErr()) return files

  // Process each file
  const results = await Promise.all(
    files.value.map(async (file) => {
      const path = join(dir, file)
      const data = await data.parseAuto(path)
      return data.isOk() ? processData(data.value) : data
    })
  )

  return ok(results)
}
```

## Future Packages

The ecosystem is designed for extension:

- **@repo/cli** - CLI framework (in development)
- **@repo/config** - Configuration management
- **@repo/http** - HTTP client with Result types
- **@repo/test** - Testing utilities

Each will follow the same patterns for consistency.

## Best Practices

1. **Use packages together** - They're designed to compose
2. **Handle Results consistently** - Check isErr() before using values
3. **Leverage type inference** - Let TypeScript infer types
4. **Use testing utilities** - Mock external dependencies
5. **Follow functional patterns** - Keep operations pure

## Getting Started

```bash
# Install packages
pnpm add @repo/core @repo/fs @repo/validation @repo/data

# Import what you need
import { fs } from '@repo/fs'
import { validate } from '@repo/validation'
import { data } from '@repo/data'
import { ok, err, pipe } from '@repo/core'
```

## Related Resources

- [Functional Architecture](/docs/explanation/functional-architecture.md)
- [Result Types Pattern](/docs/explanation/result-types-pattern.md)
- [Package Development Guide](/docs/how-to/create-package.md)
