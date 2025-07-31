---
type: explanation
title: '@esteban-url/cli Documentation Overview'
description: 'Complete documentation hub for the functional CLI framework'
related:
  - /packages/cli/tutorials/getting-started.md
  - /packages/cli/reference/core.md
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

- [Quick Start Guide](/packages/cli/tutorials/getting-started)
- [Architecture Overview](/packages/cli/explanation/architecture)

### API Reference

Complete API documentation for all modules:

- [Core Module](/packages/cli/reference/core) - Result types and error handling
- [Command Module](/packages/cli/reference/command) - Command creation and execution
- [FileSystem Module](/packages/cli/reference/filesystem) - File system abstractions
- [Config Module](/packages/cli/reference/config) - Configuration management
- [Prompts Module](/packages/cli/reference/prompts) - Interactive user prompts
- [Testing Module](/packages/cli/reference/testing) - Testing utilities and helpers
- [Utils Module](/packages/cli/reference/utils) - Logger, spinner, and other utilities
- [Types Reference](/packages/cli/reference/types) - TypeScript type definitions

### How-To Guides

Task-specific guides:

- [Apply Functional Patterns](/docs/how-to/apply-functional-patterns)
- [Import Patterns](/packages/cli/how-to/import-patterns)
- [Optimization Guide](/packages/cli/how-to/optimization-guide)

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

1. Follow the [Getting Started Guide](/packages/cli/tutorials/getting-started) to build your first CLI
2. Read about [Architecture](/packages/cli/explanation/architecture) to understand the framework
3. Explore the [API Reference](/packages/cli/reference/core) for detailed documentation
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
- **Documentation**: See the [documentation directory](/packages/cli/)

## License

MIT - See [LICENSE](https://github.com/esteban-url/trailhead/blob/main/LICENSE)
