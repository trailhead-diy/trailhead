# @esteban-url/cli

> Functional CLI framework for building production-ready command-line applications with TypeScript

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/esteban-url/trailhead/blob/main/LICENSE)

A modern CLI framework built with functional programming principles, explicit Result-based error handling, and comprehensive testing utilities. No exceptions, no classes in public API—just pure functions and immutable data.

## Why Choose @esteban-url/cli?

### 🎯 **Explicit Error Handling**

Uses Result types instead of exceptions. Every error path is explicit at compile time, making your CLI applications more reliable and easier to debug.

### 🧪 **Testing First**

Comprehensive testing utilities built-in with 50% boilerplate reduction. Mocks, assertions, and test contexts for CLI applications.

### ⚡ **Performance Optimized**

Caching systems, streaming APIs, and optimized command processing for production workloads.

### 🔧 **Functional Design**

Pure functions, immutable data, and composition patterns throughout. No classes, no side effects, just predictable behavior.

## Quick Start

### Installation

```bash
# Install from GitHub Packages (private repo)
pnpm add @esteban-url/cli

# Or generate a new project
npx create-cli my-cli
```

### Basic CLI in 30 Seconds

```typescript
import { createCommand } from '@esteban-url/cli/command'
import { ok, err } from '@esteban-url/core'

const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: {
    name: {
      type: 'string',
      description: 'Name to greet',
      required: true,
    },
  },
  action: async ({ name }) => {
    console.log(`Hello, ${name}!`)
    return ok(undefined)
  },
})

// Run your command
await greetCommand.execute(['--name', 'World'])
```

## Core Concepts

### Result Types - No Exceptions

```typescript
import { Result, ok, err } from '@esteban-url/core'

// Functions return Results instead of throwing
async const deployApp = async (env: string): Promise<Result<string, Error>> => {
  if (!env) {
    return err(new Error('Environment required'))
  }

  // Simulate deployment
  if (env === 'production') {
    return ok('Deployed to production successfully')
  }

  return err(new Error(`Unknown environment: ${env}`))
}

// Handle results explicitly
const result = await deployApp('staging')
if (result.isok()) {
  console.log(result.value)
} else {
  console.error('Deploy failed:', result.error.message)
}
```

### Command Composition

```typescript
import { createCommand, executeWithPhases } from '@esteban-url/cli/command'

const buildCommand = createCommand({
  name: 'build',
  description: 'Build and deploy application',
  action: async (options, context) => {
    // Multi-phase execution with progress tracking
    return executeWithPhases(
      [
        {
          name: 'validate',
          action: async () => validateProject(context),
        },
        {
          name: 'build',
          action: async () => buildProject(context),
        },
        {
          name: 'test',
          action: async () => runTests(context),
        },
        {
          name: 'deploy',
          action: async () => deployProject(options.env, context),
        },
      ],
      {},
      context
    )
  },
})
```

## Module Reference

### Main Export (`@esteban-url/cli`)

The main export provides CLI creation and basic Result types:

```typescript
import { createCLI, ok, err } from '@esteban-url/cli'
import type { Result, CoreError } from '@esteban-url/cli'

// Create a CLI application
const cli = createCLI({
  name: 'my-app',
  version: '1.0.0',
  commands: [
    /* your commands */
  ],
})
```

**Note**: For extended Result utilities, use `@esteban-url/core` directly.

### Command (`@esteban-url/cli/command`)

Command creation, validation, and execution patterns

```typescript
import {
  createCommand,
  executeWithPhases,
  executeWithValidation,
  executeWithDryRun,
} from '@esteban-url/cli/command'

// Advanced command with validation
const processCommand = createCommand({
  name: 'process',
  validation: {
    inputFile: (value) => (fs.existsSync(value) ? ok(value) : err(new Error('File not found'))),
    outputDir: (value) =>
      value.length > 0 ? ok(value) : err(new Error('Output directory required')),
  },
  action: async (options, context) => {
    return executeWithDryRun(
      async () => {
        // Process files
        return processFiles(options.inputFile, options.outputDir)
      },
      options.dryRun,
      context
    )
  },
})
```

