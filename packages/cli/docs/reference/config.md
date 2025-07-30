---
type: reference
title: 'Config Module API Reference'
description: 'Type-safe configuration management with schema validation and loading strategies'
related:
  - ./core.md
  - /docs/how-to/apply-functional-patterns.md
---

# Config Module API Reference

Type-safe configuration management with schema validation using Zod and flexible loading strategies via Cosmiconfig.

## Overview

| Property    | Value                 |
| ----------- | --------------------- |
| **Package** | `@esteban-url/config` |
| **Module**  | `@esteban-url/config` |

**Note**: The configuration functionality is provided by the `@esteban-url/config` package, which is a dependency of `@esteban-url/cli`.
| **Since** | `v1.0.0` |

## Import

```typescript
import { defineConfig, loadConfig } from '@esteban-url/config'
import type { ConfigSchema } from '@esteban-url/config'
import { z } from 'zod'
```

## Basic Usage

```typescript
import { defineConfig, loadConfig } from '@esteban-url/config'
import type { ConfigSchema } from '@esteban-url/config'
import { z } from 'zod'
```

## Defining Configuration

### `defineConfig<T>(schema: z.Schema<T>): ConfigDefinition<T>`

Creates a type-safe configuration definition.

```typescript
import { defineConfig } from '@esteban-url/trailhead-cli/config'
import { z } from 'zod'

// Define schema
const configSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535).default(3000),
    host: z.string().default('localhost'),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().min(1).max(100).default(10),
  }),
  features: z
    .object({
      auth: z.boolean().default(true),
      rateLimit: z.boolean().default(false),
    })
    .default({}),
})

// Create config definition
const config = defineConfig(configSchema)

// TypeScript knows the exact shape
type AppConfig = z.infer<typeof configSchema>
```

## Loading Configuration

### `ConfigDefinition.load(options?: LoadOptions): Promise<Result<T>>`

Loads configuration from various sources.

```typescript
// Load with defaults
const result = await config.load()

if (result.success) {
  const { server, database, features } = result.value
  console.log(`Server running on ${server.host}:${server.port}`)
}

// Load with options
const result = await config.load({
  searchFrom: './src',
  configName: 'myapp',
})
```

### Load Options

```typescript
interface LoadOptions {
  searchFrom?: string // Directory to search from
  configName?: string // Config file name (without extension)
  stopAt?: string // Directory to stop searching
  transform?: (config: any) => any // Transform loaded config
}
```

## Configuration Sources

The config module searches for configuration in the following locations (in order):

1. `package.json` property (e.g., `"myapp"` key)
2. `.${name}rc` file (JSON or YAML)
3. `.${name}rc.json`
4. `.${name}rc.yaml` / `.${name}rc.yml`
5. `.${name}rc.js` / `.${name}rc.cjs`
6. `${name}.config.js` / `${name}.config.cjs`
7. `.config/${name}rc` (JSON or YAML)
8. `.config/${name}rc.json`
9. `.config/${name}rc.yaml` / `.config/${name}rc.yml`

## Schema Validation

### Using Zod Schemas

```typescript
const configSchema = z.object({
  // String with constraints
  name: z.string().min(1).max(100),

  // Number with range
  timeout: z.number().min(0).max(60000).default(5000),

  // Enum
  environment: z.enum(['development', 'staging', 'production']),

  // Array
  allowedOrigins: z.array(z.string().url()).default([]),

  // Nested object
  smtp: z.object({
    host: z.string(),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z
      .object({
        user: z.string(),
        pass: z.string(),
      })
      .optional(),
  }),

  // Union types
  logLevel: z
    .union([z.literal('debug'), z.literal('info'), z.literal('warn'), z.literal('error')])
    .default('info'),
})
```

### Custom Validation

```typescript
const configSchema = z
  .object({
    port: z.number(),
    host: z.string(),
  })
  .refine(
    (data) => {
      // Custom validation logic
      if (data.port === 80 && data.host !== 'localhost') {
        return false
      }
      return true
    },
    {
      message: 'Port 80 only allowed on localhost',
    }
  )
```

## Environment Variables

Combine with environment variables:

```typescript
const configSchema = z.object({
  port: z.number().default(parseInt(process.env.PORT || '3000', 10)),
  apiKey: z.string().default(process.env.API_KEY || ''),
  debug: z.boolean().default(process.env.NODE_ENV === 'development'),
})
```

## Error Handling

Configuration loading returns detailed errors:

```typescript
const result = await config.load()

if (!result.success) {
  const error = result.error

  if (error.code === 'VALIDATION_ERROR') {
    console.error('Invalid configuration:')
    console.error(error.details)
  } else if (error.code === 'FILE_NOT_FOUND') {
    console.log('No config file found, using defaults')
    // Use default configuration
  } else {
    console.error(`Config error: ${error.message}`)
  }
}
```

## Multiple Configurations

Load different configs for different purposes:

```typescript
// App config
const appConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  port: z.number(),
})

const appConfig = defineConfig(appConfigSchema)

// Database config
const dbConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  user: z.string(),
  password: z.string(),
})

const dbConfig = defineConfig(dbConfigSchema)

// Load both
const [appResult, dbResult] = await Promise.all([
  appConfig.load({ configName: 'app' }),
  dbConfig.load({ configName: 'database' }),
])
```

## Config File Examples

### JSON Format (.myapprc.json)

```json
{
  "server": {
    "port": 8080,
    "host": "0.0.0.0"
  },
  "database": {
    "url": "postgresql://localhost/myapp",
    "poolSize": 20
  },
  "features": {
    "auth": true,
    "rateLimit": true
  }
}
```

### YAML Format (.myapprc.yaml)

```yaml
server:
  port: 8080
  host: 0.0.0.0

database:
  url: postgresql://localhost/myapp
  poolSize: 20

features:
  auth: true
  rateLimit: true
```

### JavaScript Format (myapp.config.js)

```javascript
module.exports = {
  server: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
  },
  database: {
    url: process.env.DATABASE_URL,
    poolSize: 20,
  },
  features: {
    auth: true,
    rateLimit: process.env.NODE_ENV === 'production',
  },
}
```

## Testing Configuration

```typescript
import { defineConfig } from '@esteban-url/trailhead-cli/config'
import { createMemoryFileSystem } from '@esteban-url/trailhead-cli/filesystem'
import { z } from 'zod'

test('config loading', async () => {
  const fs = createMemoryFileSystem({
    '/.myapprc.json': JSON.stringify({
      port: 4000,
      host: '127.0.0.1',
    }),
  })

  const schema = z.object({
    port: z.number(),
    host: z.string(),
  })

  const config = defineConfig(schema)

  // Mock filesystem for testing
  const result = await config.load({
    searchFrom: '/',
    // Use test filesystem
    fs,
  })

  expect(result.success).toBe(true)
  expect(result.value.port).toBe(4000)
})
```

## Type Safety

The config module provides full type inference:

```typescript
const configSchema = z.object({
  api: z.object({
    endpoint: z.string().url(),
    timeout: z.number(),
    retries: z.number().default(3),
  }),
})

const config = defineConfig(configSchema)
const result = await config.load()

if (result.success) {
  // TypeScript knows all properties
  result.value.api.endpoint // string
  result.value.api.timeout // number
  result.value.api.retries // number (with default)

  // TypeScript prevents errors
  // result.value.api.invalid; // Error: Property 'invalid' does not exist
}
```

## Best Practices

1. **Define schemas upfront** - Clear contract for configuration
2. **Use defaults** - Make configuration optional where possible
3. **Validate early** - Catch config errors at startup
4. **Document schema** - Use descriptions in error messages
5. **Layer configurations** - Combine files, env vars, and defaults

## Type Reference

```typescript
// Config definition
interface ConfigDefinition<T> {
  load(options?: LoadOptions): Promise<Result<T>>
  validate(data: unknown): Result<T>
}

// Load options
interface LoadOptions {
  searchFrom?: string
  configName?: string
  stopAt?: string
  transform?: (config: any) => any
}

// Re-exported from Zod
export { z } from 'zod'
```

## See Also

- [Getting Started](../getting-started.md) - Basic config example
- [Common Patterns](../how-to/common-patterns.md) - Config patterns
- [Testing Guide](../how-to/testing-guide.md) - Testing with configs
