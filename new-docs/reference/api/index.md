# API Reference

Complete API documentation for the Trailhead CLI framework, organized by capability.

## Command Building

Core APIs for creating CLI commands and applications.

### createCLI

Creates a new CLI application using Commander.js.

```typescript
import { createCLI } from '@esteban-url/cli'

const cli = createCLI({
  name: string              // CLI name
  version: string           // Version string
  description?: string      // CLI description
})

// Returns a Commander instance
// Register commands using Commander's API
cli.command('mycommand')
  .description('My command description')
  .action(async () => {
    // Command implementation
  })

cli.parse()                // Parse command line arguments
```

### createCommand

Creates a new command with typed options.

```typescript
import { createCommand } from '@esteban-url/cli/command'
import type { CommandOptions } from '@esteban-url/cli/command'

interface MyCommandOptions extends CommandOptions {
  verbose?: boolean
  config?: string
  limit?: number
}

const command = createCommand<MyCommandOptions>({
  name: string              // Command name
  description?: string      // Command description
  arguments?: string        // Positional arguments (e.g., '<file>')
  options?: Array<{         // Command options/flags
    flags: string           // Flag definition (e.g., '-v, --verbose')
    description: string     // Option description
    type?: 'boolean' | 'string' | 'number'
  }>
  action: (options: MyCommandOptions, context: CommandContext) => Promise<Result<any, Error>>
})

// Example
export const parseCommand = createCommand<ParseOptions>({
  name: 'parse',
  description: 'Parse a CSV file',
  arguments: '<file>',
  options: [
    {
      flags: '-j, --json',
      description: 'Output as JSON',
      type: 'boolean'
    },
    {
      flags: '-l, --limit <number>',
      description: 'Limit rows',
      type: 'number'
    }
  ],
  action: async (options, context) => {
    const { logger, args } = context
    const [file] = args
    // Implementation
    return ok(undefined)
  }
})
```

## Error Handling

Result type system for explicit error handling.

### Result<T, E>

Container for success or error values.

```typescript
import { Result, ok, err } from '@esteban-url/core'

// Creating Results
const success: Result<string, Error> = ok('success')
const failure: Result<string, Error> = err(new Error('failed'))

// Checking Results
if (result.isOk()) {
  console.log(result.value)    // T
} else {
  console.log(result.error)    // E
}

// Methods
result.isOk(): boolean         // Check if success
result.isError(): boolean      // Check if error
result.map(fn): Result         // Transform success value
result.flatMap(fn): Result     // Chain Result operations
result.unwrapOr(default): T    // Get value or default
result.match({ ok, err })      // Pattern matching
```

### Common Result Patterns

```typescript
// Chaining operations
const result = await readFile('data.json')
  .map((content) => JSON.parse(content))
  .map((data) => data.users)
  .flatMap((users) => validateUsers(users))

// Error propagation
async function processFile(path: string): Promise<Result<Data, Error>> {
  const readResult = await readFile(path)
  if (readResult.isError()) {
    return readResult // Propagate error
  }

  // Process readResult.value
  return ok(processedData)
}
```

## File Operations

Type-safe file system operations.

### readFile

Read file contents.

```typescript
import { readFile } from '@esteban-url/fs'

const result = await readFile(path: string, encoding?: string)
// Returns: Promise<Result<string, Error>>
```

### writeFile

Write content to file.

```typescript
import { writeFile } from '@esteban-url/fs'

const result = await writeFile(
  path: string,
  content: string | Buffer,
  options?: WriteOptions
)
// Returns: Promise<Result<void, Error>>
```

### exists

Check if path exists.

```typescript
import { exists } from '@esteban-url/fs'

const result = await exists(path: string)
// Returns: Promise<Result<boolean, Error>>
```

### mkdir

Create directory.

```typescript
import { mkdir } from '@esteban-url/fs'

const result = await mkdir(path: string, options?: { recursive?: boolean })
// Returns: Promise<Result<void, Error>>
```

### readdir

List directory contents.

```typescript
import { readdir } from '@esteban-url/fs'

const result = await readdir(path: string)
// Returns: Promise<Result<string[], Error>>
```