### Testing (`@esteban-url/cli/testing`)

Comprehensive testing utilities with mocks and assertions

```typescript
import {
  createTestContext,
  createMockFileSystem,
  expectSuccess,
  expectError,
} from '@esteban-url/cli/testing'

describe('my command', () => {
  test('should process files successfully', async () => {
    const mockFs = createMockFileSystem({
      '/input.txt': 'test content',
      '/output/': null, // directory
    })

    const context = createTestContext({ fileSystem: mockFs })
    const result = await myCommand.execute(['--input', '/input.txt'], context)

    expectSuccess(result)
    expect(mockFs.readFile('/output/processed.txt')).toBeDefined()
  })
})
```

### Progress (`@esteban-url/cli/progress`)

Progress tracking with enhanced capabilities

```typescript
import { createProgressTracker } from '@esteban-url/cli/progress'

const progress = createProgressTracker({
  total: 100,
  format: 'Processing [{bar}] {percentage}% | ETA: {eta}s',
})

// Use with async operations
for (let i = 0; i < 100; i++) {
  await processItem(i)
  progress.increment()
}
```

### Utils (`@esteban-url/cli/utils`)

Utilities for styling, package detection, and more

```typescript
import { chalk, createSpinner, detectPackageManager, createLogger } from '@esteban-url/cli/utils'

// Rich terminal output
console.log(chalk.success('✓ Build completed'))
console.log(chalk.error('✗ Deploy failed'))

// Spinners for long operations
const spinner = createSpinner('Deploying...')
spinner.start()
await deploy()
spinner.stop('Deployed successfully')
```

## Advanced Features

### Multi-Phase Execution

For complex workflows that need progress tracking:

```typescript
import { executeWithPhases } from '@esteban-url/cli/command'

const phases = [
  {
    name: 'setup',
    weight: 10,
    action: async (data, context) => setupEnvironment(context),
  },
  {
    name: 'build',
    weight: 60,
    action: async (data, context) => buildProject(context),
  },
  {
    name: 'deploy',
    weight: 30,
    action: async (data, context) => deployProject(data.env, context),
  },
]

const result = await executeWithPhases(phases, { env: 'production' }, context)
```

### Interactive Prompts

```typescript
import { createInteractiveCommand } from '@esteban-url/cli/command'

const setupCommand = createInteractiveCommand({
  name: 'setup',
  prompts: async (options) => {
    const name = await input('Project name:', { default: 'my-project' })
    const framework = await select('Framework:', {
      choices: ['react', 'vue', 'svelte'],
    })
    return { name, framework }
  },
  action: async (answers, context) => {
    return generateProject(answers, context)
  },
})
```

### File System Operations

```typescript
import { fs } from '@esteban-url/fs'

// Use @esteban-url/fs package for file operations

// All operations return Results
const readResult = await fs.readFile('config.json')
if (readResult.isOk()) {
  const config = JSON.parse(readResult.value)
  console.log('Config loaded:', config)
} else {
  console.error('Failed to read config:', readResult.error.message)
}

// File operations with Result types
const copyResult = await fs.copy('src/template.tsx', 'dist/template.tsx')
if (copyResult.isErr()) {
  console.error('Copy failed:', copyResult.error.message)
}
```

## Testing Best Practices

### High-ROI Tests

Focus on testing business logic and user interactions:

```typescript
import { createTestRunner } from '@esteban-url/cli/testing'

describe('build command', () => {
  const testRunner = createTestRunner()

  test('builds project successfully', async () => {
    const result = await testRunner.runCommand('build', ['--env', 'production'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Build completed')
    expect(result.files).toInclude('dist/index.js')
  })

  test('fails with invalid environment', async () => {
    const result = await testRunner.runCommand('build', ['--env', 'invalid'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Unknown environment')
  })
})
```

