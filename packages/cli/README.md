# @esteban-url/trailhead-cli

A functional CLI framework for building robust, testable command-line applications with TypeScript.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

## Overview

@esteban-url/trailhead-cli is a functional CLI framework that wraps battle-tested libraries in a type-safe API with explicit error handling. Built on Rust-inspired Result types instead of exceptions, the framework provides tree-shakeable subpath exports for optimal bundle sizes and comprehensive testing utilities with built-in mocks.

The architecture follows functional programming principles with pure functions, immutable data structures, and dependency injection through context. All I/O operations return Result types, making error paths explicit at compile time. Each module can be imported independently via subpath exports, allowing applications to include only the functionality they need.

## Get Started in Seconds

Generate a complete CLI project with TypeScript, testing, and build configuration:

```bash
pnpm create trailhead-cli my-cli
cd my-cli
pnpm dev
```

The generator provides project scaffolding with basic and advanced templates, including monorepo setup, CI/CD workflows, and comprehensive documentation structure.

## Complete Features

| Module                 | Description                                                                        | Libraries Used                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-trailhead-cli` | Project scaffolding with TypeScript setup, testing, and CI/CD workflows            | [Handlebars](https://handlebarsjs.com/), [fast-glob](https://github.com/mrmlnc/fast-glob), [execa](https://github.com/sindresorhus/execa)                      |
| `/core`                | Result types for explicit error handling, validation pipelines, and retry patterns | [p-retry](https://github.com/sindresorhus/p-retry)                                                                                                             |
| `/command`             | Type-safe CLI parsing, validation, and execution with nested subcommands           | [Commander.js](https://github.com/tj/commander.js)                                                                                                             |
| `/filesystem`          | Reliable file operations with Result types and pattern matching                    | [Node.js fs/promises](https://nodejs.org/api/fs.html#promises-api), [glob](https://github.com/isaacs/node-glob)                                                |
| `/config`              | Automatic configuration discovery and runtime type validation                      | [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig), [Zod](https://github.com/colinhacks/zod)                                                          |
| `/prompts`             | Interactive command line user interfaces with excellent UX                         | [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)                                                                                                  |
| `/utils`               | Terminal styling with colors, loading indicators, and progress bars                | [Chalk](https://github.com/chalk/chalk), [yocto-spinner](https://github.com/sindresorhus/yocto-spinner), [cli-progress](https://github.com/npkgz/cli-progress) |
| `/git`                 | Repository management with branch sync and workflow automation                     | Native git commands                                                                                                                                            |
| `/workflows`           | Task orchestration with beautiful progress visualization                           | [Listr2](https://github.com/listr2/listr2)                                                                                                                     |
| `/error-recovery`      | Circuit breakers, exponential backoff, and retry strategies                        | [p-retry](https://github.com/sindresorhus/p-retry)                                                                                                             |
| `/testing`             | Mock filesystems, test contexts, and Result-type assertions                        | [Vitest](https://vitest.dev/)                                                                                                                                  |

## 📚 Documentation

- **[Getting Started](./docs/getting-started.md)** - Build your first CLI in minutes
- **[API Reference](./docs/api)** - Complete module documentation
- **[Guides](./docs/guides)** - In-depth topics and patterns
- **[Examples](./docs/examples)** - Real-world applications

## Installation

### For Monorepo Development

When working within the Trailhead monorepo:

```bash
# From within the monorepo
pnpm add @esteban-url/trailhead-cli --workspace

# Or in package.json
{
  "dependencies": {
    "@esteban-url/trailhead-cli": "workspace:*"
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
    "@esteban-url/trailhead-cli": "github:esteban-url/trailhead#packages/cli"
  }
}
```

> **Note**: You may need authentication to access the private repository. Ensure you have proper GitHub access configured.

## Quick Start

### Option 1: Generate a new project (Recommended)

```bash
# Create a new CLI project with scaffolding
pnpm create trailhead-cli my-awesome-cli

# Follow interactive prompts to configure your project
cd my-awesome-cli
pnpm dev
```

### Option 2: Add to existing project

```typescript
// Import core utilities from the main export
import { createCLI, Ok, Err } from '@esteban-url/trailhead-cli';

// Import specific modules using subpath exports
import { createCommand } from '@esteban-url/trailhead-cli/command';
import { createDefaultLogger } from '@esteban-url/trailhead-cli/core';

// Create a command
const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: true,
      description: 'Name to greet',
    },
  ],
  action: async (options, context) => {
    context.logger.info(`Hello, ${options.name}!`);
    return Ok(undefined);
  },
});

// Create a CLI application with commands
const cli = createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI tool',
  commands: [greetCommand],
});

// Run the CLI
cli.run(process.argv);
```

## Architecture

Built on functional programming principles:

- **Pure functions** - No classes, predictable behavior
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

## Examples

See the [examples directory](./examples/) for complete CLI applications and usage patterns.

## License

MIT - See [root LICENSE](../../LICENSE)
