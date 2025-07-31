# Test Template

This template provides standardized test patterns for the Trailhead monorepo.

## Test File Structure

```typescript
/**
 * Test file for [ComponentName]
 * Tests [brief description of what is being tested]
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { setupDefaultTests } from '@repo/vitest-config/setup'

// Setup common test environment
const testContext = setupDefaultTests()

// Import what you're testing
import { functionToTest } from '../function-to-test.js'

// Import testing utilities
import { createMockSomething } from './testing/mocks.js'
import { testFixtures } from './testing/fixtures.js'

describe('ComponentName', () => {
  // Test group for main functionality
  describe('Main Functionality', () => {
    test('should handle basic operation', async () => {
      // Arrange
      const input = testFixtures.basic

      // Act
      const result = await functionToTest(input)

      // Assert
      expect(result).toBeOk()
      expect(result.value).toBe(expectedValue)
    })

    test('should handle error conditions', async () => {
      // Arrange
      const invalidInput = testFixtures.invalid

      // Act
      const result = await functionToTest(invalidInput)

      // Assert
      expect(result).toBeErr()
      expect(result).toHaveErrorCode('VALIDATION_ERROR')
    })
  })

  // Test group for edge cases
  describe('Edge Cases', () => {
    test('should handle empty input', async () => {
      const result = await functionToTest(null)
      expect(result).toBeErr()
    })

    test('should handle large input', async () => {
      const largeInput = testFixtures.large
      const result = await functionToTest(largeInput)
      expect(result).toBeOk()
    })
  })

  // Test group for integration scenarios
  describe('Integration', () => {
    test('should work with other components', async () => {
      const mock = createMockSomething()
      mock.mockMethod('value')

      const result = await functionToTest(mock)
      expect(result).toBeOk()
    })
  })
})
```

## Test Patterns

### 1. Result Type Testing

```typescript
import { setupResultMatchers } from '@esteban-url/core/testing'

// Setup in test file
setupResultMatchers()

// Test success case
test('should return successful result', async () => {
  const result = await operationThatSucceeds()
  expect(result).toBeOk()
  expect(result).toHaveValue(expectedValue)
})

// Test error case
test('should return error result', async () => {
  const result = await operationThatFails()
  expect(result).toBeErr()
  expect(result).toHaveErrorCode('SPECIFIC_ERROR')
  expect(result).toHaveErrorMessage('Expected error message')
})
```

### 2. Async Operation Testing

```typescript
import { withRetries, createTestTimeout } from '@repo/vitest-config/setup'

test('should complete async operation', async () => {
  const result = await Promise.race([operationWithTimeout(), createTestTimeout(5000)])

  expect(result).toBeDefined()
})

test('should retry on failure', async () => {
  const result = await withRetries(
    () => unreliableOperation(),
    3, // max retries
    100 // delay between retries
  )

  expect(result).toBeDefined()
})
```

### 3. Mock Testing

```typescript
import { vi } from 'vitest'

test('should call external dependency', async () => {
  // Arrange
  const mockDependency = vi.fn().mockResolvedValue('mock result')

  // Act
  const result = await functionThatCallsDependency(mockDependency)

  // Assert
  expect(mockDependency).toHaveBeenCalledWith(expectedArgs)
  expect(result).toBe('mock result')
})

test('should handle dependency failure', async () => {
  // Arrange
  const mockDependency = vi.fn().mockRejectedValue(new Error('Dependency failed'))

  // Act
  const result = await functionThatCallsDependency(mockDependency)

  // Assert
  expect(result).toBeErr()
})
```

### 4. Performance Testing

```typescript
import { setupPerformanceTests } from '@repo/vitest-config/setup'

const perf = setupPerformanceTests()

test('should complete within time limit', async () => {
  perf.performance.startMark('operation')

  await expensiveOperation()

  perf.performance.endMark('operation')

  const duration = perf.performance.getMark('operation')
  expect(duration).toBeLessThan(1000) // 1 second
})
```

### 5. File System Testing

```typescript
import { createTestTempDir, createTestFile } from '@esteban-url/fs/testing'

test('should process file correctly', async () => {
  // Arrange
  const tempDir = await createTestTempDir()
  const testFile = await createTestFile(tempDir, 'test.txt', 'test content')

  // Act
  const result = await processFile(testFile)

  // Assert
  expect(result).toBeOk()
  expect(result.value).toContain('processed')

  // Cleanup handled by test setup
})
```

### 6. CLI Testing

```typescript
import { runCommand, expectCommandSuccess } from '@esteban-url/cli/testing'

test('should execute CLI command', async () => {
  const result = await runCommand('my-cli', ['--option', 'value'])
  expectCommandSuccess(result)
  expect(result.stdout).toContain('expected output')
})

test('should handle CLI errors', async () => {
  const result = await runCommand('my-cli', ['--invalid'])
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain('error message')
})
```

### 7. Component Testing (React)

```typescript
import { renderComponent, simulateUserInteraction } from '@esteban-url/web-ui/testing'

test('should render component correctly', () => {
  const { container } = renderComponent(<MyComponent prop="value" />)

  expect(container.querySelector('.my-component')).toBeInTheDocument()
  expect(container.textContent).toContain('expected text')
})

test('should handle user interaction', async () => {
  const { container, user } = renderComponent(<MyComponent />)
  const button = container.querySelector('button')

  await simulateUserInteraction(user, 'click', button)

  expect(container.textContent).toContain('clicked')
})
```

### 8. Data Processing Testing

