---
type: reference
title: 'Configuration Package API Reference'
description: 'Complete API reference for configuration operations with Zod schemas, documentation generation, and Result-based error handling'
related:
  - /docs/reference/core-api
  - /docs/explanation/config-sources.md
  - /docs/how-to/define-schemas
---

# Configuration Package API Reference

Complete API reference for `@esteban-url/config` package providing configuration management with Zod schemas, automatic documentation generation, and Result-based error handling.

## Core Types

### `ConfigResult<T>`

Result type for configuration operations.

```typescript
type ConfigResult<T> = Result<T, ValidationError>
```

### `ConfigSchema`

Schema definition interface.

```typescript
interface ConfigSchema {
  readonly fields: Record<string, FieldBuilder>
  readonly metadata?: ConfigMetadata
}
```

### `ConfigManager`

Main configuration manager interface.

```typescript
interface ConfigManager {
  load: (sources: ConfigSource[]) => Promise<ConfigResult<unknown>>
  validate: (config: unknown) => ConfigResult<unknown>
  watch: (callback: ConfigChangeCallback) => ConfigWatcher
  generateDocs: () => ConfigDocs
}
```

## Schema Building

### `defineSchema()`

Creates a configuration schema with validation and documentation.

```typescript
function defineSchema(definition: SchemaDefinition): ConfigSchema
```

**Parameters**:

- `definition` - Schema definition object

**Returns**: `ConfigSchema` instance

**Usage**:

```typescript
import { defineSchema, string, number, boolean } from '@esteban-url/config'

const schema = defineSchema({
  server: {
    port: number().min(1024).max(65535).default(3000).describe('Server port number'),
    host: string().default('localhost').describe('Server host address'),
    ssl: boolean().default(false).describe('Enable SSL/TLS'),
  },
})
```

### `createSchema()`

Alternative schema creation function.

```typescript
function createSchema(fields: Record<string, FieldBuilder>): ConfigSchema
```

### `validate()`

Validates configuration against schema.

```typescript
function validate<T>(schema: ConfigSchema, config: unknown): ConfigResult<T>
```

### `validateAsync()`

Asynchronous configuration validation.

```typescript
function validateAsync<T>(schema: ConfigSchema, config: unknown): Promise<ConfigResult<T>>
```

## Field Builders

### `string()`

Creates a string field builder.

```typescript
function string(): StringFieldBuilder
```

**Methods**:

- `min(length: number)` - Minimum length
- `max(length: number)` - Maximum length
- `regex(pattern: RegExp)` - Pattern validation
- `email()` - Email format validation
- `url()` - URL format validation
- `default(value: string)` - Default value
- `describe(text: string)` - Field description
- `optional()` - Mark as optional

**Usage**:

```typescript
const nameField = string().min(2).max(50).describe('User full name')

const emailField = string().email().describe('User email address')
```

### `number()`

Creates a number field builder.

```typescript
function number(): NumberFieldBuilder
```

**Methods**:

- `min(value: number)` - Minimum value
- `max(value: number)` - Maximum value
- `int()` - Integer validation
- `positive()` - Positive number validation
- `default(value: number)` - Default value
- `describe(text: string)` - Field description
- `optional()` - Mark as optional

**Usage**:

```typescript
const portField = number().int().min(1024).max(65535).default(3000).describe('Server port')

const ratioField = number().min(0).max(1).describe('Scaling ratio')
```

### `boolean()`

Creates a boolean field builder.

```typescript
function boolean(): BooleanFieldBuilder
```

**Methods**:

- `default(value: boolean)` - Default value
- `describe(text: string)` - Field description
- `optional()` - Mark as optional

**Usage**:

```typescript
const debugField = boolean().default(false).describe('Enable debug mode')
```

### `array()`

Creates an array field builder.

```typescript
function array<T>(itemBuilder: FieldBuilder<T>): ArrayFieldBuilder<T>
```

**Methods**:

- `min(length: number)` - Minimum array length
- `max(length: number)` - Maximum array length
- `default(value: T[])` - Default value
- `describe(text: string)` - Field description
- `optional()` - Mark as optional

