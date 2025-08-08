# CLI Building APIs

APIs for creating command-line interfaces.

## Core CLI Creation

### createCLI(options)

Creates a new CLI application with commands and configuration.

```typescript
import { createCLI } from '@esteban-url/cli'

const cli = createCLI({
  name: string              // CLI executable name
  version: string           // Semantic version
  description?: string      // Brief description
  commands: Command[]       // Available commands
  config?: {
    strict?: boolean        // Strict argument parsing
    help?: boolean          // Auto-generate help
  }
})
```

**Example**:

```typescript
const cli = createCLI({
  name: 'my-tool',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  commands: [helpCommand, versionCommand, buildCommand],
})

// Run the CLI
await cli.run() // Uses process.argv
await cli.run(['build']) // Custom args
```

## Command Creation

### createCommand(options)

Creates a reusable command with typed arguments.

```typescript
import { createCommand } from '@esteban-url/cli/command'

const command = createCommand({
  name: string              // Command name
  description?: string      // Help text
  alias?: string | string[] // Alternative names
  args?: CommandArgs        // Argument schema
  action: CommandAction     // Implementation
})
```

**Complete Example**:

```typescript
export const deployCommand = createCommand({
  name: 'deploy',
  description: 'Deploy application to server',
  alias: ['d', 'publish'],

  args: defineArgs({
    positional: z.tuple([z.enum(['staging', 'production']).describe('Target environment')]),
    flags: z.object({
      force: z.boolean().optional().describe('Skip confirmation'),
      tag: z.string().optional().describe('Deployment tag'),
      verbose: z.boolean().optional().describe('Verbose output'),
    }),
  }),

  action: async ({ positional, flags }, context) => {
    const [environment] = positional
    const { logger } = context

    if (!flags.force) {
      const confirmed = await confirm({
        message: `Deploy to ${environment}?`,
      })
      if (confirmed.isError() || !confirmed.value) {
        return err(new Error('Deployment cancelled'))
      }
    }

    logger.info(`Deploying to ${environment}...`)
    // Deployment logic

    return ok({ environment, tag: flags.tag })
  },
})
```

## Command Arguments and Options

### Defining Arguments

Commands handle arguments through the `arguments` property and options through the `options` array:

```typescript
import { createCommand } from '@esteban-url/cli/command'
import type { CommandArgument, CommandOption } from '@esteban-url/cli/command'

const command = createCommand({
  name: 'process',
  description: 'Process files',
  // Commander.js style arguments
  arguments: '<input> [output]',
  // OR structured arguments
  arguments: [
    { name: 'input', description: 'Input file', required: true },
    { name: 'output', description: 'Output file', required: false },
  ],
  options: [
    {
      flags: '-v, --verbose',
      description: 'Verbose output',
      type: 'boolean',
      default: false,
    },
    {
      flags: '-f, --format <format>',
      description: 'Output format',
      type: 'string',
      default: 'json',
    },
    {
      flags: '-l, --limit <number>',
      description: 'Result limit',
      type: 'number',
      default: 10,
    },
  ],
  action: async (options, context) => {
    // Access parsed arguments via context.args
    const [input, output] = context.args

    // Access options directly
    if (options.verbose) {
      context.logger.info('Verbose mode enabled')
    }

    return ok(undefined)
  },
})
```

**Argument Types**:

```typescript
// String arguments (default)
arguments: '<required> [optional]'

// Variadic arguments (accepts multiple values)
arguments: '<files...>'

// Mixed arguments
arguments: '<source> <dest> [others...]'
```

**Option Types**:

```typescript
const options: CommandOption[] = [
  // Boolean flag
  { flags: '-d, --debug', description: 'Debug mode', type: 'boolean' },

  // String with value
  { flags: '-o, --output <dir>', description: 'Output directory', type: 'string' },

  // Required option
  { flags: '-k, --key <key>', description: 'API key', required: true },

  // With default value
  { flags: '-p, --port <port>', description: 'Port', type: 'number', default: 3000 },
]
```

## Command Context

