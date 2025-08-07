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

Result type for configuration operations using CoreError.

```typescript
type ConfigResult<T> = Result<T, CoreError>
```

### `ZodConfigSchema<T>`

Schema definition interface powered by Zod.

```typescript
interface ZodConfigSchema<T = Record<string, unknown>> {
  readonly name?: string
  readonly description?: string
  readonly version?: string
  readonly zodSchema: z.ZodSchema<T>
  readonly strict?: boolean
}
```

### `ConfigDefinition<T>`

Configuration definition with sources and options.

```typescript
interface ConfigDefinition<T = Record<string, unknown>> {
  readonly name: string
  readonly version?: string
  readonly description?: string
  readonly schema?: ZodConfigSchema<T>
  readonly sources: readonly ConfigSource[]
  readonly defaults?: Partial<T>
  readonly transformers?: readonly ConfigTransformer<T>[]
  readonly validators?: readonly ConfigValidator<T>[]
}
```

### `ConfigSource`

Configuration source specification.

```typescript
interface ConfigSource {
  readonly type: ConfigSourceType
  readonly path?: string
  readonly data?: Record<string, unknown>
  readonly priority: number
  readonly optional?: boolean
  readonly watch?: boolean
  readonly env?: string
}
```

### `ConfigSourceType`

Available configuration source types.

```typescript
type ConfigSourceType = 'file' | 'env' | 'cli' | 'object' | 'remote' | 'vault'
```

### `ConfigState<T>`

Current configuration state.

```typescript
interface ConfigState<T = Record<string, unknown>> {
  readonly definition: ConfigDefinition<T>
  readonly raw: Record<string, unknown>
  readonly resolved: T
  readonly sources: readonly ResolvedSource[]
  readonly metadata: ConfigMetadata
}
```

### `ConfigManager<T>`

Main configuration manager interface.

```typescript
interface ConfigManager<T = Record<string, unknown>> {
  readonly definition: ConfigDefinition<T>
  readonly load: () => Promise<ConfigResult<ConfigState<T>>>
  readonly reload: () => Promise<ConfigResult<ConfigState<T>>>
  readonly get: <K extends keyof T>(key: K) => T[K] | undefined
  readonly set: <K extends keyof T>(key: K, value: T[K]) => ConfigResult<void>
  readonly has: (key: keyof T) => boolean
  readonly watch: (callback: ConfigChangeCallback<T>) => Promise<ConfigResult<ConfigWatcher[]>>
  readonly validate: () => Promise<ConfigResult<void>>
  readonly getState: () => ConfigState<T> | undefined
  readonly getMetadata: () => ConfigMetadata | undefined
}
```

## Schema Building

### `defineSchema()`

Creates a configuration schema with Zod-powered validation.

```typescript
function defineSchema<T extends Record<string, unknown>>(): {
  object: <K extends Record<string, any>>(shape: K) => ZodSchemaBuilder<z.infer<z.ZodObject<any>>>
}
```

**Usage**:

```typescript
import { defineSchema, string, number, boolean } from '@esteban-url/config'

const schema = defineSchema<{
  server: {
    port: number
    host: string
    ssl: boolean
  }
}>()
  .object({
    server: object({
      port: number().int().min(1024).max(65535).default(3000).description('Server port number'),
      host: string().default('localhost').description('Server host address'),
      ssl: boolean().default(false).description('Enable SSL/TLS'),
    }),
  })
  .build()
```

### `createSchema()`

Alternative schema creation using Zod schema directly.

```typescript
function createSchema<T>(zodSchema: z.ZodSchema<T>): ZodSchemaBuilder<T>
```

### `createZodSchema()`

Creates a ZodConfigSchema from a Zod schema.

```typescript
function createZodSchema<T>(zodSchema: z.ZodSchema<T>): ZodConfigSchema<T>
```

### `validate()`

Validates configuration against Zod schema.

```typescript
function validate<T>(config: unknown, schema: ZodConfigSchema<T>): ConfigResult<T>
```

### `validateAsync()`

Asynchronous configuration validation.

```typescript
function validateAsync<T>(config: unknown, schema: ZodConfigSchema<T>): Promise<ConfigResult<T>>
```

## Zod Field Builders

