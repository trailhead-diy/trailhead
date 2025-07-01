# Command Module API Reference

The command module provides utilities for creating and executing CLI commands with support for options, subcommands, and various execution patterns.

## Import

```typescript
import { createCommand, executeWithPhases, executeInteractive } from '@trailhead/cli/command'
import type { Command, CommandContext, CommandOption } from '@trailhead/cli/command'
```

## Core Types

### Command Interface

Represents a CLI command with its configuration and execution logic.

```typescript
interface Command<T = any> {
  name: string
  description: string
  options?: CommandOption[]
  execute: (options: T, context: CommandContext) => Promise<Result<void>>
}
```

### CommandOption

Defines command-line options/flags.

```typescript
interface CommandOption {
  name: string              // Long name (--name)
  alias?: string           // Short alias (-n)
  description: string      // Help text
  type?: 'string' | 'boolean' | 'number'
  required?: boolean       // Is this option required?
  default?: any           // Default value if not provided
}
```

### CommandContext

Provides access to shared resources and utilities.

```typescript
interface CommandContext {
  readonly projectRoot: string    // Current working directory
  readonly logger: Logger         // Logging utilities
  readonly verbose: boolean       // Verbose output flag
  readonly fs: FileSystem        // File system abstraction
}
```

## Creating Commands

### `createCommand<T>(config: CommandConfig<T>): Command<T>`

Creates a new command with the specified configuration.

```typescript
const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet a user',
  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: true,
      description: 'Name to greet'
    },
    {
      name: 'loud',
      alias: 'l',
      type: 'boolean',
      default: false,
      description: 'Shout the greeting'
    }
  ],
  action: async (options, context) => {
    const greeting = `Hello, ${options.name}!`
    const message = options.loud ? greeting.toUpperCase() : greeting
    context.logger.success(message)
    return ok(undefined)
  }
})
```

### Command with Validation

Add input validation to your commands:

```typescript
const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application',
  options: [
    {
      name: 'environment',
      alias: 'e',
      type: 'string',
      required: true,
      description: 'Target environment'
    }
  ],
  validate: (options) => {
    const validEnvs = ['dev', 'staging', 'production']
    if (!validEnvs.includes(options.environment)) {
      return err(createValidationError({
        field: 'environment',
        value: options.environment,
        message: `Invalid environment. Must be one of: ${validEnvs.join(', ')}`
      }))
    }
    return ok(options)
  },
  action: async (options, context) => {
    context.logger.info(`Deploying to ${options.environment}...`)
    // Deployment logic
    return ok(undefined)
  }
})
```

### Subcommands

Organize related commands under a parent command:

```typescript
const listCommand = createCommand({
  name: 'list',
  description: 'List all users',
  action: async (_, context) => {
    const users = await loadUsers(context)
    users.forEach(user => context.logger.info(`- ${user.name}`))
    return ok(undefined)
  }
})

const addCommand = createCommand({
  name: 'add',
  description: 'Add a new user',
  options: [
    { name: 'name', alias: 'n', type: 'string', required: true }
  ],
  action: async (options, context) => {
    await addUser(options.name, context)
    context.logger.success(`Added user: ${options.name}`)
    return ok(undefined)
  }
})

// Parent command with subcommands
const userCommand = createCommand({
  name: 'user',
  description: 'Manage users',
  subcommands: [listCommand, addCommand]
})

// Usage: my-cli user list
// Usage: my-cli user add -n "John Doe"
```

## Execution Patterns

### Phased Execution

Break complex operations into distinct phases with progress tracking.

#### `executeWithPhases<T>(phases: CommandPhase<T>[], initialData: T, context: CommandContext): Promise<Result<T>>`

```typescript
interface CommandPhase<T> {
  name: string
  execute: (data: T, context: CommandContext) => Promise<Result<T>>
}
```

Example:

```typescript
interface BuildData {
  sourceFiles: string[]
  compiledFiles: string[]
  bundlePath?: string
}

const buildCommand = createCommand({
  name: 'build',
  description: 'Build the project',
  action: async (_, context) => {
    const phases: CommandPhase<BuildData>[] = [
      {
        name: 'Collect source files',
        execute: async (data, ctx) => {
          ctx.logger.info('Scanning for source files...')
          const files = await findSourceFiles(ctx)
          return ok({ ...data, sourceFiles: files })
        }
      },
      {
        name: 'Compile TypeScript',
        execute: async (data, ctx) => {
          ctx.logger.info(`Compiling ${data.sourceFiles.length} files...`)
          const compiled = await compileFiles(data.sourceFiles, ctx)
          return ok({ ...data, compiledFiles: compiled })
        }
      },
      {
        name: 'Bundle for production',
        execute: async (data, ctx) => {
          ctx.logger.info('Creating production bundle...')
          const bundle = await createBundle(data.compiledFiles, ctx)
          return ok({ ...data, bundlePath: bundle })
        }
      }
    ]

    const result = await executeWithPhases(
      phases,
      { sourceFiles: [], compiledFiles: [] },
      context
    )

    if (result.success) {
      context.logger.success(`Build complete: ${result.value.bundlePath}`)
    }

    return result.success ? ok(undefined) : result
  }
})
```

### Interactive Execution

Pause execution to get user confirmation or input.

#### `executeInteractive<T>(options: InteractiveOptions<T>): Promise<Result<T>>`

```typescript
interface InteractiveOptions<T> {
  message: string
  data: T
  context: CommandContext
  onConfirm: (data: T) => Promise<Result<T>>
  onCancel?: () => Promise<Result<T>>
}
```

Example:

```typescript
const deleteCommand = createCommand({
  name: 'delete',
  description: 'Delete files',
  options: [
    { name: 'pattern', alias: 'p', type: 'string', required: true }
  ],
  action: async (options, context) => {
    // Find files matching pattern
    const files = await findFiles(options.pattern, context)
    
    if (files.length === 0) {
      context.logger.info('No files found matching pattern')
      return ok(undefined)
    }

    // Show files to be deleted
    context.logger.warning('The following files will be deleted:')
    files.forEach(file => context.logger.info(`  - ${file}`))

    // Interactive confirmation
    const result = await executeInteractive({
      message: `Delete ${files.length} files?`,
      data: files,
      context,
      onConfirm: async (filesToDelete) => {
        for (const file of filesToDelete) {
          const deleteResult = await context.fs.delete(file)
          if (!deleteResult.success) {
            return deleteResult
          }
        }
        context.logger.success(`Deleted ${filesToDelete.length} files`)
        return ok(filesToDelete)
      },
      onCancel: async () => {
        context.logger.info('Operation cancelled')
        return ok([])
      }
    })

    return result.success ? ok(undefined) : result
  }
})
```

### Dry Run Mode

Preview changes without applying them.

#### `executeWithDryRun<T>(options: DryRunOptions<T>): Promise<Result<T>>`

```typescript
interface DryRunOptions<T> {
  isDryRun: boolean
  data: T
  context: CommandContext
  preview: (data: T) => void
  execute: (data: T) => Promise<Result<T>>
}
```

Example:

```typescript
const migrateCommand = createCommand({
  name: 'migrate',
  description: 'Run database migrations',
  options: [
    {
      name: 'dry-run',
      type: 'boolean',
      default: false,
      description: 'Preview migrations without applying them'
    }
  ],
  action: async (options, context) => {
    const migrations = await findPendingMigrations(context)

    const result = await executeWithDryRun({
      isDryRun: options.dryRun,
      data: migrations,
      context,
      preview: (migs) => {
        context.logger.info('Migrations to be applied:')
        migs.forEach((m, i) => {
          context.logger.info(`  ${i + 1}. ${m.name} (${m.timestamp})`)
        })
        context.logger.warning('\nThis is a dry run. No changes will be applied.')
      },
      execute: async (migs) => {
        for (const migration of migs) {
          context.logger.step(
            migs.indexOf(migration) + 1,
            migs.length,
            `Applying ${migration.name}`
          )
          
          const applyResult = await applyMigration(migration, context)
          if (!applyResult.success) {
            return applyResult
          }
        }
        
        context.logger.success(`Applied ${migs.length} migrations`)
        return ok(migs)
      }
    })

    return result.success ? ok(undefined) : result
  }
})
```

### Progress Tracking

Show progress for long-running operations.

```typescript
const processCommand = createCommand({
  name: 'process',
  description: 'Process files',
  action: async (_, context) => {
    const files = await findFiles('*.json', context)
    const total = files.length
    const processed: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Show progress
      context.logger.step(i + 1, total, `Processing ${file}`)
      
      const result = await processFile(file, context)
      if (!result.success) {
        context.logger.error(`Failed to process ${file}: ${result.error.message}`)
        return result
      }
      
      processed.push(file)
    }

    context.logger.success(`Processed ${processed.length} files successfully`)
    return ok(undefined)
  }
})
```

