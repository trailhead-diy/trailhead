# Testing CLI Applications Guide

This guide covers comprehensive testing strategies for CLI applications built with @trailhead/cli, including unit tests, integration tests, and end-to-end testing patterns.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Setting Up Tests](#setting-up-tests)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Testing Commands](#testing-commands)
6. [Testing File Operations](#testing-file-operations)
7. [Testing User Interactions](#testing-user-interactions)
8. [Testing Error Scenarios](#testing-error-scenarios)
9. [Advanced Testing Patterns](#advanced-testing-patterns)
10. [Best Practices](#best-practices)

## Testing Philosophy

@trailhead/cli follows these testing principles:

1. **Test behavior, not implementation** - Focus on what your code does, not how
2. **Use real implementations when possible** - Prefer memory filesystem over mocks
3. **Test error paths thoroughly** - Errors are part of your API
4. **Keep tests fast and isolated** - No real I/O in unit tests
5. **Make tests readable** - Tests are documentation

## Setting Up Tests

### Basic Test Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'tests']
    }
  }
})
```

### Test Structure

```typescript
// tests/commands/deploy.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestContext, mockFileSystem } from '@trailhead/cli/testing'
import { deployCommand } from '../../src/commands/deploy'

describe('Deploy Command', () => {
  let context: CommandContext
  let fs: FileSystem

  beforeEach(() => {
    fs = mockFileSystem({
      '/project/package.json': JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      })
    })
    context = createTestContext({ filesystem: fs })
  })

  it('should deploy successfully', async () => {
    const result = await deployCommand.execute(
      { environment: 'staging' },
      context
    )

    expect(result.success).toBe(true)
  })
})
```

## Unit Testing

### Testing Pure Functions

```typescript
import { describe, it, expect } from 'vitest'
import { validateEmail, parseConfig, transformData } from '../src/utils'

describe('Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const result = validateEmail('user@example.com')
      expect(result.success).toBe(true)
    })

    it('should reject invalid emails', () => {
      const result = validateEmail('invalid-email')
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INVALID_EMAIL')
    })

    it('should provide helpful error messages', () => {
      const result = validateEmail('user@')
      expect(result.success).toBe(false)
      expect(result.error.suggestion).toContain('user@example.com')
    })
  })
})
```

### Testing with Results

```typescript
describe('Configuration Parser', () => {
  it('should parse valid configuration', () => {
    const input = `
      port: 3000
      host: localhost
    `
    
    const result = parseConfig(input)
    
    expect(result).toEqual(ok({
      port: 3000,
      host: 'localhost'
    }))
  })

  it('should handle parsing errors', () => {
    const input = 'invalid: [yaml'
    
    const result = parseConfig(input)
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('PARSE_ERROR')
      expect(result.error.recoverable).toBe(true)
    }
  })
})
```

### Testing Async Operations

```typescript
describe('API Client', () => {
  it('should fetch data successfully', async () => {
    const client = createTestClient({
      responses: {
        '/api/users': { users: [{ id: 1, name: 'John' }] }
      }
    })

    const result = await client.getUsers()

    expect(result).toEqual(ok({
      users: [{ id: 1, name: 'John' }]
    }))
  })

  it('should handle network errors', async () => {
    const client = createTestClient({
      errors: {
        '/api/users': new Error('Network timeout')
      }
    })

    const result = await client.getUsers()

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('NETWORK_ERROR')
      expect(result.error.timeout).toBe(true)
    }
  })
})
```

## Integration Testing

### Testing Command Integration

```typescript
describe('Build Pipeline Integration', () => {
  let context: CommandContext
  let fs: FileSystem

  beforeEach(() => {
    fs = createMemoryFileSystem({
      '/project/src/index.ts': 'console.log("Hello")',
      '/project/tsconfig.json': JSON.stringify({
        compilerOptions: {
          outDir: './dist',
          target: 'ES2020'
        }
      })
    })
    context = createTestContext({ filesystem: fs })
  })

  it('should build project end-to-end', async () => {
    // Run build command
    const buildResult = await buildCommand.execute({}, context)
    expect(buildResult.success).toBe(true)

    // Verify output files
    const distExists = await fs.exists('/project/dist/index.js')
    expect(distExists.value).toBe(true)

    // Verify content transformation
    const output = await fs.readFile('/project/dist/index.js')
    expect(output.value).toContain('console.log("Hello")')
  })
})
```

### Testing Multi-Command Workflows

```typescript
describe('Project Initialization Workflow', () => {
  it('should initialize and configure project', async () => {
    const context = createTestContext()

    // Step 1: Initialize project
    const initResult = await initCommand.execute(
      { name: 'my-app', template: 'typescript' },
      context
    )
    expect(initResult.success).toBe(true)

    // Step 2: Install dependencies
    const installResult = await installCommand.execute({}, context)
    expect(installResult.success).toBe(true)

    // Step 3: Configure project
    const configResult = await configureCommand.execute(
      { port: 3000, database: 'postgres' },
      context
    )
    expect(configResult.success).toBe(true)

    // Verify final state
    const config = await context.fs.readJson('/my-app/config.json')
    expect(config.value).toMatchObject({
      port: 3000,
      database: 'postgres'
    })
  })
})
```

## Testing Commands

### Basic Command Testing

```typescript
import { createCommand } from '@trailhead/cli/command'
import { createTestContext } from '@trailhead/cli/testing'

