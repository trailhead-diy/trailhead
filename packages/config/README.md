# @trailhead/config

> Type-safe configuration management with validation and documentation generation

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Type-safe configuration management with Result-based validation, schema definition with builder patterns, and automatic documentation generation.

## Installation

```bash
pnpm add @trailhead/config
```

## Quick Example

```typescript
import { defineSchema, createConfigOperations } from '@trailhead/config'
import { z } from 'zod'

// Define schema using Zod
const appConfigSchema = defineSchema(
  z.object({
    app: z.object({
      name: z.string().min(1),
      port: z.number().min(1).max(65535).default(3000),
      debug: z.boolean().default(false),
    }),
  })
)

// Load and validate configuration
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

## Key Features

- **Result-based validation** - Explicit error handling for config operations
- **Schema definition** - Zod integration with field builder patterns
- **Multiple sources** - Load from files, environment variables, and CLI arguments
- **Documentation generation** - Auto-generate docs from schemas
- **Type-safe** - Full TypeScript support with type inference

## Documentation

- **[API Documentation](../../docs/@trailhead.config.md)** - Complete API reference
- **[Getting Started](../../docs/tutorials/config-getting-started.md)** - Configuration basics
- **[Define Schemas](../../docs/how-to/define-schemas)** - Schema creation patterns
- **[Generate Docs](../../docs/how-to/generate-config-docs)** - Documentation generation

## License

MIT © [Esteban URL](https://github.com/esteban-url)
