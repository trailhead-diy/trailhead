---
type: explanation
title: "@trailhead/cli Documentation Overview"
description: "Complete documentation hub for the functional CLI framework"
related:
  - /docs/tutorials/first-cli-app
  - /docs/reference/api/core
  - /docs/explanation/architecture
---

# @trailhead/cli Documentation

This framework provides a robust foundation for building command-line applications using functional programming principles.

## Framework Philosophy

@trailhead/cli is built around four core principles:

- **Functional programming** - Pure functions, immutability, and composition
- **Explicit error handling** - Result types instead of exceptions  
- **Type safety** - Full TypeScript support with strict types
- **Testability** - Built-in testing utilities and patterns

## Documentation Structure

### Getting Started

- [Quick Start Guide](./tutorials/getting-started.md) - Get up and running in minutes
- [Architecture Overview](./explanation/architecture.md) - Understand the fundamental principles
- [Working Examples](../examples/README.md) - Explore real CLI applications

### API Reference

Complete API documentation for all modules:

- [Core Module](./reference/core.md) - Result types and error handling
- [Command Module](./reference/command.md) - Command creation and execution
- [FileSystem Module](./reference/filesystem.md) - File system abstractions
- [Config Module](./reference/config.md) - Configuration management
- [Prompts Module](./reference/prompts.md) - Interactive user prompts
- [Testing Module](./reference/testing.md) - Testing utilities and helpers
- [Utils Module](./reference/utils.md) - Logger, spinner, and other utilities
- [Types Reference](./reference/types.md) - TypeScript type definitions

### How-To Guides

Task-oriented guides for common scenarios:

- [Functional Patterns](./how-to/functional-patterns.md) - Apply FP principles effectively
- [Import Patterns](./how-to/import-patterns.md) - Structure your CLI imports
- [Optimization Guide](./how-to/optimization-guide.md) - Build fast CLIs

### Working Examples

Real-world examples with full source code:

- [API Client](../examples/api-client/) - HTTP client with retry logic
- [File Processor](../examples/file-processor/) - Advanced file processing  
- [Project Generator](../examples/project-generator/) - Scaffolding tool
- [Todo CLI](../examples/todo-cli/) - Complete CRUD application
- [Cross-Platform CLI](../examples/cross-platform-cli/) - OS-specific functionality

See [examples directory](../examples/README.md) for complete list and usage instructions.

## Key Features

### 1. Result-Based Error Handling

```typescript
import { ok, err } from "@trailhead/cli/core";

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return Err(new Error("Division by zero"));
  }
  return Ok(a / b);
}
```

### 2. Functional Command Creation

```typescript
import { createCommand } from "@trailhead/cli/command";

const greetCommand = createCommand({
  name: "greet",
  description: "Greet someone",
  options: [{ name: "name", alias: "n", type: "string", required: true }],
  action: async (options, context) => {
    context.logger.info(`Hello, ${options.name}!`);
    return Ok(undefined);
  },
});
```

### 3. Type-Safe Configuration

```typescript
import { defineConfig } from "@trailhead/cli/config";
import { z } from "zod";

const schema = z.object({
  api: z.object({
    url: z.string().url(),
    key: z.string(),
  }),
});

const config = defineConfig(schema);
```

### 4. Composable Validation

```typescript
import { createValidationPipeline, createRule } from "@trailhead/cli/core";

const pipeline = createValidationPipeline([
  createRule(
    "length",
    (value: string) => value.length >= 3 || "Must be at least 3 characters",
  ),
  createRule(
    "format",
    (value: string) =>
      /^[a-z]+$/.test(value) || "Must contain only lowercase letters",
  ),
]);
```

## Framework Philosophy

### Functional Programming First

- **Pure Functions**: Side effects are isolated to the edges
- **Immutability**: Data structures are never mutated
- **Composition**: Build complex behavior from simple functions
- **Explicit Types**: Every function has clear input/output types

### No Hidden Magic

- **Explicit Errors**: All errors are returned as values
- **No Global State**: All dependencies are injected
- **No Monkey Patching**: Framework doesn't modify prototypes
- **Predictable Behavior**: Same inputs always produce same outputs

### Developer Experience

- **Comprehensive Types**: Full IntelliSense support
- **Clear Error Messages**: Helpful errors with recovery suggestions
- **Testing Utilities**: Mock implementations for all abstractions
- **Beautiful Output**: Styled terminal output with Chalk and Ora

## Quick Examples

### Basic CLI Application

```typescript
import { createCLI } from "@trailhead/cli";
import { greetCommand } from "./commands/greet";
import { configCommand } from "./commands/config";

const cli = createCLI({
  name: "my-app",
  version: "1.0.0",
  description: "My awesome CLI tool",
  commands: [greetCommand, configCommand],
});

cli.run(process.argv);
```

### Error Handling Pattern

```typescript
const result = await fs.readFile("config.json");
if (!result.success) {
  context.logger.error(result.error.message);
  return result; // Propagate the error
}

const config = JSON.parse(result.value);
```

### Testing Pattern

```typescript
import { createTestContext, mockFileSystem } from "@trailhead/cli/testing";

it("should read configuration", async () => {
  const fs = mockFileSystem({
    "config.json": '{"name": "test"}',
  });

  const context = createTestContext({ filesystem: fs });
  const result = await readConfig(context);

  expect(result.success).toBe(true);
  expect(result.value.name).toBe("test");
});
```

## Next Steps

1. Follow the [Getting Started Guide](./tutorials/getting-started.md) to build your first CLI
2. Read about [Architecture](./explanation/architecture.md) to understand the framework
3. Explore the [API Reference](./reference/core.md) for detailed documentation
4. Check out [Working Examples](../examples/) for real-world applications

## Contributing

We welcome contributions! Please see the [Contributing Guide](../CONTRIBUTING.md) for details on:

- Setting up your development environment
- Running tests and linting
- Submitting pull requests
- Following our code style

## Support

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Examples**: See the [examples directory](../examples/)

## License

MIT - See [LICENSE](../../../LICENSE)