describe('Greet Command', () => {
  const greetCommand = createCommand({
    name: 'greet',
    options: [
      { name: 'name', type: 'string', required: true }
    ],
    action: async (options, context) => {
      context.logger.info(`Hello, ${options.name}!`)
      return ok(undefined)
    }
  })

  it('should greet user', async () => {
    const context = createTestContext()
    const logs: string[] = []
    
    // Spy on logger
    context.logger.info = vi.fn((msg) => logs.push(msg))

    const result = await greetCommand.execute(
      { name: 'Alice' },
      context
    )

    expect(result.success).toBe(true)
    expect(logs).toContain('Hello, Alice!')
  })
})
```

### Testing Command Validation

```typescript
describe('Deploy Command Validation', () => {
  it('should validate environment option', async () => {
    const context = createTestContext()

    const result = await deployCommand.execute(
      { environment: 'invalid-env' },
      context
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_ENVIRONMENT')
      expect(result.error.field).toBe('environment')
    }
  })

  it('should require authentication for production', async () => {
    const context = createTestContext()
    
    // Mock auth check
    context.auth = { isAuthenticated: false }

    const result = await deployCommand.execute(
      { environment: 'production' },
      context
    )

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('AUTH_REQUIRED')
      expect(result.error.suggestion).toContain('login')
    }
  })
})
```

### Testing Phased Execution

```typescript
describe('Migration Command', () => {
  it('should execute phases in order', async () => {
    const executedPhases: string[] = []
    const context = createTestContext()

    const phases = [
      {
        name: 'Validate',
        execute: async () => {
          executedPhases.push('validate')
          return ok({})
        }
      },
      {
        name: 'Backup',
        execute: async () => {
          executedPhases.push('backup')
          return ok({})
        }
      },
      {
        name: 'Migrate',
        execute: async () => {
          executedPhases.push('migrate')
          return ok({})
        }
      }
    ]

    await executeWithPhases(phases, {}, context)

    expect(executedPhases).toEqual(['validate', 'backup', 'migrate'])
  })

  it('should stop on phase failure', async () => {
    const executedPhases: string[] = []
    const context = createTestContext()

    const phases = [
      {
        name: 'Phase 1',
        execute: async () => {
          executedPhases.push('phase1')
          return ok({})
        }
      },
      {
        name: 'Phase 2',
        execute: async () => {
          executedPhases.push('phase2')
          return err(createError({ message: 'Phase 2 failed' }))
        }
      },
      {
        name: 'Phase 3',
        execute: async () => {
          executedPhases.push('phase3')
          return ok({})
        }
      }
    ]

    const result = await executeWithPhases(phases, {}, context)

    expect(result.success).toBe(false)
    expect(executedPhases).toEqual(['phase1', 'phase2'])
    // Phase 3 should not execute
  })
})
```

## Testing File Operations

### Using Memory FileSystem

```typescript
describe('File Processor', () => {
  let fs: FileSystem

  beforeEach(() => {
    fs = createMemoryFileSystem({
      '/input/data.json': JSON.stringify({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      }),
      '/input/config.yaml': `
        settings:
          timeout: 30
          retries: 3
      `
    })
  })

  it('should process JSON files', async () => {
    const processor = new FileProcessor(fs)
    
    const result = await processor.processFile('/input/data.json')
    
    expect(result.success).toBe(true)
    
    // Check output was created
    const output = await fs.readJson('/output/data.processed.json')
    expect(output.value.users).toHaveLength(2)
    expect(output.value.processedAt).toBeDefined()
  })

  it('should handle missing files', async () => {
    const processor = new FileProcessor(fs)
    
    const result = await processor.processFile('/input/missing.json')
    
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('FILE_NOT_FOUND')
  })
})
```

### Testing File Watching

```typescript
describe('File Watcher', () => {
  it('should detect file changes', async () => {
    const fs = createMemoryFileSystem()
    const changes: string[] = []
    
    const watcher = new FileWatcher(fs)
    watcher.on('change', (path) => changes.push(path))
    
    // Start watching
    await watcher.watch('/config')
    
    // Simulate file changes
    await fs.writeFile('/config/app.json', '{"version": "1.0.0"}')
    await fs.writeFile('/config/db.json', '{"host": "localhost"}')
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(changes).toContain('/config/app.json')
    expect(changes).toContain('/config/db.json')
    
    watcher.stop()
  })
})
```

## Testing User Interactions

### Mocking Prompts

```typescript
import { vi } from 'vitest'
import { prompt, confirm, select } from '@trailhead/cli/prompts'