**Usage**:

```typescript
const tagsField = array(string()).min(1).describe('Content tags')

const portsField = array(number().int().positive()).describe('Available ports')
```

### `object()`

Creates an object field builder.

```typescript
function object<T>(fields: Record<string, FieldBuilder>): ObjectFieldBuilder<T>
```

**Methods**:

- `default(value: T)` - Default value
- `describe(text: string)` - Field description
- `optional()` - Mark as optional

**Usage**:

```typescript
const serverField = object({
  host: string().default('localhost'),
  port: number().int().default(3000),
  ssl: boolean().default(false),
}).describe('Server configuration')
```

## Configuration Operations

### `createConfigOperations()`

Creates configuration operations instance.

```typescript
function createConfigOperations(schema: ConfigSchema): ConfigOperations
```

**Returns**: `ConfigOperations` instance with methods:

- `load()` - Load configuration from sources
- `validate()` - Validate configuration
- `transform()` - Transform configuration
- `watch()` - Watch for changes

### `createConfigManager()`

Creates a configuration manager.

```typescript
function createConfigManager(schema: ConfigSchema, options?: ConfigManagerOptions): ConfigManager
```

**Parameters**:

- `schema` - Configuration schema
- `options` - Manager options

**Returns**: `ConfigManager` instance

**Usage**:

```typescript
import { createConfigManager, defineSchema, string, number } from '@esteban-url/config'

const schema = defineSchema({
  api: {
    baseUrl: string().url().describe('API base URL'),
    timeout: number().int().min(1000).default(5000).describe('Request timeout'),
  },
})

const manager = createConfigManager(schema)

// Load from multiple sources
const result = await manager.load([
  { type: 'file', path: './config.json' },
  { type: 'env', prefix: 'APP_' },
  { type: 'args' },
])
```

## Configuration Sources

### `ConfigSource`

Configuration source interface.

```typescript
interface ConfigSource {
  readonly type: ConfigSourceType
  readonly priority?: number
  readonly watch?: boolean
}
```

### File Source

```typescript
interface FileSource extends ConfigSource {
  type: 'file'
  path: string
  format?: 'json' | 'yaml' | 'toml'
}
```

### Environment Source

```typescript
interface EnvSource extends ConfigSource {
  type: 'env'
  prefix?: string
  transform?: (key: string, value: string) => [string, unknown]
}
```

### Command Line Source

```typescript
interface CLISource extends ConfigSource {
  type: 'args'
  parser?: 'yargs' | 'commander'
  mapping?: Record<string, string>
}
```

## Documentation Generation

### `generateDocs()`

Generates documentation from schema.

```typescript
function generateDocs(schema: ConfigSchema, options?: DocsGeneratorOptions): ConfigDocs
```

**Parameters**:

- `schema` - Configuration schema
- `options` - Generation options

**Returns**: `ConfigDocs` object

**Usage**:

```typescript
import { generateDocs } from '@esteban-url/config'

const docs = generateDocs(schema, {
  format: 'markdown',
  includeExamples: true,
  groupBySection: true,
})

console.log(docs.markdown) // Generated markdown documentation
console.log(docs.examples) // Example configurations
```

### `generateJsonSchema()`

Generates JSON Schema from configuration schema.

```typescript
function generateJsonSchema(schema: ConfigSchema, options?: JsonSchemaOptions): JsonSchema
```

**Parameters**:

- `schema` - Configuration schema
- `options` - Generation options

**Returns**: JSON Schema object

**Usage**:

```typescript
const jsonSchema = generateJsonSchema(schema, {
  title: 'Application Configuration',
  description: 'Complete configuration schema',
})
```

## Validation and Errors

### `createValidationError()`

Creates configuration validation errors.

```typescript
function createValidationError(
  field: string,
  value: unknown,
  message: string,
  options?: ValidationErrorOptions
): ValidationError
```

### `enhanceZodError()`

Enhances Zod errors with additional context.

```typescript
function enhanceZodError(error: z.ZodError, context?: ValidationContext): ValidationError
```

