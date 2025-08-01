# Common Workflows

Task-oriented guides for solving common problems with the Trailhead CLI framework.

## Adding a New Command

To add a new command to your CLI:

1. Create a new file in `src/commands/`:

```typescript
// src/commands/greet.ts
import { createCommand } from '@esteban-url/cli/command'
import { ok } from '@esteban-url/core'
import type { CommandOptions } from '@esteban-url/cli/command'

// Define your command options interface
interface GreetOptions extends CommandOptions {
  name?: string
  shout?: boolean
}

export const greetCommand = createCommand<GreetOptions>({
  name: 'greet',
  description: 'Greet someone by name',
  arguments: '<name>',  // Required positional argument
  
  options: [
    {
      flags: '--shout',
      description: 'Shout the greeting',
      type: 'boolean'
    }
  ],
  
  action: async (options, context) => {
    const { logger } = context
    // Arguments are passed through context
    const name = context.args[0] || 'World'
    const greeting = `Hello, ${name}!`
    
    logger.info(options.shout ? greeting.toUpperCase() : greeting)
    return ok(undefined)
  }
})
```

2. Register the command with your CLI using Commander:

```typescript
// src/index.ts
import { createCLI } from '@esteban-url/cli'
import { greetCommand } from './commands/greet.js'

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI tool'
})

// Register commands
cli.command(greetCommand.name)
  .description(greetCommand.description)
  .arguments(greetCommand.arguments || '')
  .action(async (...args) => {
    const result = await greetCommand.execute(args[args.length - 1], {
      args: args.slice(0, -1),
      logger: console
    })
    if (result.isErr()) {
      console.error(result.error.message)
      process.exit(1)
    }
  })

cli.parse()
```

## Working with File Operations

All file operations return Result types for explicit error handling:

```typescript
import { readFile, writeFile, exists } from '@esteban-url/fs'

// Check if file exists
const existsResult = await exists('data.json')
if (existsResult.isOk() && existsResult.value) {
  // File exists
}

// Read a file
const readResult = await readFile('data.json', 'utf-8')
if (readResult.isError()) {
  logger.error(`Failed to read: ${readResult.error.message}`)
  return readResult
}

const data = JSON.parse(readResult.value)

// Write a file
const writeResult = await writeFile('output.json', JSON.stringify(data, null, 2))
if (writeResult.isError()) {
  logger.error(`Failed to write: ${writeResult.error.message}`)
  return writeResult
}
```

## Adding Interactive Prompts

Use Inquirer prompts for user interaction. Note: These prompts can throw errors, so wrap them in try-catch to convert to Result types:

```typescript
import { input, confirm, select } from '@esteban-url/cli/prompts'
import { ok, err } from '@esteban-url/core'

// Function to safely wrap prompts in Result types
async function safePrompt<T>(promptFn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await promptFn()
    return ok(value)
  } catch (error) {
    return err(error as Error)
  }
}

// Text input
const nameResult = await safePrompt(() => 
  input({
    message: 'What is your name?',
    default: 'Anonymous',
  })
)

// Confirmation
const confirmResult = await safePrompt(() =>
  confirm({
    message: 'Continue with operation?',
    default: true,
  })
)

// Selection from list
const colorResult = await safePrompt(() =>
  select({
    message: 'Pick your favorite color',
    choices: [
      { name: 'Red', value: 'red' },
      { name: 'Green', value: 'green' },
      { name: 'Blue', value: 'blue' },
    ],
  })
)

// Check for errors
if (nameResult.isError()) {
  return nameResult
}

// Or use the built-in helper for confirmations
import { createConfirmationPrompt } from '@esteban-url/cli/prompts'

const confirmDelete = createConfirmationPrompt(
  'Delete all files?',
  ['Remove all temporary files', 'This cannot be undone'],
  false // default to no
)

const shouldDelete = await confirmDelete()
```

## Handling Configuration

Use the built-in configuration management from `@esteban-url/config`:

```typescript
// src/lib/config.ts
import { createConfigManager, defineSchema } from '@esteban-url/config'
import { string, number, boolean, object } from '@esteban-url/config'

// Define your schema using the built-in builders
const configSchema = defineSchema({
  apiUrl: string().url().required(),
  timeout: number().default(5000),
  retries: number().min(0).max(10).default(3),
  features: object({
    debug: boolean().default(false),
    cache: boolean().default(true),
  }),
})

// Create a config manager
export const configManager = createConfigManager({
  schema: configSchema,
  sources: [
    { type: 'file', path: './config.json' },
    { type: 'env', prefix: 'APP_' },
    { type: 'cli' }
  ]
})

// Load configuration in your command
import { configManager } from './lib/config.js'

const loadConfigResult = await configManager.load()
if (loadConfigResult.isError()) {
  logger.error(`Config error: ${loadConfigResult.error.message}`)
  return loadConfigResult
}

const config = loadConfigResult.value

// Access validated config
logger.info(`API URL: ${config.apiUrl}`)
logger.info(`Timeout: ${config.timeout}ms`)

// Watch for config changes
configManager.watch((change) => {
  logger.info(`Config updated: ${change.path} = ${change.value}`)
})
```

## Testing Your Commands

Write tests using the testing utilities:

