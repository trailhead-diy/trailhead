# Trailhead LLM Guide

> **Target Audience**: Language models assisting with either **using** Trailhead to build CLIs or **developing** the Trailhead codebase itself.

This guide provides deep architectural context, patterns, gotchas, and examples to help LLMs understand and work effectively with the Trailhead monorepo.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Philosophy](#architecture-philosophy)
- [Result Types & Error Handling](#result-types--error-handling)
- [CLI Command Patterns](#cli-command-patterns)
- [FileSystem Abstractions](#filesystem-abstractions)
- [Configuration Management](#configuration-management)
- [Testing Patterns](#testing-patterns)
- [Common Gotchas & Pitfalls](#common-gotchas--pitfalls)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)
- [FAQ for LLMs](#faq-for-llms)

---

## Quick Start

### What is Trailhead?

Trailhead is a **functional CLI framework** for building TypeScript command-line applications with:
- **Result-based error handling** (no exceptions)
- **Pure functions** and immutable data
- **Type-safe abstractions** for filesystem, config, validation
- **High-ROI testing utilities**

### Package Structure

```
@trailhead/core          → Result types, error handling, functional utilities
@trailhead/cli           → CLI framework, command creation, testing
@trailhead/fs            → Result-based filesystem operations
@trailhead/config        → Type-safe configuration with Zod
@trailhead/create-cli    → CLI generator (uses all of the above)
```

### Minimal Example

```typescript
import { createCLI, createCommand } from '@trailhead/cli'
import { ok, err } from '@trailhead/core'

const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet a user',
  arguments: '[name]',
  action: async (options, context) => {
    const name = context.args[0] || 'World'
    context.logger.info(`Hello, ${name}!`)
    return ok(undefined)
  }
})

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI',
  commands: [greetCommand]
})

await cli.run()
```

---

## Architecture Philosophy

### Core Principles

1. **Railway-Oriented Programming**: Operations return `Result<T, E>` instead of throwing
2. **Functional Composition**: Pure functions composed via `pipe()` and `flow()`
3. **Dependency Injection**: Factory functions accept configuration
4. **Explicit Error Flow**: Type system enforces error handling
5. **Zero Classes**: Public APIs use functions and immutable data structures

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **neverthrow + fp-ts** | Battle-tested Result type + functional utilities |
| **Factory pattern** | Enables DI without classes |
| **Subpath exports** | Tree-shakeable, modular imports |
| **ESM-only** | Modern Node.js (v18+), better tree-shaking |
| **Turborepo** | Optimized caching for monorepo builds |

### Dependency Graph

```
@trailhead/core (Result, errors, functional utils)
       ↓
    ┌──┴──┬──────┬─────────┐
    ↓     ↓      ↓         ↓
  @t/fs  @t/cli  @t/config  @t/validation
                 ↓
           @t/create-cli
```

### Library Exports & Re-exports

Trailhead wraps and re-exports popular libraries for consistency. Here's what's available:

#### ✅ Fully Exported (Use Directly)

**`@trailhead/cli/utils`** - Terminal output & utilities:
```typescript
// Consola (structured logging)
import { consola, colors } from '@trailhead/cli/utils'
consola.success('Build completed')
consola.error('Deploy failed')
console.log(colors.green('✓ Success'))

// Logging helpers
import { logSuccess, logError, logWarning, logInfo, createDefaultLogger } from '@trailhead/cli/utils'

// Spinners (yocto-spinner wrapper)
import { createSpinner, withSpinner } from '@trailhead/cli/utils'

// Package manager detection
import { detectPackageManager, getRunCommand } from '@trailhead/cli/utils'
```

**`@trailhead/cli/prompts`** - Interactive prompts:
```typescript
// ALL @inquirer/prompts re-exported
import { input, select, confirm, checkbox, password } from '@trailhead/cli/prompts'

// Custom helpers
import { createConfirmationPrompt, createDirectoryPrompt } from '@trailhead/cli/prompts'
```

**`@trailhead/cli/progress`** - Progress bars:
```typescript
// cli-progress re-exports
import { SingleBar, MultiBar, Presets } from '@trailhead/cli/progress'

// Trailhead wrappers
import { createProgressTracker, createEnhancedProgressTracker } from '@trailhead/cli/progress'
```

#### ❌ Wrapped Internally (Not Exported)

These libraries are used internally but NOT exposed:
- **commander** - wrapped by `createCLI()`, not directly accessible
- **listr2** - used for task lists, not exported

#### 🚫 Not Used (Common Misconception)

- **chalk** - NOT used. Replaced with `consola/utils` colors
- **ora** - NOT used. Replaced with `yocto-spinner`

**Migration Guide (if you see chalk in old docs)**:
```typescript
// ❌ Old (chalk)
import chalk from 'chalk'
console.log(chalk.green('Success'))

// ✅ New (consola colors)
import { colors } from '@trailhead/cli/utils'
console.log(colors.green('Success'))

// ✅ Better (consola structured)
import { consola } from '@trailhead/cli/utils'
consola.success('Success')
```

---

## Result Types & Error Handling

### The Result Type

```typescript
type Result<T, E> = Ok<T> | Err<E>

// Create results
import { ok, err } from '@trailhead/core'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err('Division by zero')
  return ok(a / b)
}
```

### CoreError Interface

All errors in Trailhead implement `CoreError`:

```typescript
interface CoreError {
  readonly type: string                    // e.g., 'ValidationError'
  readonly code: string                    // e.g., 'INVALID_INPUT'
  readonly message: string                 // Human-readable
  readonly details?: string                // Additional info
  readonly cause?: unknown                 // Original error
  readonly suggestion?: string             // Recovery hint
  readonly recoverable: boolean            // Can retry?
  readonly context?: Record<string, unknown> // Debug metadata
  readonly component: string               // Where it occurred
  readonly operation: string               // What was happening
  readonly timestamp: Date
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}
```

### Error Factory Pattern

**Never construct errors manually**. Use factories:

```typescript
import { createCoreError, createFileSystemError } from '@trailhead/core/errors'

// Generic error
return err(createCoreError(
  'ValidationError',
  'INVALID_NAME',
  'Project name must be lowercase',
  {
    operation: 'validateProjectName',
    suggestion: 'Use lowercase letters, numbers, and hyphens only'
  }
))

// Domain-specific error
return err(createFileSystemError(
  'ENOENT',
  'File not found: config.json',
  {
    operation: 'readConfigFile',
    path: 'config.json',
    suggestion: 'Run "init" command to create config'
  }
))
```

### Converting Unsafe Code

#### Wrap Promises

```typescript
import { fromPromiseAsync } from '@trailhead/core'

const result = await fromPromiseAsync(
  fetch('/api/user'),
  (error) => createCoreError(
    'NetworkError',
    'FETCH_FAILED',
    'Failed to fetch user data',
    { cause: error }
  )
)
```

#### Wrap Throwing Functions

```typescript
import { fromThrowableAsync } from '@trailhead/core'

const parseJSON = fromThrowableAsync(
  JSON.parse,
  (error) => createCoreError(
    'ParseError',
    'INVALID_JSON',
    'Invalid JSON format',
    { cause: error }
  )
)

const result = parseJSON('{"name": "test"}')
if (result.isErr()) {
  console.error(result.error.message)
}
```

### Error Composition

```typescript
import { pipe } from '@trailhead/core'

const result = await pipe(
  await readFile('config.json'),        // Result<string, FileSystemError>
  (content) => parseJSON(content),      // Result<Config, ParseError>
  (config) => validateConfig(config)    // Result<ValidConfig, ValidationError>
)

// Short-circuits on first error
if (result.isErr()) {
  console.error(result.error)
}
```

### andThen / map Pattern

```typescript
const result = await readFile('user.json')
  .andThen(content => parseJSON(content))     // Flat-map (Result → Result)
  .map(user => user.name)                      // Transform (value → value)
  .mapErr(err => withContext(err, { userId: 123 })) // Transform error
```

---

## CLI Command Patterns

### Command Structure

```typescript
interface Command<T = any> {
  name: string
  description: string
  arguments?: string | CommandArgument[]
  options?: CommandOption[]
  examples?: string[]
  execute: (options: T, context: CommandContext)
    => Promise<Result<void, CoreError>>
}
```

### CommandContext

Every command action receives a `CommandContext`:

```typescript
interface CommandContext {
  readonly projectRoot: string    // Absolute project path
  readonly logger: Logger         // Logging utility
  readonly verbose: boolean       // Verbose flag
  readonly fs: FileSystem         // Filesystem operations
  readonly args: string[]         // Positional arguments
}
```

**Gotcha**: Positional arguments are in `context.args`, NOT in `options`.

### Creating Commands

```typescript
import { createCommand } from '@trailhead/cli/command'

interface BuildOptions {
  readonly output?: string
  readonly minify?: boolean
  readonly verbose?: boolean
}

const buildCommand = createCommand<BuildOptions>({
  name: 'build',
  description: 'Build the project',
  arguments: '[entry]',
  options: [
    {
      flags: '-o, --output <dir>',
      description: 'Output directory',
      type: 'string'
    },
    {
      flags: '--minify',
      description: 'Minify output',
      type: 'boolean'
    }
  ],
  examples: [
    'build src/index.ts',
    'build --output dist --minify'
  ],
  action: async (options, context) => {
    const entry = context.args[0] || 'src/index.ts'

    context.logger.info(`Building ${entry}...`)

    // Your logic here

    return ok(undefined)
  }
})
```

### Common Options Builder

Reduce boilerplate with pre-configured options:

```typescript
import { commonOptions, defineOptions } from '@trailhead/cli/command'

const options = defineOptions()
  .common(['output', 'verbose', 'dryRun', 'force'])
  .custom([
    { flags: '--minify', description: 'Minify output', type: 'boolean' }
  ])
  .build()
```

### File Processing Command

For commands that read/write files:

```typescript
import { createFileProcessingCommand } from '@trailhead/cli/command'

const transformCommand = createFileProcessingCommand<TransformOptions>({
  name: 'transform',
  description: 'Transform a file',
  action: async (options, context, processingContext) => {
    // processingContext includes validated input/output paths
    const { inputPath, outputPath } = processingContext

    const contentResult = await context.fs.readFile(inputPath)
    if (contentResult.isErr()) return contentResult

    const transformed = transform(contentResult.value)

    return context.fs.writeFile(outputPath, transformed)
  }
})
```

### Multi-Phase Execution

For validation → prepare → execute workflows:

```typescript
import { executeWithPhases } from '@trailhead/cli/command'

const phases = [
  {
    name: 'validate',
    execute: async (data, context) => {
      // Validation logic
      return ok(data)
    }
  },
  {
    name: 'prepare',
    execute: async (data, context) => {
      // Preparation logic
      return ok({ ...data, prepared: true })
    }
  },
  {
    name: 'execute',
    execute: async (data, context) => {
      // Main logic
      return ok(data)
    }
  }
]

const result = await executeWithPhases(initialData, phases, context)
```

### Dry Run Pattern

```typescript
import { executeWithDryRun } from '@trailhead/cli/command'

await executeWithDryRun(
  async () => {
    // Actual operation
    await fs.writeFile('output.txt', content)
    return ok(undefined)
  },
  () => {
    // Preview message
    return 'Would write to output.txt'
  },
  { dryRun: options.dryRun },
  context
)
```

---

## FileSystem Abstractions

### Core Operations

All filesystem operations return `FSResult<T> = Result<T, FileSystemError>`:

```typescript
import { fs } from '@trailhead/fs'

// Read file
const result = await fs.readFile('config.json')
if (result.isOk()) {
  console.log(result.value)
}

// Write file
await fs.writeFile('output.txt', 'content')

// Check existence
const exists = await fs.exists('file.txt')

// Read JSON
const configResult = await fs.readJson<Config>('config.json')

// Write JSON
await fs.writeJson('config.json', { name: 'test' }, { spaces: 2 })

// Directory operations
await fs.mkdir('dist')
await fs.readDir('src')

// Copy/move/remove
await fs.copy('src', 'dist')
await fs.move('old.txt', 'new.txt')
await fs.remove('temp')
```

### Factory Pattern

Create configured filesystem instances:

```typescript
import { readFile, writeFile } from '@trailhead/fs'

const customRead = readFile({ encoding: 'utf16le' })
const customWrite = writeFile({ encoding: 'utf16le' })
```

### Error Handling

FileSystemError includes the path:

```typescript
const result = await fs.readFile('missing.txt')
if (result.isErr()) {
  console.error(result.error.code)       // 'ENOENT'
  console.error(result.error.path)       // 'missing.txt'
  console.error(result.error.suggestion) // Helpful recovery hint
}
```

### Node Error Mapping

```typescript
import { mapNodeError } from '@trailhead/fs'

try {
  // Some Node.js operation
} catch (error) {
  return err(mapNodeError('readFile', 'config.json', error))
}
```

---

## Configuration Management

### Schema Definition

```typescript
import { createSchema, string, number, boolean } from '@trailhead/config'
import { z } from 'zod'

const configSchema = createSchema(z.object({
  port: number()
    .description('Server port')
    .min(1)
    .max(65535)
    .default(3000),
  host: string()
    .description('Hostname')
    .default('localhost'),
  debug: boolean()
    .description('Enable debug mode')
    .default(false)
}))
  .name('server-config')
  .version('1.0.0')
  .build()
```

### Configuration Manager

```typescript
import { createConfigManager } from '@trailhead/config'

const manager = createConfigManager({
  name: 'app-config',
  sources: [
    { type: 'file', path: 'config.json', priority: 1 },
    { type: 'env', env: 'APP_', priority: 2 },
    { type: 'cli', prefix: '--', priority: 3 }
  ]
})

const stateResult = await manager.load()
if (stateResult.isErr()) {
  console.error(stateResult.error)
  process.exit(1)
}

const port = manager.get('port')
const host = manager.get('host')
```

### Configuration Watching

```typescript
const watcher = manager.watch((change) => {
  console.log(`Config changed: ${change.key}`)
  console.log(`Old value: ${change.oldValue}`)
  console.log(`New value: ${change.newValue}`)
})

// Later
watcher.stop()
```

---

## Testing Patterns

### High-ROI Testing Philosophy

**Test**:
- User interactions (command execution, prompts)
- Business logic (transformations, calculations)
- Integration (multiple components together)
- Error handling (edge cases)

**Don't Test**:
- Basic rendering ("renders without crashing")
- Props forwarding ("accepts className")
- Framework internals
- TypeScript types at runtime

### Command Testing

```typescript
import { describe, it, expect } from 'vitest'
import { runCommand, createTestContext } from '@trailhead/cli/testing'
import { myCommand } from './commands'

describe('myCommand', () => {
  it('should execute successfully', async () => {
    const context = createTestContext()
    const result = await runCommand(myCommand, { verbose: true }, context)

    expect(result.isOk()).toBe(true)
  })

  it('should handle errors', async () => {
    const context = createTestContext()
    const result = await runCommand(myCommand, { invalid: true }, context)

    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_OPTION')
  })
})
```

### Stateful Test Runner

For sequences of commands:

```typescript
import { createCommandTestRunner, runTestCommand } from '@trailhead/cli/testing'

const runner = createCommandTestRunner(myCommand)

await runTestCommand(runner, { action: 'init' })
await runTestCommand(runner, { action: 'build' })
await runTestCommand(runner, { action: 'deploy' })
```

### Test Context with Files

```typescript
import { createTestContextWithFiles } from '@trailhead/cli/testing'

const context = createTestContextWithFiles({
  'config.json': JSON.stringify({ name: 'test' }),
  'src/index.ts': 'console.log("hello")'
})

// Files exist in temporary directory
const result = await fs.readFile('config.json')
expect(result.isOk()).toBe(true)
```

### Testing Pure Functions

No mocks needed:

```typescript
describe('validateProjectName', () => {
  it('should accept valid names', () => {
    const result = validateProjectName('my-cli')
    expect(result.isOk()).toBe(true)
  })

  it('should reject uppercase', () => {
    const result = validateProjectName('My-CLI')
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().code).toBe('INVALID_NAME')
  })
})
```

---

## Common Gotchas & Pitfalls

### 1. Positional Arguments

**Gotcha**: Arguments are in `context.args`, NOT `options`.

```typescript
// ❌ Wrong
action: async (options, context) => {
  const projectName = options.name  // undefined!
}

// ✅ Correct
action: async (options, context) => {
  const projectName = context.args[0]
}
```

### 2. Try-Catch in Command Actions

**Gotcha**: Command actions should return `Result`, not throw.

```typescript
// ❌ Wrong (violates Result pattern)
action: async (options, context) => {
  if (!options.name) {
    throw new Error('Name required')
  }
  return ok(undefined)
}

// ✅ Correct
action: async (options, context) => {
  if (!options.name) {
    return err(createCoreError('ValidationError', 'NAME_REQUIRED', 'Name required'))
  }
  return ok(undefined)
}
```

**Exception**: Wrap entire action in try-catch ONLY to catch unexpected errors:

```typescript
action: async (options, context) => {
  try {
    // Your logic using Result types
    return ok(undefined)
  } catch (error) {
    // Catch unexpected errors only
    return err(createCoreError(
      'UnexpectedError',
      'COMMAND_FAILED',
      'Unexpected error',
      { cause: error }
    ))
  }
}
```

### 3. Zod refine() Then extend()

**Gotcha**: Can't use `.extend()` after `.refine()` (returns `ZodEffect`, not `ZodObject`).

```typescript
// ❌ Wrong
const schema = z.object({ name: z.string() })
  .refine(val => val.name.length > 0)
  .extend({ age: z.number() })  // Error!

// ✅ Correct
const baseSchema = z.object({
  name: z.string(),
  age: z.number()
})
const refinedSchema = baseSchema
  .refine(val => val.name.length > 0)
```

### 4. Importing from @trailhead/core

**Gotcha**: Named exports changed in re-exports.

```typescript
// ❌ Wrong
import { fromPromise } from '@trailhead/core'

// ✅ Correct
import { fromPromiseAsync } from '@trailhead/core'
```

Check the re-export naming:
- `fromPromise` → exported as `fromPromiseAsync`
- `fromThrowable` → exported as `fromThrowableAsync`
- `fromThrowableAsync` → exported as `fromThrowableAsyncFunc`

### 5. Result Short-Circuiting

**Gotcha**: `andThen` short-circuits on error.

```typescript
const result = await readFile('config.json')
  .andThen(content => parseJSON(content))
  .andThen(config => validateConfig(config))  // Won't run if parse fails
  .map(config => config.name)                 // Won't run if validate fails
```

### 6. Command Validation at Creation

**Gotcha**: Invalid commands throw at creation, not execution.

```typescript
// ❌ This throws immediately
const cmd = createCommand({
  name: 'test',
  options: [
    { flags: 'invalid-format' }  // Missing dashes
  ],
  action: async () => ok(undefined)
})

// ✅ Validate option format
{ flags: '-o, --output <dir>' }
```

### 7. Async in Vitest

**Gotcha**: Always `await` ResultAsync.

```typescript
// ❌ Wrong (doesn't await)
it('should work', () => {
  const result = fromPromiseAsync(fetch('/api'))
  expect(result.isOk()).toBe(true)  // result is Promise!
})

// ✅ Correct
it('should work', async () => {
  const result = await fromPromiseAsync(fetch('/api'))
  expect(result.isOk()).toBe(true)
})
```

### 8. File Path Resolution

**Gotcha**: Always use absolute paths or resolve relative to `context.projectRoot`.

```typescript
import { resolve } from 'path'

// ❌ Wrong (relative to cwd)
await fs.readFile('config.json')

// ✅ Correct
await fs.readFile(resolve(context.projectRoot, 'config.json'))
```

### 9. Result Unwrapping

**Gotcha**: Never use `_unsafeUnwrap()` in production code.

```typescript
// ❌ Wrong (throws if Err)
const value = result._unsafeUnwrap()

// ✅ Correct
if (result.isOk()) {
  const value = result.value
} else {
  console.error(result.error)
}

// ✅ Also correct (tests only)
expect(result._unsafeUnwrap()).toBe('expected')
```

### 10. tsup Tree-Shaking

**Gotcha**: Only ESM supports tree-shaking.

```typescript
// tsup.config.ts
export default {
  format: ['esm'],      // ✅ Tree-shakes
  // format: ['cjs'],   // ❌ No tree-shaking
  splitting: true,      // ✅ Better caching
}
```

---

## Best Practices

### 1. Prefer Composition Over Complexity

```typescript
// ❌ Avoid
class CommandBuilder {
  withOption() { /* ... */ }
  withValidation() { /* ... */ }
  build() { /* ... */ }
}

// ✅ Prefer
const cmd = createCommand({
  name: 'build',
  options: defineOptions().common(['output', 'verbose']).build(),
  action: executeWithValidation(validator, buildAction)
})
```

### 2. Use Error Factories

```typescript
// ❌ Avoid manual construction
return err({
  type: 'ValidationError',
  code: 'INVALID_INPUT',
  message: 'Invalid input',
  // Missing fields...
})

// ✅ Use factories
return err(createValidationError('INVALID_INPUT', 'Invalid input', {
  operation: 'validateInput',
  context: { input: rawInput }
}))
```

### 3. Test Business Logic, Not Framework

```typescript
// ❌ Low-ROI test
it('should create command', () => {
  const cmd = createCommand({ name: 'test', action: async () => ok(undefined) })
  expect(cmd.name).toBe('test')
})

// ✅ High-ROI test
it('should validate project name correctly', () => {
  expect(validateProjectName('my-cli').isOk()).toBe(true)
  expect(validateProjectName('My-CLI').isErr()).toBe(true)
})
```

### 4. Explicit Error Handling

```typescript
// ❌ Silent failure
const config = await readConfig()
if (config.isErr()) return ok(undefined)  // Swallows error

// ✅ Propagate errors
const config = await readConfig()
if (config.isErr()) return config  // Propagates error up
```

### 5. Leverage Type Inference

```typescript
// ❌ Duplicate types
const schema = z.object({ name: z.string() })
interface Config {
  name: string
}

// ✅ Infer types
const schema = z.object({ name: z.string() })
type Config = z.infer<typeof schema>
```

### 6. Use Subpath Exports

```typescript
// ❌ Large bundle
import { createCommand, fs, ok, err } from '@trailhead/cli'

// ✅ Tree-shakeable
import { createCommand } from '@trailhead/cli/command'
import { fs } from '@trailhead/fs'
import { ok, err } from '@trailhead/core'
```

### 7. Consistent Error Codes

Use UPPER_SNAKE_CASE for error codes:

```typescript
// ✅ Consistent naming
const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const
```

### 8. Helpful Error Messages

```typescript
// ❌ Vague
return err(createCoreError('Error', 'ERR', 'Invalid input'))

// ✅ Helpful
return err(createCoreError(
  'ValidationError',
  'INVALID_PROJECT_NAME',
  'Project name must be lowercase with hyphens only',
  {
    operation: 'validateProjectName',
    suggestion: 'Try: my-awesome-cli',
    context: { provided: userInput }
  }
))
```

---

## Real-World Examples

### Example 1: File Transformation Command

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok, err, pipe } from '@trailhead/core'
import { resolve } from 'path'

interface TransformOptions {
  readonly input: string
  readonly output: string
  readonly format?: 'json' | 'yaml'
  readonly verbose?: boolean
}

export const transformCommand = createCommand<TransformOptions>({
  name: 'transform',
  description: 'Transform a configuration file',
  arguments: '<input> <output>',
  options: [
    {
      flags: '-f, --format <format>',
      description: 'Output format',
      type: 'string',
      default: 'json'
    },
    {
      flags: '-v, --verbose',
      description: 'Verbose output',
      type: 'boolean'
    }
  ],
  examples: [
    'transform config.json config.yaml --format yaml',
    'transform input.yaml output.json'
  ],
  action: async (options, context) => {
    const inputPath = resolve(context.projectRoot, context.args[0])
    const outputPath = resolve(context.projectRoot, context.args[1])

    // Read input file
    const contentResult = await context.fs.readFile(inputPath)
    if (contentResult.isErr()) return contentResult

    // Parse based on format
    const parseResult = options.format === 'json'
      ? await context.fs.readJson(inputPath)
      : parseYAML(contentResult.value)

    if (parseResult.isErr()) return parseResult

    // Transform data
    const transformed = transformData(parseResult.value)

    // Write output
    const writeResult = options.format === 'json'
      ? await context.fs.writeJson(outputPath, transformed, { spaces: 2 })
      : await context.fs.writeFile(outputPath, stringifyYAML(transformed))

    if (writeResult.isErr()) return writeResult

    context.logger.success(`Transformed ${inputPath} → ${outputPath}`)
    return ok(undefined)
  }
})
```

### Example 2: Interactive CLI Setup

```typescript
import { createCommand } from '@trailhead/cli/command'
import { executeInteractive } from '@trailhead/cli/command'
import inquirer from 'inquirer'

interface SetupOptions {
  readonly interactive?: boolean
  readonly name?: string
  readonly description?: string
}

export const setupCommand = createCommand<SetupOptions>({
  name: 'setup',
  description: 'Set up a new project',
  options: [
    {
      flags: '-i, --interactive',
      description: 'Interactive mode',
      type: 'boolean',
      default: true
    },
    {
      flags: '-n, --name <name>',
      description: 'Project name',
      type: 'string'
    },
    {
      flags: '-d, --description <desc>',
      description: 'Project description',
      type: 'string'
    }
  ],
  action: async (options, context) => {
    return executeInteractive(
      options,
      async () => {
        // Prompt for missing options
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            when: !options.name,
            validate: (input) => input.length > 0 || 'Name required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
            when: !options.description
          }
        ])
        return answers
      },
      async (finalOptions) => {
        // Use merged options
        context.logger.info(`Creating project: ${finalOptions.name}`)
        context.logger.info(`Description: ${finalOptions.description}`)

        // Setup logic...

        return ok(undefined)
      },
      context
    )
  }
})
```

### Example 3: Multi-Phase Workflow

```typescript
import { createCommand, executeWithPhases } from '@trailhead/cli/command'

export const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy the application',
  action: async (options, context) => {
    return executeWithPhases(
      { environment: 'production' },
      [
        {
          name: 'validate',
          execute: async (data, ctx) => {
            ctx.logger.info('Validating configuration...')
            const configResult = await ctx.fs.readJson('deploy.json')
            if (configResult.isErr()) return configResult
            return ok({ ...data, config: configResult.value })
          }
        },
        {
          name: 'build',
          execute: async (data, ctx) => {
            ctx.logger.info('Building application...')
            // Build logic
            return ok({ ...data, built: true })
          }
        },
        {
          name: 'upload',
          execute: async (data, ctx) => {
            ctx.logger.info('Uploading to server...')
            // Upload logic
            return ok({ ...data, uploaded: true })
          }
        },
        {
          name: 'verify',
          execute: async (data, ctx) => {
            ctx.logger.info('Verifying deployment...')
            // Verification logic
            return ok(data)
          }
        }
      ],
      context
    )
  }
})
```

---

## FAQ for LLMs

### Q: When should I use Result types vs throwing?

**A**: Always use Result types in user-facing code. Only throw for:
- Programming errors (invariant violations)
- Library initialization failures
- Truly unrecoverable errors

### Q: How do I handle nested Results?

**A**: Use `andThen` (flat-map) for chaining operations that return Results:

```typescript
const result = await readFile('config.json')
  .andThen(content => parseJSON(content))
  .andThen(config => validateConfig(config))
```

### Q: Should I test error cases?

**A**: Yes! High-ROI tests include error handling:

```typescript
it('should handle missing file', async () => {
  const result = await fs.readFile('nonexistent.txt')
  expect(result.isErr()).toBe(true)
  expect(result._unsafeUnwrapErr().code).toBe('ENOENT')
})
```

### Q: How do I add custom options to a command?

**A**: Use `defineOptions()` for composition:

```typescript
const options = defineOptions()
  .common(['output', 'verbose'])
  .custom([
    { flags: '--my-option <value>', description: 'Custom option', type: 'string' }
  ])
  .build()
```

### Q: What if I need classes?

**A**: Trailhead avoids classes in public APIs. Use:
- Factory functions for creation
- Plain objects for data
- Higher-order functions for behavior

### Q: How do I debug Result types?

**A**: Log errors explicitly:

```typescript
const result = await operation()
if (result.isErr()) {
  console.error('Operation failed:', {
    code: result.error.code,
    message: result.error.message,
    context: result.error.context
  })
}
```

### Q: Can I use async/await with Result types?

**A**: Yes! Use `ResultAsync` or await Results:

```typescript
// ResultAsync automatically
const result = await fromPromiseAsync(fetch('/api'))

// Manual await
const fileResult = await fs.readFile('config.json')
if (fileResult.isOk()) {
  const config = fileResult.value
}
```

### Q: How do I handle multiple async operations?

**A**: Use `Promise.all` with Results:

```typescript
const [fileResult, configResult] = await Promise.all([
  fs.readFile('data.json'),
  fs.readJson('config.json')
])

if (fileResult.isErr()) return fileResult
if (configResult.isErr()) return configResult

// Both succeeded
const file = fileResult.value
const config = configResult.value
```

### Q: What's the difference between `map` and `andThen`?

**A**:
- `map`: Transform the success value (`T → U`)
- `andThen`: Chain operations that return Result (`T → Result<U, E>`)

```typescript
result
  .map(x => x * 2)                    // Transform value
  .andThen(x => divide(x, 2))         // Chain Result-returning operation
```

### Q: How do I add documentation to my CLI?

**A**: Use the `examples` field and descriptive options:

```typescript
createCommand({
  name: 'deploy',
  description: 'Deploy application to production',
  options: [
    {
      flags: '-e, --environment <env>',
      description: 'Target environment (staging, production)',
      type: 'string',
      default: 'staging'
    }
  ],
  examples: [
    'deploy --environment production',
    'deploy -e staging'
  ],
  action: async () => ok(undefined)
})
```

### Q: Should I use `workspace:*` or specific versions?

**A**: Use `workspace:*` for internal dependencies in monorepo:

```json
{
  "dependencies": {
    "@trailhead/core": "workspace:*",
    "@trailhead/fs": "workspace:*",
    "zod": "^3.22.0"
  }
}
```

---

## Key Architectural Files Reference

For deeper exploration, these are the key files to examine:

**Core Package**:
- `packages/core/src/errors/types.ts` - CoreError interface
- `packages/core/src/errors/factory.ts` - Error factories
- `packages/core/src/functional/composition.ts` - Composition utilities
- `packages/core/src/functional/async.ts` - Promise/Result conversion

**CLI Package**:
- `packages/cli/src/command/types.ts` - Command interfaces
- `packages/cli/src/command/base.ts` - createCommand
- `packages/cli/src/command/builders.ts` - commonOptions, defineOptions
- `packages/cli/src/command/patterns.ts` - executeWithPhases, executeWithDryRun
- `packages/cli/src/testing/runner.ts` - Test utilities

**FileSystem Package**:
- `packages/fs/src/types.ts` - FileSystem operation types
- `packages/fs/src/core.ts` - Operation implementations
- `packages/fs/src/errors.ts` - FileSystemError mapping

**Config Package**:
- `packages/config/src/core/index.ts` - Schema creation
- `packages/config/src/core/manager.ts` - ConfigManager

**Real-World Usage**:
- `packages/create-cli/src/commands/generate.ts` - Complete command example

---

## Summary

Trailhead is a **functional-first CLI framework** that prioritizes:

1. **Explicit error handling** via Result types
2. **Pure functions** and immutability
3. **Type safety** through strict TypeScript
4. **High-ROI testing** of business logic
5. **Developer experience** through boilerplate reduction

When working with Trailhead, remember:
- Never throw, always return `Result`
- Use error factories, not manual construction
- Arguments are in `context.args`, not `options`
- Test business logic, not framework internals
- Leverage subpath exports for tree-shaking
- Compose functions instead of building class hierarchies

For questions or issues, refer to:
- [CLAUDE.md](./CLAUDE.md) - Project workflow and principles
- [Monorepo structure](./README.md) - Package organization
- [Testing philosophy](./docs/reference/documentation-standards.md) - High-ROI testing guidelines
