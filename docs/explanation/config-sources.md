---
title: Understanding Configuration Sources
type: explanation
description: How configuration sources work and merge in @repo/config
---

# Understanding Configuration Sources

@repo/config supports multiple configuration sources that merge together with clear precedence rules. This design enables flexible deployment scenarios while maintaining predictable behavior.

## Configuration Source Types

### File Source

File sources load configuration from JSON or YAML files:

```typescript
{ type: 'file', path: './config.json' }
{ type: 'file', path: './config.yaml' }
```

**Characteristics:**

- Loaded from disk at runtime
- Supports JSON and YAML formats
- Can use absolute or relative paths
- Missing files return empty configuration (not an error)

**Use cases:**

- Default settings shipped with application
- Environment-specific configuration files
- Shared team settings

### Environment Source

Environment sources read from process environment variables:

```typescript
{ type: 'env', prefix: 'APP_' }
```

**Characteristics:**

- Maps environment variables to configuration paths
- Converts `APP_SERVER_PORT` to `{ server: { port: value } }`
- Supports nested paths with underscores
- Type coercion based on schema

**Use cases:**

- Container deployments (Docker, Kubernetes)
- CI/CD pipelines
- Sensitive values (secrets, API keys)
- Cloud platform configuration

### CLI Source

CLI sources parse command-line arguments:

```typescript
{
  type: 'cli'
}
```

**Characteristics:**

- Uses dot notation: `--server.port=3000`
- Supports boolean flags: `--features.debug`
- Arrays: `--allowed-origins=url1 --allowed-origins=url2`
- Type inference from schema

**Use cases:**

- Development overrides
- Quick testing
- Script automation
- User preferences

## Source Precedence

Sources merge in order with later sources overriding earlier ones:

```typescript
createConfig({
  schema,
  sources: [
    { type: 'file', path: './defaults.json' }, // Lowest priority
    { type: 'file', path: './config.json' },
    { type: 'env', prefix: 'APP_' },
    { type: 'cli' }, // Highest priority
  ],
})
```

### Merge Behavior

Deep merge for objects:

```javascript
// defaults.json
{ "server": { "port": 3000, "host": "localhost" } }

// Environment
APP_SERVER_PORT=8080

// Result
{ "server": { "port": 8080, "host": "localhost" } }
```

Complete replacement for arrays:

```javascript
// config.json
{ "allowedOrigins": ["http://localhost:3000"] }

// CLI
--allowed-origins=https://app.com --allowed-origins=https://api.com

// Result
{ "allowedOrigins": ["https://app.com", "https://api.com"] }
```

## Type Coercion

Sources automatically coerce string values to match schema types:

### Numbers

```typescript
// Schema
port: z.number()

// Sources
ENV: APP_PORT="3000"        // String "3000"
CLI: --port=3000            // String "3000"
Result: { port: 3000 }      // Number 3000
```

### Booleans

```typescript
// Schema
debug: z.boolean()

// Sources
ENV: APP_DEBUG="true"       // String "true"
CLI: --debug                // Presence = true
CLI: --debug=false          // String "false"
Result: { debug: true/false } // Boolean
```

### Arrays

```typescript
// Schema
tags: z.array(z.string())

// Sources
ENV: APP_TAGS="web,api,v2"  // Comma-separated
CLI: --tags=web --tags=api  // Multiple flags
Result: { tags: ["web", "api", "v2"] }
```

## Source Selection Strategies

### Development vs Production

Development:

```typescript
sources: [
  { type: 'file', path: './config/defaults.json' },
  { type: 'file', path: './config/development.json' },
  { type: 'env', prefix: 'DEV_' },
  { type: 'cli' },
]
```

Production:

```typescript
sources: [
  { type: 'file', path: './config/defaults.json' },
  { type: 'env', prefix: 'APP_' },
  // No CLI in production for security
]
```

### Multi-Environment

```typescript
const environment = process.env.NODE_ENV || 'development'

sources: [
  { type: 'file', path: './config/defaults.json' },
  { type: 'file', path: `./config/${environment}.json` },
  { type: 'env', prefix: 'APP_' },
  environment === 'development' ? { type: 'cli' } : null,
].filter(Boolean)
```

### Layered Configuration

```typescript
sources: [
  // Company-wide defaults
  { type: 'file', path: '/etc/company/defaults.json' },

  // Application defaults
  { type: 'file', path: './config/defaults.json' },

  // User preferences
  { type: 'file', path: '~/.myapp/config.json' },

  // Runtime overrides
  { type: 'env', prefix: 'MYAPP_' },
  { type: 'cli' },
]
```

## Security Considerations

### Sensitive Values

Mark sensitive fields in schema:

```typescript
const schema = createConfigSchema({
  apiKey: z.string(),
  password: z.string(),
})
  .sensitive('apiKey')
  .sensitive('password')
```

Best practices:

- Never commit sensitive values to files
- Use environment variables for secrets
- Rotate credentials regularly
- Audit configuration access

### Source Validation

Each source validates against the schema:

```typescript
// Schema requires URL
webhookUrl: z.string().url()

// Invalid environment variable
APP_WEBHOOK_URL = 'not-a-url' // Error: Invalid URL

// Config loading fails with clear error
```

## Debugging Configuration

### View Merged Result

```typescript
const result = await config.load()
if (result.ok) {
  console.log('Final configuration:', result.value)
}
```

### Trace Source Values

```typescript
const result = await config.load({ trace: true })
if (result.ok) {
  console.log('Configuration sources:', result.metadata.sources)
  // Shows which source provided each value
}
```

### Validate Without Loading

```typescript
const validation = await config.validate()
if (!validation.ok) {
  console.error('Invalid configuration:', validation.error)
}
```

## Best Practices

1. **Order sources by stability**: Defaults → Files → Environment → CLI
2. **Use environment variables for deployment differences**
3. **Reserve CLI for development and debugging**
4. **Document all configuration options**
5. **Validate early in application lifecycle**
6. **Never log sensitive values**
7. **Use type-safe schemas for all sources**

## See Also

- [Getting Started Tutorial](../tutorials/config-getting-started)
- [How to Override Configuration Sources](../how-to/override-config-sources)
- [How to Define Schemas](../how-to/define-schemas)
- [Configuration API Reference](../../packages/config/docs/reference/api)
