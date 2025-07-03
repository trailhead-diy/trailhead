# @esteban-url/trailhead-cli

A functional CLI framework for building robust, testable command-line applications with TypeScript.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18.0+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

## Overview

@esteban-url/trailhead-cli provides a modern foundation for CLI applications using functional programming patterns, explicit error handling with Result types, and comprehensive testing utilities.

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
- 🔄 **Advanced retry patterns** - Circuit breakers, exponential backoff, jitter

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

```typescript
// Import core utilities from the main export
import { createCLI, Ok, Err } from "@esteban-url/trailhead-cli";

// Import specific modules using subpath exports
import { createCommand } from "@esteban-url/trailhead-cli/command";
import { createDefaultLogger } from "@esteban-url/trailhead-cli/core";

// Create a command
const greetCommand = createCommand({
  name: "greet",
  description: "Greet someone",
  options: [
    {
      name: "name",
      alias: "n",
      type: "string",
      required: true,
      description: "Name to greet",
    },
  ],
  action: async (options, context) => {
    context.logger.info(`Hello, ${options.name}!`);
    return Ok(undefined);
  },
});

// Create a CLI application with commands
const cli = createCLI({
  name: "my-cli",
  version: "1.0.0",
  description: "My awesome CLI tool",
  commands: [greetCommand],
});

// Run the CLI
cli.run(process.argv);
```

## Module Exports

> **Important**: @esteban-url/trailhead-cli uses subpath exports for optimal tree-shaking. The main export contains only essential utilities (`Ok`, `Err`, `isOk`, `isErr`, `createCLI`). Import all other functionality from specific modules.

### Main Export (`@esteban-url/trailhead-cli`)

```typescript
import { Ok, Err, isOk, isErr, createCLI } from "@esteban-url/trailhead-cli";
import type { Result, CLI, CLIConfig } from "@esteban-url/trailhead-cli";
```

- **Result utilities**: `Ok`, `Err`, `isOk`, `isErr` - Core error handling
- **CLI creation**: `createCLI` - Main CLI factory function

### Core (`@esteban-url/trailhead-cli/core`)

Result types, error handling utilities, and advanced retry patterns:

```typescript
import { Ok, Err, isOk, isErr } from "@esteban-url/trailhead-cli";
import type { Result } from "@esteban-url/trailhead-cli";

// Create results
const success = Ok(42);
const failure = Err(new Error("Something went wrong"));

// Check results
if (isOk(result)) {
  console.log(result.value);
}
```

#### Retry Patterns

The framework includes comprehensive retry functionality powered by p-retry:

```typescript
import {
  retryWithBackoff,
  retryAdvanced,
  RetryStrategies,
  createCircuitBreaker,
  retryWithTimeout,
} from "@esteban-url/trailhead-cli/core";

// Basic retry with exponential backoff
const result = await retryWithBackoff(
  async () => {
    const response = await fetch("/api/data");
    if (!response.ok) {
      return Err({
        code: "API_ERROR",
        message: "Request failed",
        recoverable: true,
      });
    }
    return Ok(await response.json());
  },
  { maxRetries: 3, initialDelay: 1000 },
);

// Advanced retry with pre-configured strategies
const apiResult = await retryAdvanced(async () => callUnreliableAPI(), {
  ...RetryStrategies.network(), // 3 retries, 1s-10s delays, with jitter
  onFailedAttempt: (error, attempt, retriesLeft) => {
    logger.warn(`Attempt ${attempt} failed: ${error.message}`);
  },
});

// Circuit breaker pattern for preventing cascading failures
const breaker = createCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
});

const protectedResult = await breaker.execute(
  async () => callProtectedService(),
  RetryStrategies.conservative(),
);

// Retry with overall timeout
const timedResult = await retryWithTimeout(
  async () => slowOperation(),
  5000, // 5 second timeout
  { retries: 10 },
);
```

Available retry strategies:

- `RetryStrategies.conservative()` - 5 retries, 2-30s delays
- `RetryStrategies.aggressive()` - 10 retries, 100ms-5s delays
- `RetryStrategies.network()` - 3 retries with jitter for network calls
- `RetryStrategies.filesystem()` - 2 retries, minimal delays
- `RetryStrategies.infinite()` - Unlimited retries (use with caution)

### Command (`@esteban-url/trailhead-cli/command`)

Command creation and execution patterns:

```typescript
import {
  createCommand,
  executeWithPhases,
} from "@esteban-url/trailhead-cli/command";
import type {
  Command,
  CommandContext,
} from "@esteban-url/trailhead-cli/command";

// Phased execution
const phases = [
  { name: "Validate", execute: validatePhase },
  { name: "Process", execute: processPhase },
  { name: "Complete", execute: completePhase },
];

const result = await executeWithPhases(phases, data, context);
```

### FileSystem (`@esteban-url/trailhead-cli/filesystem`)

Powerful filesystem operations built on fs-extra with Result type safety:

```typescript
import { createFileSystem } from "@esteban-url/trailhead-cli/filesystem";
import type { FileSystem } from "@esteban-url/trailhead-cli/filesystem";

const fs = createFileSystem();

// Basic operations
const content = await fs.readFile("config.json");
const writeResult = await fs.writeFile("output.txt", "data");
const exists = await fs.exists("some-file.txt");

// Advanced operations (powered by fs-extra)
const copyResult = await fs.copy("src", "dest", { recursive: true });
const moveResult = await fs.move("old-path", "new-path");
const removeResult = await fs.remove("temp-dir"); // Recursive removal
const emptyResult = await fs.emptyDir("cache"); // Empty directory
const outputResult = await fs.outputFile("deep/path/file.txt", "content"); // Auto-create dirs

// JSON operations
const data = await fs.readJson("package.json");
const writeJsonResult = await fs.writeJson("output.json", { name: "test" });
```

### Configuration (`@esteban-url/trailhead-cli/config`)

Type-safe configuration management:

```typescript
import { defineConfig, loadConfig } from "@esteban-url/trailhead-cli/config";
import { z } from "zod";

const configSchema = z.object({
  api: z.object({
    endpoint: z.string().url(),
    timeout: z.number().default(30000),
  }),
});

const config = defineConfig(configSchema);
const result = await config.load();
```

### Prompts (`@esteban-url/trailhead-cli/prompts`)

Interactive user prompts:

```typescript
import { prompt, select, confirm } from "@esteban-url/trailhead-cli/prompts";

const name = await prompt({
  message: "What is your name?",
  validate: (value) => value.length > 0 || "Name is required",
});

const framework = await select({
  message: "Choose a framework",
  choices: ["React", "Vue", "Angular"],
});
```

### Testing (`@esteban-url/trailhead-cli/testing`)

Comprehensive testing utilities:

```typescript
import {
  createTestContext,
  mockFileSystem,
} from "@esteban-url/trailhead-cli/testing";

describe("MyCommand", () => {
  it("should execute successfully", async () => {
    const fs = mockFileSystem({
      "config.json": '{"key": "value"}',
    });

    const context = createTestContext({ filesystem: fs });
    const result = await myCommand.execute(context);

    expect(result.success).toBe(true);
  });
});
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
import {
  createCLI,
  Ok,
  Err,
  createCommand,
  createFileSystem,
} from "@esteban-url/trailhead-cli";

// Example: Config command
const configCommand = createCommand({
  name: "config",
  description: "Manage configuration",
  subcommands: [
    createCommand({
      name: "get",
      description: "Get config value",
      options: [
        {
          name: "key",
          alias: "k",
          type: "string",
          required: true,
          description: "Configuration key to get",
        },
      ],
      action: async (options, context) => {
        const fs = createFileSystem();
        const result = await fs.readFile("./config.json");

        if (!result.success) {
          return Err(new Error("Config file not found"));
        }

        const config = JSON.parse(result.value);
        const value = config[options.key];

        if (value === undefined) {
          return Err(new Error(`Key "${options.key}" not found`));
        }

        context.logger.info(`${options.key}: ${value}`);
        return Ok(undefined);
      },
    }),
    createCommand({
      name: "set",
      description: "Set config value",
      options: [
        {
          name: "key",
          alias: "k",
          type: "string",
          required: true,
          description: "Configuration key to set",
        },
        {
          name: "value",
          alias: "v",
          type: "string",
          required: true,
          description: "Configuration value to set",
        },
      ],
      action: async (options, context) => {
        const fs = createFileSystem();

        // Read existing config or create new
        const readResult = await fs.readFile("./config.json");
        const config = readResult.success ? JSON.parse(readResult.value) : {};

        // Update config
        config[options.key] = options.value;

        // Write back
        const writeResult = await fs.writeFile(
          "./config.json",
          JSON.stringify(config, null, 2),
        );

        if (!writeResult.success) {
          return writeResult;
        }

        context.logger.success(`Set ${options.key} = ${options.value}`);
        return Ok(undefined);
      },
    }),
  ],
});

// Create init command
const initCommand = createCommand({
  name: "init",
  description: "Initialize project",
  options: [
    {
      name: "template",
      alias: "t",
      type: "string",
      default: "default",
      description: "Template to use for initialization",
    },
    {
      name: "force",
      alias: "f",
      type: "boolean",
      default: false,
      description: "Force overwrite existing configuration",
    },
  ],
  action: async (options, context) => {
    const fs = createFileSystem();

    const exists = await fs.exists("./config.json");
    if (exists.success && exists.value && !options.force) {
      return Err(new Error("Already initialized. Use --force to overwrite."));
    }

    const config = { template: options.template, created: new Date() };
    const result = await fs.writeFile(
      "./config.json",
      JSON.stringify(config, null, 2),
    );

    if (!result.success) {
      return Err(new Error(`Failed: ${result.error.message}`));
    }

    context.logger.success("Initialized successfully!");
    return Ok(undefined);
  },
});

// Create CLI with all commands
const cli = createCLI({
  name: "my-app",
  version: "1.0.0",
  description: "My CLI application",
  commands: [configCommand, initCommand],
});

// Run the CLI
cli.run(process.argv);
```

## License

MIT - See [root LICENSE](../../LICENSE)
