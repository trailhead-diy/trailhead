# @trailhead/cli

> Functional CLI framework for building production-ready command-line applications with TypeScript

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Modern CLI framework built with functional programming principles, explicit Result-based error handling, and comprehensive testing utilities. No exceptions, no classes—just pure functions and immutable data.

## Why Choose @trailhead/cli?

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
# Install from npm
pnpm add @trailhead/cli

# Or generate a new project
npx @trailhead/create-cli my-cli
```

## Quick Example

```typescript
import { createCommand } from '@trailhead/cli/command'
import { ok } from '@trailhead/core'

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

## Key Features

- **Result-based error handling** - Explicit error paths with Result types instead of exceptions
- **Functional programming** - Pure functions, immutable data, composition patterns
- **Testing utilities** - Built-in mocks, assertions, and test contexts
- **Performance optimized** - Caching, streaming APIs, and optimized command processing
- **Type-safe** - Full TypeScript support with strict type checking

## Core Concepts

### Result Types - No Exceptions

```typescript
import { Result, ok, err } from '@trailhead/core'

// Functions return Results instead of throwing
const deployApp = async (env: string): Promise<Result<string, Error>> => {
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
if (result.isOk()) {
  console.log(result.value)
} else {
  console.error('Deploy failed:', result.error.message)
}
```

### Command Composition

```typescript
import { createCommand, executeWithPhases } from '@trailhead/cli/command'

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

### Main Export (`@trailhead/cli`)

The main export provides CLI creation and basic Result types:

```typescript
import { createCLI, ok, err } from '@trailhead/cli'
import type { Result, CoreError } from '@trailhead/cli'

// Create a CLI application
const cli = createCLI({
  name: 'my-app',
  version: '1.0.0',
  commands: [
    /* your commands */
  ],
})
```

**Note**: For extended Result utilities, use `@trailhead/core` directly.

### Command (`@trailhead/cli/command`)

Command creation, validation, and execution patterns

```typescript
import {
  createCommand,
  executeWithPhases,
  executeWithValidation,
  executeWithDryRun,
} from '@trailhead/cli/command'

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

### Testing (`@trailhead/cli/testing`)

Comprehensive testing utilities with mocks and assertions

```typescript
import {
  createTestContext,
  createMockFileSystem,
  expectSuccess,
  expectError,
} from '@trailhead/cli/testing'

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

### Progress (`@trailhead/cli/progress`)

Progress tracking with enhanced capabilities

```typescript
import { createProgressTracker } from '@trailhead/cli/progress'

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

### Utils (`@trailhead/cli/utils`)

Utilities for styling, package detection, and more

```typescript
import {
  consola,
  colors,
  createSpinner,
  detectPackageManager,
  createDefaultLogger,
} from '@trailhead/cli/utils'

// Rich terminal output with consola
consola.success('✓ Build completed')
consola.error('✗ Deploy failed')

// Or use color utilities
console.log(colors.green('✓ Build completed'))
console.log(colors.red('✗ Deploy failed'))

// Spinners for long operations
const spinner = createSpinner('Deploying...')
spinner.start()
await deploy()
spinner.stop('Deployed successfully')

// Structured logging
const logger = createDefaultLogger(true) // verbose mode
logger.info('Starting build...')
logger.success('Build completed')
```

## Advanced Features

### Multi-Phase Execution

For complex workflows that need progress tracking:

```typescript
import { executeWithPhases } from '@trailhead/cli/command'

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
import { createInteractiveCommand } from '@trailhead/cli/command'

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
import { fs } from '@trailhead/fs'

// Use @trailhead/fs package for file operations

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
import { createTestRunner } from '@trailhead/cli/testing'

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
import { createMockFileSystem } from '@trailhead/cli/testing'

test('processes configuration file', async () => {
  const mockFs = createMockFileSystem({
    '/project/config.json': JSON.stringify({ name: 'test-project' }),
    '/project/src/': null, // directory
    '/project/src/index.ts': 'export default "hello";',
  })

  const context = createTestContext({ fileSystem: mockFs })
  const result = await processProject('/project', context)

  expect(result.isOk()).toBe(true)
  expect(mockFs.exists('/project/dist/index.js')).toBe(true)
})
```

## Documentation

### API Reference

- **[API Documentation](../../docs/@trailhead.cli.md)** - Complete API reference with examples and type information

### Guides & Tutorials

- **[Getting Started Guide](./docs/tutorials/getting-started.md)** - Build your first CLI application
- **[Complete CLI Tutorial](./docs/tutorials/build-complete-cli.md)** - Advanced patterns and best practices
- **[Architecture Overview](./docs/explanation/architecture.md)** - Design principles and patterns

### How-To Guides

- **[Error Handling](./docs/how-to/handle-errors-in-cli.md)** - Result-based error handling patterns
- **[Testing CLI Applications](./docs/how-to/test-cli-applications.md)** - Comprehensive testing strategies
- **[Command Enhancements](./docs/how-to/migrate-to-command-enhancements.md)** - Advanced command patterns

## License

MIT © [Esteban URL](https://github.com/esteban-url)
