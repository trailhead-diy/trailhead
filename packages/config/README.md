# @trailhead/config

Functional configuration management for CLI applications with enhanced validation, beautiful error messages, and comprehensive documentation generation.

## Features

- 🎯 **Enhanced Validation System** - Beautiful, contextual error messages with suggestions and examples
- 🏗️ **Builder Pattern Schema API** - Fluent, type-safe schema construction
- 📚 **Documentation Generation** - Auto-generate Markdown, JSON Schema, and HTML docs
- 🔍 **Schema Introspection** - Complexity analysis and relationship detection
- 🧪 **Comprehensive Testing** - Built-in test utilities and validation
- 🎨 **Beautiful Error Formatting** - Colored CLI output with helpful suggestions
- ⚡ **High Performance** - Optimized for large schemas and deep nesting
- 🔒 **Type Safety** - Full TypeScript support with strict typing

## Installation

```bash
npm install @trailhead/config
# or
pnpm add @trailhead/config
# or
yarn add @trailhead/config
```

## Quick Start

### Define a Schema

```typescript
import { defineConfigSchema, string, number, boolean } from '@trailhead/config/core'

const appSchema = defineConfigSchema<{
  app: {
    name: string
    version: string
    environment: string
    debug: boolean
  }
  server: {
    port: number
    host: string
  }
}>()
  .object({
    app: {
      type: 'object',
      required: true,
      properties: {
        name: string().required().minLength(3).examples('my-app', 'awesome-service'),
        version: string().required().pattern('^\\d+\\.\\d+\\.\\d+$'),
        environment: string().required().enum('development', 'staging', 'production'),
        debug: boolean().default(false),
      },
    } as any,
    server: {
      type: 'object',
      required: true,
      properties: {
        port: number().required().range(1, 65535).default(3000),
        host: string().required().default('localhost'),
      },
    } as any,
  })
  .optional({})
  .name('Application Configuration')
  .description('Main application configuration schema')
  .version('1.0.0')
  .strict(true)
  .build()
```

### Load and Validate Configuration

```typescript
import { createConfigOperations } from '@trailhead/config/core'

const configOps = createConfigOperations()

const definition = {
  name: 'app-config',
  schema: appSchema,
  sources: [
    {
      type: 'file',
      path: './config.json',
      priority: 1,
    },
    {
      type: 'env',
      priority: 2,
    },
  ],
  validators: [createEnvironmentValidator(), createPortValidator()],
}

const result = await configOps.load(definition)

if (result.isOk()) {
  const config = result.value.resolved
  console.log('Configuration loaded:', config.app.name)
} else {
  // Beautiful error formatting automatically applied
  console.error('Configuration error:', result.error.message)
}
```

### Generate Documentation

```typescript
import { generateConfigDocs, generateMarkdown } from '@trailhead/config/docs'

// Generate documentation
const docsResult = generateConfigDocs(appSchema, {
  title: 'My App Configuration',
  includeExamples: true,
  includeConstraints: true,
})

if (docsResult.isOk()) {
  // Convert to markdown
  const markdownResult = generateMarkdown(docsResult.value)

  if (markdownResult.isOk()) {
    console.log(markdownResult.value)
  }
}
```

## Enhanced Validation System

### Beautiful Error Messages

The enhanced validation system provides contextual, helpful error messages:

```typescript
// Instead of generic "validation failed", you get:
✗ Invalid string for field "name" at "app" (received: 123) [type]
  Suggestion: Provide a valid string value for field "name"
  Examples:
    "my-app"
    "awesome-service"
  Learn more: https://trailhead.dev/config/rules/type
```

### Multiple Output Formats

```typescript
import { formatValidationError } from '@trailhead/config/validation'

// Colored CLI output (default)
const cliOutput = formatValidationError(error)

// Compact format
const compact = formatValidationError(error, { compact: true })

// JSON format for programmatic use
const json = formatValidationError(error, { format: 'json' })

// Interactive format for prompts
const interactive = formatValidationError(error, { format: 'interactive' })
```

## Schema Builder API

### Fluent Field Builders

