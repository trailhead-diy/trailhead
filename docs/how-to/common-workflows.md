# Common CLI Development Workflows

How-to guides for typical CLI development tasks.

## Creating Your First Command

Start with a basic command structure:

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok, err } from '@trailhead/core'

export const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet a user',
  arguments: '<name>',
  options: [
    {
      flags: '-l, --loud',
      description: 'Shout the greeting',
      type: 'boolean',
    },
  ],
  action: async (options, context) => {
    const { logger, args } = context
    const [name] = args

    const greeting = `Hello, ${name}!`

    if (options.loud) {
      logger.info(greeting.toUpperCase())
    } else {
      logger.info(greeting)
    }

    return ok(undefined)
  },
})
```

## Handling Interactive Prompts

Use the built-in prompt utilities for user interaction:

```typescript
import { input, confirm, select } from '@trailhead/cli/prompts'
import { createCommand } from '@trailhead/cli/command'
import { ok } from '@trailhead/core'

export const initCommand = createCommand({
  name: 'init',
  description: 'Initialize a new project',
  options: [
    {
      flags: '-i, --interactive',
      description: 'Interactive mode',
      type: 'boolean',
    },
  ],
  action: async (options, context) => {
    const { logger } = context

    if (!options.interactive) {
      // Non-interactive mode with defaults
      return ok(undefined)
    }

    // Collect project information
    const projectName = await input({
      message: 'Project name:',
      default: 'my-project',
    })

    const projectType = await select({
      message: 'Project type:',
      choices: [
        { name: 'Web Application', value: 'web' },
        { name: 'CLI Tool', value: 'cli' },
        { name: 'Library', value: 'lib' },
      ],
    })

    const useTypeScript = await confirm({
      message: 'Use TypeScript?',
      default: true,
    })

    logger.info(`Creating ${projectType} project: ${projectName}`)
    if (useTypeScript) {
      logger.info('TypeScript enabled')
    }

    return ok(undefined)
  },
})
```

## File Operations with Error Handling

Use the filesystem utilities with proper Result handling:

```typescript
import { fs } from '@trailhead/fs'
import { createCommand } from '@trailhead/cli/command'
import { ok, err } from '@trailhead/core'

export const processCommand = createCommand({
  name: 'process',
  description: 'Process a configuration file',
  arguments: '<file>',
  action: async (options, context) => {
    const { logger, args } = context
    const [filePath] = args

    // Check if file exists
    const existsResult = await fs.exists(filePath)
    if (existsResult.isErr()) {
      return err(existsResult.error)
    }

    if (!existsResult.value) {
      logger.error(`File not found: ${filePath}`)
      return err(new Error('File not found'))
    }

    // Read the file
    const readResult = await fs.readJson(filePath)
    if (readResult.isErr()) {
      logger.error(`Failed to read file: ${readResult.error.message}`)
      return err(readResult.error)
    }

    const config = readResult.value
    logger.info(`Processing ${config.name || 'unnamed'} configuration`)

    // Process the configuration...

    // Write output
    const outputPath = filePath.replace('.json', '.processed.json')
    const writeResult = await fs.writeJson(outputPath, {
      ...config,
      processed: true,
      timestamp: new Date().toISOString(),
    })

    if (writeResult.isErr()) {
      logger.error(`Failed to write output: ${writeResult.error.message}`)
      return err(writeResult.error)
    }

    logger.success(`Output written to ${outputPath}`)
    return ok(undefined)
  },
})
```

## Handling Configuration

Use the configuration utilities from `@trailhead/config`:

```typescript
// src/lib/config.ts
import { createConfigManager } from '@trailhead/config'
import { z } from 'zod'

// Define your schema using Zod
const configSchema = z.object({
  apiUrl: z.string().url().describe('API endpoint URL'),
  timeout: z.number().min(0).default(5000).describe('Request timeout in ms'),
  retries: z.number().min(0).max(10).default(3).describe('Number of retries'),
  features: z.object({
    cache: z.boolean().default(true).describe('Enable caching'),
    logging: z.boolean().default(false).describe('Enable detailed logging'),
  }),
})

// Create a config manager
export const configManager = createConfigManager({
  name: 'app-config',
  sources: [
    { type: 'file', path: './config.json', priority: 1, optional: true },
    { type: 'env', prefix: 'APP_', priority: 2 },
    { type: 'cli', priority: 3 },
  ],
})

// Using configuration in your command
import { configManager } from './lib/config.js'

const command = createCommand({
  name: 'serve',
  description: 'Start the server',
  action: async (options, context) => {
    const { logger } = context

    // Load configuration
    const loadResult = await configManager.load()
    if (loadResult.isErr()) {
      logger.error(`Config error: ${loadResult.error.message}`)
      return err(loadResult.error)
    }

    const config = configManager.get()

    // Access validated config
    logger.info(`API URL: ${config.apiUrl}`)
    logger.info(`Timeout: ${config.timeout}ms`)

    if (config.features.logging) {
      logger.debug('Detailed logging enabled')
    }

    return ok(undefined)
  },
})
```

### Working with Configuration Operations

For more advanced configuration scenarios:

```typescript
import { createConfigOperations } from '@trailhead/config'
import { z } from 'zod'

// Create operations instance
const ops = createConfigOperations()

