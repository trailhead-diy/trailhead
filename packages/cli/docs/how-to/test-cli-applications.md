---
type: how-to
title: 'Test CLI Applications'
description: 'Write high-ROI tests for your CLI commands and workflows'
prerequisites:
  - 'Basic testing knowledge (Jest/Vitest)'
  - 'Understanding of Result types'
  - 'Familiarity with CLI command structure'
related:
  - ../reference/testing.md
  - ../reference/command.md
  - ./handle-errors-in-cli.md
---

# Test CLI Applications

This guide shows you how to write effective tests for CLI applications using the framework's testing utilities.

## Testing Philosophy

Focus on high-ROI (Return on Investment) tests:

- **Test user interactions** - Commands, options, arguments
- **Test business logic** - Data transformations, calculations
- **Test integration points** - Commands working together
- **Skip low-ROI tests** - Basic rendering, prop forwarding

## Setting Up Tests

### Step 1: Install Test Dependencies

```bash
npm install -D vitest @vitest/ui
```

### Step 2: Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

### Step 3: Import Testing Utilities

```typescript
import {
  createTestContext,
  mockFileSystem,
  mockLogger,
  mockPrompts,
} from '@esteban-url/cli/testing'
```

## Testing Commands

### Basic Command Test

```typescript
import { describe, it, expect } from 'vitest'
import { myCommand } from '../src/commands/my-command'
import { createTestContext } from '@esteban-url/cli/testing'

describe('myCommand', () => {
  it('executes successfully with valid options', async () => {
    const context = createTestContext()

    const result = await myCommand.execute({ name: 'test' }, context)

    expect(result.success).toBe(true)
  })
})
```

### Testing Command with File Operations

```typescript
import { mockFileSystem } from '@esteban-url/cli/testing'

it('processes input file', async () => {
  // Arrange: Set up mock filesystem
  const fs = mockFileSystem({
    '/input.txt': 'Hello, World!',
  })

  const context = createTestContext({ fs })

  // Act: Execute command
  const result = await processCommand.execute(
    { input: '/input.txt', output: '/output.txt' },
    context
  )

  // Assert: Check results
  expect(result.success).toBe(true)
  expect(await fs.readFile('/output.txt')).toEqual({
    success: true,
    value: 'HELLO, WORLD!',
  })
})
```

### Testing Interactive Commands

```typescript
import { mockPrompts } from '@esteban-url/cli/testing'

it('handles user prompts', async () => {
  const prompts = mockPrompts({
    'Enter name:': 'Alice',
    'Choose color:': 'blue',
    'Confirm?': true,
  })

  const context = createTestContext({ prompts })

  const result = await interactiveCommand.execute({}, context)

  expect(result.success).toBe(true)
  expect(prompts.getAllResponses()).toEqual({
    'Enter name:': 'Alice',
    'Choose color:': 'blue',
    'Confirm?': true,
  })
})
```

## Testing Error Scenarios

### Test Error Handling

```typescript
it('handles missing file gracefully', async () => {
  const fs = mockFileSystem() // Empty filesystem
  const context = createTestContext({ fs })

  const result = await readCommand.execute({ file: '/missing.txt' }, context)

  expect(result.success).toBe(false)
  expect(result.error?.message).toContain('File not found')
})
```

### Test Validation Errors

```typescript
it('validates required options', async () => {
  const context = createTestContext()

  const result = await commandWithValidation.execute({ email: 'invalid-email' }, context)

  expect(result.success).toBe(false)
  expect(result.error?.message).toContain('Invalid email format')
})
```

## Testing Workflows

### Test Multi-Step Workflows

```typescript
import { createTaskList } from '@esteban-url/cli/workflows'

it('completes workflow successfully', async () => {
  const context = createTestContext()
  const workflowContext = {
    input: 'data.csv',
    processed: false,
    saved: false,
  }

  const tasks = createTaskList([
    createTask('Load data', async (ctx) => {
      ctx.processed = true
    }),
    createTask('Save results', async (ctx) => {
      ctx.saved = true
    }),
  ])

  const result = await tasks.run(workflowContext)

  expect(result.success).toBe(true)
  expect(workflowContext.processed).toBe(true)
  expect(workflowContext.saved).toBe(true)
})
```

### Test Conditional Workflows

```typescript
it('skips steps based on conditions', async () => {
  const context = createTestContext()

  const result = await conditionalWorkflow.execute({ skipValidation: true }, context)

  expect(result.success).toBe(true)
  expect(context.logger.getMessages()).not.toContain('Validating...')
})
```

## Testing Logger Output

### Capture and Assert Logs

```typescript
import { mockLogger } from '@esteban-url/cli/testing'

it('logs appropriate messages', async () => {
  const logger = mockLogger()
  const context = createTestContext({ logger })

  await verboseCommand.execute({ verbose: true }, context)

  const logs = logger.getMessages()
  expect(logs).toContain('Starting process...')
  expect(logs).toContain('Process complete!')

  const errors = logger.getErrors()
  expect(errors).toHaveLength(0)
})
```

### Test Different Log Levels

```typescript
it('respects verbose flag', async () => {
  const logger = mockLogger()
  const context = createTestContext({ logger, verbose: false })

  await command.execute({}, context)

  const debugLogs = logger.getDebugMessages()
  expect(debugLogs).toHaveLength(0)
})
```