## Advanced Patterns

### Command Composition

Compose commands from smaller functions:

```typescript
// Reusable command behaviors
const withTiming = <T>(
  fn: (options: T, context: CommandContext) => Promise<Result<void>>
) => async (options: T, context: CommandContext) => {
  const start = Date.now()
  const result = await fn(options, context)
  const duration = Date.now() - start
  context.logger.debug(`Execution time: ${duration}ms`)
  return result
}

const withErrorRecovery = <T>(
  fn: (options: T, context: CommandContext) => Promise<Result<void>>,
  recover: (error: CLIError, context: CommandContext) => Promise<Result<void>>
) => async (options: T, context: CommandContext) => {
  const result = await fn(options, context)
  if (!result.success && result.error.recoverable) {
    context.logger.warning('Attempting recovery...')
    return recover(result.error, context)
  }
  return result
}

// Compose behaviors
const robustCommand = createCommand({
  name: 'robust',
  description: 'A robust command',
  action: withTiming(
    withErrorRecovery(
      async (_, context) => {
        // Main logic
        return processData(context)
      },
      async (error, context) => {
        // Recovery logic
        return recoverFromError(error, context)
      }
    )
  )
})
```

### Command Middleware

Add pre/post processing to commands:

```typescript
interface CommandMiddleware<T> {
  before?: (options: T, context: CommandContext) => Promise<Result<T>>
  after?: (options: T, result: Result<void>, context: CommandContext) => Promise<Result<void>>
}

function withMiddleware<T>(
  command: Command<T>,
  middleware: CommandMiddleware<T>
): Command<T> {
  return {
    ...command,
    execute: async (options, context) => {
      // Run before middleware
      if (middleware.before) {
        const beforeResult = await middleware.before(options, context)
        if (!beforeResult.success) {
          return beforeResult
        }
        options = beforeResult.value
      }

      // Run command
      const result = await command.execute(options, context)

      // Run after middleware
      if (middleware.after) {
        return middleware.after(options, result, context)
      }

      return result
    }
  }
}

// Usage
const auditedCommand = withMiddleware(deleteCommand, {
  before: async (options, context) => {
    await logAudit('delete.start', options, context)
    return ok(options)
  },
  after: async (options, result, context) => {
    await logAudit('delete.complete', { options, success: result.success }, context)
    return result
  }
})
```

### Conditional Execution

Execute different logic based on conditions:

```typescript
const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application',
  options: [
    { name: 'env', alias: 'e', type: 'string', required: true },
    { name: 'force', alias: 'f', type: 'boolean', default: false }
  ],
  action: async (options, context) => {
    // Different strategies based on environment
    const strategies: Record<string, DeployStrategy> = {
      dev: createDevDeployStrategy(),
      staging: createStagingDeployStrategy(),
      production: createProductionDeployStrategy()
    }

    const strategy = strategies[options.env]
    if (!strategy) {
      return err(createError({
        code: 'INVALID_ENV',
        message: `Unknown environment: ${options.env}`,
        suggestion: `Use one of: ${Object.keys(strategies).join(', ')}`
      }))
    }

    // Check prerequisites
    if (!options.force) {
      const checkResult = await strategy.checkPrerequisites(context)
      if (!checkResult.success) {
        return checkResult
      }
    }

    // Execute deployment
    return strategy.deploy(context)
  }
})
```

## Best Practices

### 1. Keep Commands Focused

Each command should do one thing well:

```typescript
// ❌ Bad - Too many responsibilities
const manageCommand = createCommand({
  name: 'manage',
  options: [
    { name: 'create-user' },
    { name: 'delete-user' },
    { name: 'backup-db' },
    { name: 'restore-db' }
  ],
  action: async (options, context) => {
    if (options.createUser) { /* ... */ }
    else if (options.deleteUser) { /* ... */ }
    else if (options.backupDb) { /* ... */ }
    else if (options.restoreDb) { /* ... */ }
  }
})

// ✅ Good - Separate commands
const userCommand = createCommand({
  name: 'user',
  subcommands: [createUserCommand, deleteUserCommand]
})

const dbCommand = createCommand({
  name: 'db',
  subcommands: [backupCommand, restoreCommand]
})
```