// Mock the prompts module
vi.mock('@trailhead/cli/prompts', () => ({
  prompt: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn()
}))

describe('Interactive Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle user input', async () => {
    // Setup mock responses
    vi.mocked(prompt).mockResolvedValueOnce('my-project')
    vi.mocked(select).mockResolvedValueOnce('typescript')
    vi.mocked(confirm).mockResolvedValueOnce(true)

    const result = await initCommand.execute({}, context)

    expect(result.success).toBe(true)
    expect(prompt).toHaveBeenCalledWith({
      message: 'Project name:',
      validate: expect.any(Function)
    })
    expect(select).toHaveBeenCalledWith({
      message: 'Choose a template:',
      choices: expect.arrayContaining(['typescript', 'javascript'])
    })
  })
})
```

### Testing Interactive Flows

```typescript
describe('Interactive Installation', () => {
  it('should guide user through installation', async () => {
    const responses = {
      projectName: 'my-app',
      framework: 'react',
      typescript: true,
      eslint: true,
      prettier: true
    }

    // Mock prompt responses in sequence
    mockPromptSequence([
      responses.projectName,
      responses.framework,
      responses.typescript,
      responses.eslint,
      responses.prettier
    ])

    const result = await installCommand.execute(
      { interactive: true },
      context
    )

    expect(result.success).toBe(true)
    
    // Verify generated package.json
    const pkg = await context.fs.readJson('/my-app/package.json')
    expect(pkg.value.devDependencies).toHaveProperty('typescript')
    expect(pkg.value.devDependencies).toHaveProperty('eslint')
    expect(pkg.value.devDependencies).toHaveProperty('prettier')
  })
})
```

## Testing Error Scenarios

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  it('should handle file system errors gracefully', async () => {
    const fs = createMemoryFileSystem()
    
    // Make filesystem read-only for this test
    fs.writeFile = async () => err(createFileSystemError({
      path: '/readonly',
      operation: 'write',
      message: 'File system is read-only',
      code: 'EROFS'
    }))

    const result = await saveDataCommand.execute(
      { output: '/readonly/data.json' },
      createTestContext({ filesystem: fs })
    )

    expect(result.success).toBe(false)
    expect(result.error.code).toBe('EROFS')
    expect(result.error.suggestion).toContain('permissions')
  })

  it('should handle validation errors', async () => {
    const result = await createUserCommand.execute(
      { 
        username: 'a', // Too short
        email: 'invalid-email',
        age: -5
      },
      context
    )

    expect(result.success).toBe(false)
    if (!result.success && result.error.code === 'VALIDATION_FAILED') {
      const errors = result.error.errors
      expect(errors).toHaveLength(3)
      expect(errors.find(e => e.field === 'username')).toBeDefined()
      expect(errors.find(e => e.field === 'email')).toBeDefined()
      expect(errors.find(e => e.field === 'age')).toBeDefined()
    }
  })
})
```

### Testing Recovery Mechanisms

