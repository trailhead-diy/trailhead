# @trailhead/config

> Type-safe configuration management with validation and documentation generation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

## Features

- Result-based configuration loading and validation
- Schema definition with builder pattern
- Multiple configuration sources (files, env, CLI)
- Documentation generation from schemas
- Type-safe with full TypeScript support
- Testing utilities

## Installation

```bash
pnpm add @trailhead/config
# or
npm install @trailhead/config
```

## Quick Start

```typescript
import { defineSchema, object, string, number, boolean } from '@trailhead/config'
import { z } from 'zod'

// Define schema using Zod or field builders
const appConfigSchema = defineSchema(
  z.object({
    app: z.object({
      name: z.string().min(1),
      port: z.number().min(1).max(65535).default(3000),
      debug: z.boolean().default(false),
    }),
  })
)

// Or use field builders for more convenience
const serverSchema = object({
  host: string().default('localhost').description('Server hostname').build(),
  port: number().min(1).max(65535).default(3000).description('Server port').build(),
  secure: boolean().default(false).description('Enable HTTPS').build(),
}).build()

// Load and validate configuration
import { createConfigOperations } from '@trailhead/config'

const configOps = createConfigOperations()
const manager = configOps.create({
  name: 'app-config',
  sources: [
    { type: 'file', path: './config.json', priority: 1 },
    { type: 'env', priority: 2 },
  ],
})

const state = await manager.load()
if (state.isOk()) {
  console.log('Loaded:', manager.get('app.name'))
}
```

## API Reference

### Schema Definition

```typescript
import { defineSchema, string, number, boolean, object } from '@trailhead/config'
import { z } from 'zod'

// Using Zod directly
const schema = defineSchema(
  z.object({
    database: z.object({
      host: z.string(),
      port: z.number().min(1).max(65535),
    }),
  })
)

// Using field builders
const serverConfig = object({
  host: string().description('Server hostname').default('localhost').minLength(1).build(),
  port: number()
    .description('Server port')
    .min(1, 'Port must be positive')
    .max(65535, 'Port must be valid')
    .default(3000)
    .build(),
  debug: boolean().description('Enable debug mode').default(false).build(),
}).build()
```

### Configuration Loading

```typescript
import { createConfigOperations, createConfigManager } from '@trailhead/config'

// Using operations
const configOps = createConfigOperations()
const manager = configOps.create({
  name: 'my-config',
  sources: [
    { type: 'file', path: './config.json', priority: 1 },
    { type: 'env', prefix: 'APP_', priority: 2 },
  ],
})

// Load configuration
const state = await manager.load()
if (state.isOk()) {
  const value = manager.get('database.host')
  console.log('Database host:', value)
}

// Watch for changes
manager.watch((change) => {
  console.log('Config changed:', change.path, change.newValue)
})
```

### Validation

```typescript
import { validate, validateAsync } from '@trailhead/config'
import { z } from 'zod'

const schema = z.object({
  port: z.number().min(1).max(65535),
})

// Synchronous validation
const result = validate({ port: 3000 }, schema)
if (result.isOk()) {
  console.log('Valid:', result.value)
}

// Asynchronous validation
const asyncResult = await validateAsync(data, schema)
```

### Documentation Generation

```typescript
import { generateDocs, generateJsonSchema } from '@trailhead/config'

// Generate human-readable documentation
const docs = generateDocs(schema, {
  title: 'Server Configuration',
  includeExamples: true,
})
console.log(docs.markdown)

// Generate JSON Schema
const jsonSchema = generateJsonSchema(schema)
```

## Related Packages

- **@trailhead/core** - Result types and functional utilities
- **@trailhead/fs** - File system operations
- **@trailhead/validation** - Data validation

## Documentation

- [Tutorials](../../docs/tutorials/config-getting-started.md)
  - [Getting Started with Config](../../docs/tutorials/config-getting-started)
- [How-to Guides](../../docs/how-to/README.md)
  - [Define Configuration Schemas](../../docs/how-to/define-schemas)
  - [Generate Documentation](../../docs/how-to/generate-config-docs)
- [Explanations](../../docs/explanation/README.md)
  - [Configuration Sources](../../docs/explanation/config-sources)
- **[API Documentation](../../docs/@trailhead.config.md)** - Complete API reference with examples and type information

## License

MIT © [Esteban URL](https://github.com/esteban-url)