### `string()`

Creates a Zod string field builder.

```typescript
const string = (): ZodStringFieldBuilder => {
```

**Methods**:

- `description(description: string)` - Field description
- `optional()` - Mark as optional
- `default(defaultValue: string)` - Default value
- `examples(...examples: string[])` - Usage examples
- `enum(...values: readonly [string, ...string[]])` - Enum validation
- `pattern(pattern: RegExp, message?: string)` - Regex validation
- `minLength(min: number, message?: string)` - Minimum length
- `maxLength(max: number, message?: string)` - Maximum length
- `length(min: number, max: number)` - Length range
- `email(message?: string)` - Email format validation
- `url(message?: string)` - URL format validation
- `uuid(message?: string)` - UUID format validation
- `trim()` - Trim whitespace
- `toLowerCase()` - Convert to lowercase
- `toUpperCase()` - Convert to uppercase
- `build()` - Build Zod schema

**Usage**:

```typescript
const nameField = string().minLength(2).maxLength(50).trim().description('User full name')

const emailField = string().email().toLowerCase().description('User email address')
```

### `number()`

Creates a Zod number field builder.

```typescript
const number = (): ZodNumberFieldBuilder => {
```

**Methods**:

- `description(description: string)` - Field description
- `optional()` - Mark as optional
- `default(defaultValue: number)` - Default value
- `examples(...examples: number[])` - Usage examples
- `enum(...values: readonly [number, ...number[]])` - Enum validation
- `min(min: number, message?: string)` - Minimum value
- `max(max: number, message?: string)` - Maximum value
- `range(min: number, max: number)` - Value range
- `int(message?: string)` - Integer validation
- `positive(message?: string)` - Positive number validation
- `negative(message?: string)` - Negative number validation
- `nonNegative(message?: string)` - Non-negative validation
- `nonPositive(message?: string)` - Non-positive validation
- `finite(message?: string)` - Finite number validation
- `multipleOf(divisor: number, message?: string)` - Multiple validation
- `build()` - Build Zod schema

**Usage**:

```typescript
const portField = number().int().min(1024).max(65535).default(3000).description('Server port')

const ratioField = number().min(0).max(1).description('Scaling ratio')
```

### `boolean()`

Creates a Zod boolean field builder.

```typescript
const boolean = (): ZodBooleanFieldBuilder => {
```

**Methods**:

- `description(description: string)` - Field description
- `optional()` - Mark as optional
- `default(defaultValue: boolean)` - Default value
- `examples(...examples: boolean[])` - Usage examples
- `build()` - Build Zod schema

**Usage**:

```typescript
const debugField = boolean().default(false).description('Enable debug mode')
```

### `array()`

Creates a Zod array field builder.

```typescript
function array<T>(itemBuilder: ZodFieldBuilder<T>): ZodArrayFieldBuilder<T>
```

**Methods**:

- `description(description: string)` - Field description
- `optional()` - Mark as optional
- `default(defaultValue: T[])` - Default value
- `examples(...examples: T[][])` - Usage examples
- `minLength(min: number, message?: string)` - Minimum array length
- `maxLength(max: number, message?: string)` - Maximum array length
- `length(length: number, message?: string)` - Exact array length
- `nonempty(message?: string)` - Non-empty array validation
- `build()` - Build Zod schema

**Usage**:

```typescript
const tagsField = array(string()).minLength(1).description('Content tags')

const portsField = array(number().int().positive()).description('Available ports')
```

### `object()`

Creates a Zod object field builder.

```typescript
function object<T>(fields: Record<string, any>): ZodObjectFieldBuilder<T>
```

**Methods**:

- `description(description: string)` - Field description
- `optional()` - Mark as optional
- `default(defaultValue: T)` - Default value
- `examples(...examples: T[])` - Usage examples
- `strict()` - Strict object validation
- `passthrough()` - Allow additional properties
- `strip()` - Strip additional properties
- `build()` - Build Zod schema

**Usage**:

```typescript
const serverField = object({
  host: string().default('localhost'),
  port: number().int().default(3000),
  ssl: boolean().default(false),
}).description('Server configuration')
```

## Configuration Operations

### `createConfigOperations()`

Creates configuration operations instance.