```typescript
describe('Error Recovery', () => {
  it('should attempt recovery on connection failure', async () => {
    let connectionAttempts = 0
    const mockDb = {
      connect: async () => {
        connectionAttempts++
        if (connectionAttempts < 3) {
          return err(createNetworkError({
            message: 'Connection refused',
            code: 'ECONNREFUSED'
          }))
        }
        return ok({ connected: true })
      }
    }

    const result = await connectWithRetry(mockDb, {
      maxAttempts: 3,
      delay: 10
    })

    expect(result.success).toBe(true)
    expect(connectionAttempts).toBe(3)
  })

  it('should rollback on partial failure', async () => {
    const fs = createMemoryFileSystem({
      '/backup/data.json': '{"version": "1.0"}'
    })

    const operations = [
      { name: 'op1', execute: async () => ok(undefined) },
      { name: 'op2', execute: async () => ok(undefined) },
      { name: 'op3', execute: async () => err(createError({ message: 'Failed' })) }
    ]

    const result = await executeWithRollback(operations, {
      rollback: async () => {
        // Restore from backup
        const backup = await fs.readFile('/backup/data.json')
        if (backup.success) {
          await fs.writeFile('/data.json', backup.value)
        }
      }
    })

    expect(result.success).toBe(false)
    
    // Verify rollback was executed
    const data = await fs.readFile('/data.json')
    expect(data.value).toBe('{"version": "1.0"}')
  })
})
```

## Advanced Testing Patterns

### Testing with Fixtures

```typescript
// fixtures/projects.ts
export const createProjectFixture = (name: string) => ({
  [`/${name}/package.json`]: JSON.stringify({
    name,
    version: '1.0.0',
    scripts: {
      build: 'tsc',
      test: 'vitest'
    }
  }),
  [`/${name}/tsconfig.json`]: JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      outDir: './dist'
    }
  }),
  [`/${name}/src/index.ts`]: `
    export function main() {
      console.log('Hello from ${name}')
    }
  `
})

// In tests
describe('Project Builder', () => {
  it('should build TypeScript project', async () => {
    const fs = createMemoryFileSystem({
      ...createProjectFixture('my-app'),
      ...createProjectFixture('my-lib')
    })

    const builder = new ProjectBuilder(fs)
    const result = await builder.buildAll()

    expect(result.success).toBe(true)
    expect(await fs.exists('/my-app/dist/index.js')).toBeTruthy()
    expect(await fs.exists('/my-lib/dist/index.js')).toBeTruthy()
  })
})
```

### Testing with Snapshots

```typescript
describe('Code Generator', () => {
  it('should generate component correctly', async () => {
    const generator = new ComponentGenerator()
    
    const result = await generator.generate({
      name: 'Button',
      props: ['onClick', 'disabled', 'variant'],
      withTests: true
    })

    expect(result.success).toBe(true)
    expect(result.value.component).toMatchInlineSnapshot(`
      "import React from 'react'
      
      export interface ButtonProps {
        onClick?: () => void
        disabled?: boolean
        variant?: 'primary' | 'secondary'
      }
      
      export function Button({ onClick, disabled, variant = 'primary' }: ButtonProps) {
        return (
          <button
            onClick={onClick}
            disabled={disabled}
            className={\`btn btn-\${variant}\`}
          >
            Click me
          </button>
        )
      }"
    `)
  })
})
```

### Performance Testing

```typescript
describe('Performance', () => {
  it('should process large files efficiently', async () => {
    // Create large file
    const largeData = Array(10000)
      .fill(0)
      .map((_, i) => ({ id: i, data: `item-${i}` }))
    
    const fs = createMemoryFileSystem({
      '/large.json': JSON.stringify(largeData)
    })

    const start = performance.now()
    const result = await processLargeFile('/large.json', fs)
    const duration = performance.now() - start

    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(1000) // Should complete in < 1 second
  })

  it('should handle concurrent operations', async () => {
    const fs = createMemoryFileSystem()
    const operations = Array(100)
      .fill(0)
      .map((_, i) => fs.writeFile(`/file-${i}.txt`, `content-${i}`))

    const start = performance.now()
    const results = await Promise.all(operations)
    const duration = performance.now() - start

    expect(results.every(r => r.success)).toBe(true)
    expect(duration).toBeLessThan(100) // Should be fast with memory fs
  })
})
```

### Testing CLI Output

```typescript
describe('CLI Output', () => {
  it('should format output correctly', async () => {
    const output: string[] = []
    const context = createTestContext({
      logger: {
        info: (msg: string) => output.push(msg),
        success: (msg: string) => output.push(`✓ ${msg}`),
        error: (msg: string) => output.push(`✗ ${msg}`),
        warning: (msg: string) => output.push(`⚠ ${msg}`)
      }
    })

    await statusCommand.execute({}, context)

    expect(output).toContain('Project Status:')
    expect(output.some(line => line.includes('✓'))).toBe(true)
    expect(output.join('\n')).toMatchSnapshot()
  })

  it('should show progress correctly', async () => {
    const progress: string[] = []
    const context = createTestContext({
      logger: {
        step: (current: number, total: number, msg: string) => {
          progress.push(`[${current}/${total}] ${msg}`)
        }
      }
    })

    await processCommand.execute({ files: 5 }, context)

    expect(progress).toEqual([
      '[1/5] Processing file 1',
      '[2/5] Processing file 2',
      '[3/5] Processing file 3',
      '[4/5] Processing file 4',
      '[5/5] Processing file 5'
    ])
  })
})
```

## Best Practices

### 1. Use Test Contexts

Always use test contexts for isolation:

```typescript
// ❌ Bad - Uses real filesystem
it('should read config', async () => {
  const config = await fs.readFile('/etc/myapp/config.json')
  expect(config).toBeDefined()
})