### `formatValidationError()`

Formats validation error for display.

```typescript
function formatValidationError(error: ValidationError, options?: FormatOptions): string
```

### `formatValidationErrors()`

Formats multiple validation errors.

```typescript
function formatValidationErrors(errors: ValidationError[], options?: FormatOptions): string
```

## Configuration Loading

### `createLoaderOperations()`

Creates configuration loader operations.

```typescript
function createLoaderOperations(): LoaderOperations
```

**Methods**:

- `loadFile()` - Load from file
- `loadEnv()` - Load from environment
- `loadArgs()` - Load from command line
- `loadRemote()` - Load from remote source

### `createValidatorOperations()`

Creates validation operations.

```typescript
function createValidatorOperations(schema: ConfigSchema): ValidatorOperations
```

### `createTransformerOperations()`

Creates transformation operations.

```typescript
function createTransformerOperations(): TransformerOperations
```

## Advanced Features

### Configuration Watching

```typescript
const watcher = manager.watch((change) => {
  console.log(`Configuration changed: ${change.path}`)
  console.log(`Old value: ${change.oldValue}`)
  console.log(`New value: ${change.newValue}`)
})

// Stop watching
watcher.stop()
```

### Zod Integration

```typescript
import { z } from 'zod'
import { createZodSchema } from '@esteban-url/config'

// Direct Zod schema
const zodSchema = z.object({
  name: z.string().min(1),
  port: z.number().int().min(1024).max(65535),
})

// Convert to config schema
const configSchema = createZodSchema(zodSchema)
```

## Usage Examples

### Basic Configuration

```typescript
import { defineSchema, string, number, boolean, createConfigManager } from '@esteban-url/config'

// Define schema
const schema = defineSchema({
  server: {
    host: string().default('localhost').describe('Server host'),
    port: number().int().min(1024).default(3000).describe('Server port'),
    ssl: boolean().default(false).describe('Enable SSL'),
  },
  database: {
    url: string().url().describe('Database connection URL'),
    maxConnections: number().int().min(1).default(10).describe('Max connections'),
  },
})

// Create manager
const config = createConfigManager(schema)

// Load configuration
const result = await config.load([
  { type: 'file', path: './config.json' },
  { type: 'env', prefix: 'APP_' },
])

if (result.isOk()) {
  const { server, database } = result.value
  console.log(`Server: ${server.host}:${server.port}`)
}
```

### Documentation Generation

```typescript
import { generateDocs, generateJsonSchema } from '@esteban-url/config'

// Generate markdown docs
const docs = generateDocs(schema, {
  format: 'markdown',
  includeExamples: true,
})

// Generate JSON Schema
const jsonSchema = generateJsonSchema(schema, {
  title: 'My App Configuration',
})

// Save documentation
await fs.writeFile('config-docs.md', docs.markdown)
await fs.writeFile('config-schema.json', JSON.stringify(jsonSchema, null, 2))
```

### Complex Validation

```typescript
const schema = defineSchema({
  features: array(string()).min(1).describe('Enabled features'),
  limits: object({
    requests: number().int().min(1).describe('Request limit'),
    users: number().int().min(1).describe('User limit'),
  }).describe('System limits'),
  environment: string()
    .regex(/^(dev|staging|prod)$/)
    .describe('Environment'),
})

const result = await config.validate(userInput)
if (result.isErr()) {
  const formatted = formatValidationErrors(result.error.issues)
  console.error('Validation failed:', formatted)
}
```

### Configuration Sources Priority

```typescript
const result = await manager.load([
  { type: 'file', path: './defaults.json', priority: 1 },
  { type: 'file', path: './config.json', priority: 2 },
  { type: 'env', prefix: 'APP_', priority: 3 },
  { type: 'args', priority: 4 },
])
```

## Related APIs

- [Core API Reference](/docs/reference/core-api.md)- Base Result types and error handling
- [Data API](/packages/data/docs/reference/api.md)- Data processing operations
- [Validation API](/packages/validation/docs/reference/api.md)- Data validation