```typescript
const createConfigOperations = (): ConfigOperations => {
```

### `ConfigOperations`

Configuration operations interface.

```typescript
interface ConfigOperations {
  readonly create: <T>(definition: ConfigDefinition<T>) => ConfigResult<ConfigManager<T>>
  readonly load: <T>(definition: ConfigDefinition<T>) => Promise<ConfigResult<ConfigState<T>>>
  readonly watch: <T>(
    definition: ConfigDefinition<T>,
    callback: ConfigChangeCallback<T>
  ) => Promise<ConfigResult<ConfigWatcher[]>>
  readonly validate: <T>(config: T, schema: ZodConfigSchema<T>) => ConfigResult<void>
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>
}
```

#### `create()`

Creates a configuration manager from definition.

```typescript
function create<T>(definition: ConfigDefinition<T>): ConfigResult<ConfigManager<T>>
```

#### `load()`

Loads configuration from all sources in definition.

```typescript
function load<T>(definition: ConfigDefinition<T>): Promise<ConfigResult<ConfigState<T>>>
```

#### `watch()`

Sets up configuration watching for changes.

```typescript
function watch<T>(
  definition: ConfigDefinition<T>,
  callback: ConfigChangeCallback<T>
): Promise<ConfigResult<ConfigWatcher[]>>
```

#### `validateConfig()`

Validates configuration against Zod schema.

```typescript
function validate<T>(config: T, schema: ZodConfigSchema<T>): ConfigResult<void>
```

#### `transform()`

Transforms configuration using transformers.

```typescript
function transform<T>(
  config: Record<string, unknown>,
  transformers: readonly ConfigTransformer<T>[]
): ConfigResult<T>
```

### `createConfigManager()`

Creates a configuration manager with dependencies.

```typescript
function createConfigManager<T>(
  definition: ConfigDefinition<T>,
  dependencies: ManagerDependencies
): ConfigManager<T>
```

**Usage**:

```typescript
import { createConfigManager, defineSchema, string, number } from '@esteban-url/config'

const schema = defineSchema<{
  api: {
    baseUrl: string
    timeout: number
  }
}>()
  .object({
    api: object({
      baseUrl: string().url().description('API base URL'),
      timeout: number().int().min(1000).default(5000).description('Request timeout'),
    }),
  })
  .build()

const definition: ConfigDefinition = {
  name: 'app-config',
  schema,
  sources: [
    { type: 'file', path: './config.json', priority: 1 },
    { type: 'env', env: 'APP_', priority: 2 },
    { type: 'cli', priority: 3 },
  ],
}

const configOps = createConfigOperations()
const managerResult = configOps.create(definition)

if (managerResult.isOk()) {
  const manager = managerResult.value
  const stateResult = await manager.load()

  if (stateResult.isOk()) {
    const config = stateResult.value.resolved
    console.log('API URL:', config.api.baseUrl)
  }
}
```

## Configuration Sources

### File Source

```typescript
interface FileSource extends ConfigSource {
  type: 'file'
  path: string
  priority: number
  optional?: boolean
  watch?: boolean
}
```

### Environment Source

```typescript
interface EnvSource extends ConfigSource {
  type: 'env'
  env?: string
  priority: number
  optional?: boolean
}
```

### CLI Source

```typescript
interface CLISource extends ConfigSource {
  type: 'cli'
  priority: number
  optional?: boolean
}
```

### Object Source

```typescript
interface ObjectSource extends ConfigSource {
  type: 'object'
  data: Record<string, unknown>
  priority: number
  optional?: boolean
}
```

## Loader Operations

### `createLoaderOperations()`

Creates configuration loader operations.

```typescript
const createLoaderOperations = (): LoaderOperations => {
```

### `LoaderOperations`

Loader operations interface.

```typescript
interface LoaderOperations {
  readonly register: (loader: ConfigLoader) => void
  readonly unregister: (type: ConfigSourceType) => void
  readonly getLoader: (source: ConfigSource) => ConfigLoader | undefined
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>
}
```

### `ConfigLoader`

Configuration loader interface.

