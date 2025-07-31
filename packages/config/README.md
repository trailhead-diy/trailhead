# @repo/config

> Type-safe configuration management with validation and documentation generation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/esteban-url/trailhead/blob/main/LICENSE)

## Features

- Result-based configuration loading and validation
- Schema definition with builder pattern
- Multiple configuration sources (files, env, CLI)
- Documentation generation from schemas
- Type-safe with full TypeScript support
- Testing utilities

## Installation

```bash
pnpm add @repo/config
# or
npm install @repo/config
```

## Quick Start

```typescript
import { defineConfigSchema, createConfigOperations } from '@repo/config'

// Define schema
const schema = defineConfigSchema()
  .object({
    app: {
      name: { type: 'string', required: true },
      port: { type: 'number', default: 3000 },
      debug: { type: 'boolean', default: false },
    },
  })
  .build()

// Load configuration
const configOps = createConfigOperations()
const result = await configOps.load({
  name: 'app-config',
  schema,
  sources: [
    { type: 'file', path: './config.json', priority: 1 },
    { type: 'env', priority: 2 },
  ],
})

if (result.isOk()) {
  const config = result.value.resolved
  console.log('Loaded:', config.app.name)
}
```

## API Reference

### Schema Definition

```typescript
import { defineConfigSchema, string, number, boolean } from '@repo/config'

const schema = defineConfigSchema()
  .object({
    // Define your schema structure
  })
  .strict(true)
  .build()
```

### Configuration Loading

```typescript
import { createConfigOperations } from '@repo/config'

const configOps = createConfigOperations()
await configOps.load(definition)
await configOps.validate(data, schema)
```

### Documentation Generation

```typescript
import { generateConfigDocs, generateMarkdown } from '@repo/config/docs'

const docs = await generateConfigDocs(schema)
const markdown = await generateMarkdown(docs)
```

## Related Packages

- **@repo/core** - Result types and functional utilities
- **@repo/fs** - File system operations
- **@repo/validation** - Data validation

## Documentation

- [Tutorials](/docs/tutorials/config-getting-started.md)
  - [Getting Started with Config](/docs/tutorials/config-getting-started)
- [How-to Guides](/docs/how-to/README.md)
  - [Define Configuration Schemas](/docs/how-to/define-schemas)
  - [Generate Documentation](/docs/how-to/generate-config-docs)
- [Explanations](/docs/explanation/README.md)
  - [Configuration Sources](/docs/explanation/config-sources)
- [API Reference](/packages/config/docs/reference/api)

## License

MIT © [Esteban URL](https://github.com/esteban-url)