### Mock File System

```typescript
import { createMockFileSystem } from '@esteban-url/cli/testing'

test('processes configuration file', async () => {
  const mockFs = createMockFileSystem({
    '/project/config.json': JSON.stringify({ name: 'test-project' }),
    '/project/src/': null, // directory
    '/project/src/index.ts': 'export default "hello";',
  })

  const context = createTestContext({ fileSystem: mockFs })
  const result = await processProject('/project', context)

  expect(result.isok()).toBe(true)
  expect(mockFs.exists('/project/dist/index.js')).toBe(true)
})
```

## Performance Features

### Command Caching

Commands automatically cache expensive operations:

```typescript
const command = createCommand({
  name: 'analyze',
  caching: {
    enabled: true,
    keyFn: (options) => `${options.file}-${options.mode}`,
    ttl: 300000, // 5 minutes
  },
  action: async (options) => {
    // Expensive analysis only runs when cache misses
    return analyzeFile(options.file, options.mode)
  },
})
```

### Streaming Operations

For large file processing:

```typescript
import { createProcessingStream } from '@esteban-url/cli/command'

const processLargeFile = createCommand({
  name: 'process-large',
  action: async (options, context) => {
    const stream = createProcessingStream({
      chunkSize: 1024 * 64, // 64KB chunks
      transform: (chunk) => processChunk(chunk),
    })

    return stream.processFile(options.inputFile, options.outputFile)
  },
})
```

## Development Commands

```bash
# Build the package
pnpm build

# Run tests with coverage
pnpm test

# Watch mode for development
pnpm test:watch

# Type checking
pnpm types

# Linting (dual setup)
pnpm lint              # Fast oxlint
pnpm lint:neverthrow   # Result type validation

# Run all tests
pnpm test

# Complete validation
pnpm validate
```

## Examples

Check out the [documentation](./docs/README.md)for comprehensive guides and API references.

## Migration Guide

### From Commander.js

**Before (Legacy Pattern):**

```typescript
// Commander.js with exception-based error handling
program
  .command('deploy')
  .option('-e, --env <env>', 'Environment')
  .action((options) => {
    if (!options.env) {
      throw new Error('Environment required') // ❌ Exception-based
    }
    deploy(options.env) // ❌ No error handling
  })
```

**After (Modern Pattern):**

```typescript
// @esteban-url/cli with Result-based error handling
const deployCommand = createCommand({
  name: 'deploy',
  options: {
    env: { type: 'string', required: true, description: 'Environment' },
  },
  action: async ({ env }) => {
    const result = await deploy(env)
    return result // ✅ Returns Result<T, E>
  },
})
```

### From Yargs

**Before (Legacy Pattern):**

```typescript
// Yargs with try/catch error handling
yargs.command(
  'build [env]',
  'Build project',
  (yargs) => yargs.positional('env', { type: 'string' }),
  (argv) => {
    try {
      build(argv.env) // ❌ Exception-based
    } catch (error) {
      console.error(error.message) // ❌ Manual error handling
      process.exit(1) // ❌ Hard exit
    }
  }
)
```

**After (Modern Pattern):**

```typescript
// @esteban-url/cli with Result-based error handling
const buildCommand = createCommand({
  name: 'build',
  arguments: [{ name: 'env', type: 'string', description: 'Target environment' }],
  action: async ({ env }) => {
    return build(env) // ✅ Returns Result<T, E>
  },
})
```

## Architecture Principles

1. **Functional Programming** - Pure functions, immutable data, composition
2. **Explicit Error Handling** - Result types instead of exceptions
3. **Dependency Injection** - All I/O through context for testability
4. **Performance First** - Caching, streaming, and optimization built-in
5. **Developer Experience** - Rich tooling and comprehensive testing utilities

## License

MIT - see [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE) for details.
