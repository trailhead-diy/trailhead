---
type: reference
title: "Command Module API Reference"
description: "Command creation, execution patterns, and CLI building utilities"
related:
  - /docs/reference/api/core
  - /docs/reference/api/types
  - /docs/how-to/building-commands
---

# Command Module API Reference

Utilities for creating and executing CLI commands with options, subcommands, and execution patterns.

## Overview

| Property | Value |
|----------|-------|
| **Package** | `@trailhead/cli` |
| **Module** | `@trailhead/cli/command` |
| **Since** | `v1.0.0` |

## Import

```typescript
import { createCommand } from "@trailhead/cli/command";
import type { Command, CommandContext } from "@trailhead/cli/command";
```

## Basic Usage

```typescript
import { createCommand } from "@trailhead/cli/command";
import type { Command, CommandContext } from "@trailhead/cli/command";
```

## Command Creation

### `createCommand<T>(config: CommandConfig<T>): Command<T>`

Creates a new command with the specified configuration.

```typescript
const command = createCommand({
  name: "deploy",
  description: "Deploy your application",
  options: [
    {
      name: "environment",
      alias: "e",
      type: "string",
      required: true,
      description: "Target environment",
    },
    {
      name: "force",
      alias: "f", 
      type: "boolean",
      default: false,
      description: "Force deployment",
    },
  ],
  action: async (options, context) => {
    context.logger.info(`Deploying to ${options.environment}...`);
    return Ok(undefined);
  },
});
```

## Command Configuration

### CommandConfig Interface

```typescript
interface CommandConfig<T = any> {
  name: string;
  description: string;
  options?: CommandOption[];
  action: (options: T, context: CommandContext) => Promise<Result<void>>;
  validate?: (options: T) => Result<T>;
  subcommands?: Command[];
}
```

### CommandOption Interface

```typescript
interface CommandOption {
  name: string;              // Long name (--name)
  alias?: string;            // Short alias (-n)
  description: string;       // Help text
  type?: "string" | "boolean" | "number";
  required?: boolean;
  default?: any;
  choices?: string[];        // Allowed values
}
```

### CommandContext Interface

```typescript
interface CommandContext {
  readonly projectRoot: string;
  readonly logger: Logger;
  readonly verbose: boolean;
  readonly fs: FileSystem;
}
```

## Command Patterns

### With Validation

```typescript
const command = createCommand({
  name: "create",
  description: "Create a new project",
  options: [
    { name: "name", type: "string", required: true },
    { name: "template", type: "string", choices: ["basic", "advanced"] },
  ],
  validate: (options) => {
    if (!/^[a-z0-9-]+$/.test(options.name)) {
      return Err(new Error("Name must be lowercase with hyphens"));
    }
    return Ok(options);
  },
  action: async (options, context) => {
    // Validation has already passed
    return Ok(undefined);
  },
});
```

### With Subcommands

```typescript
const userCommand = createCommand({
  name: "user",
  description: "Manage users",
  subcommands: [
    createCommand({
      name: "list",
      description: "List all users",
      action: async (_, context) => {
        context.logger.info("Users: Alice, Bob");
        return Ok(undefined);
      },
    }),
    createCommand({
      name: "add",
      description: "Add a user",
      options: [{ name: "name", required: true }],
      action: async (options, context) => {
        context.logger.success(`Added user: ${options.name}`);
        return Ok(undefined);
      },
    }),
  ],
});
```

## Execution Patterns

### Phased Execution

Break complex operations into phases with progress tracking.

```typescript
import { executeWithPhases } from "@trailhead/cli/command";
import type { CommandPhase } from "@trailhead/cli/command";

const phases: CommandPhase<BuildData>[] = [
  {
    name: "Validate",
    execute: async (data, context) => {
      context.logger.info("Validating configuration...");
      return Ok({ ...data, validated: true });
    },
  },
  {
    name: "Build",
    execute: async (data, context) => {
      context.logger.info("Building project...");
      return Ok({ ...data, built: true });
    },
  },
  {
    name: "Deploy",
    execute: async (data, context) => {
      context.logger.info("Deploying...");
      return Ok({ ...data, deployed: true });
    },
  },
];

const result = await executeWithPhases(
  phases,
  { validated: false, built: false, deployed: false },
  context
);
```

### With Progress

Show progress for long-running operations.

```typescript
import { executeWithProgress } from "@trailhead/cli/command";

const command = createCommand({
  name: "process",
  action: async (options, context) => {
    return executeWithProgress({
      title: "Processing files",
      tasks: [
        { name: "Reading", weight: 1 },
        { name: "Transforming", weight: 3 },
        { name: "Writing", weight: 1 },
      ],
      execute: async (progress) => {
        // Read files
        progress.update(0);
        await readFiles();
        
        // Transform
        progress.update(1);
        await transform();
        
        // Write
        progress.update(2);
        await writeFiles();
        
        return Ok(undefined);
      },
    });
  },
});
```

### Interactive Execution

```typescript
import { executeInteractive } from "@trailhead/cli/command";

const result = await executeInteractive({
  context,
  confirmMessage: "This will delete all data. Continue?",
  execute: async () => {
    // Dangerous operation
    return Ok(undefined);
  },
  onCancel: () => {
    context.logger.info("Operation cancelled");
    return Ok(undefined);
  },
});
```

## Command Composition

### Combining Commands

```typescript
import { composeCommands } from "@trailhead/cli/command";

const composedCommand = composeCommands([
  cleanCommand,
  buildCommand,
  testCommand,
], {
  name: "ci",
  description: "Run CI pipeline",
  stopOnError: true,
});
```

### Global Options

```typescript
import { withGlobalOptions } from "@trailhead/cli/command";

const enhancedCommand = withGlobalOptions(myCommand, [
  { name: "config", alias: "c", type: "string", description: "Config file" },
  { name: "dry-run", type: "boolean", description: "Simulate execution" },
]);
```

## Type Reference

### Core Types

```typescript
interface Command<T = any> {
  name: string;
  description: string;
  options?: CommandOption[];
  execute: (options: T, context: CommandContext) => Promise<Result<void>>;
}

interface CommandPhase<T> {
  name: string;
  execute: (data: T, context: CommandContext) => Promise<Result<T>>;
}

interface ProgressOptions {
  title: string;
  tasks: Array<{ name: string; weight?: number }>;
  execute: (progress: Progress) => Promise<Result<void>>;
}
```

### Option Types

```typescript
type CommandOptionType = "string" | "boolean" | "number";

interface ParsedOptions {
  [key: string]: string | boolean | number | undefined;
}
```

## Error Handling

Commands should return Result types:

```typescript
const command = createCommand({
  name: "risky",
  action: async (options, context) => {
    try {
      await riskyOperation();
      return Ok(undefined);
    } catch (error) {
      return Err(new Error(`Operation failed: ${error.message}`));
    }
  },
});
```

## Best Practices

1. **Always return Results** - Use Ok/Err for explicit error handling
2. **Validate early** - Use the validate option for input validation
3. **Provide clear descriptions** - Help users understand each option
4. **Use subcommands** - Group related functionality
5. **Show progress** - For operations taking > 1 second

## See Also

- [Getting Started](../getting-started.md) - Build your first command
- [Testing Commands](../how-to/testing-guide.md) - Test command behavior
- [Command Patterns](../how-to/common-patterns.md) - Common command patterns