### 2. Validate Early

Validate inputs before executing main logic:

```typescript
const uploadCommand = createCommand({
  name: 'upload',
  options: [
    { name: 'file', alias: 'f', type: 'string', required: true },
    { name: 'bucket', alias: 'b', type: 'string', required: true }
  ],
  action: async (options, context) => {
    // Validate file exists
    const fileExists = await context.fs.exists(options.file)
    if (!fileExists.success || !fileExists.value) {
      return err(createError({
        code: 'FILE_NOT_FOUND',
        message: `File not found: ${options.file}`,
        suggestion: 'Check the file path and try again'
      }))
    }

    // Validate bucket name
    if (!/^[a-z0-9.-]+$/.test(options.bucket)) {
      return err(createValidationError({
        field: 'bucket',
        value: options.bucket,
        message: 'Invalid bucket name',
        constraints: { pattern: '^[a-z0-9.-]+$' }
      }))
    }

    // Main upload logic
    return uploadFile(options.file, options.bucket, context)
  }
})
```

### 3. Provide Progress Feedback

Keep users informed during long operations:

```typescript
const syncCommand = createCommand({
  name: 'sync',
  description: 'Sync files to remote',
  action: async (_, context) => {
    const spinner = createSpinner('Scanning local files...')
    spinner.start()

    const files = await scanFiles(context)
    spinner.succeed(`Found ${files.length} files`)

    const results = {
      uploaded: 0,
      skipped: 0,
      failed: 0
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      context.logger.step(i + 1, files.length, `Uploading ${file.name}`)

      const result = await uploadFile(file, context)
      if (result.success) {
        results.uploaded++
      } else if (result.error.code === 'ALREADY_EXISTS') {
        results.skipped++
      } else {
        results.failed++
        context.logger.error(`Failed: ${result.error.message}`)
      }
    }

    context.logger.success(`
Sync complete:
  Uploaded: ${results.uploaded}
  Skipped: ${results.skipped}
  Failed: ${results.failed}
    `.trim())

    return results.failed === 0 ? ok(undefined) : err(createError({
      code: 'PARTIAL_FAILURE',
      message: `${results.failed} files failed to upload`
    }))
  }
})
```

### 4. Handle Interruptions

Clean up resources on interruption:

```typescript
const serverCommand = createCommand({
  name: 'server',
  description: 'Start development server',
  action: async (_, context) => {
    let server: Server | null = null

    // Handle interruption
    const cleanup = async () => {
      if (server) {
        context.logger.info('\nShutting down server...')
        await server.close()
        context.logger.success('Server stopped')
      }
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    try {
      server = await startServer(context)
      context.logger.success(`Server running at http://localhost:${server.port}`)
      
      // Keep process alive
      await new Promise(() => {})
    } finally {
      process.off('SIGINT', cleanup)
      process.off('SIGTERM', cleanup)
      await cleanup()
    }

    return ok(undefined)
  }
})
```

## Complete Example

Here's a complete example of a file processing command with all features:

```typescript
import { 
  createCommand, 
  executeWithPhases, 
  executeInteractive,
  executeWithDryRun 
} from '@trailhead/cli/command'
import { ok, err, isOk } from '@trailhead/cli/core'
import { select, confirm } from '@trailhead/cli/prompts'

interface ProcessOptions {
  input: string
  output: string
  format: 'json' | 'csv' | 'yaml'
  dryRun: boolean
  interactive: boolean
}

interface ProcessData {
  inputFiles: string[]
  outputDir: string
  processedFiles: string[]
}

