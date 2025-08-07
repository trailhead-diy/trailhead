---
type: how-to
title: 'How to Override Configuration Sources'
description: 'Control configuration precedence and override values from different sources'
prerequisites:
  - Understanding of @repo/config basics
  - Completed configuration tutorial
  - Knowledge of configuration sources
related:
  - /docs/tutorials/config-getting-started
  - /docs/explanation/config-sources
  - /packages/config/docs/reference/api
---

# How to Override Configuration Sources

This guide shows you how to override configuration values from different sources and control precedence.

## Prerequisites

- Basic @repo/config setup
- Understanding of configuration schemas
- Familiarity with configuration sources

## Source Precedence

Configuration sources have a natural precedence order (highest to lowest):

1. CLI arguments
2. Environment variables
3. Configuration files
4. Default values in schema

## Basic Override Examples

Override file configuration with environment variables:

```bash
# config.json has port: 3000
APP_SERVER_PORT=8080 node dist/index.js
# Server runs on port 8080
```

Override both file and environment with CLI:

```bash
# config.json has port: 3000
# Environment has APP_SERVER_PORT=8080
node dist/index.js --server.port=9000
# Server runs on port 9000
```

## Combining Multiple Sources

Set up configuration with all source types:

```typescript
const config = createConfig({
  schema: appSchema,
  sources: [
    { type: 'file', path: './config.json' },
    { type: 'env', prefix: 'APP_' },
    { type: 'cli' },
  ],
})
```

Example combinations:

```bash
# Use default file configuration
node dist/index.js

# Override specific values with environment
APP_DATABASE_POOL_SIZE=50 node dist/index.js

# Override with CLI arguments
node dist/index.js --features.debug=true --server.host=0.0.0.0

# Combine all sources (CLI wins)
APP_SERVER_PORT=8080 node dist/index.js --server.port=9000
```

## Environment Variable Mapping

Environment variables map to nested configuration:

```typescript
// Schema
const schema = z.object({
  server: z.object({
    port: z.number(),
    host: z.string(),
  }),
  database: z.object({
    url: z.string(),
    poolSize: z.number(),
  }),
})

// Environment variable mapping
// APP_SERVER_PORT -> server.port
// APP_SERVER_HOST -> server.host
// APP_DATABASE_URL -> database.url
// APP_DATABASE_POOL_SIZE -> database.poolSize
```

## CLI Argument Patterns

Use dot notation for nested values:

```bash
# Set nested values
node dist/index.js --server.port=3000 --server.host=localhost

# Boolean flags
node dist/index.js --features.debug --features.verbose

# Array values (comma-separated)
node dist/index.js --plugins=auth,database,cache
```

## Partial Overrides

Override only specific values:

```javascript
// config.json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "url": "postgresql://localhost:5432/myapp",
    "poolSize": 10
  }
}

// Override just the port
APP_SERVER_PORT=8080 node dist/index.js
// Result: port is 8080, everything else from file
```

## Development vs Production

Use different override strategies per environment:

```bash
# Development: use local overrides
NODE_ENV=development node dist/index.js --server.port=3001

# Production: use environment variables only
NODE_ENV=production APP_SERVER_PORT=80 node dist/index.js
```

## Debugging Configuration

See the final merged configuration:

```typescript
const showConfigCommand = createCommand({
  name: 'show-config',
  description: 'Display resolved configuration',
  action: async (options, context) => {
    const result = await config.load()
    if (result.isOk()) {
      context.logger.info('Final configuration:')
      context.logger.info(JSON.stringify(result.value, null, 2))
    }
    return ok(undefined)
  },
})
```

## Custom Source Priority

Change the default priority by reordering sources:

```typescript
// CLI first (highest priority)
const cliFirst = createConfig({
  schema,
  sources: [
    { type: 'cli' },
    { type: 'env', prefix: 'APP_' },
    { type: 'file', path: './config.json' },
  ],
})

// File first (highest priority) - unusual but possible
const fileFirst = createConfig({
  schema,
  sources: [
    { type: 'file', path: './override.json' },
    { type: 'file', path: './config.json' },
    { type: 'env', prefix: 'APP_' },
  ],
})
```

## Conditional Sources

Load sources conditionally:

```typescript
const sources = [{ type: 'file', path: './config.json' }]

if (process.env.NODE_ENV === 'production') {
  sources.push({ type: 'env', prefix: 'APP_' })
} else {
  sources.push({ type: 'file', path: './config.local.json' })
}

sources.push({ type: 'cli' })

const config = createConfig({ schema, sources })
```

## Best Practices

1. **Document Precedence**: Make source priority clear to users
2. **Consistent Prefixes**: Use consistent environment variable prefixes
3. **Validate All Sources**: Ensure all sources provide valid data
4. **Security First**: Never put secrets in files, use environment
5. **Development Convenience**: Allow easy local overrides for development

## Common Use Cases

### Local Development Override

```bash
# Create local override file (gitignored)
echo '{"server":{"port":3001}}' > config.local.json

# Use in development
NODE_ENV=development node dist/index.js
```

### Docker Deployments

```dockerfile
# Use environment variables in containers
ENV APP_DATABASE_URL=postgresql://db:5432/app
ENV APP_SERVER_PORT=8080
ENV APP_FEATURES_DEBUG=false
```

### CI/CD Pipelines

```yaml
# GitHub Actions example
env:
  APP_SERVER_HOST: 0.0.0.0
  APP_DATABASE_POOL_SIZE: 5
  APP_FEATURES_DEBUG: true
```

## See Also

- [Configuration Sources Explanation](../explanation/config-sources)
- [Configuration Tutorial](../tutorials/config-getting-started)
- [Configuration API Reference](../../packages/config/docs/reference/api.md)