## Testing with Fixtures

### Create Reusable Test Data

```typescript
// test/fixtures/csv-data.ts
export const validCSV = `name,email,age
Alice,alice@example.com,30
Bob,bob@example.com,25`

export const invalidCSV = `name,email,age
Alice,invalid-email,thirty`

// In your test
import { validCSV, invalidCSV } from './fixtures/csv-data'

it('processes valid CSV', async () => {
  const fs = mockFileSystem({
    '/data.csv': validCSV,
  })
  // ... rest of test
})
```

## Integration Testing

### Test Command Combinations

```typescript
it('init and build commands work together', async () => {
  const fs = mockFileSystem()
  const context = createTestContext({ fs })

  // Initialize project
  const initResult = await initCommand.execute({ name: 'my-project' }, context)
  expect(initResult.success).toBe(true)

  // Build project
  const buildResult = await buildCommand.execute({ project: 'my-project' }, context)
  expect(buildResult.success).toBe(true)

  // Verify output
  expect(await fs.exists('my-project/dist')).toEqual({
    success: true,
    value: true,
  })
})
```

## Testing Best Practices

### 1. Use Descriptive Test Names

```typescript
// Good
it('returns error when config file is missing')
it('transforms CSV data to JSON format')
it('prompts for confirmation before deleting files')

// Less helpful
it('works')
it('handles errors')
it('test 1')
```

### 2. Follow AAA Pattern

```typescript
it('processes file with custom delimiter', async () => {
  // Arrange
  const fs = mockFileSystem({
    '/data.tsv': 'name\tage\nAlice\t30',
  })
  const context = createTestContext({ fs })

  // Act
  const result = await parseCommand.execute({ file: '/data.tsv', delimiter: '\t' }, context)

  // Assert
  expect(result.success).toBe(true)
  expect(result.value).toEqual([{ name: 'Alice', age: '30' }])
})
```

### 3. Test Edge Cases

```typescript
describe('parseNumber command', () => {
  it.each([
    ['positive integer', '42', 42],
    ['negative integer', '-42', -42],
    ['decimal', '3.14', 3.14],
    ['scientific notation', '1e5', 100000],
    ['zero', '0', 0],
  ])('parses %s correctly', async (_, input, expected) => {
    const result = await parseNumber(input)
    expect(result.value).toBe(expected)
  })

  it.each([
    ['empty string', ''],
    ['non-numeric', 'abc'],
    ['mixed', '12abc'],
  ])('returns error for %s', async (_, input) => {
    const result = await parseNumber(input)
    expect(result.success).toBe(false)
  })
})
```

### 4. Mock External Dependencies

```typescript
it('fetches data from API', async () => {
  // Mock fetch to avoid real network calls
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'test' }),
  })

  global.fetch = mockFetch

  const result = await fetchCommand.execute({ url: 'https://api.example.com/data' }, context)

  expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data')
  expect(result.success).toBe(true)
})
```

## Performance Testing

### Test Command Performance

```typescript
it('processes large file within timeout', async () => {
  // Generate large test data
  const largeData = Array(10000)
    .fill(null)
    .map((_, i) => `line${i}`)
    .join('\n')

  const fs = mockFileSystem({
    '/large.txt': largeData,
  })
  const context = createTestContext({ fs })

  const start = Date.now()
  const result = await processCommand.execute({ file: '/large.txt' }, context)
  const duration = Date.now() - start

  expect(result.success).toBe(true)
  expect(duration).toBeLessThan(1000) // Should complete in < 1 second
})
```

## Snapshot Testing

### Test Complex Output

```typescript
it('generates correct configuration', async () => {
  const fs = mockFileSystem()
  const context = createTestContext({ fs })

  await generateConfigCommand.execute({ template: 'advanced' }, context)

  const config = await fs.readJSON('/config.json')
  expect(config.value).toMatchSnapshot()
})
```

## Common Pitfalls

### 1. Testing Implementation Details

```typescript
// Avoid: Testing internal state
it('sets internal flag', async () => {
  const command = new MyCommand()
  command.execute()
  expect(command._internalFlag).toBe(true) // Don't do this
})

// Better: Test observable behavior
it('creates output file', async () => {
  const result = await command.execute()
  expect(await fs.exists('/output.txt')).toBe(true)
})
```

### 2. Not Cleaning Up

```typescript
// Use test lifecycle hooks
describe('file operations', () => {
  let fs: ReturnType<typeof mockFileSystem>

  beforeEach(() => {
    fs = mockFileSystem()
  })

  afterEach(() => {
    fs.clear() // Clean up after each test
  })
})
```

### 3. Over-Mocking

```typescript
// Avoid: Mocking everything
const mockCommand = {
  execute: vi.fn().mockResolvedValue({ success: true }),
}

// Better: Use real command with mocked dependencies
const fs = mockFileSystem()
const context = createTestContext({ fs })
const result = await realCommand.execute(options, context)
```

## Next Steps

- Review [Testing API Reference](../reference/testing.md)
- Learn about [Error Handling](./handle-errors-in-cli.md)
- Explore [Command Patterns](../reference/command.md)