// ✅ Good - Uses test context
it('should read config', async () => {
  const context = createTestContext({
    filesystem: createMemoryFileSystem({
      '/etc/myapp/config.json': '{"port": 3000}'
    })
  })
  
  const result = await readConfig(context)
  expect(result.value.port).toBe(3000)
})
```

### 2. Test One Thing at a Time

Keep tests focused:

```typescript
// ❌ Bad - Tests too many things
it('should process user data', async () => {
  const result = await processUser({ 
    name: 'John',
    email: 'john@example.com',
    age: 30
  })
  
  expect(result.success).toBe(true)
  expect(result.value.name).toBe('John')
  expect(result.value.email).toBe('john@example.com')
  expect(result.value.age).toBe(30)
  expect(result.value.id).toBeDefined()
  expect(result.value.createdAt).toBeDefined()
  expect(await userExists(result.value.id)).toBe(true)
})

// ✅ Good - Separate concerns
describe('processUser', () => {
  it('should validate required fields', async () => {
    const result = await processUser({ name: '', email: '' })
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  it('should generate user ID', async () => {
    const result = await processUser(validUserData)
    expect(result.value.id).toMatch(/^user_[a-z0-9]+$/)
  })

  it('should set creation timestamp', async () => {
    const before = Date.now()
    const result = await processUser(validUserData)
    const after = Date.now()
    
    expect(result.value.createdAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.value.createdAt.getTime()).toBeLessThanOrEqual(after)
  })
})
```

### 3. Use Descriptive Test Names

Write tests as documentation:

```typescript
// ❌ Bad
it('should work', async () => {})
it('error case', async () => {})
it('test 3', async () => {})

// ✅ Good
it('should return error when config file is missing', async () => {})
it('should use default port when not specified in config', async () => {})
it('should validate port number is within valid range (1-65535)', async () => {})
```

### 4. Setup Shared Test Utilities

Create reusable test helpers:

```typescript
// test-utils.ts
export function createAuthenticatedContext(role: 'user' | 'admin' = 'user') {
  return createTestContext({
    auth: {
      isAuthenticated: true,
      user: { id: 'test-user', role },
      token: 'test-token'
    }
  })
}

export function createProjectContext(files: Record<string, string> = {}) {
  return createTestContext({
    filesystem: createMemoryFileSystem({
      '/project/package.json': '{"name": "test-project"}',
      ...files
    })
  })
}

// Usage in tests
it('should require admin role', async () => {
  const userContext = createAuthenticatedContext('user')
  const result = await adminCommand.execute({}, userContext)
  expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS')

  const adminContext = createAuthenticatedContext('admin')
  const adminResult = await adminCommand.execute({}, adminContext)
  expect(adminResult.success).toBe(true)
})
```

### 5. Test Error Messages

Ensure errors are helpful:

```typescript
it('should provide helpful error messages', async () => {
  const result = await deployCommand.execute(
    { environment: 'prod', region: 'invalid' },
    context
  )

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.message).toContain('Invalid region')
    expect(result.error.suggestion).toContain('us-east-1')
    expect(result.error.suggestion).toContain('eu-west-1')
  }
})
```

## Summary

Testing CLI applications effectively requires:

1. **Isolation** - Use test contexts and memory filesystems
2. **Clarity** - Write tests that document behavior
3. **Coverage** - Test success paths, error paths, and edge cases
4. **Speed** - Keep tests fast with in-memory operations
5. **Realism** - Test actual command execution, not just functions

By following these patterns, you'll build a robust test suite that gives confidence in your CLI application's behavior.