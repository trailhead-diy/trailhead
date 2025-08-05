---
type: how-to
title: 'How to Add Configuration to Your CLI'
description: 'Implement configuration management with schemas, validation, and multiple sources'
prerequisites:
  - Completed the getting started tutorial
  - Understanding of Zod schemas
  - Basic CLI structure
related:
  - /packages/config/docs/reference/api
  - /docs/how-to/define-schemas
  - /docs/tutorials/config-getting-started
---

# How to Add Configuration to Your CLI

This guide shows you how to add configuration management to your CLI application using @repo/config.

## Prerequisites

- A working CLI application
- Zod installed for schema validation
- Understanding of TypeScript types

## Basic Configuration Setup

Create a configuration schema and manager:

```typescript
import { createConfigManager } from '@repo/config'
import { z } from 'zod'

const configSchema = z.object({
  name: z.string(),
  version: z.string(),
  settings: z.object({
    verbose: z.boolean().default(false),
    color: z.boolean().default(true),
  }),
})

const config = createConfigManager(configSchema)

// In your command
const result = await config.load()
if (result.isOk()) {
  console.log(result.value.name)
}
```

## Configuration in Commands

Integrate configuration into your CLI commands:

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { createConfigManager } from '@repo/config'
import { z } from 'zod'

const configSchema = z.object({
  api: z.object({
    endpoint: z.string().url(),
    timeout: z.number().default(30000),
  }),
  output: z.object({
    format: z.enum(['json', 'yaml', 'table']).default('json'),
    pretty: z.boolean().default(true),
  }),
})

const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application',
  action: async (options, context) => {
    const config = createConfigManager(configSchema)
    const result = await config.load()

    if (result.isErr()) {
      context.logger.error('Invalid configuration')
      return err(result.error)
    }

    const { api, output } = result.value

    // Use configuration values
    context.logger.info(`Deploying to ${api.endpoint}`)
    // ... deployment logic

    return ok(undefined)
  },
})
```

## Multiple Configuration Sources

Load configuration from files, environment, and CLI:

```typescript
const config = createConfigManager(schema, {
  sources: [
    { type: 'file', path: './myapp.config.json' },
    { type: 'env', prefix: 'MYAPP_' },
    { type: 'cli' },
  ],
})
```

## User-Specific Configuration

Support both project and user configuration:

```typescript
import { homedir } from 'os'
import { join } from 'path'

const config = createConfigManager(schema, {
  sources: [
    // User config (lowest priority)
    { type: 'file', path: join(homedir(), '.myapp', 'config.json') },
    // Project config
    { type: 'file', path: './myapp.config.json' },
    // Environment variables
    { type: 'env', prefix: 'MYAPP_' },
    // CLI arguments (highest priority)
    { type: 'cli' },
  ],
})
```

## Configuration Commands

Add commands to manage configuration:

```typescript
const configCommand = createCommand({
  name: 'config',
  description: 'Manage configuration',
  subcommands: [
    createCommand({
      name: 'show',
      description: 'Show current configuration',
      action: async (options, context) => {
        const result = await config.load()
        if (result.isErr()) {
          return err(result.error)
        }

        context.logger.info(JSON.stringify(result.value, null, 2))
        return ok(undefined)
      },
    }),
    createCommand({
      name: 'set',
      description: 'Set configuration value',
      options: [
        { name: 'key', type: 'string', required: true },
        { name: 'value', type: 'string', required: true },
      ],
      action: async (options, context) => {
        // Implementation for setting config values
        return ok(undefined)
      },
    }),
  ],
})
```

## Environment-Based Configuration

Use different configurations per environment:

```typescript
const environment = process.env.NODE_ENV || 'development'

const config = createConfigManager(schema, {
  sources: [
    { type: 'file', path: `./config.${environment}.json` },
    { type: 'env', prefix: 'MYAPP_' },
  ],
})
```

## Secrets Management

Handle sensitive configuration safely:

```typescript
const schema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number(),
    username: z.string(),
    password: z.string(),
  }),
  apiKeys: z.object({
    github: z.string().optional(),
    aws: z.string().optional(),
  }),
})

// Load secrets from environment only
const secrets = createConfigManager(schema, {
  sources: [{ type: 'env', prefix: 'MYAPP_' }],
})
```

## Configuration Validation

Add custom validation logic:

```typescript
const schema = z
  .object({
    server: z.object({
      port: z.number(),
      host: z.string(),
    }),
  })
  .refine(
    (config) => {
      // Custom validation
      if (config.server.port < 1024 && process.getuid() !== 0) {
        return false
      }
      return true
    },
    {
      message: 'Port below 1024 requires root privileges',
    }
  )
```

## Dynamic Configuration

Reload configuration on demand:

```typescript
let configCache = null

async const getConfig = async () => {
  if (!configCache) {
    const result = await config.load()
    if (result.isErr()) {
      throw result.error
    }
    configCache = result.value
  }
  return configCache
}

// Reload configuration
const reloadConfig = () => {
  configCache = null
}
```

## Best Practices

1. **Schema First**: Always define schemas for type safety
2. **Layered Sources**: Use multiple sources with clear precedence
3. **Validate Early**: Catch configuration errors at startup
4. **Secure Secrets**: Never commit sensitive values
5. **Document Defaults**: Make default values clear
6. **Environment Aware**: Support different environments

## Common Patterns

### Feature Flags

```typescript
const schema = z.object({
  features: z.object({
    newUI: z.boolean().default(false),
    betaAPI: z.boolean().default(false),
    debugging: z.boolean().default(process.env.NODE_ENV === 'development'),
  }),
})
```

### Plugin Configuration

```typescript
const schema = z.object({
  plugins: z
    .array(
      z.object({
        name: z.string(),
        enabled: z.boolean().default(true),
        options: z.record(z.any()).default({}),
      })
    )
    .default([]),
})
```

## See Also

- [Configuration API Reference](../../../config/reference/api)
- [Schema Definition Guide](./define-schemas)
- [Configuration Sources Explanation](../explanation/config-sources)
