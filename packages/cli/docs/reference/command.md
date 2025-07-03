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

| Property    | Value                                |
| ----------- | ------------------------------------ |
| **Package** | `@esteban-url/trailhead-cli`         |
| **Module**  | `@esteban-url/trailhead-cli/command` |
| **Since**   | `v1.0.0`                             |

## Import

```typescript
import { createCommand } from "@esteban-url/trailhead-cli/command";
import type {
  Command,
  CommandContext,
} from "@esteban-url/trailhead-cli/command";
```

## Basic Usage

```typescript
import { createCommand } from "@esteban-url/trailhead-cli/command";
import type {
  Command,
  CommandContext,
} from "@esteban-url/trailhead-cli/command";
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
  name?: string; // Option name for programmatic access
  alias?: string; // Short alias (-n)
  flags?: string; // Commander.js style flags (e.g., '-v, --verbose')
  description: string; // Help text
  type?: "string" | "boolean" | "number";
  required?: boolean;
  default?: any;
  choices?: string[]; // Allowed values
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
    {
      name: "name",
      type: "string",
      required: true,
      description: "Project name",
    },
    {
      name: "template",
      type: "string",
      choices: ["basic", "advanced"],
      description: "Project template",
    },
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
      options: [{ name: "name", required: true, description: "User name" }],
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
import { executeWithPhases } from "@esteban-url/trailhead-cli/command";
import type { CommandPhase } from "@esteban-url/trailhead-cli/command";

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
  context,
);
```

### With Dry-Run Support

Execute commands with dry-run preview capability.

```typescript
import { executeWithDryRun } from "@esteban-url/trailhead-cli/command";

interface ProcessOptions {
  dryRun?: boolean;
  input: string;
  output: string;
}

const command = createCommand<ProcessOptions>({
  name: "transform",
  options: [
    {
      flags: "--dry-run",
      description: "Preview changes without executing",
      type: "boolean",
    },
    {
      flags: "--input <file>",
      description: "Input file",
      type: "string",
      required: true,
    },
    {
      flags: "--output <file>",
      description: "Output file",
      type: "string",
      required: true,
    },
  ],
  action: async (options, context) => {
    return executeWithDryRun(
      options,
      async (config) => {
        if (config.dryRun) {
          context.logger.info(
            `Would transform ${config.input} -> ${config.output}`,
          );
          return Ok(undefined);
        }

        // Actual transformation logic
        context.logger.info(`Transforming ${config.input} -> ${config.output}`);
        return Ok(undefined);
      },
      context,
      "This will overwrite the output file. Continue?",
    );
  },
});
```

### Interactive Execution

```typescript
import { executeInteractive } from "@esteban-url/trailhead-cli/command";

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

### Display Summary

Show formatted results and configuration summaries.

```typescript
import { displaySummary } from "@esteban-url/trailhead-cli/command";

const command = createCommand({
  name: "status",
  action: async (options, context) => {
    // Show configuration summary
    displaySummary(
      "Project Configuration",
      [
        { label: "Project Name", value: "my-app" },
        { label: "Version", value: "1.0.0" },
        { label: "Environment", value: "production" },
        { label: "Hot Reload", value: true },
        { label: "Source Maps", value: false },
      ],
      context,
      [
        { label: "Total Files", value: 42 },
        { label: "Bundle Size", value: "2.3 MB" },
        { label: "Build Time", value: "1.2s" },
      ],
    );

    return Ok(undefined);
  },
});
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