```typescript
interface ConfigLoader {
  readonly load: (source: ConfigSource) => Promise<ConfigResult<Record<string, unknown>>>
  readonly watch?: (
    source: ConfigSource,
    callback: ConfigWatchCallback
  ) => Promise<ConfigResult<ConfigWatcher>>
  readonly supports: (source: ConfigSource) => boolean
}
```

## Validator Operations

### `createValidatorOperations()`

Creates validation operations.

```typescript
const createValidatorOperations = (): ValidatorOperations => {
```

### `ValidatorOperations`

Validator operations interface.

```typescript
interface ValidatorOperations {
  readonly register: <T>(validator: ConfigValidator<T>) => void
  readonly unregister: (name: string) => void
  readonly validate: <T>(config: T, validators: readonly ConfigValidator<T>[]) => ConfigResult<void>
  readonly validateSchema: <T>(config: T, schema: unknown) => ConfigResult<void>
}
```

## Transformer Operations

### `createTransformerOperations()`

Creates transformation operations.

```typescript
const createTransformerOperations = (): TransformerOperations => {
```

### `TransformerOperations`

Transformer operations interface.

```typescript
interface TransformerOperations {
  readonly register: <T>(transformer: ConfigTransformer<T>) => void
  readonly unregister: (name: string) => void
  readonly transform: <T>(
    config: Record<string, unknown>,
    transformers: readonly ConfigTransformer<T>[]
  ) => ConfigResult<T>
}
```

## Documentation Generation

### `generateDocs()`

Generates documentation from Zod schema.

```typescript
const generateDocs = (schema: ZodConfigSchema, options?: ZodDocsGeneratorOptions): ZodConfigDocs => {
```

**Parameters**:

- `schema` - Zod configuration schema
- `options` - Generation options

**Returns**: `ZodConfigDocs` object

**Usage**:

```typescript
import { generateDocs } from '@esteban-url/config'

const docs = generateDocs(schema, {
  includeExamples: true,
  includeDefaults: true,
  format: 'markdown',
})

console.log(docs.markdown) // Generated markdown documentation
console.log(docs.sections) // Documentation sections
```

### `generateJsonSchema()`

Generates JSON Schema from Zod configuration schema.

```typescript
const generateJsonSchema = (schema: ZodConfigSchema, options?: ZodJsonSchemaOptions): ZodJsonSchema => {
```

**Parameters**:

- `schema` - Zod configuration schema
- `options` - Generation options

**Returns**: JSON Schema object

**Usage**:

```typescript
const jsonSchema = generateJsonSchema(schema, {
  title: 'Application Configuration',
  description: 'Complete configuration schema',
})
```

### `ZodConfigDocs`

Documentation output interface.

```typescript
interface ZodConfigDocs {
  readonly metadata: ZodDocsMetadata
  readonly sections: readonly ZodDocumentationSection[]
  readonly examples: readonly ZodExampleConfig[]
  readonly markdown: string
  readonly json: string
}
```

### `ZodJsonSchema`

JSON Schema output interface.

```typescript
interface ZodJsonSchema {
  readonly $schema: string
  readonly title?: string
  readonly description?: string
  readonly type: string
  readonly properties: Record<string, ZodJsonSchemaProperty>
  readonly required?: readonly string[]
  readonly additionalProperties?: boolean
}
```

## Validation and Errors

### `ConfigValidationError`

Enhanced configuration validation error.

```typescript
interface ConfigValidationError extends BaseValidationError {
  readonly suggestion: string
  readonly examples: readonly unknown[]
  readonly fixCommand?: string
  readonly learnMoreUrl?: string
  readonly expectedType: string
  readonly path: readonly string[]
  readonly data?: Record<string, unknown>
}
```

### `createConfigValidationError()`

Creates configuration validation errors.

```typescript
const createConfigValidationError = (context: ConfigValidationContext): ConfigValidationError => {
```

### `enhanceZodError()`

Enhances Zod errors with additional context.

```typescript
function enhanceZodError(
  error: z.ZodError,
  context?: ConfigValidationContext
): ConfigValidationError
```

### `formatValidationError()`

Formats validation error for display.

```typescript
const formatValidationError = (error: ConfigValidationError, options?: FormatOptions): string => {
```

### `formatValidationErrors()`

Formats multiple validation errors.

