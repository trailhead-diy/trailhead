# Testing Patterns

This document describes the testing patterns and utilities used in @esteban-url/create-cli, aligned with CLI framework principles.

## Overview

The create-cli package uses a comprehensive testing approach that combines:

- **CLI framework testing utilities** for consistent Result type testing
- **High-ROI testing philosophy** focusing on business logic and integration
- **Both traditional and functional testing patterns** for maximum flexibility
- **Domain-specific testing utilities** for scaffolding and template operations

## Testing Setup

### Basic Setup

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { expectResult, expectSuccess, expectError } from '@esteban-url/cli/testing'
import { setupResultMatchers } from '@esteban-url/core/testing'

// Setup Result matchers for better testing
setupResultMatchers()
```

### Test File Structure

```typescript
// Standard test structure
describe('Component Name', () => {
  let testContext: TestContext

  beforeEach(() => {
    testContext = createTestContext()
  })

  afterEach(() => {
    cleanup(testContext)
  })

  describe('success cases', () => {
    it('should handle valid input', async () => {
      // Test implementation
    })
  })

  describe('error cases', () => {
    it('should handle invalid input', async () => {
      // Error test implementation
    })
  })
})
```

## CLI Framework Testing Utilities

### Result Type Assertions

```typescript
// Success assertions
const result = await operation()
expectSuccess(result)
expect(result).toBeOk()
expect(result).toHaveValue(expectedValue)

// Error assertions
const errorResult = await failingOperation()
expectError(errorResult)
expect(errorResult).toBeErr()
expect(errorResult).toHaveError(expectedError)
```

### Command Testing

```typescript
import { runCommand, createTestContext } from '@esteban-url/cli/testing'

it('should execute generate command successfully', async () => {
  const context = createTestContext()
  const result = await runCommand(generateCommand, ['my-cli'], context)

  expectSuccess(result)
  expect(context.logger.logs).toContain('Successfully generated')
})
```

## Domain-Specific Testing

### Scaffolding Tests

```typescript
import {
  createMockScaffolder,
  assertProjectGeneration,
  validateProjectGeneration,
  templateFixtures,
} from '@esteban-url/create-cli/testing'

describe('Project Scaffolding', () => {
  it('should generate basic project', async () => {
    const scaffolder = createMockScaffolder()
    const result = await scaffolder.generateProject('my-cli', 'basic')

    // Traditional assertion (throws on failure)
    assertProjectGeneration(result, 'my-cli', 15)

    // Functional validation (returns Result)
    const validation = validateProjectGeneration(result, 'my-cli', 15)
    expectSuccess(validation)
  })
})
```

### Template Testing

```typescript
import {
  testTemplateRendering,
  assertTemplateRendering,
  templateFixtures,
} from '@esteban-url/create-cli/testing'

describe('Template Rendering', () => {
  it('should render package.json template', async () => {
    const { template, variables, expected } = templateFixtures.packageJson

    const result = await testTemplateRendering(template, variables)
    assertTemplateRendering(result, expected)
  })

  it('should handle missing variables', async () => {
    const result = await testTemplateRendering('{{missing}}', {})
    expectError(result)

    if (result.isErr()) {
      expect(result.error.code).toBe('UNRESOLVED_VARIABLES')
    }
  })
})
```

## Testing Utilities Reference

### Traditional Assertions (Throw-based)

```typescript
// Project generation assertions
assertProjectGeneration(
  result: Result<GeneratedProject, CoreError>,
  expectedProjectName: string,
  expectedFileCount?: number
): void

// Template rendering assertions
assertTemplateRendering(
  result: Result<string, CoreError>,
  expectedContent?: string
): void

// Validation failure assertions
assertValidationFailure(
  result: Result<void, CoreError>,
  expectedErrorCode: string
): void

// Project file assertions
assertProjectFiles(
  project: GeneratedProject,
  expectedFiles: string[]
): void
```

### Functional Validations (Result-based)

```typescript
// Project generation validation
validateProjectGeneration(
  result: Result<GeneratedProject, CoreError>,
  expectedProjectName: string,
  expectedFileCount?: number
): Result<GeneratedProject, CoreError>

