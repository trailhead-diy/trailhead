---
type: how-to
title: 'Migrate to Command Execution Patterns'
description: 'Replace manual error checking with CLI execution patterns'
prerequisites:
  - Existing code using manual Result checking
  - Understanding of Result types
  - Basic async/await knowledge
related:
  - /packages/cli/docs/reference/flow-control.md
  - /packages/cli/docs/how-to/use-result-pipelines
  - /packages/cli/docs/reference/command.md
---

# Migrate to Command Execution Patterns

This guide shows you how to migrate existing code from manual Result checking to CLI execution patterns, reducing boilerplate and improving error handling.

## Identifying Migration Candidates

### Look for Repetitive Patterns

Common patterns that benefit from execution patterns:

```typescript
// Pattern 1: Batch processing with manual iteration
for (const item of items) {
  const result = await processItem(item)
  if (result.isErr()) {
    return err(new Error(`Failed on item: ${result.error.message}`))
  }
}

// Pattern 2: Sequential operations with error checking
const step1 = await operation1()
if (step1.isErr()) {
  return err(new Error(`Step 1 failed: ${step1.error.message}`))
}

const step2 = await operation2(step1.value)
if (step2.isErr()) {
  return err(new Error(`Step 2 failed: ${step2.error.message}`))
}

// Pattern 3: Configuration loading with overrides
const config = await loadConfig(options.config)
if (config.isErr()) {
  return config
}
const merged = { ...config.value, ...options.override }
```

## Migration Examples

### Batch Processing Migration

#### Before: Manual Iteration

```typescript
async function processFiles(files: string[]): Promise<Result<ProcessedFile[]>> {
  const results: ProcessedFile[] = []

  for (const file of files) {
    const readResult = await fs.readFile(file)
    if (readResult.isErr()) {
      return err(new Error(`Failed to read ${file}: ${readResult.error.message}`))
    }

    const processResult = await processContent(readResult.value)
    if (processResult.isErr()) {
      return err(new Error(`Failed to process ${file}: ${processResult.error.message}`))
    }

    results.push(processResult.value)
  }

  return ok(results)
}
```

#### After: Using executeBatch

```typescript
import { executeBatch } from '@esteban-url/cli/command'

async function processFiles(
  files: string[],
  context: CommandContext
): Promise<Result<ProcessedFile[]>> {
  return executeBatch(
    files,
    async (file) => {
      const readResult = await fs.readFile(file)
      if (readResult.isErr()) {
        return readResult
      }

      return processContent(readResult.value)
    },
    {
      batchSize: 5,
      onProgress: (completed, total) => {
        context.logger.info(`Processed ${completed}/${total} files`)
      },
    },
    context
  )
}
```

### Sequential Operations Migration

#### Before: Manual Phase Management

```typescript
async function buildProject(options: BuildOptions): Promise<Result<void>> {
  console.log('Starting build...')

  // Validate
  const validateResult = await validateProject()
  if (validateResult.isErr()) {
    return validateResult
  }
  console.log('Validation complete')

  // Run tests
  if (!options.skipTests) {
    const testResult = await runTests()
    if (testResult.isErr()) {
      return err(new Error(`Tests failed: ${testResult.error.message}`))
    }
  }
  console.log('Tests passed')

  // Build
  const buildResult = await performBuild()
  if (buildResult.isErr()) {
    return err(new Error(`Build failed: ${buildResult.error.message}`))
  }
  console.log('Build complete')

  // Deploy
  if (options.deploy) {
    const approved = await confirmDeployment()
    if (!approved) {
      return err(new Error('Deployment not approved'))
    }

    const deployResult = await deploy()
    if (deployResult.isErr()) {
      return err(new Error(`Deploy failed: ${deployResult.error.message}`))
    }
  }

  return ok(undefined)
}
```

#### After: Using executeWithPhases

```typescript
import { executeWithPhases } from '@esteban-url/cli/command'
import type { CommandPhase } from '@esteban-url/cli/command'

async function buildProject(
  options: BuildOptions,
  context: CommandContext
): Promise<Result<BuildData>> {
  const phases: CommandPhase<BuildData>[] = [
    {
      name: 'validate',
      weight: 10,
      action: async (data) => validateProject(data),
    },
    {
      name: 'test',
      weight: 30,
      action: async (data) => {
        if (options.skipTests) return ok(data)
        return runTests(data)
      },
    },
    {
      name: 'build',
      weight: 40,
      action: async (data) => performBuild(data),
    },
    {
      name: 'deploy',
      weight: 20,
      action: async (data) => {
        if (!options.deploy) return ok(data)
        const approved = await confirmDeployment()
        if (!approved) {
          return err(createCliError('deployment_cancelled', 'Deployment not approved'))
        }
        return deploy(data)
      },
    },
  ]

  return executeWithPhases(phases, initialBuildData, context)
}
```

