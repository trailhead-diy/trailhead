---
type: tutorial
title: 'Getting Started with Configuration'
description: 'Learn how to use @repo/config for your first configuration setup'
prerequisites:
  - Node.js installed
  - Basic TypeScript knowledge
  - A TypeScript project ready
related:
  - /packages/config/docs/reference/api
  - /docs/how-to/define-schemas
  - /docs/explanation/config-sources.md
---

# Getting Started with Configuration

This tutorial guides you through creating your first configuration system using @repo/config. You'll build a simple application configuration with validation and multiple sources.

## Prerequisites

- Node.js installed
- Basic TypeScript knowledge
- A TypeScript project ready

## What You'll Build

A configuration system that:

- Validates settings with schemas
- Loads from multiple sources (file, environment, CLI)
- Provides type-safe access to values

## Step 1: Install the Package

```bash
pnpm add @repo/config zod
```

## Step 2: Create Your First Schema

Create a file `src/config/schema.ts`:

```typescript
import { z } from 'zod'
import { createConfigSchema } from '@repo/config'

// Define what your app needs
export const appSchema = createConfigSchema({
  server: z.object({
    port: z.number().min(1).max(65535),
    host: z.string().default('localhost'),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().min(1).max(100).default(10),
  }),
  features: z.object({
    debug: z.boolean().default(false),
  }),
})

export type AppConfig = z.infer<typeof appSchema>
```

## Step 3: Create the Configuration

Create `src/config/index.ts`:

```typescript
import { createConfig } from '@repo/config'
import { appSchema } from './schema'

export const config = createConfig({
  schema: appSchema,
  sources: [
    { type: 'file', path: './config.json' },
    { type: 'env', prefix: 'APP_' },
    { type: 'cli' },
  ],
})
```

## Step 4: Create a Configuration File

Create `config.json` in your project root:

```json
{
  "server": {
    "port": 3000
  },
  "database": {
    "url": "postgresql://localhost:5432/myapp"
  }
}
```

## Step 5: Use the Configuration

Create `src/index.ts`:

```typescript
import { config } from './config'

async function startApp() {
  // Load and validate configuration
  const result = await config.load()

  if (!result.ok) {
    console.error('Configuration error:', result.error)
    process.exit(1)
  }

  const settings = result.value

  console.log(`Starting server on ${settings.server.host}:${settings.server.port}`)
  console.log(`Database pool size: ${settings.database.poolSize}`)
  console.log(`Debug mode: ${settings.features.debug}`)
}

startApp()
```

## Step 6: Run Your Application

Run your application to see the configuration in action:

```bash
node dist/index.js
```

You should see output like:
```
Starting server on localhost:3000
Database pool size: 10
Debug mode: false
```

## What You've Learned

You've successfully:

- Created a validated configuration schema
- Set up multiple configuration sources
- Loaded configuration with proper error handling
- Used type-safe configuration values

## Next Steps

Now that you understand the basics, explore these guides:

- [How to Override Configuration Sources](/docs/how-to/override-config-sources) - Control precedence and override values
- [How to Define Schemas](/docs/how-to/define-schemas) - Advanced schema techniques
- [Configuration Sources Explained](/docs/explanation/config-sources) - Deep dive into how sources work
- [API Reference](/packages/config/docs/reference/api) - Complete API documentation
