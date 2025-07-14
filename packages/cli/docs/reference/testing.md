---
type: reference
title: 'Testing Module API Reference'
description: 'Testing utilities for CLI applications with mocked dependencies and test runners'
related:
  - /docs/reference/api/filesystem
  - /docs/reference/api/command
  - /docs/how-to/testing-cli-apps
---

# Testing Module API Reference

Utilities for testing CLI applications with mocked dependencies and test runners.

## Overview

| Property    | Value                                |
| ----------- | ------------------------------------ |
| **Package** | `@esteban-url/trailhead-cli`         |
| **Module**  | `@esteban-url/trailhead-cli/testing` |
| **Since**   | `v1.0.0`                             |

## Import

```typescript
import {
  createTestContext,
  mockFileSystem,
  mockLogger,
  mockPrompts,
  expectResult,
  expectError,
} from '@esteban-url/trailhead-cli/testing'
```

## Basic Usage

```typescript
import {
  createTestContext,
  mockFileSystem,
  mockLogger,
  mockPrompts,
  expectResult,
  expectError,
} from '@esteban-url/trailhead-cli/testing'
```

## Test Context

### `createTestContext(options?: TestContextOptions): TestContext`

Creates a test context with mocked dependencies.

```typescript
const context = createTestContext({
  filesystem: mockFileSystem({
    'config.json': '{"name": "test"}',
    'data.txt': 'Hello, world!',
  }),
  logger: mockLogger(),
  prompts: mockPrompts({
    'Name?': 'Test User',
  }),
  verbose: true,
})

// Use in tests
const result = await myCommand.execute({}, context)
```

### TestContext Options

```typescript
interface TestContextOptions {
  filesystem?: FileSystem
  logger?: Logger
  prompts?: MockPrompts
  projectRoot?: string
  verbose?: boolean
}
```

## Mock Utilities

### Mock FileSystem

Create an in-memory filesystem for testing.

```typescript
const fs = mockFileSystem({
  '/src/index.js': 'console.log("Hello");',
  '/config.json': '{"port": 3000}',
  '/data/users.csv': 'id,name\n1,Alice\n2,Bob',
})

// Test file operations
const result = await fs.readFile('/config.json')
expect(result.success).toBe(true)
expect(JSON.parse(result.value).port).toBe(3000)

// Verify writes
await myCommand.execute({}, { fs })
const written = await fs.readFile('/output.txt')
expect(written.success).toBe(true)
```

### Mock Logger

Capture and assert log output.

```typescript
const logger = mockLogger()

// Use logger
logger.info('Processing...')
logger.success('Done!')
logger.error('Failed')

// Assert logs
expect(logger.logs).toEqual([
  { level: 'info', message: 'Processing...' },
  { level: 'success', message: 'Done!' },
  { level: 'error', message: 'Failed' },
])

// Check specific levels
const errors = logger.logs.filter((l) => l.level === 'error')
expect(errors).toHaveLength(1)

// Clear logs
logger.clear()
```

### Mock Prompts

Provide predetermined responses to prompts.

```typescript
const prompts = mockPrompts({
  'What is your name?': 'Alice',
  'Choose a color': 'blue',
  'Continue?': true,
  'Select features': ['typescript', 'eslint'],
})

// In your command
const name = await prompts.prompt({ message: 'What is your name?' })
// Returns: "Alice"

// Verify all prompts were used
expect(prompts.hasUnusedResponses()).toBe(false)
```

## Assertion Helpers

### `expectResult<T>(result: Result<T>): T`

Assert that a Result is successful and return its value.

```typescript
const result = await processFile('data.txt')
const value = expectResult(result)
// If result is error, throws with helpful message

// With custom message
const data = expectResult(result, 'Failed to process file')
```

### `expectError(result: Result<any>): Error`

Assert that a Result is an error and return it.

```typescript
const result = await riskyOperation()
const error = expectError(result)
expect(error.message).toContain('Permission denied')

// With type assertion
const fsError = expectError<FileSystemError>(result)
expect(fsError.code).toBe('EACCES')
```

## Test Runners

### `runCommand(command: Command, options: RunOptions): Promise<Result<void>>`

Run a command with test context.

```typescript
import { runCommand } from '@esteban-url/trailhead-cli/testing'

test('init command', async () => {
  const result = await runCommand(initCommand, {
    args: { template: 'basic' },
    filesystem: mockFileSystem(),
    prompts: mockPrompts({
      'Project name?': 'my-project',
    }),
  })

  expectResult(result)
})
```

### `CommandTestRunner`

Advanced test runner with fluent API.

```typescript
import { CommandTestRunner } from '@esteban-url/trailhead-cli/testing'

const runner = new CommandTestRunner(myCommand)
  .withArgs({ input: 'test.txt' })
  .withFiles({
    'test.txt': 'content',
  })
  .withPrompts({
    'Confirm?': true,
  })
  .expectSuccess()
  .expectFile('output.txt', 'processed content')
  .expectLog('info', 'Processing test.txt')

await runner.run()
```