```typescript
import { createMockDataProcessor, dataFixtures } from '@esteban-url/data/testing'

test('should process data correctly', async () => {
  const processor = createMockDataProcessor()
  const result = processor.parseData(dataFixtures.csv.basic, 'csv')

  expect(result).toBeOk()
  expect(result.value.records).toHaveLength(3)
})

test('should handle format conversion', async () => {
  const processor = createMockDataProcessor()
  const parseResult = processor.parseData(dataFixtures.json.basic, 'json')
  expect(parseResult).toBeOk()

  const convertResult = processor.convertFormat(parseResult.value, 'csv')
  expect(convertResult).toBeOk()
  expect(convertResult.value).toContain('csv,header')
})
```

## Test Organization

### 1. Describe Blocks

Use descriptive names for test groups:

```typescript
describe('UserService', () => {
  describe('Authentication', () => {
    describe('with valid credentials', () => {
      test('should return authenticated user', () => {
        // Test implementation
      })
    })

    describe('with invalid credentials', () => {
      test('should return authentication error', () => {
        // Test implementation
      })
    })
  })
})
```

### 2. Test Naming

Use descriptive test names that explain the scenario:

```typescript
// ✅ Good test names
test('should return user data when authentication succeeds')
test('should throw validation error when email is invalid')
test('should retry operation when network request fails')

// ❌ Bad test names
test('authentication')
test('error handling')
test('network test')
```

### 3. Setup and Teardown

Use setup and teardown hooks appropriately:

```typescript
describe('DatabaseService', () => {
  let db: Database

  beforeEach(async () => {
    db = await createTestDatabase()
  })

  afterEach(async () => {
    await db.cleanup()
  })

  test('should save user data', async () => {
    // Test uses `db` from setup
  })
})
```

## Test Data Management

### 1. Use Fixtures

Create reusable test data:

```typescript
// fixtures.ts
export const testFixtures = {
  users: {
    valid: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    },
    invalid: {
      id: 'invalid',
      name: '',
      email: 'not-an-email',
    },
  },

  responses: {
    success: { status: 200, data: { message: 'success' } },
    error: { status: 400, error: 'Bad Request' },
  },
}
```

### 2. Generate Test Data

Use generators for dynamic test data:

```typescript
import { testDataGenerators } from '@repo/vitest-config/setup'

test('should handle multiple users', () => {
  const users = testDataGenerators.randomArray(testDataGenerators.randomUser, 10)

  const result = processUsers(users)
  expect(result).toBeOk()
})
```

## Best Practices

### 1. Test Structure

- Use the AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent
- Use descriptive names for tests and variables
- Group related tests with describe blocks

### 2. Assertions

- Use specific assertions rather than generic ones
- Test both success and failure scenarios
- Include edge cases and boundary conditions
- Verify both the result and any side effects

### 3. Mocking

- Mock external dependencies, not internal logic
- Use type-safe mocks when possible
- Reset mocks between tests
- Verify mock calls when behavior is important

### 4. Performance

- Keep tests fast and focused
- Use setup/teardown hooks for expensive operations
- Avoid unnecessary async operations
- Use performance testing for critical paths

### 5. Error Handling

- Test error scenarios explicitly
- Use Result type patterns for error handling
- Verify error messages and codes
- Test error recovery mechanisms

## Common Anti-Patterns

### ❌ Avoid These

```typescript
// Don't test implementation details
test('should call internal helper function', () => {
  const spy = vi.spyOn(module, 'internalHelper')
  publicFunction()
  expect(spy).toHaveBeenCalled()
})

// Don't write tests that are too broad
test('should work correctly', () => {
  const result = complexOperation()
  expect(result).toBeTruthy()
})

// Don't use magic numbers or strings
test('should return correct value', () => {
  expect(result).toBe(42) // What does 42 represent?
})

// Don't ignore error cases
test('should process data', () => {
  const result = processData(data)
  expect(result.value).toBeDefined()
  // Missing: what if result is an error?
})
```

### ✅ Do These Instead

```typescript
// Test public behavior
test('should return processed data for valid input', () => {
  const input = testFixtures.validData
  const result = processData(input)
  expect(result).toBeOk()
  expect(result.value).toEqual(expectedOutput)
})

// Test specific scenarios
test('should format currency with two decimal places', () => {
  const result = formatCurrency(123.456)
  expect(result).toBe('$123.46')
})

// Use descriptive constants
test('should return validation error for invalid email', () => {
  const INVALID_EMAIL = 'not-an-email'
  const result = validateEmail(INVALID_EMAIL)
  expect(result).toBeErr()
  expect(result).toHaveErrorCode('INVALID_EMAIL_FORMAT')
})

// Test both success and error cases
test('should handle valid data successfully', () => {
  const result = processData(validData)
  expect(result).toBeOk()
})

test('should return error for invalid data', () => {
  const result = processData(invalidData)
  expect(result).toBeErr()
})
```

## Integration with CI/CD

### 1. Test Scripts

Ensure consistent test scripts in package.json:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 2. Coverage Requirements

Configure coverage thresholds:

```typescript
// vitest.config.ts
export default testingProfiles.node({
  coverage: {
    enabled: true,
    threshold: 80,
    outputDirectory: 'coverage',
  },
})
```

### 3. Test Reporting

Use consistent test reporting:

```typescript
export default testingProfiles.node({
  reporters: ['verbose', 'json', 'html'],
})
```

This template provides a comprehensive foundation for writing consistent, maintainable tests across the Trailhead monorepo. Follow these patterns to ensure high-quality testing practices throughout the codebase.