## User Interaction

Interactive prompts powered by Inquirer. Note: These prompts can throw errors, so wrap them for Result-based error handling.

### Prompts Overview

Prompts throw errors on cancellation or failure. Use a helper to convert to Result types:

```typescript
import { input, confirm, select } from '@esteban-url/cli/prompts'
import { ok, err, Result } from '@esteban-url/core'

// Helper to wrap prompts in Result types
async function safePrompt<T>(promptFn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promptFn()
    return ok(value)
  } catch (error) {
    return err(error as Error)
  }
}
```

### input

Text input prompt.

```typescript
import { input } from '@esteban-url/cli/prompts'

// Basic usage (can throw)
const name = await input({
  message: string,          // Prompt message
  default?: string,         // Default value
  validate?: (value: string) => boolean | string,
})

// Safe usage with Result
const result = await safePrompt(() =>
  input({ message: 'Enter name:' })
)
if (result.isError()) {
  // Handle cancellation or error
}
```

### confirm

Yes/no confirmation.

```typescript
import { confirm } from '@esteban-url/cli/prompts'

// Basic usage (can throw)
const answer = await confirm({
  message: string,          // Question to ask
  default?: boolean,        // Default value
})

// Safe usage with Result
const result = await safePrompt(() =>
  confirm({ message: 'Continue?' })
)
```

### select

Select from list.

```typescript
import { select } from '@esteban-url/cli/prompts'

// Basic usage (can throw)
const choice = await select({
  message: string,
  choices: Array<{
    name: string // Display text
    value: T // Return value
    disabled?: boolean
  }>,
})

// Safe usage with Result
const result = await safePrompt(() =>
  select({
    message: 'Pick a color',
    choices: [
      { name: 'Red', value: 'red' },
      { name: 'Blue', value: 'blue' },
    ],
  })
)
```

### checkbox

Multiple selection.

```typescript
import { checkbox } from '@esteban-url/cli/prompts'

// Basic usage (can throw)
const choices = await checkbox({
  message: string,
  choices: Array<{
    name: string
    value: T
    checked?: boolean
  }>,
})

// Safe usage with Result
const result = await safePrompt(() =>
  checkbox({
    message: 'Select features',
    choices: [
      { name: 'TypeScript', value: 'ts' },
      { name: 'ESLint', value: 'lint' },
    ],
  })
)
```

## Progress & Output

Visual feedback using cli-progress.

### Progress Bars

Use cli-progress directly for progress indication.

```typescript
import { SingleBar, MultiBar, Presets } from '@esteban-url/cli/progress'

// Single progress bar
const progressBar = new SingleBar(
  {
    format: 'Progress |{bar}| {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
  },
  Presets.shades_classic
)

progressBar.start(100, 0) // Start with total 100, current 0
progressBar.update(50) // Update to 50%
progressBar.stop() // Complete

// Multiple progress bars
const multiBar = new MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
  },
  Presets.shades_grey
)

const bar1 = multiBar.create(100, 0)
const bar2 = multiBar.create(200, 0)

bar1.update(50)
bar2.update(100)

multiBar.stop()
```

### Progress Tracker

Enhanced progress tracking utilities.

```typescript
import { createProgressTracker, updateProgress } from '@esteban-url/cli/progress'

// Create a tracker
const tracker = createProgressTracker({
  total: 100,
  showETA: true,
})

// Update progress
updateProgress(tracker, 10) // Increment by 10
updateProgress(tracker, 20) // Increment by 20

// Access state
console.log(tracker.getState())
// { current: 30, total: 100, percentage: 30, ... }
```

### Output Formatting

Use chalk for colored output.

```typescript
import { chalk } from '@esteban-url/core/utils'

// Available styles
console.log(chalk.green('Success'))
console.log(chalk.red('Error'))
console.log(chalk.yellow('Warning'))
console.log(chalk.blue('Info'))
console.log(chalk.gray('Muted'))
console.log(chalk.bold('Bold'))
console.log(chalk.dim('Dim'))
console.log(chalk.italic('Italic'))
console.log(chalk.underline('Underline'))

// Combine styles
console.log(chalk.bold.green('Bold green'))
console.log(chalk.red.underline('Red underlined'))
```

