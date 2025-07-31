---
type: how-to
title: 'Use CLI Command Execution Patterns'
description: 'Use @esteban-url/cli execution patterns for batch processing and phased operations'
prerequisites:
  - Understanding of Result types
  - Basic async/await knowledge
  - Familiarity with @esteban-url/cli commands
related:
  - /packages/cli/docs/reference/command.md
  - /packages/cli/docs/how-to/migrate-to-command-enhancements.md
  - /packages/cli/docs/how-to/handle-errors-in-cli
  - /docs/how-to/compose-result-operations
---

# Use CLI Command Execution Patterns

This guide shows you how to use @esteban-url/cli's execution patterns for building robust command-line operations with progress tracking, batch processing, and phased execution.

> **Note**: For general Result composition patterns, see [Compose Result Operations](/docs/how-to/compose-result-operations).

## Available Execution Patterns

### Import Command Utilities

```typescript
import {
  executeWithPhases,
  executeBatch,
  executeWithConfiguration,
  executeWithDryRun,
  executeWithValidation,
  executeFileSystemOperations,
} from '@esteban-url/cli/command'
import { ok, err } from '@esteban-url/core'
```

## Batch Processing

Process multiple items with concurrency control and progress tracking:

### Basic Batch Execution

```typescript
import { executeBatch } from '@esteban-url/cli/command'
import { createCommand } from '@esteban-url/cli/command'

const processFilesCommand = createCommand({
  name: 'process-files',
  options: {
    files: {
      type: 'string',
      multiple: true,
      description: 'Files to process',
      required: true,
    },
    batchSize: {
      type: 'number',
      description: 'Number of files to process concurrently',
      default: 5,
    },
  },
  action: async (options, context) => {
    const processFile = async (file: string) => {
      // Process individual file
      const content = await fs.readFile(file)
      if (content.isErr()) {
        return err(createFileSystemError('read', file, content.error))
      }

      // Transform content
      const transformed = await transformContent(content.value)
      return transformed
    }

    return executeBatch(
      options.files,
      processFile,
      {
        batchSize: options.batchSize,
        onProgress: (completed, total) => {
          context.logger.info(`Progress: ${completed}/${total} files`)
        },
      },
      context
    )
  },
})
```

## Phased Execution

Execute operations in sequential phases with data passing between phases:

### Multi-Phase Command

```typescript
import { executeWithPhases } from '@esteban-url/cli/command'
import type { CommandPhase } from '@esteban-url/cli/command'

interface BuildContext {
  sourceDir: string
  outputDir: string
  files?: string[]
  compiled?: Record<string, string>
  optimized?: Record<string, string>
}

const buildCommand = createCommand({
  name: 'build',
  options: {
    source: { type: 'string', required: true },
    output: { type: 'string', required: true },
  },
  action: async (options, context) => {
    const phases: CommandPhase<BuildContext>[] = [
      {
        name: 'discover',
        weight: 10,
        action: async (data) => {
          context.logger.info('Discovering source files...')
          const files = await discoverFiles(data.sourceDir)
          return ok({ ...data, files: files.value })
        },
      },
      {
        name: 'compile',
        weight: 50,
        action: async (data) => {
          context.logger.info('Compiling files...')
          const compiled = await compileFiles(data.files!)
          return ok({ ...data, compiled: compiled.value })
        },
      },
      {
        name: 'optimize',
        weight: 30,
        action: async (data) => {
          context.logger.info('Optimizing output...')
          const optimized = await optimizeFiles(data.compiled!)
          return ok({ ...data, optimized: optimized.value })
        },
      },
      {
        name: 'write',
        weight: 10,
        action: async (data) => {
          context.logger.info('Writing output files...')
          await writeOutput(data.outputDir, data.optimized!)
          return ok(data)
        },
      },
    ]

    const initialData: BuildContext = {
      sourceDir: options.source,
      outputDir: options.output,
    }

    return executeWithPhases(phases, initialData, context)
  },
})
```

## Configuration-Based Execution

Load and merge configuration before executing:

