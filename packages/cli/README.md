# @trailhead/cli v4.0.0

> Functional CLI framework built on citty with Result-based error handling

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/trailhead-diy/trailhead/blob/main/LICENSE)

Modern CLI framework combining [citty](https://github.com/unjs/citty)'s elegant API with functional programming principles and explicit Result-based error handling.

## What's New in v4.0.0

🚀 **Migrated to citty** - Smaller bundle, better TypeScript inference, cleaner API
🎯 **Simpler API** - `defineCommand` + `runMain` replace old command builders
📦 **15% smaller** - Citty's mri parser is more lightweight than commander
🧪 **Streamlined testing** - Commands are functions - test them directly

## Quick Start

```bash
pnpm add @trailhead/cli@4
```

### Basic Example

```typescript
import { defineCommand, runMain } from '@trailhead/cli/command'
import { ok } from '@trailhead/core'

const cli = defineCommand({
  meta: {
    name: 'greet',
    version: '1.0.0',
    description: 'Greet someone',
  },
  args: {
    name: {
      type: 'string',
      description: 'Name to greet',
      required: true,
    },
    loud: {
      type: 'boolean',
      description: 'Use loud greeting',
      alias: 'l',
    },
  },
  run: async (args, context) => {
    const greeting = args.loud ? `HELLO ${args.name.toUpperCase()}!!!` : `Hello, ${args.name}!`

    context.logger.info(greeting)
    return ok(undefined)
  },
})

runMain(cli)
```

Run it:

```bash
greet --name World
# Hello, World!

greet --name World --loud
# HELLO WORLD!!!
```

## Key Features

- **🏗️ Built on citty** - Modern, lightweight CLI framework from UnJS
- **🎯 Result types** - Explicit error handling, no exceptions
- **🔧 Functional** - Pure functions, immutable data
- **📝 Auto-generated help** - Citty creates beautiful help text automatically
- **🧪 Easy testing** - Commands are async functions - test directly
- **🪝 CommandContext** - Inject logger, fs, project metadata

## Core Concepts

### Commands with Result Types

Commands return `Result<void, CoreError>` for explicit error handling:

```typescript
import { defineCommand } from '@trailhead/cli/command'
import { ok, err, createCoreError } from '@trailhead/core'

const deploy = defineCommand({
  meta: {
    name: 'deploy',
    description: 'Deploy application',
  },
  args: {
    env: {
      type: 'string',
      required: true,
      description: 'Environment (staging|production)',
    },
  },
  run: async (args, context) => {
    if (!['staging', 'production'].includes(args.env)) {
      return err(
        createCoreError('INVALID_ENV', 'CLI_ERROR', `Invalid environment: ${args.env}`, {
          recoverable: true,
        })
      )
    }

    context.logger.info(`Deploying to ${args.env}...`)
    // ... deployment logic

    return ok(undefined)
  },
})
```

### CommandContext

Every command receives a context object with utilities:

```typescript
run: async (args, context) => {
  // Logging
  context.logger.info('Starting...')
  context.logger.error('Failed!')
  context.logger.debug('Details...') // Only shown with -v

  // Filesystem (Result-based)
  const fileResult = await context.fs.readFile('config.json')
  if (fileResult.isErr()) {
    return err(fileResult.error)
  }

  // Project metadata
  console.log('Working in:', context.projectRoot)
  console.log('Verbose:', context.verbose)

  // Parsed arguments from citty
  console.log('Args:', context.args)

  return ok(undefined)
}
```

### Subcommands

```typescript
import { defineCommand, runMain } from '@trailhead/cli/command'

const listCmd = defineCommand({
  meta: { name: 'list', description: 'List items' },
  args: {},
  run: async (args, context) => {
    context.logger.info('Listing...')
    return ok(undefined)
  },
})

const addCmd = defineCommand({
  meta: { name: 'add', description: 'Add item' },
  args: {
    item: { type: 'positional', required: true },
  },
  run: async (args, context) => {
    context.logger.info(`Adding: ${args.item}`)
    return ok(undefined)
  },
})

const cli = defineCommand({
  meta: {
    name: 'todo',
    version: '1.0.0',
    description: 'Todo CLI',
  },
  subCommands: {
    list: listCmd,
    add: addCmd,
  },
})

runMain(cli)
```

## Testing

Commands are async functions - test them directly:

```typescript
import { describe, it, expect } from 'vitest'
import { createMockContext } from '@trailhead/cli/testing'
import { greetCommand } from './commands/greet.js'

describe('greet command', () => {
  it('greets user', async () => {
    const ctx = createMockContext()
    const result = await greetCommand.run({ _: ['World'], name: 'World' }, ctx)

    expect(result.isOk()).toBe(true)
    expect(ctx.logger.logs).toContainEqual({
      level: 'info',
      message: 'Hello, World!',
    })
  })
})
```

## Migration from v3.x

### API Changes

**Before (v3.x with commander):**

```typescript
import { createCLI, createCommand } from '@trailhead/cli'

const greet = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: [
    {
      name: 'name',
      flags: '-n, --name <name>',
      description: 'Name to greet',
      type: 'string',
      required: true,
    },
  ],
  action: async (options, context) => {
    context.logger.info(`Hello ${options.name}`)
    return ok(undefined)
  },
})

const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My CLI',
  commands: [greet],
})

await cli.run()
```

**After (v4.0 with citty):**

```typescript
import { defineCommand, runMain } from '@trailhead/cli/command'

const cli = defineCommand({
  meta: {
    name: 'greet',
    version: '1.0.0',
    description: 'Greet someone',
  },
  args: {
    name: {
      type: 'string',
      required: true,
      description: 'Name to greet',
    },
  },
  run: async (args, context) => {
    context.logger.info(`Hello ${args.name}`)
    return ok(undefined)
  },
})

runMain(cli)
```

### Key Differences

| v3.x (commander)                                 | v4.0 (citty)                    |
| ------------------------------------------------ | ------------------------------- |
| `createCLI()` + `createCommand()`                | `defineCommand()` + `runMain()` |
| `options` array with `flags`                     | `args` object with arg names    |
| `action(options, context)`                       | `run(args, context)`            |
| `context.args` is string[]                       | `context.args` is ParsedArgs    |
| Command builders (`createFileProcessingCommand`) | Use `defineCommand` directly    |

### Breaking Changes

- ❌ Removed `createCLI()` - use citty's `runMain(defineCommand(...))`
- ❌ Removed `createCommand()` - use `defineCommand()`
- ❌ Removed `CommandOption` interface - use citty's `ArgsDef`
- ❌ Removed command builders (`createFileProcessingCommand`, `defineOptions`)
- ❌ Simplified testing - removed complex test runners
- ❌ Git hooks helper (`createGitHooksCommand`) - deprecated for now
- ✅ Kept `commonOptions` as utility (updated for citty args format)
- ✅ Kept command patterns (`executeWithPhases`, `executeWithValidation`, etc.)
- ✅ Kept `CommandContext` with logger, fs, projectRoot
- ✅ Kept Result-based error handling

## Module Exports

### `@trailhead/cli/command`

```typescript
import {
  defineCommand, // Define commands with Result types
  runMain, // Run CLI (from citty)
  commonOptions, // Utility for standard arg patterns

  // Command patterns
  executeWithPhases,
  executeWithValidation,
  executeWithDryRun,
  executeInteractive,

  // Types
  type CommandContext,
  type CommandAction,
  type ParsedArgs,
  type ArgsDef,
} from '@trailhead/cli/command'
```

### `@trailhead/cli/testing`

```typescript
import {
  createMockContext,
  createMockLogger,
  createMockFileSystem,
  type MockLogger,
} from '@trailhead/cli/testing'
```

### `@trailhead/cli` (main export)

```typescript
import {
  defineCommand,
  runMain,
  ok,
  err,
  createCoreError,
  type Result,
  type CoreError,
} from '@trailhead/cli'
```

## Why Citty?

- **Modern & Maintained** - Active development by UnJS team
- **Lightweight** - Uses mri for parsing (smaller than commander)
- **TypeScript-First** - Excellent type inference
- **Auto Help** - Beautiful help text generated automatically
- **Lazy Loading** - Subcommands loaded on demand
- **Composable** - Functional API matches trailhead philosophy

## Learn More

- [Citty Documentation](https://github.com/unjs/citty) - Underlying CLI framework
- [Examples](./examples/) - Working examples in this repo
- [@trailhead/core](../core) - Result types and error handling

## Sources

Based on research from:

- [Citty NPM Package](https://www.npmjs.com/package/citty)
- [Citty GitHub](https://github.com/unjs/citty)
- [Medium: Citty CLI Builder](https://medium.com/@thinkthroo/citty-an-elegant-cli-builder-by-unjs-8bb57af4f63d)

## License

MIT © Trailhead DIY