// Template rendering validation
validateTemplateRendering(
  result: Result<string, CoreError>,
  expectedContent?: string
): Result<string, CoreError>

// Expected failure validation
validateExpectedFailure(
  result: Result<any, CoreError>,
  expectedErrorCode: string
): Result<CoreError, CoreError>
```

### Mock Scaffolder

```typescript
const scaffolder = createMockScaffolder()

// Add custom templates
scaffolder.addTemplate({
  id: 'custom',
  name: 'Custom Template',
  description: 'A custom template for testing',
  files: { 'README.md': '# {{projectName}}' },
  variables: [{ name: 'projectName', type: 'string', required: true }],
})

// Generate projects
const result = await scaffolder.generateProject('test-project', 'custom')

// Test template rendering
const renderResult = scaffolder.renderTemplate('Hello {{name}}', { name: 'World' })

// Validate project names
const nameValidation = scaffolder.validateProjectName('my-project')

// Validate template variables
const varValidation = scaffolder.validateVariables(template, variables)
```

## High-ROI Testing Philosophy

### Focus Areas

✅ **High-ROI Tests (Prioritize These)**:

- **Business Logic**: Template compilation, project generation, validation
- **User Interactions**: Command execution, argument parsing, error handling
- **Integration**: Components working together, end-to-end workflows
- **Error Handling**: Edge cases, recovery scenarios, error messages
- **Data Transformations**: Template rendering, configuration processing

❌ **Low-ROI Tests (Avoid These)**:

- **Basic Rendering**: "Component renders without crashing"
- **Props Forwarding**: Testing framework behavior
- **Implementation Details**: Internal state, private methods
- **Type Checking**: Testing TypeScript types at runtime
- **Snapshot Tests**: Brittle tests that break with UI changes

### Example: High-ROI Test

```typescript
it('should generate project with correct package.json', async () => {
  // High-ROI: Tests business logic and integration
  const config = createTestConfig('my-cli', 'advanced')
  const result = await generateProject(config, testContext)

  expectSuccess(result)

  // Verify business logic outcomes
  const packageJson = await readGeneratedFile(result.value.path, 'package.json')
  const parsed = JSON.parse(packageJson)

  expect(parsed.name).toBe('my-cli')
  expect(parsed.dependencies).toHaveProperty('@esteban-url/cli')
  expect(parsed.scripts).toHaveProperty('build')
})
```

### Example: Low-ROI Test (Avoid)

```typescript
it('should render component without crashing', () => {
  // Low-ROI: Tests framework behavior, not business logic
  const component = render(<MyComponent />)
  expect(component).toBeTruthy()
})
```

## Test Organization

### File Structure

```
src/__tests__/
├── integration/              # End-to-end tests
│   ├── cli.test.ts           # CLI command integration
│   └── generator.test.ts     # Full generation workflow
├── unit/                     # Unit tests
│   ├── template-compiler.test.ts
│   ├── args-parser.test.ts
│   └── validation.test.ts
└── fixtures/                 # Test data
    ├── templates/
    └── projects/
