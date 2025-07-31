---
type: tutorial
title: 'Build Your First CLI Application'
description: 'Create a working CLI tool in 15 minutes using functional programming'
prerequisites:
  - 'Node.js 18+ installed'
  - 'Basic TypeScript knowledge'
  - 'Understanding of async/await'
related:
  - ../reference/command.md
  - ../reference/testing.md
  - /docs/how-to/apply-functional-patterns.md
---

# Build Your First CLI Application

In this tutorial, you'll build a simple greeting CLI application using @esteban-url/cli. By the end, you'll have a working CLI tool that greets users and understand the framework's core concepts.

## What You'll Build

A CLI application called `greeter` that:

- Takes a name as input
- Provides optional formatting options
- Uses Result types for error handling
- Includes help documentation

## Before You Begin

Make sure you have:

- Node.js 18.0.0 or higher
- TypeScript 5.0 or higher
- Basic understanding of TypeScript and async/await

This tutorial takes approximately 15 minutes to complete.

## Installation

### For External Projects

Install directly from GitHub:

```bash
# Using pnpm (recommended)
pnpm add @esteban-url/cli

# Using npm
npm install @esteban-url/cli
```

### For Monorepo Development

```bash
pnpm add @esteban-url/cli --workspace
```

## Important: Import Strategy

@esteban-url/cli uses **subpath exports** for optimal tree-shaking. This means:

- The main export (`@esteban-url/cli`) contains only Result types and `createCLI`
- All other functionality must be imported from specific subpaths
- This keeps your bundle size minimal

See the [Import Patterns Guide](../how-to/import-patterns.md) for complete details.

## Your First CLI Application

Let's build a simple greeting CLI that demonstrates core concepts.

### 1. Create Commands

Create `src/commands/greet.ts`:

```typescript
import { ok } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import type { CommandContext } from '@esteban-url/cli/command'

export const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: [
    {
      name: 'name',
      alias: 'n',
      description: 'Name to greet',
      type: 'string',
      default: 'World',
    },
  ],
  action: async (options, context: CommandContext) => {
    context.logger.info(`Hello, ${options.name}!`)
    return ok(undefined)
  },
})
```

### 2. Create the CLI Application

Create `src/index.ts`:

```typescript
#!/usr/bin/env node
import { createCLI } from '@esteban-url/cli'
import { greetCommand } from './commands/greet'

const cli = createCLI({
  name: 'hello-cli',
  version: '1.0.0',
  description: 'My first CLI application',
  commands: [greetCommand],
})

// Run the CLI with command line arguments
cli.run(process.argv)
```

### 4. Run Your CLI

```bash
# Development
npx tsx src/index.ts greet --name World

# After building
node dist/index.js greet --name World
```

## Key Concepts

### Result Types

@esteban-url/trailhead-cli uses Result types for explicit error handling:

```typescript
import { ok, err } from '@esteban-url/cli'

// Success
return ok(data)

// Error
return err(new Error('Something went wrong'))
```

### Command Context

Every command receives a context with useful utilities:

```typescript
import type { CommandContext } from '@esteban-url/cli/command'

async function myAction(options: any, context: CommandContext) {
  // Logger for output
  context.logger.info('Processing...')
  context.logger.success('Done!')
  context.logger.error('Failed!')

  // File system access via fs package
  // Note: Use @repo/fs package for file operations
  const result = await context.fs.readFile('config.json')

  // Project root directory
  console.log(context.projectRoot)
}
```

## Next Steps

### Add File Operations

```typescript
import { ok, err } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { fs } from '@repo/fs'

const readCommand = createCommand({
  name: 'read',
  description: 'Read a file',
  options: [
    {
      name: 'file',
      alias: 'f',
      type: 'string',
      required: true,
      description: 'File to read',
    },
  ],
  action: async (options, context) => {
    const result = await fs.readFile(options.file)

    if (result.isErr()) {
      return err(new Error(`Failed to read: ${result.error.message}`))
    }

    context.logger.info(result.value)
    return ok(undefined)
  },
})
```

### Add Interactive Prompts

```typescript
import { ok } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { prompt, select } from '@esteban-url/cli/prompts'

const initCommand = createCommand({
  name: 'init',
  description: 'Initialize a project',
  action: async (options, context) => {
    const name = await prompt({
      message: 'Project name:',
      default: 'my-project',
    })

    const template = await select({
      message: 'Choose a template:',
      choices: ['basic', 'advanced', 'minimal'],
    })

    context.logger.success(`Created ${name} with ${template} template`)
    return ok(undefined)
  },
})
```

### File Processing with @repo/fs

Use the file system package for file operations:

```typescript
import { ok, err } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { fs } from '@repo/fs'

const processCommand = createCommand({
  name: 'process',
  description: 'Process a data file',
  options: [
    { name: 'input', alias: 'i', type: 'string', required: true, description: 'Input file' },
    { name: 'output', alias: 'o', type: 'string', description: 'Output file' },
    { name: 'format', alias: 'f', type: 'string', description: 'Output format' },
  ],
  action: async (options, context) => {
    // Validate input file exists
    const exists = await fs.exists(options.input)
    if (exists.isErr()) {
      return err(new Error(`Input file does not exist: ${options.input}`))
    }

    // Read and process file
    const data = await parseFile(options.input, options.format)

    if (options.output) {
      const writeResult = await fs.writeFile(options.output, JSON.stringify(data))
      if (writeResult.isErr()) {
        return err(new Error(`Failed to write output: ${writeResult.error.message}`))
      }
    }

    return ok(undefined)
  },
})
```

### Add Configuration

```typescript
import { createConfigManager } from '@repo/config'
import { z } from 'zod'

const configSchema = z.object({
  name: z.string(),
  version: z.string(),
  settings: z.object({
    verbose: z.boolean().default(false),
    color: z.boolean().default(true),
  }),
})

const config = createConfigManager(configSchema)

// In your command
const result = await config.load()
if (result.isOk()) {
  console.log(result.value.name)
}
```

## Complete Example

Here's a minimal but complete CLI application:

```typescript
#!/usr/bin/env node
import { ok, err, createCLI } from '@esteban-url/cli'
import { createCommand } from '@esteban-url/cli/command'
import { fs } from '@repo/fs'
import { prompt } from '@esteban-url/cli/prompts'

const mainCommand = createCommand({
  name: 'process',
  description: 'Process a file interactively',
  action: async (options, context) => {
    // Get filename
    const filename = await prompt({
      message: 'Which file to process?',
      validate: (input) => input.length > 0,
    })

    // Read file
    const result = await fs.readFile(filename)

    if (result.isErr()) {
      context.logger.error(`Failed to read ${filename}`)
      return err(result.error)
    }

    // Process content
    const lines = result.value.split('\n').length
    context.logger.success(`Processed ${lines} lines from ${filename}`)

    return ok(undefined)
  },
})

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'A complete example CLI',
  commands: [mainCommand],
})

cli.run(process.argv)
```

## Learn More

- [Import Patterns](./how-to/import-patterns.md) - Master the import system
- [Command Reference](./reference/command.md) - All command options
- [Testing Guide](./how-to/testing-guide.md) - Test your CLI
- [API Reference](../reference/) - Complete API documentation
