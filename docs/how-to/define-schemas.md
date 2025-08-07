---
title: Define Configuration Schemas
type: how-to
description: Define and compose configuration schemas with validation
---

# Define Configuration Schemas

This guide shows how to define configuration schemas using @repo/config's schema builder API.

## Basic Schema Definition

```typescript
import { z } from 'zod'
import { createConfigSchema } from '@repo/config'

const schema = createConfigSchema({
  apiKey: z.string(),
  timeout: z.number().default(5000),
  retries: z.number().min(0).max(10).default(3),
})
```

## Nested Objects

```typescript
const schema = createConfigSchema({
  server: z.object({
    port: z.number(),
    host: z.string(),
    ssl: z.object({
      enabled: z.boolean(),
      cert: z.string().optional(),
      key: z.string().optional(),
    }),
  }),
})
```

## Using Schema Builder Methods

### Add Descriptions

```typescript
const schema = createConfigSchema({
  apiKey: z.string(),
})
  .describe('apiKey', 'API key for external service')
  .describe('apiKey', 'Format: sk_live_xxxxx', 'note')
```

### Add Examples

```typescript
const schema = createConfigSchema({
  webhookUrl: z.string().url(),
})
  .example('webhookUrl', 'https://api.example.com/webhook')
  .example('webhookUrl', 'https://localhost:3000/webhook')
```

### Mark Sensitive Fields

```typescript
const schema = createConfigSchema({
  password: z.string(),
  apiSecret: z.string(),
})
  .sensitive('password')
  .sensitive('apiSecret')
```

## Common Patterns

### Optional with Defaults

```typescript
const schema = createConfigSchema({
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  maxConnections: z.number().optional().default(100),
})
```

### Environment-Specific Configs

```typescript
const schema = createConfigSchema({
  env: z.enum(['development', 'staging', 'production']),
  database: z.object({
    url: z.string().url(),
    ssl: z.boolean().default(false),
  }),
})
  .describe('env', 'Deployment environment')
  .describe('database.ssl', 'Enable SSL for database connections')
```

### Arrays and Records

```typescript
const schema = createConfigSchema({
  allowedOrigins: z.array(z.string().url()),
  featureFlags: z.record(z.boolean()),
  servers: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      weight: z.number().min(0).max(100),
    })
  ),
})
```

### Union Types

```typescript
const schema = createConfigSchema({
  cache: z.union([
    z.object({ type: z.literal('memory'), maxSize: z.number() }),
    z.object({ type: z.literal('redis'), url: z.string().url() }),
    z.object({ type: z.literal('none') }),
  ]),
})
```

## Validation Rules

### String Validations

```typescript
const schema = createConfigSchema({
  email: z.string().email(),
  url: z.string().url(),
  uuid: z.string().uuid(),
  regex: z.string().regex(/^[A-Z]{2,4}$/),
  length: z.string().min(3).max(50),
})
```

### Number Validations

```typescript
const schema = createConfigSchema({
  port: z.number().int().min(1).max(65535),
  percentage: z.number().min(0).max(100),
  positive: z.number().positive(),
  finite: z.number().finite(),
})
```

### Custom Validations

```typescript
const schema = createConfigSchema({
  customField: z
    .string()
    .refine((val) => val.startsWith('prefix_'), { message: 'Must start with prefix_' }),
  passwordPair: z
    .object({
      password: z.string().min(8),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, { message: 'Passwords must match' }),
})
```

## Composing Schemas

### Extending Schemas

```typescript
const baseSchema = createConfigSchema({
  appName: z.string(),
  version: z.string(),
})

const extendedSchema = baseSchema.extend({
  server: z.object({
    port: z.number(),
  }),
})
```

### Merging Schemas

```typescript
const serverSchema = createConfigSchema({
  port: z.number(),
  host: z.string(),
})

const dbSchema = createConfigSchema({
  database: z.object({
    url: z.string().url(),
  }),
})

const combined = serverSchema.merge(dbSchema)
```

## Type Extraction

```typescript
const schema = createConfigSchema({
  server: z.object({
    port: z.number(),
    host: z.string(),
  }),
})

// Extract the validated type
type Config = z.infer<typeof schema>

// Use in your application
const startServer = (config: Config) => {
  console.log(`Starting on ${config.server.host}:${config.server.port}`)
}
```

## See Also

- [Configuration API Reference](../../packages/config/docs/reference/api)
- [Getting Started Tutorial](../tutorials/config-getting-started)
- [Understanding Configuration Sources](../explanation/config-sources)
