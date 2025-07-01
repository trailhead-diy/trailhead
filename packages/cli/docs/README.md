# @trailhead/cli Documentation

Welcome to the @trailhead/cli documentation! This framework provides a robust foundation for building command-line applications using functional programming principles.

## Overview

@trailhead/cli is a modern CLI framework that emphasizes:

- **Functional programming** - Pure functions, immutability, and composition
- **Explicit error handling** - Result types instead of exceptions
- **Type safety** - Full TypeScript support with strict types
- **Testability** - Built-in testing utilities and patterns
- **Modularity** - Tree-shakeable exports for optimal bundle size

## Documentation Structure

### Getting Started

- [Quick Start Guide](./getting-started.md) - Get up and running in minutes
- [Core Concepts](./guides/core-concepts.md) - Understand the fundamental principles
- [Your First CLI](./examples/hello-world/README.md) - Build your first CLI application

### API Reference

Complete API documentation for all modules:

- [Core Module](./api/core.md) - Result types and error handling
- [Command Module](./api/command.md) - Command creation and execution
- [FileSystem Module](./api/filesystem.md) - File system abstractions
- [Config Module](./api/config.md) - Configuration management
- [Validation Module](./api/validation.md) - Input validation pipelines
- [Prompts Module](./api/prompts.md) - Interactive user prompts
- [Testing Module](./api/testing.md) - Testing utilities and helpers
- [Utils Module](./api/utils.md) - Logger, spinner, and other utilities

### Guides

In-depth guides on specific topics:

- [Error Handling](./guides/error-handling.md) - Master the Result pattern
- [Testing CLI Applications](./guides/testing-cli-apps.md) - Write effective tests
- [Functional Patterns](./guides/functional-patterns.md) - Apply FP principles
- [Building Plugins](./guides/building-plugins.md) - Extend the framework
- [Performance Optimization](./guides/performance.md) - Build fast CLIs
- [Migration Guide](./guides/migration.md) - Migrate from other frameworks

### Examples

Real-world examples with full source code:

- [Todo CLI](./examples/todo-cli/) - Task management application
- [File Processor](./examples/file-processor/) - Batch file processing
- [API Client](./examples/api-client/) - HTTP API client CLI
- [Project Generator](./examples/project-generator/) - Scaffolding tool

## Key Features

### 1. Result-Based Error Handling

```typescript
import { ok, err } from "@trailhead/cli/core";

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return err(new Error("Division by zero"));
  }
  return ok(a / b);
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
    return ok(undefined);
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
});

cli.addCommand(greetCommand).addCommand(configCommand).run(process.argv);
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

1. Follow the [Getting Started Guide](./getting-started.md) to build your first CLI
2. Read about [Core Concepts](./guides/core-concepts.md) to understand the framework
3. Explore the [API Reference](./api/core.md) for detailed documentation
4. Check out [Examples](./examples/) for real-world applications

## Contributing

We welcome contributions! Please see the [Contributing Guide](../CONTRIBUTING.md) for details on:

- Setting up your development environment
- Running tests and linting
- Submitting pull requests
- Following our code style

## Support

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Examples**: See the [examples directory](./examples/)

## License

MIT - See [LICENSE](../../../LICENSE)