## Logging

Structured logging with levels.

### Logger Interface

Available on command context. By default, this is the console object.

```typescript
interface Logger {
  debug(...args: any[]): void // Debug messages
  info(...args: any[]): void // Information
  warn(...args: any[]): void // Warnings
  error(...args: any[]): void // Errors
}

// In command action
action: async (options, context) => {
  const { logger } = context

  logger.debug('Debug info')
  logger.info('Processing...')
  logger.info('✓ Complete') // Use info for success
  logger.error('✗ Failed')
  logger.warn('⚠️  Warning')
}

// When registering with Commander
cli.command('mycommand').action(async (...args) => {
  const result = await myCommand.execute(options, {
    logger: console, // Default logger
    args: args.slice(0, -1),
  })
})
```

## Testing Utilities

Test helpers for CLI commands.

### createTestContext

Create a test context for command execution.

```typescript
import { createTestContext } from '@esteban-url/cli/testing'

const context = createTestContext()

// Execute command
const result = await myCommand.execute(options, context)

// Access captured logs
console.log(context.logs) // Array of logged messages
console.log(context.errors) // Array of error messages
console.log(context.warnings) // Array of warnings
```

### createTestContextWithFiles

Create a test context with virtual file system.

```typescript
import { createTestContextWithFiles } from '@esteban-url/cli/testing'

const context = await createTestContextWithFiles({
  'data/test.json': JSON.stringify({ test: true }),
  'config.yml': 'apiUrl: http://localhost:3000',
  'empty.txt': '',
})

// The context includes a temp directory with these files
// Access the temp directory path
console.log(context.cwd) // e.g., /tmp/test-xyz/

// Use in command
const result = await myCommand.execute(options, context)
```

### runCommand

Run a command with test utilities.

```typescript
import { runCommand } from '@esteban-url/cli/testing'

// Simple execution
const result = await runCommand(myCommand, {
  args: ['file.csv'],
  options: { verbose: true },
})

// With custom context
const result = await runCommand(myCommand, {
  args: ['file.csv'],
  options: { verbose: true },
  context: {
    logger: customLogger,
    env: { NODE_ENV: 'test' },
  },
})
```

### Testing Example

```typescript
import { describe, it, expect } from 'vitest'
import { createTestContext } from '@esteban-url/cli/testing'
import { myCommand } from '../src/commands/my-command.js'

describe('my command', () => {
  it('should process files', async () => {
    const context = createTestContext()

    const result = await myCommand.execute({ verbose: true }, { ...context, args: ['test.txt'] })

    expect(result.isOk()).toBe(true)
    expect(context.logs).toContain('Processing test.txt')
  })
})
```

## Configuration Management

Type-safe configuration with multiple sources.

### createConfigManager

Create a configuration manager with schema validation and multiple sources.

```typescript
import { createConfigManager, defineSchema } from '@esteban-url/config'
import { string, number, boolean, object } from '@esteban-url/config'

// Define schema using built-in builders
const configSchema = defineSchema({
  apiUrl: string().url().required(),
  timeout: number().default(5000),
  retries: number().min(0).max(10).default(3),
  features: object({
    debug: boolean().default(false),
    cache: boolean().default(true),
  }),
})

// Create config manager
const configManager = createConfigManager({
  schema: configSchema,
  sources: [
    { type: 'file', path: './config.json' }, // JSON/YAML files
    { type: 'env', prefix: 'APP_' }, // Environment variables
    { type: 'cli' }, // CLI arguments
  ],
})

// Load configuration
const loadResult = await configManager.load()
if (loadResult.isError()) {
  console.error('Config error:', loadResult.error.message)
  process.exit(1)
}

const config = loadResult.value
// Type-safe access
console.log(config.apiUrl) // string
console.log(config.timeout) // number
console.log(config.features.debug) // boolean
```

### Schema Builders

Built-in type builders for configuration schemas.