## Testing Patterns

### Testing File Operations

```typescript
test('processes files correctly', async () => {
  const fs = mockFileSystem({
    'input.txt': 'Hello, World!',
    'config.json': '{"uppercase": true}',
  })

  const context = createTestContext({ filesystem: fs })

  const result = await processCommand.execute({ file: 'input.txt' }, context)

  expectResult(result)

  // Verify output
  const output = await fs.readFile('output.txt')
  expect(expectResult(output)).toBe('HELLO, WORLD!')
})
```

### Testing Interactive Commands

```typescript
test('interactive setup', async () => {
  const prompts = mockPrompts({
    'Project name:': 'awesome-cli',
    'Choose template:': 'typescript',
    'Install dependencies?': true,
  })

  const fs = mockFileSystem()
  const logger = mockLogger()

  const context = createTestContext({
    filesystem: fs,
    prompts,
    logger,
  })

  const result = await setupCommand.execute({}, context)
  expectResult(result)

  // Verify created files
  expect(await fs.exists('awesome-cli/package.json')).toEqual({
    success: true,
    value: true,
  })

  // Verify logs
  expect(
    logger.logs.some((l) => l.level === 'success' && l.message.includes('Project created'))
  ).toBe(true)
})
```

### Testing Error Cases

```typescript
test('handles missing file', async () => {
  const fs = mockFileSystem() // No files
  const context = createTestContext({ filesystem: fs })

  const result = await readCommand.execute({ file: 'missing.txt' }, context)

  const error = expectError(result)
  expect(error.message).toContain('File not found')
  expect(error.code).toBe('ENOENT')
})
```

### Testing Validation

```typescript
test('validates options', async () => {
  const context = createTestContext()

  const result = await deployCommand.execute({ environment: 'invalid' }, context)

  const error = expectError(result)
  expect(error.message).toContain('Invalid environment')
})
```

## Cross-Platform Testing

### Path Utilities

```typescript
import { normalizePath, joinPath, resolvePath } from '@esteban-url/trailhead-cli/testing'

// Normalize paths for consistent testing
const path1 = normalizePath('C:\\Users\\test\\file.txt')
const path2 = normalizePath('/Users/test/file.txt')

// Join paths safely
const fullPath = joinPath('/base', 'sub', 'file.txt')

// Resolve relative paths
const absolute = resolvePath('./config.json', '/project')
```

## Test Fixtures

### Creating Test Contexts with Files

```typescript
import { createTestContextWithFiles } from '@esteban-url/trailhead-cli/testing'

const context = await createTestContextWithFiles({
  'src/index.ts': 'export const hello = "world";',
  'package.json': JSON.stringify({
    name: 'test-project',
    version: '1.0.0',
  }),
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
    },
  }),
})
```

## Vitest Integration

Example test setup with Vitest:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestContext, mockFileSystem } from '@esteban-url/trailhead-cli/testing'
import { myCommand } from '../src/commands/my-command'

describe('MyCommand', () => {
  let context: TestContext

  beforeEach(() => {
    context = createTestContext({
      filesystem: mockFileSystem(),
    })
  })

  it('should execute successfully', async () => {
    const result = await myCommand.execute({}, context)
    expect(result.success).toBe(true)
  })
})
```

## Best Practices

1. **Isolate tests** - Use fresh mocks for each test
2. **Test edge cases** - Empty files, missing directories, etc.
3. **Verify side effects** - Check files created, logs written
4. **Mock external calls** - Don't hit real filesystem/network
5. **Use type-safe mocks** - Leverage TypeScript for safety

## Type Reference

```typescript
// Test context
interface TestContext extends CommandContext {
  fs: FileSystem
  logger: MockLogger
}

// Mock types
interface MockLogger extends Logger {
  logs: Array<{ level: string; message: string }>
  clear(): void
}

interface MockPrompts {
  prompt(options: any): Promise<string>
  select(options: any): Promise<string>
  confirm(options: any): Promise<boolean>
  multiselect(options: any): Promise<string[]>
  hasUnusedResponses(): boolean
}

// Runner options
interface RunOptions {
  args?: Record<string, any>
  filesystem?: FileSystem
  logger?: Logger
  prompts?: MockPrompts
}

// Assertion returns
function expectResult<T>(result: Result<T>, message?: string): T
function expectError<E = Error>(result: Result<any>, message?: string): E
```

## See Also

- [Testing Guide](../how-to/testing-guide.md) - Testing best practices
- [Getting Started](../getting-started.md) - Basic testing example
- [Common Patterns](../how-to/common-patterns.md) - Testing patterns