const processCommand = createCommand<ProcessOptions>({
  name: 'process',
  description: 'Process data files',
  options: [
    {
      name: 'input',
      alias: 'i',
      type: 'string',
      required: true,
      description: 'Input directory or file pattern'
    },
    {
      name: 'output',
      alias: 'o',
      type: 'string',
      required: true,
      description: 'Output directory'
    },
    {
      name: 'format',
      alias: 'f',
      type: 'string',
      default: 'json',
      description: 'Output format (json, csv, yaml)'
    },
    {
      name: 'dry-run',
      type: 'boolean',
      default: false,
      description: 'Preview changes without processing'
    },
    {
      name: 'interactive',
      alias: 'I',
      type: 'boolean',
      default: false,
      description: 'Confirm each file before processing'
    }
  ],
  
  validate: (options) => {
    const validFormats = ['json', 'csv', 'yaml']
    if (!validFormats.includes(options.format)) {
      return err(createValidationError({
        field: 'format',
        value: options.format,
        message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      }))
    }
    return ok(options)
  },

  action: async (options, context) => {
    // Define processing phases
    const phases: CommandPhase<ProcessData>[] = [
      {
        name: 'Validate input',
        execute: async (data, ctx) => {
          const exists = await ctx.fs.exists(options.input)
          if (!exists.success || !exists.value) {
            return err(createError({
              code: 'INPUT_NOT_FOUND',
              message: `Input not found: ${options.input}`,
              suggestion: 'Check the input path and try again'
            }))
          }
          return ok(data)
        }
      },
      {
        name: 'Scan for files',
        execute: async (data, ctx) => {
          const pattern = options.input.includes('*') 
            ? options.input 
            : `${options.input}/**/*.{json,csv,yaml}`
          
          const files = await findFiles(pattern, ctx)
          if (files.length === 0) {
            return err(createError({
              code: 'NO_FILES_FOUND',
              message: 'No files found matching the input pattern',
              suggestion: 'Check your input path or pattern'
            }))
          }

          ctx.logger.info(`Found ${files.length} files to process`)
          return ok({ ...data, inputFiles: files })
        }
      },
      {
        name: 'Prepare output directory',
        execute: async (data, ctx) => {
          const result = await ctx.fs.ensureDir(options.output)
          if (!result.success) {
            return err(createError({
              code: 'OUTPUT_DIR_ERROR',
              message: `Failed to create output directory: ${options.output}`,
              cause: result.error
            }))
          }
          return ok({ ...data, outputDir: options.output })
        }
      }
    ]

    // Execute preparation phases
    const prepResult = await executeWithPhases(
      phases,
      { inputFiles: [], outputDir: '', processedFiles: [] },
      context
    )

    if (!isOk(prepResult)) {
      return prepResult
    }

    const data = prepResult.value

    // Process files with dry-run support
    const processResult = await executeWithDryRun({
      isDryRun: options.dryRun,
      data: data.inputFiles,
      context,
      preview: (files) => {
        context.logger.info('\nFiles to be processed:')
        files.forEach((file, i) => {
          const outputName = getOutputFileName(file, options.format)
          context.logger.info(`  ${i + 1}. ${file} → ${outputName}`)
        })
        context.logger.warning('\nThis is a dry run. No files will be processed.')
      },
      execute: async (files) => {
        const processed: string[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Interactive mode - confirm each file
          if (options.interactive) {
            const shouldProcess = await confirm({
              message: `Process ${file}?`,
              default: true
            })

            if (!shouldProcess) {
              context.logger.info(`Skipped: ${file}`)
              continue
            }
          }

          // Show progress
          context.logger.step(i + 1, files.length, `Processing ${file}`)

          // Process file
          const result = await processFile(file, options.format, data.outputDir, context)
          if (!result.success) {
            context.logger.error(`Failed to process ${file}: ${result.error.message}`)
            
            if (options.interactive) {
              const shouldContinue = await confirm({
                message: 'Continue with remaining files?',
                default: true
              })
              
              if (!shouldContinue) {
                return err(createError({
                  code: 'USER_CANCELLED',
                  message: 'Processing cancelled by user'
                }))
              }
            }
          } else {
            processed.push(file)
          }
        }

        return ok(processed)
      }
    })

    if (!isOk(processResult)) {
      return processResult
    }

    // Summary
    const processed = processResult.value
    context.logger.success(`
Processing complete:
  Total files: ${data.inputFiles.length}
  Processed: ${processed.length}
  Skipped: ${data.inputFiles.length - processed.length}
  Output: ${options.output}
    `.trim())

    return ok(undefined)
  }
})

// Helper functions
async function findFiles(pattern: string, context: CommandContext): Promise<string[]> {
  // Implementation
}

async function processFile(
  inputPath: string,
  format: string,
  outputDir: string,
  context: CommandContext
): Promise<Result<string>> {
  // Implementation
}

function getOutputFileName(inputPath: string, format: string): string {
  // Implementation
}
```

This example demonstrates:
- Option validation
- Phased execution for complex operations
- Dry-run mode for previewing changes
- Interactive mode for user confirmation
- Progress tracking and reporting
- Error handling and recovery
- Clear user feedback throughout