### CommandContext Interface

Context provided to command actions.

```typescript
interface CommandContext {
  projectRoot: string // Absolute path to project root directory
  logger: Logger // Consola-based logger with colored output
  verbose: boolean // Whether verbose logging is enabled
  fs: FileSystem // Filesystem abstraction with Result-based operations
  args: string[] // Positional arguments passed to the command
}
```

**Using Context**:

```typescript
action: async (args, context) => {
  const { logger, cwd, env } = context

  logger.info(`Working directory: ${cwd}`)
  logger.debug(`Node env: ${env.NODE_ENV}`)

  if (env.CI) {
    logger.info('Running in CI environment')
  }
}
```

## Advanced Patterns

### Subcommands

Create nested command structures:

```typescript
const gitCommand = createCommand({
  name: 'git',
  description: 'Git operations',
  subcommands: [
    createCommand({
      name: 'clone',
      description: 'Clone a repository',
      // ...
    }),
    createCommand({
      name: 'commit',
      description: 'Create a commit',
      // ...
    }),
  ],
})
```

### Command Composition

Reuse command logic:

```typescript
// Base validation logic
const withValidation = (command: Command) => ({
  ...command,
  action: async (args, context) => {
    // Validation logic
    const validationResult = await validate(args)
    if (validationResult.isError()) {
      return validationResult
    }

    // Call original action
    return command.action(args, context)
  },
})

// Apply to commands
const safeCommand = withValidation(originalCommand)
```

### Dynamic Command Loading

Load commands on demand:

```typescript
const commands = [
  {
    name: 'heavy-command',
    description: 'Resource-intensive command',
    load: async () => {
      const { heavyCommand } = await import('./commands/heavy.js')
      return heavyCommand
    },
  },
]

// In CLI setup
const loadedCommands = await Promise.all(
  commands.map(async (cmd) => {
    if (cmd.load) {
      return await cmd.load()
    }
    return cmd
  })
)
```

### Global Options

Handle global flags:

```typescript
const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  commands: [
    /* ... */
  ],
  globalArgs: defineArgs({
    flags: z.object({
      config: z.string().optional().describe('Config file path'),
      quiet: z.boolean().optional().describe('Suppress output'),
    }),
  }),
  beforeAction: async (globalArgs, context) => {
    if (globalArgs.flags.config) {
      // Load configuration
      const config = await loadConfig(globalArgs.flags.config)
      context.config = config
    }

    if (globalArgs.flags.quiet) {
      context.logger.setLevel('error')
    }
  },
})
```

## Error Handling

### Command Errors

All commands must return `Result<T, Error>`:

```typescript
action: async (args, context) => {
  try {
    // Command logic
    const result = await doSomething()
    return ok(result)
  } catch (error) {
    // Convert exceptions to Result
    return err(error as Error)
  }
}
```

### Error Display

Customize error presentation:

```typescript
const cli = createCLI({
  // ...
  onError: (error: Error, context: CommandContext) => {
    const { logger } = context

    if (error.name === 'ValidationError') {
      logger.error('Validation failed:')
      logger.error(error.message)
    } else if (error.name === 'NetworkError') {
      logger.error('Network error:', error.message)
      logger.info('Check your internet connection')
    } else {
      logger.error('Error:', error.message)
      if (context.env.DEBUG) {
        logger.error(error.stack)
      }
    }
  },
})
```

## Help Generation

Automatic help is generated from command definitions:

```bash
$ my-cli --help
my-cli v1.0.0 - My awesome CLI tool

Commands:
  deploy <environment>  Deploy application to server
  build [options]       Build the project
  test [pattern]        Run tests

Options:
  --help               Show help
  --version            Show version

Run 'my-cli <command> --help' for command details
```

Command-specific help:

```bash
$ my-cli deploy --help
Deploy application to server

Usage:
  my-cli deploy <environment> [options]

Arguments:
  environment  Target environment (staging|production)

Options:
  --force      Skip confirmation
  --tag        Deployment tag
  --verbose    Verbose output
  --help       Show help
```