```typescript
import { executeWithConfiguration } from '@esteban-url/cli/command'

const deployCommand = createCommand({
  name: 'deploy',
  options: {
    config: { type: 'string', description: 'Config file path' },
    preset: { type: 'string', description: 'Configuration preset' },
    override: { type: 'string', multiple: true, description: 'Config overrides' },
  },
  action: async (options, context) => {
    return executeWithConfiguration(
      options,
      async (path) => {
        // Load configuration from file
        if (!path) return ok({ env: 'development' })
        const content = await fs.readFile(path)
        if (content.isErr()) return err(content.error)
        return ok(JSON.parse(content.value))
      },
      async (config) => {
        // Execute with merged configuration
        context.logger.info(`Deploying to ${config.env}...`)
        return deployToEnvironment(config)
      },
      context
    )
  },
})
```

## Dry Run Support

Execute commands with dry-run mode:

```typescript
import { executeWithDryRun } from '@esteban-url/cli/command'

const migrateCommand = createCommand({
  name: 'migrate',
  options: {
    dryRun: {
      type: 'boolean',
      description: 'Show what would be done without making changes',
      default: false,
    },
  },
  action: async (options, context) => {
    return executeWithDryRun(
      async () => {
        // This will only execute if not in dry-run mode
        const migrations = await runMigrations()
        return migrations
      },
      options.dryRun,
      context
    )
  },
})
```

## File System Operations with Rollback

Execute file operations atomically with automatic rollback on failure:

```typescript
import { executeFileSystemOperations } from '@esteban-url/cli/command'

const scaffoldCommand = createCommand({
  name: 'scaffold',
  options: {
    template: { type: 'string', required: true },
    name: { type: 'string', required: true },
  },
  action: async (options, context) => {
    const operations = [
      { type: 'mkdir' as const, path: options.name },
      { type: 'write' as const, path: `${options.name}/package.json`, content: '{}' },
      { type: 'copy' as const, from: options.template, to: `${options.name}/src` },
    ]

    return executeFileSystemOperations(operations, context)
  },
})
```

## Validation with Type Safety

Execute with built-in validation:

```typescript
import { executeWithValidation } from '@esteban-url/cli/command'
import { z } from 'zod'

const configSchema = z.object({
  port: z.number().min(1).max(65535),
  host: z.string().min(1),
  secure: z.boolean().optional(),
})

const serverCommand = createCommand({
  name: 'server',
  options: {
    config: { type: 'string', required: true },
  },
  action: async (options, context) => {
    return executeWithValidation(
      options,
      configSchema,
      async (validatedConfig) => {
        // validatedConfig is fully typed from schema
        return startServer({
          port: validatedConfig.port,
          host: validatedConfig.host,
          secure: validatedConfig.secure ?? false,
        })
      },
      context
    )
  },
})
```

## Combining Patterns

You can combine multiple execution patterns:

```typescript
const complexCommand = createCommand({
  name: 'process',
  options: {
    files: { type: 'string', multiple: true, required: true },
    dryRun: { type: 'boolean', default: false },
    config: { type: 'string' },
  },
  action: async (options, context) => {
    // First load configuration
    const configResult = await executeWithConfiguration(
      options,
      loadConfig,
      async (config) => ok(config),
      context
    )

    if (configResult.isErr()) return configResult

    // Then execute with dry-run support
    return executeWithDryRun(
      async () => {
        // Process files in batches
        return executeBatch(
          options.files,
          async (file) => processFileWithConfig(file, configResult.value),
          { batchSize: 5, onProgress: logProgress },
          context
        )
      },
      options.dryRun,
      context
    )
  },
})
```

## Error Handling

All execution patterns automatically handle errors and return Result types:

```typescript
const result = await executeWithPhases(phases, data, context)

if (result.isErr()) {
  // Phases automatically stop on first error
  context.logger.error(`Phase execution failed: ${result.error.message}`)
  return result
}

// All phases succeeded
context.logger.success('All phases completed successfully')
```

## Next Steps

- Learn about [Command Enhancements](/packages/cli/docs/how-to/migrate-to-command-enhancements)
- Review [Command API Reference](/packages/cli/docs/reference/command)
- Explore [Testing Commands](/packages/cli/docs/how-to/test-cli-applications)
