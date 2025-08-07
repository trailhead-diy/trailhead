---
type: explanation
title: '@esteban-url/cli Documentation Overview'
description: 'Complete documentation hub for the functional CLI framework'
related:
  - /packages/cli/docs/tutorials/getting-started.md
  - /packages/cli/docs/reference/core.md
  - /packages/cli/docs/explanation/architecture.md
---

# @esteban-url/cli Documentation

Functional CLI framework for building command-line applications.

## Core Principles

- **Functional programming** - Pure functions, immutability, composition
- **Explicit error handling** - Result types instead of exceptions
- **Type safety** - Strict TypeScript support
- **Testability** - Built-in testing utilities

## Documentation Structure

### Getting Started

- [Quick Start Guide](../tutorials/getting-started)
- [Architecture Overview](../explanation/architecture)

### API Reference

Complete API documentation for all modules:

- [Main Export](../reference/core.md)- CLI creation and basic Result types
- [Command Module](../reference/command.md)- Command creation and execution
- [Prompts Module](../reference/prompts.md)- Interactive user prompts
- [Testing Module](../reference/testing.md)- Testing utilities and helpers
- [Utils Module](../reference/utils.md)- Logger, spinner, and other utilities
- [Progress Module](../reference/utils.md)- Progress tracking utilities
- [Types Reference](../reference/types.md)- TypeScript type definitions

### Related Packages

For extended functionality, see:

- [Core Package](../../core/README.md)- Extended Result types and utilities
- [FileSystem Package](../../fs/README.md)- File system operations
- [Config Package](../../config/README.md)- Configuration management

### How-To Guides

Task-specific guides for common CLI operations:

- [Add File Operations](../how-to/add-file-operations.md)- Read, write, and process files
- [Add Interactive Prompts](../how-to/add-interactive-prompts.md)- User input and selections
- [Add Configuration](../how-to/add-configuration.md)- Configuration management
- [Handle Errors](../how-to/handle-errors-in-cli.md)- Error handling patterns
- [Test CLI Applications](../how-to/test-cli-applications.md)- Testing strategies
- [Use Result Pipelines](../how-to/use-result-pipelines.md)- Chain operations
- [Import Patterns](../how-to/import-patterns.md)- Module import best practices
- [Migrate to Command Enhancements](../how-to/migrate-to-command-enhancements.md)- Upgrade guide
- [Migrate to Pipelines](../how-to/migrate-to-pipelines.md)- Pipeline migration
- [Optimization Guide](../how-to/optimization-guide.md)- Performance tips

### Tutorials

Learning-oriented guides for getting started:

- [Build Your First CLI Application](../tutorials/getting-started.md)- Complete beginner tutorial

## Key Features

### 1. Result-Based Error Handling

```typescript
import { ok, err } from '@esteban-url/core'

const divide = (a: number, b: number): Result<number> => {
  if (b === 0) {
    return err(new Error('Division by zero'))
  }
  return ok(a / b)
}
```

### 2. Functional Command Creation

```typescript
import { createCommand } from '@esteban-url/cli/command'

const greetCommand = createCommand({
  name: 'greet',
  description: 'Greet someone',
  options: [{ name: 'name', alias: 'n', type: 'string', required: true }],
  action: async (options, context) => {
    context.logger.info(`Hello, ${options.name}!`)
    return ok(undefined)
  },
})
```

### 3. Type-Safe Configuration

```typescript
import { defineConfig } from '@esteban-url/config'
import { z } from 'zod'

const schema = z.object({
  api: z.object({
    url: z.string().url(),
    key: z.string(),
  }),
})

const config = defineConfig(schema)
```

### 4. Composable Validation

```typescript
import { createValidationPipeline, createRule } from '@esteban-url/validation'

const pipeline = createValidationPipeline([
  createRule('length', (value: string) => value.length >= 3 || 'Must be at least 3 characters'),
  createRule(
    'format',
    (value: string) => /^[a-z]+$/.test(value) || 'Must contain only lowercase letters'
  ),
])
```

## Quick Examples

### Basic CLI Application

```typescript
import { createCLI } from '@esteban-url/cli'
import { greetCommand } from './commands/greet'
import { configCommand } from './commands/config'

const cli = createCLI({
  name: 'my-app',
  version: '1.0.0',
  description: 'My CLI tool',
  commands: [greetCommand, configCommand],
})

cli.run(process.argv)
```

### Error Handling Pattern

```typescript
const result = await fs.readFile('config.json')
if (!result.success) {
  context.logger.error(result.error.message)
  return result // Propagate the error
}

const config = JSON.parse(result.value)
```

### Testing Pattern

```typescript
import { createTestContext, mockFileSystem } from '@esteban-url/cli/testing'

it('should read configuration', async () => {
  const fs = mockFileSystem({
    'config.json': '{"name": "test"}',
  })

  const context = createTestContext({ filesystem: fs })
  const result = await readConfig(context)

  expect(result.success).toBe(true)
  expect(result.value.name).toBe('test')
})
```

## Next Steps

1. Follow the [Getting Started Guide](../tutorials/getting-started.md)to build your first CLI
2. Read about [Architecture](../explanation/architecture.md)to understand the framework
3. Explore the [API Reference](../reference/core.md)for detailed documentation
4. Review the API documentation for advanced usage patterns

## Contributing

We welcome contributions! Please see the [Contributing Guide](https://github.com/esteban-url/trailhead/blob/main/CONTRIBUTING.md) for details on:

- Setting up your development environment
- Running tests and linting
- Submitting pull requests
- Following our code style

## Support

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Documentation**: See the [documentation directory](../)

## License

MIT - See [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE)