```typescript
// src/__tests__/commands/greet.test.ts
import { describe, it, expect } from 'vitest'
import { runCommand, createTestContext } from '@esteban-url/cli/testing'
import { greetCommand } from '../commands/greet.js'

describe('greet command', () => {
  it('should greet by name', async () => {
    const context = createTestContext()
    
    const result = await greetCommand.execute(
      { verbose: false },
      { ...context, args: ['Alice'] }
    )
    
    expect(result.isOk()).toBe(true)
    expect(context.logs).toContain('Hello, Alice!')
  })

  it('should shout when flag is set', async () => {
    const context = createTestContext()
    
    const result = await greetCommand.execute(
      { shout: true },
      { ...context, args: ['Bob'] }
    )
    
    expect(result.isOk()).toBe(true)
    expect(context.logs).toContain('HELLO, BOB!')
  })
})

// Test with file operations
import { createTestContextWithFiles } from '@esteban-url/cli/testing'

it('should process files', async () => {
  const context = await createTestContextWithFiles({
    'test.json': JSON.stringify({ name: 'test' })
  })
  
  const result = await myCommand.execute({}, context)
  expect(result.isOk()).toBe(true)
})
```

## Error Handling Patterns

### Chain Result Operations

```typescript
import { Result, ok, err } from '@esteban-url/core'
import { fromThrowableAsync } from '@esteban-url/core'

// Helper to safely parse JSON
function safeJsonParse<T = any>(json: string): Result<T, Error> {
  try {
    return ok(JSON.parse(json))
  } catch (error) {
    return err(new Error(`Invalid JSON: ${error.message}`))
  }
}

async function processData(filePath: string): Promise<Result<string, Error>> {
  // Read file
  const readResult = await readFile(filePath, 'utf-8')
  if (readResult.isError()) {
    return readResult
  }

  // Parse JSON safely
  const parseResult = safeJsonParse(readResult.value)
  if (parseResult.isError()) {
    return parseResult
  }

  // Transform data
  const data = parseResult.value
  const transformed = data.map(item => ({
    ...item,
    processed: true,
  }))
  
  return ok(JSON.stringify(transformed, null, 2))
}

// Or use the async utilities
const processDataAsync = fromThrowableAsync(async (filePath: string) => {
  const content = await fs.promises.readFile(filePath, 'utf-8')
  const data = JSON.parse(content)
  const transformed = data.map(item => ({ ...item, processed: true }))
  return JSON.stringify(transformed, null, 2)
})

// Usage
const result = await processDataAsync('data.json')
if (result.isError()) {
  logger.error(`Processing failed: ${result.error.message}`)
}
```

### Map and FlatMap Results

```typescript
// Transform success values
const upperResult = readResult.map(text => text.toUpperCase())

// Chain operations that return Results
const finalResult = await readResult.flatMap(async (text) => {
  const processed = processText(text)
  return writeFile('output.txt', processed)
})
```

## Building Robust CLIs

### Add Progress Indicators

```typescript
import { createProgressTracker, updateProgress } from '@esteban-url/cli/progress'
import { SingleBar, Presets } from '@esteban-url/cli/progress'

// Simple progress bar
const progressBar = new SingleBar({
  format: 'Progress |{bar}| {percentage}% | {value}/{total}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
}, Presets.shades_classic)

progressBar.start(100, 0)
for (let i = 0; i <= 100; i++) {
  progressBar.update(i)
  await new Promise(resolve => setTimeout(resolve, 50))
}
progressBar.stop()

// Or use the enhanced progress tracker
const tracker = createProgressTracker({
  total: files.length,
  showETA: true,
})

for (const file of files) {
  await processFile(file)
  updateProgress(tracker, 1)
}
```

### Handle Signals Gracefully

```typescript
// In your command action
const cleanup = () => {
  logger.info('Cleaning up...')
  // Perform cleanup
}

process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})

process.on('SIGTERM', () => {
  cleanup()
  process.exit(0)
})
```

### Add Debug Logging

```typescript
const debug = flags.verbose || process.env.DEBUG

if (debug) {
  logger.debug('Processing options:', options)
  logger.debug('File count:', files.length)
}
```

## Distributing Your CLI

### Prepare for Publishing

1. Update `package.json`:

```json
{
  "name": "my-awesome-cli",
  "version": "1.0.0",
  "description": "My awesome CLI tool",
  "bin": {
    "my-cli": "./bin/cli.js"
  },
  "files": [
    "dist",
    "bin"
  ],
  "keywords": ["cli", "tool", "awesome"],
  "engines": {
    "node": ">=16"
  }
}
```

2. Build and test:

```bash
pnpm build
pnpm test
npm link # Test locally
my-cli --help
```

3. Publish:

```bash
npm publish
```

### Create Standalone Executables

Use pkg or similar tools:

```bash
# Install pkg
npm install -g pkg

# Build executables
pkg . --targets node16-linux-x64,node16-macos-x64,node16-win-x64

# Output files:
# my-cli-linux
# my-cli-macos
# my-cli-win.exe
```

## Common Patterns

### Batch Processing

```typescript
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<Result<void, Error>>,
  options: { concurrency: number } = { concurrency: 5 }
): Promise<Result<void, Error>> {
  const errors: Error[] = []
  
  // Process in chunks
  for (let i = 0; i < items.length; i += options.concurrency) {
    const chunk = items.slice(i, i + options.concurrency)
    const results = await Promise.all(chunk.map(processor))
    
    // Collect errors
    results.forEach((result, index) => {
      if (result.isError()) {
        errors.push(new Error(`Item ${i + index}: ${result.error.message}`))
      }
    })
  }
  
  if (errors.length > 0) {
    return err(new Error(`${errors.length} items failed: ${errors[0].message}`))
  }
  
  return ok(undefined)
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  operation: () => Promise<Result<T, Error>>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<Result<T, Error>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await operation()
    
    if (result.isOk()) {
      return result
    }
    
    if (attempt < maxRetries) {
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  
  return err(new Error(`Failed after ${maxRetries} attempts`))
}
```

## Next Steps

- Explore the [API Reference](../reference/api/) for detailed documentation
- Read about [Architecture](../explanation/architecture.md) to understand design decisions
- Check out real examples in the [Trailhead repository](https://github.com/esteban-url/trailhead)