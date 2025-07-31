---
type: tutorial
title: 'Build Your First CLI Application'
description: 'Create a working CLI tool in 15 minutes using functional programming'
prerequisites:
  - 'Node.js 18+ installed'
  - 'Basic TypeScript knowledge'
  - 'Understanding of async/await'
related:
  - /packages/cli/docs/how-to/add-file-operations
  - /packages/cli/docs/how-to/add-interactive-prompts
  - /packages/cli/docs/how-to/add-configuration
  - /packages/cli/docs/reference/command
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

- The main export (`@esteban-url/cli`) contains only `createCLI` and basic Result types (`ok`, `err`)
- All other functionality must be imported from specific subpaths
- Extended Result utilities should be imported from `@esteban-url/core`
- File operations should use `@esteban-url/fs` directly
- This keeps your bundle size minimal

See the [Import Patterns Guide](/packages/cli/docs/how-to/import-patterns.md)for complete details.

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

## What You've Learned

You've successfully built your first CLI application! You now understand:

- How to create commands with options
- How to use Result types for error handling
- How to access command context utilities
- How to structure a basic CLI application

## Next Steps

Now that you've completed this tutorial, explore these guides to extend your CLI:

- [How to Add File Operations](/packages/cli/docs/how-to/add-file-operations.md)- Read, write, and process files
- [How to Add Interactive Prompts](/packages/cli/docs/how-to/add-interactive-prompts.md)- Make your CLI interactive
- [How to Add Configuration](/packages/cli/docs/how-to/add-configuration.md)- Add configuration management
- [How to Test CLI Applications](/packages/cli/docs/how-to/test-cli-applications.md)- Write tests for your CLI

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

- [Import Patterns](/packages/cli/docs/how-to/import-patterns.md)- Master the import system
- [Command Reference](/packages/cli/docs/reference/command.md)- All command options
- [Testing Guide](/packages/cli/docs/how-to/test-cli-applications.md)- Test your CLI
- [API Reference](/packages/cli/docs/reference/command.md)- Complete API documentation