```

### Test Categories

```typescript
describe('Template Compiler', () => {
  describe('Unit Tests', () => {
    // Test individual functions
  })

  describe('Integration Tests', () => {
    // Test component interactions
  })

  describe('Error Handling', () => {
    // Test error scenarios
  })

  describe('Performance Tests', () => {
    // Test performance characteristics
  })
})
```

## Error Testing Patterns

### Testing Expected Errors

```typescript
it('should fail with invalid template name', async () => {
  const result = await parseArguments(['--template', 'invalid'])

  expectError(result)
  expect(result).toBeErr()

  if (result.isErr()) {
    expect(result.error.code).toBe(ERROR_CODES.INVALID_TEMPLATE_VALUE)
    expect(result.error.suggestion).toBe(ERROR_SUGGESTIONS.TEMPLATE_OPTIONS)
  }
})
```

### Testing Error Recovery

```typescript
it('should recover from transient failures', async () => {
  const mockFail = vi
    .fn()
    .mockRejectedValueOnce(new Error('Temporary failure'))
    .mockResolvedValueOnce('Success')

  const result = await retryOperation(mockFail, { maxRetries: 2 })

  expectSuccess(result)
  expect(mockFail).toHaveBeenCalledTimes(2)
})
```

### Testing Error Context

```typescript
it('should provide helpful error context', async () => {
  const result = await validateProjectName('')

  expectError(result)

  if (result.isErr()) {
    expect(result.error.context).toMatchObject({
      operation: 'validateProjectName',
      recoverable: true,
    })
    expect(result.error.suggestion).toContain('Project name')
  }
})
```

## Performance Testing

### Template Compilation Performance

```typescript
it('should compile templates within performance bounds', async () => {
  const startTime = performance.now()

  const results = await Promise.all(
    Array.from({ length: 100 }, (_, i) =>
      compileTemplate(`template-${i}.hbs`, testContext, compilerContext)
    )
  )

  const endTime = performance.now()
  const duration = endTime - startTime

  expect(duration).toBeLessThan(1000) // 1 second max
  results.forEach((result) => expectSuccess(result))
})
```

### Memory Usage Testing

```typescript
it('should not leak memory during template caching', async () => {
  const initialMemory = process.memoryUsage().heapUsed

  // Generate many templates
  for (let i = 0; i < 1000; i++) {
    await compileTemplate('template.hbs', {}, compilerContext)
  }

  // Force garbage collection if available
  if (global.gc) global.gc()

  const finalMemory = process.memoryUsage().heapUsed
  const memoryIncrease = finalMemory - initialMemory

  // Memory should not increase significantly
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB max
})
```

## Test Data Management

### Fixtures

```typescript
// Use template fixtures for consistent test data
import { templateFixtures } from '@esteban-url/create-cli/testing'

const { template, variables, expected } = templateFixtures.packageJson
```

### Test Context Creation

```typescript
function createTestConfig(name: string, template: 'basic' | 'advanced') {
  return {
    projectName: name,
    projectPath: `/tmp/test-${name}`,
    template,
    packageManager: 'pnpm' as const,
    // ... other config
  }
}
```

### Cleanup

```typescript
afterEach(async () => {
  // Clean up test files
  await cleanupTestDirectories()

  // Clear caches
  clearTemplateCache(compilerContext)

  // Reset mocks
  vi.restoreAllMocks()
})
```

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ✅ Good: Descriptive
it('should generate advanced project with config and validation modules', async () => {})

// ❌ Avoid: Generic
it('should work', async () => {})
```

### 2. Test One Thing Per Test

```typescript
// ✅ Good: Single responsibility
it('should validate project name format', async () => {})
it('should suggest valid project names', async () => {})

// ❌ Avoid: Multiple concerns
it('should validate project name and generate project', async () => {})
```

### 3. Use Arrange-Act-Assert Pattern

```typescript
it('should render template with variables', async () => {
  // Arrange
  const template = 'Hello {{name}}'
  const variables = { name: 'World' }

  // Act
  const result = await renderTemplate(template, variables)

  // Assert
  expectSuccess(result)
  expect(result.value).toBe('Hello World')
})
```

### 4. Test Edge Cases

```typescript
describe('edge cases', () => {
  it('should handle empty template', async () => {})
  it('should handle missing variables', async () => {})
  it('should handle circular references', async () => {})
  it('should handle very large templates', async () => {})
})
```

### 5. Use Data-Driven Tests

```typescript
const testCases = [
  { input: 'valid-name', expected: true },
  { input: 'invalid name', expected: false },
  { input: '', expected: false },
]

testCases.forEach(({ input, expected }) => {
  it(`should validate "${input}" as ${expected}`, async () => {
    const result = await validateProjectName(input)
    expect(result.isOk()).toBe(expected)
  })
})
```

## See Also

- [CLI Framework Migration Guide](./CLI_FRAMEWORK_MIGRATION.md)
- [Error Handling Patterns](./ERROR_HANDLING.md)
- [CLI Testing Documentation](../../../cli/src/testing/README.md)
- [Core Testing Utilities](../../../core/src/testing/README.md)