```typescript
function formatValidationErrors(
  errors: readonly ConfigValidationError[],
  options?: FormatOptions
): string
```

## Usage Examples

### Basic Configuration

```typescript
import {
  defineSchema,
  string,
  number,
  boolean,
  object,
  createConfigOperations,
  type ConfigDefinition,
} from '@esteban-url/config'

// Define schema
const schema = defineSchema<{
  server: {
    host: string
    port: number
    ssl: boolean
  }
  database: {
    url: string
    maxConnections: number
  }
}>()
  .object({
    server: object({
      host: string().default('localhost').description('Server host'),
      port: number().int().min(1024).default(3000).description('Server port'),
      ssl: boolean().default(false).description('Enable SSL'),
    }),
    database: object({
      url: string().url().description('Database connection URL'),
      maxConnections: number().int().min(1).default(10).description('Max connections'),
    }),
  })
  .build()

// Create definition
const definition: ConfigDefinition = {
  name: 'app-config',
  schema,
  sources: [
    { type: 'file', path: './config.json', priority: 1 },
    { type: 'env', env: 'APP_', priority: 2 },
  ],
}

// Create manager
const configOps = createConfigOperations()
const managerResult = configOps.create(definition)

if (managerResult.isOk()) {
  const manager = managerResult.value

  // Load configuration
  const stateResult = await manager.load()
  if (stateResult.isOk()) {
    const { server, database } = stateResult.value.resolved
    console.log(`Server: ${server.host}:${server.port}`)
    console.log(`Database: ${database.url}`)
  }
}
```

### Documentation Generation Examples

```typescript
import { generateDocs, generateJsonSchema } from '@esteban-url/config'

// Generate markdown docs
const docs = generateDocs(schema, {
  includeExamples: true,
  includeDefaults: true,
})

// Generate JSON Schema
const jsonSchema = generateJsonSchema(schema, {
  title: 'My App Configuration',
})

// Save documentation
await fs.writeFile('config-docs.md', docs.markdown)
await fs.writeFile('config-schema.json', JSON.stringify(jsonSchema, null, 2))
```

### Configuration Watching

```typescript
const watcher = await manager.watch((newConfig, oldConfig, changes) => {
  console.log('Configuration changed!')
  changes.forEach((change) => {
    console.log(`${change.path}: ${change.oldValue} → ${change.newValue}`)
  })
})

// Stop watching later
if (watcher.isOk()) {
  await Promise.all(watcher.value.map((w) => w.stop()))
}
```

### Error Handling

```typescript
import { createConfigValidationError, formatValidationError } from '@esteban-url/config'

const stateResult = await manager.load()
if (stateResult.isErr()) {
  const error = stateResult.error
  console.error('Configuration error:', error.message)

  if (error.type === 'SCHEMA_VALIDATION_FAILED' && error.context?.errors) {
    const validationErrors = error.context.errors as ConfigValidationError[]
    validationErrors.forEach((err) => {
      const formatted = formatValidationError(err)
      console.error(formatted)
    })
  }
}
```

### Configuration Sources Priority

```typescript
const definition: ConfigDefinition = {
  name: 'app-config',
  schema,
  sources: [
    { type: 'file', path: './defaults.json', priority: 1 },
    { type: 'file', path: './config.json', priority: 2 },
    { type: 'env', env: 'APP_', priority: 3 },
    { type: 'cli', priority: 4 },
  ],
}
```

### Custom Validators and Transformers

```typescript
const customValidator: ConfigValidator<MyConfig> = {
  name: 'business-rules',
  async validate(config) {
    if (config.server.port === config.database.port) {
      return err(createConfigValidationError({
        field: 'server.port',
        value: config.server.port,
        expectedType: 'number',
        suggestion: 'Server and database ports must be different',
        examples: [3000, 5432],
      }))
    }
    return ok(undefined)
  },
}

const definition: ConfigDefinition = {
  name: 'app-config',
  schema,
  sources: [...],
  validators: [customValidator],
}
```

## Related APIs

- [Core API Reference](./core-api.md) - Base Result types and error handling
- [Validation API](../../../validation/reference/api.md) - Zod validation utilities
- [Data API](../../../data/reference/api.md) - Data processing operations
