---
type: explanation
title: '@esteban-url/cli Documentation Overview'
description: 'Complete documentation hub for the functional CLI framework'
related:
  - ./tutorials/getting-started.md
  - ./reference/core.md
  - ./explanation/architecture.md
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

- [Quick Start Guide](./tutorials/getting-started.md)
- [Architecture Overview](./explanation/architecture.md)

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

Task-specific guides:

- [Functional Patterns](/docs/how-to/apply-functional-patterns.md)
- [Import Patterns](./how-to/import-patterns.md)
- [Optimization Guide](./how-to/optimization-guide.md)

## Key Features

### 1. Result-Based Error Handling

```typescript
import { ok, err } from '@esteban-url/core'

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return Err(new Error('Division by zero'))
  }
  return Ok(a / b)
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
    return Ok(undefined)
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

1. Follow the [Getting Started Guide](./tutorials/getting-started.md) to build your first CLI
2. Read about [Architecture](./explanation/architecture.md) to understand the framework
3. Explore the [API Reference](./reference/core.md) for detailed documentation
4. Review the API documentation for advanced usage patterns

## Contributing

We welcome contributions! Please see the [Contributing Guide](../CONTRIBUTING.md) for details on:

- Setting up your development environment
- Running tests and linting
- Submitting pull requests
- Following our code style

## Support

- **Issues**: [GitHub Issues](https://github.com/esteban-url/trailhead/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esteban-url/trailhead/discussions)
- **Documentation**: See the [documentation directory](../docs/)

## License

MIT - See [LICENSE](../../../LICENSE)