```typescript
import { string, number, boolean, object, array } from '@esteban-url/config'

// String with validations
const urlConfig = string().url().required().default('http://localhost:3000')

// Number with constraints
const portConfig = number().min(1).max(65535).default(3000)

// Boolean flags
const debugConfig = boolean().default(false)

// Nested objects
const serverConfig = object({
  host: string().required(),
  port: number().default(3000),
  ssl: boolean().default(false),
})

// Arrays
const allowedOrigins = array(string().url()).default(['http://localhost:3000'])
```

### Configuration Sources

```typescript
// File source (JSON/YAML)
{ type: 'file', path: './config.json' }
{ type: 'file', path: './config.yml' }

// Environment variables
{ type: 'env', prefix: 'MY_APP_' }
// Maps MY_APP_API_URL to apiUrl

// Command line arguments
{ type: 'cli' }
// Maps --api-url to apiUrl

// Priority: CLI > ENV > File (last source wins)
```

### Watch for Changes

Monitor configuration files for changes.

```typescript
// Watch for changes
configManager.watch((change) => {
  console.log(`Config updated: ${change.path} = ${change.value}`)
})

// Stop watching
configManager.unwatch()
```

## Type Definitions

Common types used throughout the framework.

### Command Types

```typescript
interface CommandOptions {
  // Base interface for command options
  // Extend this for your command's options
}

interface CommandContext {
  logger: Logger // Logging interface (console by default)
  args: string[] // Positional arguments
}

interface Command<T extends CommandOptions = CommandOptions> {
  name: string
  description?: string
  arguments?: string // e.g., '<file>' or '[options...]'
  options?: Array<{
    flags: string // e.g., '-v, --verbose'
    description: string
    type?: 'boolean' | 'string' | 'number'
  }>
  action: (options: T, context: CommandContext) => Promise<Result<any, Error>>
}

// Usage with createCommand
const command = createCommand<MyOptions>({
  // Command definition
})
```

### Result Type

```typescript
type Result<T, E> = Ok<T> | Err<E>

interface Ok<T> {
  isOk(): true
  isError(): false
  value: T
  map<U>(fn: (value: T) => U): Result<U, E>
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>
  unwrapOr(defaultValue: T): T
  match<U>(patterns: { ok: (value: T) => U; err: (error: E) => U }): U
}

interface Err<E> {
  isOk(): false
  isError(): true
  error: E
  map<U>(fn: (value: T) => U): Result<U, E>
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>
  unwrapOr<T>(defaultValue: T): T
  match<U>(patterns: { ok: (value: T) => U; err: (error: E) => U }): U
}
```

### Logger Interface

```typescript
interface Logger {
  debug(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
}
```

## Package Exports

Complete list of package exports and their import paths.

### @esteban-url/cli

Main exports:

```typescript
import { createCLI } from '@esteban-url/cli'
```

Subpath exports:

```typescript
// Command creation
import { createCommand } from '@esteban-url/cli/command'
import type { CommandOptions, CommandContext } from '@esteban-url/cli/command'

// Interactive prompts (Inquirer wrappers)
import { input, confirm, select, checkbox } from '@esteban-url/cli/prompts'

// Progress indicators
import { SingleBar, MultiBar, Presets } from '@esteban-url/cli/progress'
import { createProgressTracker, updateProgress } from '@esteban-url/cli/progress'

// Testing utilities
import { createTestContext, createTestContextWithFiles, runCommand } from '@esteban-url/cli/testing'
```

### @esteban-url/core

Result types and utilities:

```typescript
import { Result, ok, err } from '@esteban-url/core'
import { fromThrowable, fromThrowableAsync } from '@esteban-url/core'
```

Color utilities:

```typescript
import { chalk } from '@esteban-url/core/utils'
```

### @esteban-url/fs

File system operations with Result types:

```typescript
import { readFile, writeFile, exists, mkdir, readdir, unlink, rmdir } from '@esteban-url/fs'
```

### @esteban-url/config

Configuration management:

```typescript
import {
  createConfigManager,
  defineSchema,
  string,
  number,
  boolean,
  object,
  array,
} from '@esteban-url/config'
```