// Define and validate schema
const schema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  ssl: z.object({
    enabled: z.boolean().default(false),
    cert: z.string().optional(),
    key: z.string().optional(),
  }),
})

// Create manager with operations
const manager = ops.create({
  name: 'server-config',
  sources: [
    { type: 'file', path: 'server.json', priority: 1, optional: true },
    { type: 'env', prefix: 'SERVER_', priority: 2 },
  ],
})

// Validate configuration
const validateResult = ops.validate(rawConfig, schema)
if (validateResult.isErr()) {
  console.error('Invalid configuration:', validateResult.error)
}
```

## Progress Tracking

Show progress for long-running operations:

```typescript
import { createProgressBar } from '@trailhead/cli/progress'
import { createCommand } from '@trailhead/cli/command'

export const downloadCommand = createCommand({
  name: 'download',
  description: 'Download files',
  arguments: '<urls...>',
  action: async (options, context) => {
    const { logger, args: urls } = context

    // Create a progress bar
    const progressBar = createProgressBar({
      total: urls.length,
      format: 'Downloading [{bar}] {percentage}% | {value}/{total} files',
    })

    progressBar.start()

    for (const url of urls) {
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 1000))
      progressBar.increment()
    }

    progressBar.stop()
    logger.success(`Downloaded ${urls.length} files`)

    return ok(undefined)
  },
})
```

## Using Spinners for Indeterminate Progress

For operations without known duration:

```typescript
import { createSpinner, withSpinner } from '@trailhead/cli/utils'
import { createCommand } from '@trailhead/cli/command'

export const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application',
  action: async (options, context) => {
    const { logger } = context

    // Manual spinner control
    const spinner = createSpinner('Connecting to server...')
    spinner.start()

    await someAsyncOperation()
    spinner.text = 'Uploading files...'

    await anotherOperation()
    spinner.succeed('Deployment complete')

    // Or use withSpinner helper
    const result = await withSpinner('Processing...', async () => {
      // Your async operation here
      return await complexOperation()
    })

    if (result.isOk()) {
      logger.success('Operation completed')
    }

    return ok(undefined)
  },
})
```

## Error Recovery Patterns

Implement graceful error handling and recovery:

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok, err } from '@trailhead/core'
import { fs } from '@trailhead/fs'

export const safeCommand = createCommand({
  name: 'safe-process',
  description: 'Process with error recovery',
  arguments: '<input>',
  action: async (options, context) => {
    const { logger, args } = context
    const [input] = args

    // Try primary operation
    const primaryResult = await fs.readFile(input)

    if (primaryResult.isErr()) {
      // Try fallback
      logger.warning('Primary read failed, trying backup...')

      const backupPath = `${input}.backup`
      const backupResult = await fs.readFile(backupPath)

      if (backupResult.isErr()) {
        // Final fallback - create default
        logger.warning('No backup found, using defaults')

        const defaultContent = '{"version": "1.0.0"}'
        const createResult = await fs.writeFile(input, defaultContent)

        if (createResult.isErr()) {
          logger.error('Failed to create default file')
          return err(createResult.error)
        }

        logger.info('Created default configuration')
        return ok(undefined)
      }

      // Restore from backup
      const restoreResult = await fs.copy(backupPath, input)
      if (restoreResult.isOk()) {
        logger.success('Restored from backup')
      }
    }

    return ok(undefined)
  },
})
```

## Testing Your Commands

Write tests for your CLI commands:

```typescript
import { describe, it, expect } from 'vitest'
import { createTestContext } from '@trailhead/cli/testing'
import { myCommand } from './my-command.js'

describe('myCommand', () => {
  it('should process input correctly', async () => {
    // Create test context with mock logger and fs
    const context = createTestContext({
      args: ['test-input'],
      verbose: false,
    })

    // Execute command
    const result = await myCommand.action({ loud: false }, context)

    // Verify result
    expect(result.isOk()).toBe(true)

    // Check logger calls
    expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('test-input'))
  })

  it('should handle errors gracefully', async () => {
    const context = createTestContext({
      args: ['invalid-input'],
      mockFS: {
        exists: async () => ok(false), // File doesn't exist
      },
    })

    const result = await myCommand.action({}, context)

    expect(result.isErr()).toBe(true)
    expect(context.logger.error).toHaveBeenCalled()
  })
})
```

## Package Manager Detection

Detect and use the appropriate package manager:

```typescript
import { detectPackageManager, getRunCommand } from '@trailhead/cli/utils'
import { createCommand } from '@trailhead/cli/command'

export const runCommand = createCommand({
  name: 'run',
  description: 'Run a script with the detected package manager',
  arguments: '<script>',
  action: async (options, context) => {
    const { logger, args } = context
    const [script] = args

    // Detect package manager
    const pmResult = await detectPackageManager()
    if (pmResult.isErr()) {
      logger.error('Could not detect package manager')
      return err(pmResult.error)
    }

    const pm = pmResult.value
    logger.info(`Using ${pm} package manager`)

    // Get the appropriate run command
    const runCmd = getRunCommand(pm, script)
    logger.info(`Running: ${runCmd}`)

    // Execute the command
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    try {
      const { stdout } = await execAsync(runCmd)
      logger.info(stdout)
      return ok(undefined)
    } catch (error) {
      logger.error(`Command failed: ${error.message}`)
      return err(error)
    }
  },
})
```