### Configuration Management Migration

#### Before: Manual Config Loading

```typescript
async function loadAppConfig(options: ConfigOptions): Promise<Result<AppConfig>> {
  let config: AppConfig = getDefaultConfig()

  // Load from file if specified
  if (options.configFile) {
    const fileResult = await fs.readFile(options.configFile)
    if (fileResult.isErr()) {
      return err(new Error(`Failed to load config: ${fileResult.error.message}`))
    }

    try {
      const fileConfig = JSON.parse(fileResult.value)
      config = { ...config, ...fileConfig }
    } catch (error) {
      return err(new Error(`Invalid config JSON: ${error.message}`))
    }
  }

  // Apply preset
  if (options.preset) {
    const presetConfig = getPreset(options.preset)
    if (!presetConfig) {
      return err(new Error(`Unknown preset: ${options.preset}`))
    }
    config = { ...config, ...presetConfig }
  }

  // Apply overrides
  if (options.override) {
    config = { ...config, ...options.override }
  }

  return ok(config)
}
```

#### After: Using executeWithConfiguration

```typescript
import { executeWithConfiguration } from '@esteban-url/cli/command'

async function runWithConfig(
  options: ConfigOptions,
  context: CommandContext
): Promise<Result<void>> {
  return executeWithConfiguration(
    options,
    async (path) => {
      if (!path) return ok(getDefaultConfig())

      const content = await fs.readFile(path)
      if (content.isErr()) return content

      try {
        return ok(JSON.parse(content.value))
      } catch (error) {
        return err(createDataError('parse', `Invalid JSON: ${error.message}`))
      }
    },
    async (config) => {
      // Your main logic with merged config
      return runApplication(config)
    },
    context
  )
}
```

### Dry Run Support Migration

#### Before: Manual Dry Run Handling

```typescript
async function deployApplication(options: DeployOptions): Promise<Result<void>> {
  if (options.dryRun) {
    console.log('[DRY RUN] Would deploy to:', options.environment)
    console.log('[DRY RUN] Would update services:', options.services.join(', '))
    return ok(undefined)
  }

  // Actual deployment
  const result = await performDeployment(options)
  if (result.isErr()) {
    return err(new Error(`Deployment failed: ${result.error.message}`))
  }

  return ok(undefined)
}
```

#### After: Using executeWithDryRun

```typescript
import { executeWithDryRun } from '@esteban-url/cli/command'

async function deployApplication(
  options: DeployOptions,
  context: CommandContext
): Promise<Result<void>> {
  return executeWithDryRun(
    async () => {
      // This only runs if not in dry-run mode
      return performDeployment(options)
    },
    options.dryRun,
    context
  )
}
```

## Migration Checklist

### 1. Identify Patterns

- [ ] Batch processing loops → `executeBatch`
- [ ] Sequential operations → `executeWithPhases`
- [ ] Config loading logic → `executeWithConfiguration`
- [ ] Dry run conditions → `executeWithDryRun`
- [ ] Validation logic → `executeWithValidation`
- [ ] File operations → `executeFileSystemOperations`

### 2. Add Command Context

```typescript
// Before
async function myOperation(options: Options): Promise<Result<void>>

// After
async function myOperation(options: Options, context: CommandContext): Promise<Result<void>>
```

### 3. Update Error Handling

```typescript
// Before
return err(new Error('Something failed'))

// After
return err(createCliError('operation_failed', 'Something failed'))
```

### 4. Add Progress Tracking

```typescript
// Utilize context.logger for progress
context.logger.info('Starting operation...')
context.logger.success('Operation completed')
```

## Benefits After Migration

1. **Reduced Boilerplate**: ~50% less error checking code
2. **Consistent Progress**: Automatic progress tracking
3. **Better Error Context**: Errors include operation context
4. **Dry Run Support**: Built-in preview mode
5. **Atomic Operations**: Automatic rollback for file operations

## Common Pitfalls

### Don't Mix Patterns

```typescript
// ❌ Bad: Mixing manual and pattern-based
const result = await executeBatch(items, processor, options, context)
if (!result.success) {
  // Wrong property!
  return err(new Error('Failed'))
}

// ✅ Good: Use Result methods
const result = await executeBatch(items, processor, options, context)
if (result.isErr()) {
  return result
}
```

### Remember Context

```typescript
// ❌ Bad: Forgetting context parameter
await executeWithPhases(phases, data)

// ✅ Good: Include context
await executeWithPhases(phases, data, context)
```

## Next Steps

- Review [Command Execution Patterns](/packages/cli/docs/how-to/use-result-pipelines)
- Study [API Reference](/packages/cli/docs/reference/flow-control)
- Explore [Command Testing](/packages/cli/docs/how-to/test-cli-applications)
