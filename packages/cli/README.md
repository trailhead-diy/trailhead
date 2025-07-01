# @trailhead/cli

A functional CLI framework for building robust, testable command-line applications with TypeScript.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

## Overview

@trailhead/cli provides a modern foundation for CLI applications using functional programming patterns, explicit error handling with Result types, and comprehensive testing utilities.

## 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Build your first CLI in minutes
- **[API Reference](./docs/api)** - Complete module documentation
- **[Guides](./docs/guides)** - In-depth topics and patterns
- **[Examples](./docs/examples)** - Real-world applications

## Features

- 🎯 **Result-based error handling** - No exceptions, explicit error propagation
- 🔧 **Functional programming** - Pure functions, immutability, composition
- 🧩 **Modular architecture** - Tree-shakeable subpath exports
- 📦 **Built-in abstractions** - FileSystem, Configuration, Validation
- 🧪 **Testing utilities** - Mocks, test contexts, runners
- 🎨 **Beautiful output** - Chalk styling, Ora spinners, progress tracking
- 🔍 **Full type safety** - Strict TypeScript with comprehensive types

## Installation

### For Monorepo Development

When working within the Trailhead monorepo:

```bash
# From within the monorepo
pnpm add @trailhead/cli --workspace

# Or in package.json
{
  "dependencies": {
    "@trailhead/cli": "workspace:*"
  }
}
```

### For External Projects

Since this package is private and not published to NPM, install directly from GitHub:

```bash
# Install specific package from monorepo
pnpm add github:esteban-url/trailhead#packages/cli

# Or with npm
npm install github:esteban-url/trailhead#packages/cli

# In package.json
{
  "dependencies": {
    "@trailhead/cli": "github:esteban-url/trailhead#packages/cli"
  }
}
```

> **Note**: You may need authentication to access the private repository. Ensure you have proper GitHub access configured.

## Quick Start

```typescript
import { createCLI } from '@trailhead/cli'
import { ok, err } from '@trailhead/cli/core'
import { createCommand } from '@trailhead/cli/command'

// Create a CLI application
const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
})

// Create a command
const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: [
    { name: 'name', alias: 'n', type: 'string', required: true }
  ],
  action: async (options, context) => {
    context.logger.info(`Hello, ${options.name}!`)
    return ok(undefined)
  },
})

// Add command and run
cli.addCommand(greetCommand)
cli.run(process.argv)
```

## Module Exports

### Core (`@trailhead/cli/core`)

Result types and error handling utilities:

```typescript
import { ok, err, isOk, isErr } from '@trailhead/cli/core'
import type { Result } from '@trailhead/cli/core'

// Create results
const success = ok(42)
const failure = err(new Error('Something went wrong'))

// Check results
if (isOk(result)) {
  console.log(result.value)
}
```

### Command (`@trailhead/cli/command`)

Command creation and execution patterns:

```typescript
import { createCommand, executeWithPhases } from '@trailhead/cli/command'
import type { Command, CommandContext } from '@trailhead/cli/command'

// Phased execution
const phases = [
  { name: 'Validate', execute: validatePhase },
  { name: 'Process', execute: processPhase },
  { name: 'Complete', execute: completePhase },
]

const result = await executeWithPhases(phases, data, context)
```

### FileSystem (`@trailhead/cli/filesystem`)

Abstract filesystem operations:

```typescript
import { createFileSystem } from '@trailhead/cli/filesystem'
import type { FileSystem } from '@trailhead/cli/filesystem'

const fs = createFileSystem()

// All operations return Results
const result = await fs.readFile('config.json')
if (result.success) {
  const content = result.value
}
```

### Configuration (`@trailhead/cli/config`)

Type-safe configuration management:

```typescript
import { defineConfig, loadConfig } from '@trailhead/cli/config'
import { z } from 'zod'

const configSchema = z.object({
  api: z.object({
    endpoint: z.string().url(),
    timeout: z.number().default(30000),
  }),
})

const config = defineConfig(configSchema)
const result = await config.load()
```

### Prompts (`@trailhead/cli/prompts`)

Interactive user prompts:

```typescript
import { prompt, select, confirm } from '@trailhead/cli/prompts'

const name = await prompt({
  message: 'What is your name?',
  validate: (value) => value.length > 0 || 'Name is required',
})

const framework = await select({
  message: 'Choose a framework',
  choices: ['React', 'Vue', 'Angular'],
})
```

### Testing (`@trailhead/cli/testing`)

Comprehensive testing utilities:

```typescript
import { createTestContext, mockFileSystem } from '@trailhead/cli/testing'

describe('MyCommand', () => {
  it('should execute successfully', async () => {
    const fs = mockFileSystem({
      'config.json': '{"key": "value"}',
    })

    const context = createTestContext({ filesystem: fs })
    const result = await myCommand.execute(context)

    expect(result.success).toBe(true)
  })
})
```

## Architecture

The framework follows functional programming principles:

- **No classes** - Pure functions and data
- **Immutable data** - All modifications return new objects
- **Explicit errors** - Result types instead of exceptions
- **Dependency injection** - All I/O through context
- **Composition** - Build complex operations from simple functions

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Type checking
pnpm types

# Linting
pnpm lint
```

## Best Practices

1. **Always return Results** - Never throw exceptions
2. **Use functional composition** - Combine small, pure functions
3. **Inject dependencies** - Pass FileSystem, Logger, etc. through context
4. **Validate early** - Use validation pipelines for input
5. **Provide rich errors** - Include context and recovery suggestions

## Basic CLI Application

```typescript
import { createCLI } from '@trailhead/cli'
import { createCommand } from '@trailhead/cli/command'
import { createFileSystem } from '@trailhead/cli/filesystem'
import { ok, err } from '@trailhead/cli/core'

const cli = createCLI({
  name: 'my-app',
  version: '1.0.0',
  description: 'My CLI application',
})

// Example: Config command
const configCommand = createCommand({
  name: 'config',
  description: 'Manage configuration',
  subcommands: [
    createCommand({
      name: 'get',
      description: 'Get config value',
      options: [
        { name: 'key', alias: 'k', type: 'string', required: true }
      ],
      action: async (options, context) => {
        const fs = createFileSystem()
        const result = await fs.readFile('./config.json')
        
        if (!result.success) {
          return err(new Error('Config file not found'))
        }
        
        const config = JSON.parse(result.value)
        const value = config[options.key]
        
        if (value === undefined) {
          return err(new Error(`Key "${options.key}" not found`))
        }
        
        context.logger.info(`${options.key}: ${value}`)
        return ok(undefined)
      }
    }),
    createCommand({
      name: 'set',
      description: 'Set config value',
      options: [
        { name: 'key', alias: 'k', type: 'string', required: true },
        { name: 'value', alias: 'v', type: 'string', required: true }
      ],
      action: async (options, context) => {
        const fs = createFileSystem()
        
        // Read existing config or create new
        const readResult = await fs.readFile('./config.json')
        const config = readResult.success 
          ? JSON.parse(readResult.value)
          : {}
        
        // Update config
        config[options.key] = options.value
        
        // Write back
        const writeResult = await fs.writeFile(
          './config.json', 
          JSON.stringify(config, null, 2)
        )
        
        if (!writeResult.success) {
          return writeResult
        }
        
        context.logger.success(`Set ${options.key} = ${options.value}`)
        return ok(undefined)
      }
    })
  ]
})

// Add commands to CLI
cli
  .addCommand(configCommand)
  .addCommand(
    createCommand({
      name: 'init',
      description: 'Initialize project',
      options: [
        { name: 'template', alias: 't', type: 'string', default: 'default' },
        { name: 'force', alias: 'f', type: 'boolean', default: false },
      ],
      action: async (options, context) => {
        const fs = createFileSystem()
        
        const exists = await fs.exists('./config.json')
        if (exists.success && exists.value && !options.force) {
          return err(new Error('Already initialized. Use --force to overwrite.'))
        }

        const config = { template: options.template, created: new Date() }
        const result = await fs.writeFile('./config.json', JSON.stringify(config, null, 2))
        
        if (!result.success) {
          return err(new Error(`Failed: ${result.error.message}`))
        }

        context.logger.success('Initialized successfully!')
        return ok(undefined)
      },
    })
  )

// Run the CLI
cli.run(process.argv)
```

## License

MIT - See [root LICENSE](../../LICENSE)