```typescript
import { string, number, boolean, array, object } from '@trailhead/config/core'

// String fields with validation
const nameField = string()
  .required()
  .minLength(3)
  .maxLength(50)
  .pattern('^[a-zA-Z0-9-_]+$')
  .examples('my-app', 'awesome-service')
  .description('Application name')

// Number fields with constraints
const portField = number()
  .required()
  .range(1, 65535)
  .integer()
  .default(3000)
  .examples(3000, 8080, 9000)
  .description('Server port')

// Enum fields
const envField = string()
  .required()
  .enum('development', 'staging', 'production')
  .default('development')
  .description('Application environment')

// Array fields
const tagsField = array()
  .items(string().minLength(1))
  .minItems(1)
  .maxItems(10)
  .unique()
  .examples(['web', 'api'], ['frontend', 'backend'])

// Object fields
const dbField = object()
  .properties({
    host: string().required(),
    port: number().range(1, 65535),
    database: string().required(),
  })
  .additionalProperties(false)
```

## Documentation Generation

### Auto-Generated Documentation

Generate comprehensive documentation from your schemas:

```typescript
import { generateConfigDocs, generateMarkdown, generateJsonSchema } from '@trailhead/config/docs'

// Generate complete documentation
const docs = generateConfigDocs(schema, {
  title: 'API Configuration',
  includeExamples: true,
  includeConstraints: true,
  includeValidation: true,
})

// Multiple output formats
const markdown = generateMarkdown(docs.value)
const jsonSchema = generateJsonSchema(schema)
```

### CLI Documentation Command

```bash
# Generate documentation from schema
npx trailhead-config docs --schema ./config.schema.ts --output ./docs/config.md

# Watch for changes
npx trailhead-config docs --schema ./config.schema.ts --watch

# Different formats
npx trailhead-config docs --format json-schema --output ./schema.json
npx trailhead-config docs --format html --output ./docs/config.html

# Schema introspection
npx trailhead-config introspect --schema ./config.schema.ts
```

## Schema Introspection

Analyze schema complexity and structure:

```typescript
import { introspectSchema } from '@trailhead/config/docs'

const introspection = introspectSchema(schema, {
  includeComplexityAnalysis: true,
  includeRelationships: true,
})

if (introspection.isOk()) {
  const analysis = introspection.value

  console.log(`Schema: ${analysis.name}`)
  console.log(`Fields: ${analysis.statistics.totalFields}`)
  console.log(`Complexity: ${analysis.complexity.overall.toFixed(1)}`)

  if (analysis.complexity.recommendations.length > 0) {
    console.log('Recommendations:')
    analysis.complexity.recommendations.forEach((rec) => {
      console.log(`  • ${rec}`)
    })
  }
}
```

## Built-in Validators

Common validation patterns included:

```typescript
import {
  createEnvironmentValidator,
  createPortValidator,
  createUrlValidator,
  createSecurityValidator,
} from '@trailhead/config/validators';

const definition = {
  name: 'app-config',
  schema: appSchema,
  sources: [...],
  validators: [
    createEnvironmentValidator(), // Validates environment fields
    createPortValidator(),        // Validates port ranges
    createUrlValidator(),         // Validates URL formats
    createSecurityValidator(),    // Security best practices
  ],
};
```

## Advanced Usage

### Custom Validators

```typescript
const customValidator: ConfigValidator<AppConfig> = {
  name: 'business-rules',
  priority: 5,
  validate: (config) => {
    if (config.app.environment === 'production' && config.app.debug) {
      return err(
        createValidationError({
          field: 'debug',
          value: config.app.debug,
          expectedType: 'boolean',
          suggestion: 'Debug mode must be disabled in production',
          examples: [false],
          rule: 'production-security',
        })
      )
    }

    return ok(undefined)
  },
}
```

### Error Recovery

```typescript
const result = await configOps.load(definition)

if (result.isErr()) {
  // Extract specific validation errors
  const validationErrors = extractValidationErrors(result.error)

  // Format for display
  const formatted = formatValidationErrors(validationErrors, {
    includeColors: true,
    includeExamples: true,
    maxExamples: 3,
  })

  console.error(formatted)

  // Or get JSON for programmatic handling
  const jsonErrors = formatValidationErrorsJson(validationErrors)

  // Interactive error handling
  for (const error of validationErrors) {
    const interactive = createValidationErrorFormatter().formatInteractive(error)
    console.log(interactive.title)
    console.log(interactive.suggestion)
    console.log(`Fix: ${interactive.fixCommand}`)
  }
}
```

