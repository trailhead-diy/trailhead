# Config Module API Reference

The config module provides type-safe configuration management with schema validation and multiple loader strategies.

## Import

```typescript
import { defineConfig, loadConfig } from '@trailhead/cli/config'
import type { ConfigSchema } from '@trailhead/cli/config'
```

## Core Concepts

The config module uses:
- **Zod** for schema validation
- **Cosmiconfig** for flexible configuration loading
- **Result types** for error handling
- **Type inference** for full TypeScript support

## Defining Configuration

### `defineConfig<T>(schema: z.Schema<T>): ConfigDefinition<T>`

Creates a type-safe configuration definition.

```typescript
import { defineConfig } from '@trailhead/cli/config'
import { z } from 'zod'

// Define schema
const configSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535).default(3000),
    host: z.string().default('localhost'),
    cors: z.boolean().default(true)
  }),
  database: z.object({
    url: z.string().url(),
    pool: z.object({
      min: z.number().default(2),
      max: z.number().default(10)
    }).default({})
  }),
  features: z.object({
    auth: z.boolean().default(true),
    rateLimit: z.boolean().default(false),
    cache: z.boolean().default(true)
  }).default({})
})

// Create config definition
const config = defineConfig(configSchema)

// TypeScript knows the exact shape
type AppConfig = z.infer<typeof configSchema>
```

## Loading Configuration

### Basic Loading

```typescript
const result = await config.load()

if (result.success) {
  console.log(`Server running on ${result.value.server.host}:${result.value.server.port}`)
} else {
  console.error('Failed to load config:', result.error.message)
}
```

### Loading with Options

```typescript
const result = await config.load({
  // Search for config starting from specific directory
  searchFrom: '/path/to/project',
  
  // Custom config file name (default: various common names)
  configName: 'my-app',
  
  // Stop at this directory when searching up
  stopAt: '/home/user',
  
  // Additional search places
  searchPlaces: [
    '.my-apprc',
    '.my-apprc.json',
    '.my-apprc.yaml',
    'my-app.config.js'
  ]
})
```

## Configuration Sources

The config module searches for configuration in multiple places (in order):

1. **Package.json** - `"myapp"` field
2. **RC files** - `.myapprc`, `.myapprc.json`, `.myapprc.yaml`, `.myapprc.yml`
3. **Config files** - `myapp.config.js`, `myapp.config.ts`, `myapp.config.json`
4. **Environment-specific** - `myapp.production.json`, etc.

### JavaScript Configuration

```javascript
// myapp.config.js
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },
  database: {
    url: process.env.DATABASE_URL
  }
}
```

### TypeScript Configuration

```typescript
// myapp.config.ts
import type { AppConfig } from './types'

const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/myapp'
  }
}

export default config
```

### YAML Configuration

```yaml
# .myapprc.yaml
server:
  port: 3000
  host: localhost
  cors: true

database:
  url: postgres://localhost:5432/myapp
  pool:
    min: 5
    max: 20

features:
  auth: true
  rateLimit: true
  cache: false
```

### JSON Configuration

```json
// .myapprc.json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "url": "postgres://localhost:5432/myapp"
  }
}
```

## Environment Variables

Integrate environment variables with your schema:

```typescript
const configSchema = z.object({
  server: z.object({
    port: z.coerce.number().default(() => 
      parseInt(process.env.PORT || '3000')
    ),
    host: z.string().default(() => 
      process.env.HOST || 'localhost'
    )
  }),
  api: z.object({
    key: z.string().default(() => {
      if (!process.env.API_KEY) {
        throw new Error('API_KEY environment variable is required')
      }
      return process.env.API_KEY
    }),
    url: z.string().url().default(() => 
      process.env.API_URL || 'https://api.example.com'
    )
  })
})
```

## Validation and Defaults

### Custom Validation

```typescript
const configSchema = z.object({
  email: z.object({
    from: z.string().email(),
    replyTo: z.string().email().optional(),
    smtp: z.object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean(),
      auth: z.object({
        user: z.string(),
        pass: z.string()
      })
    })
  }).refine(
    (data) => data.smtp.port === 465 ? data.smtp.secure : true,
    {
      message: "Port 465 requires secure connection",
      path: ["smtp", "secure"]
    }
  )
})
```

### Conditional Defaults

```typescript
const configSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default((ctx) => {
      // Different defaults based on environment
      const env = ctx.parent?.environment
      return env === 'production' ? 'warn' : 'debug'
    }),
    format: z.enum(['json', 'pretty']).default('json')
  })
})
```

## Advanced Patterns

### Config with Command Options

Merge command-line options with file configuration:

```typescript
async function loadMergedConfig(cmdOptions: CommandOptions) {
  const fileConfig = await config.load()
  
  if (!fileConfig.success) {
    return fileConfig
  }

  // Command options override file config
  const merged = {
    ...fileConfig.value,
    server: {
      ...fileConfig.value.server,
      port: cmdOptions.port ?? fileConfig.value.server.port,
      host: cmdOptions.host ?? fileConfig.value.server.host
    }
  }

  // Validate merged config
  const validated = configSchema.safeParse(merged)
  if (!validated.success) {
    return err(createValidationError({
      message: 'Invalid configuration after merging',
      details: validated.error.message
    }))
  }

  return ok(validated.data)
}
```

### Multi-Environment Config

```typescript
const envSchema = z.enum(['development', 'staging', 'production'])
type Environment = z.infer<typeof envSchema>

async function loadEnvironmentConfig(env: Environment) {
  const baseConfig = defineConfig(configSchema)
  
  // Load base configuration
  const baseResult = await baseConfig.load()
  if (!baseResult.success) return baseResult

  // Load environment-specific overrides
  const envConfig = defineConfig(configSchema)
  const envResult = await envConfig.load({
    searchPlaces: [
      `.myapprc.${env}.json`,
      `myapp.${env}.config.js`
    ]
  })

  // Merge configurations
  if (envResult.success) {
    return ok(deepMerge(baseResult.value, envResult.value))
  }

  return baseResult
}
```

### Config Watcher

Watch for configuration changes:

```typescript
import { watch } from 'fs'

function watchConfig(
  configPath: string,
  onChange: (config: AppConfig) => void
) {
  let lastConfig: AppConfig | null = null

  const loadAndNotify = async () => {
    const result = await config.load()
    if (result.success && !deepEqual(result.value, lastConfig)) {
      lastConfig = result.value
      onChange(result.value)
    }
  }

  // Initial load
  loadAndNotify()

  // Watch for changes
  const watcher = watch(configPath, { persistent: false }, () => {
    setTimeout(loadAndNotify, 100) // Debounce
  })

  return () => watcher.close()
}

// Usage
const stopWatching = watchConfig('.myapprc', (newConfig) => {
  console.log('Config updated:', newConfig)
  // Restart server, reload features, etc.
})
```

### Config Inheritance

Support configuration inheritance for monorepos:

```typescript
async function loadInheritedConfig(projectPath: string) {
  const configs: AppConfig[] = []
  let currentPath = projectPath

  // Walk up directory tree collecting configs
  while (currentPath !== '/') {
    const result = await config.load({ searchFrom: currentPath })
    if (result.success) {
      configs.unshift(result.value) // Parent configs first
    }
    currentPath = path.dirname(currentPath)
  }

  // Merge all configs (child overrides parent)
  return configs.reduce((merged, conf) => deepMerge(merged, conf), {})
}
```

## Testing Configuration

### Unit Testing

```typescript
import { createMemoryFileSystem } from '@trailhead/cli/testing'

describe('Config Loading', () => {
  it('should load valid configuration', async () => {
    const fs = createMemoryFileSystem({
      '/.myapprc.json': JSON.stringify({
        server: { port: 8080 },
        database: { url: 'postgres://test' }
      })
    })

    const result = await config.load({ 
      searchFrom: '/',
      filesystem: fs 
    })

    expect(result.success).toBe(true)
    expect(result.value.server.port).toBe(8080)
  })

  it('should apply defaults', async () => {
    const fs = createMemoryFileSystem({
      '/.myapprc.json': JSON.stringify({
        database: { url: 'postgres://test' }
      })
    })

    const result = await config.load({ filesystem: fs })

    expect(result.success).toBe(true)
    expect(result.value.server.port).toBe(3000) // Default
    expect(result.value.server.cors).toBe(true) // Default
  })

  it('should validate configuration', async () => {
    const fs = createMemoryFileSystem({
      '/.myapprc.json': JSON.stringify({
        server: { port: 'invalid' }, // Should be number
        database: { url: 'not-a-url' } // Should be URL
      })
    })

    const result = await config.load({ filesystem: fs })

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })
})
```

### Integration Testing

```typescript
describe('Config Integration', () => {
  it('should merge multiple config sources', async () => {
    const fs = createMemoryFileSystem({
      '/package.json': JSON.stringify({
        name: 'my-app',
        myapp: {
          server: { port: 3001 }
        }
      }),
      '/.myapprc.yaml': `
        database:
          url: postgres://localhost/myapp
          pool:
            max: 50
      `,
      '/myapp.config.js': `
        module.exports = {
          features: {
            auth: true,
            cache: false
          }
        }
      `
    })

    const result = await config.load({ filesystem: fs })

    expect(result.success).toBe(true)
    // From package.json
    expect(result.value.server.port).toBe(3001)
    // From .myapprc.yaml
    expect(result.value.database.pool.max).toBe(50)
    // From myapp.config.js
    expect(result.value.features.auth).toBe(true)
  })
})
```

## Error Handling

Configuration loading can fail for various reasons:

```typescript
const result = await config.load()

if (!result.success) {
  switch (result.error.code) {
    case 'CONFIG_NOT_FOUND':
      console.log('No configuration file found, using defaults')
      // Use default configuration
      break
      
    case 'VALIDATION_ERROR':
      console.error('Invalid configuration:')
      console.error(result.error.details)
      // Show validation errors to user
      break
      
    case 'PARSE_ERROR':
      console.error('Failed to parse configuration file:')
      console.error(result.error.message)
      // Check syntax in config file
      break
      
    case 'PERMISSION_ERROR':
      console.error('Cannot read configuration file')
      // Check file permissions
      break
  }
}
```

## Best Practices

### 1. Use Strict Schemas

Define precise schemas with proper validation:

```typescript
// ❌ Bad - Too permissive
const schema = z.object({
  port: z.any(),
  host: z.any()
})

// ✅ Good - Strict validation
const schema = z.object({
  port: z.number().int().min(1).max(65535),
  host: z.string().min(1).regex(/^[a-zA-Z0-9.-]+$/)
})
```

### 2. Provide Sensible Defaults

Make configuration optional where possible:

```typescript
const schema = z.object({
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
    timeout: z.number().default(30000)
  }).default({}),
  
  features: z.object({
    experimental: z.boolean().default(false),
    telemetry: z.boolean().default(true)
  }).default({})
})
```

### 3. Document Configuration

Include descriptions in your schema:

```typescript
const schema = z.object({
  rateLimit: z.object({
    enabled: z.boolean()
      .default(true)
      .describe('Enable rate limiting'),
    
    maxRequests: z.number()
      .min(1)
      .default(100)
      .describe('Maximum requests per window'),
    
    windowMs: z.number()
      .min(1000)
      .default(60000)
      .describe('Rate limit window in milliseconds')
  })
})

// Generate documentation from schema
function generateConfigDocs(schema: z.ZodSchema) {
  // Implementation to extract descriptions
}
```

### 4. Validate Early

Validate configuration at startup:

```typescript
async function startApp() {
  // Load and validate config first
  const configResult = await config.load()
  if (!configResult.success) {
    console.error('Failed to load configuration:', configResult.error.message)
    process.exit(1)
  }

  const appConfig = configResult.value
  
  // Now start the application
  const server = createServer(appConfig)
  await server.start()
}
```

### 5. Type-Safe Access

Use the inferred types throughout your application:

```typescript
// config/schema.ts
export const configSchema = z.object({
  // ... schema definition
})

export type AppConfig = z.infer<typeof configSchema>

// services/email.ts
import type { AppConfig } from '../config/schema'

export class EmailService {
  constructor(private config: AppConfig['email']) {}
  
  async send(to: string, subject: string, body: string) {
    // TypeScript knows exact shape of this.config
    const transport = createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: this.config.smtp.auth
    })
    
    await transport.sendMail({
      from: this.config.from,
      to,
      subject,
      html: body
    })
  }
}
```

## Complete Example

Here's a complete example of a CLI with configuration:

```typescript
// config/schema.ts
import { z } from 'zod'

export const configSchema = z.object({
  name: z.string().default('my-cli'),
  version: z.string().default('1.0.0'),
  
  api: z.object({
    endpoint: z.string().url(),
    key: z.string().min(1),
    timeout: z.number().default(30000),
    retries: z.number().min(0).max(5).default(3)
  }),
  
  output: z.object({
    format: z.enum(['json', 'table', 'csv']).default('table'),
    color: z.boolean().default(true),
    verbose: z.boolean().default(false)
  }).default({}),
  
  cache: z.object({
    enabled: z.boolean().default(true),
    dir: z.string().default('.cache'),
    ttl: z.number().default(3600000) // 1 hour
  }).default({})
})

export type CLIConfig = z.infer<typeof configSchema>

// config/index.ts
import { defineConfig } from '@trailhead/cli/config'
import { configSchema } from './schema'

export const config = defineConfig(configSchema)

// commands/fetch.ts
import { createCommand } from '@trailhead/cli/command'
import { config } from '../config'

export const fetchCommand = createCommand({
  name: 'fetch',
  description: 'Fetch data from API',
  options: [
    { name: 'format', type: 'string', description: 'Output format' },
    { name: 'no-cache', type: 'boolean', description: 'Disable cache' }
  ],
  action: async (options, context) => {
    // Load configuration
    const configResult = await config.load()
    if (!configResult.success) {
      return configResult
    }

    const cfg = configResult.value
    
    // Command options override config
    const outputFormat = options.format || cfg.output.format
    const useCache = options['no-cache'] ? false : cfg.cache.enabled

    // Use configuration
    const response = await fetchWithRetry(cfg.api.endpoint, {
      headers: { 'X-API-Key': cfg.api.key },
      timeout: cfg.api.timeout,
      retries: cfg.api.retries
    })

    // Format output based on config
    formatOutput(response, outputFormat, cfg.output.color)
    
    return ok(undefined)
  }
})
```