### Configuration Sources

Support for multiple configuration sources:

```typescript
const definition = {
  name: 'app-config',
  schema: appSchema,
  sources: [
    // File sources
    { type: 'file', path: './config.json', priority: 1, optional: true },
    { type: 'file', path: './config.local.json', priority: 2, optional: true },

    // Environment variables
    { type: 'env', priority: 3, env: 'NODE_ENV' },

    // CLI arguments
    { type: 'cli', priority: 4 },

    // Object source (for defaults)
    {
      type: 'object',
      data: { app: { debug: false } },
      priority: 0,
    },

    // Remote configuration
    { type: 'remote', path: 'https://config.example.com/app', priority: 5 },
  ],
  // Sources are merged by priority (higher overwrites lower)
}
```

## TypeScript Integration

Full TypeScript support with strict typing:

```typescript
interface AppConfig {
  app: {
    name: string
    version: string
    environment: 'development' | 'staging' | 'production'
    debug: boolean
  }
  server: {
    port: number
    host: string
  }
}

// Schema is fully typed
const schema = defineConfigSchema<AppConfig>()
  .object({
    // TypeScript ensures fields match AppConfig interface
    app: {
      /* ... */
    },
    server: {
      /* ... */
    },
  })
  .build()

// Configuration is fully typed
const config: AppConfig = result.value.resolved
console.log(config.app.name) // TypeScript knows this is a string
```

## Testing Utilities

Built-in testing support:

```typescript
import { validateWithSchema } from '@trailhead/config/core'
import { describe, it, expect } from 'vitest'

describe('Configuration Validation', () => {
  it('should validate correct configuration', () => {
    const validConfig = {
      app: {
        name: 'test-app',
        version: '1.0.0',
        environment: 'development',
        debug: false,
      },
      server: {
        port: 3000,
        host: 'localhost',
      },
    }

    const result = validateWithSchema(validConfig, appSchema)
    expect(result.isOk()).toBe(true)
  })

  it('should provide helpful error messages', () => {
    const invalidConfig = {
      app: {
        name: 'ab', // Too short
        version: '1.0.0',
        environment: 'invalid', // Not in enum
        debug: false,
      },
      server: {
        port: 70000, // Out of range
        host: 'localhost',
      },
    }

    const result = validateWithSchema(invalidConfig, appSchema)
    expect(result.isErr()).toBe(true)

    if (result.isErr()) {
      const errors = result.error.context?.errors || []
      expect(errors).toHaveLength(3) // name, environment, port

      const nameError = errors.find((e) => e.field === 'name')
      expect(nameError?.suggestion).toContain('at least 3 characters')
    }
  })
})
```

## Performance

Optimized for production use:

- **Fast validation**: < 1ms for typical schemas
- **Memory efficient**: Minimal overhead for large configurations
- **Caching**: Intelligent caching of validation results
- **Streaming**: Support for large configuration files
- **Parallel loading**: Concurrent source loading

## API Reference

### Core Exports

```typescript
// Schema definition
import { defineConfigSchema, string, number, boolean, array, object } from '@trailhead/config/core'

// Configuration operations
import { createConfigOperations } from '@trailhead/config/core'

// Validation errors
import {
  createValidationError,
  formatValidationError,
  formatValidationErrors,
  extractValidationErrors,
} from '@trailhead/config/validation'

// Documentation
import {
  generateConfigDocs,
  generateMarkdown,
  generateJsonSchema,
  introspectSchema,
} from '@trailhead/config/docs'

// Validators
import {
  createEnvironmentValidator,
  createPortValidator,
  createUrlValidator,
  createSecurityValidator,
} from '@trailhead/config/validators'

// CLI commands
import { createDocsCommand, createIntrospectCommand } from '@trailhead/config/cli'
```

## Contributing

This package is part of the Trailhead CLI monorepo. See the [main repository](https://github.com/esteban-url/trailhead-cli) for contribution guidelines.

## License

MIT © [Esteban Borai](https://github.com/esteban-url)
